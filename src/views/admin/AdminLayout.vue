<script setup>
// Cadre de toutes les pages d'admin : barre latérale à gauche (pastilles comprises) + notifications.
import { onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../../admin/api.js'
import { badges, startBadges, stopBadges } from '../../admin/badges.js'
import { dismiss, toasts } from '../../admin/toasts.js'
import './adminForm.css'

// Icônes du menu (tracés simples, 24×24)
const ICONS = {"dashboard": "<rect x=\"3\" y=\"3\" width=\"7\" height=\"9\" rx=\"1\"/><rect x=\"14\" y=\"3\" width=\"7\" height=\"5\" rx=\"1\"/><rect x=\"14\" y=\"12\" width=\"7\" height=\"9\" rx=\"1\"/><rect x=\"3\" y=\"16\" width=\"7\" height=\"5\" rx=\"1\"/>", "alerts": "<path d=\"M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9\"/><path d=\"M10.3 21a1.94 1.94 0 003.4 0\"/>", "messages": "<rect x=\"3\" y=\"5\" width=\"18\" height=\"14\" rx=\"2\"/><path d=\"M3 7l9 6 9-6\"/>", "projects": "<path d=\"M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z\"/>", "content": "<path d=\"M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z\"/><path d=\"M14 3v5h5M9 13h6M9 17h6\"/>", "stats": "<path d=\"M4 20V10M10 20V4M16 20v-8M22 20H2\"/>", "security": "<path d=\"M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z\"/><path d=\"M9 12l2 2 4-4\"/>", "health": "<path d=\"M3 12h4l2-5 4 10 2-5h6\"/>", "media": "<rect x=\"3\" y=\"4\" width=\"18\" height=\"16\" rx=\"2\"/><circle cx=\"9\" cy=\"10\" r=\"2\"/><path d=\"M21 16l-5-5-9 9\"/>", "announce": "<path d=\"M3 11v3a1 1 0 001 1h2l5 4V6L6 10H4a1 1 0 00-1 1z\"/><path d=\"M15 9a4 4 0 010 6M18 6a8 8 0 010 12\"/>", "logs": "<path d=\"M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01\"/>", "backup": "<ellipse cx=\"12\" cy=\"6\" rx=\"8\" ry=\"3\"/><path d=\"M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6\"/>", "settings": "<path d=\"M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0\"/><circle cx=\"16\" cy=\"6\" r=\"2\"/><circle cx=\"10\" cy=\"12\" r=\"2\"/><circle cx=\"18\" cy=\"18\" r=\"2\"/>", "veille": "<path d=\"M4 19.5A2.5 2.5 0 016.5 17H20V3H6.5A2.5 2.5 0 004 5.5z\"/><path d=\"M8 8h8M8 12h5\"/>", "account": "<circle cx=\"12\" cy=\"8\" r=\"4\"/><path d=\"M4 21a8 8 0 0116 0\"/>", "versions": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 7v5l3 2\"/>"}

const router = useRouter()
const top = [
  { to: '/admin/tableau', icon: 'dashboard', label: 'Tableau de bord', tip: 'Vue d\'ensemble : chiffres clés, santé, alertes' },
  { to: '/admin/alertes', icon: 'alerts', label: 'Alertes', tip: 'Événements de sécurité ou d\'erreur à traiter', badge: 'alerts' },
  { to: '/admin/messages', icon: 'messages', label: 'Messages', tip: 'Messages reçus par le formulaire de contact', badge: 'messages' },
]
// Groupes dépliables : l'état (ouvert / fermé) est retenu dans ce navigateur ; le groupe de la page en cours est toujours ouvert.
const groups = [
  { id: 'contenu', label: 'Contenu', icon: 'content', items: [
    { to: '/admin/projets', icon: 'projects', label: 'Projets', tip: 'Créer, modifier, masquer ou mettre en maintenance' },
    { to: '/admin/veille', icon: 'veille', label: 'Veille', tip: 'Articles de veille technologique : rédiger, publier, ranger par sujet' },
    { to: '/admin/contenu', icon: 'content', label: 'Contenu', tip: 'Textes de l\'accueil, À propos, compétences, parcours, tableau SpiderNet' },
    { to: '/admin/medias', icon: 'media', label: 'Médias', tip: 'Images du site : envoi par glisser-déposer, corbeille' },
    { to: '/admin/annonce', icon: 'announce', label: 'Annonce', tip: 'Bannière affichée sur la page d\'accueil' },
  ] },
  { id: 'publication', label: 'Publication', icon: 'versions', items: [
    { to: '/admin/versions', icon: 'versions', label: 'Versions', tip: 'Historique, brouillons et publications programmées' },
    { to: '/admin/sauvegarde', icon: 'backup', label: 'Sauvegarde', tip: 'Exporter ou importer tout le contenu en un fichier' },
  ] },
  { id: 'suivi', label: 'Suivi du site', icon: 'stats', items: [
    { to: '/admin/statistiques', icon: 'stats', label: 'Statistiques', tip: 'Visites, pays, appareils, temps passé, arbres plantés' },
    { to: '/admin/sante', icon: 'health', label: 'Santé du site', tip: 'Quotas Cloudflare, espace utilisé, erreurs récentes' },
    { to: '/admin/journaux', icon: 'logs', label: 'Journaux', tip: 'Historique détaillé, recherche et export CSV' },
  ] },
  { id: 'reglages', label: 'Système', icon: 'settings', items: [
    { to: '/admin/securite', icon: 'security', label: 'Sécurité', tip: 'Bannir un pays, un continent ou une adresse IP · mode protégé' },
    { to: '/admin/reglages', icon: 'settings', label: 'Réglages', tip: 'Contact, pied de page, maintenance globale' },
    { to: '/admin/compte', icon: 'account', label: 'Compte et sécurité', tip: 'Mot de passe, 2FA, sessions ouvertes' },
  ] },
]

const route = useRoute()
const STORE = 'admin-nav-open'
const saved = (() => { try { return JSON.parse(localStorage.getItem(STORE)) ?? {} } catch { return {} } })()
const openMap = reactive(Object.fromEntries(groups.map((g) => [g.id, saved[g.id] ?? g.id === 'contenu'])))
const hasActive = (g) => g.items.some((i) => route.path === i.to || route.path.startsWith(i.to + '/'))
const isOpen = (g) => openMap[g.id] || hasActive(g)
function toggle(g) {
  if (hasActive(g)) return // le groupe de la page en cours reste ouvert
  openMap[g.id] = !openMap[g.id]
  try { localStorage.setItem(STORE, JSON.stringify(openMap)) } catch { /* ignoré */ }
}
onMounted(startBadges)
onBeforeUnmount(stopBadges)

async function logout() {
  try { await api('/api/admin/logout', { method: 'POST' }) } finally { router.push('/admin') }
}

// Petit écran : le menu se replie derrière un bouton et se referme à chaque changement de page.
const menuOpen = ref(false)
watch(() => route.fullPath, () => { menuOpen.value = false })
</script>

<template>
  <div class="admin-shell">
    <aside class="side" :class="{ open: menuOpen }">
      <p class="brand">Administration</p>
      <button type="button" class="burger" :aria-expanded="menuOpen" aria-controls="admin-nav" @click="menuOpen = !menuOpen">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path v-if="!menuOpen" d="M4 7h16M4 12h16M4 17h16" /><path v-else d="M6 6l12 12M18 6L6 18" /></svg>
        Menu
      </button>
      <nav id="admin-nav" aria-label="Administration">
        <ul>
          <li v-for="(i, n) in top" :key="i.to" :style="{ '--i': n }">
            <RouterLink :to="i.to" :title="i.tip">
              <span class="lab"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true" v-html="ICONS[i.icon]" /><span>{{ i.label }}</span></span>
              <span v-if="i.badge && badges[i.badge]" class="badge" :aria-label="`${badges[i.badge]} non lu(s)`">{{ badges[i.badge] }}</span>
            </RouterLink>
          </li>
        </ul>
        <div v-for="(g, n) in groups" :key="g.id" class="grp" :style="{ '--i': n + top.length }">
          <button type="button" class="gh" :class="{ cur: hasActive(g) }" :aria-expanded="isOpen(g)" :aria-controls="`g-${g.id}`" @click="toggle(g)">
            <span class="lab"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true" v-html="ICONS[g.icon]" /><span>{{ g.label }}</span></span>
            <svg class="chev" :class="{ open: isOpen(g) }" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 10l4 4 4-4" /></svg>
          </button>
          <div :id="`g-${g.id}`" class="gb" :class="{ open: isOpen(g) }">
            <ul class="gi">
              <li v-for="i in g.items" :key="i.to">
                <RouterLink :to="i.to" :title="i.tip" :tabindex="isOpen(g) ? 0 : -1">
                  <span class="lab"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true" v-html="ICONS[i.icon]" /><span>{{ i.label }}</span></span>
                  <span v-if="i.badge && badges[i.badge]" class="badge">{{ badges[i.badge] }}</span>
                </RouterLink>
              </li>
            </ul>
          </div>
        </div>
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
nav{display:grid;gap:4px;align-content:start;overflow-y:auto;min-height:0;margin:0 -6px;padding:0 6px}
nav ul{display:grid;gap:4px;margin:0;padding:0;list-style:none}
.grp{animation:slidein .4s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i) * 50ms);margin-top:6px}
.gh{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;min-height:44px;padding:0 14px;border:0;border-radius:12px;background:transparent;color:var(--fg);font:700 14px/1 var(--font);letter-spacing:.02em;text-transform:uppercase;cursor:pointer;transition:background .2s}
.gh:hover{background:var(--bg)}
.gh:focus-visible,nav a:focus-visible{outline:3px solid var(--neon);outline-offset:1px}
.gh.cur{color:var(--green)}
.chev{flex:none;width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;transition:transform .25s}
.chev.open{transform:rotate(180deg)}
.gb{display:grid;grid-template-rows:0fr;transition:grid-template-rows .28s cubic-bezier(.2,.8,.2,1)}
.gb.open{grid-template-rows:1fr}
.gi{overflow:hidden;min-height:0;visibility:hidden;transition:visibility 0s .28s;padding-left:10px}
.gb.open .gi{visibility:visible;transition-delay:0s}
.gi a{min-height:40px;font-weight:600;font-size:14.5px}
nav a{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:44px;padding:0 14px;border-radius:12px;color:var(--fg);font:600 15px/1 var(--font);text-decoration:none;transition:background .2s,transform .2s,box-shadow .2s}
nav a:hover{background:var(--bg);transform:translateX(4px)}
nav li{animation:slidein .4s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i) * 50ms)}
nav a.router-link-active{background:var(--green);color:var(--on-green);box-shadow:0 8px 18px -10px var(--glow)}
@keyframes slidein{from{opacity:0;transform:translateX(-14px)}}
.lab{display:inline-flex;align-items:center;gap:12px}
.ico{flex:none;width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;transition:transform .25s}
nav a:hover .ico{transform:scale(1.15) rotate(-6deg)}
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
@media (prefers-reduced-motion:reduce){nav li,.grp,.badge,.toast{animation:none}nav a,.ico,.gb,.chev{transition:none}nav a:hover .ico{transform:none}}
.burger{display:none;align-items:center;gap:8px;min-height:44px;padding:0 16px;border:1px solid var(--line);border-radius:12px;background:var(--bg);color:var(--fg);font:700 15px var(--font);cursor:pointer}
.burger:focus-visible{outline:3px solid var(--neon);outline-offset:2px}
@media (max-width:860px){
  .admin-shell{grid-template-columns:minmax(0,1fr)}
  .side{position:sticky;top:0;z-index:30;display:grid;grid-template-columns:1fr auto;gap:8px 12px;align-items:center;height:auto;max-height:100vh;padding:10px 16px;border-right:0;border-bottom:1px solid var(--line);overflow-y:auto}
  .burger{display:inline-flex}
  nav,.foot{grid-column:1/-1;display:none}
  .side.open nav{display:grid}
  .side.open .foot{display:flex;flex-wrap:wrap;gap:8px;margin-top:0}
}
</style>
