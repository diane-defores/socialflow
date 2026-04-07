<template>
  <div class="social-login">
    <div class="login-buttons">
      <Button
        icon="pi pi-facebook"
        :label="$t('facebook.connect_button', 'Sign in with Facebook')"
        class="facebook-button"
        @click="connectWithFacebook"
      />
      <Button
        icon="pi pi-twitter"
        :label="$t('twitter.connect_button')"
        class="twitter-button"
        @click="connectWithTwitter"
      />
      <Button
        icon="pi pi-google"
        :label="$t('google.connect_button', 'Sign in with Google')"
        class="google-button"
        @click="connectWithGoogle"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import { useSocialNetworksStore } from '@/stores/socialNetworks'

const store = useSocialNetworksStore()

const connectWithFacebook = async () => {
  try {
    await store.connectNetwork('facebook', 'fake-auth-code')
  } catch (error) {
    console.error('Erreur de connexion Facebook:', error)
  }
}

const connectWithTwitter = async () => {
  try {
    await store.connectNetwork('twitter', 'fake-auth-code')
  } catch (error) {
    console.error('Erreur de connexion Twitter:', error)
  }
}

const connectWithGoogle = async () => {
  try {
    await store.connectNetwork('gmail', 'fake-auth-code')
  } catch (error) {
    console.error('Erreur de connexion Google:', error)
  }
}
</script>

<style scoped>
.social-login {
  max-width: 400px;
  margin: 2rem auto;
  padding: 2rem;
  background: var(--surface-card);
  border-radius: 8px;
  box-shadow: var(--card-shadow);
}

.login-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

:deep(.facebook-button) {
  background: #1877F2;
}

:deep(.facebook-button:hover) {
  background: #1666d1;
}

:deep(.twitter-button) {
  background: #1DA1F2;
}

:deep(.twitter-button:hover) {
  background: #1a8cd8;
}

:deep(.google-button) {
  background: #DB4437;
}

:deep(.google-button:hover) {
  background: #c13b2f;
}
</style> 
