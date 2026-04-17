import { computed, reactive, readonly } from "vue";

export type PostAuthSyncStage =
  | "idle"
  | "waitingServer"
  | "dataReceived"
  | "dataApplied"
  | "restarting"
  | "ready";

type PostAuthSyncMode = "blocking" | "success";

const READY_NOTICE_KEY = "sfz_post_auth_ready_notice_v1";
const MIN_STAGE_MS = 720;
const READY_NOTICE_MS = 2200;

const state = reactive<{
  visible: boolean;
  mode: PostAuthSyncMode;
  stage: PostAuthSyncStage;
}>({
  visible: false,
  mode: "blocking",
  stage: "idle",
});

let stageStartedAt = 0;
let readyTimer: number | null = null;

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function clearReadyTimer() {
  if (readyTimer !== null) {
    window.clearTimeout(readyTimer);
    readyTimer = null;
  }
}

function setStage(stage: PostAuthSyncStage, mode: PostAuthSyncMode) {
  state.visible = true;
  state.mode = mode;
  state.stage = stage;
  stageStartedAt = Date.now();
}

function canAdvanceBlockingStage() {
  return state.visible && state.mode === "blocking" && state.stage !== "idle";
}

export const postAuthSyncFeedback = readonly(state);

export const isPostAuthSyncBlocking = computed(
  () => state.visible && state.mode === "blocking",
);

export function beginPostAuthSyncFeedback() {
  if (canAdvanceBlockingStage()) return;
  clearReadyTimer();
  setStage("waitingServer", "blocking");
}

export async function advancePostAuthSyncStage(
  stage: Exclude<PostAuthSyncStage, "idle" | "ready">,
) {
  if (!canAdvanceBlockingStage() || state.stage === stage) return;

  const elapsed = Date.now() - stageStartedAt;
  if (elapsed < MIN_STAGE_MS) {
    await delay(MIN_STAGE_MS - elapsed);
  }

  if (!canAdvanceBlockingStage()) return;
  setStage(stage, "blocking");
}

export function queuePostAuthReadyNotice() {
  localStorage.setItem(READY_NOTICE_KEY, "1");
}

export function showPostAuthReadyFeedback() {
  clearReadyTimer();
  setStage("ready", "success");
  readyTimer = window.setTimeout(() => {
    resetPostAuthSyncFeedback();
  }, READY_NOTICE_MS);
}

export function restorePostAuthReadyFeedback() {
  if (localStorage.getItem(READY_NOTICE_KEY) !== "1") return false;
  localStorage.removeItem(READY_NOTICE_KEY);
  showPostAuthReadyFeedback();
  return true;
}

export function resetPostAuthSyncFeedback() {
  clearReadyTimer();
  state.visible = false;
  state.mode = "blocking";
  state.stage = "idle";
  stageStartedAt = 0;
}
