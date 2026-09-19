<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from '../i18n'
import { CONTACT_EMAIL, GH_REPO, MC_ACTION, MC_BOT_FIELD, MC_MAX, VERSION } from '../site'

const { t } = useI18n()
const emit = defineEmits(['close'])

// key → [Mailchimp MMERGE7 value, GitHub label, title prefix]
const KINDS = [
  ['bug', 'bug', 'bug', 'Bug: '],
  ['idea', 'idea', 'enhancement', 'Idea: '],
  ['question', 'question', 'question', 'Question: '],
]

const kind = ref(KINDS[0])
const subj = ref('')
const msg = ref('')
const mail = ref('')
const err = ref('')
const sending = ref(false)
const route = ref('')

const written = computed(() => msg.value.trim().length > 3)
const tooLong = computed(() => msg.value.trim().length > MC_MAX)
const canSend = computed(() => written.value && !tooLong.value && /^\S+@\S+\.\S+$/.test(mail.value))

const title = computed(() => {
  const typed = subj.value.trim()
  if (typed) return typed
  const first = msg.value.trim().split('\n')[0].slice(0, 60)
  return first ? kind.value[3] + first : ''
})
const body = computed(() => `${msg.value.trim()}\n\n${t('feedback.signature', { version: VERSION })}`)

const linkFor = (where) => {
  const label = t(`feedback.kinds.${kind.value[0]}.label`)
  if (where === 'email') {
    const q = new URLSearchParams(kept({
      subject: title.value ? `[${label}] ${title.value}` : `[${label}]`,
      body: msg.value.trim() && body.value,
    }))
    return `mailto:${CONTACT_EMAIL}?${q}`
  }
  // An issue FORM takes its prefill by field id; a body= param is ignored.
  const q = new URLSearchParams(kept({
    template: 'feedback.yml',
    labels: kind.value[2],
    title: title.value,
    topic: label,
    details: msg.value.trim(),
    version: VERSION,
  }))
  return `https://github.com/${GH_REPO}/issues/new?${q}`
}

const kept = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v))

const handOff = (where) => {
  const url = linkFor(where)
  route.value = where
  // mailto: through window.open can leave a blank tab behind on some browsers.
  if (where === 'email') window.location.href = url
  else window.open(url, '_blank', 'noopener')
}

const onKey = (e) => e.key === 'Escape' && emit('close')
onMounted(() => {
  window.addEventListener('keydown', onKey)
  document.body.style.overflow = 'hidden'
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  document.body.style.overflow = ''
})

// JSONP, because list-manage sends no CORS headers: a fetch cannot read the
// reply and a native POST would navigate away from the page.
const send = () => {
  if (!canSend.value || sending.value) return
  sending.value = true
  err.value = ''

  const cb = `mc_${Date.now()}`
  const script = document.createElement('script')
  const done = (message) => {
    delete window[cb]
    script.remove()
    sending.value = false
    if (message) err.value = message
    else route.value = 'direct'
  }

  window[cb] = (res) => {
    // A repeat address comes back as an error and the merge fields are not
    // updated. Telling someone their feedback failed is worse than a thanks.
    const already = /already subscribed/i.test(res?.msg ?? '')
    done(res?.result === 'success' || already ? '' : clean(res?.msg) || t('feedback.err'))
  }
  script.onerror = () => done(t('feedback.err'))

  const q = new URLSearchParams({
    EMAIL: mail.value.trim(),
    MMERGE7: kind.value[1],
    MMERGE1: [subj.value.trim(), msg.value.trim()].filter(Boolean).join(' — ').slice(0, MC_MAX),
    [MC_BOT_FIELD]: '',
    c: cb,
  })
  script.src = `${MC_ACTION}&${q}`
  document.body.append(script)
}

