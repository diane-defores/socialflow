<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div
        v-if="modelValue"
        class="sheet-overlay"
        @click.self="emit('update:modelValue', false)"
      >
        <div class="profile-sheet settings-sheet">
          <div class="sheet-handle" />
          <div class="sheet-header">
            <span class="sheet-title">{{ $t('common.settings') }}</span>
            <button
              class="sheet-close-btn"
              @click="emit('update:modelValue', false)"
            >
              <i class="pi pi-times" />
            </button>
          </div>

          <div class="settings-content">
            <!-- Account section -->
            <p class="settings-section-label">{{ $t('account.section_title') }}</p>

            <div class="settings-field">
              <label
                class="settings-label"
                for="settings-username"
              >
                <i class="pi pi-user" />
                {{ $t('settings.username_label') }}
              </label>
              <input
                id="settings-username"
                v-model="settingsUsername"
                class="settings-input"
                placeholder="Votre nom…"
                @blur="saveSettings"
              />
            </div>

            <!-- Has email account: show email + sign out -->
            <template v-if="nudge.hasEmailAccount.value">
              <div class="settings-field">
                <label class="settings-label">
                  <i class="pi pi-envelope" />
                  {{ $t('account.signed_in_as') }}
                </label>
                <span class="settings-email-display">{{ settingsEmail }}</span>
              </div>
              <button
                class="nudge-cta sign-out-btn"
                @click="handleSignOut"
              >
                <i class="pi pi-sign-out" />
                {{ $t('account.sign_out') }}
              </button>
            </template>

            <!-- Convex not configured: show notice instead of signup form -->
            <template v-else-if="!isConvexConfigured">
              <p class="settings-account-hint">{{ $t('account.unavailable_hint') }}</p>
            </template>

            <!-- No email account: signup form -->
            <template v-else>
              <p class="settings-account-hint">{{ $t('account.no_account_hint') }}</p>
              <form
                class="settings-signup-form"
                @submit.prevent="handleSettingsSignup"
              >
                <input
                  v-model="signupEmail"
                  type="email"
                  class="settings-input"
                  :placeholder="$t('account.email_placeholder')"
                  required
                />
                <input
                  v-model="signupPassword"
                  type="password"
                  class="settings-input"
                  :placeholder="$t('account.password_placeholder')"
                  minlength="8"
                  required
                />
                <div
                  v-if="signupError"
                  class="signup-error-card"
                >
                  <p class="nudge-error">{{ displayedSignupError }}</p>
                  <div class="signup-error-actions">
                    <button
                      type="button"
                      class="signup-error-btn"
                      @click="copySignupError"
                    >
                      <i
                        class="pi"
                        :class="signupErrorCopied ? 'pi-check' : 'pi-copy'"
                      />
                      {{ signupErrorCopied ? $t('common.copied') : $t('common.copy') }}
                    </button>
                    <button
                      v-if="signupErrorNeedsCollapse"
                      type="button"
                      class="signup-error-btn"
                      @click="signupErrorExpanded = !signupErrorExpanded"
                    >
                      {{ signupErrorExpanded ? $t('common.show_less') : $t('common.show_more') }}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  class="nudge-cta"
                  :disabled="signupLoading"
                >
                  <i
                    v-if="signupLoading"
                    class="pi pi-spin pi-spinner"
                  />
                  {{ signupLoading ? '' : $t('account.create_button') }}
                </button>
              </form>
            </template>

            <!-- Preferences section -->
            <p class="settings-section-label">{{ $t('settings.preferences') }}</p>

            <div class="settings-toggle-row">
              <span class="settings-toggle-label">
                <i class="pi pi-moon" />
                {{ $t('theme.dark_mode') }}
              </span>
              <button
                class="friends-toggle-pill"
                :class="{ enabled: themeStore.isDarkMode }"
                @click="themeStore.toggleTheme()"
              >
                <span class="toggle-thumb" />
              </button>
            </div>

            <div class="settings-toggle-row">
              <span class="settings-toggle-label">
                <i class="pi pi-palette" />
                {{ $t('theme.focus_mode') }}
              </span>
              <button
                class="friends-toggle-pill"
                :class="{ enabled: themeStore.grayscaleEnabled }"
                @click="themeStore.setGrayscale(!themeStore.grayscaleEnabled)"
              >
                <span class="toggle-thumb" />
              </button>
            </div>

            <div class="settings-toggle-row">
              <span class="settings-toggle-label">
                <i class="pi pi-mobile" />
                {{ $t('settings.haptic_feedback') }}
              </span>
              <button
                class="friends-toggle-pill"
                :class="{ enabled: hapticEnabled }"
                @click="toggleHaptic"
              >
                <span class="toggle-thumb" />
              </button>
            </div>

            <div class="settings-toggle-row">
              <span class="settings-toggle-label">
                <i class="pi pi-volume-up" />
                {{ $t('settings.tap_sound') }}
              </span>
              <button
                class="friends-toggle-pill"
                :class="{ enabled: tapSoundEnabled }"
                @click="toggleTapSound"
              >
                <span class="toggle-thumb" />
              </button>
            </div>

            <!-- Text zoom -->
            <div class="settings-toggle-row">
              <span class="settings-toggle-label">
                <i class="pi pi-search-plus" />
                {{ $t('settings.text_zoom') }}
              </span>
              <span class="text-zoom-value">{{ textZoomLevel }}%</span>
            </div>
            <input
              v-model.number="textZoomLevel"
              type="range"
              class="text-zoom-slider"
              min="75"
              max="200"
              step="25"
              @change="onTextZoomChange"
            />

            <!-- Replay onboarding -->
            <button
              class="settings-replay-btn"
              @click="replayOnboarding"
            >
              <i class="pi pi-info-circle" />
              {{ $t('onboarding.replay_button') }}
            </button>

            <!-- Backup / Restore -->
            <p class="settings-section-label">{{ $t('backup.section_title') }}</p>
            <BackupRestore />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useThemeStore } from '@/stores/theme'
