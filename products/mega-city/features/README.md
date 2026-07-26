# Backlog — mega-city

> Index auto-généré (`regen-backlog.sh` mega-city, via `/ezk-backlog regen`) — **ne pas éditer à la main**. Source de vérité = le front-matter de chaque fiche.
> 1 fiche / sujet · 1 PR / feature · backlog commité sur `main`. Statuts : 💡 idea · 🔴 todo · 🟠 in-progress · ⛔ blocked · ✅ shipped.

| # | Titre | Type | Prio | Épic | Statut | PR |
|---|-------|------|------|------|--------|----|
| 0001 | lawgiver bind — cap claude-code (MVP déterministe) | feature | P0 |  | ✅ shipped | local (squash-merge) |
| 0010 | bind — fusion non-destructive (intention + bloc managé) au lieu d'écraser | feature | P0 |  | ✅ shipped | local (squash-merge) |
| 0017 | cap global — matérialiser un profil dans ~/.claude (remplace install.sh) | feature | P0 |  | ✅ shipped | local (squash-merge) |
| 0083 | SPIKE — où atterrit le journal quand une méthode tourne dans un worktree ? (mesurer cwd et CLAUDE_PROJECT_DIR) | chore | P0 |  | ✅ shipped | #45 |
| 0084 | Le calcul de quiescence mélange deux échelles (propreté par dossier, worktrees par dépôt) — prédicat sans sémantique | bug | P0 |  | ✅ shipped | #48 |
| 0085 | Redéfinir ce que compte la quiescence — les sous-runs de l'orchestrateur, pas tout worktree git du dépôt | chore | P0 |  | ✅ shipped | #47 |
| 0086 | Le journal remonte à l'arbre principal + le serveur annonce où il écrit (fin de la perte silencieuse en worktree) | feature | P0 |  | ✅ shipped | #46 |
| 0089 | Ordonnancement — brancher PLAN.md sur l'intake (l'ordre suit la priorité, pas l'inverse) | feature | P0 |  | ✅ shipped | #52 |
| 0094 | Brancher l'émetteur sur Claude Code (.mcp.json du dépôt) — le dogfooding n'émet rien aujourd'hui | feature | P0 |  | 🟠 in-progress | '#51 · #54' |
| 0097 | Connecter l'ordre du plan à la vue cross-backlog — « la suite, toutes listes confondues » suit PLAN.md | feature | P0 |  | ✅ shipped | #53 |
| 0002 | lawgiver capture — flywheel | feature | P1 |  | ✅ shipped | local (squash-merge) |
| 0003 | cap claude-desktop — continuer à charger les skills | feature | P1 |  | ✅ shipped | #6 |
| 0004 | migrer ezk-commits vers skills/ | chore | P1 |  | ✅ shipped | local (squash-merge) |
| 0006 | migrer les rulesets iamthelaw vers rules/ + bundles/ (périmètre complet) | chore | P1 |  | ✅ shipped | local (squash-merge) |
| 0013 | capture — câbler une interaction/competence capturée dans le frontmatter d'un agent | feature | P1 |  | ✅ shipped | local (squash-merge) |
| 0018 | coquille I/O — mode link vs copy (porter le symlink live-update de claude-skills) | feature | P1 |  | ✅ shipped | local (squash-merge) |
| 0019 | migrer + étendre ezk-design-system (design system UI/UX consultable + requêtable) | feature | P1 |  | ✅ shipped | local (squash-merge) |
| 0024 | Migration claude-skills → mega-city — finir le strangler-fig (skills + agents restants → switchover) | chore | P1 |  | ✅ shipped | local (squash-merge) |
| 0025 | cap global mode link — symlinker AUSSI les agents (pas seulement les skills) | bug | P1 |  | ✅ shipped | local (squash-merge) |
| 0027 | ezk-pr-pilot : orchestrateur du test-puis-merge d'un stock de PRs (+ convention Validation) | feature | P1 |  | ✅ shipped | merge local feat/skill-ezk-pr-pilot |
| 0036 | agent ezk-pm — le décideur product-owner (jour ET nuit) | feature | P1 |  | ✅ shipped | local (squash-merge) |
| 0037 | flywheel cassé — capture écrit des skills/rules que loadCatalog ne relit jamais | bug | P1 |  | ✅ shipped | local (squash-merge) |
| 0039 | frontmatter tuning des agents — model, effort, isolation | chore | P1 |  | ✅ shipped | local (squash-merge) |
| 0040 | ezk-product-builder — mode --checkpoints ask\|auto (décisions recommandées par défaut) | feature | P1 |  | ✅ shipped | local (squash-merge) |
| 0049 | ezk-article — skill d'écriture d'articles techniques vulgarisés (persona + panel de relecteurs frais) | feature | P1 |  | ✅ shipped | #32 |
| 0050 | Kit émetteur de supervisabilité — mega-city devient la première méthode conforme au contrat | feature | P1 |  | ✅ shipped | #35 |
| 0052 | ezk-marketing — orchestrateur de promotion produit (articles d'épopée, canaux, vidéos) | feature | P1 |  | 🔴 todo |  |
| 0055 | ezk-ci — surveiller et plafonner la consommation GitHub Actions (repos privés) | feature | P1 |  | ✅ shipped | #34 |
| 0056 | ezk-backlog groom/ready — promouvoir une idea vers Definition of Ready (gate) | feature | P1 |  | ✅ shipped | #26 |
| 0060 | vz-product-builder — product-builder autonome à corpus de reviewers (overlay, n'écrase pas ezk-*) | feature | P1 |  | 🟠 in-progress |  |
| 0061 | Contrat d'améliorabilité v0.1 — texte, registre des surfaces, kit émetteur, extension ezk-backlog, première boucle fermée (MVP B) | feature | P1 |  | 🔴 todo |  |
| 0069 | article — émettre des events en restant fidèle au fonctionnement de Claude Desktop/Code | feature | P1 |  | 🔴 todo |  |
| 0070 | ezk-diagram — publier une explication compréhensible à côté du diagramme (README) | feature | P1 |  | ✅ shipped | #33 |
| 0071 | ezk-backlog review — sanity check global du backlog (validité, doublons, ordre, staleness) | feature | P1 |  | ✅ shipped | #26 |
| 0076 | Hygiène de branches post-squash — classification déterministe absorbée/réelle + suppression aux deux chemins de merge | feature | P1 |  | ✅ shipped | #31 |
| 0077 | Kit émetteur — hooks Claude Code classe A (émission déterministe) | feature | P1 |  | 🔴 todo |  |
| 0079 | Lisibilité des artefacts humains — graver la règle (élargie des restitutions PO à tout artefact lu par un humain) | feature | P1 |  | 🔴 todo |  |
| 0095 | ezk-product-builder n'émet aucun événement — ses checkpoints inter-sprints sont invisibles au Moniteur | bug | P1 |  | 🟠 in-progress | '#55' |
| 0005 | remote + licence (backup + base OSS) | chore | P2 |  | ✅ shipped |  |
| 0007 | dogfooding — 2 invariants d'évolutivité en règles iamthelaw | feature | P2 |  | 🔴 todo |  |
| 0014 | capture — charger un vrai corpus pour judge (détection de doublon) | feature | P2 |  | 🔴 todo |  |
| 0016 | cap cop1 — matérialiser un profil en config native cop1 | feature | P2 |  | ⛔ blocked |  |
| 0021 | ezk-ezk — méta-skill : créer un skill depuis la session (brainstorm → archi → déploiement) | feature | P2 |  | ✅ shipped | local (squash-merge) |
| 0022 | ezk-backlog add — proposer un brainstorm pour façonner une fiche vague | feature | P2 |  | ✅ shipped | local (via migration ezk-backlog #31, fiche 0024) |
| 0023 | ezk-product-builder — couche product-owner autonome (idée → backlog → ezk-sprint → ship) | feature | P2 |  | ✅ shipped | local (squash-merge) |
| 0026 | ezk-archive persiste la note de handoff dans .claude/handoff.md | feature | P2 |  | ✅ shipped | local (squash-merge) |
| 0030 | Renommer l'agent ezk-tdd → ezk-dev (TDD = capacité du dev, pas un rôle) | refactor | P2 |  | ✅ shipped |  |
| 0032 | ezk-diagram — prose → diagramme versionné (as-code + image), autorat verbal | feature | P2 |  | ✅ shipped | #3 |
| 0035 | geler puis archiver le repo iamthelaw (post-migration) | chore | P2 |  | ✅ shipped | local (squash-merge) |
| 0041 | profils par hôte — cop1-target.yml et desktop.yml | feature | P2 |  | ✅ shipped | #7 |
| 0042 | ezk-recipy — scanner les repos froids et proposer des fiches de skills | feature | P2 |  | 🔴 todo |  |
| 0043 | caps claude-code — sérialiser model/effort/isolation dans les fichiers agents générés | bug | P2 |  | ✅ shipped | local (squash-merge) |
| 0044 | formaliser la composition inter-skills (composes) | feature | P2 |  | 🔴 todo |  |
| 0045 | ezk-dev — le rôle est un agent, la méthode (TDD) est une rule de profil | refactor | P2 |  | 🔴 todo |  |
| 0047 | ezk-bug — skill d'intake/cadrage d'un bug signalé : repro (Playwright MCP partagé) → fiche backlog | feature | P2 |  | 🔴 todo |  |
| 0048 | ezk-backlog — champ `product` optionnel dans le front-matter (backlogs multi-produits) | feature | P2 |  | ✅ shipped |  |
| 0058 | adapter BMAD au contrat de supervisabilité — 2ᵉ méthode émettrice (adaptateur→overlay→fork jetable) | feature | P2 |  | 🔴 todo |  |
| 0063 | ezk-retro — cérémonie d'auto-amélioration de la méthode (round-robin d'agents → règles mesurables → juge de cohérence → DoD/rules) | feature | P2 |  | ✅ shipped | #21 |
| 0072 | épics — type epic + champ front-matter epic + rendu regen groupé (ADR-0017) | feature | P2 |  | ✅ shipped | #30 |
| 0078 | Émetteur de supervisabilité — install un-clic Claude Desktop (bundle .mcpb) | feature | P2 |  | ✅ shipped | #41 |
| 0080 | ezk-retro — compte rendu markdown standard de cérémonie (capture versionnée, décisions PO tracées, via PR) | feature | P2 |  | 🔴 todo |  |
| 0088 | ezk-archive — ne pas re-vérifier ce que la session appelante a déjà fait (coût de clôture disproportionné) | chore | P2 |  | 🔴 todo |  |
| 0096 | build-mcpb.sh fige la version en dur — le bundle installé ne dit pas ce qu'il contient | bug | P2 |  | 🔴 todo |  |
| 0101 | Câbler check-links.sh — un contrôle que personne ne lance ne protège de rien | chore | P2 |  | 🔴 todo |  |
| 0008 | chief-judge — juge de cohérence (avis, non bloquant) | feature | P3 |  | 🔴 todo |  |
| 0011 | cap — dériver le hook du champ enforcement.hook.script (au lieu du hardcode) | refactor | P3 |  | 🔴 todo |  |
| 0012 | aligner les signatures de domain.ts sur l'implémentation (expand/bind) | chore | P3 |  | 🔴 todo |  |
| 0015 | dette I/O — factoriser resolveInside* (DRY) + couvrir la CLI capture | refactor | P3 |  | 🔴 todo |  |
| 0038 | aligner le nommage des modes tokens du product-builder (lean\|cap\|full partout) | chore | P3 |  | 🔴 todo |  |
| 0046 | ezk-product-builder — briefing au démarrage (comment je travaille, avec quelles règles) | feature | P3 |  | 🔴 todo |  |

## 🧭 Épics (jamais tirables — tirer leurs enfants ready, ADR-0017)

| # | Titre | Type | Prio | Épic | Statut | PR |
|---|-------|------|------|------|--------|----|
| 0059 | série d'articles REX — migrer des méthodes existantes vers le contrat de supervisabilité | epic | P2 |  | 🔴 todo |  |

## 💡 Idées (non groomées)

| # | Titre | Type | Prio | Épic | Statut | PR |
|---|-------|------|------|------|--------|----|
| 0090 | Cohérence de sprint — garde-fou d'ouverture (lecture) + verrou de sprint adapté LLM (écriture) | feature | P0 |  | 💡 idea |  |
| 0091 | Mise à plat du backlog — carte lisible + glossaire du jargon (dogfood du format) | chore | P0 |  | 💡 idea |  |
| 0028 | ADR + diagramme — carte rôles dev → skills/agents ezk-* | feature | P1 |  | 💡 idea |  |
| 0053 | ezk-landing — skill de création de landing pages pro FR/EN (patrons réutilisés) | feature | P1 |  | 💡 idea |  |
| 0081 | Carnet de préparation de rétro — chaque session note ses sujets (par config), la rétro n'oublie plus rien | feature | P1 |  | 💡 idea |  |
| 0082 | Registre de supervision versionné côté vectorz — QUOI + MÉTHODE, jamais OÙ (modèle à deux clés) | feature | P1 |  | 💡 idea |  |
| 0087 | Distribuer le catalogue vectorz en plugin Claude Code (cap plugin + marketplace + versionnage) | feature | P1 |  | 💡 idea |  |
| 0020 | explorer le domaine « stack → toolchain » (cousin de Cap sur l'axe techno) | feature | P2 |  | 💡 idea |  |
| 0029 | Propager les maj *breaking* d'un skill aux projets (pull + hook de drift + migrations datées) | feature | P2 |  | 💡 idea |  |
| 0031 | ezk-reviewer — rôle Reviewer composant code-review + coordination reviewers externes (cumulables) | feature | P2 |  | 💡 idea |  |
| 0051 | ezk-cowork — scaffold + audit du pattern « contrat cowork » (bootstrap mince / guide servi par l'app) | feature | P2 |  | 💡 idea |  |
| 0054 | ezk-dns — automatiser la config DNS chez IONOS via l'API (l'achat reste manuel) | feature | P2 |  | 💡 idea |  |
| 0057 | ezk-challenge — panel de challenge adversarial réutilisable (relecteurs frais + gate) | feature | P2 |  | 💡 idea |  |
| 0062 | article — « Seed AI d'équipe : un contrat d'auto-amélioration auquel la méthode adhère » | feature | P2 |  | 💡 idea |  |
| 0065 | Sprint composition — un sprint peut porter un lot cohérent de fiches ; granularité PR = incrément livrable cohérent | feature | P2 |  | 💡 idea |  |
| 0066 | Tester un skill/agent avant merge — process maison (golden tests + DoR/DoD de skill + gate dry-run) | feature | P2 |  | 💡 idea |  |
| 0067 | ezk-ezk contract-aware — génère un skill/agent + sa carte d'émission séparée (conforme au contrat) | feature | P2 |  | 💡 idea |  |
| 0068 | Règle enforced — la carte de la méthode (method-map) à jour à chaque modif de méthode | feature | P2 |  | 💡 idea |  |
| 0073 | article — donner à l'auto-amélioration la direction scrum (mapper sa méthode sur le vocabulaire officiel) | feature | P2 | 0059 | 💡 idea |  |
| 0075 | Curation des règles de persona/format d'écriture — règles lisibles humain+LLM, l'agent propose des extraits ciblés à valider | feature | P2 |  | 💡 idea |  |
| 0092 | Décomposition légère du backlog — champs depends: et labels: (anti-JIRA) + avenant ADR-0017 | feature | P2 |  | 💡 idea |  |
| 0098 | plan:head — descendre vers l'enfant prêt d'un épic placé dans le plan | feature | P2 |  | 💡 idea |  |
| 0099 | Contrat d'émission — vérifier la STRUCTURE des directives, pas compter les mentions | chore | P2 |  | 💡 idea |  |
| 0100 | Sprint intake — DoR & santé du backlog (combien de features prêtes/pas prêtes, métriques émises pour le monitoring, garde « pas de sprint possible ») | feature | P2 |  | 💡 idea |  |
| 0009 | webapp de config (édite les YAML profiles/bundles) | feature | P3 |  | 💡 idea |  |
| 0033 | Modèle typé interaction/autorité → run / draw / document (substrat génératif) | feature | P3 |  | 💡 idea |  |
| 0034 | Garde-fous d'intégrité/qualité des agents (advisory + enforced) | feature | P3 |  | 💡 idea |  |
| 0074 | article — la loi de Pareto dynamique (rollout à curseur : mesurer d'abord, détailler sur preuve) | feature | P3 | 0059 | 💡 idea |  |
| 0093 | BacklogStore — port de persistance agnostique (md/git · GitHub · Jira…) — IDEA, sur trigger | feature | P3 |  | 💡 idea |  |

> Livrées (`done/`) : 0001, 0002, 0003, 0004, 0005, 0006, 0010, 0013, 0017, 0018, 0019, 0021, 0022, 0023, 0024, 0025, 0026, 0027, 0030, 0032, 0035, 0036, 0037, 0039, 0040, 0041, 0043, 0048, 0049, 0050, 0055, 0056, 0063, 0070, 0071, 0072, 0076, 0078, 0083, 0084, 0085, 0086, 0089, 0097.
