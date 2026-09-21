<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useHead } from '@unhead/vue'
import ChangelogModal from '../components/ChangelogModal.vue'
import FeedbackModal from '../components/FeedbackModal.vue'
import NotchDemo from '../components/NotchDemo.vue'
import { useI18n } from '../i18n'
import { parseAppcast } from '../releases'
import { useSparkles } from '../sparkles'
import { COFFEE_URL, DOWNLOAD_URL, GH_REPO, SITE_URL } from '../site'
// __APPCAST__ is public/appcast.xml, inlined by vite.config.js — the feed CI
// rewrites on each release is the only place the shipped build is named, so the
// version renders into the prerendered HTML rather than flashing a stale one.
const app = parseAppcast(__APPCAST__)
const dmg = app.url || DOWNLOAD_URL
const { canvas, hover } = useSparkles()

const { t } = useI18n()

// The repo owner is the profile — one handle to change, not two.
const ghUser = GH_REPO.split('/')[0]

const DOTS = ['#3ec98a', '#3ec98a', '#e8b33c', '#5aa9d6', '#e8b33c', '#3ec98a']
const features = computed(() => t('features').map((f, i) => ({ ...f, c: DOTS[i] })))

useHead(
  computed(() => ({
    htmlAttrs: { lang: 'en' },
    title: t('meta.title'),
    meta: [
      { name: 'description', content: t('meta.description') },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'Token Pacer' },
      { property: 'og:title', content: t('meta.title') },
      { property: 'og:description', content: t('meta.description') },
      { property: 'og:url', content: SITE_URL },
      // 1200x630 JPEG: the one format every unfurler renders. WebP is smaller
      // but X and parts of Slack show nothing for it.
      { property: 'og:image', content: `${SITE_URL}/og.jpg` },
      { property: 'og:image:type', content: 'image/jpeg' },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:alt', content: t('meta.ogAlt') },
      { property: 'og:locale', content: 'en_US' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:image', content: `${SITE_URL}/og.jpg` },
    ],
    link: [
      { rel: 'canonical', href: SITE_URL },
    ],
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'Token Pacer',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: `macOS ${app.minOS}`,
          softwareVersion: app.version,
          url: SITE_URL,
          description: t('meta.description'),
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        }),
      },
    ],
  })),
)

// The hash IS the modal state, so /#feedback deep-links straight in and Back closes it.
const hash = ref('')
const readHash = () => (hash.value = location.hash.slice(1))
const close = () => {
  history.replaceState(null, '', location.pathname + location.search)
  readHash()
}
onMounted(() => {
  readHash()
  window.addEventListener('hashchange', readHash)
})
onUnmounted(() => window.removeEventListener('hashchange', readHash))

// The headline rotates through the variants. A transition rather than an
// infinite keyframe: it paints for ~200ms per swap and the page idles between,
// instead of keeping the compositor awake the way a looping animation would.
const headlines = computed(() => t('hero.headlines'))
const hi = ref(0)
const fading = ref(false)
let rotate, swap
onMounted(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  rotate = setInterval(() => {
    if (document.hidden) return
    fading.value = true
    swap = setTimeout(() => {
      hi.value = (hi.value + 1) % headlines.value.length
      fading.value = false
    }, 220)
  }, 4200)
})
onUnmounted(() => {
  clearInterval(rotate)
  clearTimeout(swap)
})

</script>

