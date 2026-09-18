import { ViteSSG } from 'vite-ssg'
import App from './App.vue'
import Home from './pages/Home.vue'
import { DEFAULT_LOCALE, locales } from './i18n'
import './style.css'

const routes = locales.map((locale) => ({
  path: locale === DEFAULT_LOCALE ? '/' : `/${locale}`,
  name: `home-${locale}`,
  component: Home,
}))

export const createApp = ViteSSG(App, { base: import.meta.env.BASE_URL, routes })
