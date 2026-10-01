---
id: "20260917162000501"
title: "Une commande pour lancer l'app de n'importe quelle branche ou worktree"
type: feature
priority: P0
product: mega-city
labels: [test-local]
version: V0.2
epic:
status: shipped
pr: "#274"
created: 2026-09-17
---

# 20260917162000501 — Lanceur dev universel (worktree / branche), déployé par vectorz

## En clair

Une seule commande, la même dans tous les projets, lance l'app de la branche voulue depuis
n'importe quel worktree : `pnpm dev:branch [<branche>]`. Le script est copié **dans le projet**
(versionné) par vectorz, jamais dans le `~/.zshrc`. Le premier incrément (POC) est livré et marche
sur vectorz lui-même et sur un projet-jouet de test. La commande choisit un port libre, prépare
l'arbre, lance l'app, imprime l'URL, et n'arrête que ce qu'elle a lancé. Elle ne devine rien : le
projet déclare en 5 lignes comment il se lance.

## Contexte / Problème

Lancer l'app d'un projet **depuis un worktree** est pénible : connaître le dépôt, la branche, le
bon script de dev, gérer les `node_modules` par worktree et un `.env` qui ne suit pas. Sur muti,
`dev:desktop` lance la webapp vite alors que le MIDI exige `dev:electron` : facile de se tromper.
Besoin exprimé : « une commande simple et efficace qui fait tout ça, peu importe le projet, le
worktree, la branche ».

## Art antérieur (récupéré, pas réinventé)

