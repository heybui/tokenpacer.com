<script setup>
import { computed, h, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from '../i18n'

const { t } = useI18n()

// Tokens.swift, verbatim: three zone colours, each with the one-step-lighter
// shade the marker and the light's head are drawn in.
const GO = '#3ec98a'
const WATCH = '#e8b33c'
const OVER = '#e2543f'
const INFO = '#5aa9d6'
const LIGHT = { [GO]: '#a5f0cd', [WATCH]: '#fbcda2', [OVER]: '#f4ab9e' }
const rgba = (hex, a) =>
  `rgb(${parseInt(hex.slice(1, 3), 16)} ${parseInt(hex.slice(3, 5), 16)} ${parseInt(hex.slice(5, 7), 16)} / ${a})`

// Every agent is read against its own two marks, as Settings sets them.
const CLAUDE = { warn: 75, over: 90 }
const toneOf = (p, z = CLAUDE) => (p >= z.over ? OVER : p >= z.warn ? WATCH : GO)
const lightOf = (p, z = CLAUDE) => LIGHT[toneOf(p, z)]

const AGENTS = [
  { word: 'CLAUDE', name: 'Claude Code', pct: 58, week: 41, reset: '2h 06m', jobs: 2, zone: CLAUDE },
  { word: 'CODEX', name: 'Codex', pct: 23, week: 64, reset: '3h 48m', jobs: 0, zone: { warn: 60, over: 85 } },
  { word: 'COPILOT', name: 'Copilot', pct: 31, week: null, reset: '12d 07h', jobs: 0, zone: { warn: 80, over: 95 } },
]

// Shell sizes follow PillState.swift: the band row, then whatever body the
// state hangs under it. `hold` is how long the demo stays on each one.
const PILL = { w: '14rem', h: '2.125rem', r: 13 }
const STATES = [
  { key: 'pill', hold: 3000, pct: 58, reset: '2h 06m', ...PILL },
  { key: 'working', hold: 3000, pct: 58, reset: '2h 06m', jobs: 2, ...PILL },
  { key: 'hover', hold: 4200, pct: 58, reset: '2h 06m', jobs: 2, w: '24.5rem', h: '10.7rem', r: 26 },
  { key: 'panel', hold: 4200, pct: 58, reset: '2h 06m', jobs: 2, w: '26rem', h: '22.45rem', r: 26 },
  { key: 'warn', hold: 3000, pct: 90, reset: '0h 42m', jobs: 1, w: '24.5rem', h: '7.125rem', r: 26 },
  { key: 'red', hold: 3000, pct: 100, reset: '0h 22m', ...PILL },
  { key: 'reset', hold: 3000, pct: 0, reset: '5h 00m', ...PILL },
  { key: 'prefs', hold: 3600, pct: 0, reset: '4h 58m', ...PILL },
  // One whole lap of the Appearance pane: three zones, 21 steps of 100ms each.
  { key: 'looks', hold: 6300, pct: 0, reset: '4h 57m', ...PILL },
]

// A model is answering in these, so the mark creeps; the light runs in all of
// them but the panel, which is for reading.
const BURNING = ['working', 'hover', 'panel', 'warn']
const CHASING = ['working', 'hover', 'warn']
// PillState.collapsed wears the 6% ring; every other shell the 13% one.
const IDLE = ['pill', 'working', 'reset', 'prefs', 'looks']

// OdometerText.swift: every digit is a 0–9 strip that rolls to its value.
const DIGITS = [...'0123456789']
const Odo = ({ text }) =>
  h('span', { class: 'odo' }, [...String(text)].map((c, i) =>
    c >= '0' && c <= '9'
      ? h('span', { key: i, class: 'odo-cell' }, h('span', { class: 'odo-strip', style: { translate: `0 ${-c * 1.2}em` } }, DIGITS.map((d) => h('span', d))))
      : h('span', { key: `s${i}` }, c)))

// JobBadge.swift: a 16.5pt circle that widens by 6.9pt a digit. Keyed on the
// count where it is used, so every change pops it the way phaseAnimator does.
const Badge = ({ n, scale = 1 }) =>
  h('span', {
    class: 'badge-pop inline-flex shrink-0 items-center justify-center rounded-full font-mono font-bold text-white',
    style: {
      width: `${(16.5 + 6.9 * (String(n).length - 1)) * scale}px`,
      height: `${16.5 * scale}px`,
      fontSize: `${9.5 * scale}px`,
      background: '#4a4b53',
    },
  }, String(n))

// CapsuleBar.swift: three static zone capsules with a 1% gap at each mark, a
// 2pt rule riding them at the reading and the week as a black-ringed dot.
const Capsule = ({ pct, week, zone = CLAUDE, s = 1, width, running }) => {
  const seg = (a, b, c) =>
    h('span', { class: 'absolute rounded-full', style: { left: `${a}%`, width: `${b - a}%`, top: `${3.5 * s}px`, height: `${4 * s}px`, background: c } })
  return h('span', { class: 'relative block shrink-0', style: { width: width && `${width * s}px`, height: `${11 * s}px` } }, [
    seg(0, zone.warn - 1, GO),
    seg(zone.warn + 1, zone.over - 1, WATCH),
    seg(zone.over + 1, 100, OVER),
    week != null && h('span', {
      class: 'mark-rule absolute top-1/2 box-border rounded-full',
      style: { left: `${week}%`, width: `${8 * s}px`, height: `${8 * s}px`, margin: `${-4 * s}px 0 0 ${-4 * s}px`, background: lightOf(week, zone), border: `${s}px solid #000` },
    }),
    pct != null && h('span', {
      class: ['mark-rule absolute top-0 rounded-full', running && 'animate-creep'],
      style: { left: `${pct}%`, width: `${2 * s}px`, height: `${11 * s}px`, marginLeft: `${-s}px`, background: lightOf(pct, zone), '--creep': `${3 * s}px` },
    }),
  ])
}

// Marks.swift, all twelve at their own size, in points. `run` is the one tile
// that is working: only the chosen mark moves, as in the app's pane.
const rect = (x, y, width, height, rx, fill, extra) => h('rect', { x, y, width, height, rx, fill, ...extra })
const dot = (cx, cy, r, fill, extra) => h('circle', { cx, cy, r, fill, ...extra })
const path = (d, fill, extra) => h('path', { d, fill, ...extra })
const clip = (id, shape) => h('clipPath', { id }, [shape])
const FAINT = { opacity: 0.16 }
const MARKS = [
  { name: 'Capsule bar', w: 36, h: 11, draw: (p, z, run) => [
    rect(0, 3.5, 0.36 * (z.warn - 1), 4, 2, GO),
    rect(0.36 * (z.warn + 1), 3.5, 0.36 * (z.over - z.warn - 2), 4, 2, WATCH),
    rect(0.36 * (z.over + 1), 3.5, 0.36 * (99 - z.over), 4, 2, OVER),
    rect(0.36 * p - 1, 0, 2, 11, 1, lightOf(p, z), { class: run && 'animate-creep', style: '--creep: 3px' }),
  ] },
  { name: 'Ring wings', w: 18, h: 18, draw: (p, z) => {
    const r = 7.75, c = 2 * Math.PI * r, a = ((p * 3.6 - 90) * Math.PI) / 180
    const arc = (from, to, col) => dot(9, 9, r, 'none', {
      stroke: col, 'stroke-width': 2.5, 'stroke-dasharray': `${(c * (to - from)) / 100} ${c}`,
      'stroke-dashoffset': (-c * from) / 100, transform: 'rotate(-90 9 9)',
    })
    return [arc(0, z.warn - 1, GO), arc(z.warn + 1, z.over - 1, WATCH), arc(z.over + 1, 100, OVER),
      dot(9 + r * Math.cos(a), 9 + r * Math.sin(a), 3, '#000'), dot(9 + r * Math.cos(a), 9 + r * Math.sin(a), 2.25, lightOf(p, z))]
  } },
  { name: 'Notch tank', w: 22, h: 16, draw: (p, z) => {
    const left = (16 * (100 - p)) / 100
    return [
      clip('tp-tank', rect(0, 0, 16, 16, 3.6)),
      h('g', { 'clip-path': 'url(#tp-tank)' }, [
        rect(0, 0, 16, 16, 0, 'rgb(255 255 255 / .1)'),
        rect(0, 16 - left, 16, left, 0, toneOf(p, z)),
        rect(0, 15.25 - left, 16, 1.5, 0.75, lightOf(p, z)),
        path('M3.6 0h8.8v.84a2.2 2.2 0 0 1-2.2 2.2H5.8a2.2 2.2 0 0 1-2.2-2.2z', '#000'),
      ]),
      rect(0.5, 0.5, 15, 15, 3.1, 'none', { stroke: 'rgb(255 255 255 / .16)' }),
      rect(18.25, 1, 3.5, 1, 0.5, 'rgb(255 255 255 / .45)'),
      rect(19, 7.5, 2, 1, 0.5, 'rgb(255 255 255 / .24)'),
      rect(18.25, 14, 3.5, 1, 0.5, 'rgb(255 255 255 / .45)'),
    ]
  } },
  { name: 'Pips', w: 38, h: 11, draw: (p, z) => {
    const lit = Math.round((p / 100) * 8)
    return Array.from({ length: 8 }, (_, i) => {
      const at = ((i + 0.5) / 8) * 100
      return rect(i * 5, 0, 3, 11, 1.5, i <= lit ? toneOf(at, z) : 'rgb(255 255 255 / .15)', i === lit ? FAINT : {})
    })
  } },
  { name: 'Half gauge', w: 36, h: 20, clip: true, draw: (p, z) => {
    const at = (q) => { const a = ((180 + q * 1.8) * Math.PI) / 180; return [18 + 14.5 * Math.cos(a), 18 + 14.5 * Math.sin(a)] }
    const arc = (from, to, col) => path(`M${at(from)}A14.5 14.5 0 0 1 ${at(to)}`, 'none', { stroke: col, 'stroke-width': 3 })
    const [x, y] = at(p)
    return [arc(0, z.warn - 1, GO), arc(z.warn + 1, z.over - 1, WATCH), arc(z.over + 1, 100, OVER), dot(x, y, 4, '#000'), dot(x, y, 2.75, lightOf(p, z))]
  } },
  { name: 'Eclipse', w: 17, h: 17, draw: (p, z) => [
    clip('tp-eclipse', dot(8.5, 8.5, 8.5)),
    h('g', { 'clip-path': 'url(#tp-eclipse)' }, [dot(8.5, 8.5, 8.5, toneOf(p, z)), dot(-8.5 + 0.17 * p, 8.5, 8.5, '#000')]),
    dot(8.5, 8.5, 8, 'none', { stroke: 'rgb(255 255 255 / .22)' }),
  ] },
  { name: 'Token stack', w: 15, h: 16.5, draw: (p, z) => {
    const spent = Math.round((p / 100) * 4)
    return Array.from({ length: 4 }, (_, i) => i < spent
      ? rect(0.5, i * 4.5 + 0.5, 14, 2, 1, 'none', { stroke: 'rgb(255 255 255 / .22)' })
      : rect(0, i * 4.5, 15, 3, 1.5, toneOf(p, z), i === spent ? { opacity: 0.5 } : {}))
  } },
  { name: 'Hourglass', w: 14, h: 19, draw: (p, z) => {
    const glass = 'rgb(255 255 255 / .4)', top = 'M1.1 2.6H12.9L7 8.4Z', bottom = 'M7 10.6l5.9 5.8H1.1Z'
    return [
      rect(0, 0, 14, 1.5, 0.75, glass), path('M0 1.5h14L7 9.5Z', glass), path('M7 9.5l7 8H0Z', glass), rect(0, 17.5, 14, 1.5, 0.75, glass),
      clip('tp-glass-top', path(top)), clip('tp-glass-bottom', path(bottom)),
      path(top, '#000'), path(bottom, '#000'),
      rect(0, 2.6, 14, 0.058 * (100 - p), 0, toneOf(p, z), { 'clip-path': 'url(#tp-glass-top)' }),
      rect(0, 16.4 - 0.058 * p, 14, 0.058 * p, 0, toneOf(p, z), { 'clip-path': 'url(#tp-glass-bottom)' }),
    ]
  } },
  { name: 'Dotted arc', w: 19, h: 19, draw: (p, z) => {
    const lit = Math.round((p / 100) * 12)
    return Array.from({ length: 12 }, (_, i) => {
      const a = ((i * 30 - 90) * Math.PI) / 180
      return dot(9.5 + 8 * Math.cos(a), 9.5 + 8 * Math.sin(a), 1.5, i <= lit ? toneOf(p, z) : 'rgb(255 255 255 / .16)', i === lit ? FAINT : {})
    })
  } },
  { name: 'Dot matrix', w: 14.5, h: 14.5, draw: (p, z) => {
    const lit = Math.round((p / 100) * 9)
    return Array.from({ length: 9 }, (_, i) =>
      rect((i % 3) * 5.5, Math.floor(i / 3) * 5.5, 3.5, 3.5, 1, i <= lit ? toneOf(((i + 0.5) / 9) * 100, z) : 'rgb(255 255 255 / .15)', i === lit ? FAINT : {}))
  } },
  { name: 'Signal strength', w: 25, h: 14, draw: (p, z) => {
    const lit = Math.max(1, Math.ceil(((100 - p) / 100) * 6))
    return Array.from({ length: 6 }, (_, i) => rect(i * 4.5, 10.5 - 2 * i, 2.5, 3.5 + 2 * i, 1.25, i < lit ? toneOf(p, z) : 'rgb(255 255 255 / .14)'))
  } },
  { name: 'Thermometer', w: 10, h: 19, draw: (p, z) => {
    const column = 0.13 * p
    return [
      clip('tp-tube', rect(2, 0, 6, 13, 3)),
      h('g', { 'clip-path': 'url(#tp-tube)' }, [
        rect(2, 0, 6, 13, 0, 'rgb(255 255 255 / .15)'),
        rect(2, 13 - column, 6, column, 0, toneOf(p, z)),
        rect(2, 12.25 - column, 6, 1.5, 0.75, lightOf(p, z)),
      ]),
      dot(5, 14, 5, '#000'), dot(5, 14, 4, toneOf(p, z)),
    ]
  } },
]
const MarkSvg = ({ mark, pct, run }) =>
  h('svg', { viewBox: `0 0 ${mark.w} ${mark.h}`, width: mark.w, height: mark.h, style: { overflow: mark.clip ? 'hidden' : 'visible' } }, mark.draw(pct, CLAUDE, run))

// BorderEffect.swift's rendering spec: angles clockwise from twelve, straight
// alphas, one turn per duration. A light the app mirrors to run left to right
// has its table mirrored here too, and turns the other way.
const mirror = (stops) => [...stops].reverse().map(([a, tint, alpha]) => [360 - a, tint, alpha])
const dashes = (n, lit) => Array.from({ length: n }, (_, i) => [[(i * 360) / n, 'zone', 0.8], [(i * 360) / n + lit, 'zone', 0.8], [(i * 360) / n + lit, 'clear'], [((i + 1) * 360) / n, 'clear']]).flat()
const paint = (tint, alpha, tone, light) =>
  ({ zone: rgba(tone, alpha), head: rgba(light, alpha), safe: rgba(GO, alpha), watch: rgba(WATCH, alpha), over: rgba(OVER, alpha) })[tint] ?? 'transparent'
const conic = (stops, tone = GO, light = LIGHT[GO]) =>
  `conic-gradient(from var(--tp-a), ${stops.map(([a, tint, alpha = 0]) => `${paint(tint, alpha, tone, light)} ${a}deg`).join(', ')})`
const COMET = mirror([[0, 'clear'], [266.4, 'clear'], [324, 'zone', 0.33], [360, 'head', 1]])
const BORDERS = [
  { name: 'Comet', turns: [{ stops: COMET, s: 2.4, ccw: true }] },
  { name: 'Dual comet', turns: [{ stops: mirror([[0, 'clear'], [129.6, 'clear'], [169.2, 'zone', 0.33], [180, 'head', 1], [190.8, 'clear'], [309.6, 'clear'], [349.2, 'zone', 0.33], [360, 'head', 1]]), s: 3, ccw: true }] },
  { name: 'Zone sweep', turns: [{ stops: [[0, 'safe', 1], [120, 'watch', 1], [240, 'over', 1], [360, 'safe', 1]], s: 5 }] },
  { name: 'Marching dashes', turns: [{ stops: mirror(dashes(24, 5.36)), s: 9, ccw: true }] },
  { name: 'Pulse wave', turns: [{ stops: [[0, 'clear'], [172.8, 'clear'], [252, 'zone', 0.15], [309.6, 'zone', 0.8], [345.6, 'zone', 0.15], [360, 'clear']], s: 3.4 }] },
  { name: 'Quarter trace', turns: [{ stops: mirror([[0, 'zone', 0.9], [93.6, 'zone', 0.9], [93.6, 'clear'], [360, 'clear']]), s: 1.9, ccw: true }] },
  { name: 'Counter pair', turns: [
    { stops: [[0, 'clear'], [302.4, 'clear'], [345.6, 'zone', 0.3], [360, 'head', 1]], s: 2.8 },
    { stops: [[0, 'clear'], [302.4, 'clear'], [345.6, 'zone', 0.2], [360, 'zone', 1]], s: 3.6, ccw: true },
  ] },
  { name: 'Breathe', solid: { alpha: 1, pulse: true, s: 1.8 } },
  { name: 'Side drip', bands: [['left', 'zone', 2.6, 0], ['right', 'zone', 2.6, 1.3]] },
  { name: 'Edge runners', bands: [['right', 'zone', 2.2, 0], ['bottom', 'head', 2.2, 0.73], ['left', 'zone', 2.2, 1.46]] },
  { name: 'Breathe glow', solid: { alpha: 0.3, glow: true, s: 2 } },
  { name: 'Bottom sweep', bands: [['bottom', 'head', 2.4, 0]] },
]

const SPLITS = computed(() => [
  { key: 'model', rows: [['Opus 5.5', 54], ['Sonnet 5', 38], ['Haiku 4.5', 8]] },
  { key: 'project', rows: [['platform-api', 47], ['token-pacer', 31], ['scratch', 22]] },
  { key: 'kind', rows: [[t('demo.kinds.output'), 46], [t('demo.kinds.cacheRead'), 24], [t('demo.kinds.cacheWrite'), 19], [t('demo.kinds.input'), 11]] },
])
const RANK = [WATCH, INFO, 'rgb(255 255 255 / .3)']

// 26 five-minute buckets, the one in progress in the session's tone.
const SPARK = Array.from({ length: 26 }, (_, i) =>
  Math.max(3, 40 * (0.22 + 0.78 * Math.sin((i / 25) * Math.PI * 0.9 + 0.35) ** 2) * (0.82 + 0.18 * Math.sin(i * 2.9))))

// Ninety days on a calendar grid, one column a week, shaded against the
// busiest day in range: there is no daily cap for a day to be a share of.
const HISTORY = (() => {
  const now = new Date()
  const day = (offset) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset)
  const days = Array.from({ length: 90 }, (_, i) => {
    const d = day(i - 89)
    const weekend = d.getDay() === 0 || d.getDay() === 6
    const v = i % 11 === 4 ? 0 : (weekend ? 0.2 : 1) * (0.5 + 0.5 * Math.sin(i / 8)) * (0.55 + 0.45 * Math.abs(Math.sin(i * 12.9898)))
    return { d, v }
  })
  const peak = days.reduce((a, b) => (b.v > a.v ? b : a))
  const first = day(-89 - day(-89).getDay())
  const columns = Math.ceil((89 + day(-89).getDay() + 1) / 7)
  const cells = Array.from({ length: columns * 7 }, (_, i) => {
    const hit = days[Math.floor(i / 7) * 7 + (i % 7) - day(-89).getDay()]
    const pct = hit ? (hit.v / peak.v) * 100 : 0
    return pct > 0 ? rgba(toneOf(pct), 0.35 + 0.65 * Math.min(1, pct / 100)) : 'rgb(255 255 255 / .06)'
  })
  const months = Array.from({ length: columns }, (_, c) => {
    const start = new Date(first.getFullYear(), first.getMonth(), first.getDate() + c * 7)
    const before = new Date(start.getFullYear(), start.getMonth(), start.getDate() - 7)
    return c === 0 || start.getMonth() !== before.getMonth() ? start.toLocaleDateString('en-US', { month: 'short' }) : ''
  })
  return { cells, months, busiest: peak.d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) }
})()

