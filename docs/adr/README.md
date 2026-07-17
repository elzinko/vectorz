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
| 021 | megacity-boundary | **Accepté** | 🟢 vivant | ✅ statué (0035, 2026-07-15) — débloque mega-city 0016 |
| 022 | control-plane-ontology | 🚧 WIP | 🟡 **cœur du pivot, à réviser** — brique 1 « octroie des clairances », loop pull→dispatch caduc | révision de fond, fenêtre DP8 post-démo (L4) ; deviendra le document fondateur d'époque 2 |
| 023 | packaging-lifecycle | Proposé (§1 révisé par 025) | 🟢 vivant | — |
| 024 | capability-placement | **Accepté** | 🟢 vivant (E6-S2 exécuté `d200f0e`) | ✅ re-tamponné (0035, 2026-07-15) |
| 025 | monorepo-codev | Proposé (§1 révisé par 027) | 🟢 vivant | ✅ back-ref « révisé par ADR-027 » posé (0035, 2026-07-15) |
| 026 | agent-executor-seam | Proposé | 🟢 vivant, différable post-démo | ✅ bannière « révisé par ADR-029 » posée (0035, 2026-07-15) — bmad-orchestration gardé *jusqu'à E4* |
| 027 | vectorz-umbrella | Proposé | 🔵 exécuté partiellement (`name` ≠ vectorz) | re-tampon post-démo, renommage = arbitrage PO |
| 028 | lecteur-journal-moniteur | Proposé | 🟢 vivant — **mode nominal** | — |
| 029 | émancipation-bmad-archivage | **Accepté** | 🟢 **l'acte fondateur d'époque 2** | exécuter E3/E4 (fiches à créer) |
| 030 | contrat-améliorabilité | **Proposé** | 🟡 jumeau « apprenant » du contrat de supervisabilité — gel après 1ʳᵉ boucle vécue + panel manuel | 27 arbitrages PO en attente — dossier : [capture 2026-07-16](../captures/2026-07-16-note-concept-contrat-ameliorabilite.md) ; fiches 0044/0045/0046 + subtree 0061 |
| 031 | deux-axes-de-validation | **Proposé** | 🟡 sépare « le produit tourne ? » (Axe 1 = cobaye 0041) de « la méthode est bonne ? » (Axe 2 = mesureur 0044 sur tâches-repères) ; Axe 2 composé sur Axe 1, pas un nouveau système | panel + PO ; compose ADR-030 + supervisabilité + fiche 0041 |
| 032 | émission : ce qu'une carte peut / ne peut pas | **Proposé** — **v1 réfutée, révisé post-panel** | 🔴 **panel adverse 2026-07-16 : « revoir-en-profondeur »** (4 lentilles convergentes, 17 findings confirmés en repo) — 3 prémisses de la v1 tombent : Option A rejetée **sur un fait faux** (`BmadBridgeService` injecte déjà via le point d'extension natif de BMAD), l'émission **ne porte pas le fail-safe** (moitié observabilité seulement), **D12 inversé** par citation tronquée. Noyau survivant = le **shim que D12 admettait déjà** (dette de transition), pas un pattern de 1er ordre | **fork PO** : (i) re-cadrer en pattern de **transition** pour méthodes non modifiables (rien de rouvert, Option A reste canonique) vs (ii) **assumer la révision de D12** (réouverture d'un gelé). 8 arbitrages → [synthèse du panel](../captures/2026-07-16-panel-adverse-adr-032.md) |

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
