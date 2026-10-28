import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView, meta: { title: 'Accueil' } },
  { path: '/projets', name: 'projects', component: () => import('../views/ProjectsView.vue'), meta: { title: 'Projets' } },
  { path: '/a-propos', name: 'about', component: () => import('../views/AboutView.vue'), meta: { title: 'À propos' } },
  { path: '/contact', name: 'contact', component: () => import('../views/ContactView.vue'), meta: { title: 'Contact' } },
  { path: '/projets/:slug', name: 'project', component: () => import('../views/ProjectView.vue'), meta: { title: 'Projet' } },
  { path: '/mentions-legales', name: 'legal', component: () => import('../views/LegalView.vue'), meta: { title: 'Mentions légales' } },
  { path: '/confidentialite', name: 'privacy', component: () => import('../views/PrivacyView.vue'), meta: { title: 'Confidentialité' } },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('../views/NotFoundView.vue'), meta: { title: 'Page introuvable' } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: (to, from, saved) => saved || { top: 0 },
})

const BASE_TITLE = 'Guillaume Rouyer (Er1gon359) · Développeur Web & PHP'
router.afterEach((to) => {
  document.title = to.name === 'home' ? BASE_TITLE : `${to.meta.title} · Er1gon359`
})

export default router
