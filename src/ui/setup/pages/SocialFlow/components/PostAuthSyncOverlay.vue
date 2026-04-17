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
  position: fixed;
  inset: 0;
  z-index: 10050;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
  background:
    radial-gradient(circle at top, rgba(59, 130, 246, 0.18), transparent 42%),
    rgba(15, 23, 42, 0.42);
  backdrop-filter: blur(10px);
}

.sync-card {
  width: min(100%, 26rem);
  padding: 1.35rem 1.2rem 1.15rem;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.94));
  box-shadow: 0 28px 70px rgba(15, 23, 42, 0.22);
}

:global(html.dark) .sync-card {
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(30, 41, 59, 0.94));
  border-color: rgba(148, 163, 184, 0.2);
  box-shadow: 0 28px 70px rgba(2, 6, 23, 0.48);
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
  background: color-mix(in srgb, var(--primary-color) 14%, white 86%);
  color: var(--primary-color);
}

:global(html.dark) .sync-icon-wrap {
  background: color-mix(in srgb, var(--primary-color) 22%, rgba(15, 23, 42, 0.92) 78%);
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
  border: 1px solid var(--surface-border);
  background: color-mix(in srgb, var(--surface-card) 88%, var(--surface-ground) 12%);
  color: var(--text-color-secondary);
  font-size: 0.9rem;
  font-weight: 600;
}

.sync-step.is-current {
  border-color: color-mix(in srgb, var(--primary-color) 30%, var(--surface-border) 70%);
  background: color-mix(in srgb, var(--primary-color) 10%, var(--surface-card) 90%);
  color: var(--text-color);
}

.sync-step.is-done {
  border-color: color-mix(in srgb, var(--primary-color) 20%, var(--surface-border) 80%);
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
    align-items: flex-end;
    padding: 0.9rem;
  }

  .sync-card {
    width: 100%;
    border-radius: 24px;
    padding: 1.15rem 1rem 1rem;
  }

  .sync-title {
    font-size: 1.2rem;
  }
}
</style>
