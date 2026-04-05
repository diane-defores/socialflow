import { createApp } from 'vue'
import App from './App.vue'
import PrimeVue from 'primevue/config'
import { router } from './router'
import { createPinia } from 'pinia'
import Ripple from 'primevue/ripple'
import Tooltip from 'primevue/tooltip'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { i18n } from '@/utils/i18n'
import ConfirmationService from 'primevue/confirmationservice'
import ToastService from 'primevue/toastservice'
import { getConvexClient } from '@/lib/convex'
import { setupConvexAuth } from '@/lib/convexAuth'

// Styles PrimeVue
import 'primevue/resources/themes/lara-light-blue/theme.css'
import 'primevue/resources/primevue.css'
import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css'

// PrimeVue components are auto-imported by unplugin-vue-components + PrimeVueResolver

// Bootstrap Convex Auth (anonymous auto-login) before mounting — skip if not configured
async function bootstrap() {
  const convexUrl = import.meta.env.VITE_CONVEX_URL as string
  if (convexUrl) {
    try {
      const client = getConvexClient()
      await setupConvexAuth(client, convexUrl)
    } catch {
      // Convex unavailable — app works offline
    }
  }

  const app = createApp(App)
  const pinia = createPinia()

  pinia.use(piniaPluginPersistedstate)

  app.use(PrimeVue, { ripple: true })
  app.use(ConfirmationService)
  app.use(ToastService)
  app.use(i18n)
  app.use(router)
  app.use(pinia)

  app.directive('ripple', Ripple)
  app.directive('tooltip', Tooltip)

  app.mount('#app')
}

bootstrap()
