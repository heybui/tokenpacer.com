// Change this once and every canonical, hreflang and og:url follows.
export const SITE_URL = 'https://tokenpacer.com'
export const BREW = 'brew install --cask redevify/tap/token-pacer'
// The app's public repo holds releases; this site keeps Sparkle's feed URL.
export const RELEASE_REPO = 'heybui/token-pacer'
export const DOWNLOAD_URL = `https://github.com/${RELEASE_REPO}/releases/latest`
// Mailchimp's embedded-form endpoint, swapped to post-json for the JSONP reply.
export const MC_ACTION =
  'https://redevify.us22.list-manage.com/subscribe/post-json?u=680a3c16f17ebe57f4fc63531&id=13f604e155&f_id=0087c2e1f0'
// Their honeypot. Named after the list, and it has to go over empty.
export const MC_BOT_FIELD = 'b_680a3c16f17ebe57f4fc63531_13f604e155'
// Mailchimp clips a text merge field at 255 bytes, silently.
export const MC_MAX = 255
export const CONTACT_EMAIL = 'support@tokenpacer.com'
export const COFFEE_URL = 'https://buymeacoffee.com/heybui'
