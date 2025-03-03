<template>
  <div class="unauthorized">
    <h1>Accès non autorisé</h1>
    <p>Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
    <Button label="Retour" @click="router.back()" />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script> 