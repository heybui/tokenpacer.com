<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from '../i18n'

const { t } = useI18n()

const GO = '#3ec98a'
const WATCH = '#e8b33c'
const OVER = '#e2543f'
const INFO = '#5aa9d6'
const MUTED = 'rgba(255,255,255,.3)'

const PILL = { w: '14rem', h: '2.125rem', r: '.8rem' }
const WIDE = { w: '24.5rem', h: '5.875rem', r: '1.5rem' }

const STATES = [
  { key: 'pill', pct: 58, weekly: 55, reset: '2h 06m', ...PILL },
  { key: 'hover', pct: 58, weekly: 55, reset: '2h 06m', ...WIDE },
  { key: 'panel', pct: 58, weekly: 55, reset: '2h 06m', w: '26rem', h: '11.625rem', r: '1.5rem' },
  { key: 'warn', pct: 90, weekly: 78, reset: '0h 42m', ...WIDE },
  { key: 'red', pct: 100, weekly: 82, reset: '0h 22m', ...PILL },
  { key: 'reset', pct: 0, weekly: 12, reset: '5h 00m', ...PILL },
  { key: 'prefs', pct: 58, weekly: 55, reset: '2h 06m', ...PILL },
  { key: 'looks', pct: 58, weekly: 55, reset: '2h 06m', ...PILL },
]

const DIM = 'rgba(255,255,255,.2)'
const r2 = (n) => Number(n.toFixed(2))

