import { createApp } from 'vue'
import App from './App.vue'
import PrimeVue from 'primevue/config'
import { router } from './router'
import { createPinia } from 'pinia'
import Ripple from 'primevue/ripple'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { clerkPlugin } from '@clerk/vue'

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

const app = createApp(App)
const pinia = createPinia()

pinia.use(piniaPluginPersistedstate)

app.use(clerkPlugin, {
  publishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
})
app.use(PrimeVue, {
    ripple: true
})
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

app.mount('#app') 