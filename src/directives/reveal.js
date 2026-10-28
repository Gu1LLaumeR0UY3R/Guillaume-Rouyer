// Apparition douce d'un bloc au défilement (jouée une seule fois).
export const reveal = {
  mounted(el) {
    el.classList.add('reveal')
    if (!('IntersectionObserver' in window)) { el.classList.add('in'); return }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { el.classList.add('in'); io.disconnect() }
    }, { threshold: 0.15 })
    io.observe(el)
    el._io = io
  },
  unmounted(el) { el._io?.disconnect() },
}
