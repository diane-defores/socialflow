<template>
  <!-- Mobile: bottom sheet -->
  <Teleport to="body">
    <Transition name="nudge-sheet">
      <div
        v-if="visible && isMobile"
        class="nudge-overlay"
        @click.self="handleDismiss"
      >
        <div class="nudge-sheet">
          <div class="nudge-handle" />
          <div class="nudge-content">
            <div class="nudge-icon">
              <i class="pi pi-gift" />
            </div>
            <h3 class="nudge-title">{{ $t('nudge.title') }}</h3>
            <p class="nudge-promo">{{ $t('nudge.promo_text') }}</p>

            <form
              class="nudge-form"
              @submit.prevent="handleSignup"
            >
              <input
                v-model="email"
                type="email"
                class="nudge-input"
                :placeholder="$t('account.email_placeholder')"
                required
              />
              <input
                v-model="password"
                type="password"
                class="nudge-input"
                :placeholder="$t('account.password_placeholder')"
                minlength="8"
                required
              />
              <div
                v-if="error"
                class="signup-error-card"
              >
                <p class="nudge-error">{{ displayedError }}</p>
                <div class="signup-error-actions">
                  <button
                    type="button"
                    class="signup-error-btn"
                    @click="copyError"
                  >
                    <i
                      class="pi"
                      :class="errorCopied ? 'pi-check' : 'pi-copy'"
                    />
                    {{ errorCopied ? $t('common.copied') : $t('common.copy') }}
                  </button>
                  <button
                    v-if="errorNeedsCollapse"
                    type="button"
                    class="signup-error-btn"
                    @click="errorExpanded = !errorExpanded"
                  >
                    {{ errorExpanded ? $t('common.show_less') : $t('common.show_more') }}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                class="nudge-cta"
                :disabled="loading"
              >
                <i
                  v-if="loading"
                  class="pi pi-spin pi-spinner"
                />
                {{ loading ? '' : $t('nudge.cta_button') }}
              </button>
            </form>

            <button
              class="nudge-dismiss"
              @click="handleDismiss"
            >
              {{ $t('nudge.dismiss') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Desktop: PrimeVue Dialog -->
  <Dialog
    v-if="!isMobile"
    v-model:visible="visible"
    class="nudge-dialog"
    :class="{ 'nudge-dialog--dark': themeStore.isDarkMode }"
    modal
    :closable="true"
    :header="$t('nudge.title')"
    :style="{ width: '420px' }"
    @hide="handleDismiss"
  >
    <div class="nudge-content nudge-desktop">
      <div class="nudge-icon">
        <i class="pi pi-gift" />
      </div>
      <p class="nudge-promo">{{ $t('nudge.promo_text') }}</p>

      <form
        class="nudge-form"
        @submit.prevent="handleSignup"
      >
        <input
          v-model="email"
          type="email"
          class="nudge-input"
          :placeholder="$t('account.email_placeholder')"
          required
        />
        <input
          v-model="password"
          type="password"
          class="nudge-input"
          :placeholder="$t('account.password_placeholder')"
          minlength="8"
          required
        />
        <div
          v-if="error"
          class="signup-error-card"
        >
          <p class="nudge-error">{{ displayedError }}</p>
          <div class="signup-error-actions">
            <button
              type="button"
              class="signup-error-btn"
              @click="copyError"
            >
              <i
                class="pi"
                :class="errorCopied ? 'pi-check' : 'pi-copy'"
              />
              {{ errorCopied ? $t('common.copied') : $t('common.copy') }}
            </button>
            <button
              v-if="errorNeedsCollapse"
              type="button"
              class="signup-error-btn"
              @click="errorExpanded = !errorExpanded"
            >
              {{ errorExpanded ? $t('common.show_less') : $t('common.show_more') }}
            </button>
          </div>
        </div>
        <button
          type="submit"
          class="nudge-cta"
          :disabled="loading"
        >
          <i
            v-if="loading"
            class="pi pi-spin pi-spinner"
          />
          {{ loading ? '' : $t('nudge.cta_button') }}
        </button>
      </form>

      <button
        class="nudge-dismiss"
        @click="handleDismiss"
      >
        {{ $t('nudge.dismiss') }}
      </button>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useI18n } from 'vue-i18n'
import { useThemeStore } from '@/stores/theme'
import { signIn } from '@/lib/convexAuth'
import { finalizePasswordSignIn } from '@/lib/cloudSync'
import { beginPostAuthSyncFeedback, resetPostAuthSyncFeedback } from '@/lib/postAuthSyncFeedback'
import Dialog from 'primevue/dialog'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'dismiss'): void
  (e: 'account-created'): void
}>()

const { t } = useI18n()
const toast = useToast()
const themeStore = useThemeStore()

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const isMobile = ref(window.innerWidth <= 768)
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const errorCopied = ref(false)
const errorExpanded = ref(false)
const ERROR_PREVIEW_LENGTH = 180

const errorNeedsCollapse = computed(() =>
  error.value.length > ERROR_PREVIEW_LENGTH || error.value.includes('\n'),
)

const displayedError = computed(() => {
  if (errorExpanded.value || !errorNeedsCollapse.value) return error.value
  return `${error.value.slice(0, ERROR_PREVIEW_LENGTH).trimEnd()}…`
})

function handleDismiss() {
  visible.value = false
  emit('dismiss')
}

