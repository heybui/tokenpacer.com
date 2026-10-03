import { ViteSSG } from 'vite-ssg'
import App from './App.vue'
import Home from './pages/Home.vue'
import Press from './pages/Press.vue'
import './style.css'

const routes = [
  { path: '/', name: 'home', component: Home },
  { path: '/press', name: 'press', component: Press },
]

export const createApp = ViteSSG(App, { base: import.meta.env.BASE_URL, routes })
