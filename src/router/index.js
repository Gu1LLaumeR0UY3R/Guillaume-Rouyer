import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { checkSession } from '../admin/api.js'

const routes = [
  { path: '/', name: 'home', component: HomeView, meta: { title: 'Accueil' } },
  { path: '/projets', name: 'projects', component: () => import('../views/ProjectsView.vue'), meta: { desc: "Tous mes projets : web, API, 3D, mobile, IA et self-hosting, avec les technologies utilisées pour chacun.", title: 'Projets' } },
  { path: '/veille', name: 'veille', component: () => import('../views/VeilleView.vue'), meta: { desc: "Ma veille technologique : articles et sujets suivis sur le développement, la cybersécurité et l’IA.", title: 'Veille technologique' } },
  { path: '/veille/:slug', name: 'veille-article', component: () => import('../views/VeilleArticleView.vue'), meta: { title: 'Veille technologique' } },
  { path: '/cybersecurite', name: 'cyber', component: () => import('../views/CyberView.vue'), meta: { title: 'Cybersécurité' } },
  { path: '/a-propos', name: 'about', component: () => import('../views/AboutView.vue'), meta: { title: 'À propos' } },
  { path: '/contact', name: 'contact', component: () => import('../views/ContactView.vue'), meta: { title: 'Contact' } },
  { path: '/projets/spidernet', redirect: '/projets/spidernet/tableau' },
  { path: '/projets/spidernet/tableau', name: 'spidernet-board', component: () => import('../views/ProjectGate.vue'), meta: { title: "SpiderNet, tableau d'enquête", fullscreen: true, project: 'spidernet', view: () => import('../views/SpiderNetBoardView.vue') } },
  { path: '/projets/bataille-navale', name: 'bataille-navale', component: () => import('../views/BatailleNavaleView.vue'), meta: { desc: "Bataille Navale : jeu jouable en ligne avec une IA à plusieurs niveaux, étude de cas technique du projet.", title: 'Bataille Navale' } },
  { path: '/projets/goodnight', name: 'goodnight', component: () => import('../views/ProjectGate.vue'), meta: { desc: "Goodnight : plateforme de location immobilière en PHP MVC, trois rôles, tableaux de bord KPI et sécurité PDO/XSS.", title: 'Goodnight', project: 'goodnight', view: () => import('../views/GoodnightView.vue') } },
  { path: '/projets/:slug', name: 'project', component: () => import('../views/ProjectView.vue'), meta: { title: 'Projet' } },
  { path: '/mentions-legales', name: 'legal', component: () => import('../views/LegalView.vue'), meta: { desc: "Mentions légales du site er1gon359.com : éditeur, hébergeur et propriété intellectuelle.", title: 'Mentions légales' } },
  { path: '/maintenant', name: 'now', component: () => import('../views/InfoPageView.vue'), meta: { title: 'Maintenant', block: 'now', desc: 'Ce sur quoi je travaille et ce que j\'apprends en ce moment.' } },
  { path: '/outils', name: 'tools', component: () => import('../views/InfoPageView.vue'), meta: { title: 'Mes outils', block: 'tools', desc: 'Les langages, frameworks et outils que j\'utilise au quotidien.' } },
  { path: '/changelog', name: 'changelog', component: () => import('../views/InfoPageView.vue'), meta: { title: 'Changelog', block: 'changelog', desc: 'Le journal des évolutions de mon portfolio et de mes projets.' } },
  { path: '/confidentialite', name: 'privacy', component: () => import('../views/PrivacyView.vue'), meta: { desc: "Politique de confidentialité : données collectées, cookies, statistiques anonymes et tes droits.", title: 'Confidentialité' } },
  // Administration : jamais indexée, tableau de bord protégé par la session
  { path: '/admin', name: 'admin-login', component: () => import('../views/admin/AdminLoginView.vue'), meta: { title: 'Administration', noindex: true } },
  { path: '/admin/installation', name: 'admin-setup', component: () => import('../views/admin/AdminSetupView.vue'), meta: { title: 'Installation', noindex: true } },
  // Pages protégées : `adminLayout` les place dans le cadre d'admin (barre latérale à gauche, voir App.vue)
  { path: '/admin/tableau', name: 'admin-dashboard', component: () => import('../views/admin/AdminDashboardView.vue'), meta: { title: 'Tableau de bord', noindex: true, admin: true, adminLayout: true } },
  { path: '/admin/alertes', name: 'admin-alerts', component: () => import('../views/admin/AdminAlertsView.vue'), meta: { title: 'Alertes', noindex: true, admin: true, adminLayout: true } },
  { path: '/admin/messages', name: 'admin-messages', component: () => import('../views/admin/AdminMessagesView.vue'), meta: { title: 'Messages', noindex: true, admin: true, adminLayout: true } },
  { path: '/admin/projets', name: 'admin-projects', component: () => import('../views/admin/AdminProjectsView.vue'), meta: { title: 'Projets (admin)', noindex: true, admin: true, adminLayout: true } },
  { path: '/admin/projets/nouveau', name: 'admin-project-new', component: () => import('../views/admin/AdminProjectEditView.vue'), meta: { title: 'Nouveau projet', noindex: true, admin: true, adminLayout: true } },
  { path: '/admin/projets/:slug', name: 'admin-project-edit', component: () => import('../views/admin/AdminProjectEditView.vue'), meta: { title: 'Modifier un projet', noindex: true, admin: true, adminLayout: true } },
  { path: '/admin/contenu', name: 'admin-content', component: () => import('../views/admin/AdminContentHubView.vue'), meta: { title: 'Contenu du site', noindex: true, admin: true, adminLayout: true } },
  { path: '/admin/contenu/pages', name: 'admin-content-pages', component: () => import('../views/admin/AdminSiteContentView.vue'), meta: { title: 'Modifier un texte du site', noindex: true, admin: true, adminLayout: true } },
  { path: '/admin/veille', name: 'admin-veille', component: () => import('../views/admin/AdminVeilleView.vue'), meta: { title: 'Veille (admin)', noindex: true, admin: true, adminLayout: true } },
  { path: '/admin/veille/nouveau', name: 'admin-veille-new', component: () => import('../views/admin/AdminVeilleEditView.vue'), meta: { title: 'Nouvel article', noindex: true, admin: true, adminLayout: true } },
  { path: '/admin/veille/:slug', name: 'admin-veille-edit', component: () => import('../views/admin/AdminVeilleEditView.vue'), meta: { title: 'Modifier un article', noindex: true, admin: true, adminLayout: true } },
  { path: '/admin/contenu/goodnight', name: 'admin-goodnight', component: () => import('../views/admin/AdminGoodnightView.vue'), meta: { title: 'Étude de cas Goodnight', noindex: true, admin: true, adminLayout: true } },
  { path: '/admin/contenu/succes', name: 'admin-succes', component: () => import('../views/admin/AdminAchievementsView.vue'), meta: { title: 'Modifier les succès', noindex: true, admin: true, adminLayout: true } },
  { path: '/admin/contenu/spidernet', name: 'admin-spidernet', component: () => import('../views/admin/AdminSpidernetView.vue'), meta: { title: 'Tableau SpiderNet', noindex: true, admin: true, adminLayout: true } },
  { path: '/admin/securite', name: 'admin-security', component: () => import('../views/admin/AdminSecurityView.vue'), meta: { title: 'Sécurité', noindex: true, admin: true, adminLayout: true } },
  { path: '/admin/sante', name: 'admin-health', component: () => import('../views/admin/AdminHealthView.vue'), meta: { title: 'Santé du site', noindex: true, admin: true, adminLayout: true } },
  { path: '/admin/statistiques', name: 'admin-stats', component: () => import('../views/admin/AdminStatsView.vue'), meta: { title: 'Statistiques', noindex: true, admin: true, adminLayout: true } },
  { path: '/admin/cv', name: 'admin-cv', component: () => import('../views/admin/AdminCvView.vue'), meta: { title: 'CV', noindex: true, admin: true, adminLayout: true } },
  { path: '/admin/medias', name: 'admin-media', component: () => import('../views/admin/AdminMediaView.vue'), meta: { title: 'Médias', noindex: true, admin: true, adminLayout: true } },
  { path: '/admin/annonce', name: 'admin-announcement', component: () => import('../views/admin/AdminAnnouncementView.vue'), meta: { title: 'Annonce', noindex: true, admin: true, adminLayout: true } },
  { path: '/admin/journaux', name: 'admin-logs', component: () => import('../views/admin/AdminLogsView.vue'), meta: { title: 'Journaux', noindex: true, admin: true, adminLayout: true } },
  { path: '/admin/versions', name: 'admin-versions', component: () => import('../views/admin/AdminVersionsView.vue'), meta: { title: 'Versions et publication', noindex: true, admin: true, adminLayout: true } },
  { path: '/admin/seo', name: 'admin-seo', component: () => import('../views/admin/AdminSeoView.vue'), meta: { title: 'SEO', noindex: true, admin: true, adminLayout: true } },
  { path: '/admin/sauvegarde', name: 'admin-backup', component: () => import('../views/admin/AdminBackupView.vue'), meta: { title: 'Sauvegarde', noindex: true, admin: true, adminLayout: true } },
  { path: '/admin/corbeille', name: 'admin-trash', component: () => import('../views/admin/AdminTrashView.vue'), meta: { title: 'Corbeille', noindex: true, admin: true, adminLayout: true } },
  { path: '/admin/reglages', name: 'admin-settings', component: () => import('../views/admin/AdminSettingsView.vue'), meta: { title: 'Réglages', noindex: true, admin: true, adminLayout: true } },
  { path: '/admin/compte', name: 'admin-account', component: () => import('../views/admin/AdminAccountView.vue'), meta: { title: 'Compte et sécurité', noindex: true, admin: true, adminLayout: true } },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('../views/NotFoundView.vue'), meta: { title: 'Page introuvable' } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, saved) {
    if (saved) return saved
    if (to.hash) { // ancre (sommaire d'un article) : défile jusqu'au titre, en laissant la place de l'en-tête fixe
      const el = document.getElementById(decodeURIComponent(to.hash.slice(1)))
      if (el) return { el, top: 96, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }
    }
    return { top: 0 }
  },
})

