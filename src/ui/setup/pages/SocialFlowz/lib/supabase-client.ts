import { createClient } from '@supabase/supabase-js'
import { ref } from 'vue'
import { defineStore } from 'pinia'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

export const useSupabaseStore = defineStore('supabase', {
  state: () => ({
    user: null,
    session: null,
    loading: false
  }),

  actions: {
    async initialize() {
      // Écoute les changements d'auth
      supabase.auth.onAuthStateChange((event, session) => {
        this.session = session
        this.user = session?.user ?? null
      })
    }
  }
}) 