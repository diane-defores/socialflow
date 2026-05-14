<template>
  <div class="lock-screen">
    <section class="lock-panel">
      <div class="lock-mark">
        <i class="pi pi-lock" />
      </div>
      <h1>Session verrouillée</h1>
      <p>
        Déverrouillez SocialGlowz pour reprendre votre session. Le code PIN reste
        local à cette session et n'est pas synchronisé.
      </p>
      <p
        v-if="!hasPin"
        class="p-error"
      >
        Aucun code PIN n'est configuré pour cette session verrouillée. Pour continuer,
        reconnectez-vous.
      </p>

      <form
        class="lock-form"
        @submit.prevent="submitPin"
      >
        <Password
          v-model="pin"
          placeholder="Code PIN"
          :feedback="false"
          inputmode="numeric"
          toggle-mask
          class="w-full"
          :disabled="!hasPin"
        />
        <small
          v-if="error"
          class="p-error"
        >{{ error }}</small>
        <Button
          label="Déverrouiller"
          type="submit"
          class="w-full"
          :loading="loading"
          :disabled="!hasPin"
        />
      </form>

      <Button
        label="Retour à login"
        text
        class="w-full"
        @click="returnToLogin"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  clearSessionPin,
  hasSessionPin,
  unlockSessionWithPin,
} from '@/lib/convexAuth'

const router = useRouter()
const pin = ref('')
const error = ref('')
const loading = ref(false)
const hasPin = computed(() => hasSessionPin())

async function submitPin() {
  loading.value = true
  error.value = ''
  try {
    if (!hasSessionPin()) {
      error.value = 'Aucun code PIN configuré. Reconnectez-vous pour rétablir la session.'
      return
    }

    const unlocked = await unlockSessionWithPin(pin.value)
    if (!unlocked) {
      error.value = 'Code PIN incorrect.'
      return
    }

    await router.replace('/twitter')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Déverrouillage impossible.'
  } finally {
    loading.value = false
  }
}

async function returnToLogin() {
  clearSessionPin()
  await router.replace('/login')
}
</script>

<style scoped>
.lock-screen {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 1.5rem;
  background: var(--surface-ground);
}

.lock-panel {
  width: min(100%, 420px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  color: var(--text-color);
}

.lock-mark {
  width: 3rem;
  height: 3rem;
  border-radius: 999px;
  display: grid;
  place-items: center;
  color: var(--primary-color);
  background: var(--surface-hover);
}

.lock-panel h1 {
  margin: 0;
  font-size: 1.5rem;
}

.lock-panel p {
  margin: 0;
  text-align: center;
  color: var(--text-color-secondary);
  line-height: 1.45;
}

.lock-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
</style>
