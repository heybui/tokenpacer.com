<script setup>
import { onMounted, onUnmounted, useId } from 'vue'

// Backdrop, panel, Escape and the scroll lock — the chrome both modals on the
// design board share. Headers stay with each modal: the feedback one scrolls
// with the form and disappears on the thank-you, the changelog one is pinned.
defineProps({
  // Feedback is 35rem/88vh on the board, changelog 32.5rem/80vh.
  panel: { type: String, default: 'max-w-[35rem] max-h-[88vh]' },
})
const emit = defineEmits(['close'])

const titleId = useId()

const onKey = (e) => e.key === 'Escape' && emit('close')
onMounted(() => {
  window.addEventListener('keydown', onKey)
  document.body.style.overflow = 'hidden'
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
      :aria-labelledby="titleId"
      class="flex w-full animate-fb-in flex-col overflow-hidden rounded-2xl bg-[#131417] shadow-[0_2.5rem_6.25rem_rgba(0,0,0,.66),inset_0_0_0_1px_rgba(255,255,255,.08)]"
      :class="panel"
      @click.stop
    >
      <slot :title-id="titleId" />
    </div>
  </div>
</template>
