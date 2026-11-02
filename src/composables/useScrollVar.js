import { onBeforeUnmount, onMounted } from 'vue'

// Expose la position de défilement dans la variable CSS --scroll (utilisée pour la parallaxe des maquettes).
export function useScrollVar(elRef) {
  let raf = 0
  const update = () => {
    raf = 0
    elRef.value?.style.setProperty('--scroll', String(Math.round(window.scrollY)))
  }
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
  onMounted(() => { window.addEventListener('scroll', onScroll, { passive: true }); update() })
  onBeforeUnmount(() => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf) })
}
