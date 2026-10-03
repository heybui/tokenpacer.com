import en from './locales/en.json'

const lookup = (bundle, key) => key.split('.').reduce((node, part) => node?.[part], bundle)

// ponytail: English-only key lookup. Re-add locale routing when a second language lands.
export function useI18n() {
  const t = (key, vars) => {
    const value = lookup(en, key) ?? key
    return vars ? String(value).replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? '') : value
  }
  return { t }
}
