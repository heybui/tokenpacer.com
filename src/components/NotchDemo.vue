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
  { key: 'pill', pct: 58, weekly: 55, burn: 18, reset: '2h 06m', ...PILL },
  { key: 'hover', pct: 58, weekly: 55, burn: 18, reset: '2h 06m', ...WIDE },
  { key: 'panel', pct: 58, weekly: 55, burn: 18, reset: '2h 06m', w: '26rem', h: '11.625rem', r: '1.5rem' },
  { key: 'warn', pct: 90, weekly: 78, burn: 34, reset: '0h 42m', ...WIDE },
  { key: 'red', pct: 100, weekly: 82, burn: 0, reset: '0h 22m', ...PILL },
  { key: 'reset', pct: 0, weekly: 12, burn: 4, reset: '5h 00m', ...PILL },
  { key: 'prefs', pct: 58, weekly: 55, burn: 18, reset: '2h 06m', ...PILL },
]

const SPLITS = [
  { title: 'model', rows: [['Opus 4.6', 54, WATCH], ['Sonnet 4.6', 38, INFO], ['Haiku', 8, MUTED]] },
  { title: 'project', rows: [['platform-api', 47, WATCH], ['token-pacer', 31, INFO], ['scratch', 22, MUTED]] },
  { title: 'surface', rows: [['Claude Code', 78, WATCH], ['claude.ai', 17, INFO], ['API direct', 5, MUTED]] },
]

const index = ref(0)
const held = ref(false)
const clock = ref('')

// Tone rule, same as the app: green < 75, amber 75–90, red > 90.
const toneOf = (p) => (p >= 90 ? OVER : p >= 75 ? WATCH : GO)
const lightOf = (p) => (p >= 90 ? '#f4ab9e' : p >= 75 ? '#fbcda2' : '#a5f0cd')

const state = computed(() => STATES[index.value])
const is = (key) => state.value.key === key
const calm = computed(() => ['panel', 'reset', 'prefs'].includes(state.value.key))
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
const headroom = computed(() =>
  t('demo.headroom', {
    burn: state.value.burn,
    min: Math.max(1, Math.round(((100 - state.value.pct) / Math.max(1, state.value.burn)) * 60)),
  }),
)

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

        <!-- The notch shell -->
        <div class="absolute top-0 left-1/2 z-[4] -translate-x-1/2">
          <div
            class="relative overflow-hidden bg-black transition-[width,height] duration-500 ease-[cubic-bezier(.3,1.3,.52,1)]"
            :class="[glow, calm ? 'ring-1 ring-white/12' : '']"
            :style="{
              width: state.w,
              height: state.h,
              borderRadius: `0 0 ${state.r} ${state.r}`,
            }"
          >
            <!-- Collapsed pill -->
            <div v-if="is('pill') || is('reset') || is('prefs') || is('red')" class="flex h-[2.125rem] items-center justify-between gap-12 pr-3 pl-[.625rem]">
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
                  <span class="whitespace-nowrap font-mono text-[.62rem] text-white/40">{{ t('demo.week') }} {{ state.weekly }}% · {{ headroom }}</span>
                </div>
                <div v-else class="flex flex-col gap-[.2rem]">
                  <span class="font-mono text-2xl leading-none font-medium text-over">{{ state.pct }}%</span>
                  <span class="whitespace-nowrap text-[.75rem] text-white/65">{{ t('demo.wrapSoon') }}</span>
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
                        <span class="whitespace-nowrap text-[.69rem] text-white/44">{{ t('demo.pace') }}</span>
                        <span class="whitespace-nowrap font-mono text-[.69rem] text-white/70">{{ headroom }}</span>
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
      <span :key="state.key" class="animate-cap-in text-center text-[.8rem] text-balance text-white/65">{{ t(`demo.captions.${state.key}`) }}</span>
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
