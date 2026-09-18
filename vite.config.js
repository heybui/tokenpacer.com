import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/tokenpacer.com/',
  plugins: [vue(), tailwindcss()],
  ssgOptions: { formatting: 'minify', beastiesOptions: { path: 'dist', publicPath: '/tokenpacer.com/' } },
})
