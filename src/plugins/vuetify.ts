/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Composables
import { createVuetify } from 'vuetify'
import { en, ja, zhHans } from 'vuetify/locale'

import { resolveInitialVuetifyLocale } from '@/composables/useLocale'
// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  display: {
    mobileBreakpoint: 'sm',
  },
  theme: {
    defaultTheme: 'system',
  },
  locale: {
    locale: resolveInitialVuetifyLocale(),
    fallback: 'en',
    messages: { en, zhHans, ja },
  },
})
