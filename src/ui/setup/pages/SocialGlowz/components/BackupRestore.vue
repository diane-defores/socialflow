<template>
  <div
    class="backup-section"
    :class="{ 'is-dark': themeStore.isDarkMode }"
  >
    <div
      v-if="showInfo"
      class="backup-info"
    >
      <i class="pi pi-info-circle" />
      <p>{{ $t('backup.info_text') }}</p>
    </div>

    <div class="backup-actions">
      <button
        class="backup-btn"
        :disabled="busy"
        @click="startExport"
      >
        <i class="pi pi-lock" />
        {{ $t('backup.export_button') }}
      </button>
      <button
        class="backup-btn"
        :disabled="busy"
        @click="startImport"
      >
        <i class="pi pi-lock-open" />
        {{ $t('backup.import_button') }}
      </button>
    </div>

    <!-- Dialog -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="dialogVisible"
          class="backup-dialog-overlay"
          :class="{ 'is-dark': themeStore.isDarkMode }"
          @click.self="closeIfIdle"
        >
          <div class="backup-dialog">
            <!-- ───── Step 1: Password ───── -->
            <template v-if="step === 'password'">
              <h3>{{ dialogTitle }}</h3>
              <p class="dialog-hint">{{ dialogHint }}</p>

              <div class="dialog-field">
                <label>{{ $t('backup.password_label') }}</label>
                <input
                  ref="passwordInput"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  :placeholder="$t('backup.password_placeholder')"
                  autocomplete="off"
                  @keyup.enter="confirm"
                />
                <button
                  class="toggle-password"
                  @click="showPassword = !showPassword"
                >
                  <i :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'" />
                </button>
              </div>

              <div
                v-if="mode === 'export'"
                class="dialog-field"
              >
                <label>{{ $t('backup.confirm_password_label') }}</label>
                <input
                  v-model="passwordConfirm"
                  :type="showPassword ? 'text' : 'password'"
                  :placeholder="$t('backup.confirm_password_placeholder')"
                  autocomplete="off"
                  @keyup.enter="confirm"
                />
              </div>

              <div class="dialog-actions">
                <button
                  class="dialog-btn cancel"
                  :disabled="busy"
                  @click="close"
                >
                  {{ $t('common.cancel') }}
                </button>
                <button
                  class="dialog-btn primary"
                  :disabled="busy || !canConfirm"
                  @click="confirm"
                >
                  <i
                    v-if="busy"
                    class="pi pi-spin pi-spinner"
                  />
                  {{ busy ? $t('common.loading') : (mode === 'export' ? $t('backup.export_button') : $t('backup.import_button')) }}
                </button>
              </div>
            </template>

            <!-- ───── Step 2: Result — Success ───── -->
            <template v-else-if="step === 'success'">
              <div class="result-icon result-success">
                <i class="pi pi-check-circle" />
              </div>

              <h3 class="result-title">
                {{ mode === 'export' ? $t('backup.export_done_title') : $t('backup.import_done_title') }}
              </h3>

              <!-- Export success details -->
              <template v-if="mode === 'export'">
                <div class="result-detail">
                  <i class="pi pi-file" />
                  <span class="result-path">{{ friendlyPath }}</span>
                </div>
                <div class="result-instructions">
                  <p class="result-instructions-title">{{ $t('backup.export_next_title') }}</p>
                  <ol>
                    <li>{{ $t('backup.export_step_1') }}</li>
                    <li>{{ $t('backup.export_step_2') }}</li>
                    <li>{{ $t('backup.export_step_3') }}</li>
                  </ol>
                </div>
                <div class="result-tip">
                  <i class="pi pi-shield" />
                  <span>{{ $t('backup.export_tip') }}</span>
                </div>
              </template>

              <!-- Import success details -->
              <template v-else>
                <p class="result-message">{{ $t('backup.import_done_message') }}</p>
                <div class="result-countdown">
                  <i class="pi pi-spin pi-spinner" />
                  <span>{{ $t('backup.import_reloading', { seconds: countdown }) }}</span>
                </div>
              </template>

              <div class="dialog-actions">
                <button
                  class="dialog-btn primary"
                  @click="close"
                >
                  {{ $t('common.ok') }}
                </button>
              </div>
            </template>

            <!-- ───── Step 2: Result — Error ───── -->
            <template v-else-if="step === 'error'">
              <div class="result-icon result-error">
                <i class="pi pi-times-circle" />
              </div>

              <h3 class="result-title result-title-error">
                {{ mode === 'export' ? $t('backup.export_error_title') : $t('backup.import_error_title') }}
              </h3>

              <div class="error-box">
                <p>{{ friendlyError }}</p>
                <button
                  class="copy-error-btn"
                  @click="copyError"
                >
                  <i :class="copied ? 'pi pi-check' : 'pi pi-copy'" />
                  {{ copied ? $t('common.copied') : $t('common.copy') }}
                </button>
              </div>

              <div
                v-if="mode === 'import'"
                class="result-instructions"
              >
                <p class="result-instructions-title">{{ $t('backup.error_checklist_title') }}</p>
                <ul>
                  <li>{{ $t('backup.error_check_password') }}</li>
                  <li>{{ $t('backup.error_check_file') }}</li>
                  <li>{{ $t('backup.error_check_version') }}</li>
                </ul>
              </div>

              <div class="dialog-actions">
                <button
                  class="dialog-btn cancel"
                  @click="close"
                >
                  {{ $t('common.cancel') }}
                </button>
                <button
                  class="dialog-btn primary"
                  @click="retry"
                >
                  {{ $t('backup.try_again') }}
                </button>
              </div>
            </template>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useThemeStore } from '@/stores/theme'
