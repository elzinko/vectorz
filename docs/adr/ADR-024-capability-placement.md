# ADR-024 — Placement des capabilities (Docker & co) : skill portable, pas code du superviseur

Statut : **Proposé** (2026-07-13) — issu d'une session `/architecture`. **Corollaire d'ADR-022.**
Voir aussi : ADR-022 (ontologie control plane), ADR-018 (worktree-isolation), fiche E6-S2 (ContainerRuntimePort).

## Contexte

En voulant donner à cop1 la capacité de **piloter Docker** (lancer une stack de test, monitorer,
détruire), deux réflexes ont été essayés puis remis en question :
1. ajouter des outils `start_container`/`stop_container`/`container_status` dans `toolCatalog.ts`
   (surface **superviseur**) — implémenté, puis reverté ;
2. réutiliser le port `ContainerRuntimePort` + `DockerDesktopAdapter` de `packages/app` (E6-S2).

Rappel ADR-022 : le **superviseur (brique 1) est aveugle au métier**. `toolCatalog` expose ses
**verbes-politique** — chacun porte un **invariant** que la CLI brute n'exprime pas :
`invoke_bmad_command` (plafond de ré-entrance), `commit_anchor` (« un seul commit par workflow » +
trailer + télémétrie), `create/cleanup_worktree` (cycle de vie tracké), `remaining_budget`
(comptabilité tokens). `GitDriver` n'est **pas** un wrapper git pour les agents — c'est la **couture
de test** de `commit_anchor` ; les agents dev, eux, ont déjà `git` brut via `Bash`.

Trois constats :
- « Lancer une stack de test » **ne porte aucun invariant superviseur** — c'est `docker compose up`
  avec un `emit()` autour. Générique, pas politique.
- Les agents dev ont **déjà `Bash`** → **déjà `docker` via le socket**. La capacité existe déjà pour eux.
- La capacité doit servir **aussi** `ezk-product-builder` (skill Desktop) et l'interactif, qui **n'ont
  aucun accès au code cop1**. Un outil `toolCatalog` ne sert **que** cop1.

## Décision

**Une capability vit à l'étage le moins cérémonieux qui fournit encore la garantie requise.**

```
Bash brut  <  Skill  <  Commande  <  outil toolCatalog (code)
 (0 code)    (portable)  (paramétré)   (invariant imposé + télémétrie)
```

**Test décisif** — la capability porte-t-elle un invariant que le *superviseur* doit **garantir** ?
- **Non** (cas courant Docker : tester / monitorer / détruire) → **Skill** (`ezk-docker`, mega-city),
  adossé au socket/CLI. Portable **cop1 + ezk-product-builder + interactif**.
- **Oui** (ex. « toute story obtient une stack isolée, **garantie détruite** même au crash, comptée au
  budget, avec télémétrie ») → outil `toolCatalog` dédié, **miroir de `cleanup_worktree`** — mais
  **seulement le wrapper d'enforcement**, et via un ADR dédié.

**Corollaire d'ADR-022** : le superviseur reste aveugle au métier **et** aux capacités d'exécution.
Docker est une capacité des **rôles (6)**, fournie comme **skill** (mega-city = fournisseur de skills/règles).

## Options considérées

| Option | Réutilisable | Porte un invariant | Verdict |
|---|---|:--:|---|
| **A.** Outils `toolCatalog` (`start/stop/status`) | cop1 seul | ❌ | Sur-ingénierie, mauvais étage — **reverté** |
| **B.** Port hexagonal `ContainerRuntimePort` + adaptateur (E6-S2) | cop1 seul | ❌ | Abstraction lourde + adaptateur **cassé** (HTTP `localhost` sans dispatcher socket) |
| **C.** Skill `ezk-docker` adossé socket/CLI | **tous les agents** | n/a (procédure) | ✅ **Retenu** pour le cas courant |
| **D.** Bash brut | non | ❌ | OK one-shot, pas pour du récurrent partagé |

## Conséquences / hors-scope

- ✅ Docker devient une **capacité transverse** (skill) au lieu d'un couplage cop1.
- ⚠️ Le **blast radius** est géré par les **conventions du skill** (préfixe de projet sur les stacks de
  test, teardown obligatoire, jamais de `prune` global ni de suppression de volumes non-préfixés),
  pas par le type-système. Acceptable pour le contexte.
- 🔧 `packages/app` `ContainerRuntimePort` + `DockerDesktopAdapter` (E6-S2, `ready-for-dev`) : **stub
  non câblé** au socket (`fetch('http://localhost/...')` sans dispatcher Unix). Le skill le rend
  probablement **caduc** → à réparer **ou supprimer** (ticket séparé).
- 🔁 À revisiter **si** cop1 formalise un « lifecycle de stack de test supervisé » (là seulement,
  option A justifiée, avec le vrai invariant).
- **Hors-scope** : l'implémentation du skill (faite dans mega-city, `skills/ezk-docker/`) ; le sort de E6-S2.
