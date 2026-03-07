<template>
  <Avatar 
    :image="user.avatar" 
    :size="avatarSize"
    :shape="shape"
    :class="classes"
  >
    <template #icon>
      <i class="pi pi-user"></i>
    </template>
  </Avatar>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Avatar from 'primevue/avatar'

interface User {
  username?: string
  name?: string
  network?: string
  avatar?: string
  status?: 'online' | 'offline' | 'idle' | 'busy' | string
}

const props = defineProps<{
  user: User
  size?: 'normal' | 'large' | 'xlarge'
  shape?: 'square' | 'circle'
  class?: string
}>()

const avatarSize = computed<'normal' | 'large' | 'xlarge' | undefined>(() => {
  return props.size
})

const classes = computed(() => [
  'social-avatar',
  props.class
])
</script>

<style scoped>
.social-avatar {
  background: var(--surface-ground);
}
</style> 
