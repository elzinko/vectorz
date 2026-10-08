# Recette — débloquer le lancement d'une app (infra) sans corvée

> **Document vivant.** Objectif : rendre **rapide et répétable** le déblocage de
> l'infra de lancement d'un produit (téléchargement, secrets, domaine, boutique),
> avec des **CLI** et des **points de validation humaine** clairs — pour ne plus
> jamais refaire les mêmes recherches ni les mêmes erreurs.
>
> Créée : **2026-08-30** (à partir de l'audit du lancement samplerz).

## En clair

Quand on lance un produit, l'infra coince toujours aux mêmes endroits : où sont
les secrets, quel CLI parle à quel service, quelle variable manque, comment
vérifier sans rien casser. Cette recette **capitalise** ça : un mode opératoire
par sujet, un **catalogue des secrets par application**, et un **journal par app**
qui garde l'historique (ce qui a bloqué, comment on l'a réglé).

On avance avec des CLI (ils s'authentifient une fois, sans OAuth à chaque session),
et **tu valides avant chaque écriture** sur un service externe.

## Les deux règles d'or (apprises à la dure)

1. **Les valeurs des variables d'env vivent dans le `.env` du dépôt PRINCIPAL**
   (`/Users/elzinko/git/<projet>/.env`), **pas** dans le worktree. Toujours lire
   là. Ne jamais afficher une valeur secrète — la capturer dans une variable.
2. **Ne rien créer en double.** Avant de « poser un secret » ou « créer un
   bucket », vérifier ce qui existe déjà (souvent : c'est fait). Voir le
   [catalogue](catalogue-secrets.md) et le [journal de l'app](journal/).

## Ustensiles : capacité → outil (capacité d'abord)

Pour chaque capacité d'infra, l'outil préféré ([ADR-0067](../../products/mega-city/docs/adr/0067-outils-d-une-recette-capacite-mcp-local-ou-script.md)) :
un **MCP local** s'il existe, sinon un **CLI / API REST**. On **signale** les connecteurs cloud à
**OAuth de session** : pratiques en session, mais ils se re-autorisent à chaque fois et ne marchent
pas hors session — on ne s'appuie pas dessus pour l'infra.

| Capacité (service) | Outil préféré | Nature |
|---|---|---|
| Versionner / CI (GitHub) | `gh` (authentifié une fois, `gh auth status`) | CLI — le connecteur MCP GitHub est un OAuth de session, **signalé**, non utilisé ici |
| Déployer le site (Vercel) | `vercel` (authentifié une fois, `vercel whoami`) | CLI — le connecteur MCP Vercel est un OAuth **interactif**, hors-jeu en headless |
| Stocker / servir des binaires (Cloudflare R2) | `aws s3` + `--endpoint-url` (R2 = S3) ou `wrangler` | CLI / API — pas de MCP |
| Vendre (Lemon Squeezy) | **API REST** `api.lemonsqueezy.com` + clé Bearer | REST — ni MCP ni CLI officiel |
| Gérer le DNS (IONOS) | **MCP IONOS (par token)** | **MCP par token** — pas d'OAuth interactif : cas **sain**, voir [`dns-ionos-mcp.md`](../dns-ionos-mcp.md) |

> Leçon : un CLI — ou un MCP **par token** — authentifié une fois ne redemande rien à chaque
> session ; c'est pour ça qu'il est plus fiable qu'un connecteur à **OAuth de session**.

## Où vivent les secrets (le modèle mental)

Un même secret peut avoir à vivre à **plusieurs endroits** selon qui le consomme :

- **`.env` du main** — pour les scripts locaux et pour **propager** vers ailleurs.
- **Trousseau macOS** (`ezk-secret set/get/list`, cf. [`secrets-trousseau`](../secrets-trousseau/)) —
  pour les secrets que **je** dois lire à la demande, avec validation (Touch ID / mot de passe).
- **GitHub Actions** (`gh secret set`) — pour les workflows CI (build/upload).
- **Vercel** (`vercel env add`) — pour le site déployé (fonctions, front).

Le [catalogue par app](catalogue-secrets.md) dit, pour chaque secret, **où il doit
être** et **qui le lit**. Propager = copier une valeur du `.env` du main vers GH /
Vercel — **avec ta validation**.

## Le mode opératoire (par sujet)

### A. Téléchargement de l'app (méthode R2, cf. [`plan-distribution-app.md`](../plan-distribution-app.md))
1. Vérifier le bucket R2 (existe ? peuplé ?) — `aws s3 ls --endpoint-url https://<ACCOUNT_ID>.r2.cloudflarestorage.com`.
2. Vérifier les 4 secrets CI : `gh secret list -R <owner>/<repo>` (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME).
3. Vérifier `R2_PUBLIC_URL` côté Vercel (souvent **le seul** manquant) : `vercel env ls`.
4. **[VALIDATION]** poser ce qui manque depuis le `.env` du main.
5. Vérifier qu'un binaire se télécharge vraiment (HTTP 200/302).

### B. Propager un secret (main → GH / Vercel)
1. Lire la valeur dans le `.env` du main (jamais l'afficher).
2. **[VALIDATION]** montrer *quel* secret va *où* (pas la valeur).
3. `gh secret set <NOM> -R <owner>/<repo>` (valeur en stdin) **/** `vercel env add <NOM> production` (après `vercel link`).

### C. Domaine (cf. [`brancher-domaine-vercel.md`](../brancher-domaine-vercel.md) + [`dns-ionos-mcp.md`](../dns-ionos-mcp.md))

### D. Boutique Lemon Squeezy (API REST)
1. **Prérequis humain** : compte LS créé + clé API générée (je **ne crée pas** de compte).
   Ranger la clé : `ezk-secret set LEMONSQUEEZY_API_KEY_TEST --clip` (clé longue → presse-papier).
2. `KEY=$(ezk-secret get LEMONSQUEEZY_API_KEY_TEST)` → `GET /v1/user` → **confirmer à l'humain le compte connecté** (nom + email) avant toute écriture.
3. `GET /v1/stores`, `GET /v1/products` (lecture libre, avec `curl -g` dès qu'une URL porte des crochets).
4. **[VALIDATION à chaque écriture]** `POST /v1/products` etc. — jamais sans OK explicite, avec le détail (nom, prix).
5. Réglages du produit, validation de la clé dans l'app, passage test → live : voir la recette
   [`vendre-app-lemonsqueezy-licence-pro.md`](../vendre-app-lemonsqueezy-licence-pro.md).

## Validation humaine (élicitation)

Toute **écriture** sur un service externe (poser un secret, créer un produit,
changer un domaine) passe par une validation, selon le pattern
[`elicitation-authentification-forte.md`](../elicitation-authentification-forte.md).
Lecture (lister, inspecter) = libre.

## Recettes réutilisées

- [`secrets-trousseau/`](../secrets-trousseau/) — l'outil `ezk-secret`.
- [`plan-distribution-app.md`](../plan-distribution-app.md) — R2 / téléchargement.
- [`vendre-app-lemonsqueezy-licence-pro.md`](../vendre-app-lemonsqueezy-licence-pro.md) — boutique Lemon Squeezy, clé de licence, verrou Pro.
- [`brancher-domaine-vercel.md`](../brancher-domaine-vercel.md) · [`dns-ionos-mcp.md`](../dns-ionos-mcp.md) — domaine.
- [`vercel-kv-database.md`](../vercel-kv-database.md) — base KV (waitlist).
- [`elicitation-authentification-forte.md`](../elicitation-authentification-forte.md) — validation.

## Structure de cette brique

- `README.md` — ce mode opératoire.
- [`catalogue-secrets.md`](catalogue-secrets.md) — par application : quel secret, où, qui le lit.
- `journal/<app>.md` — état + **historique** par application (base de connaissance).
