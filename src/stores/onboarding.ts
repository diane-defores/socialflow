import { defineStore } from 'pinia'
import { syncSettingsPatch } from '@/lib/cloudSettings'

export const useOnboardingStore = defineStore('onboarding', {
  state: () => ({
    completed: false,
  }),

  actions: {
    complete() {
      this.completed = true
      syncSettingsPatch({ onboardingCompleted: true })
    },
    reset() {
      this.completed = false
      syncSettingsPatch({ onboardingCompleted: false })
    },
  },

  persist: true,
})
