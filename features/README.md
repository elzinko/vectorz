# Backlog — mega-city

> Index auto-généré (`/ezk-backlog regen`) — **ne pas éditer à la main**. Source de vérité = le front-matter de chaque fiche.
> 1 fiche / sujet · 1 PR / feature · backlog commité sur `main`. Statuts : 💡 idea · 🔴 todo · 🟠 in-progress · ⛔ blocked · ✅ shipped.

| # | Titre | Type | Prio | Statut | PR |
|---|-------|------|------|--------|----|
| 0001 | lawgiver `bind` — cap claude-code (MVP déterministe) | feature | P0 | ✅ shipped | local |
| 0010 | bind — fusion non-destructive (intention + bloc managé) au lieu d'écraser | feature | P0 | ✅ shipped | local |
| 0017 | cap global — matérialiser un profil dans ~/.claude (porte source-unique) | feature | P0 | ✅ shipped | local |
| 0002 | lawgiver `capture` — flywheel | feature | P1 | ✅ shipped | local |
| 0003 | cap claude-desktop — continuer à charger les skills | feature | P1 | 🔴 todo | |
| 0004 | migrer ezk-commits → skills/ (pilote plomberie ADR-0006) | chore | P1 | ✅ shipped | local |
| 0013 | capture — câbler une interaction/competence dans le frontmatter d'un agent | feature | P1 | ✅ shipped | local |
| 0018 | coquille I/O — mode link vs copy (symlink live-update) | feature | P1 | ✅ shipped | local |
| 0019 | migrer + étendre ezk-design-system (UI/UX consultable + requêtable) | feature | P1 | ✅ shipped | local |
| 0024 | Migration claude-skills → mega-city — finir le strangler-fig (skills + agents restants) | chore | P1 | ✅ shipped | local |
| 0025 | cap global mode link — symlinker AUSSI les agents (pas seulement les skills) | bug | P1 | ✅ shipped | local |
| 0005 | remote + licence (backup + base OSS) | chore | P2 | 🔴 todo | |
| 0006 | migrer les rulesets iamthelaw → rules/ + bundles/ | chore | P2 | 🔴 todo | |
| 0007 | dogfooding — 2 invariants d'évolutivité en règles iamthelaw | feature | P2 | 🔴 todo | |
| 0011 | cap — dériver le hook du champ enforcement.hook.script | refactor | P2 | 🔴 todo | |
| 0014 | capture — charger un vrai corpus pour judge (détection de doublon) | feature | P2 | 🔴 todo | |
| 0016 | cap cop1 — matérialiser un profil en config native cop1 | feature | P2 | 🔴 todo | |
| 0020 | explorer le domaine « stack → toolchain » (cousin de Cap, axe techno) | feature | P2 | 🔴 todo | |
| 0021 | ezk-ezk — méta-skill : créer un skill depuis la session | feature | P2 | ✅ shipped | local |
| 0022 | ezk-backlog add — proposer un brainstorm pour façonner une fiche vague | feature | P2 | ✅ shipped | local |
| 0023 | ezk-product-builder — couche product-owner autonome (idée → backlog → ezk-sprint → ship) | feature | P2 | ✅ shipped | local |
| 0026 | ezk-archive persiste la note de handoff dans .claude/handoff.md | feature | P2 | ✅ shipped | local |
| 0008 | chief-judge — juge de cohérence (avis) | feature | P3 | 🔴 todo | |
| 0009 | webapp de config (édite les YAML profiles/bundles) | feature | P3 | 🔴 todo | |
| 0012 | aligner les signatures de domain.ts sur l'implémentation | chore | P3 | 🔴 todo | |
| 0015 | dette I/O — factoriser resolveInside* (DRY) + couvrir la CLI capture | refactor | P3 | 🔴 todo | |

### 💡 Idées (non groomées)

> Directions/questions capturées mais **pas encore actionnables** (hors flux P0→P3). Le grooming les promeut en `todo`.

| # | Titre | Type | Prio | Statut | PR |
|---|-------|------|------|--------|----|
| 0028 | ADR + diagramme — carte rôles dev → skills/agents ezk-* | feature | P1 | 💡 idea | |
| 0029 | Propager les maj *breaking* d'un skill aux projets (pull + hook de drift + migrations datées) | feature | P2 | 💡 idea | |
| 0030 | Renommer l'agent ezk-tdd → ezk-dev (TDD = capacité du dev, pas un rôle) | refactor | P2 | 💡 idea | |
| 0031 | ezk-reviewer — rôle Reviewer composant code-review + coordination reviewers externes | feature | P2 | 💡 idea | |

> Livrées (`done/`) : 0001, 0002, 0004, 0010, 0013, 0017, 0018, 0019, 0021, 0022, 0023, 0024, 0025, 0026, 0027.