<template>
  <div
    class="flex min-h-dvh flex-col font-sans text-ink"
  >
    <!-- The ambient wash, on its own composited layer so it costs one raster
         rather than one per frame. Oversized, so the drift never shows an edge. -->
    <div
      aria-hidden="true"
      class="animate-drift pointer-events-none fixed inset-[-12%] -z-10 will-change-transform"
      style="
        background-image: radial-gradient(50% 50% at 50% 50%, rgba(62, 201, 138, 0.5), transparent 68%),
          radial-gradient(50% 50% at 50% 50%, rgba(56, 124, 172, 0.46), transparent 70%),
          radial-gradient(50% 50% at 50% 50%, rgba(232, 179, 60, 0.3), transparent 68%);
        background-size: 150% 140%, 165% 150%, 140% 130%;
        background-position: 8% 18%, 92% 26%, 50% 96%;
        background-repeat: no-repeat;
      "
    />
    <!-- The sparkle field the download button throws off on hover. Fixed and
         viewport-sized so a glyph can arc clear of the button. -->
    <canvas ref="canvas" aria-hidden="true" class="pointer-events-none fixed inset-0 z-0" />

    <a href="#main" class="sr-only focus:not-sr-only focus:absolute focus:m-4 focus:rounded-lg focus:bg-go focus:px-4 focus:py-2 focus:text-[#06231a]">
      {{ t('nav.skip') }}
    </a>

    <header class="flex items-center justify-center gap-[1.6rem] px-[2.125rem] pt-[3.125rem]">
      <img
        src="/icon-256.png"
        alt=""
        width="256"
        height="256"
        fetchpriority="high"
        class="block size-[7rem] rounded-[1.55rem] shadow-[0_1.125rem_2.5rem_rgba(0,0,0,.6)]"
      />
      <span class="text-[2.875rem] font-semibold tracking-[-.025em]">Token Pacer</span>
    </header>

    <main id="main" class="flex flex-1 items-center justify-center px-[2.125rem] pt-10 pb-6">
      <div class="grid w-full max-w-[74rem] grid-cols-[repeat(auto-fit,minmax(min(27.5rem,100%),1fr))] items-center gap-14">
        <div class="flex min-w-0 flex-col gap-[1.625rem]">
          <div class="flex flex-col gap-[.875rem]">
            <div class="@container flex flex-col gap-[.7rem]">
              <span class="font-mono text-[.78rem] font-medium tracking-[.14em] text-white/48 uppercase">{{ t('hero.eyebrow') }}</span>
              <h1
                class="m-0 text-[min(2.875rem,6.55cqw)] leading-[1.1] font-semibold tracking-[-.03em] whitespace-nowrap transition-opacity duration-200"
                :class="fading && 'opacity-0'"
              >
                {{ headlines[hi] }}
              </h1>
            </div>
            <p class="m-0 max-w-[46ch] text-[1.08rem] leading-[1.55] text-balance text-white/62">{{ t('hero.sub') }}</p>
          </div>

          <ul class="grid list-none grid-cols-[repeat(auto-fit,minmax(min(13.5rem,100%),1fr))] gap-x-7 gap-y-4 p-0">
            <li v-for="f in features" :key="f.label" class="flex min-w-0 flex-col gap-1">
              <div class="flex items-center gap-2">
                <span class="size-[.3rem] shrink-0 rounded-full" :style="{ background: f.c }" />
                <span class="text-[.97rem] font-semibold text-white">{{ f.label }}</span>
              </div>
              <span class="text-[.875rem] leading-[1.5] text-balance text-white/55">{{ f.note }}</span>
            </li>
          </ul>

          <div class="flex flex-wrap items-center gap-3">
            <a
              :href="dmg"
              v-on="hover"
              class="relative z-[1] inline-flex items-center gap-[.55rem] rounded-[.625rem] bg-go px-[1.375rem] py-[.8rem] text-[.97rem] font-semibold whitespace-nowrap text-[#06231a] transition-colors hover:bg-[#56dfa0]"
            >
              <!-- Apple's glyph is taller than it is wide, so it is sized by
                   height and left to keep its own ratio. The label has no
                   descenders, so its optical centre sits above the line box —
                   the nudge puts the glyph on that centre rather than the box's. -->
              <svg viewBox="0 0 814 1000" aria-hidden="true" class="relative -top-[.0625rem] h-[.95rem] w-[.78rem] shrink-0 fill-current">
                <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57.8-155.5-127.4c-58.3-81.8-105.3-209.2-105.3-330.3 0-194.3 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8.6 15.7 1.3 18.2 2.6.6 6.4 1.3 10.2 1.3 45.4 0 103.5-30.4 139.5-71.4z" />
              </svg>
              {{ t('cta.download') }}
            </a>

            <a
              :href="COFFEE_URL"
              target="_blank"
              rel="noopener"
              class="inline-flex items-center gap-[.55rem] rounded-[.625rem] bg-bmc px-[1.375rem] py-[.8rem] text-[.97rem] font-semibold whitespace-nowrap text-[#0b0b0d] transition-colors hover:bg-[#ffe75c]"
            >
              <svg viewBox="0 0 16 16" aria-hidden="true" class="size-[.9rem] shrink-0">
                <path fill="currentColor" d="M1.6 6.2h9v3.9a3.1 3.1 0 0 1-3.1 3.1H4.7a3.1 3.1 0 0 1-3.1-3.1V6.2Z" />
                <path fill="none" stroke="currentColor" stroke-width="1.3" d="M10.9 7.5h1.4a1.6 1.6 0 0 1 0 3.2h-1.4" />
                <path fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" d="M4.2 1.7v1.5M6.6 1.3v1.9M9 1.7v1.5" />
              </svg>
              {{ t('cta.coffee') }}
            </a>
          </div>

          <p v-if="app.version" class="m-0 -mt-1 text-[.82rem] text-white/50">
            v{{ app.version }} · {{ t('cta.requires', { os: app.minOS }) }}
          </p>
        </div>

        <NotchDemo />
      </div>
    </main>

    <footer class="grid grid-cols-1 items-center justify-items-center gap-2 px-[2.125rem] pt-[1.125rem] pb-7 text-[.82rem] text-white/52 sm:grid-cols-3">
      <span class="sm:justify-self-start">{{ t('footer.rights') }}</span>
      <a
        :href="`https://github.com/${ghUser}`"
        target="_blank"
        rel="noopener"
        class="inline-flex items-center gap-[.35rem] transition-colors hover:text-go"
      >
        <svg viewBox="0 0 16 16" aria-hidden="true" class="size-[.88rem] shrink-0 fill-current">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.4 7.4 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
        </svg>
        {{ t('footer.by', { user: ghUser }) }}
      </a>
      <nav class="flex items-center gap-4 sm:justify-self-end">
        <a href="#feedback" class="transition-colors hover:text-go">{{ t('footer.feedback') }}</a>
        <a href="#changelog" class="transition-colors hover:text-go">{{ t('footer.changelog') }}</a>
      </nav>
    </footer>

    <FeedbackModal v-if="hash === 'feedback'" @close="close" />
    <ChangelogModal v-if="hash === 'changelog'" @close="close" />
  </div>
</template>