| Source | Repris dans le POC | Laissé en « Suite » |
|---|---|---|
| city-guided `preview-pr.sh` (1 615 lignes) | nom de stack = branche nettoyée + court hash (`feat/foo` ≠ `feat-foo`) · ports dynamiques « premier libre à partir d'une base », ports réservés jamais pris · un dossier d'état par stack (port, pid) · arrêt ciblé par groupe de process · dépendances seulement si le lockfile est plus récent | base Postgres isolée, mode docker, cible `pr <n>`, multi-apps (`dev-all-*`) |
| samplerz `desktop-dev-server.sh` (leçon Codex #365) | ne jamais tuer un port occupé par un autre : refus net · relancer le même stack = le réutiliser | — |
| muti `dev-electron.sh` | `.env` non transitif : copié depuis l'arbre principal · le bon script diffère par mode : variantes nommées `--as` | l'assistant mobile `preview-pr.mjs` (branche `feat/preview-pr-mobile-wizard`) |

## Décisions de grooming

Prises en ligne, réversibles, sans ADR (aucune n'engage un autre produit tant que le contrat des
5 emplacements reste le même). Le détail du mécanisme est dans la recette
[lanceur-dev-universel](../../recipes/lanceur-dev-universel.md).

| Question de la fiche | Décision |
|---|---|
| Où vit la commande | `scripts/dev-branch.sh` copié dans le projet + entrée `dev:branch` ; source de vérité `tools/launcher/` |
| Langage | bash pur, zéro dépendance : marche pour un projet JS, Python ou Rust ; l'art antérieur est en bash |
| Déclaration par projet | `scripts/dev-branch.conf`, 5 emplacements : lancer · arrêter · état de départ · isolation · ports. Vide = refus qui dit quoi remplir |
| Détection du bon script (Electron / web / mobile) | **déclaré, pas détecté** : `DEV_START` + variantes `DEV_START__<nom>` choisies avec `--as`. `doctor` liste des candidats sans en choisir un |
| Stratégie worktree | arbre courant par défaut ; sinon l'arbre où la branche est extraite ; sinon un arbre de run dédié, détaché, créé dans `DEV_TREES_DIR` puis mis à jour s'il est propre |
| `node_modules` | installés dans l'arbre de run (store pnpm partagé) seulement s'ils manquent ou si le lockfile est plus récent : le coût tombe au premier lancement |
| `.env` | copié depuis l'arbre principal s'il manque **et** que git l'ignore ; jamais écrasé, jamais affiché |
| Ports | premier libre à partir d'une base, hors réservés et hors stacks actifs. `--port` occupé = refus (code 2). Jamais de kill d'un process étranger |
| Données de test perso | protégées par construction : ports perso réservés, état par stack dans `VZ_STATE_DIR`, et l'état de départ doit être déclaré |
| Déploiement vectorz | `tools/launcher/install.sh <projet>` idempotent, `--check` signale la dérive, la déclaration n'est jamais écrasée |
| Un skill ? | pas pour le POC : un skill coûte 7 fichiers de couplage et des cartes à régénérer. Recette indexée + outil ; le skill viendra avec les délégations (Suite) |

## Critères d'acceptation (POC)

- [x] **Une commande, depuis n'importe quel worktree.** `pnpm dev:branch [<branche>]` lance l'arbre courant, l'arbre où la branche est extraite, ou un arbre de run dédié. Preuve : tests (autre worktree, autre branche) + vectorz (`origin/main` sur le port 4174 pendant que la branche courante tourne sur 4173).
- [x] **Installée dans le projet, déployée par vectorz.** `tools/launcher/install.sh` est idempotent, met à jour, `--check` signale la dérive, ne touche jamais à la déclaration. vectorz s'est installé lui-même ; un test garde sa copie à l'identique de la source.
- [x] **Ne devine rien** *(0102 AC2)*. Déclaration vide : refus qui dit quoi remplir, aucun arbre créé. `doctor` propose des candidats sans choisir.
- [x] **État de départ déclaré, projet-local** *(0102 AC4)*. Vide refusé ; « sans objet — raison » accepté ; le lanceur n'impose aucune politique.
- [x] **Ports et données perso protégés.** Ports réservés jamais pris, ports occupés sautés, `--port` occupé refusé, process étranger vivant après `stop` et `stop --all`.
- [x] **Arrêt propre et ciblé.** Seul le stack visé s'arrête (enfants compris), un pid recyclé n'est jamais tué, `--remove` refuse de jeter un arbre modifié, le nettoyage déclaré `DEV_STOP` est joué.
- [x] **Autonome** *(0102 AC1)*. Marche dans un projet sans autre skill ezk, sans backlog, sans GitHub : le projet-jouet n'a que git et la déclaration.
- [x] **Branché dans la gate.** La suite tourne dans `pnpm test:scripts`, pas seulement à la main.
- [ ] Le reste est en « Suite » ci-dessous (pas de cible PR, pas de docker, délégations des autres skills, déploiement automatique).

## Comment vérifier

```
bash tools/launcher/test-dev-branch.sh       # 54 contrôles sur un projet-jouet jetable, doit finir « TOUT VERT »
pnpm dev:branch doctor                       # la déclaration de vectorz est complète
pnpm dev:branch                              # imprime une URL ; curl dessus répond 200 ; la page est « ezk:map — les cartes »
pnpm dev:branch origin/main                  # crée .claude/worktrees/run-origin-main-…, autre port, en parallèle
pnpm dev:branch list                         # montre les deux stacks
pnpm dev:branch stop origin/main --remove    # ferme son port, supprime son arbre de run
pnpm dev:branch stop                         # ferme l'autre ; plus rien n'écoute sur 4173/4174
```

Preuve rejouée le 2026-10-01 sur vectorz : HTTP 200 sur les deux ports, `list` à deux stacks, puis
ports fermés, aucun arbre `run-*` restant, `list` vide. La variante `--as moniteur` (vite) répond
aussi 200 et s'arrête de même.

## Suite (hors POC)

- **Cible `pr <n>` en git pur** (`git fetch origin pull/N/head`) et **mode docker** (`DEV_STOP` + compose `-p`) : prouver sur samplerz et city-guided *(0102 AC3)*.
- **Délégations** *(0102 AC5)* : `ezk-preview` cas B perd son heuristique de ports 3000/5173/… et lit la déclaration ; `ezk-pr run`, `ezk-sprint` étape 6 / `ezk-qa`, `ezk-scout` (banc isolé, voir son SKILL.md) et `ezk-device` (surface téléphone) appellent `pnpm dev:branch`. Idée PO 2026-08-25 : une commande à modes web / device / desktop.
- **Déploiement systématique** : brancher `install.sh --check` dans l'ouverture d'un projet par vectorz (`ezk-readme init`, `ezk-pr init` ou `lawgiver`), et propager les mises à jour.
- **Installations réelles** : muti (`dev:electron` en variante `electron`), samplerz, city-guided. La recette passe `ready` à la première.
- **Multi-apps** : API + web + admin ensemble, et le daemon du Moniteur (4242) lancé avec lui.
- **Verrou entre deux lancements simultanés** (risque faible : ils pourraient viser le même port).
- **Carte vivante** *(0102 AC6)* : `method-map`, `skills/README`, ADR si un skill naît.
- Limite connue : une branche antérieure à ce POC ne connaît pas `EZK_MAP_NO_OPEN` ; sa carte ouvre alors le navigateur d'elle-même.

## Absorbe (tri du 2026-09-30) — critères intégrés

- [`0102`](0102-ezk-testbed-brique-boot-env-test.md) — ezk-testbed : AC1, AC2, AC4 livrés dans le POC ; AC3, AC5, AC6 en « Suite ». Sa séquence « adaptateur samplerz d'abord » tombe : la brique se prouve ici sur vectorz.
- [`20260824163426298`](20260824163426298_consolider-device-preview-testbed.md) — consolidation device / preview / testbed : le **cœur** est ce lanceur ; `ezk-preview` (URL partageable) et `ezk-device` (téléphone) deviennent des surfaces qui le consomment, en « Suite ». Principe repris : git est le substrat, GitHub un raccourci optionnel (le lanceur n'appelle jamais `gh`).

## Ce que ça veut dire pour toi

Tu peux lancer n'importe quelle branche de vectorz avec `pnpm dev:branch <branche>` dès le merge.
Pour un autre projet, une commande l'installe (`install.sh`), puis tu remplis 5 lignes. Il reste à
décider quel projet réel installer en premier (muti est le candidat naturel).
