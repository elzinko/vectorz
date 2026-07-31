# Backlog — mega-city

> Index auto-généré (`regen-backlog.sh` mega-city, via `/ezk-backlog regen`) — **ne pas éditer à la main**. Source de vérité = le front-matter de chaque fiche.
> 1 fiche / sujet · 1 PR / feature · backlog commité sur `main`. Statuts : 💡 idea · 🔴 todo · 🟠 in-progress · ⛔ blocked · ✅ shipped.

> 📋 Séquence décidée (curée, hors index) : [PLAN.md](PLAN.md).

| # | Titre | Type | Prio | Épic | Produit | Statut | PR |
|---|-------|------|------|------|---------|--------|----|
| 0035 | Consolider les statuts ADR (re-tampons sans gate démo — L4a de 0034) | chore | P0 | 0034 | vectorz | ✅ shipped | #12 |
| 0064 | Une seule liste de features pour tout le monorepo (champ `product:`) — la double liste coûte plus qu'elle ne rapporte | refactor | P0 |  | vectorz | ✅ shipped | #66 |
| 0083 | SPIKE — où atterrit le journal quand une méthode tourne dans un worktree ? (mesurer cwd et CLAUDE_PROJECT_DIR) | chore | P0 |  | mega-city | ✅ shipped | #45 |
| 0084 | Le calcul de quiescence mélange deux échelles (propreté par dossier, worktrees par dépôt) — prédicat sans sémantique | bug | P0 |  | mega-city | ✅ shipped | #48 |
| 0085 | Redéfinir ce que compte la quiescence — les sous-runs de l'orchestrateur, pas tout worktree git du dépôt | chore | P0 |  | mega-city | ✅ shipped | #47 |
| 0086 | Le journal remonte à l'arbre principal + le serveur annonce où il écrit (fin de la perte silencieuse en worktree) | feature | P0 |  | mega-city | ✅ shipped | #46 |
| 0089 | Ordonnancement — brancher PLAN.md sur l'intake (l'ordre suit la priorité, pas l'inverse) | feature | P0 |  | mega-city | ✅ shipped | #52 |
| 0094 | Brancher l'émetteur sur Claude Code (.mcp.json du dépôt) — le dogfooding n'émet rien aujourd'hui | feature | P0 |  | mega-city | ✅ shipped | #54 |
| 0097 | Connecter l'ordre du plan à la vue cross-backlog — « la suite, toutes listes confondues » suit PLAN.md | feature | P0 |  | mega-city | ✅ shipped | #53 |
| 0105 | Bug dogfood — Moniteur « Silence prolongé » / produit inutilisable après run_start seul | bug | P0 |  | mega-city | 🔴 todo |  |
| 0106 | lawgiver bind — cap claude-code (MVP déterministe) | feature | P0 |  | mega-city | ✅ shipped | local (squash-merge) |
| 0115 | bind — fusion non-destructive (intention + bloc managé) au lieu d'écraser | feature | P0 |  | mega-city | ✅ shipped | local (squash-merge) |
| 0122 | cap global — matérialiser un profil dans ~/.claude (remplace install.sh) | feature | P0 |  | mega-city | ✅ shipped | local (squash-merge) |
| 0168 | Run orphelin = verrou sans clé — un run jamais clôturé bloque toute émission, sans action de déblocage | bug | P0 |  | mega-city | ✅ shipped | #76 |
| 0001 | Story B — lanceur de run + mission-control live | feature | P1 |  | vectorz | ✅ shipped | #24 |
| 0002 | Fix emplacement du worktree en session concurrente | bug | P1 |  | vectorz | ✅ shipped | #26 |
| 0013 | DoDCheck port + registry + refactor du seam de transition (POC DoD automatisée) | feature | P1 |  | vectorz | ✅ shipped | #33 |
| 0021 | câbler la boucle blocage (services existants) — l'escalade cesse d'être terminale | feature | P1 |  | vectorz | ✅ shipped | #50 |
| 0027 | Validateur de journal de supervisabilité — l'invariant devient exécutable | feature | P1 |  | vectorz | ✅ shipped | #62 |
| 0030 | MVP démo Desktop — un manager supervisé de bout en bout (mode moniteur pur) | feature | P1 |  | vectorz | 🟠 in-progress |  |
| 0031 | Lecteur de journal .supervision/runs/ dans la mission-control (mode moniteur) | feature | P1 |  | vectorz | ✅ shipped | #2 |
| 0032 | cop1 start ignore daemon.port de cop1.config.yaml (seul --port compte) | bug | P1 |  | vectorz | ✅ shipped | #15 |
| 0033 | Échec silencieux du daemon quand ram_budget_* dépasse la RAM physique | bug | P1 |  | vectorz | ✅ shipped | #16 |
| 0036 | Purge du code mort prouvé + rescope 0022 AC3 (sous-ensemble sûr de L8) | chore | P1 | 0034 | vectorz | ✅ shipped | #13 |
| 0037 | Arbitrage double-writer sprint-status.yaml (porter la décision D7) | chore | P1 | 0034 | vectorz | ✅ shipped | #14 |
| 0041 | Cobaye — banc de test rapide (manuel + e2e Pareto) pour sécuriser les devs | chore | P1 |  | vectorz | 🔴 todo |  |
| 0044 | Mesureur d'outcomes métier + script d'append — l'évaluateur d'abord (contrat d'améliorabilité, MVP A) | chore | P1 |  | vectorz | 🔴 todo |  |
| 0050 | Canal de release + pastille de MAJ — dogfooding sûr (version figée par squash-merge, adoption aux jalons upgrade_ok) | feature | P1 |  | vectorz | 🔴 todo |  |
| 0052 | Socle vertical — port de métrique + 1er adaptateur (couverture) + remontée build PR + silo | feature | P1 | 0051 | vectorz | 🔴 todo |  |
| 0059 | Moniteur — une carte par run, lisible d'un coup d'œil (état, gate en cours, projet, ordre) | feature | P1 |  | vectorz | ✅ shipped | #50 |
| 0061 | La projection jette la méthode et le siège — impossible de savoir QUI a produit un run, ni avec quelle version | bug | P1 |  | vectorz | ✅ shipped | #50 |
| 0069 | article — émettre des events en restant fidèle au fonctionnement de Claude Desktop/Code | feature | P1 |  | mega-city | 🔴 todo |  |
| 0070 | ezk-diagram — publier une explication compréhensible à côté du diagramme (README) | feature | P1 |  | mega-city | ✅ shipped | #33 |
| 0071 | ezk-backlog review — sanity check global du backlog (validité, doublons, ordre, staleness) | feature | P1 |  | mega-city | ✅ shipped | #26 |
| 0076 | Hygiène de branches post-squash — classification déterministe absorbée/réelle + suppression aux deux chemins de merge | feature | P1 |  | mega-city | ✅ shipped | #31 |
| 0077 | Kit émetteur — hooks Claude Code classe A (émission déterministe) | feature | P1 |  | mega-city | 🔴 todo |  |
| 0079 | Lisibilité des artefacts humains — graver la règle (élargie des restitutions PO à tout artefact lu par un humain) | feature | P1 |  | mega-city | ✅ shipped | #74 |
| 0082 | Registre de supervision versionné côté vectorz — QUOI + MÉTHODE, jamais OÙ (modèle à deux clés) | feature | P1 |  | vectorz | ✅ shipped | #70 |
| 0095 | ezk-product-builder n'émet aucun événement — ses checkpoints inter-sprints sont invisibles au Moniteur | bug | P1 |  | mega-city | ✅ shipped | #55 |
| 0102 | ezk-testbed — démarrer un environnement de test isolé (PR, branche ou local) : une brique autonome, pas un chapitre d'ezk-pr-pilot | feature | P1 |  | mega-city | ⛔ blocked |  |
| 0103 | Les méthodes envoient un heartbeat — le Moniteur ne crie plus « silence » à tort | feature | P1 |  | mega-city | ✅ shipped |  |
| 0104 | Kit d’analyse de session — journal + Moniteur + transcript Claude Code en un rapport | feature | P1 |  | mega-city | ✅ shipped |  |
| 0107 | lawgiver capture — flywheel | feature | P1 |  | mega-city | ✅ shipped | local (squash-merge) |
| 0108 | cap claude-desktop — continuer à charger les skills | feature | P1 |  | mega-city | ✅ shipped | #6 |
| 0109 | migrer ezk-commits vers skills/ | chore | P1 |  | mega-city | ✅ shipped | local (squash-merge) |
| 0111 | migrer les rulesets iamthelaw vers rules/ + bundles/ (périmètre complet) | chore | P1 |  | mega-city | ✅ shipped | local (squash-merge) |
| 0118 | capture — câbler une interaction/competence capturée dans le frontmatter d'un agent | feature | P1 |  | mega-city | ✅ shipped | local (squash-merge) |
| 0123 | coquille I/O — mode link vs copy (porter le symlink live-update de claude-skills) | feature | P1 |  | mega-city | ✅ shipped | local (squash-merge) |
| 0124 | migrer + étendre ezk-design-system (design system UI/UX consultable + requêtable) | feature | P1 |  | mega-city | ✅ shipped | local (squash-merge) |
| 0129 | Migration claude-skills → mega-city — finir le strangler-fig (skills + agents restants → switchover) | chore | P1 |  | mega-city | ✅ shipped | local (squash-merge) |
| 0130 | cap global mode link — symlinker AUSSI les agents (pas seulement les skills) | bug | P1 |  | mega-city | ✅ shipped | local (squash-merge) |
| 0132 | ezk-pr-pilot : orchestrateur du test-puis-merge d'un stock de PRs (+ convention Validation) | feature | P1 |  | mega-city | ✅ shipped | merge local feat/skill-ezk-pr-pilot |
| 0141 | agent ezk-pm — le décideur product-owner (jour ET nuit) | feature | P1 |  | mega-city | ✅ shipped | local (squash-merge) |
| 0142 | flywheel cassé — capture écrit des skills/rules que loadCatalog ne relit jamais | bug | P1 |  | mega-city | ✅ shipped | local (squash-merge) |
| 0144 | frontmatter tuning des agents — model, effort, isolation | chore | P1 |  | mega-city | ✅ shipped | local (squash-merge) |
| 0145 | ezk-product-builder — mode --checkpoints ask\|auto (décisions recommandées par défaut) | feature | P1 |  | mega-city | ✅ shipped | local (squash-merge) |
| 0149 | formaliser la composition inter-skills (composes) | feature | P1 |  | mega-city | 🔴 todo |  |
| 0153 | ezk-article — skill d'écriture d'articles techniques vulgarisés (persona + panel de relecteurs frais) | feature | P1 |  | mega-city | ✅ shipped | #32 |
| 0154 | Kit émetteur de supervisabilité — mega-city devient la première méthode conforme au contrat | feature | P1 |  | mega-city | ✅ shipped | #35 |
| 0156 | ezk-marketing — orchestrateur de promotion produit (articles d'épopée, canaux, vidéos) | feature | P1 |  | mega-city | 🔴 todo |  |
| 0159 | ezk-ci — surveiller et plafonner la consommation GitHub Actions (repos privés) | feature | P1 |  | mega-city | ✅ shipped | #34 |
| 0160 | ezk-backlog groom/ready — promouvoir une idea vers Definition of Ready (gate) | feature | P1 |  | mega-city | ✅ shipped | #26 |
| 0164 | vz-product-builder — product-builder autonome à corpus de reviewers (overlay, n'écrase pas ezk-*) | feature | P1 |  | mega-city | 🟠 in-progress |  |
| 0165 | Contrat d'améliorabilité v0.1 — texte, registre des surfaces, kit émetteur, extension ezk-backlog, première boucle fermée (MVP B) | feature | P1 |  | mega-city | 🔴 todo |  |
| 0169 | Explorateur LLM par PR — parcourir l'app pour trouver les trous, et proposer la fiche | feature | P1 |  | mega-city | 🔴 todo |  |
| 0173 | Méthode ezk — 3 bandes + naming (ezk-pr, caps, archive=capacité) | feature | P1 |  | mega-city | 🟠 in-progress | #72 |
| 0003 | E2E Playwright — panneau auth (🟢 + modèle) | chore | P2 |  | vectorz | ✅ shipped | #34 |
| 0004 | Sanitiser/tronquer le champ error de /api/auth/check | bug | P2 |  | vectorz | ✅ shipped | #29 |
| 0006 | V1.1 — DoD automatisée, iamthelaw et enforcement budget | feature | P2 |  | vectorz | ✅ shipped | #32 |
| 0008 | Proxy Vite cible :3000 alors que le daemon écoute :4242 | bug | P2 |  | vectorz | ✅ shipped | #28 |
| 0009 | Durcir les appels git worktree (execFileSync, anti-injection shell) | refactor | P2 |  | vectorz | ✅ shipped | #30 |
| 0014 | iamthelaw enforced — Rule.check → DoDCheck, advisory dans le prompt | feature | P2 |  | vectorz | ✅ shipped | #36 |
| 0015 | StoryBudget par story + câblage DoDLimiter (enforcement budget fin) | feature | P2 |  | vectorz | ✅ shipped | #38 |
| 0020 | AgentSessionPort — prouver l'indépendance à l'agent (StubExecutor, puis LLM local) | feature | P2 | 0034 | vectorz | 🔴 todo |  |
| 0022 | mission-control — afficher ce qui est déjà collecté (heure, durée, agent, historique, $) | feature | P2 |  | vectorz | 🔴 todo |  |
| 0023 | exposer le model-tiering dans cop1.config.yaml (promesse ADR-015) | chore | P2 |  | vectorz | ✅ shipped | #52 |
| 0024 | résorber la périphérie pré-pivot (ceremony-engine, quality-intelligence) + acter ADR-021/022 | refactor | P2 | 0034 | vectorz | 🔴 todo |  |
| 0025 | Article « contrat de supervisabilité » — lecture de première main + article publié dans la doc | feature | P2 |  | vectorz | ✅ shipped | #57 |
| 0026 | Article « fenêtres de mise à jour » — l'éligibilité de migration déclarée par le travailleur | feature | P2 |  | vectorz | ✅ shipped | #59 |
| 0038 | E3 — Pilote natif complet (stories front-matter, exécuteur générique, gate zéro-BMAD) | feature | P2 | 0034 | vectorz | ⛔ blocked |  |
| 0039 | E4 — Retrait de BMAD (relogement, suppression, purge) + tags d'époque | refactor | P2 | 0034 | vectorz | ⛔ blocked |  |
| 0040 | L2 — Durcir les garde-fous CI (step boundary nommé + allowlist SDK) | chore | P2 | 0034 | vectorz | 🔴 todo |  |
| 0045 | Moisson du pipeline d'amélioration d'époque 1 (Epics 9+12) — extraire la sémantique avant qu'elle ne se disperse | chore | P2 |  | vectorz | 🔴 todo |  |
| 0048 | ezk-backlog — champ `product` optionnel dans le front-matter (backlogs multi-produits) | feature | P2 |  | mega-city | ✅ shipped |  |
| 0060 | Les deux docs d'installation ont décroché de main (checklist démo + guide web UI) | bug | P2 |  | vectorz | 🔴 todo |  |
| 0072 | épics — type epic + champ front-matter epic + rendu regen groupé (ADR-0017) | feature | P2 |  | mega-city | ✅ shipped | #30 |
| 0078 | Émetteur de supervisabilité — install un-clic Claude Desktop (bundle .mcpb) | feature | P2 |  | mega-city | ✅ shipped | #41 |
| 0080 | ezk-retro — compte rendu markdown standard de cérémonie (capture versionnée, décisions PO tracées, via PR) | feature | P2 |  | mega-city | 🔴 todo |  |
| 0088 | ezk-archive — ne pas re-vérifier ce que la session appelante a déjà fait (coût de clôture disproportionné) | chore | P2 |  | mega-city | 🟠 in-progress |  |
| 0096 | build-mcpb.sh fige la version en dur — le bundle installé ne dit pas ce qu'il contient | bug | P2 |  | mega-city | 🔴 todo |  |
| 0101 | Câbler check-links.sh — un contrôle que personne ne lance ne protège de rien | chore | P2 |  | mega-city | 🔴 todo |  |
| 0110 | remote + licence (backup + base OSS) | chore | P2 |  | mega-city | ✅ shipped |  |
| 0112 | dogfooding — 2 invariants d'évolutivité en règles iamthelaw | feature | P2 |  | mega-city | 🔴 todo |  |
| 0119 | capture — charger un vrai corpus pour judge (détection de doublon) | feature | P2 |  | mega-city | 🔴 todo |  |
| 0121 | cap cop1 — matérialiser un profil en config native cop1 | feature | P2 |  | mega-city | ⛔ blocked |  |
| 0126 | ezk-ezk — méta-skill : créer un skill depuis la session (brainstorm → archi → déploiement) | feature | P2 |  | mega-city | ✅ shipped | local (squash-merge) |
| 0127 | ezk-backlog add — proposer un brainstorm pour façonner une fiche vague | feature | P2 |  | mega-city | ✅ shipped | local (via migration ezk-backlog #31, fiche 0024) |
| 0128 | ezk-product-builder — couche product-owner autonome (idée → backlog → ezk-sprint → ship) | feature | P2 |  | mega-city | ✅ shipped | local (squash-merge) |
| 0131 | ezk-archive persiste la note de handoff dans .claude/handoff.md | feature | P2 |  | mega-city | ✅ shipped | local (squash-merge) |
| 0135 | Renommer l'agent ezk-tdd → ezk-dev (TDD = capacité du dev, pas un rôle) | refactor | P2 |  | mega-city | ✅ shipped |  |
| 0137 | ezk-diagram — prose → diagramme versionné (as-code + image), autorat verbal | feature | P2 |  | mega-city | ✅ shipped | #3 |
| 0140 | geler puis archiver le repo iamthelaw (post-migration) | chore | P2 |  | mega-city | ✅ shipped | local (squash-merge) |
| 0146 | profils par hôte — cop1-target.yml et desktop.yml | feature | P2 |  | mega-city | ✅ shipped | #7 |
| 0147 | ezk-recipy — scanner les repos froids et proposer des fiches de skills | feature | P2 |  | mega-city | 🔴 todo |  |
| 0148 | caps claude-code — sérialiser model/effort/isolation dans les fichiers agents générés | bug | P2 |  | mega-city | ✅ shipped | local (squash-merge) |
| 0150 | ezk-dev — le rôle est un agent, la méthode (TDD) est une rule de profil | refactor | P2 |  | mega-city | 🔴 todo |  |
| 0152 | ezk-bug — skill d'intake/cadrage d'un bug signalé : repro (Playwright MCP partagé) → fiche backlog | feature | P2 |  | mega-city | 🔴 todo |  |
| 0162 | adapter BMAD au contrat de supervisabilité — 2ᵉ méthode émettrice (adaptateur→overlay→fork jetable) | feature | P2 |  | mega-city | 🔴 todo |  |
| 0167 | ezk-retro — cérémonie d'auto-amélioration de la méthode (round-robin d'agents → règles mesurables → juge de cohérence → DoD/rules) | feature | P2 |  | mega-city | ✅ shipped | #21 |
| 0005 | Résorber les warnings biome | chore | P3 |  | vectorz | ✅ shipped | #45 |
| 0007 | Format de session log + discipline de commit (anchor réel) | chore | P3 |  | vectorz | 🔴 todo |  |
| 0010 | Heartbeat mission-control — setInterval recréé à chaque frame SSE | refactor | P3 |  | vectorz | ✅ shipped | #40 |
| 0011 | Buffer `frames` non borné dans la mission-control | refactor | P3 |  | vectorz | ✅ shipped | #41 |
| 0012 | Rafraîchir brownfield-snapshot.md (ancien emplacement worktree agent/) | chore | P3 |  | vectorz | ✅ shipped | #43 |
| 0016 | Surfaçage des violations DoD dans la mission-control (web) | feature | P3 |  | vectorz | ✅ shipped | #44 |
| 0017 | E2E Playwright — dark-mode cobaye (post-FEAT-S1) | chore | P3 |  | vectorz | ⛔ blocked |  |
| 0018 | Câbler DoDLimiter (N rejets DoD → blocked + escalade) | feature | P3 | 0034 | vectorz | ⛔ blocked |  |
| 0019 | Rendre `pnpm typecheck` robuste sur état stale (TS6310) | chore | P3 |  | vectorz | ✅ shipped | #49 |
| 0028 | Policy de siège — l'auto-continue configurable sur signaux typés | feature | P3 |  | vectorz | 🔴 todo |  |
| 0029 | Contrat de supervisabilité v0.2 — les différés du gel v0.1 (multi-piste, anti-surplace) | chore | P3 |  | vectorz | 🔴 todo |  |
| 0046 | Différés du contrat d'améliorabilité — parking gated « après boucles réelles » | chore | P3 |  | vectorz | 🔴 todo |  |
| 0113 | chief-judge — juge de cohérence (avis, non bloquant) | feature | P3 |  | mega-city | 🔴 todo |  |
| 0116 | cap — dériver le hook du champ enforcement.hook.script (au lieu du hardcode) | refactor | P3 |  | mega-city | 🔴 todo |  |
| 0117 | aligner les signatures de domain.ts sur l'implémentation (expand/bind) | chore | P3 |  | mega-city | 🔴 todo |  |
| 0120 | dette I/O — factoriser resolveInside* (DRY) + couvrir la CLI capture | refactor | P3 |  | mega-city | 🔴 todo |  |
| 0143 | aligner le nommage des modes tokens du product-builder (lean\|cap\|full partout) | chore | P3 |  | mega-city | 🔴 todo |  |
| 0151 | ezk-product-builder — briefing au démarrage (comment je travaille, avec quelles règles) | feature | P3 |  | mega-city | 🔴 todo |  |

## 🧭 Épics (jamais tirables — tirer leurs enfants ready, ADR-0017)

| # | Titre | Type | Prio | Épic | Produit | Statut | PR |
|---|-------|------|------|------|---------|--------|----|
| 0034 | Mise à plat post-pivot — aligner Vectorz/cop1 sur ADR-021→028 (épic) | epic | P0 |  | vectorz | 🔴 todo |  |
| 0051 | Observabilité qualité produit — mesurer, historiser et analyser la qualité des logiciels fabriqués (par PR) (épic) | epic | P1 |  | vectorz | 🔴 todo |  |
| 0163 | série d'articles REX — migrer des méthodes existantes vers le contrat de supervisabilité | epic | P2 |  | mega-city | 🔴 todo |  |

## 💡 Idées (non groomées)

| # | Titre | Type | Prio | Épic | Produit | Statut | PR |
|---|-------|------|------|------|---------|--------|----|
| 0090 | Cohérence de sprint — garde-fou d'ouverture (lecture) + verrou de sprint adapté LLM (écriture) | feature | P0 |  | mega-city | 💡 idea |  |
| 0091 | Mise à plat du backlog — carte lisible + glossaire du jargon (dogfood du format) | chore | P0 |  | mega-city | 💡 idea |  |
| 0081 | Carnet de préparation de rétro — chaque session note ses sujets (par config), la rétro n'oublie plus rien | feature | P1 |  | mega-city | 💡 idea |  |
| 0087 | Distribuer le catalogue vectorz en plugin Claude Code (cap plugin + marketplace + versionnage) | feature | P1 |  | mega-city | 💡 idea |  |
| 0133 | ADR + diagramme — carte rôles dev → skills/agents ezk-* | feature | P1 |  | mega-city | 💡 idea |  |
| 0157 | ezk-landing — skill de création de landing pages pro FR/EN (patrons réutilisés) | feature | P1 |  | mega-city | 💡 idea |  |
| 0170 | Concevoir le modèle d'extension / plugin mega-city (panel architecte) — avant tout adaptateur outillage | feature | P1 |  | mega-city | 💡 idea |  |
| 0043 | article — « Self-hosting : le jour où cop1 développera cop1 » (dogfooding → self-hosting → RSI) | feature | P2 |  | vectorz | 💡 idea |  |
| 0053 | Gate DoD adossé à une métrique — bloquer une PR si un seuil qualité n'est pas tenu | feature | P2 | 0051 | vectorz | 💡 idea |  |
| 0054 | Catalogue d'adaptateurs — ajouter un outil de métrique sans réinventer la roue | feature | P2 | 0051 | vectorz | 💡 idea |  |
| 0055 | KPI agrégés — rollups commit → PR → sprint → version depuis le silo | feature | P2 | 0051 | vectorz | 💡 idea |  |
| 0056 | Visualisation — onglet « qualité par PR » dans mission-control | feature | P2 | 0051 | vectorz | 💡 idea |  |
| 0058 | Rapport qualité de PR — les métriques et le résumé du test visibles dans chaque PR | feature | P2 | 0051 | vectorz | 💡 idea |  |
| 0062 | Onglet « Projets » dans le Moniteur — portefeuille par projet (méthode+version, localisation, statut) cliquable vers son activité | feature | P2 |  | vectorz | 💡 idea |  |
| 0063 | Ancrer un projet depuis le Moniteur — bouton « ajouter projet » + sélection de dossier + install via le daemon (2 modes) | feature | P2 |  | vectorz | 💡 idea |  |
| 0065 | Sprint composition — un sprint peut porter un lot cohérent de fiches ; granularité PR = incrément livrable cohérent | feature | P2 |  | mega-city | 💡 idea |  |
| 0066 | Tester un skill/agent avant merge — process maison (golden tests + DoR/DoD de skill + gate dry-run) | feature | P2 |  | mega-city | 💡 idea |  |
| 0067 | ezk-ezk contract-aware — génère un skill/agent + sa carte d'émission séparée (conforme au contrat) | feature | P2 |  | mega-city | 💡 idea |  |
| 0068 | Règle enforced — la carte de la méthode (method-map) à jour à chaque modif de méthode | feature | P2 |  | mega-city | 💡 idea |  |
| 0073 | article — donner à l'auto-amélioration la direction scrum (mapper sa méthode sur le vocabulaire officiel) | feature | P2 | 0163 | mega-city | 💡 idea |  |
| 0075 | Curation des règles de persona/format d'écriture — règles lisibles humain+LLM, l'agent propose des extraits ciblés à valider | feature | P2 |  | mega-city | 💡 idea |  |
| 0092 | Décomposition légère du backlog — champs depends: et labels: (anti-JIRA) + avenant ADR-0017 | feature | P2 |  | mega-city | 💡 idea |  |
| 0098 | plan:head — descendre vers l'enfant prêt d'un épic placé dans le plan | feature | P2 |  | mega-city | 💡 idea |  |
| 0099 | Contrat d'émission — vérifier la STRUCTURE des directives, pas compter les mentions | chore | P2 |  | mega-city | 💡 idea |  |
| 0100 | Sprint intake — DoR & santé du backlog (combien de features prêtes/pas prêtes, métriques émises pour le monitoring, garde « pas de sprint possible ») | feature | P2 |  | mega-city | 💡 idea |  |
| 0125 | explorer le domaine « stack → toolchain » (cousin de Cap sur l'axe techno) | feature | P2 |  | mega-city | 💡 idea |  |
| 0134 | Propager les maj *breaking* d'un skill aux projets (pull + hook de drift + migrations datées) | feature | P2 |  | mega-city | 💡 idea |  |
| 0136 | ezk-reviewer — rôle Reviewer composant code-review + coordination reviewers externes (cumulables) | feature | P2 |  | mega-city | 💡 idea |  |
| 0155 | ezk-cowork — scaffold + audit du pattern « contrat cowork » (bootstrap mince / guide servi par l'app) | feature | P2 |  | mega-city | 💡 idea |  |
| 0158 | ezk-dns — automatiser la config DNS chez IONOS via l'API (l'achat reste manuel) | feature | P2 |  | mega-city | 💡 idea |  |
| 0161 | ezk-challenge — panel de challenge adversarial réutilisable (relecteurs frais + gate) | feature | P2 |  | mega-city | 💡 idea |  |
| 0166 | article — « Seed AI d'équipe : un contrat d'auto-amélioration auquel la méthode adhère » | feature | P2 |  | mega-city | 💡 idea |  |
| 0171 | Adapter GitHub Issues (push-only, config-gated) — projection du backlog md, pas SoT | feature | P2 |  | mega-city | 💡 idea |  |
| 0172 | Convention SoT backlog — fiches md = maître ; GitHub = export (hygiène process) | chore | P2 |  | mega-city | 💡 idea |  |
| 0174 | ezk-issues — intake GitHub (analyse, PR fix/feature md opt-in, coût local) | feature | P2 |  | mega-city | 💡 idea |  |
| 0042 | Inventaire — idées historiques cop1 réutilisables dans le paradigme vectorz (icebox) | feature | P3 |  | vectorz | 💡 idea |  |
| 0047 | Migration réflexive — quand le produit se teste lui-même, la migration devient un problème réflexif (→ ADR + article) | feature | P3 |  | vectorz | 💡 idea |  |
| 0049 | article — « Brancher une méthode qu'on ne possède pas : le pattern sidecar » (ADR-032, cas BMAD) | feature | P3 |  | vectorz | 💡 idea |  |
| 0057 | Agent d'analyse de la méthode — lit les KPI et propose des améliorations (gate PO) [nord/parking] | feature | P3 | 0051 | vectorz | 💡 idea |  |
| 0074 | article — la loi de Pareto dynamique (rollout à curseur : mesurer d'abord, détailler sur preuve) | feature | P3 | 0163 | mega-city | 💡 idea |  |
| 0093 | BacklogStore — port de persistance agnostique (md/git · GitHub · Jira…) — IDEA, sur trigger | feature | P3 |  | mega-city | 💡 idea |  |
| 0114 | webapp de config (édite les YAML profiles/bundles) | feature | P3 |  | mega-city | 💡 idea |  |
| 0138 | Modèle typé interaction/autorité → run / draw / document (substrat génératif) | feature | P3 |  | mega-city | 💡 idea |  |
| 0139 | Garde-fous d'intégrité/qualité des agents (advisory + enforced) | feature | P3 |  | mega-city | 💡 idea |  |

> Livrées (`done/`) : 0001, 0002, 0003, 0004, 0005, 0006, 0008, 0009, 0010, 0011, 0012, 0013, 0014, 0015, 0016, 0019, 0021, 0023, 0025, 0026, 0027, 0031, 0032, 0033, 0035, 0036, 0037, 0048, 0059, 0061, 0064, 0070, 0071, 0072, 0076, 0078, 0079, 0082, 0083, 0084, 0085, 0086, 0089, 0094, 0095, 0097, 0103, 0104, 0106, 0107, 0108, 0109, 0110, 0111, 0115, 0118, 0122, 0123, 0124, 0126, 0127, 0128, 0129, 0130, 0131, 0132, 0135, 0137, 0140, 0141, 0142, 0144, 0145, 0146, 0148, 0153, 0154, 0159, 0160, 0167, 0168.
