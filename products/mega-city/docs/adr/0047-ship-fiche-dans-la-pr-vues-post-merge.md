# ADR-0047 — Le ship de la fiche vit dans la PR ; les vues se régénèrent post-merge

- Statut : **Proposé** (2026-09-03)
- Fiche : `../../../../features/20260823121712781_reconcile-systematique-merges-hors-flux.md`
- Révise / complète : ADR-0018 (reconcile), fiche `20260812100109940` (sync des vues au ship)

## En clair

Aujourd'hui, ranger une fiche en « done » est un geste **séparé** du merge du code : le `ship`
(passer `status: shipped` + déplacer la fiche dans `done/`) se commit **sur `main` après** le merge.
Deux dégâts : une fenêtre où le code est mergé mais la fiche dit encore « todo », et — depuis un
worktree — l'**impossibilité** de committer ce ship sur `main` quand il est pris. On décide de
**coupler** : le ship de la fiche **vit dans la PR** (dernier commit de la branche, après le GO de
revue) — avec les **vues gatées** (`BACKLOG.md`, `PORTFOLIO.md`, curation de `PLAN.md`), que la CI
exige cohérentes. Seules les **vues d'affichage lourdes** sous `diagrams/` (board, cartes, graphe,
non gatées) se **régénèrent sur `main` après le merge**, par un déclencheur.

## Contexte

- Le `status` d'une fiche est un **cache** de l'état *merged* de sa PR (ADR-0018). Le merge du code
  et le rafraîchissement de ce cache (`ship`) sont deux actes distincts.
- `ship` doit committer sur `main` (le backlog vit sur `main`). Une session en **worktree secondaire**
  ne peut pas committer sur `main` quand il est occupé par une autre session.
- **Récurrence datée (session muti 2026-09-01/02)** : PR #171 mergée par `gh pr merge`, mais le
  `ship` de la fiche `20260830194321545` n'a **pas pu atterrir** — il a fini « en vol » sur la branche
  non poussée d'une autre session. Le code était sur `main`, la fiche restait `todo`.
- `reconcile` rattrape ce décrochage, mais il est **manuel** (ADR-0018) — on peut l'oublier.

## Décision

**1 — La source de vérité de la fiche voyage DANS la PR.** À l'étape 10 d'`ezk-sprint`, **après** le
GO de revue et **juste avant** le squash-merge : `git mv features/<id>_… → done/`, `status: shipped`,
`pr: #N`, comme **dernier commit de la branche**. Le squash-merge fait alors atterrir **code +
statut atomiquement**. Une session en worktree en est capable : elle commit sur **sa** branche, pas
sur `main`.

**2 — La ligne de partage est le GATE, pas le type de fichier.** Un artefact généré voyage avec le
ship **si et seulement si un gate CI en exige la cohérence** (raffiné après relevés Codex sur cette PR) :

- **Vues GATÉES → dans le commit de ship (brique 1).** Ce sont exactement celles que `ezk-backlog ship`
  régénère déjà et que la CI contrôle : `BACKLOG.md` (gate `check-links` — le `git mv` vers `done/`
  casse sinon le lien de l'index), `PORTFOLIO.md` (gate `check-planning-views` — sinon la fiche livrée
  y reste affichée « à faire »), et la **curation de `PLAN.md`** (même gate). Les committer dans la PR
  **est obligatoire** : sans eux, `check-links` / `check-planning-views` rougissent. Elles peuvent
  entrer en **conflit** entre PR parallèles, mais le conflit est **déterministe** — re-lancer
  `ship`/`regen` le résout.
- **Vues d'affichage NON gatées → post-merge.** Le board, les cartes et le graphe (sous `diagrams/`,
  qu'aucun gate ne contrôle) ne voyagent **pas** dans la PR : les committer par branche ferait
  **conflit systématique**. Elles se **régénèrent sur `main` après le merge**, par un déclencheur —
  pure re-dérivation, **sans conflit** car sérialisée sur `main`.

**3 — `reconcile` reste le filet, pas la norme.** Il couvre le seul cas restant : un merge fait
**100 % hors flux** (UI GitHub, sans le commit de ship de l'étape 1). Il **propose**, `ship` exécute
(invariant ADR-0018 préservé).

## Conséquences

- **Positif** : atterrissage atomique du « livré » ; fin du « ship en vol » et du blocage
  worktree→`main` ; `reconcile` redevient l'exception ; la preuve de PR (revue, avant/après, test PO)
  et le passage en `done` tombent au **même gate**.
- **Contrainte d'ordre** : sur la branche, la fiche lit « shipped » **avant** le merge (état
  provisoire). Le commit de ship est donc le **dernier** de la branche, ajouté **après** le GO ; un
  NO-GO de revue ⇒ on le retire. Ordre imposé : **valider → shipper → merger**.
- **Dépendance dure** : le déclencheur post-merge des **vues d'affichage** (board/cartes/graphe sous
  `diagrams/`) est **obligatoire** — sans lui, elles décrochent sur `main`. Les vues **gatées**
  (`BACKLOG.md`, `PORTFOLIO.md`, curation de `PLAN.md`), elles, voyagent avec le ship. C'est l'objet de
  la fiche `20260823121712781`.
- **Frontière** : `ezk-sprint` (étape 10) et `ezk-backlog` (`ship`) portent le commit-dans-la-branche —
  `git mv` + statut + **régénération des vues gatées** (`BACKLOG.md`, `PORTFOLIO.md`, `PLAN.md`), ce que
  le contrat `ship` fait déjà (`check-planning-views` inclus) ; le déclencheur post-merge des vues
  d'affichage `diagrams/` est porté par `20260823121712781`.

## Alternatives écartées

- **Statu quo (ship séparé sur `main` post-merge)** : c'est la cause du décrochage et du blocage
  worktree — rejeté.
- **Committer AUSSI les vues d'affichage lourdes dans la PR** : conflits d'index systématiques entre PR
  parallèles (board/cartes touchés par chaque fiche) — on échangerait un problème contre un pire. On
  ne garde dans la PR que `BACKLOG.md`, contraint par le gate de liens.
- **Exempter `BACKLOG.md` du gate `check-links`** (le laisser décrocher sur la branche, re-dérivé
  post-merge) : possible, mais on **affaiblirait un filet** qui attrape justement « fiche déplacée,
  index oublié ». On préfère faire voyager `BACKLOG.md` avec le ship et **garder le gate intact**.
