<script setup>
import { computed, ref } from 'vue'
import { useHead } from '@unhead/vue'
import { RouterLink } from 'vue-router'
import NotchDemo from '../components/NotchDemo.vue'
import { DEFAULT_LOCALE, localePath, locales, messages, useI18n } from '../i18n'
import { BREW, DOWNLOAD_URL, FILE_SIZE, KOFI_URL, SITE_URL, VERSION } from '../site'

const { locale, t } = useI18n()

const DOTS = ['#3ec98a', '#3ec98a', '#e8b33c', '#5aa9d6', '#e2543f', '#3ec98a']
const features = computed(() => t('features').map((f, i) => ({ ...f, c: DOTS[i] })))
const canonical = computed(() => SITE_URL + localePath(locale.value))

useHead(
  computed(() => ({
    htmlAttrs: { lang: locale.value },
    title: t('meta.title'),
    meta: [
      { name: 'description', content: t('meta.description') },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'Token Pacer' },
      { property: 'og:title', content: t('meta.title') },
      { property: 'og:description', content: t('meta.description') },
      { property: 'og:url', content: canonical.value },
      { property: 'og:image', content: `${SITE_URL}/icon-512.png` },
      { property: 'og:locale', content: locale.value === 'vi' ? 'vi_VN' : 'en_US' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    link: [
      { rel: 'canonical', href: canonical.value },
      ...locales.map((l) => ({ rel: 'alternate', hreflang: l, href: SITE_URL + localePath(l) })),
      { rel: 'alternate', hreflang: 'x-default', href: SITE_URL + localePath(DEFAULT_LOCALE) },
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
          url: canonical.value,
          description: t('meta.description'),
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        }),
      },
    ],
  })),
)

const copied = ref(false)
let reset
const copyBrew = async () => {
  try {
    await navigator.clipboard.writeText(BREW)
  } catch {
    /* clipboard blocked — the command is on screen anyway */
  }
  copied.value = true
  clearTimeout(reset)
  reset = setTimeout(() => (copied.value = false), 1600)
}
</script>

<template>
  <div
    class="flex min-h-dvh animate-drift flex-col bg-base font-sans text-ink"
    style="
      background-image: radial-gradient(50% 50% at 50% 50%, rgba(62, 201, 138, 0.5), transparent 68%),
        radial-gradient(50% 50% at 50% 50%, rgba(56, 124, 172, 0.46), transparent 70%),
        radial-gradient(50% 50% at 50% 50%, rgba(232, 179, 60, 0.3), transparent 68%);
      background-size: 150% 140%, 165% 150%, 140% 130%;
      background-repeat: no-repeat;
      background-attachment: fixed;
    "
  >
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
              <span class="font-mono text-[.69rem] font-medium tracking-[.16em] text-white/44 uppercase">{{ t('hero.eyebrow') }}</span>
              <h1 class="m-0 text-[min(2.875rem,6.55cqw)] leading-[1.1] font-semibold tracking-[-.03em] whitespace-nowrap">
                {{ t('hero.headline') }}
              </h1>
            </div>
            <p class="m-0 max-w-[46ch] text-base leading-[1.55] text-balance text-white/62">{{ t('hero.sub') }}</p>
          </div>

          <ul class="grid list-none grid-cols-[repeat(auto-fit,minmax(min(12rem,100%),1fr))] gap-x-7 gap-y-4 p-0">
            <li v-for="f in features" :key="f.label" class="flex min-w-0 flex-col gap-1">
              <div class="flex items-center gap-2">
                <span class="size-[.3rem] shrink-0 rounded-full" :style="{ background: f.c }" />
                <span class="text-[.85rem] font-semibold text-white">{{ f.label }}</span>
              </div>
              <span class="text-[.78rem] leading-[1.5] text-balance text-white/50">{{ f.note }}</span>
            </li>
          </ul>

          <div class="flex flex-col gap-[.875rem]">
            <div class="flex flex-wrap items-center gap-3">
              <a
                :href="DOWNLOAD_URL"
                class="inline-flex items-center gap-[.55rem] rounded-[.625rem] bg-go px-[1.375rem] py-[.8rem] text-[.9rem] font-semibold whitespace-nowrap text-[#06231a] transition-colors hover:bg-[#56dfa0]"
              >
                <svg viewBox="0 0 14 14" aria-hidden="true" class="size-[.875rem] shrink-0 fill-current">
                  <rect x="6" y="0" width="2" height="7" rx="1" />
                  <path d="M2 6h10L7 11z" />
                  <rect x="1" y="12" width="12" height="2" rx="1" />
                </svg>
                {{ t('cta.download') }}
              </a>
              <a
                :href="KOFI_URL"
                rel="noopener"
                class="inline-flex items-center gap-[.55rem] rounded-[.625rem] px-5 py-[.8rem] text-[.9rem] font-medium whitespace-nowrap text-white/82 ring-1 ring-white/16 transition-colors hover:text-white hover:ring-white/34"
              >
                <span class="relative block h-[.8rem] w-[1.05rem] shrink-0 rounded-t-[.125rem] rounded-b-[.3rem] bg-[#ff5f5f]">
                  <span class="absolute top-[.125rem] -right-[.3rem] h-[.44rem] w-[.375rem] rounded-r-[.25rem] ring-2 ring-[#ff5f5f] ring-inset" />
                </span>
                {{ t('cta.kofi') }}
              </a>
            </div>

            <div class="flex flex-col gap-[.55rem]">
              <span class="font-mono text-[.75rem] text-white/58">{{ t('cta.requirements', { version: VERSION, size: FILE_SIZE }) }}</span>
              <button
                type="button"
                :aria-label="t('cta.copyHint')"
                class="inline-flex cursor-pointer items-center gap-[.625rem] self-start rounded-lg bg-sunken px-[.8rem] py-[.55rem] ring-1 ring-white/7 transition-[box-shadow] hover:ring-white/16"
                @click="copyBrew"
              >
                <span class="font-mono text-[.75rem] whitespace-nowrap text-white/72">{{ BREW }}</span>
                <span class="text-[.69rem] font-medium whitespace-nowrap" :class="copied ? 'text-go' : 'text-white/40'">
                  {{ copied ? t('cta.copied') : t('cta.copy') }}
                </span>
              </button>
            </div>
          </div>
        </div>

        <NotchDemo />
      </div>
    </main>

    <footer class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-[2.125rem] pt-[1.125rem] pb-7 text-[.75rem] text-white/52">
      <span>{{ t('footer.rights') }}</span>
      <nav class="flex items-center gap-4">
        <RouterLink
          v-for="l in locales"
          :key="l"
          :to="localePath(l)"
          class="transition-colors hover:text-go"
          :class="l === locale ? 'text-white' : 'text-white/52'"
          :hreflang="l"
        >
          {{ messages[l].localeName }}
        </RouterLink>
        <a href="#changelog" class="transition-colors hover:text-go">{{ t('footer.changelog') }}</a>
      </nav>
    </footer>
  </div>
</template>
