---
type: retro
date: 2026-10-24
theme: "run autonome de la milestone preparation — gate stable et périmètre d'autonomie"
scope: "le run du 2026-10-23/24 : 5 fiches de preparation construites + 2 groomées, flux local"
participants: [architecture, qualite, dev, produit, juge, po]
actions:
  - proposition: "La gate ne flake plus : délai élargi pour le test git collect-absorbed (+ cwd injecté)"
    kind: feature
    by: [qualite, dev, architecture]
    status: ✅
    decision: "fiche 20261024090000000 créée, construite et shippée en local — délai de 60 s (comme backlog-version-bin) + cwd injecté ; suite complète verte en série"
    date: 2026-10-24
  - proposition: "Différer les builds structurels (aligner la carte, métriques jetons, board sur vraies données) — ils passent par un panel ou une maquette, pas de l'autonomie hands-off"
    kind: action
    by: [architecture, produit]
    status: ✅
    decision: "différés et tracés (plan + mémoire) pour reprise avec le PO ; cohérent avec la doctrine « décisions structurantes → panel »"
    date: 2026-10-24
  - proposition: "Faire du « délai élargi pour un test qui lance de vrais sous-processus » une règle de méthode"
    kind: regle
    target: global
    by: [qualite]
    status: ❌
    decision: "écartée : le motif est déjà documenté dans 2 fichiers (backlog-version-bin, collect-absorbed) ; une règle de plus serait du process pour un cas rare — on garde le commentaire en tête de fichier"
    date: 2026-10-24
---

**En clair :** pendant le run autonome de la milestone `preparation` (5 fiches construites, 2 groomées),
un seul test rougissait la gate par intermittence — un timeout, pas une régression. On l'a corrigé
(délai élargi + test rendu hermétique) et prouvé stable. On a aussi décidé de **différer** les fiches
restantes qui sont structurelles (carte, métriques, board) : elles demandent un panel ou une maquette,
pas de l'autonomie sans relecture. Rien n'est poussé.

## 1 · Les faits de départ

- La suite complète `vitest run` rougissait **à presque chaque fiche** sur
  `src/io/__tests__/collect-absorbed-branches.test.ts`, avec des durées de **5,8 s et 7,7 s** (> 5 s, le
  délai vitest par défaut). En isolation : 3 passed en < 2 s. Classique timeout sous charge parallèle.
- La milestone `preparation` a livré ses 5 fiches prêtes ; les 3 fiches restantes sont des idées, dont
  une (« prête » vérifie la prémisse) **en attente de panel**.
- Les fiches prêtes des milestones suivantes sont toutes **structurelles** : aligner la carte (purge de
  l'épic mort à travers le code), métriques jetons par mode (domaine sprint-metrics), board sur vraies
  données (UI/câblage) — chacune cross-cutting.

## 2 · Le débat (round-robin light, lentilles synthétisées)

- **qualité / dev** : le test fait de vrais `git` par sous-processus ; sous plusieurs workers, `git
  merge-tree` ralentit et dépasse 5 s. La parade existe déjà dans `backlog-version-bin.test.ts` (délai
  60 s) — on l'applique ici. En plus, le test pointait son dépôt par `process.chdir` (global au
  process) : on injecte un `cwd` pour le rendre hermétique (ADR-0003).
- **architecture / produit** : les fiches restantes touchent le cœur de la méthode (modèle épic,
  in-progress calculé, métriques) ou l'UI. Les construire sans relecture ni panel contredit « décisions
  structurantes → panel » et le mandat « que tout fonctionne ». On les diffère, tracées.
- **juge de cohérence** : le fix de gate ne contredit aucune règle (aligne ADR-0003). La règle proposée
  (« délai long pour test à sous-processus ») **doublonne** un motif déjà documenté → écartée.

## 3 · Décisions (tranchées en autonomie, à relire par le PO)

- ✅ **Fix de gate** livré (fiche + build + ship local), gate prouvée stable (suite complète verte en série).
- ✅ **Builds structurels différés** (carte, métriques, board) — reprise avec le PO, via panel/maquette.
- ❌ **Règle « délai long »** écartée (doublon de doctrine déjà écrite).

Note : le carnet `docs/retro-notes` (hors git) porte des notes des sessions des 2026-10-14/15, déjà
fichées pour la plupart — hors périmètre de cette rétro light ; à passer dans une rétro complète dédiée.

## 4 · Application de la décision « board → panel » (suite du 2026-10-24)

La décision ✅ « board sur vraies données → panel/maquette » a été **appliquée le jour même**, sans
rien re-décider :

- La fiche board a été **découpée en 3 sœurs** (tuyau · plan réel · runs réels).
- Deux **cœurs sûrs et bornés** ont été construits, mergés en local et vérifiés : la moitié web du
  tuyau (`Board.tsx` lit une source injectée, repli signalé, test vert) et le lecteur de backlog
  cop1-local (`projectPlan` + `readBacklogFiches`, validé sur le vrai backlog vectorz, 215 tests).
- Le **reste structurel** — endpoint daemon `/api/board`, provenance multi-projets, adaptateur des
  runs — a été **confirmé différé au panel**, pas bâti en aveugle. Sprint `Board web` fermé en
  **abandon motivé** ; les 3 sœurs restent `ready`, tirables une fois le panel tenu.

Nuance apprise : sur une fiche structurelle, les **cœurs testables et isolés** (un lecteur pur, un
repli d'UI) peuvent se faire en autonomie ; c'est le **câblage qui porte une décision d'archi** (quels
projets, quelle provenance) qui attend le panel. La frontière n'est pas « toute la fiche », c'est
« la partie qui tranche une architecture ».
