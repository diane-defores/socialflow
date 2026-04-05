import { createApp } from 'vue'
import App from './App.vue'
import PrimeVue from 'primevue/config'
import { router } from './router'
import { createPinia } from 'pinia'
import Ripple from 'primevue/ripple'
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

// Import des composants PrimeVue nécessaires
import Sidebar from 'primevue/sidebar'
import Button from 'primevue/button'
import Menu from 'primevue/menu'
import Avatar from 'primevue/avatar'
import Calendar from 'primevue/calendar'
import ToggleButton from 'primevue/togglebutton'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
import Tooltip from 'primevue/tooltip'
import MultiSelect from 'primevue/multiselect'
import Textarea from 'primevue/textarea'
import ConfirmPopup from 'primevue/confirmpopup'
import Toast from 'primevue/toast'
import ProgressSpinner from 'primevue/progressspinner'
import Message from 'primevue/message'

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

  // Enregistrement des composants
  app.component('Sidebar', Sidebar)
  app.component('Button', Button)
  app.component('Menu', Menu)
  app.component('Avatar', Avatar)
  app.component('Calendar', Calendar)
  app.component('ToggleButton', ToggleButton)
  app.component('Dropdown', Dropdown)
  app.component('InputText', InputText)
  app.component('Password', Password)
  app.component('Textarea', Textarea)
  app.component('Splitter', Splitter)
  app.component('SplitterPanel', SplitterPanel)
  app.directive('tooltip', Tooltip)
  app.component('MultiSelect', MultiSelect)
  app.component('ConfirmPopup', ConfirmPopup)
  app.component('Toast', Toast)
  app.component('ProgressSpinner', ProgressSpinner)
  app.component('Message', Message)

  app.mount('#app')
}

bootstrap()