import { useOnboardingStore } from '@/stores/onboarding'
import { useSignupNudge } from '@/composables/useSignupNudge'
import { signIn, signOut as convexSignOut, isConvexConfigured } from '@/lib/convexAuth'
import { useToast } from 'primevue/usetoast'
import BackupRestore from './BackupRestore.vue'

defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const { t } = useI18n()
const themeStore = useThemeStore()
const onboardingStore = useOnboardingStore()
const toast = useToast()
const nudge = useSignupNudge()

// ─── Settings state ──────────────────────────────────────────
const settingsUsername = ref(localStorage.getItem('sfz_username') ?? '')
const settingsEmail = ref(localStorage.getItem('sfz_email') ?? '')

function saveSettings() {
  localStorage.setItem('sfz_username', settingsUsername.value.trim())
  localStorage.setItem('sfz_email', settingsEmail.value.trim())
}

// ─── Signup form ─────────────────────────────────────────────
const signupEmail = ref('')
const signupPassword = ref('')
const signupError = ref('')
const signupLoading = ref(false)
const signupErrorCopied = ref(false)
const signupErrorExpanded = ref(false)
const SIGNUP_ERROR_PREVIEW_LENGTH = 180

const signupErrorNeedsCollapse = computed(() =>
  signupError.value.length > SIGNUP_ERROR_PREVIEW_LENGTH || signupError.value.includes('\n'),
)

const displayedSignupError = computed(() => {
  if (signupErrorExpanded.value || !signupErrorNeedsCollapse.value) return signupError.value
  return `${signupError.value.slice(0, SIGNUP_ERROR_PREVIEW_LENGTH).trimEnd()}…`
})