import { useBackup } from '../composables/useBackup'

withDefaults(defineProps<{
  showInfo?: boolean
}>(), {
  showInfo: true,
})

const { t } = useI18n()
const { exportBackup, importBackup } = useBackup()
const themeStore = useThemeStore()

const dialogVisible = ref(false)
const mode = ref<'export' | 'import'>('export')
const step = ref<'password' | 'success' | 'error'>('password')
const password = ref('')
const passwordConfirm = ref('')
const showPassword = ref(false)
const busy = ref(false)
const copied = ref(false)
const rawError = ref('')
const resultPath = ref('')
const countdown = ref(3)
const passwordInput = ref<HTMLInputElement | null>(null)

let countdownTimer: ReturnType<typeof setInterval> | null = null

const dialogTitle = computed(() =>
  mode.value === 'export' ? t('backup.export_label') : t('backup.restore_label'),
)
const dialogHint = computed(() =>
  mode.value === 'export' ? t('backup.export_hint') : t('backup.import_hint'),
)
const canConfirm = computed(() => {
  if (password.value.length < 8) return false
  if (mode.value === 'export' && password.value !== passwordConfirm.value) return false
  return true
})

const friendlyError = computed(() => {
  const msg = rawError.value
  if (msg.includes('Mot de passe incorrect') || msg.includes('incorrect') || msg.includes('corrupted'))
    return t('backup.error_wrong_password')
  if (msg.includes('No file selected'))
    return t('backup.error_no_file')
  if (msg.includes('missing stores'))
    return t('backup.error_invalid_file')
  return msg
})

const friendlyPath = computed(() => {
  const p = resultPath.value
  if (p.startsWith('content://')) return t('backup.export_saved_to_downloads')
  if (p.startsWith('Download/')) return p  // Show actual path: Download/SocialGlowz/filename.sfbak
  if (p.startsWith('backups/')) return t('backup.export_saved_to_downloads')
  return p
})

function resetDialog() {
  password.value = ''
  passwordConfirm.value = ''
  showPassword.value = false
  rawError.value = ''
  resultPath.value = ''
  busy.value = false
  step.value = 'password'
  countdown.value = 3
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null }
}

function startExport() {
  mode.value = 'export'
  resetDialog()
  dialogVisible.value = true
  nextTick(() => passwordInput.value?.focus())
}

function startImport() {
  mode.value = 'import'
  resetDialog()
  dialogVisible.value = true
  nextTick(() => passwordInput.value?.focus())
}

