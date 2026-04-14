<template>
  <div class="login-screen">
    <div class="login-card">
      <div class="login-header">
        <h1>SocialFlow</h1>
        <p>Your social media command center</p>
      </div>

      <!-- Email/password upgrade form -->
      <form
        v-if="showEmailForm"
        class="login-form"
        @submit.prevent="handleSignIn"
      >
        <InputText
          v-model="email"
          placeholder="Email"
          type="email"
          class="w-full"
        />
        <Password
          v-model="password"
          placeholder="Password"
          :feedback="false"
          class="w-full"
          toggle-mask
        />
        <small
          v-if="error"
          class="p-error"
        >{{ error }}</small>
        <Button
          :label="isSignUp ? 'Create account' : 'Sign in'"
          type="submit"
          class="w-full"
          :loading="loading"
        />
        <Button
          :label="isSignUp ? 'Already have an account?' : 'Create an account'"
          text
          class="w-full"
          @click="isSignUp = !isSignUp"
        />
      </form>

      <!-- Default: anonymous sign-in (auto) -->
      <div
        v-else
        class="login-actions"
      >
        <ProgressSpinner
          v-if="signingIn"
          style="width: 2rem; height: 2rem"
        />
        <template v-else>
          <Button
            label="Get started"
            icon="pi pi-arrow-right"
            @click="handleAnonymousSignIn"
          />
          <Button
            label="Sign in with email"
            text
            @click="showEmailForm = true"
          />
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { signIn } from '@/lib/convexAuth'
import { finalizePasswordSignIn } from '@/lib/cloudSync'

const router = useRouter()
const showEmailForm = ref(false)
const isSignUp = ref(false)
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const signingIn = ref(false)

async function handleAnonymousSignIn() {
  signingIn.value = true
  try {
    await signIn('anonymous')
    router.push('/twitter')
  } catch (e) {
    error.value = 'Connection failed. Please try again.'
  } finally {
    signingIn.value = false
  }
}

async function handleSignIn() {
  loading.value = true
  error.value = ''
  try {
    const normalizedEmail = email.value.trim().toLowerCase()
    email.value = normalizedEmail
    await signIn('password', {
      email: normalizedEmail,
      password: password.value,
      flow: isSignUp.value ? 'signUp' : 'signIn',
    })
    await finalizePasswordSignIn({ email: normalizedEmail })
  } catch (e: any) {
    error.value = e?.message ?? 'Sign in failed'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--surface-ground);
}

.login-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem;
  max-width: 480px;
  width: 100%;
}

.login-header {
  text-align: center;
}

.login-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 0.25rem;
  color: var(--text-color);
}

.login-header p {
  margin: 0;
  color: var(--text-color-secondary);
  font-size: 0.95rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
}

.login-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}
</style>
