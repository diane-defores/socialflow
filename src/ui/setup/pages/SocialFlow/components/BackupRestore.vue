<template>
  <div class="backup-section">
    <div class="backup-info">
      <i class="pi pi-info-circle" />
      <p>{{ $t('backup.info_text') }}</p>
    </div>

    <div class="backup-row">
      <div class="backup-label">
        <i class="pi pi-download mr-2"></i>
        <span>{{ $t('backup.export_label') }}</span>
      </div>
      <button class="backup-btn" :disabled="busy" @click="startExport">
        <i class="pi pi-lock" />
        {{ $t('backup.export_button') }}
      </button>
    </div>

    <div class="backup-row">
      <div class="backup-label">
        <i class="pi pi-upload mr-2"></i>
        <span>{{ $t('backup.restore_label') }}</span>
      </div>
      <button class="backup-btn" :disabled="busy" @click="startImport">
        <i class="pi pi-lock-open" />
        {{ $t('backup.import_button') }}
      </button>
    </div>

    <!-- Dialog -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="dialogVisible" class="backup-dialog-overlay" @click.self="closeIfIdle">
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
                <button class="toggle-password" @click="showPassword = !showPassword">
                  <i :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'" />
                </button>
              </div>

              <div v-if="mode === 'export'" class="dialog-field">
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
                <button class="dialog-btn cancel" @click="close" :disabled="busy">{{ $t('common.cancel') }}</button>
                <button class="dialog-btn primary" @click="confirm" :disabled="busy || !canConfirm">
                  <i v-if="busy" class="pi pi-spin pi-spinner" />
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
                <button class="dialog-btn primary" @click="close">{{ $t('common.ok') }}</button>
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
              </div>

              <div v-if="mode === 'import'" class="result-instructions">
                <p class="result-instructions-title">{{ $t('backup.error_checklist_title') }}</p>
                <ul>
                  <li>{{ $t('backup.error_check_password') }}</li>
                  <li>{{ $t('backup.error_check_file') }}</li>
                  <li>{{ $t('backup.error_check_version') }}</li>
                </ul>
              </div>

              <div class="dialog-actions">
                <button class="dialog-btn cancel" @click="close">{{ $t('common.cancel') }}</button>
                <button class="dialog-btn primary" @click="retry">{{ $t('backup.try_again') }}</button>
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
import { useBackup } from '../composables/useBackup'

const { t } = useI18n()
const { exportBackup, importBackup } = useBackup()

const dialogVisible = ref(false)
const mode = ref<'export' | 'import'>('export')
const step = ref<'password' | 'success' | 'error'>('password')
const password = ref('')
const passwordConfirm = ref('')
const showPassword = ref(false)
const busy = ref(false)
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
    rawError.value = e instanceof Error ? e.message : String(e)
    step.value = 'error'
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.backup-section {
  width: 100%;
}

.backup-info {
  display: flex;
  gap: 0.6rem;
  align-items: flex-start;
  padding: 0.6rem 0.75rem;
  margin-bottom: 0.75rem;
  border-radius: 8px;
  background: rgba(59, 130, 246, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.2);
  font-size: 0.8rem;
  line-height: 1.4;
  color: var(--text-color, #333);
  opacity: 0.85;
}

.backup-info .pi-info-circle {
  color: #3b82f6;
  font-size: 1rem;
  flex-shrink: 0;
  margin-top: 0.1rem;
}

.backup-info p {
  margin: 0;
}

.backup-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
}

.backup-label {
  display: flex;
  align-items: center;
  font-weight: 500;
  gap: 0.5rem;
}

.backup-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  border: 1px solid var(--surface-border, #ddd);
  background: var(--surface-card, #fff);
  color: var(--text-color, #333);
  cursor: pointer;
  font-size: 0.85rem;
  transition: background 0.2s;
}

.backup-btn:hover:not(:disabled) {
  background: var(--surface-hover, #f5f5f5);
}

.backup-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Dialog overlay */
.backup-dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.backup-dialog {
  background: var(--surface-card, #fff);
  color: var(--text-color, #333);
  border-radius: 12px;
  padding: 1.5rem;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.backup-dialog h3 {
  margin: 0 0 0.25rem;
  font-size: 1.1rem;
}

.dialog-hint {
  margin: 0 0 1rem;
  font-size: 0.85rem;
  opacity: 0.7;
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
  opacity: 0.8;
}

.dialog-field input {
  width: 100%;
  padding: 0.5rem 2.5rem 0.5rem 0.75rem;
  border-radius: 8px;
  border: 1px solid var(--surface-border, #ddd);
  background: var(--surface-ground, #f8f8f8);
  color: var(--text-color, #333);
  font-size: 0.9rem;
  box-sizing: border-box;
}

.toggle-password {
  position: absolute;
  right: 0.5rem;
  bottom: 0.45rem;
  background: none;
  border: none;
  cursor: pointer;
  opacity: 0.5;
  color: var(--text-color, #333);
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
  background: var(--surface-ground, #f5f5f5);
  margin-bottom: 1rem;
  font-size: 0.8rem;
  word-break: break-all;
}

.result-detail .pi-file {
  color: #3b82f6;
  flex-shrink: 0;
}

.result-path {
  opacity: 0.8;
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
  background: rgba(39, 174, 96, 0.08);
  border: 1px solid rgba(39, 174, 96, 0.2);
  font-size: 0.78rem;
  margin-bottom: 1rem;
  color: #27ae60;
}

.result-message {
  text-align: center;
  font-size: 0.9rem;
  margin: 0 0 1rem;
  opacity: 0.8;
}

.result-countdown {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  font-size: 0.85rem;
  opacity: 0.7;
}

.error-box {
  padding: 0.75rem;
  border-radius: 8px;
  background: rgba(231, 76, 60, 0.08);
  border: 1px solid rgba(231, 76, 60, 0.2);
  font-size: 0.85rem;
  margin-bottom: 1rem;
  color: #c0392b;
}

.error-box p {
  margin: 0;
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
  background: var(--surface-ground, #eee);
  color: var(--text-color, #333);
}

.dialog-btn.primary {
  background: #3b82f6;
  color: #fff;
}

.dialog-btn.primary:hover:not(:disabled) {
  background: #2563eb;
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

:global(.dark) .backup-info {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.25);
}

:global(.dark) .backup-dialog {
  background: #1e1e2e;
  color: #cdd6f4;
}

:global(.dark) .dialog-field input {
  background: #313244;
  border-color: #45475a;
  color: #cdd6f4;
}

:global(.dark) .result-detail {
  background: #313244;
}

:global(.dark) .error-box {
  background: rgba(231, 76, 60, 0.12);
}

:global(.dark) .result-tip {
  background: rgba(39, 174, 96, 0.12);
}
</style>
