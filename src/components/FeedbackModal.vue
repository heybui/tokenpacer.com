<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from '../i18n'
import { MC_ACTION, MC_BOT_FIELD, MC_MAX } from '../site'

const { t } = useI18n()
const emit = defineEmits(['close'])

// The design's three chips, carrying Mailchimp's MMERGE7 values.
const KINDS = [
  ['broken', 'bug'],
  ['idea', 'idea'],
  ['else', 'question'],
]

const kind = ref('bug')
const msg = ref('')
const mail = ref('')
const err = ref('')
const sending = ref(false)
const sent = ref(false)

const valid = computed(() => msg.value.trim().length > 3 && /^\S+@\S+\.\S+$/.test(mail.value))

const onKey = (e) => e.key === 'Escape' && emit('close')
onMounted(() => {
  window.addEventListener('keydown', onKey)
  document.body.style.overflow = 'hidden'
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  document.body.style.overflow = ''
})

// JSONP, because list-manage sends no CORS headers: a plain fetch cannot read
// the reply and a plain form POST would navigate away from the page.
const send = () => {
  if (!valid.value || sending.value) return
  sending.value = true
  err.value = ''

  const cb = `mc_${Date.now()}`
  const script = document.createElement('script')
  const done = (message) => {
    delete window[cb]
    script.remove()
    sending.value = false
    if (message) err.value = message
    else sent.value = true
  }

  window[cb] = (res) => {
    // "already subscribed" comes back as an error; the message is still lost,
    // but telling someone their feedback failed is worse than a quiet thanks.
    const already = /already subscribed/i.test(res?.msg ?? '')
    done(res?.result === 'success' || already ? '' : stripTags(res?.msg) || t('feedback.err'))
  }
  script.onerror = () => done(t('feedback.err'))

  const q = new URLSearchParams({
    EMAIL: mail.value.trim(),
    MMERGE7: kind.value,
    MMERGE1: msg.value.trim().slice(0, MC_MAX),
    [MC_BOT_FIELD]: '',
    c: cb,
  })
  script.src = `${MC_ACTION}&${q}`
  document.body.append(script)
}

// Mailchimp prefixes with the field index ("0 - ...") and marks links up.
const stripTags = (s) => (s ?? '').replace(/<[^>]*>/g, '').replace(/^\d+\s*-\s*/, '').trim()
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
      <!-- Sent -->
      <div v-if="sent" class="flex flex-col items-center gap-4 px-7 pt-14 pb-[3.625rem] text-center">
        <div class="flex size-11 items-center justify-center rounded-full bg-[rgba(62,201,138,.14)] shadow-[inset_0_0_0_1px_rgba(62,201,138,.4)]">
          <span class="block h-2 w-[.94rem] -translate-y-[.19rem] translate-x-[.06rem] -rotate-45 border-b-[2.5px] border-l-[2.5px] border-go" />
        </div>
        <span class="text-base font-semibold text-white">{{ t('feedback.sentTitle') }}</span>
        <span class="max-w-[34ch] text-[.82rem] leading-[1.55] text-pretty text-white/55">{{ t('feedback.sentBody') }}</span>
      </div>

      <!-- Form -->
      <template v-else>
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

          <div class="flex flex-wrap gap-[.44rem]">
            <button
              v-for="[key, value] in KINDS"
              :key="value"
              type="button"
              class="cursor-pointer rounded-full px-[.875rem] py-[.44rem] text-[.78rem] font-medium whitespace-nowrap transition-colors"
              :class="kind === value
                ? 'bg-go text-[#06231a]'
                : 'bg-transparent text-white/62 shadow-[inset_0_0_0_1px_rgba(255,255,255,.14)] hover:text-white'"
              @click="kind = value"
            >
              {{ t(`feedback.kinds.${key}`) }}
            </button>
          </div>

          <div class="flex flex-col gap-[.44rem]">
            <textarea
              v-model="msg"
              :maxlength="MC_MAX"
              :placeholder="t('feedback.placeholder')"
              class="h-[9.375rem] w-full resize-none rounded-[.625rem] border-0 bg-[#17181d] px-[.875rem] py-[.8rem] font-sans text-[.84rem] leading-[1.55] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,.09)] outline-none placeholder:text-white/32 focus:shadow-[inset_0_0_0_1px_rgba(62,201,138,.5)]"
            />
            <span
              class="self-end font-mono text-[.66rem]"
              :class="msg.length >= MC_MAX ? 'text-watch' : 'text-white/45'"
            >{{ msg.length }}/{{ MC_MAX }}</span>
          </div>

          <div class="flex flex-col gap-[.44rem]">
            <input
              v-model="mail"
              type="email"
              :placeholder="t('feedback.email')"
              class="h-10 w-full rounded-[.625rem] border-0 bg-[#17181d] px-[.8rem] font-sans text-[.84rem] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,.09)] outline-none placeholder:text-white/32 focus:shadow-[inset_0_0_0_1px_rgba(62,201,138,.5)]"
            />
            <span class="text-[.69rem] leading-[1.4] text-white/40">{{ t('feedback.list') }}</span>
          </div>

          <span v-if="err" class="text-[.72rem] text-over-light">{{ err }}</span>
        </div>

        <div
          class="flex shrink-0 items-center gap-[.875rem] bg-[#17181d] px-[1.625rem] py-[.94rem] shadow-[inset_0_1px_0_rgba(255,255,255,.06)]"
        >
          <span class="min-w-0 flex-1 text-[.72rem] leading-[1.45] text-pretty text-white/62">{{ t('feedback.privacy') }}</span>
          <button
            type="button"
            :disabled="!valid || sending"
            class="ml-auto rounded-[.625rem] px-5 py-[.625rem] text-[.84rem] font-semibold whitespace-nowrap transition-colors"
            :class="valid && !sending
              ? 'cursor-pointer bg-go text-[#06231a] hover:bg-[#56dfa0]'
              : 'cursor-not-allowed bg-white/8 text-white/34'"
            @click="send"
          >
            {{ sending ? t('feedback.sending') : t('feedback.send') }}
          </button>
        </div>
      </template>
    </div>
  </div>
</template>