// Mailchimp prefixes with the field index ("0 - ...") and marks links up.
const clean = (s) => (s ?? '').replace(/<[^>]*>/g, '').replace(/^\d+\s*-\s*/, '').trim()
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
      <!-- Handed off, or sent -->
      <div v-if="route" class="flex flex-col items-center gap-4 px-7 pt-14 pb-[3.625rem] text-center">
        <div class="flex size-11 items-center justify-center rounded-full bg-[rgba(62,201,138,.14)] shadow-[inset_0_0_0_1px_rgba(62,201,138,.4)]">
          <span class="block h-2 w-[.94rem] -translate-y-[.19rem] translate-x-[.06rem] -rotate-45 border-b-[2.5px] border-l-[2.5px] border-go" />
        </div>
        <span class="text-base font-semibold text-white">{{ t(`feedback.sent.${route}.title`) }}</span>
        <span class="max-w-[34ch] text-[.82rem] leading-[1.55] text-pretty text-white/55">{{ t(`feedback.sent.${route}.note`) }}</span>
        <a
          v-if="route !== 'direct'"
          :href="linkFor(route)"
          :target="route === 'github' ? '_blank' : undefined"
          rel="noopener"
          class="font-mono text-[.69rem] text-white/44 underline decoration-white/20 underline-offset-4 transition-colors hover:text-go"
        >
          {{ route === 'github' ? `github.com/${GH_REPO}/issues/new` : CONTACT_EMAIL }}
        </a>
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

          <div class="flex flex-col gap-[.56rem]">
            <span class="font-mono text-[.6rem] tracking-[.12em] text-white/42 uppercase">{{ t('feedback.topic') }}</span>
            <div class="flex flex-wrap gap-[.44rem]">
              <button
                v-for="k in KINDS"
                :key="k[0]"
                type="button"
                class="cursor-pointer rounded-full px-[.875rem] py-[.44rem] text-[.78rem] font-medium whitespace-nowrap transition-colors"
                :class="kind[0] === k[0]
                  ? 'bg-go text-[#06231a]'
                  : 'bg-transparent text-white/62 shadow-[inset_0_0_0_1px_rgba(255,255,255,.14)] hover:text-white'"
                @click="kind = k"
              >
                {{ t(`feedback.kinds.${k[0]}.label`) }}
              </button>
            </div>
          </div>

          <div class="flex flex-col gap-[.56rem]">
            <input
              v-model="subj"
              type="text"
              maxlength="90"
              :placeholder="t(`feedback.kinds.${kind[0]}.subject`)"
              class="h-10 w-full rounded-[.625rem] border-0 bg-[#17181d] px-[.8rem] font-sans text-[.84rem] font-medium text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,.09)] outline-none placeholder:font-normal placeholder:text-white/32 focus:shadow-[inset_0_0_0_1px_rgba(62,201,138,.5)]"
            />
            <textarea
              v-model="msg"
              maxlength="600"
              :placeholder="t('feedback.placeholder')"
              class="h-[8.25rem] w-full resize-none rounded-[.625rem] border-0 bg-[#17181d] px-[.875rem] py-[.8rem] font-sans text-[.84rem] leading-[1.55] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,.09)] outline-none placeholder:text-white/32 focus:shadow-[inset_0_0_0_1px_rgba(62,201,138,.5)]"
            />
            <span class="self-end font-mono text-[.66rem]" :class="tooLong ? 'text-watch' : 'text-white/45'">{{ msg.length }} / 600</span>
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

          <!-- Or take it elsewhere -->
          <div class="flex flex-col gap-[.7rem] pt-1">
            <div class="flex items-center gap-3">
              <span class="shrink-0 font-mono text-[.6rem] tracking-[.12em] text-white/42 uppercase">{{ t('feedback.elsewhere') }}</span>
              <span class="h-px flex-1 bg-white/8" />
            </div>
            <div class="grid grid-cols-2 gap-[.625rem]">
              <button
                v-for="r in [['github', 'GH', `${GH_REPO}`], ['email', '@', CONTACT_EMAIL]]"
                :key="r[0]"
                type="button"
                class="flex cursor-pointer items-center gap-[.625rem] rounded-[.7rem] bg-[#17181d] px-[.8rem] py-[.7rem] text-left shadow-[inset_0_0_0_1px_rgba(255,255,255,.08)] transition-[background,box-shadow] hover:bg-[#1c1e23] hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,.16)]"
                @click="handOff(r[0])"
              >
                <span class="flex size-[1.375rem] shrink-0 items-center justify-center rounded-[.44rem] bg-white/8 font-mono text-[.62rem] font-semibold text-white/72">{{ r[1] }}</span>
                <span class="flex min-w-0 flex-col gap-[.125rem]">
                  <span class="text-[.78rem] font-semibold whitespace-nowrap text-white/86">{{ t(`feedback.routes.${r[0]}`) }}</span>
                  <span class="truncate font-mono text-[.62rem] text-white/44">{{ r[2] }}</span>
                </span>
                <span class="ml-auto shrink-0 text-[.75rem] text-white/34">↗</span>
              </button>
            </div>
            <span class="text-[.72rem] leading-[1.5] text-pretty text-white/55">{{ t('feedback.routes.note') }}</span>
          </div>

          <span v-if="tooLong" class="text-[.72rem] text-watch">{{ t('feedback.tooLong') }}</span>
          <span v-if="err" class="text-[.72rem] text-over-light">{{ err }}</span>
        </div>

        <div class="flex shrink-0 items-center gap-[.875rem] bg-[#17181d] px-[1.625rem] py-[.94rem] shadow-[inset_0_1px_0_rgba(255,255,255,.06)]">
          <span class="min-w-0 flex-1 text-[.72rem] leading-[1.45] text-pretty text-white/62">{{ t('feedback.privacy') }}</span>
          <button
            type="button"
            :disabled="!canSend || sending"
            class="ml-auto rounded-[.625rem] px-5 py-[.625rem] text-[.84rem] font-semibold whitespace-nowrap transition-colors"
            :class="canSend && !sending
              ? 'cursor-pointer bg-go text-[#06231a] hover:bg-[#56dfa0]'
              : 'cursor-not-allowed bg-[rgba(62,201,138,.22)] text-white/34'"
            @click="send"
          >
            {{ sending ? t('feedback.sending') : t('feedback.send') }}
          </button>
        </div>
      </template>
    </div>
  </div>
</template>