function close() {
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null }
  dialogVisible.value = false
}

function closeIfIdle() {
  if (!busy.value) close()
}

function retry() {
  step.value = 'password'
  rawError.value = ''
  busy.value = false
  password.value = ''
  passwordConfirm.value = ''
  nextTick(() => passwordInput.value?.focus())
}

async function copyError() {
  try {
    await navigator.clipboard.writeText(rawError.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = rawError.value
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
}

function startCountdown() {
  countdown.value = 3
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      if (countdownTimer) clearInterval(countdownTimer)
      window.location.reload()
    }
  }, 1000)
}

async function confirm() {
  if (!canConfirm.value || busy.value) return
  rawError.value = ''
  busy.value = true

  try {
    if (mode.value === 'export') {
      resultPath.value = await exportBackup(password.value)
      step.value = 'success'
    } else {
      await importBackup(password.value)
      step.value = 'success'
      startCountdown()
    }
  } catch (e: unknown) {
    if (e instanceof Error) {
      rawError.value = e.message
    } else if (e && typeof e === 'object' && 'message' in e) {
      rawError.value = String((e as { message: unknown }).message)
    } else {
      rawError.value = String(e)
    }
    step.value = 'error'
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.backup-section {
  --backup-info-bg: rgba(59, 130, 246, 0.08);
  --backup-info-border: rgba(59, 130, 246, 0.2);
  --backup-info-text: var(--text-color, #333);
  --backup-info-icon: #3b82f6;
  --backup-btn-bg: var(--surface-card, #fff);
  --backup-btn-border: var(--surface-border, #ddd);
  --backup-btn-text: var(--text-color, #333);
  --backup-btn-hover: var(--surface-hover, #f5f5f5);
  width: 100%;
}

.backup-dialog-overlay {
  --backup-overlay-bg: rgba(0, 0, 0, 0.5);
  --backup-dialog-bg: var(--surface-card, #fff);
  --backup-dialog-border: color-mix(in srgb, var(--surface-border, #ddd) 82%, white 18%);
  --backup-dialog-text: var(--text-color, #333);
  --backup-dialog-muted: color-mix(in srgb, var(--text-color, #333) 72%, transparent);
  --backup-dialog-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  --backup-input-bg: var(--surface-ground, #f8f8f8);
  --backup-input-border: var(--surface-border, #ddd);
  --backup-input-text: var(--text-color, #333);
  --backup-input-placeholder: color-mix(in srgb, var(--text-color-secondary, #666) 78%, transparent);
  --backup-result-detail-bg: var(--surface-ground, #f5f5f5);
  --backup-result-detail-text: var(--text-color, #333);
  --backup-result-tip-bg: rgba(39, 174, 96, 0.08);
  --backup-result-tip-border: rgba(39, 174, 96, 0.2);
  --backup-result-tip-text: #27ae60;
  --backup-result-message: color-mix(in srgb, var(--text-color, #333) 82%, transparent);
  --backup-result-countdown: color-mix(in srgb, var(--text-color, #333) 72%, transparent);
  --backup-error-bg: rgba(231, 76, 60, 0.08);
  --backup-error-border: rgba(231, 76, 60, 0.2);
  --backup-error-text: #c0392b;
  --backup-copy-btn-border: rgba(231, 76, 60, 0.3);
  --backup-copy-btn-text: #c0392b;
  --backup-copy-btn-hover: rgba(231, 76, 60, 0.08);
  --backup-cancel-bg: var(--surface-ground, #eee);
  --backup-cancel-text: var(--text-color, #333);
  --backup-primary-bg: #3b82f6;
  --backup-primary-bg-hover: #2563eb;
  --backup-primary-text: #fff;
  --backup-toggle-color: color-mix(in srgb, var(--text-color, #333) 62%, transparent);
  position: fixed;
  width: 100%;
}

.backup-section.is-dark,
.backup-dialog-overlay.is-dark {
  --backup-info-bg: rgba(91, 168, 245, 0.12);
  --backup-info-border: rgba(91, 168, 245, 0.28);
  --backup-info-text: #d4d4d8;
  --backup-info-icon: #93c5fd;
  --backup-btn-bg: color-mix(in srgb, var(--surface-card, #18181b) 92%, rgba(91, 168, 245, 0.08) 8%);
  --backup-btn-border: color-mix(in srgb, var(--surface-border, #27272a) 80%, var(--primary-color) 20%);
  --backup-btn-text: #e4e4e7;
  --backup-btn-hover: color-mix(in srgb, var(--surface-card, #18181b) 80%, var(--primary-color) 20%);
  --backup-overlay-bg: rgba(2, 6, 23, 0.76);
  --backup-dialog-bg: linear-gradient(
    180deg,
    rgba(24, 24, 27, 0.98),
    rgba(9, 9, 11, 0.96)
  );
  --backup-dialog-border: rgba(82, 82, 91, 0.72);
  --backup-dialog-text: #e4e4e7;
  --backup-dialog-muted: #a1a1aa;
  --backup-dialog-shadow: 0 28px 70px rgba(2, 6, 23, 0.56);
  --backup-input-bg: color-mix(in srgb, var(--surface-card, #18181b) 84%, rgba(255, 255, 255, 0.04) 16%);
  --backup-input-border: color-mix(in srgb, var(--surface-border, #27272a) 84%, rgba(255, 255, 255, 0.02) 16%);
  --backup-input-text: #f4f4f5;
  --backup-input-placeholder: #71717a;
  --backup-result-detail-bg: color-mix(in srgb, var(--surface-card, #18181b) 88%, rgba(255, 255, 255, 0.04) 12%);
  --backup-result-detail-text: #d4d4d8;
  --backup-result-tip-bg: rgba(22, 101, 52, 0.24);
  --backup-result-tip-border: rgba(74, 222, 128, 0.22);
  --backup-result-tip-text: #86efac;
  --backup-result-message: #d4d4d8;
  --backup-result-countdown: #a1a1aa;
  --backup-error-bg: rgba(127, 29, 29, 0.28);
  --backup-error-border: rgba(248, 113, 113, 0.24);
  --backup-error-text: #fecaca;
  --backup-copy-btn-border: rgba(248, 113, 113, 0.26);
  --backup-copy-btn-text: #fca5a5;
  --backup-copy-btn-hover: rgba(248, 113, 113, 0.14);
  --backup-cancel-bg: color-mix(in srgb, var(--surface-card, #18181b) 88%, rgba(255, 255, 255, 0.04) 12%);
  --backup-cancel-text: #e4e4e7;
  --backup-primary-bg: #5BA8F5;
  --backup-primary-bg-hover: #3b82f6;
  --backup-primary-text: #020617;
  --backup-toggle-color: #a1a1aa;
}

.backup-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.6rem;
}

.backup-info {
  display: flex;
  gap: 0.6rem;
  align-items: flex-start;
  padding: 0.6rem 0.75rem;
  margin-bottom: 0.75rem;
  border-radius: 8px;
  background: var(--backup-info-bg);
  border: 1px solid var(--backup-info-border);
  font-size: 0.8rem;
  line-height: 1.4;
  color: var(--backup-info-text);
  opacity: 0.85;
}

.backup-info .pi-info-circle {
  color: var(--backup-info-icon);
  font-size: 1rem;
  flex-shrink: 0;
  margin-top: 0.1rem;
}

.backup-info p {
  margin: 0;
}

.backup-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  width: 100%;
  padding: 0.65rem 0.8rem;
  border-radius: 10px;
  border: 1px solid var(--backup-btn-border);
  background: var(--backup-btn-bg);
  color: var(--backup-btn-text);
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: background 0.2s, border-color 0.2s, color 0.2s;
}

.backup-btn:hover:not(:disabled) {
  background: var(--backup-btn-hover);
}

.backup-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Dialog overlay */
.backup-dialog-overlay {
  inset: 0;
  z-index: 10000;
  background: var(--backup-overlay-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  backdrop-filter: blur(10px);
}

.backup-dialog {
  background: var(--backup-dialog-bg);
  color: var(--backup-dialog-text);
  border-radius: 12px;
  padding: 1.5rem;
  width: 100%;
  max-width: 420px;
  box-shadow: var(--backup-dialog-shadow);
  border: 1px solid var(--backup-dialog-border);
}

.backup-dialog h3 {
  margin: 0 0 0.25rem;
  font-size: 1.1rem;
}

.dialog-hint {
  margin: 0 0 1rem;
  font-size: 0.85rem;
  color: var(--backup-dialog-muted);
}

.dialog-field {
  position: relative;
  margin-bottom: 0.75rem;
}

.dialog-field label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: var(--backup-dialog-muted);
}

.dialog-field input {
  width: 100%;
  padding: 0.5rem 2.5rem 0.5rem 0.75rem;
  border-radius: 8px;
  border: 1px solid var(--backup-input-border);
  background: var(--backup-input-bg);
  color: var(--backup-input-text);
  font-size: 0.9rem;
  box-sizing: border-box;
}

.dialog-field input::placeholder {
  color: var(--backup-input-placeholder);
}

.toggle-password {
  position: absolute;
  right: 0.5rem;
  bottom: 0.45rem;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--backup-toggle-color);
}

/* ─── Result screens ─── */
.result-icon {
  text-align: center;
  margin-bottom: 0.75rem;
}

.result-icon i {
  font-size: 3rem;
}

.result-success i {
  color: #27ae60;
}

.result-error i {
  color: #e74c3c;
}

.result-title {
  text-align: center;
  margin: 0 0 1rem;
  font-size: 1.15rem;
}

.result-title-error {
  color: #e74c3c;
}

.result-detail {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.75rem;
  border-radius: 8px;
  background: var(--backup-result-detail-bg);
  margin-bottom: 1rem;
  font-size: 0.8rem;
  word-break: break-all;
  color: var(--backup-result-detail-text);
}

.result-detail .pi-file {
  color: #3b82f6;
  flex-shrink: 0;
}

.result-path {
  color: var(--backup-result-detail-text);
  opacity: 0.88;
}

.result-instructions {
  margin-bottom: 1rem;
  font-size: 0.82rem;
  line-height: 1.5;
}

.result-instructions-title {
  font-weight: 600;
  margin: 0 0 0.4rem;
  font-size: 0.85rem;
}

.result-instructions ol,
.result-instructions ul {
  margin: 0;
  padding-left: 1.2rem;
}

.result-instructions li {
  margin-bottom: 0.25rem;
}

.result-tip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  background: var(--backup-result-tip-bg);
  border: 1px solid var(--backup-result-tip-border);
  font-size: 0.78rem;
  margin-bottom: 1rem;
  color: var(--backup-result-tip-text);
}

.result-message {
  text-align: center;
  font-size: 0.9rem;
  margin: 0 0 1rem;
  color: var(--backup-result-message);
}

.result-countdown {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  font-size: 0.85rem;
  color: var(--backup-result-countdown);
}

.error-box {
  padding: 0.75rem;
  border-radius: 8px;
  background: var(--backup-error-bg);
  border: 1px solid var(--backup-error-border);
  font-size: 0.85rem;
  margin-bottom: 1rem;
  color: var(--backup-error-text);
}

.error-box p {
  margin: 0;
}

.copy-error-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  margin-top: 0.5rem;
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  border: 1px solid var(--backup-copy-btn-border);
  background: transparent;
  color: var(--backup-copy-btn-text);
  font-size: 0.78rem;
  cursor: pointer;
  transition: background 0.15s;
}

.copy-error-btn:hover {
  background: var(--backup-copy-btn-hover);
}

/* ─── Actions ─── */
.dialog-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 1rem;
}

.dialog-btn {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: opacity 0.2s;
}

.dialog-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dialog-btn.cancel {
  background: var(--backup-cancel-bg);
  color: var(--backup-cancel-text);
}

.dialog-btn.primary {
  background: var(--backup-primary-bg);
  color: var(--backup-primary-text);
}

.dialog-btn.primary:hover:not(:disabled) {
  background: var(--backup-primary-bg-hover);
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

</style>
