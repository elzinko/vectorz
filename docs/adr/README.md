# Registre des ADR — la feuille de lecture de l'époque 2

Ce registre dit **ce qui est vivant, ce qui se consolide, ce qui est caduc** — c'est le
point d'entrée pour « repartir propre » sans archéologie. Il est **maintenu à la main** :
toute fiche qui change un statut ADR met à jour la ligne correspondante dans la même PR.
Source : ADR-029 + panels adverses du 2026-07-15 (verdicts vérifiés fichier par fichier).

**Époques** : *époque 1* = héritage cop1/BMAD (le moteur de la méthode vivait dans le
code) ; *époque 2* = Vectorz — cop1 supervise (clairances, budget, gates, journal), la
méthode vit dans mega-city (skills, LA LOI) et le backlog natif `features/*.md`.
Bascule : ADR-029 (E1→E4, tags `epoch-1-bmad-final` / `epoch-2-post-bmad`).

## Séquence `docs/adr/` (immuable — ADR-025 §5 : bannière, jamais de suppression)

| ADR | Titre court | Statut | Verdict époque 2 | Action |
|-----|-------------|--------|------------------|--------|
| 015 | model-tiering | Accepté | 🟢 vivant | tiering → donnée du Profile à terme |
| 016 | verify-gate | Accepté | 🟢 vivant | — |
| 017 | budget-killswitch | Accepté | 🟢 vivant | `TokenBudgetService` dormant purgé (0036) |
| 018 | worktree-isolation | Accepté | 🟢 vivant | — |
| 019 | worktree-location | Accepté | 🟢 vivant | `.cop1/` = état runtime |
| 020 | dod-completion-gate | Accepté | 🟢 vivant — **central** (Rules port) | politique `global.yaml` absent : à trancher avec L4 |
| 021 | megacity-boundary | Proposé | 🟡 à statuer Accepté | fiche 0035 (débloque mega-city 0016) |
| 022 | control-plane-ontology | 🚧 WIP | 🟡 **cœur du pivot, à réviser** — brique 1 « octroie des clairances », loop pull→dispatch caduc | révision de fond, fenêtre DP8 post-démo (L4) ; deviendra le document fondateur d'époque 2 |
| 023 | packaging-lifecycle | Proposé (§1 révisé par 025) | 🟢 vivant | — |
| 024 | capability-placement | Proposé | 🔵 exécuté (E6-S2 `d200f0e`) | re-tampon Accepté (0035) |
| 025 | monorepo-codev | Proposé (§1 révisé par 027) | 🟡 back-ref manquant | bandeau « révisé par ADR-027 » (0035) |
| 026 | agent-executor-seam | Proposé | 🟢 vivant, différable post-démo | bannière « révisé par ADR-029 » (bmad-orchestration gardé *jusqu'à E4*) |
| 027 | vectorz-umbrella | Proposé | 🔵 exécuté partiellement (`name` ≠ vectorz) | re-tampon post-démo, renommage = arbitrage PO |
| 028 | lecteur-journal-moniteur | Proposé | 🟢 vivant — **mode nominal** | — |
| 029 | émancipation-bmad-archivage | **Accepté** | 🟢 **l'acte fondateur d'époque 2** | exécuter E3/E4 (fiches à créer) |

Cluster cible du pivot : **021 + 022 + 028** (+ 029 qui les opérationnalise).

## Corpus époque 1 : « planning-ADRs » de `_bmad-output/` (ADR-001→014)

Sections de `_bmad-output/planning-artifacts/architecture.md` — **hors** séquence
immuable (artefact méthode BMAD). Politique ADR-029 : les décisions encore vivantes sont
extraites vers `docs/adr/` **avant E4** ; le reste part en historique git, retrouvable au
tag `epoch-1-bmad-final`. État connu : ADR-005 (LLM Routing) supersédé de facto ;
ADR-009 (`sprint-status.yaml` source de vérité) **mort par ADR-029** — le statut natif
vit dans le front-matter des fiches.

## Backlog

Le backlog vivant est [`features/README.md`](../../features/README.md) (index régénéré,
fiches actives triées P0→P3, livrées dans `done/`). Épic directeur :
[0034](../../features/0034-mise-a-plat-post-pivot.md) ; amont :
[0035](../../features/0035-consolider-statuts-adr.md) (P0),
[0036](../../features/0036-purge-code-mort-prouve.md),
[0037](../../features/0037-arbitrage-double-writer-sprint-status.md) (P1).
