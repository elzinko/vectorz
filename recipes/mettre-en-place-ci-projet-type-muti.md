---
id: "20261001030914551"
title: "Mettre en place la CI d'un projet type muti (app desktop + site de vente)"
makes: "Une CI complète pour une app desktop et son site de vente : tests sur chaque PR, livraison sur main et sur les tags, déploiement du site, et un même plan rejouable en local"
source: ~/git/bacasable/muti # CI prouvée : 6 workflows et un lanceur local
composes: [plan-distribution-app, brancher-domaine-vercel]
status: draft
home: central
created: 2026-10-01
updated: 2026-10-01
---

## En clair

Cette recette explique comment bâtir la CI d'un projet fait d'une **app desktop** et d'un **site de
vente**. Elle s'appuie sur celle de muti, déjà éprouvée, pour qu'un nouveau projet parte d'un exemple
au lieu de tout recâbler à la main. Le socle teste chaque PR, livre sur `main` et sur les tags, et
déploie le site. Des options ajoutent un nettoyage, un smoke test et une page « coming soon ». Le même
plan se rejoue en local, avec `act` ou sans Docker.

## Ingrédients (prérequis)

- Un dépôt GitHub en monorepo pnpm : l'app desktop (Electron) et le site web.
- Un projet Vercel pour le site. Il fournit trois secrets : un token, l'id d'organisation et l'id du
  projet (chez muti : `VERCEL_MUTI_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`).
- Un bucket R2 pour les binaires : `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
  `R2_BUCKET_NAME`, et la variable `R2_PUBLIC_URL`. Voir [plan-distribution-app](plan-distribution-app.md).
- Un store Vercel Blob pour les vidéos et la page « coming soon » : `BLOB_READ_WRITE_TOKEN`.
- Pour signer et notariser l'app sur macOS : `CSC_LINK`, `CSC_KEY_PASSWORD`, `APPLE_ID`,
  `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`.
- Une variable de dépôt `LOCAL_CI`, l'interrupteur de la CI locale (voir l'étape 6).
- Les noms de domaine des environnements dev, staging et prod. Voir
  [brancher-domaine-vercel](brancher-domaine-vercel.md).

Les analytics et la couverture (PostHog, Gist) sont propres à muti. On les retire si le projet n'en a pas.

## Ustensiles (outils — CLI d'abord)

- `gh` pour poser les secrets et les variables (`gh secret set`, `gh variable set`).
- `pnpm` pour toute la chaîne de build et de test.
- `act` et Docker pour rejouer les workflows en local. Les deux sont facultatifs.
- `actionlint`, lancé par un script du projet, pour valider les workflows avant de pousser.
- `vercel` pour lier le projet et poser des variables d'environnement.

## Préliminaires (gestes manuels ⚙️)

- ⚙️ Créer le projet Vercel, le bucket R2 et le store Blob.
- ⚙️ Obtenir un certificat Apple Developer ID et un mot de passe d'application, pour la signature.
- ⚙️ Poser les secrets et les variables dans GitHub, une fois, depuis le `.env` du dépôt principal.
  Chaque écriture se valide avec l'humain.
- ⚙️ Décider du mode de CI du quotidien : cloud ou local (étape 6).

## Le concept (mécanisme + schéma)

Chaque workflow commence par un job `context`. Il calcule la version, la branche et une garde. Tous les
autres jobs en dépendent, donc une seule garde à la racine coupe toute la chaîne.

```
 PR ───────────▶ ci.yml  : context ▶ build+test ▶ upload-videos ▶ deploy-preview
 push main ────▶ cd.yml  : context ▶ build ▶ upload-videos ▶ deploy (dev)
 tag v*-rc* ───▶ cd.yml  : build ▶ package (mac, win, linux) ▶ release (prerelease) ▶ deploy (staging)
 tag v* final ─▶ cd.yml  : build ▶ package (3 OS) ▶ release (draft) ▶ deploy (staging)
                           puis la prod, à la main : deploy-website.yml
 PR fermée, dimanche ▶ cleanup.yml : supprime la preview, vide les caches
 à la demande ──▶ smoke-test.yml · coming-soon.yml · deploy-website.yml
