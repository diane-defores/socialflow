<template>
  <div class="unauthorized">
    <i class="pi pi-lock unauthorized-icon" />
    <h1>Accès non autorisé</h1>
    <p>Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
    <Button label="Retour" icon="pi pi-arrow-left" @click="router.back()" />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import Button from 'primevue/button'

const router = useRouter()
</script>

<style scoped>
.unauthorized {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 1rem;
  text-align: center;
  padding: 2rem;
}

.unauthorized-icon {
  font-size: 3rem;
  color: var(--text-color-secondary);
  opacity: 0.5;
}

.unauthorized h1 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--text-color);
}

.unauthorized p {
  margin: 0;
  color: var(--text-color-secondary);
  max-width: 400px;
}
</style>