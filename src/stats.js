// Mesure d'audience sans cookie : le navigateur envoie quelques compteurs anonymes (page vue, temps actif, clic sur un lien de contact,
// choix du thème, arbre planté). Rien n'est stocké dans le navigateur, sauf le choix « ne pas me compter ».
// Désactivée si le visiteur l'a demandé, s'il a activé « Do Not Track » / « Global Privacy Control », ou si le navigateur est piloté par un robot.
import { consent } from './consent.js'

const KEY = 'stats-off'
const URL_ = '/mesure'

export const isOptedOut = () => {
  try { if (localStorage.getItem(KEY) === '1') return true } catch { /* stockage indisponible */ }
  return navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.globalPrivacyControl === true || navigator.webdriver === true
}
export function setOptOut(off) {
  try { off ? localStorage.setItem(KEY, '1') : localStorage.removeItem(KEY) } catch { /* ignoré */ }
}
export const optOutStored = () => { try { return localStorage.getItem(KEY) === '1' } catch { return false } }

function send(data) {
  if (isOptedOut()) return
  try {
    const body = new Blob([JSON.stringify(data)], { type: 'application/json' })
    if (!navigator.sendBeacon?.(URL_, body)) fetch(URL_, { method: 'POST', body, keepalive: true, credentials: 'same-origin' }).catch(() => {})
  } catch { /* une mesure perdue n'est pas grave */ }
}

// Temps actif : compté seulement quand l'onglet est visible et que le visiteur a bougé, cliqué, défilé ou tapé depuis moins de 30 secondes.
let path = null, active = 0, lastTick = 0, lastInput = 0, first = true
const IDLE = 30_000
function tick() {
  const now = Date.now()
  if (lastTick && document.visibilityState === 'visible' && now - lastInput < IDLE) active += Math.min(now - lastTick, 2000)
  lastTick = now
}
function flush() {
  tick()
  if (path && active >= 2000) send({ t: 'time', path, s: Math.round(active / 1000) })
  active = 0
}

export function initStats(router) {
  const touch = () => { lastInput = Date.now() }
  for (const ev of ['pointermove', 'pointerdown', 'keydown', 'scroll', 'touchstart']) addEventListener(ev, touch, { passive: true })
  setInterval(tick, 1000)
  addEventListener('pagehide', flush)
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush() })
  touch()

  function record(to) {
    if (to.path.startsWith('/admin')) return
    flush()
    path = to.path
    lastTick = Date.now()
    send({ t: 'view', path: to.path, ref: first ? document.referrer : '', first, c: consent.value === 'yes' ? 1 : 0 })
    first = false
  }
  router.afterEach((to, from) => { if (to.fullPath !== from?.fullPath) record(to) })
  // La toute première page se charge souvent avant l'enregistrement ci-dessus : on la compte ici si besoin.
  router.isReady().then(() => { if (first) record(router.currentRoute.value) })
}

export const track = {
  click: (k) => send({ t: 'click', k }),
  theme: (v) => send({ t: 'theme', v }),
  tree: () => send({ t: 'tree' }),
}
