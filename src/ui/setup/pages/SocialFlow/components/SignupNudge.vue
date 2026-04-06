<template>
  <!-- Mobile: bottom sheet -->
  <Teleport to="body">
    <Transition name="nudge-sheet">
      <div v-if="visible && isMobile" class="nudge-overlay" @click.self="handleDismiss">
        <div class="nudge-sheet">
          <div class="nudge-handle" />
          <div class="nudge-content">
            <div class="nudge-icon">
              <i class="pi pi-gift" />
            </div>
            <h3 class="nudge-title">{{ $t('nudge.title') }}</h3>
            <p class="nudge-promo">{{ $t('nudge.promo_text') }}</p>

            <form class="nudge-form" @submit.prevent="handleSignup">
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
              <small v-if="error" class="nudge-error">{{ error }}</small>
              <button type="submit" class="nudge-cta" :disabled="loading">
                <i v-if="loading" class="pi pi-spin pi-spinner" />
                {{ loading ? '' : $t('nudge.cta_button') }}
              </button>
            </form>

            <button class="nudge-dismiss" @click="handleDismiss">
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

      <form class="nudge-form" @submit.prevent="handleSignup">
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
        <small v-if="error" class="nudge-error">{{ error }}</small>
        <button type="submit" class="nudge-cta" :disabled="loading">
          <i v-if="loading" class="pi pi-spin pi-spinner" />
          {{ loading ? '' : $t('nudge.cta_button') }}
        </button>
      </form>

      <button class="nudge-dismiss" @click="handleDismiss">
        {{ $t('nudge.dismiss') }}
      </button>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useI18n } from 'vue-i18n'
import { signIn } from '@/lib/convexAuth'
import Dialog from 'primevue/dialog'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'dismiss'): void
  (e: 'account-created'): void
}>()

const { t } = useI18n()
const toast = useToast()

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const isMobile = ref(window.innerWidth <= 768)
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

function handleDismiss() {
  visible.value = false
  emit('dismiss')
}

async function handleSignup() {
  error.value = ''
  loading.value = true
  try {
    await signIn('password', {
      email: email.value,
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
  } catch (e: any) {
    error.value = e?.message ?? t('account.error_generic')
  } finally {
    loading.value = false
  }
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

.nudge-error {
  color: #ef4444;
  font-size: 0.8rem;
  text-align: left;
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
</style>
