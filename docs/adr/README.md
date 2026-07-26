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
| 032 | émission : séparable comme vocabulaire | **Accepté** (panel 2026-07-16 → gravé PO 2026-07-17 via le [guide](../brancher-une-methode-existante.md)) | 🟢 l'émetteur canonique **reste dans la méthode** (D12 respecté) ; le **« sidecar »** (bmad-contracter) **installe** l'émission dans les méthodes non possédées (A′ = overlay natif via les prises `customize` de BMAD) ; wrapper d'observation = shim de transition (moitié **observabilité**, classe B annotée) | preuve empirique à venir : **0050 → 0058** (LA fiche sidecar ; ex-0048 fusionnée) — le REX amende le guide ; questions 5/8 → mini-ADR au démarrage de 0058 ; article : fiche 0049 (P3) — [synthèse panel](../captures/2026-07-16-panel-adverse-adr-032.md) |
| 033 | port-métrique-qualité-produit | **Proposé** (révisé post-panel 2026-07-22) | 🟡 la méthode **exécute l'outil**, un **tiers écrit** `quality.measured`, le **moniteur agrège** (032+028+031) ; trichotomie **règle/capacité/config** ; **DoD** fail-closed (020) ; **Q2 tranché → silo `.quality/` frère** (option B, avis archi) | **panel fait** (4 lentilles + juge) ; arbitrages PO restants : « chemins exclus », auteur≠approbateur, séquencement ; épic [0051](../../features/0051-observabilite-qualite-produit.md) (0052→0057) |
| 034 | `.mcp.json` = artefact local | **Proposé** | 🟡 le fichier de branchement Claude Code est **gitignoré** (chemins machine + dépôt public + `SUPERVISION_PER_WORKTREE` neutralisé par un fichier partagé) ; `supervision:link` **est** l'étape d'installation ; racine toujours explicite ⇒ normalisation ADR-019 intacte ; invariant anti-falsification (0050) inchangé | révise le §Proposition de la fiche [0094](../../products/mega-city/features/0094-emetteur-branche-sur-claude-code.md) ; `supervision:probe` doit viser le `.mcp.json` **local** ; porte de sortie non construite : scope local `~/.claude.json` |

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
