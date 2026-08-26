# Backlog features & bugs — vectorz

> Index auto-généré (`regen-backlog.sh` mega-city, via `/ezk-backlog regen`) — **ne pas éditer à la main**. Source de vérité = le front-matter de chaque fiche.
> Guide du dossier : [README.md](README.md). Statuts : 💡 idea · 🔴 todo · 🟠 in-progress · ⛔ blocked · ✅ shipped.

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
| 0090 | Cohérence de sprint — garde-fou d'ouverture (lecture) + verrou de sprint adapté LLM (écriture) | feature | P0 |  | mega-city | ✅ shipped | #99 |
| 0091 | Mise à plat du backlog — carte lisible + glossaire du jargon (dogfood du format) | chore | P0 |  | mega-city | ✅ shipped | #103 |
| 0094 | Brancher l'émetteur sur Claude Code (.mcp.json du dépôt) — le dogfooding n'émet rien aujourd'hui | feature | P0 |  | mega-city | ✅ shipped | #54 |
| 0097 | Connecter l'ordre du plan à la vue cross-backlog — « la suite, toutes listes confondues » suit PLAN.md | feature | P0 |  | mega-city | ✅ shipped | #53 |
| 0105 | Bug dogfood — Moniteur « Silence prolongé » / produit inutilisable après run_start seul | bug | P0 |  | mega-city | ✅ shipped | resolved-by 0103+0104 |
| 0106 | lawgiver bind — cap claude-code (MVP déterministe) | feature | P0 |  | mega-city | ✅ shipped | local (squash-merge) |
| 0115 | bind — fusion non-destructive (intention + bloc managé) au lieu d'écraser | feature | P0 |  | mega-city | ✅ shipped | local (squash-merge) |
| 0122 | cap global — matérialiser un profil dans ~/.claude (remplace install.sh) | feature | P0 |  | mega-city | ✅ shipped | local (squash-merge) |
| 0168 | Run orphelin = verrou sans clé — un run jamais clôturé bloque toute émission, sans action de déblocage | bug | P0 |  | mega-city | ✅ shipped | #76 |
| 0176 | Interdit gitconfig global pour l'identité agent — commits cop1 locaux / one-shot only | feature | P0 |  | cop1 | ✅ shipped | #89 |
| 0181 | Méthode ezk — Opus 4.8 par défaut + restitutions lisibles sur toutes les commandes | feature | P0 |  | mega-city | ✅ shipped | #92 |
| 20260826122532943 | Fondation — le modèle de fichiers ezk : compilé, schématisé, validé (avant les recettes) | feature | P0 |  | mega-city | 🔴 todo |  |
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
| 0041 | Cobaye — banc de test rapide (manuel + e2e Pareto) pour sécuriser les devs | chore | P1 |  | vectorz | ✅ shipped | #113 |
| 0044 | Mesureur d'outcomes métier + script d'append — l'évaluateur d'abord (contrat d'améliorabilité, MVP A) | chore | P1 |  | vectorz | ✅ shipped | #145 |
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
| 0102 | ezk-testbed — démarrer un environnement de test isolé (PR, branche ou local) : une brique autonome, pas un chapitre d'ezk-pr | feature | P1 |  | mega-city | ⛔ blocked |  |
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
| 0149 | formaliser la composition inter-skills (composes) | feature | P1 |  | mega-city | ✅ shipped | #121 |
| 0153 | ezk-article — skill d'écriture d'articles techniques vulgarisés (persona + panel de relecteurs frais) | feature | P1 |  | mega-city | ✅ shipped | #32 |
| 0154 | Kit émetteur de supervisabilité — mega-city devient la première méthode conforme au contrat | feature | P1 |  | mega-city | ✅ shipped | #35 |
| 0156 | ezk-marketing — orchestrateur de promotion produit (articles d'épopée, canaux, vidéos) | feature | P1 | 20260824060737115 | mega-city | 🔴 todo |  |
| 0159 | ezk-ci — surveiller et plafonner la consommation GitHub Actions (repos privés) | feature | P1 |  | mega-city | ✅ shipped | #34 |
| 0160 | ezk-backlog groom/ready — promouvoir une idea vers Definition of Ready (gate) | feature | P1 |  | mega-city | ✅ shipped | #26 |
| 0164 | vz-product-builder — product-builder autonome à corpus de reviewers (overlay, n'écrase pas ezk-*) | feature | P1 |  | mega-city | 🟠 in-progress |  |
| 0165 | Contrat d'améliorabilité v0.1 — texte, registre des surfaces, kit émetteur, extension ezk-backlog, première boucle fermée (MVP B) | feature | P1 |  | mega-city | 🔴 todo |  |
| 0169 | Oracle de journal `analyze --expect` — rendre une session testable (brique 1, ex-explorateur LLM) | feature | P1 |  | mega-city | ✅ shipped | main@1f4a0da |
| 0170 | Concevoir le modèle d'extension / plugin mega-city (panel architecte) — avant tout adaptateur outillage | feature | P1 |  | mega-city | ✅ shipped | #162 |
| 0173 | Méthode ezk — 3 bandes + naming (ezk-pr, caps, archive=capacité) | feature | P1 |  | mega-city | ✅ shipped | #72 |
| 0183 | Pack de review markdown-first — artefact de restitution dans le code (SoT) ; GitHub PR = un rendu parmi d'autres | feature | P1 |  | mega-city | ✅ shipped | local (main c45102b) |
| 0185 | ezk-archive — croiser branches RÉELLES et PRs ouvertes (ne plus proposer d'ouvrir une PR déjà ouverte) | feature | P1 |  | mega-city | ✅ shipped | #117 |
| 0191 | Lisibilité qui tient — templates LLM-adaptés + renfort au moment d'écrire (dès la description de PR) | feature | P1 |  | mega-city | ✅ shipped | local (main f196fe0) |
| 20260812104022240 | ezk-backlog aggregate — rationaliser le backlog (regrouper/splitter/épics), moteurs script + LLM | feature | P1 |  | mega-city | 🔴 todo |  |
| 20260812134515706 | Frugalité CI réutilisable — étendre ezk-ci d'un `harden`/`apply` (recettes appliquées par repo) | feature | P1 |  | mega-city | ✅ shipped | #171 |
| 20260813131259846 | Contrat d'améliorabilité — validateur noyau + miroir + chien de garde (surfaces gelées) — gated ADR-030 ratifié | feature | P1 |  | vectorz | ⛔ blocked |  |
| 20260813200137369 | Product-builder — auto-groom vers la DoR + option --check-ready (révise ADR-0016 A5) | feature | P1 |  | mega-city | ✅ shipped | #148 |
| 20260816131704335 | /ezk-help — index de commandes ezk généré depuis les frontmatter | feature | P1 | 20260816131703334 | mega-city | ✅ shipped | #151 |
| 20260821163346490 | La ligne « L'ASSEMBLAGE » ne montre pas les liens de composition (retour PO) | feature | P1 | 20260821163346487 | mega-city | 🔴 todo |  |
| 20260821172716537 | La carte ne montre pas LA LOI de l'intérieur (règles, bundles, profils — et qui les lit) | feature | P1 | 20260821163346487 | mega-city | 🔴 todo |  |
| 20260821204737357 | Câbler la méthode par un modèle compilé, pas 30 frontmatter — et ce que BMAD apprend | feature | P1 | 20260821163346487 | mega-city | 🟠 in-progress |  |
| 20260823121712652 | Modèle de statut kanban — liste de statuts validée par schéma, `ready` devient une colonne | feature | P1 |  | mega-city | 🟠 in-progress |  |
| 20260823121712781 | reconcile systématique — ne plus rater un ship après un squash-merge fait hors du flux (GitHub UI) | feature | P1 |  | mega-city | 🔴 todo |  |
| 20260823220100308 | Le binder retire proprement un ancien nom (retrait gardé) — le débloqueur des renames | feature | P1 |  | mega-city | ✅ shipped | #162 |
| 20260823220100443 | Split cérémonie/rôle — le skill devient ezk-product-build, le rôle PO reste l'agent ezk-pm | refactor | P1 |  | mega-city | ✅ shipped | #162 |
| 20260824061247344 | Refonte « trois étages » — le reliquat exécutable (lot 4b + retouches + options PO) | refactor | P1 |  | mega-city | 🔴 todo |  |
| 20260825141012293 | ezk-sessions — cockpit de pilotage des sessions Claude Code (worktrees × sessions × branches), avec onglet dans la map | feature | P1 |  | mega-city | 🔴 todo |  |
| 0003 | E2E Playwright — panneau auth (🟢 + modèle) | chore | P2 |  | vectorz | ✅ shipped | #34 |
| 0004 | Sanitiser/tronquer le champ error de /api/auth/check | bug | P2 |  | vectorz | ✅ shipped | #29 |
| 0006 | V1.1 — DoD automatisée, iamthelaw et enforcement budget | feature | P2 |  | vectorz | ✅ shipped | #32 |
| 0008 | Proxy Vite cible :3000 alors que le daemon écoute :4242 | bug | P2 |  | vectorz | ✅ shipped | #28 |
| 0009 | Durcir les appels git worktree (execFileSync, anti-injection shell) | refactor | P2 |  | vectorz | ✅ shipped | #30 |
| 0014 | iamthelaw enforced — Rule.check → DoDCheck, advisory dans le prompt | feature | P2 |  | vectorz | ✅ shipped | #36 |
| 0015 | StoryBudget par story + câblage DoDLimiter (enforcement budget fin) | feature | P2 |  | vectorz | ✅ shipped | #38 |
| 0020 | AgentSessionPort — prouver l'indépendance à l'agent (StubExecutor, puis LLM local) | feature | P2 | 0034 | vectorz | 🔴 todo |  |
| 0022 | mission-control — afficher ce qui est déjà collecté (heure, durée, agent, historique, $) | feature | P2 |  | vectorz | ✅ shipped | #105 |
| 0023 | exposer le model-tiering dans cop1.config.yaml (promesse ADR-015) | chore | P2 |  | vectorz | ✅ shipped | #52 |
| 0024 | résorber la périphérie pré-pivot (ceremony-engine, quality-intelligence) + acter ADR-021/022 | refactor | P2 | 0034 | vectorz | 🔴 todo |  |
| 0025 | Article « contrat de supervisabilité » — lecture de première main + article publié dans la doc | feature | P2 |  | vectorz | ✅ shipped | #57 |
| 0026 | Article « fenêtres de mise à jour » — l'éligibilité de migration déclarée par le travailleur | feature | P2 |  | vectorz | ✅ shipped | #59 |
| 0038 | E3 — Pilote natif complet (stories front-matter, exécuteur générique, gate zéro-BMAD) | feature | P2 | 0034 | vectorz | ⛔ blocked |  |
| 0039 | E4 — Retrait de BMAD (relogement, suppression, purge) + tags d'époque | refactor | P2 | 0034 | vectorz | ✅ shipped | #81 |
| 0040 | L2 — Durcir les garde-fous CI (step boundary nommé + allowlist SDK) | chore | P2 | 0034 | vectorz | 🔴 todo |  |
| 0045 | Moisson du pipeline d'amélioration d'époque 1 (Epics 9+12) — extraire la sémantique avant qu'elle ne se disperse | chore | P2 |  | vectorz | 🔴 todo |  |
| 0048 | ezk-backlog — champ `product` optionnel dans le front-matter (backlogs multi-produits) | feature | P2 |  | mega-city | ✅ shipped |  |
| 0060 | Les deux docs d'installation ont décroché de main (checklist démo + guide web UI) | bug | P2 |  | vectorz | ✅ shipped | #107 |
| 0062 | Onglet « Projets » dans le Moniteur — portefeuille par projet (méthode+version, localisation, statut) cliquable vers son activité | feature | P2 |  | vectorz | ✅ shipped | #95 |
| 0063 | Ancrer un projet depuis le Moniteur — bouton « ajouter projet » + sélection de dossier + install via le daemon (2 modes) | feature | P2 |  | vectorz | ✅ shipped | #97 |
| 0065 | Sprint composition — un sprint peut porter un lot cohérent de fiches ; granularité PR = incrément livrable cohérent | feature | P2 |  | mega-city | ✅ shipped | local (squash-merge c969569) |
| 0072 | épics — type epic + champ front-matter epic + rendu regen groupé (ADR-0017) | feature | P2 |  | mega-city | ✅ shipped | #30 |
| 0078 | Émetteur de supervisabilité — install un-clic Claude Desktop (bundle .mcpb) | feature | P2 |  | mega-city | ✅ shipped | #41 |
| 0080 | ezk-retro — compte rendu standard de cérémonie (capture versionnée ET extractible, décisions PO tracées, via PR) | feature | P2 |  | mega-city | 🔴 todo |  |
| 0088 | ezk-archive — ne pas re-vérifier ce que la session appelante a déjà fait (coût de clôture disproportionné) | chore | P2 |  | mega-city | 🟠 in-progress |  |
| 0096 | build-mcpb.sh fige la version en dur — le bundle installé ne dit pas ce qu'il contient | bug | P2 |  | mega-city | 🔴 todo |  |
| 0101 | Câbler check-links.sh — un contrôle que personne ne lance ne protège de rien | chore | P2 | 20260813131737959 | mega-city | ✅ shipped | local (main) |
| 0110 | remote + licence (backup + base OSS) | chore | P2 |  | mega-city | ✅ shipped |  |
| 0112 | dogfooding — 2 invariants d'évolutivité en règles iamthelaw | feature | P2 |  | mega-city | 🔴 todo |  |
| 0119 | capture — charger un vrai corpus pour judge (détection de doublon) | feature | P2 |  | mega-city | 🔴 todo |  |
| 0121 | cap cop1 — matérialiser un profil en config native cop1 | feature | P2 |  | mega-city | 🔴 todo |  |
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
| 0152 | ezk-bug — skill d'intake/cadrage d'un bug signalé : repro (Playwright MCP partagé) → fiche backlog | feature | P2 |  | mega-city | ✅ shipped | #174 |
| 0162 | adapter BMAD au contrat de supervisabilité — 2ᵉ méthode émettrice (adaptateur→overlay→fork jetable) | feature | P2 |  | mega-city | 🔴 todo |  |
| 0167 | ezk-retro — cérémonie d'auto-amélioration de la méthode (round-robin d'agents → règles mesurables → juge de cohérence → DoD/rules) | feature | P2 |  | mega-city | ✅ shipped | #21 |
| 0184 | Webapp de reporting de run — features livrées façon PR + preview/démo local + reste-à-tester | feature | P2 |  | vectorz | ✅ shipped | local (main 51d8bf0) |
| 0190 | composes — tier « delegates: » (composition optionnelle, jamais warnée) | feature | P2 |  | mega-city | 🔴 todo |  |
| 20260812100109940 | ship doit synchroniser les vues de planning (PORTFOLIO.md + PLAN.md), pas seulement BACKLOG.md | chore | P2 |  | mega-city | ✅ shipped | #173 |
| 20260816151112162 | Canal commands: dans lawgiver — déployer les slash-commands comme les skills | feature | P2 |  | mega-city | 🔴 todo |  |
| 20260821210633457 | Explorateur LLM par PR — pilote de siège auto + exploration (suite de l'oracle 0169) | feature | P2 |  | mega-city | 🔴 todo |  |
| 20260823121712716 | Vues générées — board kanban + historique des décisions relu depuis git (pas dans la fiche) | feature | P2 |  | mega-city | 🔴 todo |  |
| 20260823121712844 | Durcir regen-backlog — refuser une racine par défaut nichée sous un autre backlog (fin du piège products/mega-city) | bug | P2 |  | mega-city | 🔴 todo |  |
| 20260823121712909 | lawgiver doctor — détecter un skill du profil non matérialisé dans ~/.claude (le bug /ezk-pr introuvable) | feature | P2 |  | mega-city | 🔴 todo |  |
| 20260823124042842 | Vue d'avancement — les fiches positionnées sur le process scrum, sprints passés/en cours/futurs | feature | P2 |  | mega-city | ✅ shipped | main@7f0f12d |
| 20260824185422122 | « Recette » comme artefact de premier rang + gardien (ezk-chef) — instancier le pattern steward, ne rien inventer | feature | P2 |  | mega-city | 🔴 todo |  |
| 20260825123700998 | Doctrine de composition des features — fusion, épic ou division : quand et comment | feature | P2 |  | mega-city | ✅ shipped | #175 |
| 20260825160456259 | Proposer les commandes suivantes en fin de sprint/skill (affordance next-step, à la BMAD *help) | feature | P2 | 20260816131703334 | mega-city | 🔴 todo |  |
| 20260825202444647 | ezk-codex fix — répondre en fil ET résoudre TOUS les fils traités (pas seulement décliner) | feature | P2 |  | mega-city | 🔴 todo |  |
| 20260825213807501 | Vue « Plan » dans le board — l'ordre décidé du travail + la prochaine fiche tirable (rendre PLAN.md, sans objet sprint) | feature | P2 |  | mega-city | ✅ shipped | #169 |
| 20260826225817193 | Board d'avancement — cliquer une fiche ouvre son détail lisible (au lieu du .md brut) | feature | P2 | 20260821163346487 | mega-city | 🔴 todo |  |
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
| 0116 | cap — dériver le hook du champ enforcement.hook.script (au lieu du hardcode) | refactor | P3 |  | mega-city | 🔴 todo |  |
| 0117 | aligner les signatures de domain.ts sur l'implémentation (expand/bind) | chore | P3 |  | mega-city | 🔴 todo |  |
| 0120 | dette I/O — factoriser resolveInside* (DRY) + couvrir la CLI capture | refactor | P3 |  | mega-city | 🔴 todo |  |
| 0143 | aligner le nommage des modes tokens du product-builder (lean\|cap\|full partout) | chore | P3 |  | mega-city | 🔴 todo |  |
| 0151 | ezk-product-build — briefing au démarrage (comment je travaille, avec quelles règles) | feature | P3 |  | mega-city | 🔴 todo |  |
| 0182 | E4 bis — docs vivants post-BMAD (complément 0039) | chore | P3 |  | vectorz | ✅ shipped | #101 |
| 20260813122510737 | ezk-backlog init.sh — le marqueur layout_version doit primer sur la détection legacy « Index auto-généré » | bug | P3 |  | mega-city | 🔴 todo |  |
| 20260813170548417 | Supprimer le dossier tombstone products/mega-city/features/ + sevrer portfolio.sh (reliquat de 0064) | chore | P3 |  | mega-city | ✅ shipped | #147 |
| 20260825152954193 | Page d'accueil ezk:map — un menu des cartes (naviguer sans relancer le serveur) | feature | P3 |  | mega-city | ✅ shipped | #170 |
| 20260825232147620 | Barre de navigation sur chaque carte ezk:map — revenir au menu + sauter à une autre carte | feature | P3 |  | mega-city | ✅ shipped | #172 |

## 🧭 Épics (jamais tirables — tirer leurs enfants ready, ADR-0017)

| # | Titre | Type | Prio | Épic | Produit | Statut | PR |
|---|-------|------|------|------|---------|--------|----|
| 0034 | Mise à plat post-pivot — aligner Vectorz/cop1 sur ADR-021→028 (épic) | epic | P0 |  | vectorz | 🔴 todo |  |
| 0051 | Observabilité qualité produit — mesurer, historiser et analyser la qualité des logiciels fabriqués (par PR) (épic) | epic | P1 |  | vectorz | 🔴 todo |  |
| 20260813124026215 | Déployer (et retirer) la méthode ezk LLM-native dans un projet cible — épic de cadrage (à la bmad) | epic | P1 |  | mega-city | 💡 idea |  |
| 20260816131703334 | Épic — Rationalisation doc + découvrabilité (produit OSS de niveau pro) | epic | P1 |  | mega-city | 🔴 todo |  |
| 20260821163346487 | Épic — La carte de la méthode : fidèle aux fichiers, et revue morceau par morceau | epic | P1 |  | mega-city | 💡 idea |  |
| 20260824060737115 | Épic — Marketing & site (orchestrateur, landing, recette site) | epic | P1 |  | mega-city | 🔴 todo |  |
| 0163 | série d'articles REX — migrer des méthodes existantes vers le contrat de supervisabilité | epic | P2 |  | mega-city | 🔴 todo |  |
| 20260813131737959 | Rationalisation & cohérence de la méthode mega-city — audit → chantiers (épic) | epic | P2 |  | mega-city | 🔴 todo |  |
| 20260815080413884 | DoR agent-native — extensible par projet + readiness observable (épic) | epic | P2 |  | mega-city | 🔴 todo |  |

## 💡 Idées (non groomées)

| # | Titre | Type | Prio | Épic | Produit | Statut | PR |
|---|-------|------|------|------|---------|--------|----|
| 0081 | Carnet de préparation de rétro — chaque session note ses sujets (par config), la rétro n'oublie plus rien | feature | P1 |  | mega-city | 💡 idea |  |
| 0087 | Distribuer le catalogue vectorz en plugin Claude Code (cap plugin + marketplace + versionnage) | feature | P1 |  | mega-city | 💡 idea |  |
| 0157 | ezk-landing — skill de création de landing pages pro FR/EN (patrons réutilisés) | feature | P1 | 20260824060737115 | mega-city | 💡 idea |  |
| 20260812104022237 | Tracer la session/branche responsable d'une PR — une PR = une seule session (éviter le double-travail) | feature | P1 |  | mega-city | 💡 idea |  |
| 20260812104022246 | Composition comportementale des skills ezk — directives composables (format imposé, appels de commandes forcés) | feature | P1 |  | mega-city | 💡 idea |  |
| 20260821163346493 | Chaque élément de la carte cite le fichier d'où il sort (fin de l'interprétation) | feature | P1 | 20260821163346487 | mega-city | 💡 idea |  |
| 20260824111001836 | La règle de clarté doit atteindre TOUT ce qui sort de la méthode (base + sorties de chat), pas rester orpheline | refactor | P1 |  | mega-city | 💡 idea |  |
| 20260824122629794 | Capitaliser une feature déjà codée en « recette » réutilisable (tâches + rules/profils) — l'extraction n'existe PAS encore | feature | P1 |  | mega-city | 💡 idea |  |
| 20260824122629925 | Onglet FAQ « comment faire » — ancrer une bonne fois les questions récurrentes du PO | feature | P1 |  | mega-city | 💡 idea |  |
| 20260824204751403 | Méthode de préparation — lotir les features en versions (milestones) & contrôler la cohérence d'un lot, au-dessus du sprint | feature | P1 |  | mega-city | 💡 idea |  |
| 20260826082120062 | Domaine « métriques de sprint » — durée, tokens & KPI scrum par sprint → rapport de sprint versionné + validateur | feature | P1 |  | vectorz | 💡 idea |  |
| 0043 | article — « Self-hosting : le jour où cop1 développera cop1 » (dogfooding → self-hosting → RSI) | feature | P2 |  | vectorz | 💡 idea |  |
| 0053 | Gate DoD adossé à une métrique — bloquer une PR si un seuil qualité n'est pas tenu | feature | P2 | 0051 | vectorz | 💡 idea |  |
| 0054 | Catalogue d'adaptateurs — ajouter un outil de métrique sans réinventer la roue | feature | P2 | 0051 | vectorz | 💡 idea |  |
| 0055 | KPI agrégés — rollups commit → PR → sprint → version depuis le silo | feature | P2 | 0051 | vectorz | 💡 idea |  |
| 0056 | Visualisation — onglet « qualité par PR » dans mission-control | feature | P2 | 0051 | vectorz | 💡 idea |  |
| 0058 | Rapport qualité de PR — les métriques et le résumé du test visibles dans chaque PR | feature | P2 | 0051 | vectorz | 💡 idea |  |
| 0066 | Tester un skill/agent avant merge — process maison (golden tests + DoR/DoD de skill + gate dry-run) | feature | P2 | 20260813131737959 | mega-city | 💡 idea |  |
| 0067 | ezk-ezk contract-aware — génère un skill/agent + sa carte d'émission séparée (conforme au contrat) | feature | P2 |  | mega-city | 💡 idea |  |
| 0073 | article — donner à l'auto-amélioration la direction scrum (mapper sa méthode sur le vocabulaire officiel) | feature | P2 | 0163 | mega-city | 💡 idea |  |
| 0075 | Curation des règles de persona/format d'écriture — règles lisibles humain+LLM, l'agent propose des extraits ciblés à valider | feature | P2 |  | mega-city | 💡 idea |  |
| 0098 | plan:head — descendre vers l'enfant prêt d'un épic placé dans le plan | feature | P2 |  | mega-city | 💡 idea |  |
| 0099 | Contrat d'émission — vérifier la STRUCTURE des directives, pas compter les mentions | chore | P2 |  | mega-city | 💡 idea |  |
| 0100 | Sprint intake — DoR & santé du backlog (combien de features prêtes/pas prêtes, métriques émises pour le monitoring, garde « pas de sprint possible ») | feature | P2 | 20260815080413884 | mega-city | 💡 idea |  |
| 0125 | explorer le domaine « stack → toolchain » (cousin de Cap sur l'axe techno) | feature | P2 |  | mega-city | 💡 idea |  |
| 0155 | ezk-cowork — scaffold + audit du pattern « contrat cowork » (bootstrap mince / guide servi par l'app) | feature | P2 |  | mega-city | 💡 idea |  |
| 0158 | ezk-dns — automatiser la config DNS chez IONOS via l'API (l'achat reste manuel) | feature | P2 |  | mega-city | 💡 idea |  |
| 0161 | ezk-challenge — panel de challenge adversarial réutilisable (relecteurs frais + gate) | feature | P2 | 20260813131737959 | mega-city | 💡 idea |  |
| 0166 | article — « Seed AI d'équipe : un contrat d'auto-amélioration auquel la méthode adhère » | feature | P2 |  | mega-city | 💡 idea |  |
| 0171 | Adapter GitHub Issues (push-only, config-gated) — projection du backlog md, pas SoT | feature | P2 |  | mega-city | 💡 idea |  |
| 0174 | ezk-issues — intake GitHub (analyse, PR fix/feature md opt-in, coût local) | feature | P2 |  | mega-city | 💡 idea |  |
| 0175 | article — Skema : versionner une skill LLM avec des migrations markdown | feature | P2 |  | mega-city | 💡 idea |  |
| 0177 | Pack de pratiques projet — capacités portables indépendantes du skill/LLM driver | feature | P2 |  | mega-city | 💡 idea |  |
| 0178 | ezk-checks — recette manuelle déclenchable (Playwright → features/checks/) | feature | P2 |  | mega-city | 💡 idea |  |
| 0180 | Fiches datées — id AAAAMMDDHHMMSSmmm (17 ch., ms, UTC) à la capture, fin de max+1 | feature | P2 |  | vectorz | 💡 idea |  |
| 0186 | Skema généralisé — versioning + migrations de tout artefact mega-city (émission · registre de bind · consommation) | feature | P2 |  | mega-city | 💡 idea |  |
| 0188 | ADR lisibles comme des articles — format unique, article dérivé, ou règle ? (à groomer archi + brainstorm) | feature | P2 |  | mega-city | 💡 idea |  |
| 0189 | ezk-archive — le handoff doit survivre aux sessions éphémères (cloud/conteneur jetable) | bug | P2 |  | mega-city | 💡 idea |  |
| 20260812104022228 | Capturer des screenshots du produit et les injecter dans la doc/le site quand l'UI change | feature | P2 |  | mega-city | 💡 idea |  |
| 20260812104022231 | DoR — balayer les surfaces produit impactées (doc, site, release notes…) au grooming | feature | P2 | 20260815080413884 | mega-city | 💡 idea |  |
| 20260812104022243 | groom appelle aussi engineering:architecture (+ product-brainstorming) — par défaut, ou forcé par paramètre | feature | P2 | 20260815080413884 | mega-city | 💡 idea |  |
| 20260813095351680 | bind-global copy non idempotent pour les agents (2e passage refusé) | bug | P2 |  | mega-city | 💡 idea |  |
| 20260813095351681 | Cap projet claude-code — skills en forme dossier pour porter les assets | feature | P2 |  | mega-city | 💡 idea |  |
| 20260813131737962 | Nommage & catalogue — aligner sur ADR-0022 (rename ezk-pr-pilot→ezk-pr, ranger vz-/supervision-) + README table scannable | refactor | P2 | 20260813131737959 | mega-city | 💡 idea |  |
| 20260813131737971 | Carte des rôles d'analyse — documenter retro / steward / 0057 (+ trancher le juge unique) en un seul endroit | feature | P2 | 20260813131737959 | mega-city | 💡 idea |  |
| 20260815080414006 | DoR extensible par projet — base 3+1 + manifeste de slots par repo, lu par groom/ready | feature | P2 | 20260815080413884 | mega-city | 💡 idea |  |
| 20260816194833618 | Santé des dépendances côté ezk — audit local activable par profil (alternative frugale à Dependabot) | feature | P2 |  | mega-city | 💡 idea |  |
| 20260817113353538 | Étude prior-art BMAD (templates + elicitation) — ce qui se transpose à une méthode LLM-native | chore | P2 |  | mega-city | 💡 idea |  |
| 20260817113353676 | Article « Templates de réponse adaptés aux LLM » (via ezk-article) | feature | P2 |  | mega-city | 💡 idea |  |
| 20260818185931307 | Capability de vente LemonSqueezy (checkout + licence + entitlement) — récoltée de muti, réutilisable | feature | P2 |  | mega-city | 💡 idea |  |
| 20260821163346496 | Définir ce qu'on valide et dans quel ordre (l'unité de revue de la carte) | feature | P2 | 20260821163346487 | mega-city | 💡 idea |  |
| 20260821163346498 | Montrer sur la carte ce qui est revu, en cours, ou jamais vérifié (+ date) | feature | P2 | 20260821163346487 | mega-city | 💡 idea |  |
| 20260821163346501 | Corriger un lien faux depuis la carte, et que ça retombe dans les fichiers | feature | P2 | 20260821163346487 | mega-city | 💡 idea |  |
| 20260821171238990 | Capability launchpad (landing + waitlist + tracking) — récoltée de city-guided, réutilisable pour valider un produit | feature | P2 |  | mega-city | 💡 idea |  |
| 20260821172716540 | Recette « site produit » — un skill + des règles activables (cas samplerz) | feature | P2 | 20260824060737115 | mega-city | 💡 idea |  |
| 20260821210633522 | Article — les tests vérifient des réponses déjà posées, le LLM pose les questions | feature | P2 |  | mega-city | 💡 idea |  |
| 20260822200213110 | Règle — une page (vitrine/landing/capture) construite par un skill utilise des screenshots réels de l'app, jamais des visuels générés | feature | P2 |  | mega-city | 💡 idea |  |
| 20260823124042708 | LA LOI — distinguer thèmes (namespaces) et bundles (packs curated), désenchevêtrer hexagonal | refactor | P2 |  | mega-city | 💡 idea |  |
| 20260824141336516 | Recette « mise en place de la CI » pour un projet type muti (app desktop + web de vente) — build local (act) et/ou GitHub | feature | P2 |  | mega-city | 💡 idea |  |
| 20260824163426298 | Consolider ezk-device + ezk-preview + ezk-testbed (0102) — nouvelle sémantique post-refactoring « map » | refactor | P2 |  | mega-city | 💡 idea |  |
| 20260825024356665 | Comparateur `analyze --expect` en sous-séquence — tolérer les events non déclarés (sessions live, briques 2/3) | feature | P2 |  | mega-city | 💡 idea |  |
| 20260825161522791 | Elicitation — boucle de raffinement structurée dans groom (à la BMAD advanced-elicitation) | feature | P2 |  | mega-city | 💡 idea |  |
| 20260825182327490 | Pattern « livrable lisible » — template + extracteur scripté + rendu LLM (généraliser handoff / PR / rapport) | feature | P2 |  | mega-city | 💡 idea |  |
| 20260826072532452 | Vue « sprints réalisés » dans ezk:map — chaque sprint et son détail (PR, fiches, actions), extrait des comptes-rendus | feature | P2 |  | mega-city | 💡 idea |  |
| 20260826072532537 | Vue « rétrospectives » dans ezk:map — chaque rétro et ses actions mesurables, extraites des captures | feature | P2 |  | mega-city | 💡 idea |  |
| 20260826072532622 | Revue & validation des fiches dans ezk:map — pouce 👍/👎 (verdict versionné, partagé entre sessions) | feature | P2 |  | mega-city | 💡 idea |  |
| 20260826082120069 | ezk-retro — proposer des features ET des règles ciblées (agent / skill par composition), validées dans le rapport | feature | P2 |  | mega-city | 💡 idea |  |
| 20260826121429274 | ezk-archive émet un compte-rendu de session structuré (frontmatter par sprint — PR, fiches, actions), prérequis de la vue sprints | feature | P2 |  | mega-city | 💡 idea |  |
| 0047 | Migration réflexive — quand le produit se teste lui-même, la migration devient un problème réflexif (→ ADR + article) | feature | P3 |  | vectorz | 💡 idea |  |
| 0049 | article — « Brancher une méthode qu'on ne possède pas : le pattern sidecar » (ADR-032, cas BMAD) | feature | P3 |  | vectorz | 💡 idea |  |
| 0057 | Agent d'analyse de la méthode — lit les KPI et propose des améliorations (gate PO) [nord/parking] | feature | P3 | 0051 | vectorz | 💡 idea |  |
| 0074 | article — la loi de Pareto dynamique (rollout à curseur : mesurer d'abord, détailler sur preuve) | feature | P3 | 0163 | mega-city | 💡 idea |  |
| 0093 | BacklogStore — port de persistance agnostique (md/git · GitHub · Jira…) — IDEA, sur trigger | feature | P3 |  | mega-city | 💡 idea |  |
| 0114 | webapp de config (édite les YAML profiles/bundles) | feature | P3 |  | mega-city | 💡 idea |  |
| 20260812100258610 | testbed dogfood LLM headless — rejouer la chaîne méthode→journal→Moniteur sans humain (nightly) | feature | P3 |  | mega-city | 💡 idea |  |
| 20260813122619707 | Robustesse du groupage skill-dir en matérialisation (marqueur SKILL.md ambigu) | bug | P3 |  | mega-city | 💡 idea |  |
| 20260821163346503 | La méthode s'auto-évalue : sa cohérence, et la fidélité de sa représentation | feature | P3 | 20260821163346487 | mega-city | 💡 idea |  |
| 20260826112620281 | Schéma markdown déclaratif + validateur mécanique — format de fiche/recette vérifiable et versionnable | feature | P3 |  | mega-city | 💡 idea |  |

> Livrées (`done/`) : 0001, 0002, 0003, 0004, 0005, 0006, 0008, 0009, 0010, 0011, 0012, 0013, 0014, 0015, 0016, 0019, 0021, 0022, 0023, 0025, 0026, 0027, 0031, 0032, 0033, 0035, 0036, 0037, 0039, 0041, 0044, 0048, 0059, 0060, 0061, 0062, 0063, 0064, 0065, 0070, 0071, 0072, 0076, 0078, 0079, 0082, 0083, 0084, 0085, 0086, 0089, 0090, 0091, 0094, 0095, 0097, 0101, 0103, 0104, 0105, 0106, 0107, 0108, 0109, 0110, 0111, 0115, 0118, 0122, 0123, 0124, 0126, 0127, 0128, 0129, 0130, 0131, 0132, 0135, 0137, 0140, 0141, 0142, 0144, 0145, 0146, 0148, 0149, 0152, 0153, 0154, 0159, 0160, 0167, 0168, 0169, 0170, 0173, 0176, 0181, 0182, 0183, 0184, 0185, 0191, 20260812100109940, 20260812134515706, 20260813170548417, 20260813200137369, 20260816131704335, 20260823124042842, 20260823220100308, 20260823220100443, 20260825123700998, 20260825152954193, 20260825213807501, 20260825232147620.
