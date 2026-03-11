<template>
  <div 
    class="social-network-logo"
    :class="[size, network]"
  >
    <i :class="getIconClass"></i>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  network: 'twitter' | 'facebook' | 'instagram' | 'linkedin' | 'tiktok' | 'threads' | 'discord' | 'reddit' | 'gmail'
  size?: 'small' | 'medium' | 'large'
}>()

const getIconClass = computed(() => {
  switch (props.network) {
    case 'twitter':
      return 'pi pi-twitter'
    case 'facebook':
      return 'pi pi-facebook'
    case 'instagram':
      return 'pi pi-instagram'
    case 'linkedin':
      return 'pi pi-linkedin'
    case 'tiktok':
      return 'pi pi-tiktok'
    case 'threads':
      return 'pi pi-at'
    case 'discord':
      return 'pi pi-discord'
    case 'reddit':
      return 'pi pi-reddit'
    case 'gmail':
      return 'pi pi-envelope'
    default:
      return 'pi pi-question'
  }
})
</script>

<style scoped>
.social-network-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--surface-ground);
}

.social-network-logo.small {
  width: 2rem;
  height: 2rem;
  font-size: 1rem;
}

.social-network-logo.medium {
  width: 3rem;
  height: 3rem;
  font-size: 1.5rem;
}

.social-network-logo.large {
  width: 4rem;
  height: 4rem;
  font-size: 2rem;
}

/* Couleurs spécifiques pour chaque réseau */
.twitter {
  color: #1DA1F2;
}

.facebook {
  color: #1877F2;
}

.instagram {
  color: #E4405F;
}

.linkedin {
  color: #0A66C2;
}

.tiktok {
  color: var(--text-color);
}

.threads {
  color: var(--text-color);
}

.discord {
  color: #5865F2;
}

.reddit {
  color: #FF4500;
}

.gmail {
  color: #EA4335;
}
</style> 