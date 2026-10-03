import { onUnmounted, ref } from 'vue'

// The hover on readout.org: while the cursor rests on the button it keeps
// throwing off little monospace glyphs, which arc out and fade. Canvas rather
// than DOM nodes — a few hundred spans a second is the one way to make a hover
// jank. The palette is the app's own tones.
const CHARS = ['·', '˚', '∘', '⊹', '⋅', '⁺', '✧', '⋆', '˖', '∗']
const COLORS = ['#3ec98a', '#e8b33c', '#5aa9d6', '#a5f0cd', '#fbcda2', '#f2f2f4']
const pick = (a) => a[Math.floor(Math.random() * a.length)]

export function useSparkles() {
  const canvas = ref(null)
  const bits = []
  let frame = null // rAF handle, null while idle
  let spawn = null // the emit interval, null once the cursor leaves
  let at = { x: 0, y: 0 }

  // Sized on each enter instead of on a resize listener: a window resized
  // mid-hover is not worth a listener that lives for the whole page.
  const size = () => {
    const c = canvas.value
    const r = devicePixelRatio || 1
    c.width = innerWidth * r
    c.height = innerHeight * r
    c.style.width = `${innerWidth}px`
    c.style.height = `${innerHeight}px`
    c.getContext('2d').setTransform(r, 0, 0, r, 0, 0)
  }

  const burst = () => {
    for (let n = 4 + Math.floor(Math.random() * 3); n--; ) {
      const angle = Math.random() * Math.PI * 2
      const speed = 1.5 + Math.random() * 3
      bits.push({
        x: at.x + (Math.random() - 0.5) * 10,
        y: at.y + (Math.random() - 0.5) * 8,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        char: pick(CHARS),
        color: pick(COLORS),
        life: 1,
        span: 0.5 + Math.random() * 0.5, // seconds
        size: 9 + Math.random() * 10,
      })
    }
  }

  const draw = () => {
    const ctx = canvas.value?.getContext('2d')
    if (!ctx) return (frame = null)
    ctx.clearRect(0, 0, innerWidth, innerHeight)
    for (let i = bits.length - 1; i >= 0; i--) {
      const b = bits[i]
      b.life -= 1 / 60 / b.span
      if (b.life <= 0) {
        bits.splice(i, 1)
        continue
      }
      b.x += b.vx
      b.y += b.vy
      b.vy += 0.02 // a little gravity, so they fall rather than fly straight
      ctx.save()
      // Fade in over the first fifth, out over the last third.
      ctx.globalAlpha = Math.min(1, (1 - b.life) * 5, b.life * 3)
      ctx.fillStyle = b.color
      ctx.font = `${b.size}px ui-monospace, "SF Mono", Menlo, monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(b.char, b.x, b.y)
      ctx.restore()
    }
    // Nothing left to move and nobody hovering: stop asking for frames.
    frame = bits.length || spawn ? requestAnimationFrame(draw) : null
  }

  const move = (e) => (at = { x: e.clientX, y: e.clientY })

  const leave = () => {
    clearInterval(spawn)
    spawn = null
  }

  const enter = (e) => {
    if (spawn || !canvas.value) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    move(e)
    size()
    burst()
    spawn = setInterval(burst, 35)
    frame ??= requestAnimationFrame(draw)
  }

  onUnmounted(() => {
    leave()
    cancelAnimationFrame(frame)
  })

  return { canvas, hover: { mouseenter: enter, mousemove: move, mouseleave: leave } }
}
