# Backend du portfolio (Cloudflare Pages Functions + D1)

Les fichiers de `functions/` deviennent automatiquement l'API du site (`/api/...`).
`npm run dev` (Vite) ne les exécute pas : pour tester l'API en local, utiliser `wrangler` (voir plus bas).

## Mise en place (une seule fois)

1. Créer la base : `npx wrangler d1 create portfolio-db`, puis copier le `database_id` affiché dans `wrangler.toml`.
   Vérifier aussi que `name` dans `wrangler.toml` est bien le nom de ton projet Cloudflare Pages.
2. Créer les tables : `npx wrangler d1 migrations apply portfolio-db --remote`
3. Ajouter deux secrets (jamais dans Git) :
   - `npx wrangler pages secret put APP_SECRET`  → une longue valeur aléatoire (`openssl rand -base64 48`)
   - `npx wrangler pages secret put SETUP_TOKEN` → un jeton d'installation (`openssl rand -hex 24`)
   Garde `APP_SECRET` : s'il change, le mot de passe et le 2FA ne fonctionnent plus (il faut refaire l'installation).
4. Déployer (push sur `main`), puis ouvrir `/admin/installation` : jeton + mot de passe, scan du QR code, premier code.
5. Une fois le compte créé, **supprimer le secret `SETUP_TOKEN`** : la page d'installation devient inutilisable.

## Mettre à jour la base (nouvelles tables)

À chaque fois qu'un fichier est ajouté dans `migrations/`, l'appliquer sur la vraie base :
`npx wrangler d1 migrations apply portfolio-db --remote`
(Le contenu des projets est importé automatiquement depuis `migrations/0003_seed_projects.sql`.)

## Perte du téléphone (2FA)

`npx wrangler d1 execute portfolio-db --remote --command "DELETE FROM admin"`, remettre un `SETUP_TOKEN`, refaire l'installation.

## Tester en local

1. Créer `.dev.vars` (déjà ignoré par Git) avec `APP_SECRET=...` et `SETUP_TOKEN=...`
2. `npx wrangler d1 migrations apply portfolio-db --local`
3. `npm run build && npx wrangler pages dev dist`

## Ce qui est en place

- Mot de passe haché (PBKDF2 + poivre secret) + code 2FA (TOTP) à usage unique (anti-rejeu).
- Sessions : cookie `__Host-session` (HttpOnly, Secure, SameSite=Strict), seul le hash du jeton est stocké, 8 h max, 1 h d'inactivité.
- Anti-CSRF : contrôle de l'en-tête `Origin` sur toute requête qui modifie quelque chose + jeton CSRF pour les routes admin.
- Limitation des tentatives : 5 échecs par IP ou 40 au total en 15 minutes. Message d'erreur identique quelle que soit la cause.
- Requêtes SQL toujours préparées (`bind`), entrées validées (`_lib/validate.js`), erreurs internes jamais détaillées au visiteur.
- Journaux dans la console Cloudflare et dans la table `logs` (30 jours), mots de passe/codes/jetons masqués.
- En-têtes de sécurité et CSP dans `public/_headers`.
- Projets : table `projects`, API publique `/api/projects`, API admin `/api/admin/projects` (création, modification, statut, ordre, suppression). Dégradés, liens et textes sont validés ; l'affichage se fait toujours en texte (jamais en HTML).
