import { defineStore } from 'pinia'
import { ref } from 'vue'
import { syncSettingsPatch } from '@/lib/cloudSettings'
import { enqueueFriendsFilterSet, flushCloudSyncQueue } from '@/lib/cloudSyncQueue'

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
      syncNetworkToCloud(networkId)
    }
  }

  const removeFriend = (networkId: string, name: string) => {
    friends.value[networkId] = (friends.value[networkId] ?? []).filter(f => f !== name)
    syncNetworkToCloud(networkId)
  }

  const toggle = () => {
    enabled.value = !enabled.value
    syncSettingsPatch({ friendsFilterEnabled: enabled.value })
  }

  const replaceFromCloud = (
    cloudFilters: Array<{ networkId: string; names: string[] }>,
    cloudEnabled: boolean,
  ) => {
    const nextFriends: Record<string, string[]> = {}
    for (const filter of cloudFilters) {
      nextFriends[filter.networkId] = filter.names
    }
    friends.value = nextFriends
    enabled.value = cloudEnabled
  }

  const syncNetworkToCloud = async (networkId: string) => {
    enqueueFriendsFilterSet(networkId, friends.value[networkId] ?? [])
    await flushCloudSyncQueue()
  }

  const seedCloud = async () => {
    await syncSettingsPatch({ friendsFilterEnabled: enabled.value })
    for (const networkId of Object.keys(friends.value)) {
      await syncNetworkToCloud(networkId)
    }
    await flushCloudSyncQueue()
  }

  const clearLocal = () => {
    friends.value = {}
    enabled.value = false
  }

  return {
    friends,
    enabled,
    getFriends,
    addFriend,
    removeFriend,
    toggle,
    replaceFromCloud,
    seedCloud,
    clearLocal,
  }
}, { persist: true })
