<template>
  <Teleport to="body">
    <Transition name="sync-overlay">
      <div
        v-if="feedback.visible"
        class="sync-overlay"
        role="alertdialog"
        aria-modal="true"
        aria-live="polite"
      >
        <div
          class="sync-card"
          :class="`is-${feedback.mode}`"
        >
          <div class="sync-icon-wrap">
            <i
              class="pi sync-icon"
              :class="iconClass"
            />
          </div>

          <p class="sync-kicker">{{ t(`auth_sync.${feedback.mode}_kicker`) }}</p>
          <h2 class="sync-title">{{ t(titleKey) }}</h2>
          <p class="sync-copy">{{ t(messageKey) }}</p>

          <div class="sync-steps">
            <div
              v-for="step in steps"
              :key="step.key"
              class="sync-step"
              :class="`is-${step.status}`"
            >
              <i
                class="pi sync-step-icon"
                :class="step.icon"
              />
              <span>{{ t(step.labelKey) }}</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import {
  postAuthSyncFeedback as feedback,
  type PostAuthSyncStage,
} from "@/lib/postAuthSyncFeedback";

const { t } = useI18n();

const blockingOrder: Array<Exclude<PostAuthSyncStage, "idle" | "ready">> = [
  "waitingServer",
  "dataReceived",
  "dataApplied",
  "restarting",
];

const currentBlockingIndex = computed(() => {
  if (feedback.stage === "ready") return blockingOrder.length - 1;
  return blockingOrder.indexOf(
    feedback.stage as Exclude<PostAuthSyncStage, "idle" | "ready">,
  );
});

const titleKey = computed(() => {
  if (feedback.stage === "ready") return "auth_sync.ready_title";
  return `auth_sync.titles.${feedback.stage}`;
});

const messageKey = computed(() => {
  if (feedback.stage === "ready") return "auth_sync.ready_message";
  return `auth_sync.messages.${feedback.stage}`;
});

const iconClass = computed(() => {
  if (feedback.stage === "ready") return "pi-check-circle";
  if (feedback.stage === "restarting") return "pi-spin pi-refresh";
  return "pi-spin pi-spinner";
});

const steps = computed(() =>
  blockingOrder.map((key, index) => {
    let status: "done" | "current" | "upcoming" = "upcoming";
    if (feedback.stage === "ready" || index < currentBlockingIndex.value) {
      status = "done";
    } else if (index === currentBlockingIndex.value) {
      status = "current";
    }

    const icon =
      status === "done"
        ? "pi-check-circle"
        : status === "current"
          ? "pi-spin pi-spinner"
          : "pi-circle";

    return {
      key,
      labelKey: `auth_sync.steps.${key}`,
      status,
      icon,
    };
  }),
);
</script>

<style scoped>
.sync-overlay {
  --sync-overlay-top-gap: 1.25rem;
  --sync-overlay-bottom-gap: 1.25rem;
  --sync-backdrop-tint: rgba(59, 130, 246, 0.18);
  --sync-backdrop-base: rgba(15, 23, 42, 0.42);
  --sync-card-bg-start: rgba(255, 255, 255, 0.96);
  --sync-card-bg-end: rgba(248, 250, 252, 0.94);
  --sync-card-border: rgba(255, 255, 255, 0.58);
  --sync-card-shadow: 0 28px 70px rgba(15, 23, 42, 0.22);
  --sync-card-glow: rgba(59, 130, 246, 0.12);
  --sync-icon-bg: color-mix(in srgb, var(--primary-color) 14%, white 86%);
  --sync-step-bg: color-mix(in srgb, var(--surface-card) 88%, var(--surface-ground) 12%);
  --sync-step-done-bg: color-mix(in srgb, var(--primary-color) 6%, var(--surface-card) 94%);
  --sync-step-current-bg: color-mix(in srgb, var(--primary-color) 10%, var(--surface-card) 90%);
  --sync-step-border: var(--surface-border);
  --sync-step-current-border: color-mix(in srgb, var(--primary-color) 30%, var(--surface-border) 70%);
  --sync-step-done-border: color-mix(in srgb, var(--primary-color) 20%, var(--surface-border) 80%);
  position: fixed;
  inset: 0;
  z-index: 10050;
  display: flex;
  align-items: center;
  justify-content: center;
  padding:
    var(--sync-overlay-top-gap)
    1.25rem
    var(--sync-overlay-bottom-gap);
  background:
    radial-gradient(circle at top, var(--sync-backdrop-tint), transparent 42%),
    var(--sync-backdrop-base);
  backdrop-filter: blur(10px);
}

