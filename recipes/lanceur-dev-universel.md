---
id: "20261001004228784"
title: Lancer l'app de n'importe quelle branche ou worktree avec une seule commande
makes: Une commande unique, copiée dans le projet, qui lance l'app de la branche voulue sur un port libre sans toucher à ta stack perso, et n'arrête que ce qu'elle a lancé
source: tools/launcher
composes: []
status: draft # prouvée sur vectorz et un projet-jouet jetable ; passe ready après une seconde installation réelle (muti)
home: central
created: 2026-10-01
updated: 2026-10-01
---

## En clair

Lancer l'app d'un worktree demande de connaître le dépôt, la branche, le bon script de dev, les
`node_modules` et le `.env`. Cette recette pose **une commande, la même dans tous les projets** :
`pnpm dev:branch [<branche>]`. Elle choisit un port libre, prépare l'arbre, lance l'app, imprime
l'URL, et n'arrête que ce qu'elle a elle-même lancé. Le script vit **dans le projet** (versionné),
jamais dans ton `~/.zshrc`. Ce que le projet doit dire tient en 5 lignes, et la commande refuse de
deviner quoi que ce soit.

## Ingrédients (prérequis)

- Un projet **git** (n'importe quelle stack : JS, Python, Rust, Tauri…).
- Une commande qui lance l'app et lit un port (variable `PORT` ou option), à toi de la connaître.
- Les ports de ta stack perso, à déclarer « réservés » pour que le lanceur ne les prenne jamais.

## Ustensiles (outils — CLI d'abord)

`bash` (3.2 suffit, donc le Mac tel quel), `git`, et si présents `lsof`, `curl`, `pnpm`/`npm`/`yarn`.
Aucune dépendance à installer, aucun GitHub requis : le substrat est git.

## Préliminaires (gestes manuels ⚙️)

⚙️ Remplir la déclaration du projet (5 lignes, étape 2) : c'est le seul geste qu'aucun outil ne peut
faire à ta place, parce que seul le projet sait comment il se lance et ce que « état neuf » veut dire.

## Le concept (mécanisme + schéma)

La déclaration est le **menu** du projet ; le lanceur est le **serveur** qui l'exécute sans rien
inventer. Il refuse de lancer tant que le menu est incomplet.

```
 depuis n'importe quel worktree                    projet (versionné)
 ┌─────────────────────────────┐  lit   ┌─────────────────────────────────────┐
 │ pnpm dev:branch [<branche>] │ ─────▶ │ scripts/dev-branch.conf             │
 └──────────────┬──────────────┘        │ 1 lancer · 2 arrêter · 3 état neuf  │
                │                       │ 4 isolation · 5 ports               │
                ▼                       └─────────────────────────────────────┘
   quel arbre ?   courant │ celui où la branche est déjà extraite │ arbre de run dédié
                │                                       (détaché, créé puis réutilisé)
                ▼
   .env copié (si git l'ignore) · dépendances si besoin · premier port libre non réservé
                │
                ▼
   lance dans son PROPRE groupe de process  →  imprime l'URL
   registre partagé par tous les worktrees :  .vectorz/run/<stack>/{pid,sig,port,meta,run.log,data/}
```

Deux garanties : (1) **jamais un port réservé ou occupé** ; (2) **jamais tuer un process qu'on n'a
pas lancé** (le pid est comparé à l'heure de démarrage notée au lancement, un pid recyclé n'est pas
touché). Un stack = une branche (+ une variante), il est arrêté seul.

## Exemples pour goûter (référence)

Le projet **vectorz** s'est installé lui-même : sa déclaration `scripts/dev-branch.conf` lance la
carte de la méthode (`ezk:map`), avec une variante `moniteur`. La suite de tests
`tools/launcher/test-dev-branch.sh` rejoue tout sur un projet-jouet jetable (54 contrôles).

## Les étapes (playbook)

1. **Installer** (idempotent, relançable pour mettre à jour) :
   `bash <vectorz>/tools/launcher/install.sh <racine-du-projet>` — pose `scripts/dev-branch.sh`,
   crée `scripts/dev-branch.conf` **vide** s'il n'existe pas, ajoute `dev:branch` au `package.json`
   et les lignes `.gitignore`.
2. ⚙️ **Remplir** `scripts/dev-branch.conf` : `DEV_START` (une commande qui lit `$PORT`),
   `DEV_STATE` (« sans objet — raison » est valable), `DEV_ISOLATION` (isolé **et** non isolé),
   `DEV_PORT_BASE` et `DEV_RESERVED_PORTS`. Autant de variantes `DEV_START__<nom>` que de modes
   (ex. `electron`), choisies avec `--as <nom>`.
3. **Vérifier** : `pnpm dev:branch doctor`. Sans déclaration, il liste les scripts qui
   ressemblent à un serveur de dev, **sans en choisir un**.
4. **Committer** les fichiers posés (script, déclaration, entrée `package.json`, `.gitignore`).
5. **Utiliser** : `pnpm dev:branch` (arbre courant) · `pnpm dev:branch <branche>` · `pnpm dev:branch list`
   · `pnpm dev:branch stop [<branche> | --all] [--remove]`.
6. **Mettre à jour** : relancer `install.sh` ; `install.sh --check <projet>` dit s'il y a dérive
   (code 1), utile en CI ou à l'ouverture d'un projet.

## Checklist « rien d'oublié »

- [ ] `doctor` répond « OK : la déclaration est complète »
- [ ] Les ports de ta stack perso sont dans `DEV_RESERVED_PORTS`
- [ ] Le dossier des arbres de run (`DEV_TREES_DIR`, `.worktrees` par défaut) est ignoré par git **et**
      par tes outils (lint, tests, IDE) — pour vectorz : `.claude/worktrees`, déjà exclu
- [ ] Si ton `.env` contient des clés réelles, déclare un `.env` de dev à la place (`DEV_ENV_FILES`)
- [ ] Une branche plus ancienne que l'installation est lancée avec **ta** déclaration : normal

## Fichiers de référence (entonnoir — pointer, jamais copier)

Racine : **`tools/launcher`**

- `tools/launcher/dev-branch.sh:62` — les emplacements obligatoires et le refus qui dit quoi remplir
- `tools/launcher/dev-branch.sh:100` — quel arbre (courant, extrait ailleurs, arbre de run dédié)
- `tools/launcher/dev-branch.sh:154` — le choix du port (réservés et occupés sautés)
- `tools/launcher/dev-branch.sh:137` — « est-ce bien notre process ? » (pid + heure de démarrage)
- `tools/launcher/dev-branch.sh:165` — l'arrêt par groupe de process
- `tools/launcher/install.sh:31` — installation idempotente, mise à jour, détection de dérive
- `tools/launcher/dev-branch.conf.example:1` — le gabarit des 5 emplacements
- `tools/launcher/test-dev-branch.sh:1` — la preuve sur un projet-jouet

## Statut de cette recette

Capturée le 2026-10-01 depuis la fiche `20260917162000501` (premier incrément POC), qui a absorbé
l'ancienne 0102 « ezk-testbed » et le chantier « rassembler ezk-device / ezk-preview ». Art antérieur
repris, pas copié : city-guided (`preview-pr.sh` : nom de stack, ports dynamiques, état par stack),
samplerz (`desktop-dev-server.sh` : ne jamais tuer un port occupé par un autre), muti
(`dev-electron.sh` : `.env` non transitif, bon script par mode). Limites connues du POC : pas encore
de cible « PR par numéro », pas de mode docker, pas de multi-apps, pas de verrou entre deux lancements
simultanés ; le déploiement « systématique » dans chaque projet reste à brancher.
