import { defineStore } from 'pinia'

export interface Account {
  id: string        // crypto.randomUUID()
  networkId: string // 'twitter' | 'instagram' | etc.
  label: string     // user-defined: '@handle' or 'Brand A'
  addedAt: number
}

export const useAccountsStore = defineStore('accounts', {
  state: () => ({
    accounts: [] as Account[],
    // Which account is currently active per network
    activeAccountId: {} as Record<string, string>,
  }),

  getters: {
    getByNetwork: (state) => (networkId: string): Account[] =>
      state.accounts.filter((a) => a.networkId === networkId),

    getActive: (state) => (networkId: string): Account | undefined => {
      const activeId = state.activeAccountId[networkId]
      return state.accounts.find((a) => a.id === activeId)
    },

    hasAny: (state) => (networkId: string): boolean =>
      state.accounts.some((a) => a.networkId === networkId),
  },

  actions: {
    /** Add a new account and make it active for its network. */
    add(networkId: string, label: string): Account {
      const account: Account = {
        id: crypto.randomUUID(),
        networkId,
        label,
        addedAt: Date.now(),
      }
      this.accounts.push(account)
      this.activeAccountId[networkId] = account.id
      return account
    },

    /** Remove an account; switch to another account for that network if possible. */
    remove(accountId: string) {
      const idx = this.accounts.findIndex((a) => a.id === accountId)
      if (idx === -1) return
      const { networkId } = this.accounts[idx]
      this.accounts.splice(idx, 1)
      if (this.activeAccountId[networkId] === accountId) {
        const next = this.accounts.find((a) => a.networkId === networkId)
        this.activeAccountId[networkId] = next?.id ?? ''
      }
    },

    /** Switch the active account for a network. */
    setActive(networkId: string, accountId: string) {
      this.activeAccountId[networkId] = accountId
    },

    /** Rename an account label. */
    rename(accountId: string, label: string) {
      const account = this.accounts.find((a) => a.id === accountId)
      if (account) account.label = label
    },

    /**
     * Ensure at least one account exists for a network.
     * Called automatically on first network click — creates a default account
     * so the webview opens immediately without forcing the user to click "Add".
     */
    ensureDefault(networkId: string): Account {
      const existing = this.accounts.find((a) => a.networkId === networkId)
      if (existing) {
        if (!this.activeAccountId[networkId]) {
          this.activeAccountId[networkId] = existing.id
        }
        return existing
      }
      return this.add(networkId, 'Account 1')
    },
  },

  persist: true,
})
