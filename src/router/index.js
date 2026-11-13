import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { checkSession } from '../admin/api.js'

const routes = [
  { path: '/', name: 'home', component: HomeView, meta: { title: 'Accueil' } },
  { path: '/projets', name: 'projects', component: () => import('../views/ProjectsView.vue'), meta: { title: 'Projets' } },
  { path: '/a-propos', name: 'about', component: () => import('../views/AboutView.vue'), meta: { title: 'À propos' } },
  { path: '/contact', name: 'contact', component: () => import('../views/ContactView.vue'), meta: { title: 'Contact' } },
  { path: '/projets/spidernet', redirect: '/projets/spidernet/tableau' },
  { path: '/projets/spidernet/tableau', name: 'spidernet-board', component: () => import('../views/SpiderNetBoardView.vue'), meta: { title: "SpiderNet, tableau d'enquête", fullscreen: true } },
  { path: '/projets/bataille-navale', name: 'bataille-navale', component: () => import('../views/BatailleNavaleView.vue'), meta: { title: 'Bataille Navale' } },
  { path: '/projets/goodnight', name: 'goodnight', component: () => import('../views/GoodnightView.vue'), meta: { title: 'Goodnight' } },
  { path: '/projets/:slug', name: 'project', component: () => import('../views/ProjectView.vue'), meta: { title: 'Projet' } },
  { path: '/mentions-legales', name: 'legal', component: () => import('../views/LegalView.vue'), meta: { title: 'Mentions légales' } },
  { path: '/confidentialite', name: 'privacy', component: () => import('../views/PrivacyView.vue'), meta: { title: 'Confidentialité' } },
  // Administration : jamais indexée, tableau de bord protégé par la session
  { path: '/admin', name: 'admin-login', component: () => import('../views/admin/AdminLoginView.vue'), meta: { title: 'Administration', noindex: true } },
  { path: '/admin/installation', name: 'admin-setup', component: () => import('../views/admin/AdminSetupView.vue'), meta: { title: 'Installation', noindex: true } },
  { path: '/admin/tableau', name: 'admin-dashboard', component: () => import('../views/admin/AdminDashboardView.vue'), meta: { title: 'Tableau de bord', noindex: true, admin: true } },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('../views/NotFoundView.vue'), meta: { title: 'Page introuvable' } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: (to, from, saved) => saved || { top: 0 },
})

const BASE_TITLE = 'Guillaume Rouyer (Er1gon359) · Développeur Web & PHP'
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
})

export default router
