import { createApp } from 'vue'
import App from './App.vue'
import PrimeVue from 'primevue/config'
import { router } from './router'
import { createPinia } from 'pinia'
import Ripple from 'primevue/ripple'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { clerkPlugin } from '@clerk/vue'
import { i18n } from '@/utils/i18n'
import ConfirmationService from 'primevue/confirmationservice'
import ToastService from 'primevue/toastservice'

// Styles PrimeVue
import 'primevue/resources/themes/lara-light-blue/theme.css' // thème
import 'primevue/resources/primevue.css'                     // core css
import 'primeicons/primeicons.css'                          // icons
import 'primeflex/primeflex.css'                           // flexbox & grid

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

const bootLogs: string[] = []

function pushBootLog(message: string) {
  const line = `[${new Date().toISOString()}] ${message}`
  bootLogs.push(line)
  ;(window as any).__SF_BOOT_LOGS__ = bootLogs
}

function formatError(err: unknown) {
  if (err instanceof Error) return `${err.name}: ${err.message}`
  if (typeof err === 'string') return err
  try {
    return JSON.stringify(err)
  } catch {
    return String(err)
  }
}

function renderFatalError(message: string) {
  const root = document.getElementById('app')
  if (!root) return
  const logs = ((window as any).__SF_BOOT_LOGS__ as string[] | undefined)?.join('\n') ?? ''

  root.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#f8f9fa;color:#111827;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <div style="width:min(720px,100%);background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:20px;box-shadow:0 10px 30px rgba(0,0,0,.08);">
        <div style="font-size:18px;font-weight:700;margin-bottom:8px;">SocialFlow a planté au démarrage</div>
        <div style="font-size:14px;line-height:1.5;opacity:.8;margin-bottom:12px;">L'erreur JavaScript a été interceptée pour éviter l'écran blanc complet.</div>
        <pre style="white-space:pre-wrap;word-break:break-word;margin:0;padding:12px;border-radius:12px;background:#111827;color:#f9fafb;font-size:12px;overflow:auto;">${message}</pre>
        <div style="font-size:13px;font-weight:700;margin:16px 0 8px;">Journal de démarrage</div>
        <pre style="white-space:pre-wrap;word-break:break-word;margin:0;padding:12px;border-radius:12px;background:#f3f4f6;color:#111827;font-size:12px;overflow:auto;max-height:240px;">${logs || 'Aucun log capturé avant le crash.'}</pre>
      </div>
    </div>
  `
}

const app = createApp(App)
const pinia = createPinia()
;(window as any).__SF_BOOT_LOG_PUSH__ = pushBootLog
pushBootLog('main.ts loaded')

pinia.use(piniaPluginPersistedstate)

app.use(clerkPlugin, {
  publishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
})
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

app.config.errorHandler = (err, _instance, info) => {
  const details = `${formatError(err)}\n\n${info}`
  pushBootLog(`Vue fatal error: ${details}`)
  console.error('Vue fatal error:', err, info)
  renderFatalError(details)
}

window.addEventListener('error', (event) => {
  pushBootLog(`window.error: ${formatError(event.error ?? event.message)}`)
  renderFatalError(formatError(event.error ?? event.message))
})

window.addEventListener('unhandledrejection', (event) => {
  pushBootLog(`unhandledrejection: ${formatError(event.reason)}`)
  renderFatalError(formatError(event.reason))
})

try {
  pushBootLog('mounting Vue app')
  app.mount('#app')
  pushBootLog('Vue app mounted')
} catch (err) {
  pushBootLog(`mount failed: ${formatError(err)}`)
  renderFatalError(formatError(err))
}
