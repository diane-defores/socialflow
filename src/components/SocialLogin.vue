<template>
  <div class="social-login">
    <Button 
      v-for="network in networks" 
      :key="network.id"
      :icon="network.icon"
      :label="`Se connecter avec ${network.name}`"
      @click="login(network.id)"
      class="mb-2 w-full"
      :class="network.class"
    />
  </div>
</template>

<script setup lang="ts">
import { Button } from 'primevue/button'
import { useSocialNetworksStore } from '@/stores/socialNetworks'

const store = useSocialNetworksStore()

const networks = [
  { 
    id: 'facebook', 
    name: 'Facebook', 
    icon: 'pi pi-facebook',
    class: 'p-button-facebook' 
  },
  { 
    id: 'twitter', 
    name: 'Twitter', 
    icon: 'pi pi-twitter',
    class: 'p-button-twitter'
  },
  { 
    id: 'instagram', 
    name: 'Instagram', 
    icon: 'pi pi-instagram',
    class: 'p-button-instagram'
  },
  { 
    id: 'linkedin', 
    name: 'LinkedIn', 
    icon: 'pi pi-linkedin',
    class: 'p-button-linkedin'
  },
  { 
    id: 'reddit', 
    name: 'Reddit', 
    icon: 'pi pi-reddit',
    class: 'p-button-reddit'
  }
]

const login = async (networkId: string) => {
  const authWindow = window.open(
    `/api/auth/${networkId}`,
    'Auth',
    'width=500,height=600,scrollbars=yes'
  )

  // Écouter le message de retour de l'authentification
  window.addEventListener('message', async (event) => {
    if (event.origin !== window.location.origin) return
    
    if (event.data.type === 'auth-callback') {
      const { authCode } = event.data
      await store.connectNetwork(networkId, authCode)
      authWindow?.close()
    }
  }, { once: true })
}
</script>

<style scoped>
.social-login {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 400px;
  margin: 0 auto;
}

:deep(.p-button) {
  justify-content: flex-start;
}

:deep(.p-button-facebook) {
  background: #1877f2;
}

:deep(.p-button-twitter) {
  background: #1da1f2;
}

:deep(.p-button-instagram) {
  background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
}

:deep(.p-button-linkedin) {
  background: #0077b5;
}

:deep(.p-button-reddit) {
  background: #ff4500;
}
</style> 