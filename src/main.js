import { ViteSSG } from 'vite-ssg'
import App from './App.vue'
import Home from './pages/Home.vue'
import './style.css'

const routes = [{ path: '/', name: 'home', component: Home }]

export const createApp = ViteSSG(App, { base: import.meta.env.BASE_URL, routes })
