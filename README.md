# Portfolio · Guillaume Rouyer (Er1gon359)

Portfolio de développeur web, en recherche d'alternance en 2026.
Application **Vue 3 + Vite** (JavaScript, Composition API), déployée sur **Cloudflare**.

## Fonctionnalités
- Thème clair / sombre (préférence système, mémorisée dans le navigateur)
- Champ d'herbe interactif sur l'accueil : chaque clic fait pousser un cerisier, un saule ou une fleur à un emplacement fixe
- Projets filtrables par catégorie, avec défilement automatique lent quand aucun filtre n'est actif
- Parcours, compétences, contact, entièrement pilotés par des fichiers de données
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
public/                   fichiers copiés tels quels (favicon, robots.txt, sitemap, 404.html, _headers)
src/main.js               création de l'application
src/App.vue               assemblage des sections
src/components/           un composant par section (Hero, Projects, About, Timeline, Contact…)
src/composables/          logique réutilisable (useTheme)
src/directives/           directive v-reveal (apparition au scroll)
src/data/                 contenus : projets, compétences, parcours, contact, navigation
src/styles/               styles globaux (base, motion)
```

## Déployer sur Cloudflare (Pages, avec Git)
1. Dans le tableau de bord Cloudflare : *Workers & Pages* → créer un projet **Pages** → *Connect to Git*, puis choisir ce dépôt et la branche `main`.
2. Paramètres de build : commande `npm run build`, dossier de sortie `dist`.
3. Si besoin, définir la variable d'environnement `NODE_VERSION` à `22`.
4. Chaque push sur `main` redéploie le site. Le domaine personnalisé s'ajoute dans l'onglet *Custom domains* du projet.

Les libellés exacts du tableau de bord peuvent évoluer ; la documentation Cloudflare Pages fait foi.
Les en-têtes de sécurité et de cache sont dans `public/_headers`.

## Ajouter un projet
Ajouter un objet dans `src/data/projects.js` (`name`, `tag`, `desc`, `stack`, `repo`). Les catégories des filtres sont dans `TAGS` du même fichier.

## À venir
- Routeur Vue et pages dédiées SpiderNet (tableau d'enquête) et Teyvat Hub
- Mentions légales
- Lien vers le CV
