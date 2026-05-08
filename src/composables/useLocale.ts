import { useI18n } from 'vue-i18n'
import { useLocale as useVuetifyLocale } from 'vuetify'

// Storage key used to persist the user's language preference.
export const LOCALE_STORAGE_KEY = 'app-locale'

// Supported application locales. Keep in sync with files under `src/locales/`.
export const SUPPORTED_LOCALES = ['en', 'zh', 'ja'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

// Display names rendered in each locale itself.
export const LOCALE_LABELS: Record<SupportedLocale, string> = {
  en: 'English',
  zh: '简体中文',
  ja: '日本語',
}

// Map application locale -> Vuetify locale key (see `vuetify/locale`).
const VUETIFY_LOCALE_MAP: Record<SupportedLocale, string> = {
  en: 'en',
  zh: 'zhHans',
  ja: 'ja',
}

function isSupported(value: unknown): value is SupportedLocale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

/**
 * Resolve the initial locale: stored value > VITE_DEFAULT_LOCALE > 'en'.
 * Safe to call before the Vue app is mounted (pure localStorage read).
 */
export function resolveInitialLocale(): SupportedLocale {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (isSupported(stored)) return stored
  } catch {
    // localStorage may be unavailable (e.g. SSR, privacy mode); fall through.
  }
  const envLocale = import.meta.env.VITE_DEFAULT_LOCALE
  if (isSupported(envLocale)) return envLocale
  return 'en'
}

export function resolveInitialVuetifyLocale(): string {
  return VUETIFY_LOCALE_MAP[resolveInitialLocale()]
}

/**
 * Composable for switching the application language at runtime.
 * Keeps vue-i18n, Vuetify locale, <html lang> and localStorage in sync.
 */
export function useLocale() {
  const { locale } = useI18n()
  const vuetifyLocale = useVuetifyLocale()

  function setLocale(value: SupportedLocale) {
    if (!isSupported(value)) return
    locale.value = value
    vuetifyLocale.current.value = VUETIFY_LOCALE_MAP[value]
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, value)
    } catch {
      // Ignore persistence failures.
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = value
    }
  }

  return {
    current: locale,
    supported: SUPPORTED_LOCALES,
    labels: LOCALE_LABELS,
    setLocale,
  }
}
