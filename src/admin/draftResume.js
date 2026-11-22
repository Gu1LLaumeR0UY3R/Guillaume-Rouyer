// Quand on arrive dans un éditeur depuis l'onglet Versions avec « ?brouillon=1 », renvoie le brouillon à reprendre (sinon null).
import { api } from './api.js'
import { toast } from './toasts.js'

export async function takeDraft(kind, ref) {
  if (!new URLSearchParams(location.search).has('brouillon')) return null
  try {
    const d = (await api(`/api/admin/drafts?kind=${kind}&ref=${encodeURIComponent(ref)}`)).draft
    if (d) toast('Brouillon repris dans le formulaire. Enregistre pour le publier.', 'info')
    return d?.data ?? null
  } catch { return null }
}
