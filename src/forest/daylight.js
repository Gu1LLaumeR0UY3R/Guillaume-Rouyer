// Cycle jour/nuit : couleurs du ciel selon l'heure (0-24).
export const hexToRgb = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16))
export const mixRgb = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t)
export const rgbCss = (c, a = 1) => `rgba(${c.map(Math.round).join(',')},${a})`

// h = heure, top/bot = haut et bas du ciel, dark = assombrissement du décor (0 = plein jour)
const KEYS = [
  { h: 0, top: '#101a4c', bot: '#2c3c86', dark: 0.62 },
  { h: 5, top: '#18235a', bot: '#46498f', dark: 0.52 },
  { h: 6.5, top: '#9fb3e6', bot: '#ffc4a3', dark: 0.18 },
  { h: 8, top: '#d3ecff', bot: '#f6fbf4', dark: 0 },
  { h: 17.5, top: '#d3ecff', bot: '#f6fbf4', dark: 0 },
  { h: 19, top: '#8e93d6', bot: '#ffb98a', dark: 0.15 },
  { h: 20.5, top: '#2a2f78', bot: '#c26c8c', dark: 0.4 },
  { h: 22, top: '#101a4c', bot: '#2c3c86', dark: 0.62 },
  { h: 24, top: '#101a4c', bot: '#2c3c86', dark: 0.62 },
].map((k) => ({ ...k, top: hexToRgb(k.top), bot: hexToRgb(k.bot) }))

export function skyAt(hour) {
  let i = 0
  while (i < KEYS.length - 2 && hour >= KEYS[i + 1].h) i++
  const a = KEYS[i], b = KEYS[i + 1]
  const f = (hour - a.h) / (b.h - a.h)
  return { top: mixRgb(a.top, b.top, f), bot: mixRgb(a.bot, b.bot, f), dark: a.dark + (b.dark - a.dark) * f }
}

// Heure du visiteur. Pour tester : ajouter ?heure=22 dans l'URL.
export function hourNow() {
  const n = parseFloat(new URLSearchParams(location.search).get('heure'))
  if (Number.isFinite(n)) return ((n % 24) + 24) % 24
  const d = new Date()
  return d.getHours() + d.getMinutes() / 60
}
