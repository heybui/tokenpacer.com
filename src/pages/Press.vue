<script setup lang="ts">
import { computed } from 'vue'
import { useHead } from '@unhead/vue'
import { useI18n } from '../utils/i18n'
import { BREW, CONTACT_EMAIL, RELEASE_REPO, SITE_URL } from '../utils/site'

const { t } = useI18n()

const facts = computed(() => [
  ['name', 'Token Pacer'],
  ['developer', RELEASE_REPO.split('/')[0]],
  ['price', t('press.free')],
  ['download', `${SITE_URL.replace('https://', '')} · ${BREW}`],
  ['contact', CONTACT_EMAIL],
])

const images = [
  { key: 'icon', src: '/press/token-pacer-icon-512.png', size: '512 × 512 PNG', square: true },
  { key: 'og', src: '/press/og.jpg', size: '1200 × 630 JPG' },
  { key: 'poster', src: '/press/poster.jpg', size: '1920 × 1080 JPG' },
  { key: 'panel', src: '/press/shot-panel.png', size: '1920 × 1080 PNG' },
  { key: 'pill', src: '/press/shot-pill.png', size: '1920 × 1080 PNG' },
  { key: 'hover', src: '/press/shot-hover.png', size: '1920 × 1080 PNG' },
  { key: 'warn', src: '/press/shot-warn.png', size: '1920 × 1080 PNG' },
  { key: 'history', src: '/press/shot-history.png', size: '1920 × 1080 PNG' },
  { key: 'prefs', src: '/press/shot-prefs.png', size: '1920 × 1080 PNG' },
]
const videos = [
  { key: 'promo', src: '/press/token-pacer-promo.mp4', size: '48 s · 1920 × 1080 · 12 MB' },
  { key: 'vertical', src: '/press/token-pacer-promo-vertical.mp4', size: '48 s · 1080 × 1920 · 10 MB' },
  { key: 'clip', src: '/press/token-pacer-clip.mp4', size: '8 s · 720p · silent' },
]

useHead({
  title: t('press.title'),
  meta: [
    { name: 'description', content: t('press.description') },
    { property: 'og:title', content: t('press.title') },
    { property: 'og:description', content: t('press.description') },
    { property: 'og:url', content: `${SITE_URL}/press` },
    { property: 'og:image', content: `${SITE_URL}/og.jpg` },
  ],
  link: [{ rel: 'canonical', href: `${SITE_URL}/press` }],
})

const h2 = 'mb-4 text-[1.3rem] font-semibold tracking-[-.01em]'
const card = 'rounded-xl bg-panel ring-1 ring-white/7'
const dl = 'text-[.82rem] font-medium text-go hover:text-[#56dfa0]'
</script>

<template>
  <div class="min-h-dvh bg-base font-sans text-ink">
    <main id="main" class="mx-auto flex max-w-[60rem] flex-col gap-14 px-4 py-12 sm:px-8">
      <header class="flex flex-col gap-3">
        <RouterLink to="/" class="self-start text-[.85rem] text-white/55 transition-colors hover:text-go">
          ← {{ t('press.back') }}
        </RouterLink>
        <h1 class="m-0 text-[2.4rem] font-semibold tracking-[-.025em]">{{ t('press.heading') }}</h1>
        <p class="m-0 max-w-[40rem] text-white/65">{{ t('press.sub') }}</p>
      </header>

      <section>
        <h2 :class="h2">{{ t('press.about') }}</h2>
        <div class="flex flex-col gap-4 text-[.97rem] leading-[1.6] text-white/80">
          <p class="m-0 font-medium text-ink">{{ t('press.short') }}</p>
          <p class="m-0">{{ t('press.long') }}</p>
        </div>
      </section>

      <section>
        <h2 :class="h2">{{ t('press.facts') }}</h2>
        <dl :class="[card, 'm-0 divide-y divide-white/7']">
          <div v-for="[k, v] in facts" :key="k" class="grid gap-1 px-5 py-3 sm:grid-cols-[11rem_1fr]">
            <dt class="text-[.85rem] text-white/50">{{ t(`press.factRows.${k}`) }}</dt>
            <dd class="m-0 text-[.92rem] break-words" :class="k === 'download' && 'font-mono text-[.82rem]'">{{ v }}</dd>
          </div>
        </dl>
      </section>

      <section>
        <h2 :class="h2">{{ t('press.assets') }}</h2>
        <p class="-mt-2 mb-4 text-[.88rem] text-white/55">{{ t('press.logoNote') }}</p>
        <div class="grid gap-4 sm:grid-cols-2">
          <figure v-for="img in images" :key="img.src" :class="[card, 'm-0 overflow-hidden']">
            <div class="flex aspect-video items-center justify-center bg-sunken">
              <img
                :src="img.src"
                :alt="t(`press.items.${img.key}`)"
                loading="lazy"
                :class="img.square ? 'size-28 rounded-[1.4rem]' : 'size-full object-cover'"
              />
            </div>
            <figcaption class="flex items-center justify-between gap-3 px-4 py-3">
              <span class="text-[.88rem]">{{ t(`press.items.${img.key}`) }} <span class="text-white/45">· {{ img.size }}</span></span>
              <a :href="img.src" download :class="dl">{{ t('press.download') }}</a>
            </figcaption>
          </figure>
        </div>
      </section>

      <section>
        <h2 :class="h2">{{ t('press.video') }}</h2>
        <p class="-mt-2 mb-4 text-[.88rem] text-white/55">{{ t('press.videoNote') }}</p>
        <!-- Two players rather than <source media>: the poster has to switch
             with the cut, and preload="none" means the hidden one costs nothing. -->
        <video
          src="/press/token-pacer-promo.mp4"
          poster="/press/poster.jpg"
          controls
          preload="none"
          playsinline
          :class="[card, 'hidden aspect-video w-full sm:block']"
        />
        <video
          src="/press/token-pacer-promo-vertical.mp4"
          poster="/press/poster-vertical.jpg"
          controls
          preload="none"
          playsinline
          :class="[card, 'mx-auto block aspect-[9/16] w-full max-w-[22rem] sm:hidden']"
        />
        <ul class="m-0 mt-4 flex list-none flex-col gap-2 p-0">
          <li v-for="v in videos" :key="v.key" class="flex items-center justify-between gap-3">
            <span class="text-[.9rem]">{{ t(`press.items.${v.key}`) }} <span class="text-white/45">· {{ v.size }}</span></span>
            <a :href="v.src" download :class="dl">{{ t('press.download') }}</a>
          </li>
        </ul>
      </section>

      <section>
        <h2 :class="h2">{{ t('press.colors') }}</h2>
        <ul class="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-5">
          <li v-for="c in t('press.swatches')" :key="c.hex" :class="[card, 'overflow-hidden']">
            <div class="h-16 ring-1 ring-white/7 ring-inset" :style="{ background: c.hex }" />
            <div class="px-3 py-2 text-[.82rem]">
              {{ c.name }} <span class="block font-mono text-white/55">{{ c.hex }}</span>
            </div>
          </li>
        </ul>
      </section>
    </main>
  </div>
</template>
