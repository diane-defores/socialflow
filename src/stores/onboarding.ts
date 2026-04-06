import { defineStore } from 'pinia'

export const useOnboardingStore = defineStore('onboarding', {
  state: () => ({
    completed: false,
  }),

  actions: {
    complete() {
      this.completed = true
    },
    reset() {
      this.completed = false
    },
  },

  persist: true,
})