const index = ref(0)
const held = ref(false)
const clock = ref('')
const lap = ref(0)

const state = computed(() => STATES[index.value])
const is = (key) => state.value.key === key
const burning = computed(() => BURNING.includes(state.value.key))
const chasing = computed(() => CHASING.includes(state.value.key))
const tone = computed(() => toneOf(state.value.pct))
const status = computed(() => t(`demo.status.${state.value.pct >= CLAUDE.over ? 'over' : state.value.pct >= CLAUDE.warn ? 'watch' : 'go'}`))

// The shell springs between sizes on Tokens.spring — spring(duration: 0.6,
// bounce: 0.18) — traced into --ease-spring in style.css.
const shell = computed(() => ({
  width: state.value.w,
  height: state.value.h,
  borderRadius: `0 0 ${state.value.r}px ${state.value.r}px`,
  // The warning is the one state that arrives unasked, so it alone casts a shadow.
  boxShadow: [`inset 0 0 0 1px rgb(255 255 255 / ${IDLE.includes(state.value.key) ? 0.06 : 0.13})`, is('warn') && '0 22px 62px rgb(0 0 0 / .66)']
    .filter(Boolean).join(', '),
}))
const light = computed(() => ({
  borderRadius: `0 0 ${state.value.r + 1.5}px ${state.value.r + 1.5}px`,
  backgroundImage: conic(COMET, tone.value, LIGHT[tone.value]),
}))

