import { defineStore } from 'pinia'

export interface Profile {
  id: string
  name: string
  emoji: string
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

    /** Switch the active profile. */
    setActive(profileId: string) {
      this.activeProfileId = profileId
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
