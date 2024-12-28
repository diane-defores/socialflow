<template>
  <div class="flex align-items-center justify-content-center min-h-screen">
    <div class="surface-card p-4 shadow-2 border-round w-full max-w-30rem">
      <h1 class="text-center mb-4">Connexion</h1>
      <div class="flex flex-column gap-3">
        <span class="p-float-label">
          <InputText id="username" v-model="username" class="w-full" />
          <label for="username">Nom d'utilisateur</label>
        </span>
        
        <span class="p-float-label">
          <Password id="password" v-model="password" :feedback="false" class="w-full" />
          <label for="password">Mot de passe</label>
        </span>

        <Button label="Se connecter" @click="login" class="w-full" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import Password from 'primevue/password'
import InputText from 'primevue/inputtext'

const router = useRouter()
const authStore = useAuthStore()
const username = ref('')
const password = ref('')

const login = () => {
  authStore.login(username.value, password.value)
  router.push('/twitter')
}
</script>

<style scoped>
.login-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 1rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 100%;
  max-width: 300px;
}
</style> 