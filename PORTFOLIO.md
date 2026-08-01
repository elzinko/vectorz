# 🗂️ Portfolio Vectorz — vue transverse des deux backlogs

> **Vue de LECTURE auto-générée** (`products/mega-city/bin/portfolio.sh`) par-dessus les
> deux backlogs, qui restent séparés (ADR-0017 A13) : `features/` (vectorz/cop1) et
> `products/mega-city/features/` (méthode). **Ne pas éditer à la main.** Source de vérité =
> le front-matter de chaque fiche ; chaque backlog garde son index propre (`BACKLOG.md`).

## 🎯 Tirables maintenant (`ready`, tous backlogs confondus)

Les fiches `todo` passées au gate DoR (`ready:`), dans l’ordre de tirage (P0→P3, puis produit, puis id).

| Prod | # | Titre | Type | Prio | Statut | PR |
|------|---|-------|------|------|--------|----|
| vectorz | 0041 | Cobaye — banc de test rapide (manuel + e2e Pareto) pour sécuriser les devs | chore | P1 | 🔴 todo |  |
| vectorz | 0044 | Mesureur d'outcomes métier + script d'append — l'évaluateur d'abord (contrat d'améliorabilité, MVP A) | chore | P1 | 🔴 todo |  |

## 🟠 En cours (`in-progress`)

| Prod | # | Titre | Type | Prio | Statut | PR |
|------|---|-------|------|------|--------|----|
| vectorz | 0030 | MVP démo Desktop — un manager supervisé de bout en bout (mode moniteur pur) | feature | P1 | 🟠 in-progress |  |
| vectorz | 0164 | vz-product-builder — product-builder autonome à corpus de reviewers (overlay, n'écrase pas ezk-*) | feature | P1 | 🟠 in-progress |  |
| vectorz | 0088 | ezk-archive — ne pas re-vérifier ce que la session appelante a déjà fait (coût de clôture disproportionné) | chore | P2 | 🟠 in-progress |  |

## 📋 Actionnable (todo + blocked, hors idées et épics)

Tri P0→P3, puis produit, puis id. `blocked` inclus (dépendance dure — voir la fiche).

| Prod | # | Titre | Type | Prio | Statut | PR |
|------|---|-------|------|------|--------|----|
| vectorz | 0105 | Bug dogfood — Moniteur « Silence prolongé » / produit inutilisable après run_start seul | bug | P0 | 🔴 todo |  |
| vectorz | 0041 | Cobaye — banc de test rapide (manuel + e2e Pareto) pour sécuriser les devs | chore | P1 | 🔴 todo |  |
| vectorz | 0044 | Mesureur d'outcomes métier + script d'append — l'évaluateur d'abord (contrat d'améliorabilité, MVP A) | chore | P1 | 🔴 todo |  |
| vectorz | 0050 | Canal de release + pastille de MAJ — dogfooding sûr (version figée par squash-merge, adoption aux jalons upgrade_ok) | feature | P1 | 🔴 todo |  |
| vectorz | 0052 | Socle vertical — port de métrique + 1er adaptateur (couverture) + remontée build PR + silo | feature | P1 | 🔴 todo |  |
| vectorz | 0069 | article — émettre des events en restant fidèle au fonctionnement de Claude Desktop/Code | feature | P1 | 🔴 todo |  |
| vectorz | 0077 | Kit émetteur — hooks Claude Code classe A (émission déterministe) | feature | P1 | 🔴 todo |  |
| vectorz | 0102 | ezk-testbed — démarrer un environnement de test isolé (PR, branche ou local) : une brique autonome, pas un chapitre d'ezk-pr-pilot | feature | P1 | ⛔ blocked |  |
| vectorz | 0149 | formaliser la composition inter-skills (composes) | feature | P1 | 🔴 todo |  |
| vectorz | 0156 | ezk-marketing — orchestrateur de promotion produit (articles d'épopée, canaux, vidéos) | feature | P1 | 🔴 todo |  |
| vectorz | 0165 | Contrat d'améliorabilité v0.1 — texte, registre des surfaces, kit émetteur, extension ezk-backlog, première boucle fermée (MVP B) | feature | P1 | 🔴 todo |  |
| vectorz | 0169 | Explorateur LLM par PR — parcourir l'app pour trouver les trous, et proposer la fiche | feature | P1 | 🔴 todo |  |
| vectorz | 0020 | AgentSessionPort — prouver l'indépendance à l'agent (StubExecutor, puis LLM local) | feature | P2 | 🔴 todo |  |
| vectorz | 0022 | mission-control — afficher ce qui est déjà collecté (heure, durée, agent, historique, $) | feature | P2 | 🔴 todo |  |
| vectorz | 0024 | résorber la périphérie pré-pivot (ceremony-engine, quality-intelligence) + acter ADR-021/022 | refactor | P2 | 🔴 todo |  |
| vectorz | 0038 | E3 — Pilote natif complet (stories front-matter, exécuteur générique, gate zéro-BMAD) | feature | P2 | ⛔ blocked |  |
| vectorz | 0040 | L2 — Durcir les garde-fous CI (step boundary nommé + allowlist SDK) | chore | P2 | 🔴 todo |  |
| vectorz | 0045 | Moisson du pipeline d'amélioration d'époque 1 (Epics 9+12) — extraire la sémantique avant qu'elle ne se disperse | chore | P2 | 🔴 todo |  |
| vectorz | 0060 | Les deux docs d'installation ont décroché de main (checklist démo + guide web UI) | bug | P2 | 🔴 todo |  |
| vectorz | 0080 | ezk-retro — compte rendu markdown standard de cérémonie (capture versionnée, décisions PO tracées, via PR) | feature | P2 | 🔴 todo |  |
| vectorz | 0096 | build-mcpb.sh fige la version en dur — le bundle installé ne dit pas ce qu'il contient | bug | P2 | 🔴 todo |  |
| vectorz | 0101 | Câbler check-links.sh — un contrôle que personne ne lance ne protège de rien | chore | P2 | 🔴 todo |  |
| vectorz | 0112 | dogfooding — 2 invariants d'évolutivité en règles iamthelaw | feature | P2 | 🔴 todo |  |
| vectorz | 0119 | capture — charger un vrai corpus pour judge (détection de doublon) | feature | P2 | 🔴 todo |  |
| vectorz | 0121 | cap cop1 — matérialiser un profil en config native cop1 | feature | P2 | ⛔ blocked |  |
| vectorz | 0147 | ezk-recipy — scanner les repos froids et proposer des fiches de skills | feature | P2 | 🔴 todo |  |
| vectorz | 0150 | ezk-dev — le rôle est un agent, la méthode (TDD) est une rule de profil | refactor | P2 | 🔴 todo |  |
| vectorz | 0152 | ezk-bug — skill d'intake/cadrage d'un bug signalé : repro (Playwright MCP partagé) → fiche backlog | feature | P2 | 🔴 todo |  |
| vectorz | 0162 | adapter BMAD au contrat de supervisabilité — 2ᵉ méthode émettrice (adaptateur→overlay→fork jetable) | feature | P2 | 🔴 todo |  |
| vectorz | 0007 | Format de session log + discipline de commit (anchor réel) | chore | P3 | 🔴 todo |  |
| vectorz | 0017 | E2E Playwright — dark-mode cobaye (post-FEAT-S1) | chore | P3 | ⛔ blocked |  |
| vectorz | 0018 | Câbler DoDLimiter (N rejets DoD → blocked + escalade) | feature | P3 | ⛔ blocked |  |
| vectorz | 0028 | Policy de siège — l'auto-continue configurable sur signaux typés | feature | P3 | 🔴 todo |  |
| vectorz | 0029 | Contrat de supervisabilité v0.2 — les différés du gel v0.1 (multi-piste, anti-surplace) | chore | P3 | 🔴 todo |  |
| vectorz | 0046 | Différés du contrat d'améliorabilité — parking gated « après boucles réelles » | chore | P3 | 🔴 todo |  |
| vectorz | 0113 | chief-judge — juge de cohérence (avis, non bloquant) | feature | P3 | 🔴 todo |  |
| vectorz | 0116 | cap — dériver le hook du champ enforcement.hook.script (au lieu du hardcode) | refactor | P3 | 🔴 todo |  |
| vectorz | 0117 | aligner les signatures de domain.ts sur l'implémentation (expand/bind) | chore | P3 | 🔴 todo |  |
| vectorz | 0120 | dette I/O — factoriser resolveInside* (DRY) + couvrir la CLI capture | refactor | P3 | 🔴 todo |  |
| vectorz | 0143 | aligner le nommage des modes tokens du product-builder (lean\|cap\|full partout) | chore | P3 | 🔴 todo |  |
| vectorz | 0151 | ezk-product-builder — briefing au démarrage (comment je travaille, avec quelles règles) | feature | P3 | 🔴 todo |  |

## 🧭 Épics (jamais tirables — tirer leurs enfants ready)

| Prod | # | Titre | Type | Prio | Statut | PR |
|------|---|-------|------|------|--------|----|
| vectorz | 0034 | Mise à plat post-pivot — aligner Vectorz/cop1 sur ADR-021→028 (épic) | epic | P0 | 🔴 todo |  |
| vectorz | 0051 | Observabilité qualité produit — mesurer, historiser et analyser la qualité des logiciels fabriqués (par PR) (épic) | epic | P1 | 🔴 todo |  |
| vectorz | 0163 | série d'articles REX — migrer des méthodes existantes vers le contrat de supervisabilité | epic | P2 | 🔴 todo |  |

## 💡 Idées (non groomées, hors flux P0→P3)

| Prod | # | Titre | Type | Prio | Statut | PR |
|------|---|-------|------|------|--------|----|
| vectorz | 0090 | Cohérence de sprint — garde-fou d'ouverture (lecture) + verrou de sprint adapté LLM (écriture) | feature | P0 | 💡 idea |  |
| vectorz | 0091 | Mise à plat du backlog — carte lisible + glossaire du jargon (dogfood du format) | chore | P0 | 💡 idea |  |
| vectorz | 0081 | Carnet de préparation de rétro — chaque session note ses sujets (par config), la rétro n'oublie plus rien | feature | P1 | 💡 idea |  |
| vectorz | 0087 | Distribuer le catalogue vectorz en plugin Claude Code (cap plugin + marketplace + versionnage) | feature | P1 | 💡 idea |  |
| vectorz | 0133 | ADR + diagramme — carte rôles dev → skills/agents ezk-* | feature | P1 | 💡 idea |  |
| vectorz | 0157 | ezk-landing — skill de création de landing pages pro FR/EN (patrons réutilisés) | feature | P1 | 💡 idea |  |
| vectorz | 0170 | Concevoir le modèle d'extension / plugin mega-city (panel architecte) — avant tout adaptateur outillage | feature | P1 | 💡 idea |  |
| vectorz | 0043 | article — « Self-hosting : le jour où cop1 développera cop1 » (dogfooding → self-hosting → RSI) | feature | P2 | 💡 idea |  |
| vectorz | 0053 | Gate DoD adossé à une métrique — bloquer une PR si un seuil qualité n'est pas tenu | feature | P2 | 💡 idea |  |
| vectorz | 0054 | Catalogue d'adaptateurs — ajouter un outil de métrique sans réinventer la roue | feature | P2 | 💡 idea |  |
| vectorz | 0055 | KPI agrégés — rollups commit → PR → sprint → version depuis le silo | feature | P2 | 💡 idea |  |
| vectorz | 0056 | Visualisation — onglet « qualité par PR » dans mission-control | feature | P2 | 💡 idea |  |
| vectorz | 0058 | Rapport qualité de PR — les métriques et le résumé du test visibles dans chaque PR | feature | P2 | 💡 idea |  |
| vectorz | 0062 | Onglet « Projets » dans le Moniteur — portefeuille par projet (méthode+version, localisation, statut) cliquable vers son activité | feature | P2 | 💡 idea |  |
| vectorz | 0063 | Ancrer un projet depuis le Moniteur — bouton « ajouter projet » + sélection de dossier + install via le daemon (2 modes) | feature | P2 | 💡 idea |  |
| vectorz | 0065 | Sprint composition — un sprint peut porter un lot cohérent de fiches ; granularité PR = incrément livrable cohérent | feature | P2 | 💡 idea |  |
| vectorz | 0066 | Tester un skill/agent avant merge — process maison (golden tests + DoR/DoD de skill + gate dry-run) | feature | P2 | 💡 idea |  |
| vectorz | 0067 | ezk-ezk contract-aware — génère un skill/agent + sa carte d'émission séparée (conforme au contrat) | feature | P2 | 💡 idea |  |
| vectorz | 0068 | Règle enforced — la carte de la méthode (method-map) à jour à chaque modif de méthode | feature | P2 | 💡 idea |  |
| vectorz | 0073 | article — donner à l'auto-amélioration la direction scrum (mapper sa méthode sur le vocabulaire officiel) | feature | P2 | 💡 idea |  |
| vectorz | 0075 | Curation des règles de persona/format d'écriture — règles lisibles humain+LLM, l'agent propose des extraits ciblés à valider | feature | P2 | 💡 idea |  |
| vectorz | 0092 | Décomposition légère du backlog — champs depends: et labels: (anti-JIRA) + avenant ADR-0017 | feature | P2 | 💡 idea |  |
| vectorz | 0098 | plan:head — descendre vers l'enfant prêt d'un épic placé dans le plan | feature | P2 | 💡 idea |  |
| vectorz | 0099 | Contrat d'émission — vérifier la STRUCTURE des directives, pas compter les mentions | chore | P2 | 💡 idea |  |
| vectorz | 0100 | Sprint intake — DoR & santé du backlog (combien de features prêtes/pas prêtes, métriques émises pour le monitoring, garde « pas de sprint possible ») | feature | P2 | 💡 idea |  |
| vectorz | 0125 | explorer le domaine « stack → toolchain » (cousin de Cap sur l'axe techno) | feature | P2 | 💡 idea |  |
| vectorz | 0134 | Propager les maj *breaking* d'un skill aux projets (pull + hook de drift + migrations datées) | feature | P2 | 💡 idea |  |
| vectorz | 0136 | ezk-reviewer — rôle Reviewer composant code-review + coordination reviewers externes (cumulables) | feature | P2 | 💡 idea |  |
| vectorz | 0155 | ezk-cowork — scaffold + audit du pattern « contrat cowork » (bootstrap mince / guide servi par l'app) | feature | P2 | 💡 idea |  |
| vectorz | 0158 | ezk-dns — automatiser la config DNS chez IONOS via l'API (l'achat reste manuel) | feature | P2 | 💡 idea |  |
| vectorz | 0161 | ezk-challenge — panel de challenge adversarial réutilisable (relecteurs frais + gate) | feature | P2 | 💡 idea |  |
| vectorz | 0166 | article — « Seed AI d'équipe : un contrat d'auto-amélioration auquel la méthode adhère » | feature | P2 | 💡 idea |  |
| vectorz | 0171 | Adapter GitHub Issues (push-only, config-gated) — projection du backlog md, pas SoT | feature | P2 | 💡 idea |  |
| vectorz | 0172 | Convention SoT backlog — fiches md = maître ; GitHub = export (hygiène process) | chore | P2 | 💡 idea |  |
| vectorz | 0174 | ezk-issues — intake GitHub (analyse, PR fix/feature md opt-in, coût local) | feature | P2 | 💡 idea |  |
| vectorz | 0175 | article — Skema : versionner une skill LLM avec des migrations markdown | feature | P2 | 💡 idea |  |
| vectorz | 0042 | Inventaire — idées historiques cop1 réutilisables dans le paradigme vectorz (icebox) | feature | P3 | 💡 idea |  |
| vectorz | 0047 | Migration réflexive — quand le produit se teste lui-même, la migration devient un problème réflexif (→ ADR + article) | feature | P3 | 💡 idea |  |
| vectorz | 0049 | article — « Brancher une méthode qu'on ne possède pas : le pattern sidecar » (ADR-032, cas BMAD) | feature | P3 | 💡 idea |  |
| vectorz | 0057 | Agent d'analyse de la méthode — lit les KPI et propose des améliorations (gate PO) [nord/parking] | feature | P3 | 💡 idea |  |
| vectorz | 0074 | article — la loi de Pareto dynamique (rollout à curseur : mesurer d'abord, détailler sur preuve) | feature | P3 | 💡 idea |  |
| vectorz | 0093 | BacklogStore — port de persistance agnostique (md/git · GitHub · Jira…) — IDEA, sur trigger | feature | P3 | 💡 idea |  |
| vectorz | 0114 | webapp de config (édite les YAML profiles/bundles) | feature | P3 | 💡 idea |  |
| vectorz | 0138 | Modèle typé interaction/autorité → run / draw / document (substrat génératif) | feature | P3 | 💡 idea |  |
| vectorz | 0139 | Garde-fous d'intégrité/qualité des agents (advisory + enforced) | feature | P3 | 💡 idea |  |

## 📊 Compteurs (déterministes)

| Produit | Total | 🔴 todo (ready) | 🟠 in-prog | ⛔ blocked | 💡 idea | 🧭 épics |
|---------|-------|-----------------|-----------|-----------|---------|---------|
| vectorz | 92 | 36 (2) | 3 | 5 | 45 | 3 |
| mega-city | 0 | 0 (0) | 0 | 0 | 0 | 0 |

> Ne compte pas les fiches livrées (`done/`) — voir chaque `BACKLOG.md` de backlog pour l’historique.
