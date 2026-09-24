# tokenpacer.com

The website for [Token Pacer](https://tokenpacer.com) — a macOS app that keeps
Claude Code, Codex and Copilot usage in the notch.

## Notes

- **Releases live in this repo.** The app itself is private, so its DMGs and the
  Sparkle appcast (`public/appcast.xml`) are published from here.
- **The changelog modal reads the latest release** from the GitHub API and parses
  its body, so editing release notes needs no redeploy.
- **Deploy** is GitHub Pages on every push to `main`. No build-time env.