const fmtClock = () => {
  const d = new Date()
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()]
  return `${day} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// Any always-on animation keeps the compositor producing frames, so the only
// way the page goes idle is for every one of them to stop. Off-screen, in a
// background tab, or behind another app nobody is watching, so stop there.
// hasFocus() is the case the other two miss: an unfocused window is still
// visible and still not hidden, so only blur/focus report it.
const root = ref(null)
const asleep = ref(false)
const offscreen = ref(false)
const refresh = () => (asleep.value = offscreen.value || document.hidden || !document.hasFocus())

// Each state holds for its own time; a hold that ends while paused waits out
// another one rather than skipping ahead.
let cycle
const schedule = () => {
  clearTimeout(cycle)
  cycle = setTimeout(() => {
    if (!held.value && !asleep.value) index.value = (index.value + 1) % STATES.length
    schedule()
  }, state.value.hold)
}

// AppearancePane.run(): 0 → watch → over → 100, twenty steps a zone, 100ms each.
let lapTimer
watch(() => state.value.key, (key) => {
  clearInterval(lapTimer)
  lap.value = 0
  if (key !== 'looks') return
  let step = 0
  const zones = [[0, CLAUDE.warn], [CLAUDE.warn, CLAUDE.over], [CLAUDE.over, 100]]
  lapTimer = setInterval(() => {
    if (asleep.value) return
    step = (step + 1) % 63
    const [from, to] = zones[Math.floor(step / 21)]
    lap.value = Math.round(from + ((to - from) * (step % 21)) / 20)
  }, 100)
})

let tick, io
onMounted(() => {
  clock.value = fmtClock()
  tick = setInterval(() => (clock.value = fmtClock()), 15000)
  schedule()
  io = new IntersectionObserver(([e]) => { offscreen.value = !e.isIntersecting; refresh() })
  io.observe(root.value)
  document.addEventListener('visibilitychange', refresh)
  addEventListener('blur', refresh)
  addEventListener('focus', refresh)
})
onUnmounted(() => {
  clearTimeout(cycle)
  clearInterval(tick)
  clearInterval(lapTimer)
  io?.disconnect()
  document.removeEventListener('visibilitychange', refresh)
  removeEventListener('blur', refresh)
  removeEventListener('focus', refresh)
})
</script>

<template>
  <div
    ref="root"
    class="flex min-w-0 flex-col gap-[1.125rem]"
    :class="asleep && 'demo-asleep'"
    role="img"
    :aria-label="t('demo.label')"
    @mouseenter="held = true"
    @mouseleave="held = false"
  >
    <!-- Mac lid -->
    <div
      class="relative box-border w-full overflow-hidden rounded-t-2xl rounded-b-md bg-panel px-[.55rem] pt-[.55rem] ring-1 ring-white/7 shadow-[0_2.5rem_7.5rem_1.5rem_rgba(0,0,0,.72)]"
    >
      <div
        class="stage relative h-[24rem] overflow-hidden rounded-t-[.65rem] rounded-b-[.2rem]"
        style="background: radial-gradient(70% 60% at 22% 18%, #3d5f80, transparent 68%), radial-gradient(80% 70% at 82% 84%, #2f4438, transparent 70%), linear-gradient(152deg, #223044, #1b2027 58%, #281f2e)"
      >
        <div
          class="absolute inset-x-0 top-0 flex h-[1.55rem] items-center justify-between rounded-t-[.65rem] bg-black/78 px-[.8rem] text-[.72rem] text-white/80"
        >
          <span class="font-semibold">Token Pacer</span>
          <span>{{ clock }}</span>
        </div>

        <!-- Settings, General: every provider on its own two marks -->
        <div
          v-if="is('prefs')"
          class="absolute top-1/2 left-1/2 z-[3] w-[26.25rem] -translate-x-1/2 -translate-y-[46%] scale-[.72] overflow-hidden rounded-xl bg-[#141416] ring-1 ring-white/7 shadow-[0_1.875rem_4.375rem_rgba(0,0,0,.6)]"
        >
          <div class="relative flex h-7 items-center px-3">
            <div class="z-[1] flex gap-2">
              <span v-for="n in 3" :key="n" class="size-3 rounded-full bg-[#3f4046]" />
            </div>
            <span class="absolute inset-x-0 text-center text-[13px] font-semibold text-white/55">Token Pacer</span>
          </div>
          <div class="flex flex-col gap-4 px-[26px] pt-3 pb-[26px]">
            <div class="flex items-center gap-2.5">
              <span class="font-mono text-[9.5px] tracking-[.15em] text-white/38 uppercase">{{ t('demo.prefs.providers') }}</span>
              <span class="flex-1" />
              <span class="flex items-center gap-[5px] text-[11.5px] text-white/42">
                <svg viewBox="0 0 16 16" class="size-2.5"><circle cx="8" cy="8" r="8" :fill="GO" /><path d="m4.6 8.3 2.3 2.3 4.6-5" fill="none" stroke="#000" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" /></svg>
                {{ t('demo.prefs.ready') }}
              </span>
            </div>
            <span class="text-[11px] text-white/30">{{ t('demo.prefs.tracked') }}</span>
            <div v-for="a in AGENTS" :key="a.word" class="flex flex-col gap-[9px] pb-1">
              <div class="flex min-h-7 items-center gap-4">
                <span class="flex-1 text-[12.5px] text-white/85">{{ a.name }}</span>
                <span class="flex size-3.5 items-center justify-center rounded-[3.5px] bg-[#3c3d43] ring-1 ring-white/20">
                  <svg viewBox="0 0 10 10" class="size-2.5"><path d="m2 5.3 2 2 4-4.6" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                </span>
              </div>
              <div class="flex items-center gap-3.5">
                <div class="relative h-4 flex-1">
                  <div class="absolute inset-x-0 top-1 flex h-2 overflow-hidden rounded-full">
                    <span :style="{ width: `${a.zone.warn}%`, background: GO }" />
                    <span :style="{ width: `${a.zone.over - a.zone.warn}%`, background: WATCH }" />
                    <span class="flex-1" :style="{ background: OVER }" />
                  </div>
                  <span
                    v-for="at in [a.zone.warn, a.zone.over]"
                    :key="at"
                    class="absolute top-0 size-4 -translate-x-1/2 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,.4)] ring-[.5px] ring-black/25"
                    :style="{ left: `${at}%` }"
                  />
                </div>
                <span class="flex items-baseline gap-1 text-[11px]">
                  <span class="text-white/35">{{ t('demo.prefs.watch') }}</span>
                  <span class="font-mono font-semibold text-watch">{{ a.zone.warn }}</span>
                </span>
                <span class="flex items-baseline gap-1 text-[11px]">
                  <span class="text-white/35">{{ t('demo.prefs.over') }}</span>
                  <span class="font-mono font-semibold text-over">{{ a.zone.over }}</span>
                </span>
                <svg viewBox="0 0 16 16" class="size-[11.5px] text-white/40" fill="none" stroke="currentColor" stroke-width="1.3">
                  <rect x="1.5" y="4.5" width="9.5" height="10" rx="2" /><path d="M5 2.2h7.3a2 2 0 0 1 2 2V11" stroke-linecap="round" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Settings, Appearance: twelve marks walking a lap, twelve running borders -->
        <div
          v-if="is('looks')"
          class="absolute top-1/2 left-1/2 z-[3] w-[26.25rem] -translate-x-1/2 -translate-y-[46%] scale-[.72] overflow-hidden rounded-xl bg-[#141416] ring-1 ring-white/7 shadow-[0_1.875rem_4.375rem_rgba(0,0,0,.6)]"
        >
          <div class="relative flex h-7 items-center px-3">
            <div class="z-[1] flex gap-2">
              <span v-for="n in 3" :key="n" class="size-3 rounded-full bg-[#3f4046]" />
            </div>
            <span class="absolute inset-x-0 text-center text-[13px] font-semibold text-white/55">Token Pacer</span>
          </div>
          <div class="flex flex-col gap-3 px-[26px] pt-2 pb-[22px]">
            <div class="flex items-center justify-between gap-4">
              <span class="font-mono text-[9.5px] tracking-[.15em] text-white/38 uppercase">{{ t('demo.looks.marks') }}</span>
              <span class="font-mono text-[11.5px] tabular-nums" :style="{ color: toneOf(lap) }">{{ lap }}%</span>
            </div>
            <div class="grid grid-cols-4 gap-x-2 gap-y-2">
              <div v-for="(m, i) in MARKS" :key="m.name" class="flex min-w-0 flex-col items-center gap-1">
                <div
                  class="flex h-[30px] w-full items-center justify-center rounded-lg bg-black"
                  :class="i === 0 ? 'inset-ring-[1.5px] inset-ring-watch' : 'inset-ring inset-ring-white/8'"
                >
                  <MarkSvg :mark="m" :pct="lap" :run="i === 0" />
                </div>
                <span class="w-full truncate text-center text-[10px] leading-none" :class="i === 0 ? 'text-white/90' : 'text-white/45'">{{ m.name }}</span>
              </div>
            </div>
            <div class="flex items-center justify-between gap-4 pt-1">
              <span class="font-mono text-[9.5px] tracking-[.15em] text-white/38 uppercase">{{ t('demo.looks.borders') }}</span>
              <span class="relative h-[18px] w-[30px] rounded-full bg-[#3c3d43] ring-1 ring-white/15"><span class="absolute top-[2px] right-[2px] size-3.5 rounded-full bg-white" /></span>
            </div>
            <div class="grid grid-cols-4 gap-x-2 gap-y-2">
              <div v-for="(b, i) in BORDERS" :key="b.name" class="flex min-w-0 flex-col items-center gap-1 pt-0.5">
                <div class="relative h-5 w-full">
                  <div v-if="b.solid?.glow" class="tp-glow absolute inset-0 rounded-b-[9px]" :style="{ '--c': GO, animationDuration: `${b.solid.s / 2}s` }" />
                  <div class="absolute top-0 -right-[1.5px] -bottom-[1.5px] -left-[1.5px] overflow-hidden rounded-b-[10.5px]">
                    <div
                      v-for="(r, j) in b.turns"
                      :key="j"
                      class="tp-turn absolute inset-0"
                      :style="{ backgroundImage: conic(r.stops), animationDuration: `${r.s}s`, animationDirection: r.ccw ? 'reverse' : 'normal' }"
                    />
                    <div
                      v-if="b.solid"
                      class="absolute inset-0"
                      :class="b.solid.pulse && 'tp-breathe'"
                      :style="{ background: rgba(GO, b.solid.alpha), animationDuration: `${b.solid.s / 2}s` }"
                    />
                    <div
                      v-for="([edge, tint, s, begin], j) in b.bands"
                      :key="`b${j}`"
                      class="absolute"
                      :class="edge === 'bottom' ? 'tp-band-x bottom-0 left-0 h-[1.5px] w-[46%]' : ['tp-band-y top-0 h-[52%] w-[1.5px]', edge === 'left' ? 'left-0' : 'right-0']"
                      :style="{
                        backgroundImage: `linear-gradient(${edge === 'bottom' ? 90 : 180}deg, transparent, ${tint === 'head' ? LIGHT[GO] : GO}, transparent)`,
                        animationDuration: `${s}s`,
                        animationDelay: `${begin}s`,
                      }"
                    />
                  </div>
                  <div
                    class="absolute inset-0 rounded-b-[9px] bg-black"
                    :class="i === 0 ? 'inset-ring-[1.5px] inset-ring-watch' : 'inset-ring inset-ring-white/8'"
                  />
                </div>
                <span class="w-full truncate text-center text-[10px] leading-none" :class="i === 0 ? 'text-white/90' : 'text-white/45'">{{ b.name }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- The notch shell -->
        <div class="absolute top-0 left-1/2 z-[4] -translate-x-1/2">
          <!-- Comet, the default running light, in the zone of the reading. It
               lies outside the shell and never along the top edge, which is
               against the hardware; it runs only while a model is answering. -->
          <div
            class="tp-light absolute top-0 -right-[1.5px] -bottom-[1.5px] -left-[1.5px]"
            :class="chasing && 'on'"
            :style="light"
          />
          <div class="tp-shell relative z-[1] flex flex-col items-center overflow-hidden bg-black" :style="shell">
            <!-- The band: the same row in every state but the cap and the panel -->
            <div v-if="is('red')" class="flex h-[2.125rem] shrink-0 items-center gap-2.5 self-stretch px-4">
              <span class="size-1.5 rounded-full bg-over" />
              <Odo :text="state.reset" class="font-mono text-[12px] font-medium text-over" />
            </div>
            <div v-else-if="is('panel')" class="flex h-[2.125rem] shrink-0 items-center gap-[7px] self-stretch pr-[13px] pl-[11px]">
              <span class="flex items-center gap-1.5 font-mono text-[9.5px] font-semibold tracking-[.15em]" :style="{ color: tone }">
                CLAUDE
                <svg viewBox="0 0 8 6" class="h-[5px] w-[7px] text-white/35" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="m1 1.5 3 3 3-3" /></svg>
              </span>
              <Badge :key="state.jobs" :n="state.jobs" :scale="1.15" />
              <span class="flex-1" />
              <svg viewBox="0 0 16 16" class="size-[11.5px] text-white/42" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2 9.5 6.5M9.5 3v3.5H13M2 14l4.5-4.5M6.5 13V9.5H3" />
              </svg>
            </div>
            <div v-else class="flex h-[2.125rem] shrink-0 items-center justify-between self-stretch px-[15px]">
              <div class="flex items-center gap-3">
                <Capsule :width="36" :pct="state.pct" :running="burning" />
                <Odo :text="`${state.pct}%`" class="font-mono text-[12px] font-medium" :style="{ color: tone }" />
              </div>
              <div class="flex items-center gap-1">
                <Badge v-if="state.jobs" :key="state.jobs" :n="state.jobs" />
                <Odo :text="state.reset" class="font-mono text-[11.5px] text-white/50" />
              </div>
            </div>

            <!-- Hover: every agent on one scale, the pinned one washed in its zone -->
            <div v-if="is('hover')" class="flex w-[24.5rem] shrink-0 flex-col gap-[11px] px-[18px] pt-1 pb-2.5">
              <div class="flex items-baseline justify-between gap-2.5">
                <span class="text-[13px] font-semibold text-white">{{ status }}</span>
                <span class="font-mono text-[9.5px] text-white/34">{{ t('demo.updated') }}</span>
              </div>
              <div
                v-for="(a, i) in AGENTS"
                :key="a.word"
                class="-mx-2 -my-1 flex items-center gap-[14px] rounded-[7px] px-2 py-1"
                :style="{ background: i === 0 ? rgba(toneOf(a.pct, a.zone), 0.15) : undefined }"
              >
                <span
                  class="w-12 shrink-0 font-mono text-[9.5px] font-semibold tracking-[.1em]"
                  :style="{ color: i === 0 ? toneOf(a.pct, a.zone) : 'rgb(255 255 255 / .62)' }"
                >{{ a.word }}</span>
                <Capsule class="min-w-0 flex-1" :pct="a.pct" :week="a.week" :zone="a.zone" :running="a.jobs > 0" />
                <Odo :text="`${a.pct}%`" class="w-7 shrink-0 justify-end font-mono text-[11px] font-medium" :style="{ color: toneOf(a.pct, a.zone) }" />
                <span class="w-7 shrink-0 text-right font-mono text-[9.5px] text-white/50">{{ a.week == null ? '' : `${a.week}%` }}</span>
                <span class="-mr-1.5 w-[42px] shrink-0 text-right font-mono text-[9.5px] whitespace-nowrap text-white/42">{{ a.reset }}</span>
                <span class="flex w-6 shrink-0 justify-center"><Badge v-if="a.jobs" :n="a.jobs" /></span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="min-w-0 flex-1 truncate font-mono text-[9.5px] text-white/34">{{ t('demo.footer', { name: AGENTS[0].name, pct: `${AGENTS[0].pct}%` }) }}</span>
                <svg viewBox="0 0 16 16" class="size-[11px] text-white/42" fill="none" stroke="currentColor">
                  <circle cx="8" cy="8" r="5.6" stroke-width="2.2" stroke-dasharray="2.1 2.3" /><circle cx="8" cy="8" r="4.2" stroke-width="1.5" />
                </svg>
                <svg viewBox="0 0 16 16" class="size-[11px] text-white/42" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9.5 2.5h4v4M13.5 2.5 9 7M6.5 13.5h-4v-4M2.5 13.5 7 9" />
                </svg>
              </div>
            </div>

            <!-- The warning: the band's own mark twice the size, the figure, one line -->
            <div v-else-if="is('warn')" class="flex w-[24.5rem] shrink-0 items-center gap-4 px-5 pt-2.5 pb-4">
              <Capsule :width="36" :s="2" :pct="state.pct" :running="burning" />
              <div class="flex flex-col gap-1">
                <div class="flex items-end gap-2">
                  <Odo :text="`${state.pct}%`" class="font-mono text-[26px] leading-none font-medium" :style="{ color: tone }" />
                  <span class="pb-[5px] font-mono text-[10px] font-semibold tracking-[.11em] text-white/50">CLAUDE</span>
                </div>
                <span class="text-[12.5px] whitespace-nowrap text-white/66">{{ t('demo.wrapSoon', { time: state.reset }) }}</span>
              </div>
            </div>

            <!-- Pinned panel, drawn at the app's 752pt and scaled to the lid -->
            <div v-else-if="is('panel')" class="h-0 w-[26rem] shrink-0">
              <div class="flex w-[752px] origin-top-left scale-[.553] flex-col gap-[18px] px-[22px] pt-2.5 pb-[22px]">
                <div class="flex items-center gap-6">
                  <div class="flex w-[152px] shrink-0 flex-col items-center gap-3">
                    <div class="flex h-[60px] items-center"><Capsule :width="36" :s="3" :pct="state.pct" :running="burning" /></div>
                    <Odo :text="`${state.pct}%`" class="font-mono text-[30px] font-medium" :style="{ color: tone }" />
                    <span class="text-[8.5px] tracking-[.04em] text-white/36">{{ t('demo.window') }}</span>
                    <span class="text-[11.5px] text-white/60">{{ t('demo.resetsIn', { time: state.reset }) }}</span>
                  </div>
                  <div class="flex min-w-0 flex-1 flex-col gap-4">
                    <div class="flex flex-col gap-[7px]">
                      <div class="flex items-baseline justify-between gap-3.5 text-[11px]">
                        <span class="text-white/44">{{ t('demo.weeklyCap') }}</span>
                        <span class="font-mono text-white/70">{{ t('demo.weeklyNote', { pct: `${AGENTS[0].week}%` }) }}</span>
                      </div>
                      <div class="h-[7px] overflow-hidden rounded-full bg-white/12">
                        <div class="h-full rounded-full" :style="{ width: `${AGENTS[0].week}%`, background: toneOf(AGENTS[0].week) }" />
                      </div>
                    </div>
                    <div class="flex flex-col gap-2">
                      <div class="flex items-baseline justify-between gap-3.5 text-[11px]">
                        <span class="text-white/44">{{ t('demo.activity') }}</span>
                        <span class="font-mono text-white/70">{{ t('demo.activityNote') }}</span>
                      </div>
                      <div class="flex h-10 items-end gap-[3px]">
                        <div
                          v-for="(bar, i) in SPARK"
                          :key="i"
                          class="min-w-0 flex-1 rounded-[2px]"
                          :style="{ height: `${bar}px`, background: i === SPARK.length - 1 ? tone : 'rgb(255 255 255 / .24)' }"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div class="h-px bg-white/8" />
                <div class="grid grid-cols-3 gap-[22px]">
                  <div v-for="g in SPLITS" :key="g.key" class="flex min-w-0 flex-col gap-[9px]">
                    <span class="text-[11px] text-white/40">{{ t(`demo.groups.${g.key}`) }}</span>
                    <div v-for="([name, share], i) in g.rows" :key="name" class="flex items-center gap-2">
                      <div class="flex min-w-0 flex-1 flex-col gap-1">
                        <span class="truncate text-[11.5px] text-white/60">{{ name }}</span>
                        <div class="h-[3px] overflow-hidden rounded-full bg-white/10">
                          <div class="h-full rounded-full" :style="{ width: `${share}%`, background: RANK[Math.min(i, 2)] }" />
                        </div>
                      </div>
                      <span class="w-9 text-right font-mono text-[10.5px] text-white/48">{{ share }}%</span>
                    </div>
                  </div>
                </div>
                <div class="h-px bg-white/8" />
                <div class="flex flex-col gap-2.5">
                  <span class="text-[11px] text-white/40">{{ t('demo.history', { day: HISTORY.busiest }) }}</span>
                  <div class="flex items-start gap-1">
                    <div class="flex flex-col gap-1 pt-[15px] font-mono text-[9px] text-white/30">
                      <span v-for="n in 7" :key="n" class="flex h-[15px] w-[22px] items-center">{{ ['', 'Mon', '', 'Wed', '', 'Fri', ''][n - 1] }}</span>
                    </div>
                    <div class="flex flex-col gap-1">
                      <div class="flex h-[11px] gap-1 font-mono text-[9px] leading-none text-white/30">
                        <span v-for="(m, c) in HISTORY.months" :key="c" class="w-[15px] shrink-0 overflow-visible whitespace-nowrap">{{ m }}</span>
                      </div>
                      <div class="grid grid-flow-col grid-rows-7 gap-1">
                        <span v-for="(fill, i) in HISTORY.cells" :key="i" class="size-[15px] rounded-[3px]" :style="{ background: fill }" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex flex-col items-center gap-[.55rem]">
      <span :key="state.key" class="animate-cap-in text-center text-[.9rem] text-balance text-white/65">{{ t(`demo.captions.${state.key}`) }}</span>
      <div class="flex items-center gap-[.625rem]">
        <div class="flex gap-[.375rem]">
          <span
            v-for="(s, i) in STATES"
            :key="s.key"
            class="size-[.3rem] rounded-full transition-colors duration-300"
            :style="{ background: i === index ? tone : 'rgba(255,255,255,.16)' }"
          />
        </div>
        <div class="flex items-center gap-[.375rem]" :title="t('demo.pauseHint')">
          <div class="flex items-center gap-[.125rem]">
            <span v-for="n in 2" :key="n" class="h-2 w-[.125rem] rounded-full transition-colors" :class="held ? 'bg-go' : 'bg-white/34'" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* The mock is drawn at a fixed 27rem design width; zoom keeps it whole on
   narrow screens instead of letting the lid's overflow slice it.
   ponytail: stepped, not fluid — CSS can't divide lengths into a unitless zoom. */
@media (max-width: 32.5rem) { .stage { zoom: .91 } }
@media (max-width: 30rem)   { .stage { zoom: .80 } }
@media (max-width: 26.875rem) { .stage { zoom: .71 } }
@media (max-width: 24.375rem) { .stage { zoom: .64 } }
@media (max-width: 22.5rem)  { .stage { zoom: .54 } }
</style>
