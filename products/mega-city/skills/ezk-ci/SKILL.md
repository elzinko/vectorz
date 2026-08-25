---
name: ezk-ci
argument-hint: "[help|check|list|dryrun|run|native|bootstrap|conso|frugal|harden]"
description: >-
  Validate GitHub Actions pipelines locally with act + Docker before pushing or
  committing, AND watch/cap the cloud-side GHA consumption of private repos. Use
  whenever the user asks to run CI locally, mentions GitHub Actions billing
  exhaustion (spending limit, billing exceeded, out of GHA minutes), asks how
  many Actions minutes a repo burns or which workflows cost the most, wants to
  cap spending on a private repo, makes a repo private (key cost moment), wants
  a frugal CI (paths-ignore, concurrency, gated heavy jobs), reports a workflow
  failure they want to debug without burning runner minutes, edits a file under
  .github/workflows/, or needs to test a .yml workflow. Also covers macOS jobs
  that must run on the host because Docker has no macOS image, and a bootstrap
  path for projects with no local CI setup yet.
---

# ezk-ci

Tu permets de **valider une pipeline GitHub Actions en local**, avec
[`act`](https://github.com/nektos/act) + Docker, **avant** de commiter ou
pousser — pour ne pas brûler de minutes GitHub Actions et garder un cycle de
feedback rapide (30-60 s avec cache, vs 3-8 min en cloud).

## Usage (sous-commandes)

`/ezk-ci [sous-commande] [args]` — ou en langage naturel (« valide la CI en local »).

| Sous-commande | Effet |
|---|---|
| `help` (ou `?`, ou **sans argument**) | Affiche ce tableau d'usage — ne lance rien |
| `check` / `doctor` | Vérifie les pré-requis : `docker info` répond, `act --version` présent |
| `list` | `act -l` — liste les jobs (si « Could not parse » → ajoute `workflow_dispatch:`) |
| `dryrun` | `act --dryrun` — parse sans exécuter (rapide, sûr) |
| `run [job]` (**défaut** pour une demande en langage naturel) | `act workflow_dispatch -j <job>` (un job ciblé, à privilégier) ou la pipeline complète, après l'arbre de décision |
| `native [branche]` | **Mode dégradé SANS Docker** : rejoue les commandes réelles du job de validation (lint + tests + build) directement sur l'hôte. Quand l'image runner ne se pull pas / quota Actions épuisé. Pas un substitut release. Voir section dédiée. |
| `bootstrap` | Pose le setup local minimal (`.actrc`, `.secrets.example` / `.vars.example`) puis `act -l` (cas c) |
| `conso [repo]` | Restitue la **conso Actions** : minutes du mois (billing du compte), runs récents et top workflows/jobs coûteux |
| `frugal [repo]` | Audit **parcimonie** des workflows : spending limit, déclencheurs, `concurrency`, gates du lourd — propose des diffs concrets |
| `harden [workflow.yml]` | **Applique** les patterns de frugalité manquants (POC : skip-docs `paths-ignore`), pas seulement les proposer. Idempotent ; **lecture seule** en audit, écrit avec `--apply`. Suite de `frugal` : `frugal` propose, `harden` pose. |

> **Help** : invoquée sans sous-commande (ou avec `help`/`?`), affiche d'abord ce tableau. Une demande en langage naturel lance `run` après l'arbre de décision ci-dessous. Sous-commande non reconnue → traite la demande en prose (la skill reste pilotable naturellement).

## Arbre de décision (à l'entrée)

Détecte la situation du projet et route :

| Cas | Signal | Action |
| --- | --- | --- |
| **(a)** | un point d'entrée existe (`pnpm ci:local`, `make ci` / `make ci-local`, script `ci:local`) | **utilise-le**, ne réinvente rien |
| **(b)** | un `.actrc` existe mais pas de wrapper | lance **`act`** directement |
| **(c)** | des `.github/workflows/*.yml` existent mais aucun setup local | **bootstrap** (section dédiée) |
| **(d)** | pas de GitHub Actions du tout | skill non applicable — sors et dis-le |

## Pré-requis (modes `act` — `list`/`dryrun`/`run`/`bootstrap`)

> Le mode dégradé **`native`** s'en **exempte délibérément** : c'est justement
> l'échappatoire quand Docker ou `act` manquent (voir « Mode dégradé — `native` »
> plus bas). Ces pré-requis ne concernent que les modes qui pilotent `act`.

