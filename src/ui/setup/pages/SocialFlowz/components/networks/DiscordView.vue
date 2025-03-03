<template>
  <div class="discord-view">
    <div class="header">
      <SocialNetworkLogo 
        network="discord"
        size="small"
        class="mr-2"
      />
      <h2>Discord Channels</h2>
    </div>
    <div class="discord-content">
      <div class="servers-list">
        <div v-for="i in 5" :key="i" class="server-item">
          <Avatar 
            :image="`https://api.dicebear.com/7.x/identicon/svg?seed=server${i}`"
            shape="circle"
            size="large"
            class="server-avatar"
          />
          <div class="notification-badge">{{ Math.floor(Math.random() * 10) }}</div>
        </div>
      </div>
      <div class="channels-section">
        <div v-for="channel in channels" :key="channel.id" class="channel-item">
          <i :class="channel.icon"></i>
          <span>{{ channel.name }}</span>
          <span class="member-count">{{ channel.members }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Avatar from 'primevue/avatar'
import { SocialNetworkLogo } from '@/components/common'

const channels = ref([
  { id: 1, name: 'general', icon: 'pi pi-hashtag', members: '245' },
  { id: 2, name: 'gaming', icon: 'pi pi-hashtag', members: '123' },
  { id: 3, name: 'music', icon: 'pi pi-volume-up', members: '89' },
  { id: 4, name: 'dev-chat', icon: 'pi pi-code', members: '167' },
  { id: 5, name: 'voice-lounge', icon: 'pi pi-volume-down', members: '34' }
])
</script>

<style scoped>
.header {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0 1rem;
}

.header h2 {
  margin: 0;
}

.discord-content {
  display: flex;
  gap: 1rem;
  padding: 1rem;
}

.servers-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background: var(--surface-card);
  border-radius: 8px;
}

.server-item {
  position: relative;
  cursor: pointer;
}

.server-avatar {
  transition: border-radius 0.3s;
}

.server-item:hover .server-avatar {
  border-radius: 30% !important;
}

.notification-badge {
  position: absolute;
  bottom: 0;
  right: -5px;
  background: var(--primary-color);
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
}

.channels-section {
  flex: 1;
  background: var(--surface-card);
  border-radius: 8px;
  padding: 1rem;
}

.channel-item {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
}

.channel-item:hover {
  background: var(--surface-hover);
}

.member-count {
  margin-left: auto;
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}
</style> 