<script setup>
import { onMounted, ref } from 'vue'
import ModalShell from './ModalShell.vue'
import { useI18n } from '../i18n'
import { parseNotes } from '../releases'
import { GH_REPO } from '../site'

const { t } = useI18n()
const emit = defineEmits(['close'])

const RELEASES_URL = `https://github.com/${GH_REPO}/releases`

const state = ref('loading')
const release = ref(null)

const day = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' })

// Only what shipped last — the rest is one click away on GitHub, already
// paginated and searchable, which this panel would only do worse.
// /releases/latest skips drafts and prereleases for us; it 404s on a repo with
// no release yet, which is the empty state rather than a failure.
onMounted(async () => {
  try {
    const res = await fetch(`https://api.github.com/repos/${GH_REPO}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json' },
    })
    if (res.status === 404) return (state.value = 'empty')
    if (!res.ok) throw new Error(res.status)
    const r = await res.json()
    const notes = parseNotes(r.body)
    release.value = {
      v: r.tag_name || r.name,
      date: r.published_at ? day.format(new Date(r.published_at)) : '',
      ...notes,
    }
    state.value = 'ok'
  } catch {
    state.value = 'err'
  }
})

// The sections RELEASE_NOTES.md names by example, in the app's own tones. Notes
// are free to invent their own — emoji and all — and those read neutral rather
// than have a colour guessed for them.
const TONE = { new: 'text-go', fixed: 'text-info', 'heads up': 'text-watch' }
const tone = (tag) => TONE[tag.toLowerCase().replace(/[^a-z ]/g, '').trim()] ?? 'text-white/45'

// The notes are told to use absolute https links, so a bare URL is expected and
// should be clickable. Split rather than v-html: no markup reaches the DOM.
const parts = (text) => text.split(/(https?:\/\/[^\s<>()]+[^\s<>().,;:!?])/g)
</script>

<template>
  <ModalShell panel="max-w-[32.5rem] max-h-[80vh]" @close="emit('close')">
    <template #default="{ titleId }">
      <div class="flex shrink-0 items-center gap-[.875rem] px-[1.375rem] pt-[1.25rem] pb-4">
        <div class="flex min-w-0 flex-col gap-1">
          <span :id="titleId" class="text-[1.06rem] font-semibold tracking-[-.015em] text-white">{{ t('changelog.title') }}</span>
          <span class="text-[.78rem] text-white/50">{{ t('changelog.blurb') }}</span>
        </div>
        <button
          type="button"
          :aria-label="t('changelog.close')"
          class="ml-auto flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-transparent text-[.94rem] leading-none text-white/44 transition-colors hover:bg-white/8 hover:text-white"
          @click="emit('close')"
        >
          ✕
        </button>
      </div>

      <!-- [&>*]:shrink-0 — a flex column shrinks its children by default, so a
           long release would be squashed and clipped instead of scrolled. -->
      <div class="flex min-h-0 flex-1 flex-col gap-[1.125rem] overflow-y-auto px-[1.375rem] pb-5 [&>*]:shrink-0">
        <p v-if="state !== 'ok'" class="m-0 text-[.78rem] leading-[1.5] text-white/50">
          {{ t(`changelog.${state}`) }}
          <a v-if="state === 'err'" :href="RELEASES_URL" target="_blank" rel="noopener" class="text-go underline underline-offset-2">
            {{ t('changelog.all') }}
          </a>
        </p>

        <template v-else>
          <div class="flex flex-wrap items-baseline gap-[.625rem]">
            <span class="text-[.97rem] font-semibold text-white">{{ release.v }}</span>
            <span class="font-mono text-[.69rem] text-white/58">{{ release.date }}</span>
          </div>

          <p
            v-if="release.lede"
            class="m-0 rounded-[.7rem] bg-[rgba(62,201,138,.08)] px-[.94rem] py-[.8rem] text-[.78rem] leading-[1.5] text-pretty text-white/66 shadow-[inset_0_0_0_1px_rgba(62,201,138,.22)]"
          >
            {{ release.lede }}
          </p>

          <!-- The section name is a heading, not a column: notes name their own
               sections, and "What it does" never fit a 4rem tag gutter. -->
          <div v-for="(sec, si) in release.sections" :key="si" class="flex flex-col gap-[.44rem]">
            <span v-if="sec.tag" class="font-mono text-[.6rem] tracking-[.12em] uppercase" :class="tone(sec.tag)">{{ sec.tag }}</span>
            <div class="flex flex-col gap-px overflow-hidden rounded-[.625rem] bg-white/5">
              <p
                v-for="(text, n) in sec.items"
                :key="n"
                class="m-0 bg-[#17181d] px-[.8rem] py-[.7rem] text-[.78rem] leading-[1.5] text-pretty text-white/72"
              >
                <template v-for="(bit, b) in parts(text)" :key="b">
                  <a
                    v-if="/^https?:\/\//.test(bit)"
                    :href="bit"
                    target="_blank"
                    rel="noopener"
                    class="break-all text-go underline underline-offset-2 hover:text-go-light"
                  >{{ bit }}</a>
                  <template v-else>{{ bit }}</template>
                </template>
              </p>
            </div>
          </div>
        </template>
      </div>

      <div class="flex shrink-0 items-center gap-[.625rem] bg-[#17181d] px-[1.375rem] py-[.8rem] shadow-[inset_0_1px_0_rgba(255,255,255,.06)]">
        <span class="hidden font-mono text-[.72rem] text-white/62 sm:inline">{{ t('changelog.auto') }}</span>
        <a
          :href="RELEASES_URL"
          target="_blank"
          rel="noopener"
          class="ml-auto inline-flex items-center gap-[.375rem] rounded-[.56rem] bg-white/8 px-[.875rem] py-2 text-[.8rem] font-semibold whitespace-nowrap text-white/80 transition-colors hover:bg-white/14 hover:text-white"
        >
          {{ t('changelog.viewAll') }}
          <span aria-hidden="true" class="text-[.7rem] text-white/50">↗</span>
        </a>
        <button
          type="button"
          class="cursor-pointer rounded-[.56rem] bg-go px-[1.125rem] py-2 text-[.8rem] font-semibold whitespace-nowrap text-[#06231a] transition-colors hover:bg-[#56dfa0]"
          @click="emit('close')"
        >
          {{ t('changelog.done') }}
        </button>
      </div>
    </template>
  </ModalShell>
</template>
