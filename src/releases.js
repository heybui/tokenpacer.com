// A release body is written to the token-pacer repo's docs/RELEASE_NOTES.md
// template: one bold lede line, then `### New` / `### Fixed` bullet lists. The
// changelog renders that shape, so parse it rather than render markdown — a
// renderer is a dependency plus an HTML-injection surface for one heading and
// one list level.
const inline = (s) =>
  s
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[`*_]{1,2}/g, '')
    .trim()

export function parseNotes(body) {
  const items = []
  let lede = ''
  let section = ''
  let open = null // the bullet a wrapped line continues

  for (const raw of String(body ?? '').split('\n')) {
    const line = raw.trim()
    if (!line) continue

    const head = line.match(/^#{1,6}\s+(.*)$/)
    if (head) {
      section = inline(head[1])
      open = null
      continue
    }

    const bullet = line.match(/^[-*+]\s+(.*)$/)
    if (bullet) {
      items.push((open = { tag: section, text: inline(bullet[1]) }))
      continue
    }

    const text = inline(line)
    if (open) open.text += ' ' + text
    else if (section) items.push((open = { tag: section, text }))
    else if (!lede) lede = text
    // A paragraph before any heading that is not the lede is a `**Heads up:**`
    // style aside — its own prefix is the tag.
    else {
      const aside = text.match(/^([A-Z][\w ]{0,14}):\s*(.+)$/)
      items.push((open = aside ? { tag: aside[1], text: aside[2] } : { tag: '', text }))
    }
  }
  return { lede, items }
}