async function handleSettingsSignup() {
  signupError.value = ''
  signupErrorCopied.value = false
  signupErrorExpanded.value = false
  signupLoading.value = true
  try {
    await signIn('password', {
      email: signupEmail.value,
      password: signupPassword.value,
      flow: 'signUp',
    })
    settingsEmail.value = signupEmail.value
    localStorage.setItem('sfz_email', signupEmail.value)
    nudge.onAccountCreated()
    toast.add({ severity: 'success', summary: t('account.created_toast'), life: 3000 })
  } catch (e: unknown) {
    signupError.value = e instanceof Error ? e.message : t('account.error_generic')
  } finally {
    signupLoading.value = false
  }
}

async function copySignupError() {
  if (!signupError.value) return

  try {
    await navigator.clipboard.writeText(signupError.value)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = signupError.value
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }

  signupErrorCopied.value = true
  window.setTimeout(() => {
    signupErrorCopied.value = false
  }, 2000)
}

async function handleSignOut() {
  await convexSignOut()
  settingsEmail.value = ''
  localStorage.removeItem('sfz_email')
}

// ─── Haptic & tap sound ─────────────────────────────────────
const hapticEnabled = ref(localStorage.getItem('sfz_haptic') !== 'false')
const tapSoundEnabled = ref(localStorage.getItem('sfz_tap_sound') === 'true')

function toggleHaptic() {
  hapticEnabled.value = !hapticEnabled.value
  localStorage.setItem('sfz_haptic', String(hapticEnabled.value))
  import('@tauri-apps/api/core').then(({ invoke }) => {
    invoke('plugin:android-webview|set_haptic', { enabled: hapticEnabled.value }).catch(() => {})
  }).catch(() => {})
}

function toggleTapSound() {
  tapSoundEnabled.value = !tapSoundEnabled.value
  localStorage.setItem('sfz_tap_sound', String(tapSoundEnabled.value))
  import('@tauri-apps/api/core').then(({ invoke }) => {
    invoke('plugin:android-webview|set_tap_sound', { enabled: tapSoundEnabled.value }).catch(() => {})
  }).catch(() => {})
}

// ─── Text zoom ──────────────────────────────────────────────
const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
const textZoomLevel = ref(Number(localStorage.getItem('sfz_text_zoom') ?? '100'))

function onTextZoomChange() {
  localStorage.setItem('sfz_text_zoom', String(textZoomLevel.value))
  if (isTauri) {
    import('@tauri-apps/api/core').then(({ invoke }) => {
      invoke('set_text_zoom', { level: textZoomLevel.value }).catch(() => {})
    })
  }
}

function replayOnboarding() {
  emit('update:modelValue', false)
  onboardingStore.reset()
}
</script>

<style scoped>
/* ─── Sheet base (shared with profile sheet) ─────────────────── */

.sheet-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}

.profile-sheet {
  width: 100%;
  background: var(--surface-card);
  border-radius: 20px 20px 0 0;
  padding-bottom: env(safe-area-inset-bottom, 16px);
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sheet-handle {
  width: 2.5rem;
  height: 4px;
  background: var(--surface-border);
  border-radius: 2px;
  margin: 0.75rem auto 0;
  flex-shrink: 0;
}

.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.25rem 0.5rem;
  flex-shrink: 0;
}

.sheet-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-color);
}

.sheet-close-btn {
  background: var(--surface-ground);
  border: none;
  border-radius: 50%;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-color-secondary);
  font-size: 0.75rem;
  transition: background-color 0.12s;
}

.sheet-close-btn:active {
  background: var(--surface-hover);
}

/* ─── Settings content ───────────────────────────────────────── */

.settings-content {
  padding: 0 1.25rem 1.5rem;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--primary-color, #6366f1) transparent;
  scrollbar-gutter: stable;
}

.settings-content::-webkit-scrollbar {
  width: 6px;
  -webkit-appearance: none;
}

.settings-content::-webkit-scrollbar-track {
  background: transparent;
}

.settings-content::-webkit-scrollbar-thumb {
  background: var(--primary-color, #6366f1);
  border-radius: 3px;
  opacity: 0.6;
}

.settings-section-label {
  margin: 1rem 0 0.5rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-color-secondary);
}

