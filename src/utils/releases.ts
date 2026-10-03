// A release body follows the token-pacer repo's docs/RELEASE_NOTES.md template:
// a lede line, then `### <section>` blocks of bullets or short paragraphs. The
// changelog renders that shape, so parse it rather than render markdown — a
// renderer is a dependency plus an HTML-injection surface for one heading level
// and one list level.
const inline = (s) =>
  s
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[`*_]{1,2}/g, '')
    .trim()

export function parseNotes(body) {
  const sections = []
  let lede = ''
  let current = null // the section being filled
  let open = -1 // index of the item a wrapped line continues, -1 when closed

  const section = (tag) => {
    current = { tag, items: [] }
    sections.push(current)
    open = -1
  }
  const push = (text) => {
    if (!current) section('')
    open = current.items.push(text) - 1
  }

  for (const raw of String(body ?? '').split('\n')) {
    const line = raw.trim()
    // A blank line ends the paragraph, so the next one starts its own item
    // rather than running on from it.
    if (!line) {
      open = -1
      continue
    }

    const head = line.match(/^#{1,6}\s+(.*)$/)
    if (head) {
      section(inline(head[1]))
      continue
    }

    const bullet = line.match(/^[-*+]\s+(.*)$/)
    if (bullet) {
      push(inline(bullet[1]))
      continue
    }

    const text = inline(line)
    if (open >= 0) current.items[open] += ' ' + text // a wrapped line
    else if (!lede && !current) lede = text
    else push(text)
  }
  return { lede, sections }
}

// The appcast Sparkle updates from is also the only place the shipped build is
// named, so the page reads its version, its floor and its DMG off that one feed
// instead of keeping copies that go stale. Regex, not DOMParser: this is read at
// build time in node, where there is no DOM, over a file our own CI writes.
// ponytail: first <item> wins. Fine while CI writes a single-item feed.
export function parseAppcast(xml) {
  const item = String(xml ?? '').split('<item>')[1] ?? ''
  const tag = (name) => item.match(new RegExp(`<${name}>\\s*([^<]*?)\\s*</${name}>`))?.[1] ?? ''
  return {
    version: tag('sparkle:shortVersionString'),
    minOS: tag('sparkle:minimumSystemVersion').replace(/(\.0)+$/, ''),
    url: item.match(/<enclosure[^>]*\surl="([^"]*)"/)?.[1] ?? '',
  }
}
