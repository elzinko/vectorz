# ADR-0049 — Le ship complet vit dans la PR (fiche + toutes ses vues)

- Statut : **Proposé** (2026-09-03)
- Fiche : `../../../../features/20260823121712781_reconcile-systematique-merges-hors-flux.md`
- Révise / complète : ADR-0018 (reconcile), fiche `20260812100109940` (sync des vues au ship)

## En clair

Aujourd'hui, ranger une fiche en « done » est un geste **séparé** du merge du code : le `ship`
(passer `status: shipped` + déplacer la fiche dans `done/` + régénérer les vues) se commit **sur
`main` après** le merge. Deux dégâts : une fenêtre où le code est mergé mais la fiche dit encore
« todo », et — depuis un worktree — l'**impossibilité** de committer ce ship sur `main` quand il est
pris. On décide : **le ship complet vit DANS la PR**. La fiche déplacée dans `done/`, son statut, **et
la régénération de toutes ses vues dérivées** (BACKLOG, PORTFOLIO, PLAN, board) forment le **dernier
commit de la branche**, après le GO de revue. Le squash-merge fait tout atterrir **d'un coup**.

## Contexte

- Le `status` d'une fiche est un **cache** de l'état *merged* de sa PR (ADR-0018). Le merge du code
  et le rafraîchissement de ce cache (`ship`) sont deux actes distincts.
- `ship` doit committer sur `main` (le backlog vit sur `main`). Une session en **worktree secondaire**
  ne peut pas committer sur `main` quand il est occupé par une autre session.
- **Récurrence datée (session muti 2026-09-01/02)** : PR #171 mergée, `ship` de `20260830194321545`
  jamais atterri (bloqué worktree→`main`, fini « en vol » sur une branche non poussée). Code sur
  `main`, fiche restée `todo`.
- **On ne peut PAS différer la régénération des vues au post-merge.** Il faut distinguer deux niveaux
  d'exigence (relevés Codex, PR #210) :
  - **Gaté par la CI exécutable** (fait rougir la PR si périmé) : `board.html` par un **test d'égalité
    exacte** (mega-city vitest) et `BACKLOG.md` par `check-links` (workflow markdown). Dès qu'une fiche
    bouge, la CI **exige** ces deux-là à jour **dans la PR** — un modèle « post-merge » échouerait la CI.
  - **Tenu cohérent par le contrat `ship`** (procédural, pas un workflow) : `PORTFOLIO.md` + la curation
    de `PLAN.md` via `check-planning-views` — c'est une **étape du `ship`** dans `SKILL.md`, **pas**
    branché dans `ci.yml`. Sous ce modèle où le ship vit dans la PR, ces vues y sont régénérées de toute
    façon ; les brancher aussi en CI serait une amélioration (non requise par cet ADR).

## Décision

**1 — Le ship complet voyage DANS la PR.** À l'étape 10 d'`ezk-sprint`, **après** le GO de revue et
**juste avant** le squash-merge, un **dernier commit** porte : `git mv features/<id>_… → done/`,
`status: shipped`, `pr: #N`, **et la régénération de toutes les vues dérivées** (`BACKLOG.md`,
`PORTFOLIO.md`, curation de `PLAN.md`, `board.html`). Le squash-merge fait atterrir **code + statut +
vues, atomiquement**. Une session en worktree en est capable : elle commit sur **sa** branche, pas sur
`main`. ⚠️ Aujourd'hui `ezk-backlog ship` régénère `BACKLOG.md` + `PORTFOLIO.md` et cure `PLAN.md`, mais
**pas** `board.html` (`SKILL.md`, étape 3 du `ship`). L'étape 10 doit donc être **étendue** pour
régénérer **toute** vue dérivée d'une fiche — board inclus — **et déplacée avant** le merge, dans la
PR. Cette extension du contrat `ship`/`sprint` fait partie de l'**implémentation** de cet ADR (fiche
`20260823121712781`), pas d'un acquis.

**2 — Pas de « vues post-merge ».** On abandonne la distinction gatées/non-gatées : la CI gate en
pratique toutes les vues dérivées d'une fiche, donc elles sont **toutes** cohérentes dans la PR. Rien
n'est différé.

**3 — Les conflits de vues sont déterministes et sérialisés au merge.** Chaque PR vit dans un worktree
**isolé** et travaille seule. Deux PR ne se mergent **jamais exactement en même temps** (verrou local
et côté GitHub) : les conflits sur les vues générées se présentent **un à un, au merge**. Résolution
**mécanique**, jamais « intelligente », en **deux temps dans cet ordre** : (1) **merger `main`** dans
la branche — sinon la 2ᵉ PR ne voit pas encore la fiche déplacée par la 1ʳᵉ, et un `regen` seul
re-produirait des vues **périmées** (voire écraserait le 1ᵉʳ ship) ; (2) **re-régénérer toutes les
vues** puis rejouer les gates. C'est le prix — modéré et déterministe — de l'atterrissage atomique.
*(Éprouvé sur cette PR même : `main` a avancé, il a fallu merger `main` puis tout régénérer.)*

**4 — `reconcile` reste le filet, pas la norme.** Il couvre le seul cas restant : un merge fait
**100 % hors flux** (UI GitHub, sans le commit de ship de l'étape 1). Il **propose**, `ship` exécute
(invariant ADR-0018 préservé).

## Conséquences

- **Positif** : atterrissage atomique du « livré » ; fin du « ship en vol » et du blocage
  worktree→`main` ; la preuve de PR (revue, avant/après, test PO) et le passage en `done` tombent au
  **même gate** ; plus de distinction gatées/non-gatées fragile ; aucun déclencheur post-merge
  **obligatoire** à construire.
- **Contrainte d'ordre** : sur la branche, la fiche lit « shipped » **avant** le merge (état
  provisoire). Le commit de ship est le **dernier** de la branche, ajouté **après** le GO ; un NO-GO de
  revue ⇒ on le retire. Ordre imposé : **valider → shipper → merger**.
- **Coût** : chaque PR de ship touche les vues → **conflit possible** avec une autre PR de ship. Mais
  déterministe (re-`regen`) et **sérialisé** au merge (jamais deux merges simultanés). Pas de
  résolution manuelle au jugement.
- **Frontière** : `ezk-sprint` (étape 10) et `ezk-backlog` (`ship`) portent tout le commit-dans-la-
  branche (`git mv` + statut + **régénération de toutes les vues**). La fiche `20260823121712781`
  porte le **filet `reconcile`** (merges hors flux) et le geste de **re-`regen` au conflit de merge**.

## Alternatives écartées

- **Statu quo (ship séparé sur `main` post-merge)** : c'est la cause du décrochage et du blocage
  worktree — rejeté.
- **Différer les vues au post-merge** (une 1ʳᵉ version de cet ADR) : **impossible** ici — la CI
  exécutable gate `board.html` (égalité exacte) et `BACKLOG.md` (`check-links`). Une fiche déplacée sans
  régénérer ces vues **rougit la CI** (relevés Codex PR #210). Rejeté. *(PORTFOLIO/PLAN ne rougiraient
  pas la CI aujourd'hui — `check-planning-views` est procédural — mais sous « tout dans la PR » ils sont
  régénérés de toute façon.)*
- **Relâcher les tests de vues** pour rendre le post-merge viable : plus gros chantier, et on
  **affaiblirait des filets** utiles (le test d'égalité attrape « fiche déplacée, vue oubliée »).
  Écarté au profit de « tout dans la PR ».
