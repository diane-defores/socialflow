import messages from '@intlify/unplugin-vue-i18n/messages'
import { createI18n } from 'vue-i18n'

const savedLocale = localStorage.getItem('user-locale') ?? 'fr'

export const i18n = createI18n({
  globalInjection: true,
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'en',
  messages,
})

export function setLocale(locale: string) {
  i18n.global.locale.value = locale
  localStorage.setItem('user-locale', locale)
}
