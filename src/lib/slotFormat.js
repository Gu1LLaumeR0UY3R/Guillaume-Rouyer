// Affichage d'un créneau « AAAA-MM-JJTHH:mm » (heure de Paris, sans fuseau) : on écrit l'heure telle quelle, sans conversion.
const parts = (slot) => [+slot.slice(0, 4), +slot.slice(5, 7) - 1, +slot.slice(8, 10), +slot.slice(11, 13), +slot.slice(14, 16)]
export const fmtSlot = (slot, lang, opts) => new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', opts).format(new Date(...parts(slot)))
export const dayOf = (slot, lang) => fmtSlot(slot, lang, { weekday: 'long', day: 'numeric', month: 'long' })
export const hourOf = (slot, lang) => fmtSlot(slot, lang, { hour: '2-digit', minute: '2-digit' })
export const labelSlot = (slot, lang) => `${dayOf(slot, lang)} · ${hourOf(slot, lang)}`
// Ajoute des minutes (pour la fin d'un créneau)
export function addMin(slot, m) {
  const [y, mo, d, h, mi] = parts(slot)
  const x = new Date(y, mo, d, h, mi + m)
  const p = (n) => String(n).padStart(2, '0')
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}T${p(x.getHours())}:${p(x.getMinutes())}`
}
