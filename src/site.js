// Change this once and every canonical, hreflang and og:url follows.
export const SITE_URL = 'https://tokenpacer.com'
export const FILE_SIZE = '2.7 MB'
export const BREW = 'brew install --cask token-pacer'
// Releases live on THIS repo — token-pacer is private, so its assets 404 for
// everyone but us. Sparkle reads the same releases via public/appcast.xml.
export const DOWNLOAD_URL = 'https://github.com/heybui/tokenpacer.com/releases/latest'
// Mailchimp's embedded-form endpoint, swapped to post-json for the JSONP reply.
export const MC_ACTION =
  'https://redevify.us22.list-manage.com/subscribe/post-json?u=680a3c16f17ebe57f4fc63531&id=13f604e155&f_id=0087c2e1f0'
// Their honeypot. Named after the list, and it has to go over empty.
export const MC_BOT_FIELD = 'b_680a3c16f17ebe57f4fc63531_13f604e155'
// Mailchimp clips a text merge field at 255 bytes, silently.
export const MC_MAX = 255
// The hand-off targets. token-pacer is private — a stranger cannot open an
// issue on a repo they cannot see — so issues land on the public site repo.
export const GH_REPO = 'heybui/tokenpacer.com'
export const CONTACT_EMAIL = 'support@tokenpacer.com'
export const COFFEE_URL = 'https://buymeacoffee.com/heybui'
