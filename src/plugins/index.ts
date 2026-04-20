// Types
import type { App } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import router from '../router'
/**
 * plugins/index.ts
 *
 * Automatically included in `./src/main.ts`
 */
import i18n from './i18n'
// Plugins
import vuetify from './vuetify'

export function registerPlugins(app: App) {
  app.use(vuetify)
  const pinia = createPinia()
  pinia.use(piniaPluginPersistedstate)
  app.use(pinia)
  app.use(i18n)
  app.use(router)
}
