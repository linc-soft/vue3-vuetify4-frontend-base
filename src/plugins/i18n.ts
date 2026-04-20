import { createI18n } from 'vue-i18n'

import en from '@/locales/en'
import ja from '@/locales/ja'
import zh from '@/locales/zh'

export default createI18n({
  legacy: false,
  locale: import.meta.env.VITE_DEFAULT_LOCALE ?? 'en',
  fallbackLocale: 'en',
  messages: { en, zh, ja },
})