.sync-card {
  position: relative;
  width: min(100%, 26rem);
  max-height: min(34rem, calc(100dvh - 2.5rem));
  overflow: auto;
  overscroll-behavior: contain;
  padding: 1.35rem 1.2rem 1.15rem;
  border-radius: 24px;
  border: 1px solid var(--sync-card-border);
  background:
    radial-gradient(circle at top right, var(--sync-card-glow), transparent 42%),
    linear-gradient(180deg, var(--sync-card-bg-start), var(--sync-card-bg-end));
  box-shadow: var(--sync-card-shadow);
  color: var(--text-color);
}

:global(html.dark) .sync-overlay,
:global(.dark) .sync-overlay {
  --sync-backdrop-tint: rgba(91, 168, 245, 0.22);
  --sync-backdrop-base: rgba(2, 6, 23, 0.68);
  --sync-card-bg-start: rgba(24, 24, 27, 0.96);
  --sync-card-bg-end: rgba(9, 9, 11, 0.94);
  --sync-card-border: rgba(82, 82, 91, 0.76);
  --sync-card-shadow: 0 28px 70px rgba(2, 6, 23, 0.56);
  --sync-card-glow: rgba(91, 168, 245, 0.16);
  --sync-icon-bg: color-mix(in srgb, var(--primary-color) 22%, rgba(9, 9, 11, 0.94) 78%);
  --sync-step-bg: color-mix(in srgb, var(--surface-card) 84%, rgba(255, 255, 255, 0.02) 16%);
  --sync-step-done-bg: color-mix(in srgb, var(--primary-color) 10%, var(--surface-card) 90%);
  --sync-step-current-bg: color-mix(in srgb, var(--primary-color) 14%, var(--surface-card) 86%);
  --sync-step-border: color-mix(in srgb, var(--surface-border) 88%, rgba(255, 255, 255, 0.03) 12%);
  --sync-step-current-border: color-mix(in srgb, var(--primary-color) 38%, var(--surface-border) 62%);
  --sync-step-done-border: color-mix(in srgb, var(--primary-color) 26%, var(--surface-border) 74%);
}

.sync-card.is-success {
  border-color: color-mix(in srgb, var(--primary-color) 24%, rgba(255, 255, 255, 0.1));
}

.sync-icon-wrap {
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  margin-bottom: 0.9rem;
  background: var(--sync-icon-bg);
  color: var(--primary-color);
}

.sync-icon {
  font-size: 1.3rem;
}

.sync-kicker {
  margin: 0 0 0.35rem;
  color: var(--primary-color);
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.sync-title {
  margin: 0;
  color: var(--text-color);
  font-size: 1.35rem;
  line-height: 1.15;
}

.sync-copy {
  margin: 0.55rem 0 1rem;
  color: var(--text-color-secondary);
  font-size: 0.92rem;
  line-height: 1.5;
}

.sync-steps {
  display: grid;
  gap: 0.55rem;
}

.sync-step {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.72rem 0.8rem;
  border-radius: 14px;
  border: 1px solid var(--sync-step-border);
  background: var(--sync-step-bg);
  color: var(--text-color-secondary);
  font-size: 0.9rem;
  font-weight: 600;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.sync-step.is-current {
  border-color: var(--sync-step-current-border);
  background: var(--sync-step-current-bg);
  color: var(--text-color);
}

.sync-step.is-done {
  border-color: var(--sync-step-done-border);
  background: var(--sync-step-done-bg);
  color: var(--text-color);
}

.sync-step-icon {
  font-size: 1rem;
  color: var(--primary-color);
}

.sync-overlay-enter-active,
.sync-overlay-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}

.sync-overlay-enter-from,
.sync-overlay-leave-to {
  opacity: 0;
}

.sync-overlay-enter-from .sync-card,
.sync-overlay-leave-to .sync-card {
  transform: translateY(10px) scale(0.98);
}

@media (max-width: 640px) {
  .sync-overlay {
    --sync-overlay-top-gap: max(1rem, env(safe-area-inset-top));
    --sync-overlay-bottom-gap: max(4.75rem, calc(env(safe-area-inset-bottom) + 1rem));
    align-items: center;
    padding-inline: 0.9rem;
  }

  .sync-card {
    width: 100%;
    max-height: calc(
      100dvh
      - var(--sync-overlay-top-gap)
      - var(--sync-overlay-bottom-gap)
      - 1.5rem
    );
    border-radius: 24px;
    padding: 1.15rem 1rem 1rem;
  }

  .sync-title {
    font-size: 1.2rem;
  }
}
</style>
