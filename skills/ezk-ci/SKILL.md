---
name: ezk-ci
argument-hint: "[help|check|list|dryrun|run|bootstrap]"
description: >-
  Validate GitHub Actions pipelines locally with act + Docker before pushing or
  committing. Use whenever the user asks to run CI locally, mentions GitHub
  Actions billing exhaustion (spending limit, billing exceeded, out of GHA
  minutes), reports a workflow failure they want to debug without burning runner
  minutes, edits a file under .github/workflows/, or needs to test a .yml
  workflow. Also covers macOS jobs that must run on the host because Docker has
  no macOS image, and a bootstrap path for projects with no local CI setup yet.
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
| `bootstrap` | Pose le setup local minimal (`.actrc`, `.secrets.example` / `.vars.example`) puis `act -l` (cas c) |

> **Help** : invoquée sans sous-commande (ou avec `help`/`?`), affiche d'abord ce tableau. Une demande en langage naturel lance `run` après l'arbre de décision ci-dessous. Sous-commande non reconnue → traite la demande en prose (la skill reste pilotable naturellement).

## Arbre de décision (à l'entrée)

Détecte la situation du projet et route :

| Cas | Signal | Action |
| --- | --- | --- |
| **(a)** | un point d'entrée existe (`pnpm ci:local`, `make ci` / `make ci-local`, script `ci:local`) | **utilise-le**, ne réinvente rien |
| **(b)** | un `.actrc` existe mais pas de wrapper | lance **`act`** directement |
| **(c)** | des `.github/workflows/*.yml` existent mais aucun setup local | **bootstrap** (section dédiée) |
| **(d)** | pas de GitHub Actions du tout | skill non applicable — sors et dis-le |

## Pré-requis

- **Docker lancé** (`docker info` doit répondre).
- **`act` installé** (`act --version` ; sinon `brew install act` sur macOS, ou
  le script curl de nektos/act).

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