async function handleSignup() {
  error.value = ''
  errorCopied.value = false
  errorExpanded.value = false
  loading.value = true
  try {
    const normalizedEmail = email.value.trim().toLowerCase()
    email.value = normalizedEmail
    beginPostAuthSyncFeedback()
    await signIn('password', {
      email: normalizedEmail,
      password: password.value,
      flow: 'signUp',
    })
    toast.add({
      severity: 'success',
      summary: t('account.created_toast'),
      life: 3000,
    })
    visible.value = false
    emit('account-created')
    await finalizePasswordSignIn({
      email: normalizedEmail,
      flow: 'signUp',
    })
  } catch (e: any) {
    resetPostAuthSyncFeedback()
    error.value = e?.message ?? t('account.error_generic')
  } finally {
    loading.value = false
  }
}

async function copyError() {
  if (!error.value) return

  try {
    await navigator.clipboard.writeText(error.value)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = error.value
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }

  errorCopied.value = true
  window.setTimeout(() => {
    errorCopied.value = false
  }, 2000)
}
</script>

<style scoped>
/* ─── Mobile bottom sheet ─── */
.nudge-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
}

.nudge-sheet {
  width: 100%;
  background: var(--surface-card, #fff);
  border-radius: 1.25rem 1.25rem 0 0;
  padding: 0.5rem 1.5rem 2rem;
  max-height: 85vh;
  overflow-y: auto;
}

.nudge-handle {
  width: 2.5rem;
  height: 0.25rem;
  background: var(--surface-border, #dee2e6);
  border-radius: 2px;
  margin: 0 auto 1rem;
}

/* ─── Shared content ─── */
.nudge-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.75rem;
}

.nudge-desktop {
  padding: 0.5rem 0 1rem;
}

.nudge-icon {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-color), #7c3aed);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 1.5rem;
}

.nudge-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-color);
}

.nudge-promo {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-color-secondary);
  line-height: 1.4;
}

.nudge-form {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  width: 100%;
  margin-top: 0.5rem;
}

.nudge-input {
  width: 100%;
  padding: 0.7rem 0.9rem;
  border-radius: 10px;
  border: 1px solid var(--surface-border, #dee2e6);
  background: var(--surface-ground, #f8f9fa);
  color: var(--text-color);
  font-size: 0.95rem;
  outline: none;
  box-sizing: border-box;
}

.nudge-input:focus {
  border-color: var(--primary-color);
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
  text-align: left;
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

.nudge-cta {
  width: 100%;
  padding: 0.75rem;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--primary-color), #7c3aed);
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.nudge-cta:disabled {
  opacity: 0.6;
}

.nudge-dismiss {
  background: none;
  border: none;
  color: var(--text-color-secondary);
  font-size: 0.85rem;
  cursor: pointer;
  padding: 0.5rem;
  margin-top: 0.25rem;
}

/* ─── Transitions ─── */
.nudge-sheet-enter-active,
.nudge-sheet-leave-active {
  transition: all 0.3s ease;
}

.nudge-sheet-enter-active .nudge-sheet,
.nudge-sheet-leave-active .nudge-sheet {
  transition: transform 0.3s ease;
}

.nudge-sheet-enter-from,
.nudge-sheet-leave-to {
  background: rgba(0, 0, 0, 0);
}

.nudge-sheet-enter-from .nudge-sheet,
.nudge-sheet-leave-to .nudge-sheet {
  transform: translateY(100%);
}

:deep(.nudge-dialog.p-dialog) {
  --nudge-dialog-bg: var(--surface-card, #fff);
  --nudge-dialog-border: color-mix(in srgb, var(--surface-border, #dee2e6) 82%, white 18%);
  --nudge-dialog-shadow: 0 16px 40px rgba(15, 23, 42, 0.18);
  border: 1px solid var(--nudge-dialog-border);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: var(--nudge-dialog-shadow);
}

:deep(.nudge-dialog .p-dialog-header),
:deep(.nudge-dialog .p-dialog-content) {
  background: var(--nudge-dialog-bg);
  color: var(--text-color);
}

:deep(.nudge-dialog .p-dialog-header) {
  padding: 1rem 1.25rem 0.5rem;
  border-bottom: 1px solid transparent;
}

:deep(.nudge-dialog .p-dialog-title) {
  color: var(--text-color);
  font-weight: 700;
}

:deep(.nudge-dialog .p-dialog-header-icon),
:deep(.nudge-dialog .p-dialog-header-close) {
  color: var(--text-color-secondary);
}

:deep(.nudge-dialog .p-dialog-content) {
  padding: 0 1.25rem 1.25rem;
}

:deep(.nudge-dialog.nudge-dialog--dark.p-dialog) {
  --nudge-dialog-bg: linear-gradient(
    180deg,
    rgba(24, 24, 27, 0.98),
    rgba(9, 9, 11, 0.96)
  );
  --nudge-dialog-border: rgba(82, 82, 91, 0.72);
  --nudge-dialog-shadow: 0 28px 70px rgba(2, 6, 23, 0.56);
}

:deep(.nudge-dialog.nudge-dialog--dark .p-dialog-header) {
  border-bottom-color: rgba(82, 82, 91, 0.42);
}

:deep(.nudge-dialog.nudge-dialog--dark .p-dialog-header-icon:hover),
:deep(.nudge-dialog.nudge-dialog--dark .p-dialog-header-close:hover) {
  background: rgba(255, 255, 255, 0.06);
}
</style>