```

Trois idées à retenir :

1. **GitHub reste la source de vérité.** Le local est un accélérateur, jamais un remplaçant.
2. **Économiser les minutes.** Les PR qui ne touchent que des docs ne lancent rien. Un nouveau push
   annule le run en cours. Le packaging multi-OS ne part que sur un tag.
3. **Un même plan, trois endroits** : sur GitHub, en local avec `act`, ou en natif sans Docker.

## Exemples pour goûter (référence)

L'implémentation prouvée est la CI de muti : six workflows dans `.github/workflows/`, et le lanceur
`pnpm ci:local` pour les rejouer. Pour goûter sans rien exécuter, `pnpm ci:local dryrun ci` fait
lire le workflow de PR par `act` sans lancer aucune étape.

## Les étapes (playbook)

### 1. Poser les ingrédients

1. ⚙️ Créer les comptes et les ressources (Préliminaires).
2. ⚙️ Poser les secrets dans GitHub avec `gh secret set <NOM>`, valeur en entrée standard, jamais
   affichée. Poser les variables avec `gh variable set <NOM>`.
3. Garder dans le `.env` du dépôt principal la copie locale des valeurs. Le lanceur local en a besoin.

### 2. CI sur les PR (`ci.yml`)

1. Déclencher sur `pull_request` vers `main`, avec `paths-ignore` pour les docs, les fiches et les
   dossiers d'outils. Une PR docs-only ne lance rien.
2. Un groupe de concurrence par ref, avec annulation du run précédent.
3. Enchaîner `context`, puis `build+test` (lint, tests avec couverture, build global), puis
   `upload-videos`, puis `deploy-preview` sur Vercel.
4. ⚠ Le déploiement Vercel peut rester bloqué en attente d'une entrée au clavier. Borner ce job
   par un `timeout-minutes` court.

### 3. Livraison continue (`cd.yml`)

1. Déclencher sur `push` vers `main` et sur les tags `v*`. Mêmes `paths-ignore` que la CI.
2. Sur `main` : build, vidéos, déploiement du site en **dev**. Pas de packaging, pour économiser les
   minutes macOS (dix fois plus chères).
3. Sur un tag `v*-rc*` : build, **packaging des trois OS**, release GitHub en prerelease, déploiement
   du site en staging.
4. Sur un tag `v*` final : même chaîne, release en brouillon. La prod se lance à la main
   (étape 4) après vérification.
5. Concurrence : un push annule le run en cours, **sauf sur un tag**, où le packaging va toujours au bout.
6. Packaging : une matrice mac, windows, linux, avec `fail-fast: false` pour qu'un OS qui casse
   n'annule pas les autres. Un `timeout-minutes` court protège le job le plus cher.
7. Un **smoke test** de l'app empaquetée vérifie qu'elle démarre sans crash. Il est bloquant : si
   l'app plante au démarrage, le job échoue et l'installeur n'est pas publié.

### 4. Déployer le site à la main (`deploy-website.yml`)

1. Déclencher à la demande, avec trois entrées : l'environnement (dev, staging, production), le tag
   des binaires à proposer au téléchargement, et une ref facultative pour le contenu du site.
2. La ref facultative permet de publier du contenu sans reconstruire les trois OS.

### 5. Les options (activables par projet)

- **Nettoyage** (`cleanup.yml`) : supprime la preview d'une PR mergée, et vide les caches Actions
  chaque dimanche.
- **Smoke test** (`smoke-test.yml`) : tests E2E de l'app Electron, à la demande ou quand on pose un
  label sur la PR. Matrice mac et linux, donc un `timeout-minutes` obligatoire.
- **Page « coming soon »** (`coming-soon.yml`) : bascule la page d'attente par Vercel Blob, sans
  redéploiement.

### 6. Rejouer le même plan en local

1. `pnpm ci:local setup` génère `.secrets` et `.vars` depuis le `.env`. Les deux sont ignorés par git.
2. `pnpm ci:local verify` contrôle Docker, `act` et les secrets.
3. `pnpm ci:local dryrun ci` (ou `cd`) lit le workflow sans exécuter d'étape. C'est rapide et sans risque.
4. `pnpm ci:local cd-tag <tag> -j <job>` joue un job précis. Les jobs de build et de packaging demandent
   l'image Docker complète, d'environ 6 Go (`pnpm ci:local pull-full`).
5. **Sans Docker** : `pnpm ci:local native` rejoue lint, tests et build directement sur la machine.
   Ce n'est pas un substitut de release : il saute conteneur, OS et artefacts.
6. `pnpm ci:local:signal` valide en natif, puis poste le statut `ci/local-build` sur la PR.
7. Avant de pousser un changement de workflow, valider avec le script de lint des workflows.

### 7. Choisir cloud ou local

1. `pnpm ci:mode local` pose la variable `LOCAL_CI=true` : GitHub saute la CI de PR et le CD de `main`.
   `pnpm ci:mode cloud` rétablit la CI cloud. `pnpm ci:mode status` donne l'état.
2. ⚠ **Les tags de release partent toujours en cloud.** Le packaging multi-OS ne se reproduit pas en
   local : on ne peut pas construire l'installeur Windows sur un Mac.
3. Ces économies comptent pour un dépôt **privé**. Sur un dépôt public, GitHub Actions est gratuit.

### 8. Versionnement (hors de cette recette)

Un tag `v*` est posé par un script de version qui édite les `package.json`. Ce sujet est une brique à
part, qui se compose avec cette recette et avec la distribution. Il aura sa propre recette.

## Checklist « rien d'oublié »

- [ ] les secrets et variables listés plus haut sont posés dans GitHub, sans valeur affichée
- [ ] une PR docs-only ne lance aucun workflow, et un nouveau push annule le run en cours
- [ ] le packaging ne part que sur un tag, avec `fail-fast: false` et un `timeout-minutes`
- [ ] un tag `v*` donne une release, et le site staging est déployé
- [ ] la prod ne se déploie qu'à la main, après vérification
- [ ] `pnpm ci:local verify` passe, ou le mode natif tourne si Docker manque
- [ ] les workflows sont validés par le lint avant chaque push
- [ ] les jobs coûteux (macOS, déploiement Vercel) ont un `timeout-minutes`
- [ ] le choix cloud ou local est écrit quelque part, avec l'exception des tags de release

## Fichiers de référence (entonnoir — pointer, jamais copier)

Racine : **`~/git/bacasable/muti`** (pointeurs relevés le 2026-10-01).

- `.github/workflows/ci.yml:1` — la CI de PR : l'enchaînement des jobs
- `.github/workflows/ci.yml:19` — la concurrence, avec annulation du run précédent
- `.github/workflows/ci.yml:31` — le job `context` et la garde `LOCAL_CI`
- `.github/workflows/ci.yml:64` — le job `build` : lint, tests, couverture, build
- `.github/workflows/ci.yml:171` — le déploiement de la preview sur Vercel
- `.github/workflows/cd.yml:1` — les trois scénarios : push main, tag rc, tag final
- `.github/workflows/cd.yml:30` — la concurrence, désactivée sur un tag
- `.github/workflows/cd.yml:44` — l'exception : un tag de release part toujours en cloud
- `.github/workflows/cd.yml:205` — la release GitHub, en brouillon ou en prerelease
- `.github/workflows/cd.yml:238` — le packaging des trois OS, avec son `timeout-minutes`
- `.github/workflows/cd.yml:268` — `fail-fast: false` sur la matrice
- `.github/workflows/cd.yml:364` — le smoke de l'app empaquetée
- `.github/workflows/cd.yml:472` — le déploiement du site depuis la livraison continue
- `.github/workflows/deploy-website.yml:1` — le déploiement manuel : environnement, tag, ref
- `.github/workflows/cleanup.yml:1` — le nettoyage des previews et des caches
- `.github/workflows/smoke-test.yml:1` — le smoke test E2E, à la demande ou par label
- `.github/workflows/coming-soon.yml:1` — la bascule de la page d'attente
- `package.json:47` — les commandes `ci:local` (lignes 47 à 50) et `ci:mode` (ligne 51)
- `scripts/ci-local.sh:51` — l'aide du lanceur local : toutes les commandes
- `scripts/ci-local.sh:229` — le mode natif, sans Docker
- `scripts/ci-local.sh:296` — le signal posé sur la PR
- `scripts/ci-mode.sh:1` — la bascule cloud ou local
- `scripts/setup-act-secrets.sh:1` — la génération de `.secrets` et `.vars` depuis le `.env`
- `scripts/lint-workflows.sh:1` — le lint des workflows sans rien installer
- `scripts/pipeline-context.sh:1` — le calcul du contexte appelé par le job `context`

## Statut de cette recette

Capturée le 2026-10-01, depuis la fiche du 2026-08-24 qui demandait de capitaliser la CI de muti.
Le point d'entrée local, `pnpm ci:local`, a été vérifié ce jour-là : il n'y a pas de `Makefile`.

Elle reste en `draft` : aucun deuxième projet ne l'a encore rejouée. Les numéros de ligne dérivent
avec la CI de muti. Le versionnement, la distribution et le domaine sont des recettes sœurs, citées
mais non reprises ici.
