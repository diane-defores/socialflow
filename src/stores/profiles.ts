import { defineStore } from 'pinia'
import { getConvexClient } from '@/lib/convex'
import { syncSettingsPatch } from '@/lib/cloudSettings'
import { api } from '../../convex/_generated/api'

export interface Profile {
  id: string
  name: string
  emoji: string
  avatar?: string   // base64 data URL or remote URL
  hiddenNetworks?: string[]  // network IDs hidden for this profile (e.g. ['tiktok', 'discord'])
  createdAt: number
}

const DEFAULT_EMOJIS = ['🟦', '🟥', '🟩', '🟨', '🟪', '🟧', '⬛', '🔵']

export const useProfilesStore = defineStore('profiles', {
  state: () => ({
    profiles: [] as Profile[],
    activeProfileId: '' as string,
  }),

  getters: {
    activeProfile: (state): Profile | undefined =>
      state.profiles.find((p) => p.id === state.activeProfileId),
  },

  actions: {
    /** Add a new profile and make it active. */
    add(name: string): Profile {
      const emoji = DEFAULT_EMOJIS[this.profiles.length % DEFAULT_EMOJIS.length]
      const profile: Profile = {
        id: crypto.randomUUID(),
        name,
        emoji,
        createdAt: Date.now(),
      }
      this.profiles.push(profile)
      this.activeProfileId = profile.id
      this.syncProfileToCloud(profile)
      this.syncActiveProfileToCloud(profile.id)
      return profile
    },

    /** Remove a profile; switch to another if it was active. */
    remove(profileId: string) {
      const idx = this.profiles.findIndex((p) => p.id === profileId)
      if (idx === -1) return
      this.profiles.splice(idx, 1)
      if (this.activeProfileId === profileId) {
        this.activeProfileId = this.profiles[0]?.id ?? ''
        this.syncActiveProfileToCloud(this.activeProfileId || undefined)
      }
      this.removeProfileFromCloud(profileId)
    },

    /** Rename a profile. */
    rename(profileId: string, name: string) {
      const profile = this.profiles.find((p) => p.id === profileId)
      if (profile) {
        profile.name = name
        this.syncProfileToCloud(profile)
      }
    },

    /** Set or clear a profile avatar (base64 data URL). */
    setAvatar(profileId: string, avatar: string | undefined) {
      const profile = this.profiles.find((p) => p.id === profileId)
      if (profile) {
        profile.avatar = avatar
        this.syncProfileToCloud(profile)
      }
    },

    /** Switch the active profile. */
    setActive(profileId: string) {
      this.activeProfileId = profileId
      this.syncActiveProfileToCloud(profileId)
    },

    /** Toggle a network's visibility for a profile. */
    toggleNetworkHidden(profileId: string, networkId: string) {
      const profile = this.profiles.find((p) => p.id === profileId)
      if (!profile) return
      if (!profile.hiddenNetworks) profile.hiddenNetworks = []
      const idx = profile.hiddenNetworks.indexOf(networkId)
      if (idx === -1) {
        profile.hiddenNetworks.push(networkId)
      } else {
        profile.hiddenNetworks.splice(idx, 1)
      }
      this.syncProfileToCloud(profile)
    },

    /** Check if a network is hidden for a profile. */
    isNetworkHidden(profileId: string, networkId: string): boolean {
      const profile = this.profiles.find((p) => p.id === profileId)
      return profile?.hiddenNetworks?.includes(networkId) ?? false
    },

    /**
     * Ensure at least one profile exists.
     * Called on app start — creates "Profile 1" on first launch.
     */
    ensureDefault(): Profile {
      if (this.profiles.length === 0) {
        return this.add('Profile 1')
      }
      if (!this.activeProfileId || !this.profiles.find((p) => p.id === this.activeProfileId)) {
        this.activeProfileId = this.profiles[0].id
      }
      return this.profiles.find((p) => p.id === this.activeProfileId)!
    },

    replaceFromCloud(
      cloudProfiles: Array<{
        profileId: string;
        name: string;
        emoji: string;
        avatar?: string;
        hiddenNetworks?: string[];
        createdAt: number;
      }>,
      activeProfileId?: string,
    ) {
      this.profiles = cloudProfiles
        .map((profile) => ({
          id: profile.profileId,
          name: profile.name,
          emoji: profile.emoji,
          avatar: profile.avatar,
          hiddenNetworks: profile.hiddenNetworks ?? [],
          createdAt: profile.createdAt,
        }))
        .sort((a, b) => a.createdAt - b.createdAt)
      this.activeProfileId = activeProfileId && this.profiles.some((p) => p.id === activeProfileId)
        ? activeProfileId
        : (this.profiles[0]?.id ?? '')
    },

    async syncProfileToCloud(profile: Profile) {
      try {
        const client = getConvexClient()
        await client.mutation(api.profiles.upsert, {
          profileId: profile.id,
          name: profile.name,
          emoji: profile.emoji,
          avatar: profile.avatar,
          hiddenNetworks: profile.hiddenNetworks ?? [],
          createdAt: profile.createdAt,
        })
      } catch {
        // Offline or unauthenticated.
      }
    },

    async removeProfileFromCloud(profileId: string) {
      try {
        const client = getConvexClient()
        await client.mutation(api.profiles.remove, { profileId })
      } catch {
        // Offline or unauthenticated.
      }
    },

    async syncActiveProfileToCloud(profileId?: string) {
      await syncSettingsPatch({ activeProfileId: profileId })
    },

    async seedCloud() {
      for (const profile of this.profiles) {
        await this.syncProfileToCloud(profile)
      }
      if (this.activeProfileId) {
        await this.syncActiveProfileToCloud(this.activeProfileId)
      }
    },

    clearLocal() {
      this.profiles = []
      this.activeProfileId = ''
    },
  },

  persist: true,
})
