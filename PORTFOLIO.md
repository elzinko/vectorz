# 🗂️ Portfolio Vectorz — vue transverse par produit

> **Vue de LECTURE auto-générée** (`products/mega-city/bin/portfolio.sh`) par-dessus le
> backlog **unique** `features/` (liste unifiée depuis la fiche 0064, ADR-0017 A14),
> regroupé par `product:` (vectorz / cop1 / mega-city). **Ne pas éditer à la main.**
> Source de vérité = le front-matter de chaque fiche ; index du backlog = `features/BACKLOG.md`.

## 🎯 Tirables maintenant (`ready`, tous backlogs confondus)

Les fiches `todo` passées au gate DoR (`ready:`), dans l’ordre de tirage (P0→P3, puis produit, puis id).

| Prod | # | Titre | Type | Prio | Statut | PR |
|------|---|-------|------|------|--------|----|
| mega-city | 20260824185422122 | « Recette » comme artefact de premier rang + gardien (ezk-chef) — instancier le pattern steward, ne rien inventer | feature | P2 | 🔴 todo |  |

## 🟠 En cours (`in-progress`)

| Prod | # | Titre | Type | Prio | Statut | PR |
|------|---|-------|------|------|--------|----|
| mega-city | 0164 | vz-product-builder — product-builder autonome à corpus de reviewers (overlay, n'écrase pas ezk-*) | feature | P1 | 🟠 in-progress |  |
| vectorz | 0030 | MVP démo Desktop — un manager supervisé de bout en bout (mode moniteur pur) | feature | P1 | 🟠 in-progress |  |
| mega-city | 0088 | ezk-archive — ne pas re-vérifier ce que la session appelante a déjà fait (coût de clôture disproportionné) | chore | P2 | 🟠 in-progress |  |

## 📋 Actionnable (todo + blocked, hors idées et épics)

Tri P0→P3, puis produit, puis id. `blocked` inclus (dépendance dure — voir la fiche).

| Prod | # | Titre | Type | Prio | Statut | PR |
|------|---|-------|------|------|--------|----|
| mega-city | 0069 | article — émettre des events en restant fidèle au fonctionnement de Claude Desktop/Code | feature | P1 | 🔴 todo |  |
| mega-city | 0077 | Kit émetteur — hooks Claude Code classe A (émission déterministe) | feature | P1 | 🔴 todo |  |
| mega-city | 0102 | ezk-testbed — démarrer un environnement de test isolé (PR, branche ou local) : une brique autonome, pas un chapitre d'ezk-pr | feature | P1 | ⛔ blocked |  |
| mega-city | 0156 | ezk-marketing — orchestrateur de promotion produit (articles d'épopée, canaux, vidéos) | feature | P1 | 🔴 todo |  |
| mega-city | 0165 | Contrat d'améliorabilité v0.1 — texte, registre des surfaces, kit émetteur, extension ezk-backlog, première boucle fermée (MVP B) | feature | P1 | 🔴 todo |  |
| mega-city | 20260821163346490 | La ligne « L'ASSEMBLAGE » ne montre pas les liens de composition (retour PO) | feature | P1 | 🔴 todo |  |
| mega-city | 20260823121712652 | Modèle de statut kanban — liste de statuts validée par schéma, `ready` devient une colonne | feature | P1 | 🔴 todo |  |
| mega-city | 20260823121712781 | reconcile systématique — ne plus rater un ship après un squash-merge fait hors du flux (GitHub UI) | feature | P1 | 🔴 todo |  |
| mega-city | 20260824061247344 | Refonte « trois étages » — le reliquat exécutable (lot 4b + retouches + options PO) | refactor | P1 | 🔴 todo |  |
| mega-city | 20260825141012293 | ezk-sessions — cockpit de pilotage des sessions Claude Code (worktrees × sessions × branches), avec onglet dans la map | feature | P1 | 🔴 todo |  |
| vectorz | 0050 | Canal de release + pastille de MAJ — dogfooding sûr (version figée par squash-merge, adoption aux jalons upgrade_ok) | feature | P1 | 🔴 todo |  |
| vectorz | 0052 | Socle vertical — port de métrique + 1er adaptateur (couverture) + remontée build PR + silo | feature | P1 | 🔴 todo |  |
| vectorz | 20260813131259846 | Contrat d'améliorabilité — validateur noyau + miroir + chien de garde (surfaces gelées) — gated ADR-030 ratifié | feature | P1 | ⛔ blocked |  |
| mega-city | 0080 | ezk-retro — compte rendu markdown standard de cérémonie (capture versionnée, décisions PO tracées, via PR) | feature | P2 | 🔴 todo |  |
| mega-city | 0096 | build-mcpb.sh fige la version en dur — le bundle installé ne dit pas ce qu'il contient | bug | P2 | 🔴 todo |  |
| mega-city | 0112 | dogfooding — 2 invariants d'évolutivité en règles iamthelaw | feature | P2 | 🔴 todo |  |
| mega-city | 0119 | capture — charger un vrai corpus pour judge (détection de doublon) | feature | P2 | 🔴 todo |  |
| mega-city | 0121 | cap cop1 — matérialiser un profil en config native cop1 | feature | P2 | 🔴 todo |  |
| mega-city | 0147 | ezk-recipy — scanner les repos froids et proposer des fiches de skills | feature | P2 | 🔴 todo |  |
| mega-city | 0162 | adapter BMAD au contrat de supervisabilité — 2ᵉ méthode émettrice (adaptateur→overlay→fork jetable) | feature | P2 | 🔴 todo |  |
| mega-city | 0190 | composes — tier « delegates: » (composition optionnelle, jamais warnée) | feature | P2 | 🔴 todo |  |
| mega-city | 20260816151112162 | Canal commands: dans lawgiver — déployer les slash-commands comme les skills | feature | P2 | 🔴 todo |  |
| mega-city | 20260821210633457 | Explorateur LLM par PR — pilote de siège auto + exploration (suite de l'oracle 0169) | feature | P2 | 🔴 todo |  |
| mega-city | 20260823121712716 | Vues générées — board kanban + historique des décisions relu depuis git (pas dans la fiche) | feature | P2 | 🔴 todo |  |
| mega-city | 20260823121712844 | Durcir regen-backlog — refuser une racine par défaut nichée sous un autre backlog (fin du piège products/mega-city) | bug | P2 | 🔴 todo |  |
| mega-city | 20260823121712909 | lawgiver doctor — détecter un skill du profil non matérialisé dans ~/.claude (le bug /ezk-pr introuvable) | feature | P2 | 🔴 todo |  |
| mega-city | 20260824185422122 | « Recette » comme artefact de premier rang + gardien (ezk-chef) — instancier le pattern steward, ne rien inventer | feature | P2 | 🔴 todo |  |
| mega-city | 20260825160456259 | Proposer les commandes suivantes en fin de sprint/skill (affordance next-step, à la BMAD *help) | feature | P2 | 🔴 todo |  |
| mega-city | 20260825202444647 | ezk-codex fix — répondre en fil ET résoudre TOUS les fils traités (pas seulement décliner) | feature | P2 | 🔴 todo |  |
| vectorz | 0020 | AgentSessionPort — prouver l'indépendance à l'agent (StubExecutor, puis LLM local) | feature | P2 | 🔴 todo |  |
| vectorz | 0024 | résorber la périphérie pré-pivot (ceremony-engine, quality-intelligence) + acter ADR-021/022 | refactor | P2 | 🔴 todo |  |
| vectorz | 0038 | E3 — Pilote natif complet (stories front-matter, exécuteur générique, gate zéro-BMAD) | feature | P2 | ⛔ blocked |  |
| vectorz | 0040 | L2 — Durcir les garde-fous CI (step boundary nommé + allowlist SDK) | chore | P2 | 🔴 todo |  |
| vectorz | 0045 | Moisson du pipeline d'amélioration d'époque 1 (Epics 9+12) — extraire la sémantique avant qu'elle ne se disperse | chore | P2 | 🔴 todo |  |
| mega-city | 0116 | cap — dériver le hook du champ enforcement.hook.script (au lieu du hardcode) | refactor | P3 | 🔴 todo |  |
| mega-city | 0117 | aligner les signatures de domain.ts sur l'implémentation (expand/bind) | chore | P3 | 🔴 todo |  |
| mega-city | 0120 | dette I/O — factoriser resolveInside* (DRY) + couvrir la CLI capture | refactor | P3 | 🔴 todo |  |
| mega-city | 0143 | aligner le nommage des modes tokens du product-builder (lean\|cap\|full partout) | chore | P3 | 🔴 todo |  |
| mega-city | 0151 | ezk-product-build — briefing au démarrage (comment je travaille, avec quelles règles) | feature | P3 | 🔴 todo |  |
| mega-city | 20260813122510737 | ezk-backlog init.sh — le marqueur layout_version doit primer sur la détection legacy « Index auto-généré » | bug | P3 | 🔴 todo |  |
| vectorz | 0007 | Format de session log + discipline de commit (anchor réel) | chore | P3 | 🔴 todo |  |
| vectorz | 0017 | E2E Playwright — dark-mode cobaye (post-FEAT-S1) | chore | P3 | ⛔ blocked |  |
| vectorz | 0018 | Câbler DoDLimiter (N rejets DoD → blocked + escalade) | feature | P3 | ⛔ blocked |  |
| vectorz | 0028 | Policy de siège — l'auto-continue configurable sur signaux typés | feature | P3 | 🔴 todo |  |
| vectorz | 0029 | Contrat de supervisabilité v0.2 — les différés du gel v0.1 (multi-piste, anti-surplace) | chore | P3 | 🔴 todo |  |
| vectorz | 0046 | Différés du contrat d'améliorabilité — parking gated « après boucles réelles » | chore | P3 | 🔴 todo |  |

## 🧭 Épics (jamais tirables — tirer leurs enfants ready)

| Prod | # | Titre | Type | Prio | Statut | PR |
|------|---|-------|------|------|--------|----|
| vectorz | 0034 | Mise à plat post-pivot — aligner Vectorz/cop1 sur ADR-021→028 (épic) | epic | P0 | 🔴 todo |  |
| mega-city | 20260813124026215 | Déployer (et retirer) la méthode ezk LLM-native dans un projet cible — épic de cadrage (à la bmad) | epic | P1 | 💡 idea |  |
| mega-city | 20260816131703334 | Épic — Rationalisation doc + découvrabilité (produit OSS de niveau pro) | epic | P1 | 🔴 todo |  |
| mega-city | 20260821163346487 | Épic — La carte de la méthode : fidèle aux fichiers, et revue morceau par morceau | epic | P1 | 💡 idea |  |
| mega-city | 20260824060737115 | Épic — Marketing & site (orchestrateur, landing, recette site) | epic | P1 | 🔴 todo |  |
| vectorz | 0051 | Observabilité qualité produit — mesurer, historiser et analyser la qualité des logiciels fabriqués (par PR) (épic) | epic | P1 | 🔴 todo |  |
| mega-city | 0163 | série d'articles REX — migrer des méthodes existantes vers le contrat de supervisabilité | epic | P2 | 🔴 todo |  |
| mega-city | 20260813131737959 | Rationalisation & cohérence de la méthode mega-city — audit → chantiers (épic) | epic | P2 | 🔴 todo |  |
| mega-city | 20260815080413884 | DoR agent-native — extensible par projet + readiness observable (épic) | epic | P2 | 🔴 todo |  |

## 💡 Idées (non groomées, hors flux P0→P3)

| Prod | # | Titre | Type | Prio | Statut | PR |
|------|---|-------|------|------|--------|----|
| mega-city | 0081 | Carnet de préparation de rétro — chaque session note ses sujets (par config), la rétro n'oublie plus rien | feature | P1 | 💡 idea |  |
| mega-city | 0087 | Distribuer le catalogue vectorz en plugin Claude Code (cap plugin + marketplace + versionnage) | feature | P1 | 💡 idea |  |
| mega-city | 0157 | ezk-landing — skill de création de landing pages pro FR/EN (patrons réutilisés) | feature | P1 | 💡 idea |  |
| mega-city | 20260812104022237 | Tracer la session/branche responsable d'une PR — une PR = une seule session (éviter le double-travail) | feature | P1 | 💡 idea |  |
| mega-city | 20260812104022240 | Rationalisation du backlog — regrouper/splitter (épics/stories) via tags : mode script + mode analyse LLM | feature | P1 | 💡 idea |  |
| mega-city | 20260812104022246 | Composition comportementale des skills ezk — directives composables (format imposé, appels de commandes forcés) | feature | P1 | 💡 idea |  |
| mega-city | 20260821163346493 | Chaque élément de la carte cite le fichier d'où il sort (fin de l'interprétation) | feature | P1 | 💡 idea |  |
| mega-city | 20260821172716537 | La carte ne montre pas LA LOI de l'intérieur (règles, bundles, profils — et qui les lit) | feature | P1 | 💡 idea |  |
| mega-city | 20260821204737357 | Câbler la méthode par un modèle compilé, pas 30 frontmatter — et ce que BMAD apprend | feature | P1 | 💡 idea |  |
| mega-city | 20260824111001836 | La règle de clarté doit atteindre TOUT ce qui sort de la méthode (base + sorties de chat), pas rester orpheline | refactor | P1 | 💡 idea |  |
| mega-city | 20260824122629794 | Capitaliser une feature déjà codée en « recette » réutilisable (tâches + rules/profils) — l'extraction n'existe PAS encore | feature | P1 | 💡 idea |  |
| mega-city | 20260824122629925 | Onglet FAQ « comment faire » — ancrer une bonne fois les questions récurrentes du PO | feature | P1 | 💡 idea |  |
| mega-city | 20260824204751403 | Méthode de préparation — lotir les features en versions (milestones) & contrôler la cohérence d'un lot, au-dessus du sprint | feature | P1 | 💡 idea |  |
| mega-city | 0066 | Tester un skill/agent avant merge — process maison (golden tests + DoR/DoD de skill + gate dry-run) | feature | P2 | 💡 idea |  |
| mega-city | 0067 | ezk-ezk contract-aware — génère un skill/agent + sa carte d'émission séparée (conforme au contrat) | feature | P2 | 💡 idea |  |
| mega-city | 0073 | article — donner à l'auto-amélioration la direction scrum (mapper sa méthode sur le vocabulaire officiel) | feature | P2 | 💡 idea |  |
| mega-city | 0075 | Curation des règles de persona/format d'écriture — règles lisibles humain+LLM, l'agent propose des extraits ciblés à valider | feature | P2 | 💡 idea |  |
| mega-city | 0098 | plan:head — descendre vers l'enfant prêt d'un épic placé dans le plan | feature | P2 | 💡 idea |  |
| mega-city | 0099 | Contrat d'émission — vérifier la STRUCTURE des directives, pas compter les mentions | chore | P2 | 💡 idea |  |
| mega-city | 0100 | Sprint intake — DoR & santé du backlog (combien de features prêtes/pas prêtes, métriques émises pour le monitoring, garde « pas de sprint possible ») | feature | P2 | 💡 idea |  |
| mega-city | 0125 | explorer le domaine « stack → toolchain » (cousin de Cap sur l'axe techno) | feature | P2 | 💡 idea |  |
| mega-city | 0155 | ezk-cowork — scaffold + audit du pattern « contrat cowork » (bootstrap mince / guide servi par l'app) | feature | P2 | 💡 idea |  |
| mega-city | 0158 | ezk-dns — automatiser la config DNS chez IONOS via l'API (l'achat reste manuel) | feature | P2 | 💡 idea |  |
| mega-city | 0161 | ezk-challenge — panel de challenge adversarial réutilisable (relecteurs frais + gate) | feature | P2 | 💡 idea |  |
| mega-city | 0166 | article — « Seed AI d'équipe : un contrat d'auto-amélioration auquel la méthode adhère » | feature | P2 | 💡 idea |  |
| mega-city | 0171 | Adapter GitHub Issues (push-only, config-gated) — projection du backlog md, pas SoT | feature | P2 | 💡 idea |  |
| mega-city | 0174 | ezk-issues — intake GitHub (analyse, PR fix/feature md opt-in, coût local) | feature | P2 | 💡 idea |  |
| mega-city | 0175 | article — Skema : versionner une skill LLM avec des migrations markdown | feature | P2 | 💡 idea |  |
| mega-city | 0177 | Pack de pratiques projet — capacités portables indépendantes du skill/LLM driver | feature | P2 | 💡 idea |  |
| mega-city | 0178 | ezk-checks — recette manuelle déclenchable (Playwright → features/checks/) | feature | P2 | 💡 idea |  |
| mega-city | 0186 | Skema généralisé — versioning + migrations de tout artefact mega-city (émission · registre de bind · consommation) | feature | P2 | 💡 idea |  |
| mega-city | 0188 | ADR lisibles comme des articles — format unique, article dérivé, ou règle ? (à groomer archi + brainstorm) | feature | P2 | 💡 idea |  |
| mega-city | 0189 | ezk-archive — le handoff doit survivre aux sessions éphémères (cloud/conteneur jetable) | bug | P2 | 💡 idea |  |
| mega-city | 20260812104022228 | Capturer des screenshots du produit et les injecter dans la doc/le site quand l'UI change | feature | P2 | 💡 idea |  |
| mega-city | 20260812104022231 | DoR — balayer les surfaces produit impactées (doc, site, release notes…) au grooming | feature | P2 | 💡 idea |  |
| mega-city | 20260812104022243 | groom appelle aussi engineering:architecture (+ product-brainstorming) — par défaut, ou forcé par paramètre | feature | P2 | 💡 idea |  |
| mega-city | 20260813095351680 | bind-global copy non idempotent pour les agents (2e passage refusé) | bug | P2 | 💡 idea |  |
| mega-city | 20260813095351681 | Cap projet claude-code — skills en forme dossier pour porter les assets | feature | P2 | 💡 idea |  |
| mega-city | 20260813131737962 | Nommage & catalogue — aligner sur ADR-0022 (rename ezk-pr-pilot→ezk-pr, ranger vz-/supervision-) + README table scannable | refactor | P2 | 💡 idea |  |
| mega-city | 20260813131737971 | Carte des rôles d'analyse — documenter retro / steward / 0057 (+ trancher le juge unique) en un seul endroit | feature | P2 | 💡 idea |  |
| mega-city | 20260815080414006 | DoR extensible par projet — base 3+1 + manifeste de slots par repo, lu par groom/ready | feature | P2 | 💡 idea |  |
| mega-city | 20260816194833618 | Santé des dépendances côté ezk — audit local activable par profil (alternative frugale à Dependabot) | feature | P2 | 💡 idea |  |
| mega-city | 20260817113353538 | Étude prior-art BMAD (templates + elicitation) — ce qui se transpose à une méthode LLM-native | chore | P2 | 💡 idea |  |
| mega-city | 20260817113353676 | Article « Templates de réponse adaptés aux LLM » (via ezk-article) | feature | P2 | 💡 idea |  |
| mega-city | 20260818185931307 | Capability de vente LemonSqueezy (checkout + licence + entitlement) — récoltée de muti, réutilisable | feature | P2 | 💡 idea |  |
| mega-city | 20260821163346496 | Définir ce qu'on valide et dans quel ordre (l'unité de revue de la carte) | feature | P2 | 💡 idea |  |
| mega-city | 20260821163346498 | Montrer sur la carte ce qui est revu, en cours, ou jamais vérifié (+ date) | feature | P2 | 💡 idea |  |
| mega-city | 20260821163346501 | Corriger un lien faux depuis la carte, et que ça retombe dans les fichiers | feature | P2 | 💡 idea |  |
| mega-city | 20260821171238990 | Capability launchpad (landing + waitlist + tracking) — récoltée de city-guided, réutilisable pour valider un produit | feature | P2 | 💡 idea |  |
| mega-city | 20260821172716540 | Recette « site produit » — un skill + des règles activables (cas samplerz) | feature | P2 | 💡 idea |  |
| mega-city | 20260821210633522 | Article — les tests vérifient des réponses déjà posées, le LLM pose les questions | feature | P2 | 💡 idea |  |
| mega-city | 20260822200213110 | Règle — une page (vitrine/landing/capture) construite par un skill utilise des screenshots réels de l'app, jamais des visuels générés | feature | P2 | 💡 idea |  |
| mega-city | 20260823124042708 | LA LOI — distinguer thèmes (namespaces) et bundles (packs curated), désenchevêtrer hexagonal | refactor | P2 | 💡 idea |  |
| mega-city | 20260824141336516 | Recette « mise en place de la CI » pour un projet type muti (app desktop + web de vente) — build local (act) et/ou GitHub | feature | P2 | 💡 idea |  |
| mega-city | 20260824163426298 | Consolider ezk-device + ezk-preview + ezk-testbed (0102) — nouvelle sémantique post-refactoring « map » | refactor | P2 | 💡 idea |  |
| mega-city | 20260825024356665 | Comparateur `analyze --expect` en sous-séquence — tolérer les events non déclarés (sessions live, briques 2/3) | feature | P2 | 💡 idea |  |
| mega-city | 20260825161522791 | Elicitation — boucle de raffinement structurée dans groom (à la BMAD advanced-elicitation) | feature | P2 | 💡 idea |  |
| mega-city | 20260825182327490 | Pattern « livrable lisible » — template + extracteur scripté + rendu LLM (généraliser handoff / PR / rapport) | feature | P2 | 💡 idea |  |
| vectorz | 0043 | article — « Self-hosting : le jour où cop1 développera cop1 » (dogfooding → self-hosting → RSI) | feature | P2 | 💡 idea |  |
| vectorz | 0053 | Gate DoD adossé à une métrique — bloquer une PR si un seuil qualité n'est pas tenu | feature | P2 | 💡 idea |  |
| vectorz | 0054 | Catalogue d'adaptateurs — ajouter un outil de métrique sans réinventer la roue | feature | P2 | 💡 idea |  |
| vectorz | 0055 | KPI agrégés — rollups commit → PR → sprint → version depuis le silo | feature | P2 | 💡 idea |  |
| vectorz | 0056 | Visualisation — onglet « qualité par PR » dans mission-control | feature | P2 | 💡 idea |  |
| vectorz | 0058 | Rapport qualité de PR — les métriques et le résumé du test visibles dans chaque PR | feature | P2 | 💡 idea |  |
| vectorz | 0180 | Fiches datées — id AAAAMMDDHHMMSSmmm (17 ch., ms, UTC) à la capture, fin de max+1 | feature | P2 | 💡 idea |  |
| mega-city | 0074 | article — la loi de Pareto dynamique (rollout à curseur : mesurer d'abord, détailler sur preuve) | feature | P3 | 💡 idea |  |
| mega-city | 0093 | BacklogStore — port de persistance agnostique (md/git · GitHub · Jira…) — IDEA, sur trigger | feature | P3 | 💡 idea |  |
| mega-city | 0114 | webapp de config (édite les YAML profiles/bundles) | feature | P3 | 💡 idea |  |
| mega-city | 20260812100258610 | testbed dogfood LLM headless — rejouer la chaîne méthode→journal→Moniteur sans humain (nightly) | feature | P3 | 💡 idea |  |
| mega-city | 20260813122619707 | Robustesse du groupage skill-dir en matérialisation (marqueur SKILL.md ambigu) | bug | P3 | 💡 idea |  |
| mega-city | 20260821163346503 | La méthode s'auto-évalue : sa cohérence, et la fidélité de sa représentation | feature | P3 | 💡 idea |  |
| vectorz | 0047 | Migration réflexive — quand le produit se teste lui-même, la migration devient un problème réflexif (→ ADR + article) | feature | P3 | 💡 idea |  |
| vectorz | 0049 | article — « Brancher une méthode qu'on ne possède pas : le pattern sidecar » (ADR-032, cas BMAD) | feature | P3 | 💡 idea |  |
| vectorz | 0057 | Agent d'analyse de la méthode — lit les KPI et propose des améliorations (gate PO) [nord/parking] | feature | P3 | 💡 idea |  |

## 📊 Compteurs (déterministes)

| Produit | Total | 🔴 todo (ready) | 🟠 in-prog | ⛔ blocked | 💡 idea | 🧭 épics |
|---------|-------|-----------------|-----------|-----------|---------|---------|
| vectorz | 27 | 10 (0) | 1 | 4 | 10 | 2 |
| mega-city | 105 | 31 (1) | 2 | 1 | 64 | 7 |

> Ne compte pas les fiches livrées (`done/`) — voir chaque `BACKLOG.md` de backlog pour l’historique.
