# tokenpacer.com

The website for [Token Pacer](https://tokenpacer.com) — a macOS app that keeps your
Claude Code, Codex and Copilot usage in the notch.

Vue 3 + Vite + Tailwind v4, prerendered to static HTML by `vite-ssg`.

```sh
npm install
npm run dev
npm run build    # → dist/
npm run preview
npm test         # the release-notes parser
```

## Where things are

| | |
|---|---|
| `src/pages/Home.vue` | the whole page, and `useHead` for title, OG and JSON-LD |
| `src/components/` | the notch demo, and the feedback and changelog modals |
| `src/locales/en.json` | every string on the page |
| `src/site.js` | domain, repo, contact — change them here, not inline |
| `src/style.css` | design tokens; the tone rule matches the app's |

## Notes

- **Releases live in this repo.** The app itself is private, so its DMGs and the
  Sparkle appcast (`public/appcast.xml`) are published from here.
- **The changelog modal reads the latest release** from the GitHub API and parses
  its body, so editing release notes needs no redeploy.
- **Deploy** is GitHub Pages on every push to `main`. No build-time env.
