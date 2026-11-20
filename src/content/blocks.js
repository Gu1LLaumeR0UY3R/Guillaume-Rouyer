// Chargement d'un bloc de contenu modifiable (/api/content/<clé>). Renvoie null si le bloc n'a jamais été modifié ou si l'API est indisponible :
// la page utilise alors son contenu d'origine. Résultat gardé en mémoire pour la durée de la visite.
import { ref } from 'vue'

const cache = new Map()
export function loadBlock(key) {
  if (!cache.has(key)) {
    cache.set(key, fetch(`/api/content/${key}`, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(3000) })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => (d && Object.keys(d).some((k) => k !== 'updatedAt') ? d : null))
      .catch(() => null))
  }
  return cache.get(key)
}

// `ready` passe à true une fois la réponse reçue (ou abandonnée) : on évite d'afficher le texte d'origine puis de le remplacer.
export function useBlock(key) {
  const data = ref(null), ready = ref(false)
  loadBlock(key).then((d) => { data.value = d }).finally(() => { ready.value = true })
  return { data, ready }
}
