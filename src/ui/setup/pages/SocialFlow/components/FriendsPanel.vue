<template>
  <Dialog
    v-model:visible="visible"
    :header="`Amis — ${networkLabel}`"
    :modal="true"
    :closable="true"
    :draggable="false"
    style="width: 28rem; max-width: 95vw"
  >
    <p class="hint">
      Entrez les noms ou pseudos tels qu'ils apparaissent sur {{ networkLabel }}.
      Seuls leurs posts seront affichés quand le filtre est actif.
    </p>

    <!-- Add friend input -->
    <div class="add-row">
      <InputText
        v-model="newFriend"
        placeholder="Nom ou @pseudo"
        class="add-input"
        @keydown.enter="addFriend"
        autofocus
      />
      <Button
        icon="pi pi-plus"
        :disabled="!newFriend.trim()"
        @click="addFriend"
        aria-label="Ajouter"
      />
    </div>

    <!-- Friends list -->
    <div v-if="friends.length" class="friends-list">
      <div
        v-for="friend in friends"
        :key="friend"
        class="friend-row"
      >
        <i class="pi pi-user friend-icon" />
        <span class="friend-name">{{ friend }}</span>
        <Button
          icon="pi pi-times"
          text
          rounded
          size="small"
          severity="danger"
          @click="removeFriend(friend)"
          aria-label="Supprimer"
        />
      </div>
    </div>

    <div v-else class="empty-state">
      <i class="pi pi-users" style="font-size: 2rem; opacity: 0.3" />
      <p>Aucun ami ajouté</p>
      <p class="hint">Ajoutez des noms pour filtrer le fil</p>
    </div>

    <template #footer>
      <div class="footer-note">
        <i class="pi pi-info-circle" />
        La correspondance est insensible à la casse et partielle.
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import { useFriendsFilterStore } from '@/stores/friendsFilter'

const props = defineProps<{
  networkId: string
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const filterStore = useFriendsFilterStore()
const newFriend = ref('')

const NETWORK_LABELS: Record<string, string> = {
  twitter: 'Twitter / X',
  facebook: 'Facebook',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  threads: 'Threads',
  discord: 'Discord',
  reddit: 'Reddit',
  quora: 'Quora',
  pinterest: 'Pinterest',
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  nextdoor: 'Nextdoor',
}

const networkLabel = computed(() => NETWORK_LABELS[props.networkId] ?? props.networkId)
const friends = computed(() => filterStore.getFriends(props.networkId))

const addFriend = () => {
  if (!newFriend.value.trim()) return
  filterStore.addFriend(props.networkId, newFriend.value)
  newFriend.value = ''
}

const removeFriend = (name: string) => {
  filterStore.removeFriend(props.networkId, name)
}
</script>

<style scoped>
.hint {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
  margin: 0 0 1rem;
  line-height: 1.4;
}

.add-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.add-input {
  flex: 1;
}

.friends-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  max-height: 18rem;
  overflow-y: auto;
}

.friend-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.4rem 0.5rem;
  border-radius: 6px;
  transition: background-color 0.15s;
}

.friend-row:hover {
  background: var(--surface-hover);
}

.friend-icon {
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}

.friend-name {
  flex: 1;
  font-size: 0.95rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  color: var(--text-color-secondary);
  gap: 0.5rem;
  text-align: center;
}

.empty-state p {
  margin: 0;
}

.footer-note {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: var(--text-color-secondary);
}
</style>
