// Créneaux de disponibilité pour échanger. Logique pure, partagée par le serveur (validation) et par le navigateur (calendrier) :
// une seule règle pour décider si un créneau existe, donc impossible que le site affiche un créneau que l'API refuse.
// Les heures sont des heures « murales » de Paris, écrites sans fuseau : « 2026-12-03T14:30 ».
export const MOTIFS = ['alternance', 'collaboration', 'projet', 'autre']
export const DURATIONS = [15, 30, 45, 60]
export const SLOT_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/
export const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/
export const MIN_NOTICE_H = 24 // on ne réserve pas pour dans moins de 24 h
export const MAX_DAYS = 42 // ni à plus de 6 semaines

const pad = (n) => String(n).padStart(2, '0')
const toMin = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3))
const PARIS = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })

// Heure de Paris à l'instant donné (ms), au format « AAAA-MM-JJTHH:mm » : se compare comme du texte
export function parisNow(ms = Date.now()) {
  const p = Object.fromEntries(PARIS.formatToParts(new Date(ms)).map((x) => [x.type, x.value]))
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`
}

// Extrait la disponibilité des réglages du site
export const availabilityOf = (s) => ({ on: !!s.availOn, days: Array.isArray(s.availDays) ? s.availDays : [], duration: DURATIONS.includes(s.availDuration) ? s.availDuration : 30 })

// Tous les créneaux de `from` à `to` (inclus), au format des SLOT_RE
export function slotsBetween(avail, from, to) {
  if (!avail.on) return []
  const out = []
  const end = Date.UTC(+to.slice(0, 4), +to.slice(5, 7) - 1, +to.slice(8, 10))
  for (let t = Date.UTC(+from.slice(0, 4), +from.slice(5, 7) - 1, +from.slice(8, 10)); t <= end; t += 86400000) {
    const d = new Date(t)
    const day = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
    for (const w of avail.days.filter((x) => x.dow === d.getUTCDay())) {
      for (let m = toMin(w.start); m + avail.duration <= toMin(w.end); m += avail.duration) {
        const slot = `${day}T${pad(Math.floor(m / 60))}:${pad(m % 60)}`
        if (slot >= from && slot <= to) out.push(slot)
      }
    }
  }
  return out
}

// Fenêtre réservable maintenant : de « dans 24 h » à « dans 6 semaines »
export function bookableWindow(now = Date.now()) {
  return { from: parisNow(now + MIN_NOTICE_H * 3600e3), to: parisNow(now + MAX_DAYS * 86400e3) }
}
export function bookableSlots(avail, now = Date.now()) {
  const { from, to } = bookableWindow(now)
  return slotsBetween(avail, from, to)
}
export const validSlot = (avail, slot, now = Date.now()) => SLOT_RE.test(slot) && bookableSlots(avail, now).includes(slot)
