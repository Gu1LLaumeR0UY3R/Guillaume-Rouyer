// Sélection multiple dans les listes de l'admin + exécution d'une action sur chaque élément choisi.
import { computed, ref } from 'vue'

export function useBulk(keyOf) {
  const picked = ref(new Set())
  const busy = ref(false)
  const count = computed(() => picked.value.size)
  const has = (item) => picked.value.has(keyOf(item))
  function toggle(item) {
    const s = new Set(picked.value)
    s.has(keyOf(item)) ? s.delete(keyOf(item)) : s.add(keyOf(item))
    picked.value = s
  }
  const allOn = (list) => list.length > 0 && list.every(has)
  function toggleAll(list) {
    picked.value = allOn(list) ? new Set() : new Set(list.map(keyOf))
  }
  const clear = () => { picked.value = new Set() }
  // Applique `fn(item)` à chaque élément sélectionné, un par un. Renvoie { ok, failed: [{ item, message }] }.
  async function run(list, fn) {
    busy.value = true
    const out = { ok: 0, failed: [] }
    try {
      for (const item of list.filter(has)) {
        try { await fn(item); out.ok++ } catch (e) { out.failed.push({ item, message: e.message }) }
      }
    } finally { busy.value = false }
    return out
  }
  return { picked, busy, count, has, toggle, toggleAll, allOn, clear, run }
}
