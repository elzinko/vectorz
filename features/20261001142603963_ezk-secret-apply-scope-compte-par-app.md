---
id: "20261001142603963"
title: "ezk-secret apply — scope compte/par-app, secrets déclarés par recette et valorisés à l'application"
type: feature
priority: P2
product: vectorz
labels: [secrets, dx, ci]
status: idea
pr:
evidence: none
created: 2026-10-01
---

# 20261001142603963 — ezk-secret apply — scope compte/par-app, secrets déclarés par recette

**En clair.** Chaque fournisseur (Apple, Lemon Squeezy, R2, Vercel, PostHog, IONOS) range ses
secrets dans **deux tiroirs** : des identifiants de **COMPTE** (une seule valeur pour toutes tes
apps) et des trucs **PAR APP** (bucket, store_id, project_id…). Proposition : la **recette**
déclare quels secrets son intégration réclame et leur **scope** (compte ou par-app) ; le **projet**
compose les recettes qu'il utilise et fournit ses valeurs par-app ; `ezk-secret apply` crée ce qui
**manque** côté par-app, **réutilise** le compte, puis pousse tout à l'aveugle. Un seul concept
nouveau : le champ `scope: account | per-app`.

**Si tu arrives frais.** Une « recette » est un savoir réutilisable pour intégrer un fournisseur
(ex. `vendre-app-lemonsqueezy`). Un « projet » est une app précise (samplerz, muti). Le « trousseau »
est le coffre macOS où `ezk-secret` range les valeurs.

## Contexte / Problème

- Le savoir « ce secret est au niveau du compte / ce secret est par app » existe, mais **éparpillé**
  et **implicite** : un peu dans le catalogue markdown, un peu dans chaque recette, un peu dans la
  tête. Résultat : on redoute de dupliquer un secret de compte, ou d'oublier un secret par-app.
- Monter une **nouvelle app** = reposer tous les secrets à la main depuis le `.env`, sans savoir
  lesquels réutiliser (compte) et lesquels créer (par-app).
- La fiche sœur [`20261001104806732`](20261001104806732_ezk-secret-sync-manifeste-par-projet.md)
  pousse déjà un manifeste de projet à l'aveugle. Il manque la **couche au-dessus** : d'où vient le
  manifeste, et comment on valorise les manquants.

## Les deux tiroirs, par fournisseur (constaté dans les recettes)

| Fournisseur | **Compte** (partagé, rangé 1 fois, sans préfixe) | **Par app** (préfixé `<projet>-` ou `value:`) |
|---|---|---|
| Apple | cert Developer ID, mot de passe du cert, Apple ID, mot de passe d'app, team id | — (tout est compte) |
| Lemon Squeezy | clé API (voit toutes les boutiques) | `store_id`, `product_id` (non secrets), secret webhook |
| R2 / Cloudflare | `R2_ACCOUNT_ID` (+ option : 1 token tous buckets) | `R2_BUCKET_NAME`, `R2_PUBLIC_URL` (+ option : token par bucket) |
| Vercel | token, `VERCEL_ORG_ID` | `VERCEL_PROJECT_ID`, token Blob |
| PostHog | clé personnelle (management/MCP) | clé projet `phc_` (PUBLIQUE → `value:`, pas un secret) |
| IONOS | clé API | domaine / zone (config non secrète) |

## Proposition

1. **Un champ `scope: account | per-app`** sur chaque secret.
   - `account` → **une** valeur pour toutes les apps. Clé trousseau **sans préfixe**
     (`apple-app-specific-password`, `lemonsqueezy-api-key`, `r2-account-id`, `vercel-token`…).
   - `per-app` → une valeur **par app**. Clé trousseau `<projet>-<nom>`, ou `value:` en clair quand
     c'est un identifiant non secret (`store_id`, `project_id`, nom de bucket).
