import en from '../locales/en.json'

// any: a key can land on a string, an array or a sub-object, and the templates use all three.
const lookup = (bundle: unknown, key: string): any => key.split('.').reduce((node: any, part) => node?.[part], bundle)

// ponytail: English-only key lookup. Re-add locale routing when a second language lands.
export function useI18n() {
  const t = (key: string, vars?: Record<string, string | number>) => {
    const value = lookup(en, key) ?? key
    return vars ? String(value).replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? '')) : value
  }
  return { t }
}
