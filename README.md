# Portfolio · Guillaume Rouyer

Portfolio de développeur web avec un espace d'administration.
**Vue 3 + Vite** (JavaScript, Composition API) pour le site, **Cloudflare Pages Functions** pour l'API, **Cloudflare D1** (SQLite) pour les données.

## Fonctionnalités

**Site public**
- Pages : accueil, projets (liste filtrable, pages de détail), à propos, contact (formulaire avec protection anti-robot), mentions légales, confidentialité
- Études de cas : SpiderNet (tableau d'enquête), Goodnight, Bataille Navale
- **Veille technologique** : articles avec sommaire fixe, progression de lecture, recherche et tri (`?q=…&tri=…`), filtre par sujet
- Thème clair / sombre, français / anglais, polices auto-hébergées (aucun service tiers)
- Mesure d'audience sans traceur tiers ; cookie de visiteur unique uniquement après consentement (bandeau, bouton « Cookies » en pied de page)
- Accessibilité : lien d'évitement, focus visible, `prefers-reduced-motion`, panneau de réglages (taille, contraste, police, animations)
- Palette de commandes (`Ctrl K` ou `/`), mode terminal (touche `` ` ``), succès stockés dans le navigateur
- **Laboratoire cybersécurité** (`/cybersecurite`) : 7 démos interactives (hachage et sel, robustesse des mots de passe, JWT et attaque `alg: none`, injection SQL, XSS dans un cadre isolé, analyseur d'en-têtes HTTP, double authentification TOTP). Tout tourne dans le navigateur, sauf l'analyse d'un autre domaine (`/api/cyber/headers`, protégée contre la SSRF)
- **Contact intelligent** : validation en direct, motif (alternance, collaboration, projet, autre) qui adapte le formulaire, copie de l'e-mail, calendrier de disponibilité (FullCalendar chargé à la demande, vue liste accessible), confirmation personnalisée. Disponibilités réglées dans l'admin ; un créneau demandé est bloqué jusqu'à la fermeture du message (migration `0017_contact_smart.sql`)
- Pages Maintenant, Mes outils et Changelog, modifiables depuis l'admin ; CV téléchargeable derrière un petit défi anti-robot

**Administration** (`/admin`, connexion + double authentification)
- Contenu : projets, pages du site, veille (articles et sujets), médias, annonce ; dossiers pour ranger projets et pages
- Éditeur d'articles **visuel** (TipTap) ou **Markdown**, le Markdown étant toujours le format stocké
- Bloc `demo` : code HTML/CSS/JS exécuté dans l'article, dans un cadre isolé (sans accès au site, au stockage ni au réseau)
- Corbeille (30 jours) pour projets et articles, actions groupées, recherche globale `Ctrl K`, raccourcis clavier (`?` pour la liste)
- Assistant qualité des articles (titre, résumé, structure, accessibilité)
- Versions avec comparaison visuelle et restauration, brouillons, publication programmée (déclenchée par les visites), export / import JSON
- Messages reçus (conservés 12 mois), statistiques, alertes, journaux, sécurité, santé du site

## Développement
```bash
npm install
npm run dev       # interface seule (sans API)
npm run build     # build de production dans dist/
```
Pour tester avec l'API et la base en local :
```bash
npm run build
npx wrangler pages dev dist --d1 DB=<id-de-la-base> --port 8788
```
Node 22 recommandé (voir `.nvmrc`).

## Structure
```
src/views/              une vue par page (src/views/admin/ pour l'administration)
src/components/         composants (veille/ : éditeur visuel, éditeur Markdown, corps d'article)
src/lib/cyber/          logique des démos du labo (crypto, jwt, totp, sqlSim, password, headers)
src/components/cyber/   une démo par composant + lab.css
src/lib/                markdown.js (rendu), mdSerialize.js (éditeur → Markdown), veilleEditor.js (blocs TipTap), demoFrame.js
src/admin/              client d'API admin, notifications, brouillons
src/content/            contenus par défaut et accès à la veille
src/i18n/               textes français et anglais
functions/api/          API publique et API admin (Pages Functions)
functions/_lib/         authentification, limites de débit, versions, validation
migrations/             schéma D1, numéroté (0001, 0002…)
public/                 fichiers statiques, _headers (CSP), _redirects, demo-frame.html
```

## Déployer sur Cloudflare Pages
1. *Workers & Pages* → projet **Pages** → *Connect to Git*, branche `main`.
2. Build : commande `npm run build`, sortie `dist`, variable `NODE_VERSION=22`.
3. Lier la base D1 au projet (binding `DB`).
4. À chaque ajout de migration, l'appliquer à la base distante **avant ou juste après** le déploiement :
   ```bash
   npx wrangler d1 migrations apply portfolio-db --remote
   ```
5. Chaque push sur `main` redéploie le site.

Les en-têtes de sécurité (CSP stricte, pas d'iframe) sont dans `public/_headers`. Seule la page `/demo-frame` (cadre des démos) a ses propres règles, plus permissives uniquement pour son contenu isolé.

## Mises à jour courantes
- **Nouvelle migration** : ajouter `migrations/00NN_nom.sql`, puis la commande ci-dessus.
- **Nouveau texte** : `src/i18n/index.js` (français et anglais).
- **Article de veille** : Admin → Veille → Nouvel article (mode Visuel ou Markdown).
- **Sauvegarde** : Admin → Sauvegarde exporte tout le contenu en un fichier JSON ; l'import valide tout ou rien.
- **SEO (Admin → SEO)** : ouvre chaque page publique (accueil, projets, articles de veille…) et la note sur 100 selon 18 critères (titre, description, H1, canonique, Open Graph, images, texte, liens, JSON-LD, plan du site, vitesse), avec les recommandations classées par gain de points. Les pages ne peuvent être cadrées que par le même site (`X-Frame-Options: SAMEORIGIN`).
- **Sauvegardes automatiques** : une fois par semaine (déclenchée par les visites, sans tâche planifiée) et à la demande. Incrémentale : chaque passage ne garde que les éléments modifiés ou supprimés (tables `backup_runs` / `backup_items`, migration `0016`). Historique 180 jours. Dans Admin → Sauvegarde : comparer un élément avec sa version actuelle, le restaurer seul, télécharger l'état complet à une date (copie hors site).
