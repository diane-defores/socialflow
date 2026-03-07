<template>
  <div class="social-avatar" :class="sizeClass">
    <Avatar 
      :image="avatarUrl" 
      :size="avatarSize"
      :shape="shape"
      :pt="{
        root: { style: borderStyle }
      }"
      @error="handleAvatarError"
    />
    <Badge v-if="showBadge" 
      :value="badgeContent" 
      :severity="badgeSeverity"
      :pt="{
        root: { class: 'avatar-badge' }
      }"
    >
      <i v-if="badgeIcon" :class="badgeIcon"></i>
    </Badge>
    <div v-if="showStatus" :class="['status-indicator', user.status]" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import Avatar from 'primevue/avatar'
import Badge from 'primevue/badge'

interface Props {
  user: {
    username?: string
    name?: string
    network?: string
    avatar?: string
    status?: 'online' | 'offline' | 'idle' | 'busy' | string
  }
  size?: 'normal' | 'large' | 'xlarge'
  shape?: 'square' | 'circle'
  showBadge?: boolean
  badgeContent?: string | number
  badgeIcon?: string
  badgeSeverity?: 'success' | 'info' | 'warning' | 'danger'
  showStatus?: boolean
  borderColor?: string
  borderWidth?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'normal',
  shape: 'circle',
  showBadge: false,
  showStatus: false,
  borderWidth: '0px'
})

const sizeClass = computed(() => `size-${props.size}`)
const avatarSize = computed<'normal' | 'large' | 'xlarge'>(() => {
  return props.size
})

const borderStyle = computed(() => ({
  border: props.borderWidth ? `${props.borderWidth} solid ${props.borderColor || 'var(--surface-border)'}` : 'none'
}))

const fallbackAvatar = ref<string | null>(null)

const identity = computed(() => props.user.username || props.user.name || 'default')

const avatarUrl = computed(() => {
  if (fallbackAvatar.value) return fallbackAvatar.value
  if (props.user.avatar) return props.user.avatar
  
  if (identity.value && props.user.network) {
    return `https://unavatar.io/${props.user.network}/${identity.value}`
  }
  
  return `https://unavatar.io/fallback/${identity.value}`
})

const handleAvatarError = () => {
  fallbackAvatar.value = `https://api.dicebear.com/7.x/avataaars/svg?seed=${identity.value}`
}
</script>

<style scoped>
.social-avatar {
  position: relative;
  display: inline-flex;
}

.size-normal {
  --avatar-size: 2.5rem;
}

.size-large {
  --avatar-size: 3.5rem;
}

.size-xlarge {
  --avatar-size: 4.5rem;
}

:deep(.avatar-badge) {
  position: absolute;
  bottom: 0;
  right: 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  background: var(--primary-color);
  border: 2px solid var(--surface-card);
}

.status-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid var(--surface-card);
}

.status-indicator.online {
  background-color: var(--green-500);
}

.status-indicator.offline {
  background-color: var(--gray-500);
}

.status-indicator.idle {
  background-color: var(--yellow-500);
}

.status-indicator.busy {
  background-color: var(--red-500);
}
</style> 
