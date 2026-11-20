// Pastilles de la barre latérale. Un appel toutes les 45 s tant que l'onglet est visible ; une nouvelle alerte déclenche une notification.
import { reactive } from 'vue'
import { api } from './api.js'
import { toast } from './toasts.js'

export const badges = reactive({ alerts: 0, messages: 0 })
let timer = null
let lastMsg = null // date du dernier message connu (même logique que les alertes)
let lastAt = null // date de la dernière alerte déjà connue (null = premier appel : on ne notifie pas l'existant)

export async function refreshBadges() {
  if (document.hidden) return
  try {
    const d = await api('/api/admin/badges')
    badges.alerts = d.alerts
    badges.messages = d.messages
    if (d.latestMessage) {
      if (lastMsg !== null && d.latestMessage.at > lastMsg) toast(`Nouveau message de ${d.latestMessage.name}`, 'info', 10000)
      lastMsg = Math.max(lastMsg ?? 0, d.latestMessage.at)
    } else if (lastMsg === null) lastMsg = 0
    if (d.latest) {
      if (lastAt !== null && d.latest.at > lastAt) toast(`Alerte : ${d.latest.title}`, d.latest.level === 'critical' ? 'danger' : 'warn', 10000)
      lastAt = Math.max(lastAt ?? 0, d.latest.at)
    } else if (lastAt === null) lastAt = 0
  } catch { /* session expirée ou réseau coupé : la prochaine navigation renverra vers la connexion */ }
}

export function startBadges() {
  if (timer) return
  lastAt = null
  lastMsg = null
  refreshBadges()
  timer = setInterval(refreshBadges, 45000)
}
export function stopBadges() { clearInterval(timer); timer = null }
