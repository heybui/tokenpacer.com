import { ViteSSG } from 'vite-ssg'
import App from './App.vue'
import Home from './pages/Home.vue'
import Press from './pages/Press.vue'
import './style.css'

const routes = [
  { path: '/', name: 'home', component: Home },
  { path: '/press', name: 'press', component: Press },
]

export const createApp = ViteSSG(App, { base: import.meta.env.BASE_URL, routes }, ({ isClient }) => {
  if (!isClient) return
  // One delegated listener sends every button/link click to GA as `button_click`.
  document.addEventListener('click', (e) => {
    const el = (e.target as Element).closest('button, a, [role="button"]')
    if (!el) return
    window.gtag?.('event', 'button_click', {
      button_label: (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 100),
      link_url: el.getAttribute('href') || undefined,
      page_path: location.pathname,
    })
  })
})
