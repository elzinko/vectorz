# Backlog features & bugs — vectorz (racine)

> Index auto-généré (`regen-backlog.sh` mega-city, via `/ezk-backlog regen`) — **ne pas éditer à la main**. Source de vérité = le front-matter de chaque fiche.
> 1 fiche / sujet · 1 PR / feature · backlog commité sur `main`. Statuts : 💡 idea · 🔴 todo · 🟠 in-progress · ⛔ blocked · ✅ shipped.

| # | Titre | Type | Prio | Épic | Statut | PR |
|---|-------|------|------|------|--------|----|
| 0035 | Consolider les statuts ADR (re-tampons sans gate démo — L4a de 0034) | chore | P0 | 0034 | ✅ shipped | #12 |
| 0001 | Story B — lanceur de run + mission-control live | feature | P1 |  | ✅ shipped | #24 |
| 0002 | Fix emplacement du worktree en session concurrente | bug | P1 |  | ✅ shipped | #26 |
| 0013 | DoDCheck port + registry + refactor du seam de transition (POC DoD automatisée) | feature | P1 |  | ✅ shipped | #33 |
| 0021 | câbler la boucle blocage (services existants) — l'escalade cesse d'être terminale | feature | P1 |  | ✅ shipped | #50 |
| 0027 | Validateur de journal de supervisabilité — l'invariant devient exécutable | feature | P1 |  | ✅ shipped | #62 |
| 0030 | MVP démo Desktop — un manager supervisé de bout en bout (mode moniteur pur) | feature | P1 |  | 🟠 in-progress |  |
| 0031 | Lecteur de journal .supervision/runs/ dans la mission-control (mode moniteur) | feature | P1 |  | ✅ shipped | #2 |
| 0032 | cop1 start ignore daemon.port de cop1.config.yaml (seul --port compte) | bug | P1 |  | ✅ shipped | #15 |
| 0033 | Échec silencieux du daemon quand ram_budget_* dépasse la RAM physique | bug | P1 |  | ✅ shipped | #16 |
| 0036 | Purge du code mort prouvé + rescope 0022 AC3 (sous-ensemble sûr de L8) | chore | P1 | 0034 | ✅ shipped | #13 |
| 0037 | Arbitrage double-writer sprint-status.yaml (porter la décision D7) | chore | P1 | 0034 | ✅ shipped | #14 |
| 0041 | Cobaye — banc de test rapide (manuel + e2e Pareto) pour sécuriser les devs | chore | P1 |  | 🔴 todo |  |
| 0044 | Mesureur d'outcomes métier + script d'append — l'évaluateur d'abord (contrat d'améliorabilité, MVP A) | chore | P1 |  | 🔴 todo |  |
| 0050 | Canal de release + pastille de MAJ — dogfooding sûr (version figée par squash-merge, adoption aux jalons upgrade_ok) | feature | P1 |  | 🔴 todo |  |
| 0052 | Socle vertical — port de métrique + 1er adaptateur (couverture) + remontée build PR + silo | feature | P1 | 0051 | 🔴 todo |  |
| 0059 | Moniteur — une carte par run, lisible d'un coup d'œil (état, gate en cours, projet, ordre) | feature | P1 |  | 🔴 todo |  |
| 0061 | La projection jette la méthode et le siège — impossible de savoir QUI a produit un run, ni avec quelle version | bug | P1 |  | 🔴 todo |  |
| 0003 | E2E Playwright — panneau auth (🟢 + modèle) | chore | P2 |  | ✅ shipped | #34 |
| 0004 | Sanitiser/tronquer le champ error de /api/auth/check | bug | P2 |  | ✅ shipped | #29 |
| 0006 | V1.1 — DoD automatisée, iamthelaw et enforcement budget | feature | P2 |  | ✅ shipped | #32 |
| 0008 | Proxy Vite cible :3000 alors que le daemon écoute :4242 | bug | P2 |  | ✅ shipped | #28 |
| 0009 | Durcir les appels git worktree (execFileSync, anti-injection shell) | refactor | P2 |  | ✅ shipped | #30 |
| 0014 | iamthelaw enforced — Rule.check → DoDCheck, advisory dans le prompt | feature | P2 |  | ✅ shipped | #36 |
| 0015 | StoryBudget par story + câblage DoDLimiter (enforcement budget fin) | feature | P2 |  | ✅ shipped | #38 |
| 0020 | AgentSessionPort — prouver l'indépendance à l'agent (StubExecutor, puis LLM local) | feature | P2 | 0034 | 🔴 todo |  |
| 0022 | mission-control — afficher ce qui est déjà collecté (heure, durée, agent, historique, $) | feature | P2 |  | 🔴 todo |  |
| 0023 | exposer le model-tiering dans cop1.config.yaml (promesse ADR-015) | chore | P2 |  | ✅ shipped | #52 |
| 0024 | résorber la périphérie pré-pivot (ceremony-engine, quality-intelligence) + acter ADR-021/022 | refactor | P2 | 0034 | 🔴 todo |  |
| 0025 | Article « contrat de supervisabilité » — lecture de première main + article publié dans la doc | feature | P2 |  | ✅ shipped | #57 |
| 0026 | Article « fenêtres de mise à jour » — l'éligibilité de migration déclarée par le travailleur | feature | P2 |  | ✅ shipped | #59 |
| 0038 | E3 — Pilote natif complet (stories front-matter, exécuteur générique, gate zéro-BMAD) | feature | P2 | 0034 | ⛔ blocked |  |
| 0039 | E4 — Retrait de BMAD (relogement, suppression, purge) + tags d'époque | refactor | P2 | 0034 | ⛔ blocked |  |
| 0040 | L2 — Durcir les garde-fous CI (step boundary nommé + allowlist SDK) | chore | P2 | 0034 | 🔴 todo |  |
| 0045 | Moisson du pipeline d'amélioration d'époque 1 (Epics 9+12) — extraire la sémantique avant qu'elle ne se disperse | chore | P2 |  | 🔴 todo |  |
| 0060 | Les deux docs d'installation ont décroché de main (checklist démo + guide web UI) | bug | P2 |  | 🔴 todo |  |
| 0005 | Résorber les warnings biome | chore | P3 |  | ✅ shipped | #45 |
| 0007 | Format de session log + discipline de commit (anchor réel) | chore | P3 |  | 🔴 todo |  |
| 0010 | Heartbeat mission-control — setInterval recréé à chaque frame SSE | refactor | P3 |  | ✅ shipped | #40 |
| 0011 | Buffer `frames` non borné dans la mission-control | refactor | P3 |  | ✅ shipped | #41 |
| 0012 | Rafraîchir brownfield-snapshot.md (ancien emplacement worktree agent/) | chore | P3 |  | ✅ shipped | #43 |
| 0016 | Surfaçage des violations DoD dans la mission-control (web) | feature | P3 |  | ✅ shipped | #44 |
| 0017 | E2E Playwright — dark-mode cobaye (post-FEAT-S1) | chore | P3 |  | ⛔ blocked |  |
| 0018 | Câbler DoDLimiter (N rejets DoD → blocked + escalade) | feature | P3 | 0034 | ⛔ blocked |  |
| 0019 | Rendre `pnpm typecheck` robuste sur état stale (TS6310) | chore | P3 |  | ✅ shipped | #49 |
| 0028 | Policy de siège — l'auto-continue configurable sur signaux typés | feature | P3 |  | 🔴 todo |  |
| 0029 | Contrat de supervisabilité v0.2 — les différés du gel v0.1 (multi-piste, anti-surplace) | chore | P3 |  | 🔴 todo |  |
| 0046 | Différés du contrat d'améliorabilité — parking gated « après boucles réelles » | chore | P3 |  | 🔴 todo |  |

## 🧭 Épics (jamais tirables — tirer leurs enfants ready, ADR-0017)

| # | Titre | Type | Prio | Épic | Statut | PR |
|---|-------|------|------|------|--------|----|
| 0034 | Mise à plat post-pivot — aligner Vectorz/cop1 sur ADR-021→028 (épic) | epic | P0 |  | 🔴 todo |  |
| 0051 | Observabilité qualité produit — mesurer, historiser et analyser la qualité des logiciels fabriqués (par PR) (épic) | epic | P1 |  | 🔴 todo |  |

## 💡 Idées (non groomées)

| # | Titre | Type | Prio | Épic | Statut | PR |
|---|-------|------|------|------|--------|----|
| 0043 | article — « Self-hosting : le jour où cop1 développera cop1 » (dogfooding → self-hosting → RSI) | feature | P2 |  | 💡 idea |  |
| 0053 | Gate DoD adossé à une métrique — bloquer une PR si un seuil qualité n'est pas tenu | feature | P2 | 0051 | 💡 idea |  |
| 0054 | Catalogue d'adaptateurs — ajouter un outil de métrique sans réinventer la roue | feature | P2 | 0051 | 💡 idea |  |
| 0055 | KPI agrégés — rollups commit → PR → sprint → version depuis le silo | feature | P2 | 0051 | 💡 idea |  |
| 0056 | Visualisation — onglet « qualité par PR » dans mission-control | feature | P2 | 0051 | 💡 idea |  |
| 0058 | Rapport qualité de PR — les métriques et le résumé du test visibles dans chaque PR | feature | P2 | 0051 | 💡 idea |  |
| 0062 | Onglet « Projets » dans le Moniteur — portefeuille par projet (méthode+version, localisation, statut) cliquable vers son activité | feature | P2 |  | 💡 idea |  |
| 0063 | Ancrer un projet depuis le Moniteur — bouton « ajouter projet » + sélection de dossier + install via le daemon (2 modes) | feature | P2 |  | 💡 idea |  |
| 0042 | Inventaire — idées historiques cop1 réutilisables dans le paradigme vectorz (icebox) | feature | P3 |  | 💡 idea |  |
| 0047 | Migration réflexive — quand le produit se teste lui-même, la migration devient un problème réflexif (→ ADR + article) | feature | P3 |  | 💡 idea |  |
| 0049 | article — « Brancher une méthode qu'on ne possède pas : le pattern sidecar » (ADR-032, cas BMAD) | feature | P3 |  | 💡 idea |  |
| 0057 | Agent d'analyse de la méthode — lit les KPI et propose des améliorations (gate PO) [nord/parking] | feature | P3 | 0051 | 💡 idea |  |

> Livrées (`done/`) : 0001, 0002, 0003, 0004, 0005, 0006, 0008, 0009, 0010, 0011, 0012, 0013, 0014, 0015, 0016, 0019, 0021, 0023, 0025, 0026, 0027, 0031, 0032, 0033, 0035, 0036, 0037.
