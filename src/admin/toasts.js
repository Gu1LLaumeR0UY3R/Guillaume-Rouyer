// Notifications « toaster » de l'admin (petites bulles en bas à droite).
import { reactive } from 'vue'

export const toasts = reactive([])
let n = 0

export function dismiss(id) {
  const i = toasts.findIndex((t) => t.id === id)
  if (i >= 0) toasts.splice(i, 1)
}
// level : info | warn | danger | ok. ms = 0 pour une bulle qui reste jusqu'à ce qu'on la ferme.
export function toast(text, level = 'info', ms = 7000) {
  const id = ++n
  toasts.push({ id, text, level })
  if (ms) setTimeout(() => dismiss(id), ms)
}