- **Docker lancé** (`docker info` doit répondre).
- **`act` installé** (`act --version` ; sinon `brew install act` sur macOS, ou
  le script curl de nektos/act).

## Pré-vol automatique (AVANT tout mode `act` — le garde-fou)

Ne lance **jamais** `list`/`dryrun`/`run`/`bootstrap` sans ce pré-vol : il remplace
l'échec cryptique par un **message clair**, et propose toujours la **bascule `native`**.

1. **Docker installé ?** `docker --version`. Sinon → **STOP + warning** : « Docker n'est pas
   installé. Installe Docker Desktop (https://www.docker.com/products/docker-desktop), puis
   relance — ou lance `native` (sans Docker). »
2. **Docker démarré ?** `docker info` doit répondre. Sinon → **STOP + warning** : « Docker est
   installé mais **pas démarré**. Ouvre Docker Desktop, attends qu'il soit prêt, puis relance
   — ou lance `native`. »
3. **`act` installé ?** `act --version`. Sinon → warning « installe act (`brew install act`) — ou `native`. »
4. **Après un run qui échoue sur `exec: "node": not found`** (act issue #107) : ce n'est **pas**
   un bug du code — c'est l'**image runner**. Deux gestes : purge les containers act
   (`docker rm -f $(docker ps -aq -f name=act-)`) puis relance ; si ça persiste, passe à l'image
   **full** (`catthehacker/ubuntu:full-22.04`) pour les jobs `setup-node`. Sur **Apple Silicon**,
   l'émulation `amd64` reste parfois capricieuse (node introuvable même en full) → **`native`
   est alors le repli fiable et suffisant** (il rejoue lint/tests/build sur l'hôte).

> Le mode **`native` n'a AUCUN de ces pré-requis** : c'est l'échappatoire assumée quand Docker
> ou `act` coincent. Quand le pré-vol échoue, **propose-le d'emblée** plutôt que d'insister sur `act`.

## Savoir-clé — les pièges non-évidents

### Image slim vs full (le piège principal)

| Image | Taille | Suffit pour |
| --- | --- | --- |
| `catthehacker/ubuntu:act-22.04` (défaut) | ~2-5 GB | `act -l`, `--dryrun`, jobs simples, deploy manuel |
| `catthehacker/ubuntu:full-22.04` (opt-in) | ~6 GB | jobs avec `actions/setup-node@v6` & co (act issue #107) |

La variante légère casse `actions/setup-node@v6` avec un `command not found`
cryptique. **Stratégie** : défaut slim (couvre ~80 % des cas), opt-in full
quand on a besoin des jobs Build/Package. Pré-télécharge la full avec
`act --pull` ou une cible dédiée si nécessaire.

### Mode dégradé — `native`, sans Docker du tout (l'échappatoire)

L'image full (~6 GB) **ne se pull pas toujours** : réseau instable → `unexpected
EOF` en plein download (Docker reprend les couches finies mais recommence celle qui
a été coupée) ; **Apple Silicon** → sans `--platform linux/amd64` il pull l'arm64,
inutilisable par `act`. Résultat vécu (muti, 2026-08-13) : 3 pulls ratés, `act`
totalement bloqué alors qu'il fallait juste valider 5 features.

Or les étapes qui **valident réellement** une feature — lint, tests, build — sont
**OS-agnostiques** et n'ont pas besoin du conteneur. D'où le **mode dégradé assumé** :
rejouer les commandes réelles du job de validation **directement sur l'hôte**.

- **Confiance — préalable OBLIGATOIRE** : `native` rejoue du code **contrôlé par la
  branche** (scripts de package inclus) **directement sur l'hôte, sans isolation** — avec
  accès à ton `$HOME`, ton agent SSH, ton keychain, tes secrets ambiants. Ne le lance
  **que sur du code de confiance** (ta propre branche). Sur une **PR/branche non fiable**,
  **demande une confirmation explicite AVANT** de rejouer quoi que ce soit — divulguer
  l'absence d'isolation *après coup* n'empêche ni l'exfiltration ni la modification.
- **Quand** : l'image runner ne se télécharge pas, OU quota Actions épuisé, OU on veut
  juste un garde-fou de 10 s avant un merge. **Pas** pour un release (voir plus bas).
- **Comment** : lis le job de validation du workflow (souvent `ci.yml > build`) et
  rejoue ses steps `run:` sur l'hôte, dans l'ordre, verdict vert/rouge **par étape**.
  Saute ce qui est spécifique au runner : `actions/checkout`, `setup-node`,
  `actions/cache`, `apt-get install` (deps système déjà là en local), `upload-artifact`.
- **Argument `[branche]`** : sans argument, `native` rejoue sur le **working tree courant**.
  Avec `[branche]`, **isole dans un worktree jetable** — `git worktree add <tmp> <branche>`
  → rejoue **dedans** → `git worktree remove <tmp>` (quoi qu'il arrive). Plus robuste qu'un
  `git checkout` + `git checkout -` : si un step rejoué modifie un fichier suivi, le retour
  échoue ou ramène ces changements dans ta branche, et un replay avorté sauterait le
  nettoyage — la restauration n'est alors **pas garantie**. Le worktree garantit isolation
  **et** restauration. Sans checkout du tout tu validerais la **mauvaise révision** (vert
  trompeur) — ne l'annonce pas dans l'usage sans l'appliquer.
- **Implémentation de référence (muti)** : sous-commande `pnpm ci:local native [branche]`
  dans `scripts/ci-local.sh` — garde-fou working-tree, checkout+restore de branche
  optionnel, `--no-install`, verdict par étape (fiche muti 0032). La séquence est
  **hardcodée** en miroir du job `build` (commentaire de synchro vers `ci.yml`) : parser
  le YAML serait fragile (env, actions, substitutions), et c'est cohérent avec le style
  du script (les invocations `act` y sont déjà codées par workflow).

> **Frontière honnête** : `native` ne reproduit PAS l'isolation d'env conteneur, l'OS
> runner exact, l'étape `apt`/deps système, `setup-node`, ni les artefacts. C'est un
> **garde-fou avant merge**, pas un substitut à la CI cloud pour un release. À dire à
> l'utilisateur à chaque fois qu'on retombe dessus.

### `.actrc` de référence (à la racine du repo)

```ini
# Apple Silicon : les runners GitHub sont linux/amd64. Sans ça, act tente arm64
# et la plupart des images d'action explosent en "exec format error".
--container-architecture linux/amd64

# Pin des images runner (la "medium" a Node + outils courants pré-installés).
-P ubuntu-latest=catthehacker/ubuntu:act-22.04
-P ubuntu-22.04=catthehacker/ubuntu:act-22.04
-P ubuntu-24.04=catthehacker/ubuntu:act-24.04

# Réutilise le container entre runs (cache apt/node_modules) : run 60s -> 10s.
# Reset : docker rm -f $(docker ps -aq -f name=act-)
--reuse

# Secrets / variables (fichiers gitignorés).
--secret-file .secrets
--var-file .vars
```

### macOS / Windows : pas d'image Docker → exécution sur l'hôte

Docker n'a **pas** d'image macOS ni Windows. Pour un job `runs-on: macos-latest`,
route vers l'hôte dans `.actrc` :

```
-P macos-latest=-self-hosted
-P windows-latest=-self-hosted
```

`act` exécute alors les steps **directement sur ta machine** (hors container).
À savoir : ça ne marche que **sur la bonne OS** ; **pas d'isolation** (un step
qui touche `~/.ssh`, la keychain ou tes clés de signature le fait pour de vrai).

### Secrets / variables — mapping local → CI

Le nommage local diffère souvent du nommage GitHub Actions
(`VERCEL_TOKEN` local → `VERCEL_MUTI_TOKEN` côté CI ; une URL R2 S3 locale vs la
CDN publique `*.r2.dev`). **Mappe explicitement**, ne copie pas aveuglément
`.env`. `.secrets` / `.vars` sont **gitignorés** ; `.secrets.example` /
`.vars.example` sont **commités** (templates + notes de mapping).

### Tweaks de workflow qui rendent `act` propre

- **Déclare `workflow_dispatch:`** dans les `on:` → `act workflow_dispatch -j <job>` « just works ».
- **N'enchaîne pas `pnpm/action-setup` + `actions/setup-node`** : collision PATH
  sous `act` (`exec: "node": not found`). Utilise **Corepack** (`corepack enable`
  + `corepack prepare pnpm@x --activate`), identique en cloud et en local.

### Safeguard anti-runaway (la leçon à 720 min)

Tout job qui appelle un CLI interactif (`npx vercel …` sans `--yes`) peut hanger
sur stdin ; le timeout GHA par défaut est **360 min** → 6 h cramées. **Mets
`timeout-minutes:`** sur tout job de déploiement (~2-3× le happy path observé).
Post-mortem : `gh run view <id> --json jobs` et regarde `duration_ms` par job.

## Parcimonie cloud — surveiller & plafonner la conso GHA (repos privés)

Valider en local (le cœur de ce skill) évite de brûler des minutes **avant** de pousser ;
ce volet couvre l'autre moitié : la conso **côté GitHub** une fois le workflow poussé.
Le coût dépend de la **visibilité** : en public, les minutes Actions sont gratuites ; en
**privé**, chaque run consomme le quota mensuel du compte (2 000 min/mois en Free), puis
facture. Frontière tenue : conseiller, restituer la conso, éditer les workflows — **pas**
dupliquer un outil de billing.

### Le moment-clé : passage public → privé

Un `gh repo edit --visibility private` (ou le passage via l'UI) transforme une CI
« gratuite » en une CI **qui mange du quota** — sans garde-fou on le découvre à la
facture. Dès que tu détectes ce passage (ou qu'on te le demande sur un repo dont
`gh repo view --json visibility` dit `PRIVATE`), **alerte** et déroule la checklist :
spending limit posé ? déclencheurs frugaux ? lourd gaté ? `timeout-minutes` partout ?

### `conso` — mesurer (minutes du mois, top coûteux)

```bash
# Minutes Actions du mois — choisis la PAIRE selon le propriétaire du repo (compte
# user OU org), puis essaie legacy et « enhanced billing » : selon le plan, l'un
# des deux répond (l'autre rend 404/410 — normal, pas une panne).
# Repo d'un compte USER :
gh api /users/<user>/settings/billing/actions        # legacy → total_minutes_used, included_minutes
gh api /users/<user>/settings/billing/usage          # enhanced billing (comptes migrés)
# Repo d'une ORG :
gh api /orgs/<org>/settings/billing/actions          # legacy
gh api /organizations/<org>/settings/billing/usage   # enhanced billing (orgs migrées)

# Qui coûte : runs récents avec durées, à agréger par workflow.
gh run list --limit 50 --json workflowName,status,createdAt,updatedAt,databaseId

# Minutes FACTURABLES d'un run précis (ventilées par OS — macOS coûte 10×, Windows 2×).
gh api /repos/<owner>/<repo>/actions/runs/<run_id>/timing

# Post-mortem par job (la commande du safeguard anti-runaway, même esprit) :
gh run view <run_id> --json jobs   # regarde duration_ms par job
```

Restitue : minutes consommées / incluses ce mois, top 3 workflows par minutes cumulées,
et tout job dont la durée déborde son happy path (candidat au gate ou au timeout).

### Plafonner : spending limit à 0 (défaut recommandé sur un repo privé)

Le **spending limit Actions à 0 $** coupe net quand le quota inclus est épuisé — aucun
dépassement facturé. Il n'est **pas pilotable par l'API publique** (2026) : pose-le dans
l'UI — compte user : `github.com/settings/billing/spending_limit` ; org :
`Settings → Billing and plans → Spending limits` — et **vérifie au mieux** en lisant le
billing (`total_paid_minutes_used` doit rester à 0). Dis-le explicitement à l'utilisateur
au lieu de simuler un réglage API qui n'existe pas.

### Réduire les déclenchements & gater le lourd — les diffs à proposer

Règles **récoltées du monorepo `muti`** (référence d'implémentation de ce skill —
relevé 2026-07 sur ses 6 workflows) :

- **CI sur `pull_request` uniquement** (vers `main`), CD séparé sur `push: main` — un
  push sur une branche sans PR ne consomme rien.
- **Le lourd est gaté** : la smoke-test multi-OS (matrice mac/linux, la plus chère) ne
  part que sur **label `smoke-test`** posé sur la PR ou **`workflow_dispatch`** manuel :

  ```yaml
  on:
    workflow_dispatch:
    pull_request:
      branches: [main]
      types: [labeled]
  jobs:
    smoke-test:
      if: >-
        github.event_name == 'workflow_dispatch' ||
        github.event.label.name == 'smoke-test'
  ```
- **Déploiements en `workflow_dispatch`** (jamais automatiques) ; **cleanup en cron
  hebdo** (`schedule`) + jobs conditionnés (`if: merged == true`).

**Écart documenté** (AC fiche 0055 — ces deux-là ne viennent PAS de muti, qui ne les a
quasiment pas ; ils viennent de la CI vectorz et du savoir déjà encodé ici) :

- **`concurrency`** — tue les runs obsolètes quand on repousse sur la même ref :

  ```yaml
  concurrency:
    group: ${{ github.workflow }}-${{ github.ref }}
    cancel-in-progress: true
  ```

- **`paths-ignore` / `paths`** — pas de CI sur un changement docs-only :

  ```yaml
  on:
    pull_request:
      branches: [main]
      paths-ignore: ['**.md', 'docs/**']
  ```

- **`timeout-minutes` partout** : le safeguard anti-runaway ci-dessus (leçon à 720 min) —
  même esprit, côté cloud.

### `harden` — appliquer la frugalité, pas seulement la proposer

`conso` **mesure**, `frugal` **propose** des diffs (fiche 0159, shipped). `harden` est le
bras qui **pose** : il audite un workflow et **applique** les patterns manquants, de façon
**idempotente**.

**Frontière ADR-0001.** Le **déterministe** vit dans `products/mega-city/src/ci/harden.ts`
(détecter un pattern manquant, l'appliquer en **fusionnant** — sans jamais écraser un
`paths-ignore` existant — via la lib `yaml` ; le rendu peut légèrement normaliser le style YAML). Le **jugement** — quels patterns proposer à CE repo — reste ici, côté skill.

**POC (pattern `skip-docs`)** : ajoute `paths-ignore: ['**.md', 'docs/**']` sur le
déclencheur `pull_request` quand il manque — le pattern le plus agnostique à la stack. La
structure est prévue pour d'autres patterns (`concurrency`, `timeout-minutes`…) sans changer
l'API.

```bash
# Audit (LECTURE SEULE) — liste les patterns manquants, n'écrit rien :
tsx bin/ezk-ci-harden.ts <chemin/vers/workflow.yml>

# Application — écrit le fichier (idempotent : un re-run ne change plus rien) :
tsx bin/ezk-ci-harden.ts <chemin/vers/workflow.yml> --apply
```

- **Lecture seule en audit** : sans `--apply`, aucun fichier n'est modifié.
- **Idempotent** : relancer `--apply` sur un workflow déjà frugal ne fait rien.
- **Preuve** : fixtures internes + tests dans `src/ci/__tests__/harden.test.ts`.
- **Repos réels** (`muti`, `city-guided`) : preuve différée en **recette manuelle** — ne pas
  ouvrir de PR sur des repos tiers en mode autonome (action sortante).
- **Forme `on:` map requise** : `on: [push, pull_request]` (liste) est **signalé** mais non posé
  automatiquement (POC — passe `on` en map pour appliquer).

## Workflow d'usage

```bash
act -l                              # liste les jobs (si "Could not parse" -> ajoute workflow_dispatch:)
act --dryrun                        # parse sans exécuter (rapide, sûr)
act workflow_dispatch -j <job>      # UN job ciblé (rapide, moins cher) -- privilégie ça en itération
act workflow_dispatch               # la pipeline complète
```

## Bootstrap (cas c)

Pose le setup minimal puis valide :

1. `.actrc` (template ci-dessus).
2. `.secrets.example` + `.vars.example` **commités** ; `.secrets` + `.vars`
   **gitignorés** ; mappe les secrets locaux → noms CI.
3. (Optionnel) un wrapper `scripts/ci-local.sh` avec sous-commandes
   `setup` / `verify` / `list` / `dryrun` / `<job>` exposé via `pnpm ci:local`
   ou `make ci`.
4. Sanity : `act -l` doit lister les jobs sans erreur.

## Limitations honnêtes (à dire à l'utilisateur)

- Pas d'image macOS/Windows Docker → ces jobs tournent **sur l'hôte** seulement.
- Pas de `GITHUB_TOKEN` réel par défaut → les actions qui appellent l'API GitHub
  échouent sauf si on fournit un PAT.
- `actions/cache` : cache **local** seulement (pas de backend distant).
- `actions/upload-artifact` : simulé via `/tmp/` — OK pour la plupart des cas.

## Référence d'implémentation

Setup `act` complet et éprouvé : repo `muti` (`.actrc`, `scripts/ci-local.sh`,
`scripts/setup-act-secrets.sh`). Les `scripts/` paramétrables et les
`references/` détaillées (act-setup, macos-on-host, bootstrap, debugging) sont à
générer via `skill-creator` à partir du [`BRIEF.md`](BRIEF.md) — cette version
encode déjà le savoir critique pour valider une pipeline en local sans repartir
de zéro.
