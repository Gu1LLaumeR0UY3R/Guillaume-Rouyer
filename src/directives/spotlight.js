// Halo lumineux qui suit le curseur et légère inclinaison d'une carte (souris uniquement, animations réduites respectées).
const query = (q) => typeof matchMedia === 'function' && matchMedia(q).matches

export const spotlight = {
  mounted(el) {
    if (!query('(pointer: fine)') || query('(prefers-reduced-motion: reduce)')) return
    const move = (e) => {
      const r = el.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width
      const y = (e.clientY - r.top) / r.height
      el.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`)
      el.style.setProperty('--my', `${(y * 100).toFixed(1)}%`)
      el.style.setProperty('--rx', `${((0.5 - y) * 6).toFixed(2)}deg`)
      el.style.setProperty('--ry', `${((x - 0.5) * 8).toFixed(2)}deg`)
    }
    const leave = () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg') }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    el._spotlight = { move, leave }
  },
  unmounted(el) {
    if (!el._spotlight) return
    el.removeEventListener('pointermove', el._spotlight.move)
    el.removeEventListener('pointerleave', el._spotlight.leave)
  },
}