// The app's twelve marks. Every one draws the same reading at menu-bar size —
// which is the whole point of the grid: you pick by watching, not by name.
const MARKS = [
  ['Capsule bar', (p, c) => [
    { t: 'rect', a: { x: 1, y: 5.6, width: 30, height: 2.8, rx: 1.4, fill: GO } },
    { t: 'rect', a: { x: 32, y: 5.6, width: 5, height: 2.8, rx: 1.4, fill: WATCH } },
    { t: 'rect', a: { x: 38, y: 5.6, width: 5, height: 2.8, rx: 1.4, fill: OVER } },
    { t: 'rect', a: { x: r2(1 + 42 * p - 0.8), y: 2.4, width: 1.6, height: 9.2, rx: 0.8, fill: c } },
  ]],
  ['Ring wings', (p, c) => [8, 36].flatMap((cx) => [
    { t: 'circle', a: { cx, cy: 7, r: 5, fill: 'none', stroke: DIM, 'stroke-width': 1.8 } },
    { t: 'circle', a: { cx, cy: 7, r: 5, fill: 'none', stroke: c, 'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-dasharray': `${r2(p * 31.4)} 99`, transform: `rotate(-90 ${cx} 7)` } },
  ])],
  ['Notch tank', (p, c) => [
    { t: 'rect', a: { x: 8, y: 1.6, width: 28, height: 10.8, rx: 3, fill: 'none', stroke: DIM, 'stroke-width': 1.4 } },
    { t: 'rect', a: { x: 9.6, y: 3.2, width: r2(24.8 * p), height: 7.6, rx: 2, fill: c } },
  ]],
  ['Pips', (p, c) => Array.from({ length: 10 }, (_, i) => (
    { t: 'rect', a: { x: r2(1.5 + i * 4.2), y: 4.4, width: 2.6, height: 5.2, rx: 1.3, fill: i < Math.round(p * 10) ? c : DIM } }
  ))],
  ['Half gauge', (p, c) => [
    { t: 'path', a: { d: 'M10 12a12 12 0 0 1 24 0', fill: 'none', stroke: DIM, 'stroke-width': 2 } },
    { t: 'path', a: { d: 'M10 12a12 12 0 0 1 24 0', fill: 'none', stroke: c, 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-dasharray': `${r2(p * 37.7)} 99` } },
  ]],
  ['Eclipse', (p, c) => [
    { t: 'circle', a: { cx: 22, cy: 7, r: 5.6, fill: c } },
    { t: 'circle', a: { cx: r2(22 - 11.4 * p), cy: 7, r: 5.6, fill: '#000' } },
    { t: 'circle', a: { cx: 22, cy: 7, r: 5.6, fill: 'none', stroke: DIM, 'stroke-width': 1 } },
  ]],
  ['Token stack', (p, c) => Array.from({ length: 5 }, (_, i) => (
    { t: 'rect', a: { x: 16, y: r2(11.2 - i * 2.4), width: 12, height: 1.8, rx: 0.9, fill: i < Math.round(p * 5) ? c : DIM } }
  ))],
  ['Hourglass', (p, c) => [
    { t: 'path', a: { d: 'M16 1.4h12l-6 5.6z', fill: c, opacity: r2(1 - p) } },
    { t: 'path', a: { d: 'M16 12.6h12l-6-5.6z', fill: c, opacity: r2(p) } },
    { t: 'path', a: { d: 'M16 1.4h12l-6 5.6 6 5.6H16l6-5.6z', fill: 'none', stroke: DIM, 'stroke-width': 1 } },
  ]],
  ['Dotted arc', (p, c) => Array.from({ length: 9 }, (_, i) => {
    const a = Math.PI * (1 - i / 8)
    return { t: 'circle', a: { cx: r2(22 + 14 * Math.cos(a)), cy: r2(11.5 - 9 * Math.sin(a)), r: 1.25, fill: i < Math.round(p * 9) ? c : DIM } }
  })],
  ['Dot matrix', (p, c) => Array.from({ length: 24 }, (_, i) => (
    { t: 'circle', a: { cx: r2(4.5 + (i % 8) * 5), cy: r2(3.5 + Math.floor(i / 8) * 3.5), r: 1.2, fill: i < Math.round(p * 24) ? c : DIM } }
  ))],
  ['Signal strength', (p, c) => Array.from({ length: 5 }, (_, i) => (
    { t: 'rect', a: { x: r2(12 + i * 4.4), y: r2(12 - (3 + i * 2.2)), width: 3, height: r2(3 + i * 2.2), rx: 1, fill: i < Math.round(p * 5) ? c : DIM } }
  ))],
  ['Thermometer', (p, c) => [
    { t: 'rect', a: { x: 10, y: 4.8, width: 26, height: 4.4, rx: 2.2, fill: DIM } },
    { t: 'rect', a: { x: 10, y: 4.8, width: r2(26 * p), height: 4.4, rx: 2.2, fill: c } },
    { t: 'circle', a: { cx: 9, cy: 7, r: 3.6, fill: c } },
  ]],
]

// The app's twelve running lights. All twelve are the same light on the same
// outline, differing only in mechanism — so they cost one angle and four
// keyframes between them. The top edge is never lit: it lies on the hardware.
// The two edge-travelling lights need a background smaller than the outline.
const SIZED = { 'Side drip': '100% 70%', 'Bottom sweep': '50% 100%' }
const RUN = (d, extra = '') => `tp-run ${d} linear infinite${extra}`
const BORDERS = [
  ['Comet', 'conic-gradient(from var(--tp-a), transparent 0 74%, currentColor 97%, transparent)', RUN('2.6s')],
  ['Dual comet', 'conic-gradient(from var(--tp-a), transparent 0 34%, currentColor 49%, transparent 50% 84%, currentColor 99%, transparent)', RUN('2.6s')],
  ['Zone sweep', 'conic-gradient(from var(--tp-a), currentColor 0 18%, transparent 32%)', RUN('3.4s')],
  ['Marching dashes', 'repeating-conic-gradient(from var(--tp-a), currentColor 0 5deg, transparent 5deg 14deg)', RUN('7s')],
  ['Pulse wave', 'linear-gradient(currentColor, currentColor)', 'tp-pulse 1.4s ease-in-out infinite'],
  ['Quarter trace', 'conic-gradient(from var(--tp-a), currentColor 0 24%, transparent 24%)', 'tp-run 3.2s steps(4) infinite'],
  ['Counter pair', 'conic-gradient(from var(--tp-a), transparent 0 34%, currentColor 49%, transparent 50% 84%, currentColor 99%, transparent)', RUN('3s', ' reverse')],
  ['Breathe', 'linear-gradient(currentColor, currentColor)', 'tp-breathe 3.4s ease-in-out infinite'],
  ['Breathe glow', 'linear-gradient(currentColor, currentColor)', 'tp-breathe 3.4s ease-in-out infinite'],
  ['Edge runners', 'repeating-conic-gradient(from var(--tp-a), currentColor 0 2deg, transparent 2deg 50deg)', RUN('2s')],
  ['Side drip', 'linear-gradient(180deg, transparent, currentColor 50%, transparent)', 'tp-drip 2.2s linear infinite'],
  ['Bottom sweep', 'linear-gradient(90deg, transparent, currentColor, transparent)', 'tp-sweep 2.4s linear infinite'],
]

const SPLITS = [
  { title: 'model', rows: [['Opus 4.6', 54, WATCH], ['Sonnet 4.6', 38, INFO], ['Haiku', 8, MUTED]] },
  { title: 'project', rows: [['platform-api', 47, WATCH], ['token-pacer', 31, INFO], ['scratch', 22, MUTED]] },
  { title: 'provider', rows: [['Claude Code', 78, WATCH], ['Codex', 17, INFO], ['Copilot', 5, MUTED]] },
]

const index = ref(0)
const held = ref(false)
const clock = ref('')

// Tone rule, same as the app: green < 75, amber 75–90, red > 90.
const toneOf = (p) => (p >= 90 ? OVER : p >= 75 ? WATCH : GO)
const lightOf = (p) => (p >= 90 ? '#f4ab9e' : p >= 75 ? '#fbcda2' : '#a5f0cd')

const state = computed(() => STATES[index.value])
const is = (key) => state.value.key === key
const calm = computed(() => ['panel', 'reset', 'prefs', 'looks'].includes(state.value.key))
const tone = computed(() => (is('reset') ? GO : toneOf(state.value.pct)))
const filled = computed(() => (is('reset') ? 100 : state.value.pct))
// The ring reads full on reset (quota restored) but the mark drops back to the
// start of the bar — it tracks spend, not headroom. Clamped so it stays visible.
const markAt = computed(() => Math.max(2, Math.min(98, is('reset') ? 2 : state.value.pct)))

const ring = computed(() => `conic-gradient(${tone.value} ${filled.value}%, rgba(255,255,255,.14) 0)`)
const glow = computed(() => {
  if (calm.value) return ''
  return tone.value === OVER ? 'animate-glow-over' : tone.value === WATCH ? 'animate-glow-watch' : 'animate-glow-go'
})
const status = computed(() => t(`demo.status.${state.value.pct >= 90 ? 'over' : state.value.pct >= 75 ? 'watch' : 'go'}`))
const marks = computed(() => MARKS.map(([name, draw]) => ({ name, shapes: draw(state.value.pct / 100, tone.value) })))

const bars = computed(() =>
  Array.from({ length: 26 }, (_, i) => {
    const w = 0.3 + 0.7 * Math.sin((i / 25) * Math.PI * 0.85 + 0.5) ** 2
    return {
      h: `${Math.max(0.2, w * (0.84 + 0.16 * Math.sin(i * 2.9)) * 2.5).toFixed(2)}rem`,
      c: i > 21 ? tone.value : 'rgba(255,255,255,.24)',
    }
  }),
)

const fmtClock = () => {
  const d = new Date()
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()]
  return `${day} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

let cycle, tick
onMounted(() => {
  clock.value = fmtClock()
  tick = setInterval(() => (clock.value = fmtClock()), 15000)
  cycle = setInterval(() => {
    if (!held.value) index.value = (index.value + 1) % STATES.length
  }, 3000)
})
onUnmounted(() => {
  clearInterval(cycle)
  clearInterval(tick)
})
</script>

<template>
  <div
    class="flex min-w-0 flex-col gap-[1.125rem]"
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
          class="absolute inset-x-0 top-0 flex h-[1.55rem] items-center justify-between rounded-t-[.65rem] bg-black/60 px-[.8rem] text-[.72rem] text-white/80 backdrop-blur-lg"
        >
          <span class="font-semibold">Token Pacer</span>
          <span>{{ clock }}</span>
        </div>

        <!-- Preferences window -->
        <div
          v-if="is('prefs')"
          class="absolute top-1/2 left-1/2 z-[3] w-[26.25rem] -translate-x-1/2 -translate-y-1/2 scale-[.72] overflow-hidden rounded-xl bg-[#131417] ring-1 ring-white/7 shadow-[0_1.875rem_4.375rem_rgba(0,0,0,.6)]"
        >
          <div class="relative flex h-[2.375rem] items-center bg-[#1a1b1f] px-[.8rem] shadow-[inset_0_-1px_0_rgba(255,255,255,.06)]">
            <div class="z-[1] flex gap-[.45rem]">
              <span v-for="n in 3" :key="n" class="size-[.625rem] rounded-full bg-[#3f4046]" />
            </div>
            <span class="absolute inset-x-0 text-center text-[.8rem] font-semibold text-white/60">Token Pacer</span>
          </div>
          <div class="flex flex-col gap-5 px-[1.375rem] pt-5 pb-[1.375rem]">
            <div class="flex flex-col gap-[.8rem]">
              <span class="text-[.625rem] font-medium tracking-[.16em] text-white/40 uppercase">{{ t('demo.prefs.alerts') }}</span>
              <div class="flex items-baseline justify-between gap-4">
                <div class="flex items-baseline gap-2">
                  <span class="text-[.84rem] text-white/90">{{ t('demo.prefs.watchAt') }}</span>
                  <span class="font-mono text-[.78rem] font-medium text-watch">75%</span>
                </div>
                <div class="flex items-baseline gap-2">
                  <span class="text-[.84rem] text-white/90">{{ t('demo.prefs.overAt') }}</span>
                  <span class="font-mono text-[.78rem] font-medium text-over">90%</span>
                </div>
              </div>
              <div class="relative flex h-5 items-center">
                <div class="relative h-[.625rem] w-full overflow-hidden rounded-full bg-[#24262b]">
                  <div class="absolute inset-y-0 left-0 w-[75%] bg-go" />
                  <div class="absolute inset-y-0 left-[75%] w-[15%] bg-watch" />
                  <div class="absolute inset-y-0 right-0 left-[90%] bg-over" />
                </div>
                <span
                  v-for="at in ['75%', '90%']"
                  :key="at"
                  class="absolute top-1/2 size-[1.2rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_.125rem_.375rem_rgba(0,0,0,.55)]"
                  :style="{ left: at }"
                />
              </div>
              <div class="flex items-center justify-between gap-4">
                <span class="text-[.84rem] text-white/90">{{ t('demo.prefs.sound') }}</span>
                <span class="box-border flex size-5 shrink-0 items-center justify-center rounded-[.3rem] bg-[#3c3d43] ring-1 ring-white/20">
                  <span class="block h-[.3rem] w-[.625rem] translate-x-px -translate-y-px -rotate-45 border-b-2 border-l-2 border-white" />
                </span>
              </div>
            </div>
            <div class="h-px bg-white/6" />
            <div class="flex flex-col gap-[.8rem]">
              <span class="text-[.625rem] font-medium tracking-[.16em] text-white/40 uppercase">{{ t('demo.prefs.general') }}</span>
              <div class="flex items-center justify-between gap-4">
                <span class="text-[.84rem] text-white/90">{{ t('demo.prefs.login') }}</span>
                <span class="box-border flex size-5 shrink-0 items-center justify-center rounded-[.3rem] bg-[#3c3d43] ring-1 ring-white/20">
                  <span class="block h-[.3rem] w-[.625rem] translate-x-px -translate-y-px -rotate-45 border-b-2 border-l-2 border-white" />
                </span>
              </div>
              <div class="flex items-center justify-between gap-4">
                <span class="text-[.84rem] text-white/90">{{ t('demo.prefs.hide') }}</span>
                <span class="box-border size-5 shrink-0 rounded-[.3rem] bg-[#222329] ring-1 ring-white/12" />
              </div>
            </div>
          </div>
        </div>

        <!-- Appearance pane: twelve marks, twelve running lights -->
        <div
          v-if="is('looks')"
          class="absolute top-1/2 left-1/2 z-[3] w-[26.25rem] -translate-x-1/2 -translate-y-1/2 scale-[.72] overflow-hidden rounded-xl bg-[#131417] ring-1 ring-white/7 shadow-[0_1.875rem_4.375rem_rgba(0,0,0,.6)]"
        >
          <div class="relative flex h-[2.375rem] items-center bg-[#1a1b1f] px-[.8rem] shadow-[inset_0_-1px_0_rgba(255,255,255,.06)]">
            <div class="z-[1] flex gap-[.45rem]">
              <span v-for="n in 3" :key="n" class="size-[.625rem] rounded-full bg-[#3f4046]" />
            </div>
            <span class="absolute inset-x-0 text-center text-[.8rem] font-semibold text-white/60">Token Pacer</span>
          </div>
          <div class="flex flex-col gap-[1.125rem] px-[1.375rem] pt-[1.125rem] pb-[1.375rem]">
            <div class="flex flex-col gap-[.7rem]">
              <span class="text-[.625rem] font-medium tracking-[.16em] text-white/40 uppercase">{{ t('demo.looks.marks') }}</span>
              <div class="grid grid-cols-4 gap-[.4rem]">
                <div
                  v-for="(m, i) in marks"
                  :key="m.name"
                  class="flex flex-col items-center gap-[.3rem] rounded-[.4rem] px-1 py-[.4rem] ring-1"
                  :class="i === 0 ? 'bg-white/8 ring-go/60' : 'bg-white/3 ring-transparent'"
                >
                  <svg viewBox="0 0 44 14" class="h-[.82rem] w-[2.6rem] overflow-visible">
                    <template v-for="(sh, j) in m.shapes" :key="j">
                      <rect v-if="sh.t === 'rect'" v-bind="sh.a" />
                      <circle v-else-if="sh.t === 'circle'" v-bind="sh.a" />
                      <path v-else v-bind="sh.a" />
                    </template>
                  </svg>
                  <span class="truncate text-[.5rem] leading-none text-white/45">{{ m.name }}</span>
                </div>
              </div>
            </div>
            <div class="flex flex-col gap-[.7rem]">
              <span class="text-[.625rem] font-medium tracking-[.16em] text-white/40 uppercase">{{ t('demo.looks.borders') }}</span>
              <div class="grid grid-cols-4 gap-[.4rem]">
                <div
                  v-for="([name, bg, anim], i) in BORDERS"
                  :key="name"
                  class="flex flex-col items-center gap-[.3rem] rounded-[.4rem] px-1 py-[.4rem] ring-1"
                  :class="i === 0 ? 'bg-white/8 ring-go/60' : 'bg-white/3 ring-transparent'"
                >
                  <div class="relative h-[1.05rem] w-[2.6rem] rounded-b-[.35rem]" :style="{ color: tone }">
                    <div
                      class="absolute -inset-px rounded-b-[.4rem] bg-no-repeat"
                      :style="{
                        backgroundImage: bg,
                        backgroundSize: SIZED[name],
                        animation: anim,
                        filter: name === 'Breathe glow' ? 'drop-shadow(0 0 .18rem currentColor)' : undefined,
                      }"
                    />
                    <div class="absolute inset-0 -top-px rounded-b-[.35rem] bg-black" />
                  </div>
                  <span class="truncate text-[.5rem] leading-none text-white/45">{{ name }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- The notch shell -->
        <div class="absolute top-0 left-1/2 z-[4] -translate-x-1/2">
          <!-- Comet, the default running light: it runs outside the shell, and
               never along the top edge, which lies against the hardware. -->
          <div
            v-if="!calm"
            class="absolute -inset-[.11rem] z-0"
            :style="{
              color: tone,
              borderRadius: `0 0 ${state.r} ${state.r}`,
              backgroundImage: 'conic-gradient(from var(--tp-a), transparent 0 74%, currentColor 97%, transparent)',
              animation: 'tp-run 2.6s linear infinite',
            }"
          />
          <div
            class="relative z-[1] overflow-hidden bg-black transition-[width,height] duration-500 ease-[cubic-bezier(.3,1.3,.52,1)]"
            :class="[glow, calm ? 'ring-1 ring-white/12' : '']"
            :style="{
              width: state.w,
              height: state.h,
              borderRadius: `0 0 ${state.r} ${state.r}`,
            }"
          >
            <!-- Collapsed pill -->
            <div v-if="is('pill') || is('reset') || is('looks') || is('prefs') || is('red')" class="flex h-[2.125rem] items-center justify-between gap-12 pr-3 pl-[.625rem]">
              <div class="flex items-center gap-[.45rem]">
                <div class="relative h-1 w-[2.875rem] shrink-0" :class="is('reset') ? 'animate-ring-pop' : ''">
                  <span class="absolute inset-y-0 left-0 w-[74%] rounded-full bg-go" />
                  <span class="absolute inset-y-0 left-[76%] w-[13%] rounded-full bg-watch" />
                  <span class="absolute inset-y-0 left-[91%] w-[9%] rounded-full bg-over" />
                  <span
                    class="absolute top-1/2 h-[.7rem] w-[.125rem] -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_1px_2px_rgba(0,0,0,.6)]"
                    :class="calm ? '' : 'animate-creep'"
                    :style="{
                      left: `${markAt}%`,
                      background: is('reset') ? '#a5f0cd' : lightOf(state.pct),
                    }"
                  />
                </div>
                <span class="font-mono text-[.72rem] font-medium" :style="{ color: tone }">{{ state.pct }}%</span>
              </div>
              <span class="font-mono text-[.69rem]" :style="{ color: is('red') ? tone : 'rgba(255,255,255,.5)' }">{{ state.reset }}</span>
            </div>

            <!-- Hover / warn -->
            <div v-else-if="is('hover') || is('warn')" class="px-[1.1rem] pt-1 pb-[.875rem]">
              <div class="h-5" />
              <div class="flex items-center gap-[.8rem]">
                <div class="flex size-[2.65rem] shrink-0 items-center justify-center rounded-full" :style="{ background: ring }">
                  <div class="flex size-[2rem] items-center justify-center rounded-full bg-black font-mono text-[.66rem]" :style="{ color: tone }">
                    <span v-if="is('hover')">{{ state.pct }}%</span>
                  </div>
                </div>
                <div v-if="is('hover')" class="flex min-w-0 flex-1 flex-col gap-[.45rem]">
                  <div class="flex items-baseline justify-between gap-3">
                    <span class="whitespace-nowrap text-[.78rem] font-semibold text-white">{{ status }}</span>
                    <span class="shrink-0 whitespace-nowrap text-[.69rem] text-white/50">{{ state.reset }} {{ t('demo.left') }}</span>
                  </div>
                  <div class="h-1 overflow-hidden rounded-full bg-white/13">
                    <div class="h-full rounded-full" :style="{ width: `${state.weekly}%`, background: toneOf(state.weekly) }" />
                  </div>
                  <span class="whitespace-nowrap font-mono text-[.62rem] text-white/40">{{ t('demo.week') }} {{ state.weekly }}% · {{ t('demo.weeklyResets') }}</span>
                </div>
                <div v-else class="flex flex-col gap-[.2rem]">
                  <span class="font-mono text-2xl leading-none font-medium text-over">{{ state.pct }}%</span>
                  <span class="whitespace-nowrap text-[.75rem] text-white/65">{{ t('demo.wrapSoon', { time: state.reset }) }}</span>
                </div>
              </div>
            </div>

            <!-- Pinned panel -->
            <div v-else-if="is('panel')" class="w-[47rem] origin-top-left scale-[.55]">
              <div class="flex flex-col gap-[1.125rem] px-[1.375rem] pt-2 pb-[1.375rem]">
                <span class="flex h-5 items-center font-mono text-[.6rem] tracking-[.15em] whitespace-nowrap text-white/38 uppercase">{{ t('demo.pinned') }}</span>
                <div class="grid grid-cols-[9.5rem_minmax(0,1fr)] items-center gap-6">
                  <div class="flex flex-col items-center gap-[.625rem]">
                    <div class="flex size-[7.375rem] items-center justify-center rounded-full" :style="{ background: ring }">
                      <div class="flex size-[5.875rem] flex-col items-center justify-center gap-[.2rem] rounded-full bg-black">
                        <span class="font-mono text-[1.875rem] leading-none font-medium" :style="{ color: tone }">{{ state.pct }}%</span>
                        <span class="text-[.53rem] text-white/36 uppercase">{{ t('demo.window') }}</span>
                      </div>
                    </div>
                    <span class="whitespace-nowrap text-[.72rem] text-white/60">{{ t('demo.resetsIn', { time: state.reset }) }}</span>
                  </div>
                  <div class="flex min-w-0 flex-col gap-4">
                    <div class="flex flex-col gap-[.45rem]">
                      <div class="flex items-baseline justify-between gap-3.5">
                        <span class="whitespace-nowrap text-[.69rem] text-white/44">{{ t('demo.weeklyCap') }}</span>
                        <span class="whitespace-nowrap font-mono text-[.69rem] text-white/70">{{ state.weekly }}% · {{ t('demo.weeklyResets') }}</span>
                      </div>
                      <div class="h-[.44rem] overflow-hidden rounded-full bg-white/12">
                        <div class="h-full rounded-full" :style="{ width: `${state.weekly}%`, background: toneOf(state.weekly) }" />
                      </div>
                    </div>
                    <div class="flex flex-col gap-2">
                      <div class="flex items-baseline justify-between gap-3.5">
                        <span class="whitespace-nowrap text-[.69rem] text-white/44">{{ t('demo.history') }}</span>
                        <span class="whitespace-nowrap font-mono text-[.69rem] text-white/70">{{ t('demo.historyNote') }}</span>
                      </div>
                      <div class="flex h-10 items-end gap-[.2rem]">
                        <div v-for="(bar, i) in bars" :key="i" class="min-w-0 flex-1 rounded-[.125rem]" :style="{ height: bar.h, background: bar.c }" />
                      </div>
                    </div>
                  </div>
                </div>
                <div class="h-px bg-white/8" />
                <div class="grid grid-cols-3 gap-[1.375rem]">
                  <div v-for="group in SPLITS" :key="group.title" class="flex min-w-0 flex-col gap-[.55rem]">
                    <span class="whitespace-nowrap text-[.69rem] text-white/40">{{ t(`demo.groups.${group.title}`) }}</span>
                    <div v-for="[name, pct, color] in group.rows" :key="name" class="grid grid-cols-[minmax(0,1fr)_2.25rem] items-center gap-2">
                      <div class="flex min-w-0 flex-col gap-1">
                        <span class="truncate text-[.72rem] text-white/82">{{ name }}</span>
                        <div class="h-[.19rem] overflow-hidden rounded-full bg-white/10">
                          <div class="h-full rounded-full" :style="{ width: `${pct}%`, background: color }" />
                        </div>
                      </div>
                      <span class="text-right font-mono text-[.66rem] whitespace-nowrap text-white/48">{{ pct }}%</span>
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
