/**
 * Nudge logic — encourages anonymous users to create an email account.
 *
 * Schedule:
 *  - Day 1 (install): no nudge
 *  - Day 2–6: one nudge per calendar day (max 5)
 *  - After 5 dismissals: 30-day cooldown
 *  - After cooldown: cycle restarts
 *  - Once an email account exists: never nudge again
 */
import { ref, onMounted } from "vue";
import { isAuthenticated } from "@/lib/convexAuth";
import { getConvexClient } from "@/lib/convex";
import { api } from "../../convex/_generated/api";

const FIRST_LAUNCH_KEY = "sfz_first_launch";
const NUDGE_COUNT_KEY = "sfz_nudge_count";
const NUDGE_LAST_KEY = "sfz_nudge_last";
const NUDGE_PAUSED_KEY = "sfz_nudge_paused_until";

function today(): string {
  return new Date().toDateString();
}

function daysBetween(dateStr: string, now: Date): number {
  const d = new Date(dateStr);
  return Math.floor((now.getTime() - d.getTime()) / 86_400_000);
}

export function useSignupNudge() {
  const showNudge = ref(false);
  const hasEmailAccount = ref(false);

  /** Record the very first launch date (idempotent). */
  function recordFirstLaunch() {
    if (!localStorage.getItem(FIRST_LAUNCH_KEY)) {
      localStorage.setItem(FIRST_LAUNCH_KEY, today());
    }
  }

  /** Check all conditions and set showNudge accordingly. */
  async function check() {
    // Not authenticated yet → no nudge
    if (!isAuthenticated.value) return;

    // Check if user already has an email account
    try {
      const client = getConvexClient();
      hasEmailAccount.value = await client.query(api.users.hasEmail, {});
    } catch {
      // Offline or error → skip nudge
      return;
    }
    if (hasEmailAccount.value) return;

    const now = new Date();
    const firstLaunch = localStorage.getItem(FIRST_LAUNCH_KEY);

    // First launch not recorded or same day → no nudge
    if (!firstLaunch || firstLaunch === today()) return;
    // Must be at least 1 calendar day after first launch
    if (daysBetween(firstLaunch, now) < 1) return;

    // Check cooldown
    const pausedUntil = localStorage.getItem(NUDGE_PAUSED_KEY);
    if (pausedUntil) {
      if (now < new Date(pausedUntil)) return;
      // Cooldown expired → clear it and restart cycle
      localStorage.removeItem(NUDGE_PAUSED_KEY);
      localStorage.setItem(NUDGE_COUNT_KEY, "0");
    }

    // Already nudged today?
    const lastNudge = localStorage.getItem(NUDGE_LAST_KEY);
    if (lastNudge === today()) return;

    // Count < 5?
    const count = parseInt(localStorage.getItem(NUDGE_COUNT_KEY) ?? "0", 10);
    if (count >= 5) return; // shouldn't happen (paused_until set), but guard

    showNudge.value = true;
  }

  /** User tapped "Pas maintenant". */
  function dismiss() {
    showNudge.value = false;

    const count = parseInt(localStorage.getItem(NUDGE_COUNT_KEY) ?? "0", 10) + 1;
    localStorage.setItem(NUDGE_COUNT_KEY, String(count));
    localStorage.setItem(NUDGE_LAST_KEY, today());

    if (count >= 5) {
      // Pause for 10 days
      const pauseDate = new Date();
      pauseDate.setDate(pauseDate.getDate() + 10);
      localStorage.setItem(NUDGE_PAUSED_KEY, pauseDate.toISOString());
      localStorage.setItem(NUDGE_COUNT_KEY, "0");
    }
  }

  /** Account was created → close nudge forever. */
  function onAccountCreated() {
    showNudge.value = false;
    hasEmailAccount.value = true;
  }

  return {
    showNudge,
    hasEmailAccount,
    recordFirstLaunch,
    check,
    dismiss,
    onAccountCreated,
  };
}
