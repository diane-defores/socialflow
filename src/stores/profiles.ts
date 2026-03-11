import { defineStore } from 'pinia'

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
      return profile
    },

    /** Remove a profile; switch to another if it was active. */
    remove(profileId: string) {
      const idx = this.profiles.findIndex((p) => p.id === profileId)
      if (idx === -1) return
      this.profiles.splice(idx, 1)
      if (this.activeProfileId === profileId) {
        this.activeProfileId = this.profiles[0]?.id ?? ''
      }
    },

    /** Rename a profile. */
    rename(profileId: string, name: string) {
      const profile = this.profiles.find((p) => p.id === profileId)
      if (profile) profile.name = name
    },

    /** Set or clear a profile avatar (base64 data URL). */
    setAvatar(profileId: string, avatar: string | undefined) {
      const profile = this.profiles.find((p) => p.id === profileId)
      if (profile) profile.avatar = avatar
    },

    /** Switch the active profile. */
    setActive(profileId: string) {
      this.activeProfileId = profileId
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
  },

  persist: true,
})
