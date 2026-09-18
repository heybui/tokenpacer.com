# Token Pacer — website

Vue 3 + Vite + Tailwind v4, prerendered to static HTML by `vite-ssg`.

```sh
npm install
npm run dev      # local
npm run build    # → dist/  (index.html = en, vi.html = vi)
npm run preview
```

## How it is wired

- **SEO** — every route is prerendered, so the markup is in the HTML source. Per-page
  title/description/OG/canonical/hreflang and the `SoftwareApplication` JSON-LD come from
  `useHead` in `src/pages/Home.vue`. `public/robots.txt` and `public/sitemap.xml` are static.
  Change the domain in one place: `src/site.js` (and the two static files).
- **i18n** — `src/locales/*.json` plus a ~15-line `useI18n()` in `src/i18n.js`. The default
  locale owns `/`, every other locale gets `/<locale>`. Adding a locale = one JSON file; the
  route and the hreflang tags follow from `locales`.
- **Design tokens** — `src/style.css` `@theme` block. The tone rule (green < 75, amber 75–90,
  red > 90) matches the app's `DesignSystem/Tokens.swift`.
- **Sizing** — Tailwind's rem scale throughout; no px chased from the mock.
- **Performance** — self-hosted variable font, critical CSS inlined by `beasties`, no runtime
  i18n library, one image (the app icon).

Deploy: any static host. Publish `dist/`, no build-time env needed.
