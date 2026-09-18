import { computed } from 'vue'
import { useRoute } from 'vue-router'
import en from './locales/en.json'
import vi from './locales/vi.json'

export const messages = { en, vi }
export const locales = Object.keys(messages)
export const DEFAULT_LOCALE = 'en'

// The default locale owns the root; every other locale sits under /<locale>.
export const localePath = (locale, path = '') =>
  `${locale === DEFAULT_LOCALE ? '' : `/${locale}`}${path}`.replace(/\/$/, '') || '/'

const lookup = (bundle, key) => key.split('.').reduce((node, part) => node?.[part], bundle)

export function useI18n() {
  const route = useRoute()
  const locale = computed(() => locales.find((l) => route.path.startsWith(`/${l}`)) ?? DEFAULT_LOCALE)
  // ponytail: plain key lookup with an en fallback. Swap in vue-i18n when copy
  // needs plurals, dates or numbers formatted per locale.
  const t = (key, vars) => {
    const value = lookup(messages[locale.value], key) ?? lookup(messages[DEFAULT_LOCALE], key) ?? key
    return vars ? String(value).replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? '') : value
  }
  return { locale, t }
}
