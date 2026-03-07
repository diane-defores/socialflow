<template>
  <img 
    :src="logoUrl" 
    :alt="`Logo ${domain}`"
    :class="['network-logo', size]"
    @error="handleError"
  />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useLogoCacheStore } from '../../stores/logoCache'

const props = defineProps<{
  domain: string
  size?: 'small' | 'medium' | 'large'
}>()

const logoUrl = ref('')
const logoStore = useLogoCacheStore()

onMounted(async () => {
  logoUrl.value = await logoStore.getLogoUrl(props.domain)
})

const handleError = () => {
  // En cas d'erreur, on peut utiliser une image par défaut
  logoUrl.value = '/default-logo.png'
}
</script>

<style scoped>
.network-logo {
  object-fit: contain;
  border-radius: 8px;
}

.small {
  width: 24px;
  height: 24px;
}

.medium {
  width: 32px;
  height: 32px;
}

.large {
  width: 48px;
  height: 48px;
}
</style> 
