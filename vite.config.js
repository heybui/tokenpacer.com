import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/',
  // The appcast lives in public/ because Sparkle fetches it at /appcast.xml,
  // and Vite refuses to let JS import from there — so hand the page its text
  // as a constant instead. Baked, not fetched: a push here is what redeploys,
  // so the version on the page can never lag the feed.
  define: { __APPCAST__: JSON.stringify(readFileSync('public/appcast.xml', 'utf8')) },
  plugins: [vue(), tailwindcss()],
  ssgOptions: { formatting: 'minify', beastiesOptions: { path: 'dist', publicPath: '/' } },
})
