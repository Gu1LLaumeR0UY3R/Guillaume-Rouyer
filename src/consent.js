// Consentement au cookie d'audience. Rien n'est posé tant que le visiteur n'a pas dit « Accepter ».
// Le choix est gardé dans le navigateur 13 mois, puis redemandé. « Refuser » est aussi simple qu'« Accepter ».
import { ref } from 'vue'

const KEY = 'cookie-consent'
const LIFE = 395 * 86400000

function read() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY))
    if (v && (v.c === 'yes' || v.c === 'no') && Date.now() - v.t < LIFE) return v.c
  } catch { /* stockage indisponible ou valeur abîmée : on redemande */ }
  return null
}
// Les visiteurs qui ont activé « Do Not Track » ou « Global Privacy Control » ne reçoivent jamais de cookie : inutile de les déranger.
const noTrack = () => typeof navigator !== 'undefined' && (navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.globalPrivacyControl === true || navigator.webdriver === true)

export const consent = ref(read()) // 'yes' | 'no' | null (pas encore choisi)
export const bannerOpen = ref(consent.value === null && !noTrack())

const beacon = (data) => {
  try { navigator.sendBeacon?.('/mesure', new Blob([JSON.stringify(data)], { type: 'application/json' })) } catch { /* ignoré */ }
}

export function choose(c, path) {
  consent.value = c
  bannerOpen.value = false
  try { localStorage.setItem(KEY, JSON.stringify({ c, t: Date.now() })) } catch { /* ignoré */ }
  if (c === 'no') beacon({ t: 'optout' }) // le serveur efface le cookie s'il existait
  else beacon({ t: 'visit', c: 1, path })
}
export const reopenBanner = () => { bannerOpen.value = true }
