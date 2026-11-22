# Portfolio · Guillaume Rouyer (Er1gon359)

Portfolio de développeur web avec un espace d'administration.
**Vue 3 + Vite** (JavaScript, Composition API) pour le site, **Cloudflare Pages Functions** pour l'API, **Cloudflare D1** (SQLite) pour les données.

## Fonctionnalités

**Site public**
- Pages : accueil, projets (liste filtrable, pages de détail), à propos, contact (formulaire avec protection anti-robot), mentions légales, confidentialité
- Études de cas : SpiderNet (tableau d'enquête), Goodnight, Bataille Navale
- **Veille technologique** : articles avec sommaire fixe, progression de lecture, recherche et tri (`?q=…&tri=…`), filtre par sujet
- Thème clair / sombre, français / anglais, polices auto-hébergées (aucun service tiers)
- Mesure d'audience sans traceur tiers ; cookie de visiteur unique uniquement après consentement (bandeau, bouton « Cookies » en pied de page)
- Accessibilité : lien d'évitement, focus visible, `prefers-reduced-motion`

**Administration** (`/admin`, connexion + double authentification)
- Contenu : projets, pages du site, veille (articles et sujets), médias, annonce ; dossiers pour ranger projets et pages
- Éditeur d'articles **visuel** (TipTap) ou **Markdown**, le Markdown étant toujours le format stocké
- Bloc `demo` : code HTML/CSS/JS exécuté dans l'article, dans un cadre isolé (sans accès au site, au stockage ni au réseau)
- Versions et restauration, brouillons, publication programmée (déclenchée par les visites), export / import JSON
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
