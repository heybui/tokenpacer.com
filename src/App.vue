<script setup>
import { onMounted, onUnmounted } from 'vue'
import { RouterView } from 'vue-router'

// Nobody is watching, so stop painting. A hidden tab already fires
// visibilitychange, but a window that is merely unfocused does not — it stays
// on screen, and every always-on animation keeps the compositor producing
// frames behind whatever you switched to. hasFocus() is the case that misses.
//
// One class on <html> rather than a flag per component: it covers the ambient
// wash and the demo alike, and anything added later comes gated for free.
const park = () => document.documentElement.classList.toggle('page-idle', document.hidden || !document.hasFocus())

onMounted(() => {
  park()
  document.addEventListener('visibilitychange', park)
  addEventListener('blur', park)
  addEventListener('focus', park)
})
onUnmounted(() => {
  document.removeEventListener('visibilitychange', park)
  removeEventListener('blur', park)
  removeEventListener('focus', park)
})
</script>

<template>
  <RouterView />
</template>
