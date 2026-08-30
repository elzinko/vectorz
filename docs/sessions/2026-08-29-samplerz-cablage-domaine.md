fiches: 20260829123707100

# Sprint — samplerz : câblage du domaine (Vercel + DNS IONOS)

Périmètre: brancher le domaine prod/staging/dev de samplerz   Statut: terminé

## Backlog
- [x] domaine racine (apex + `www`) posé sur Vercel, DNS IONOS
- [x] Root Directory Vercel corrigé (monorepo)
- [x] sous-domaine `staging` créé côté IONOS + CNAME posé

## Galères & gestes (labo)

- **Root Directory Vercel oublié (monorepo)**
  Symptôme : build en échec, `vite: command not found` (exit 127) — le projet
  Vercel pointait la racine du repo au lieu du dossier de l'app.
  Geste : Settings → **Root Directory** → renseigner le sous-dossier (ex. `website/`)
  avant tout déploiement.
  Pourquoi : dans un monorepo, Vercel construit depuis la racine du repo par défaut ;
  sans ce réglage, le build ne trouve ni `package.json` ni les scripts du bon projet.
  Recette dérivée : [`recipes/brancher-domaine-vercel.md`](../../recipes/brancher-domaine-vercel.md)
  (section « Prérequis », item 2).

- **DNS IONOS à câbler (apex + sous-domaine `staging`)**
  Symptôme : le domaine restait « Invalid » côté Vercel tant que les enregistrements
  DNS n'étaient pas posés chez IONOS (le registrar), et IONOS pose déjà un `A` par
  défaut sur `@` qu'il ne faut pas dupliquer.
  Geste : côté Vercel, Settings → Domains → Add → copier les deux valeurs proposées
  (`A` sur `@`, `CNAME` sur `www`) ; côté IONOS, **modifier** l'enregistrement `A`
  existant sur `@` (pas en ajouter un second) et poser le `CNAME` `www` ; pour un
  sous-domaine (`staging`), le créer d'abord côté IONOS (étape séparée) puis poser
  son `CNAME` vers Vercel.
  Pourquoi : Vercel ne gère que la résolution vers ses serveurs ; le registrar
  (IONOS) reste la source de vérité de la zone DNS — les deux doivent être alignés
  à la main, rien n'est automatique entre les deux tableaux de bord.
  Recette dérivée : [`recipes/dns-ionos-mcp.md`](../../recipes/dns-ionos-mcp.md)
  (pilotage agent des DNS IONOS) et
  [`recipes/brancher-domaine-vercel.md`](../../recipes/brancher-domaine-vercel.md)
  (section « La partie DNS », pièges IONOS au niveau racine).

## Notes
- Fausse route évitée : pas de branche Git `staging`/`dev` — un seul `main`, les
  environnements sont des alias Vercel posés par la CI (voir
  `recipes/brancher-domaine-vercel.md`, « Le piège à NE PAS refaire »).
- Origine de la fiche [`20260829123707100`](../../features/20260829123707100_labo-de-cuisine-journal-difficultes.md)
  (« labo de cuisine ») : cette session en est la galère fondatrice.
