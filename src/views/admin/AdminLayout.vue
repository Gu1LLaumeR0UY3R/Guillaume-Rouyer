<script setup>
// Cadre de toutes les pages d'admin : barre latérale à gauche (pastilles comprises) + notifications.
import { onBeforeUnmount, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../../admin/api.js'
import { badges, startBadges, stopBadges } from '../../admin/badges.js'
import { dismiss, toasts } from '../../admin/toasts.js'
import './adminForm.css'

const router = useRouter()
const items = [
  { to: '/admin/tableau', label: 'Tableau de bord', tip: 'Vue d\'ensemble : chiffres clés, santé, alertes' },
  { to: '/admin/alertes', label: 'Alertes', tip: 'Événements de sécurité ou d\'erreur à traiter', badge: 'alerts' },
  { to: '/admin/projets', label: 'Projets', tip: 'Créer, modifier, masquer ou mettre en maintenance' },
  { to: '/admin/journaux', label: 'Journaux', tip: 'Historique détaillé, recherche et export CSV' },
  { to: '/admin/reglages', label: 'Réglages', tip: 'Contact, pied de page, maintenance globale' },
  { to: '/admin/compte', label: 'Compte et sécurité', tip: 'Mot de passe, 2FA, sessions ouvertes' },
]

onMounted(startBadges)
onBeforeUnmount(stopBadges)

async function logout() {
  try { await api('/api/admin/logout', { method: 'POST' }) } finally { router.push('/admin') }
}
</script>

<template>
  <div class="admin-shell">
    <aside class="side">
      <p class="brand">Administration</p>
      <nav aria-label="Administration">
        <ul>
          <li v-for="(i, n) in items" :key="i.to" :style="{ '--i': n }">
            <RouterLink :to="i.to" :title="i.tip">
              {{ i.label }}
              <span v-if="i.badge && badges[i.badge]" class="badge" :aria-label="`${badges[i.badge]} non lue(s)`">{{ badges[i.badge] }}</span>
            </RouterLink>
          </li>
        </ul>
      </nav>
      <div class="foot">
        <RouterLink class="btn btn-ghost small" to="/" target="_blank">Voir le site</RouterLink>
        <button class="btn btn-ghost small" type="button" @click="logout">Se déconnecter</button>
      </div>
    </aside>

    <div class="content"><slot /></div>

    <div class="toasts" role="status" aria-live="polite">
      <div v-for="t in toasts" :key="t.id" class="toast" :class="t.level">
        <span>{{ t.text }}</span>
        <button type="button" aria-label="Fermer la notification" @click="dismiss(t.id)">×</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-shell{display:grid;grid-template-columns:250px minmax(0,1fr);min-height:100vh;background:var(--bg);color:var(--fg)}
.side{position:sticky;top:0;align-self:start;display:flex;flex-direction:column;gap:14px;height:100vh;padding:22px 14px;border-right:1px solid var(--line);background:var(--card)}
.brand{margin:0 8px;font:600 20px var(--serif)}
nav ul{display:grid;gap:4px;margin:0;padding:0;list-style:none}
nav a{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:44px;padding:0 14px;border-radius:12px;color:var(--fg);font:600 15px/1 var(--font);text-decoration:none;transition:background .2s,transform .2s,box-shadow .2s}
nav a:hover{background:var(--bg);transform:translateX(4px)}
nav li{animation:slidein .4s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i) * 50ms)}
nav a.router-link-active{background:var(--green);color:var(--on-green);box-shadow:0 8px 18px -10px var(--glow)}
@keyframes slidein{from{opacity:0;transform:translateX(-14px)}}
.badge{display:inline-flex;align-items:center;justify-content:center;min-width:22px;height:22px;padding:0 7px;border-radius:999px;background:#b42318;color:#fff;font:700 12px/1 var(--font);animation:bounce 2s ease-in-out infinite}
@keyframes bounce{0%,80%,100%{transform:scale(1)}90%{transform:scale(1.18)}}
.foot{display:grid;gap:8px;margin-top:auto}
.small{min-height:38px;padding:0 14px;font-size:14px}
.toasts{position:fixed;right:16px;bottom:16px;z-index:200;display:grid;gap:10px;width:min(380px,calc(100vw - 32px))}
.toast{animation:toastin .35s cubic-bezier(.2,.8,.2,1) both;display:flex;gap:12px;align-items:flex-start;justify-content:space-between;padding:12px 14px;border:1px solid var(--line);border-left:5px solid var(--green);border-radius:12px;background:var(--card);box-shadow:0 12px 28px -14px rgba(0,0,0,.45)}
.toast.warn{border-left-color:#f59e0b}
.toast.danger{border-left-color:#b42318}
.toast button{flex:none;width:28px;height:28px;border:0;border-radius:8px;background:transparent;color:var(--fg);font-size:20px;line-height:1;cursor:pointer}
@keyframes toastin{from{opacity:0;transform:translateX(30px)}}
@media (prefers-reduced-motion:reduce){nav li,.badge,.toast{animation:none}nav a{transition:none}}
@media (max-width:860px){
  .admin-shell{grid-template-columns:1fr}
  .side{position:static;height:auto;flex-direction:row;flex-wrap:wrap;align-items:center;border-right:0;border-bottom:1px solid var(--line)}
  nav ul{display:flex;flex-wrap:wrap}
  .foot{display:flex;margin-top:0}
}
</style>
