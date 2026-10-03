import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parseAppcast, parseNotes } from './releases.js'

// The shape docs/RELEASE_NOTES.md asks for, as v1.0.0 actually shipped it.
const real = parseNotes(`👋 **Hello, world!** Token Pacer 1.0 is here.

You run Claude Code, Codex and Copilot all day.

Now the notch just tells you. 🎉

### ✨ What it does
- 📊 One mark, one number, one countdown.
- 🖱️ Hover to see all three side by side. Double-click to pin the history,
  the splits and a sparkline.

### 🚀 Get it
Download the disk image below.

💬 Tell me what breaks.
`)

assert.equal(real.lede, '👋 Hello, world! Token Pacer 1.0 is here.')
assert.deepEqual(real.sections, [
  // A blank line ends a paragraph — these two must not run together.
  { tag: '', items: ['You run Claude Code, Codex and Copilot all day.', 'Now the notch just tells you. 🎉'] },
  {
    tag: '✨ What it does',
    items: [
      '📊 One mark, one number, one countdown.',
      // …but a wrapped bullet is still one item.
      '🖱️ Hover to see all three side by side. Double-click to pin the history, the splits and a sparkline.',
    ],
  },
  { tag: '🚀 Get it', items: ['Download the disk image below.', '💬 Tell me what breaks.'] },
])

// The template's own example: links unwrap to their text, sections keep their names.
const tmpl = parseNotes('**Heads up:** the preference resets.\n\n### Fixed\n- See [Preferences](https://tokenpacer.com/prefs).')
assert.equal(tmpl.lede, 'Heads up: the preference resets.')
assert.deepEqual(tmpl.sections, [{ tag: 'Fixed', items: ['See Preferences.'] }])

// An empty body ships a release with no description at all — say nothing, don't throw.
assert.deepEqual(parseNotes(''), { lede: '', sections: [] })
assert.deepEqual(parseNotes(null), { lede: '', sections: [] })

// A bare commit dump, with no lede and no headings, is still readable.
assert.deepEqual(parseNotes('- fix(ci): bound every wait\n- chore: drop a binding'), {
  lede: '',
  sections: [{ tag: '', items: ['fix(ci): bound every wait', 'chore: drop a binding'] }],
})

// The feed the page bakes its version and download link from, as it ships.
const feed = parseAppcast(readFileSync(new URL('../public/appcast.xml', import.meta.url), 'utf8'))
assert.match(feed.version, /^\d+\.\d+/)
assert.match(feed.minOS, /^\d+$/) // trailing .0 trimmed — "macOS 15.0" reads wrong
assert.match(feed.url, /^https:\/\/.*\.dmg$/)

// No feed, or one still being written: empty strings, so the page falls back
// rather than printing "vundefined".
assert.deepEqual(parseAppcast(''), { version: '', minOS: '', url: '' })

console.log('ok')
