<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useHead } from '@unhead/vue'
import FeedbackModal from '../components/FeedbackModal.vue'
import NotchDemo from '../components/NotchDemo.vue'
import { useI18n } from '../i18n'
import { DOWNLOAD_URL, FILE_SIZE, SITE_URL, VERSION } from '../site'

const { t } = useI18n()

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
      { property: 'og:image', content: `${SITE_URL}/icon-512.png` },
      { property: 'og:locale', content: 'en_US' },
      { name: 'twitter:card', content: 'summary_large_image' },
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
          operatingSystem: 'macOS 15',
          softwareVersion: VERSION,
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

// The appcast CI rewrites each release is the only place the current DMG is
// named, so read the button's target from it instead of hardcoding a filename
// that goes stale. Prerender ships the releases page as the href; this upgrades
// it to a one-click download once the feed lands.
// ponytail: takes the first enclosure. Fine while CI writes a single-item feed.
const dmg = ref(DOWNLOAD_URL)
onMounted(async () => {
  try {
    const feed = await (await fetch('/appcast.xml')).text()
    const url = new DOMParser().parseFromString(feed, 'application/xml').querySelector('enclosure')?.getAttribute('url')
    if (url) dmg.value = url
  } catch {
    /* feed unreachable — the releases page is already in the href */
  }
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
              <h1 class="m-0 text-[min(2.875rem,6.55cqw)] leading-[1.1] font-semibold tracking-[-.03em] whitespace-nowrap">
                {{ t('hero.headline') }}
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

          <div class="flex flex-col gap-[.875rem]">
            <div class="flex flex-wrap items-center gap-3">
              <a
                :href="dmg"
                class="inline-flex items-center gap-[.55rem] rounded-[.625rem] bg-go px-[1.375rem] py-[.8rem] text-[.97rem] font-semibold whitespace-nowrap text-[#06231a] transition-colors hover:bg-[#56dfa0]"
              >
                <svg viewBox="0 0 14 14" aria-hidden="true" class="size-[.875rem] shrink-0 fill-current">
                  <rect x="6" y="0" width="2" height="7" rx="1" />
                  <path d="M2 6h10L7 11z" />
                  <rect x="1" y="12" width="12" height="2" rx="1" />
                </svg>
                {{ t('cta.download') }}
              </a>
            </div>

            <span class="font-mono text-[.82rem] text-white/58">{{ t('cta.requirements', { version: VERSION, size: FILE_SIZE }) }}</span>
          </div>
        </div>

        <NotchDemo />
      </div>
    </main>

    <footer class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-[2.125rem] pt-[1.125rem] pb-7 text-[.82rem] text-white/52">
      <span>{{ t('footer.rights') }}</span>
      <nav class="flex items-center gap-4">
        <a href="#feedback" class="transition-colors hover:text-go">{{ t('footer.feedback') }}</a>
        <a href="#changelog" class="transition-colors hover:text-go">{{ t('footer.changelog') }}</a>
      </nav>
    </footer>

    <FeedbackModal v-if="hash === 'feedback'" @close="close" />
  </div>
</template>
