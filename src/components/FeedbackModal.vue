<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from '../i18n'
import { TALLY_FORM_ID } from '../site'

const { t } = useI18n()
const emit = defineEmits(['close'])

// Tally cannot take a POST from a hand-built form, so the chrome is the
// design's and the fields are Tally's, drawn transparent inside it.
const SRC = `https://tally.so/embed/${TALLY_FORM_ID}?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1`

const frame = ref(null)
const onKey = (e) => e.key === 'Escape' && emit('close')

onMounted(async () => {
  window.addEventListener('keydown', onKey)
  document.body.style.overflow = 'hidden'
  try {
    if (!window.Tally) {
      await new Promise((ok, fail) => {
        document.head.append(Object.assign(document.createElement('script'), {
          src: 'https://tally.so/widgets/embed.js',
          onload: ok,
          onerror: fail,
        }))
      })
    }
    window.Tally.loadEmbeds()
  } catch {
    // blocked: the iframe still renders, it just keeps its fallback height
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  document.body.style.overflow = ''
})
</script>

<template>
  <div
    class="fixed inset-0 z-20 flex animate-fb-fade items-center justify-center overflow-y-auto bg-[rgba(6,7,9,.72)] p-6 backdrop-blur-[6px]"
    @click="emit('close')"
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="fb-title"
      class="flex max-h-[88vh] w-full max-w-[35rem] animate-fb-in flex-col overflow-hidden rounded-2xl bg-[#131417] shadow-[0_2.5rem_6.25rem_rgba(0,0,0,.66),inset_0_0_0_1px_rgba(255,255,255,.08)]"
      @click.stop
    >
      <div class="flex min-h-0 flex-1 flex-col gap-[1.125rem] overflow-y-auto px-[1.625rem] pt-[1.625rem] pb-5">
        <div class="flex items-start gap-[.875rem]">
          <div class="flex min-w-0 flex-col gap-[.3rem]">
            <span id="fb-title" class="text-[1.06rem] font-semibold tracking-[-.015em] text-white">{{ t('feedback.title') }}</span>
            <span class="text-[.82rem] leading-[1.5] text-pretty text-white/55">{{ t('feedback.blurb') }}</span>
          </div>
          <button
            type="button"
            :aria-label="t('feedback.close')"
            class="ml-auto flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-transparent text-[.94rem] leading-none text-white/44 transition-colors hover:bg-white/8 hover:text-white"
            @click="emit('close')"
          >
            ✕
          </button>
        </div>

        <iframe
          ref="frame"
          :data-tally-src="SRC"
          :src="SRC"
          :title="t('feedback.title')"
          loading="lazy"
          width="100%"
          height="520"
          frameborder="0"
          marginheight="0"
          marginwidth="0"
          class="w-full"
        />
      </div>

      <div class="flex items-center gap-3 bg-[#17181d] px-[1.625rem] py-[.8rem] shadow-[inset_0_1px_0_rgba(255,255,255,.06)]">
        <span class="text-[.75rem] leading-[1.45] text-pretty text-white/48">{{ t('feedback.privacy') }}</span>
      </div>
    </div>
  </div>
</template>
