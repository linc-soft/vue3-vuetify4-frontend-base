import { createI18n } from 'vue-i18n'

import { resolveInitialLocale } from '@/composables/useLocale'
import en from '@/locales/en'
import ja from '@/locales/ja'
import zh from '@/locales/zh'

export default createI18n({
  legacy: false,
  locale: resolveInitialLocale(),
  fallbackLocale: 'en',
  messages: { en, zh, ja },
})
