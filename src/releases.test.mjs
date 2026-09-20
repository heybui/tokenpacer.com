import assert from 'node:assert/strict'
import { parseNotes } from './releases.js'

const { lede, items } = parseNotes(`**Copilot joins Claude and Codex in the notch.**

**Heads up:** the provider preference resets once.

### New
- Copilot's usage panel is read alongside the others; pick which provider the
  pill shows in [Preferences](https://tokenpacer.com/prefs).

### Fixed
- The notch no longer loses its place when a display wakes up.
`)

assert.equal(lede, 'Copilot joins Claude and Codex in the notch.')
assert.deepEqual(items, [
  { tag: 'Heads up', text: 'the provider preference resets once.' },
  { tag: 'New', text: "Copilot's usage panel is read alongside the others; pick which provider the pill shows in Preferences." },
  { tag: 'Fixed', text: 'The notch no longer loses its place when a display wakes up.' },
])

// An empty body ships a release with no description at all — say nothing, don't throw.
assert.deepEqual(parseNotes(''), { lede: '', items: [] })
assert.deepEqual(parseNotes(null), { lede: '', items: [] })

// A bare commit dump (what the appcast carries today) is still readable.
assert.deepEqual(parseNotes('- fix(ci): bound every wait'), { lede: '', items: [{ tag: '', text: 'fix(ci): bound every wait' }] })

console.log('ok')