2. **La recette déclare le spec** — chaque recette qui réclame des secrets porte un petit
   `secrets.yaml` (noms, `scope`, rôle, destinations). C'est du **savoir fournisseur**, réutilisable,
   sans valeur ni spécificité d'app.
3. **Le projet compose** — son `secrets.yaml` liste les recettes qu'il utilise et fournit ses
   valeurs par-app : `uses: [apple, r2, lemonsqueezy, vercel]` + `store_id`, nom de bucket, etc.
4. **`ezk-secret apply`** — compose recette(s) + projet, puis pour chaque secret :
   - `account` présent au trousseau → **réutilise** ;
   - `account` absent → **demande une fois** de le créer (servira toutes les apps) ;
   - `per-app` présent (`<projet>-<nom>`) → réutilise ;
   - `per-app` absent → **demande de le valoriser** pour CETTE app.
   Puis pousse vers les destinations **à l'aveugle** (via `ezk-secret sync`, fiche sœur).
5. Le [catalogue central](../recipes/lancement-app/catalogue-secrets.md) reste la **vue lisible** ;
   à terme son état (✅/❌/⚙️) est **généré** par `ezk-secret check`.

Démarre simple : le `scope` dans le manifeste projet + un spec par recette pour les 2-3 fournisseurs
déjà en place (Apple, R2, Vercel), puis `apply` qui valorise les manquants.

## Critères d'acceptation

- [ ] Chaque secret porte un `scope: account | per-app` ; une clé `account` se range **une fois**,
      sans préfixe, et est réutilisée par plusieurs projets.
- [ ] Une recette porte un spec de ses secrets (noms, scope, rôle, destinations), sans valeur.
- [ ] Le `secrets.yaml` d'un projet **compose** des recettes et fournit ses valeurs par-app.
- [ ] `ezk-secret apply` réutilise les secrets de compte existants et **ne redemande pas** leur
      valeur.
- [ ] `ezk-secret apply` **détecte et demande** uniquement les secrets par-app manquants pour le
      projet courant, puis pousse à l'aveugle.
- [ ] Les identifiants non secrets (`store_id`, `project_id`, clé PostHog publique) sont posés en
      **variables** (`value:` / `kind: variable`), pas en secrets.

## Comment vérifier

```bash
# monter une app neuve : les secrets de compte sont réutilisés, seuls les par-app sont demandés
ezk-secret apply --project samplerz --dry-run   # plan : compte=réutilisé, par-app manquants listés
ezk-secret apply --project samplerz             # demande SEULEMENT les par-app absents, puis pousse
ezk-secret check  --project samplerz            # ✅/❌/⚙️ par secret, scope visible, sans valeur
```

## Glossaire

- `scope` — niveau d'un secret : `account` (une valeur pour toutes les apps) ou `per-app` (une par
  app).
- `spec de recette` — la déclaration, dans une recette, des secrets que son intégration réclame
  (noms, scope, rôle, destinations), sans valeurs.
- `valoriser` — créer la valeur d'un secret par-app encore absent, au moment d'appliquer la recette.

## Notes / décisions

- **Dépend de** la fiche [`20261001104806732`](20261001104806732_ezk-secret-sync-manifeste-par-projet.md)
  (le `sync` aveugle est la brique de poussée ; `apply` est la couche compose + valorise au-dessus).
- Classement des deux tiroirs **constaté** dans `recipes/vendre-app-lemonsqueezy-licence-pro.md`
  (clé API = compte, `store_id` = par-app) et `recipes/mettre-en-place-ci-projet-type-muti.md`
  (Vercel : token + org = compte, project = par-app ; R2 : account_id = compte, bucket = par-app).
- Antériorité : `ci:local setup` génère déjà `.secrets`/`.vars` depuis le `.env` pour `act` —
  même idée de projection, mais source = `.env`. Ici la source devient le **trousseau**.
- **Priorité P2** : hors chemin critique de la 1.0, mais c'est le mécanisme qui « simplifie la
  gestion de tout ça » réclamé, et il sert tous les projets.
