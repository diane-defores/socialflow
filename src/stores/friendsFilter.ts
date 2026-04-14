import { defineStore } from 'pinia'
import { ref } from 'vue'
import { syncSettingsPatch } from '@/lib/cloudSettings'
import { getConvexClient } from '@/lib/convex'
import { api } from '../../convex/_generated/api'

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
    friends.value = Object.fromEntries(
      cloudFilters.map((filter) => [filter.networkId, filter.names]),
    )
    enabled.value = cloudEnabled
  }

  const syncNetworkToCloud = async (networkId: string) => {
    try {
      const client = getConvexClient()
      await client.mutation(api.friendsFilters.setNetwork, {
        networkId,
        names: friends.value[networkId] ?? [],
      })
    } catch {
      // Offline or unauthenticated.
    }
  }

  const seedCloud = async () => {
    await syncSettingsPatch({ friendsFilterEnabled: enabled.value })
    for (const networkId of Object.keys(friends.value)) {
      await syncNetworkToCloud(networkId)
    }
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
