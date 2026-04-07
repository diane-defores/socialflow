<template>
  <div class="gmail-container">
    <div class="gmail-header">
      <h2>Gmail</h2>
      <div class="unread-count" v-if="store.gmail.unreadCount">
        {{ store.gmail.unreadCount }} non lu(s)
      </div>
    </div>

    <div class="gmail-content">
      <!-- Liste des emails -->
      <div class="emails-section">
        <div v-if="loading" class="loading-state">
          <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
          <p>Chargement des emails...</p>
        </div>

        <div v-else-if="!store.gmail.emails?.length" class="empty-state">
          <i class="pi pi-inbox" style="font-size: 2rem"></i>
          <p>Aucun email à afficher</p>
        </div>

        <div v-else class="emails-list">
          <div 
            v-for="email in store.gmail.emails" 
            :key="email.id" 
            class="email-item" 
            :class="{ 'unread': !email.isRead }"
            @click="openEmail(email)"
          >
            <div class="email-header">
              <SocialAvatar 
                :user="{
                  username: email.sender.name,
                  avatar: email.sender.avatar
                }" 
                size="normal" 
              />
              <span class="sender">{{ email.sender.name }}</span>
              <Button
                icon="pi pi-plus"
                text
                rounded
                v-tooltip.left="$t('gmail.add_to_kanban')"
                @click.stop="addToKanban(email)"
              />
              <span class="date">{{ formatDate(email.date) }}</span>
            </div>
            <div class="email-content">
              <h3>{{ email.subject }}</h3>
              <p>{{ email.preview }}</p>
            </div>
            <div class="email-labels" v-if="email.labels?.length">
              <span v-for="label in email.labels" :key="label" class="label">{{ label }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Kanban -->
      <div class="kanban-section">
        <KanbanBoard />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import SocialAvatar from '../feed/SocialAvatar.vue'
import KanbanBoard from '../kanban/KanbanBoard.vue'
import { formatDate } from '../../utils/dateFormatter'
import { useSocialNetworksStore } from '@/stores/socialNetworks'
import { useKanbanStore } from '@/stores/kanban'
import Button from 'primevue/button'
import type { Email } from '../../types'

const store = useSocialNetworksStore()
const kanbanStore = useKanbanStore()
const loading = ref(true)

const openEmail = (email: Email) => {
  const emailToUpdate = store.gmail.emails.find(e => e.id === email.id)
  if (emailToUpdate) {
    emailToUpdate.isRead = true
  }
}

const addToKanban = (email: Email) => {
  kanbanStore.addEmailToKanban(email)
}

onMounted(async () => {
  try {
    console.log('Chargement des emails...')
    await store.fetchGmailData()
    await kanbanStore.initialize()
    console.log('Emails chargés:', store.gmail.emails)
  } catch (error) {
    console.error('Erreur lors du chargement des emails:', error)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.gmail-container {
  height: 100%;
  padding: 1rem;
  display: flex;
  flex-direction: column;
}

.gmail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.gmail-header h2 {
  margin: 0;
}

.unread-count {
  background: var(--primary-color);
  color: white;
  padding: 0.3rem 0.8rem;
  border-radius: 1rem;
  font-size: 0.9em;
}

.gmail-content {
  display: flex;
  gap: 1rem;
  flex: 1;
  overflow: hidden;
}

.emails-section {
  flex: 1;
  overflow-y: auto;
}

.kanban-section {
  flex: 1;
  overflow: hidden;
  background: var(--surface-ground);
  border-radius: 8px;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 50vh;
  color: var(--text-color-secondary);
}

.loading-state p,
.empty-state p {
  margin-top: 1rem;
}

.emails-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.email-item {
  background: var(--surface-card);
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid var(--surface-border);
  transition: all 0.2s ease;
  cursor: pointer;
}

.email-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.email-item.unread {
  background: var(--surface-hover);
  font-weight: bold;
}

.email-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.sender {
  font-weight: bold;
  flex: 1;
}

.date {
  color: var(--text-color-secondary);
  font-size: 0.9em;
}

.email-content h3 {
  margin: 0.5rem 0;
  font-size: 1.1em;
}

.email-content p {
  margin: 0;
  color: var(--text-color-secondary);
}

.email-labels {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.label {
  background: var(--primary-color);
  color: white;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8em;
}

@media (max-width: 1024px) {
  .gmail-content {
    flex-direction: column;
  }

  .emails-section,
  .kanban-section {
    flex: none;
    height: 50vh;
  }
}
</style> 
