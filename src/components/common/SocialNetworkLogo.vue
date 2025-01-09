<template>
  <NetworkLogo 
    :domain="getDomain(network)"
    :size="size"
    :class="[`network-logo-${network}`, className]"
  />
</template>

<script setup lang="ts">
import NetworkLogo from './NetworkLogo.vue'

interface Props {
  network: 'facebook' | 'twitter' | 'linkedin' | 'reddit' | 'instagram' | 'discord'
  size?: 'small' | 'medium' | 'large'
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium',
  className: ''
})

const getDomain = (network: string): string => {
  const domains = {
    facebook: 'facebook.com',
    twitter: 'twitter.com',
    linkedin: 'linkedin.com',
    reddit: 'reddit.com',
    instagram: 'instagram.com',
    discord: 'discord.com'
  }
  return domains[network as keyof typeof domains]
}
</script>

<style scoped>
.network-logo-facebook {
  --logo-color: #1877F2;
}

.network-logo-twitter {
  --logo-color: #1DA1F2;
}

.network-logo-linkedin {
  --logo-color: #0A66C2;
}

.network-logo-reddit {
  --logo-color: #FF4500;
}

.network-logo-instagram {
  --logo-color: #E4405F;
}

.network-logo-discord {
  --logo-color: #5865F2;
}
</style> 