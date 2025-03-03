<template>
  <Avatar 
    :image="user.avatar" 
    :size="size"
    :shape="shape"
    :class="classes"
  >
    <template #icon>
      <i class="pi pi-user"></i>
    </template>
  </Avatar>
</template>

<script setup lang="ts">
import Avatar from 'primevue/avatar'

interface User {
  username: string
  avatar?: string
}

const props = defineProps<{
  user: User
  size?: 'normal' | 'large' | 'xlarge'
  shape?: 'square' | 'circle'
  class?: string
}>()

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