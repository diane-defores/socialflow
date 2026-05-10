<template>
  <Dialog
    v-model:visible="visible"
    :header="$t('friends_filter.dialog_title', { network: networkLabel })"
    :modal="true"
    :closable="true"
    :draggable="false"
    style="width: 28rem; max-width: 95vw"
  >
    <p class="hint">
      {{ $t('friends_filter.hint_text', { network: networkLabel }) }}
    </p>

    <!-- Add friend input -->
    <div class="add-row">
      <InputText
        v-model="newFriend"
        placeholder="Nom ou @pseudo"
        class="add-input"
        autofocus
        @keydown.enter="addFriend"
      />
      <Button
        icon="pi pi-plus"
        :disabled="!newFriend.trim()"
        :aria-label="$t('common.add')"
        @click="addFriend"
      />
    </div>

    <!-- Friends list -->
    <div
      v-if="friends.length"
      class="friends-list"
    >
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
          :aria-label="$t('common.delete')"
          @click="removeFriend(friend)"
        />
      </div>
    </div>

    <div
      v-else
      class="empty-state"
    >
      <i
        class="pi pi-users"
        style="font-size: 2rem; opacity: 0.3"
      />
      <p>{{ $t('friends_filter.empty_state') }}</p>
      <p class="hint">{{ $t('friends_filter.empty_hint') }}</p>
    </div>

    <template #footer>
      <div class="footer-note">
        <i class="pi pi-info-circle" />
        {{ $t('friends_filter.footer_note') }}
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
  patreon: 'Patreon',
  theresanaiforthat: "There's An AI For That",
  industrysocial: 'Industry Social',
  bluesky: 'Bluesky',
  mastodon: 'Mastodon',
  substack: 'Substack',
  'ko-fi': 'Ko-fi',
  buymeacoffee: 'Buy Me a Coffee',
  producthunt: 'Product Hunt',
  indiehackers: 'Indie Hackers',
  hackernews: 'Hacker News / Show HN',
  folloverse: 'Folloverse',
  'industrysocial-waitlist': 'Industry Social Waitlist',
  koru: 'Koru',
  medium: 'Medium',
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