const BASE_TITLE = 'Guillaume Rouyer (Er1gon359) · Développeur full stack & cybersécurité'
// Les pages protégées demandent au serveur si la session est valide (le vrai contrôle reste côté API).
router.beforeEach(async (to) => {
  if (to.meta.admin && !(await checkSession())) return { name: 'admin-login' }
})
router.afterEach((to) => {
  let m = document.querySelector('meta[name="robots"]')
  if (to.meta.noindex) {
    if (!m) { m = document.createElement('meta'); m.name = 'robots'; document.head.append(m) }
    m.content = 'noindex, nofollow'
  } else m?.remove()
  document.title = to.name === 'home' ? BASE_TITLE : `${to.meta.title} · Er1gon359`
  if (!to.meta.noindex) {
    // canonique et description par défaut de chaque page ; les pages dynamiques (article, projet) les précisent ensuite
    const set = (sel, make, attr, v) => { let e = document.head.querySelector(sel); if (!e) { e = make(); document.head.append(e) } e.setAttribute(attr, v) }
    const mk = (tag, a, b) => () => { const e = document.createElement(tag); e.setAttribute(a, b); return e }
    const url = 'https://er1gon359.com' + (to.path === '/' ? '' : to.path.replace(/\/$/, ''))
    set('link[rel="canonical"]', () => { const l = document.createElement('link'); l.rel = 'canonical'; return l }, 'href', url || 'https://er1gon359.com/')
    set('meta[property="og:url"]', mk('meta', 'property', 'og:url'), 'content', url || 'https://er1gon359.com/')
    if (to.meta.desc) {
      set('meta[name="description"]', mk('meta', 'name', 'description'), 'content', to.meta.desc)
      set('meta[property="og:description"]', mk('meta', 'property', 'og:description'), 'content', to.meta.desc)
    }
    set('meta[property="og:title"]', mk('meta', 'property', 'og:title'), 'content', document.title)
  }
})

export default router