.settings-field {
  margin-bottom: 0.75rem;
}

.settings-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-color-secondary);
  margin-bottom: 0.35rem;
}

.settings-label i {
  font-size: 0.85rem;
}

.settings-input {
  width: 100%;
  padding: 0.6rem 0.75rem;
  font-size: 0.9rem;
  background: var(--surface-ground);
  border: 1px solid var(--surface-border);
  border-radius: 10px;
  color: var(--text-color);
  outline: none;
  transition: border-color 0.15s;
  box-sizing: border-box;
}

.settings-input:focus {
  border-color: var(--primary-color);
}

.settings-account-hint {
  font-size: 0.82rem;
  color: var(--text-color-secondary);
  line-height: 1.45;
  margin: 0 0 0.75rem;
}

.settings-signup-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.settings-signup-form .nudge-cta,
.sign-out-btn {
  width: 100%;
  padding: 0.7rem;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--primary-color), #7c3aed);
  color: #fff;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.settings-signup-form .nudge-cta:disabled {
  opacity: 0.6;
}

.sign-out-btn {
  background: transparent;
  color: #ef4444;
  border: 1px solid #ef4444;
  margin-top: 0.5rem;
}

.signup-error-card {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding: 0.7rem 0.8rem;
  border-radius: 12px;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.18);
}

.nudge-error {
  margin: 0;
  color: #dc2626;
  font-size: 0.8rem;
  line-height: 1.45;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.signup-error-actions {
  display: flex;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.signup-error-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.6rem;
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.6);
  color: #b91c1c;
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
}

.settings-email-display {
  font-size: 0.85rem;
  color: var(--text-color);
  font-weight: 500;
}

.settings-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.65rem 0;
  border-bottom: 1px solid var(--surface-border);
}

.settings-toggle-row:last-child {
  border-bottom: none;
}

.settings-toggle-label {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-color);
}

.settings-toggle-label i {
  font-size: 1rem;
  width: 2rem;
  text-align: center;
}

.friends-toggle-pill {
  position: relative;
  width: 2.8rem;
  height: 1.6rem;
  border-radius: 1rem;
  border: none;
  background: var(--surface-border);
  cursor: pointer;
  transition: background-color 0.2s;
  flex-shrink: 0;
  padding: 0;
}

.friends-toggle-pill.enabled {
  background: var(--primary-color);
}

.toggle-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  transition: transform 0.2s;
}

.friends-toggle-pill.enabled .toggle-thumb {
  transform: translateX(1.2rem);
}

.text-zoom-value {
  font-size: 0.85rem;
  color: var(--primary-color);
  font-weight: 600;
  min-width: 3rem;
  text-align: right;
}

.text-zoom-slider {
  width: 100%;
  margin: 0 0 0.75rem;
  accent-color: var(--primary-color);
}

.settings-replay-btn {
  width: 100%;
  padding: 0.75rem 1rem;
  margin-top: 0.5rem;
  border-radius: 10px;
  border: 1px solid var(--surface-border);
  background: var(--surface-card);
  color: var(--text-color-secondary);
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  cursor: pointer;
}

.settings-replay-btn:active {
  background: var(--surface-hover);
}

/* ─── Sheet transition ───────────────────────────────────────── */

.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.25s ease;
}

.sheet-enter-active .profile-sheet,
.sheet-leave-active .profile-sheet {
  transition: transform 0.25s ease;
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}

.sheet-enter-from .profile-sheet,
.sheet-leave-to .profile-sheet {
  transform: translateY(100%);
}

@media (prefers-reduced-motion: reduce) {
  .sheet-enter-active,
  .sheet-leave-active,
  .sheet-enter-active .profile-sheet,
  .sheet-leave-active .profile-sheet,
  .friends-toggle-pill,
  .toggle-thumb {
    transition: none;
  }
}
</style>
