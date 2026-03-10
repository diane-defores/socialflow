import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useFriendsFilterStore = defineStore('friendsFilter', () => {
  /** Per-network friend names/usernames (case-insensitive match at runtime) */
  const friends = ref<Record<string, string[]>>({})
  /** Per-network enabled flag */
  const enabled = ref<Record<string, boolean>>({})

  const getFriends = (networkId: string): string[] =>
    friends.value[networkId] ?? []

  const isEnabled = (networkId: string): boolean =>
    enabled.value[networkId] ?? false

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

  const setEnabled = (networkId: string, value: boolean) => {
    enabled.value[networkId] = value
  }

  return { friends, enabled, getFriends, isEnabled, addFriend, removeFriend, setEnabled }
}, { persist: true })
