# Portfolio · Guillaume Rouyer (Er1gon359)

Portfolio de développeur web.
Application **Vue 3 + Vite** (JavaScript, Composition API), déployée sur **Cloudflare**.

## Fonctionnalités
- Site multipage (Vue Router) : accueil, projets, pages de détail, à propos, contact, mentions légales, confidentialité
- Projets phares sur l'accueil, liste filtrable avec défilement automatique lent quand aucun filtre n'est actif
- **SpiderNet** : tableau d'enquête interactif en plein écran (`/projets/spidernet/tableau`)
- **Goodnight** : page d'étude de cas éditoriale (`/projets/goodnight`) ; les images se déposent dans `src/assets/goodnight/`
- **Bataille Navale** : page d'étude de cas (`/projets/bataille-navale`) avec extraits de code réels, comparaison animée des trois IA et démonstration de l'animation de l'eau ; les images se déposent dans `src/assets/bataille-navale/`
- Thème clair / sombre : le site démarre toujours en clair, le choix n'est pas mémorisé (aucun stockage navigateur)
- Polices auto-hébergées : aucune requête vers un service tiers
- Contenus pilotés par des fichiers de données
- Accessibilité : lien d'évitement, focus visible, `prefers-reduced-motion` respecté

## Développement
```bash
npm install
npm run dev       # serveur de développement
npm run build     # build de production dans dist/
npm run preview   # prévisualiser le build
```
Node 22 recommandé (voir `.nvmrc`).

## Structure
```
index.html                point d'entrée Vite
public/                   fichiers copiés tels quels (favicon, robots.txt, sitemap, _headers, _redirects)
src/main.js               création de l'application
src/App.vue               assemblage (en-tête, vue courante, pied de page)
src/router/               routes et titres de pages
src/views/                une vue par page
src/components/           composants des sections
src/composables/          logique réutilisable (thème, défilement)
src/directives/           directive v-reveal (apparition au scroll)
src/data/                 contenus : projets, détails, compétences, parcours, contact, navigation
src/assets/               polices et visuels (dont goodnight/)
src/styles/               styles globaux
```

## Déployer sur Cloudflare (Pages, avec Git)
1. Dans le tableau de bord Cloudflare : *Workers & Pages* → créer un projet **Pages** → *Connect to Git*, puis choisir ce dépôt et la branche `main`.
2. Paramètres de build : commande `npm run build`, dossier de sortie `dist`.
3. Si besoin, définir la variable d'environnement `NODE_VERSION` à `22`.
   Le fichier `public/_redirects` renvoie toutes les adresses vers `index.html` (routage côté navigateur) ; la page 404 est gérée par Vue Router.
4. Chaque push sur `main` redéploie le site. Le domaine personnalisé s'ajoute dans l'onglet *Custom domains* du projet.

Les libellés exacts du tableau de bord peuvent évoluer ; la documentation Cloudflare Pages fait foi.
Les en-têtes de sécurité et de cache sont dans `public/_headers`.

## Ajouter un projet
Ajouter un objet dans `src/data/projects.js` (`slug`, `name`, `tag`, `desc`, `stack`, `repo`). Pour en faire un projet phare avec sa page dédiée : `featured: true`, `accent` (dégradé) et une entrée du même `slug` dans `src/data/projectDetails.js`.

## À venir
- Page Teyvat Hub (scène animée) et page Bataille Navale, en maintenance pour l'instant
- Page de veille technologique
- Lien vers le CV
