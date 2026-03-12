import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useFriendsFilterStore = defineStore('friendsFilter', () => {
  /** Per-network friend names/usernames (case-insensitive match at runtime) */
  const friends = ref<Record<string, string[]>>({})
  /** Global on/off — applies to ALL webview networks */
  const enabled = ref(false)

  const getFriends = (networkId: string): string[] =>
    friends.value[networkId] ?? []

  const addFriend = (networkId: string, name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    if (!friends.value[networkId]) friends.value[networkId] = []
    if (!friends.value[networkId].includes(trimmed)) {
      friends.value[networkId] = [...friends.value[networkId], trimmed]
    }
  }

  const removeFriend = (networkId: string, name: string) => {
    friends.value[networkId] = (friends.value[networkId] ?? []).filter(f => f !== name)
  }

  const toggle = () => { enabled.value = !enabled.value }

  return { friends, enabled, getFriends, addFriend, removeFriend, toggle }
}, { persist: true })
