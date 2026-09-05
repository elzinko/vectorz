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
- **Différer la régénération des vues au post-merge est fragile** : la cohérence des vues doit être
  garantie **dans la PR**, et le seul mécanisme fiable pour ça est le **contrat `ship`** (il régénère
  tout). La CI ne fait qu'un **filet partiel** (relevés Codex, PR #210) : `check-links` attrape un
  `BACKLOG.md` périmé, le test d'égalité mega-city attrape un `board.html` périmé **mais seulement si
  la PR touche du code** (`paths-ignore: ['**/*.md']` skippe les PR 100 % markdown) ; `PORTFOLIO.md` +
  `PLAN.md` ne sont tenus que par l'étape `check-planning-views` **du `ship`** (procédurale, absente de
  `ci.yml`). Conclusion : on ne peut pas s'appuyer sur la CI pour garder les vues à jour — c'est le
  ship, dans la PR, qui doit le faire.

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

**2 — Pas de « vues post-merge ».** La garantie **primaire** est le **contrat `ship`** : il régénère
**toutes** les vues dérivées dans la PR, donc elles y sont cohérentes **par construction** — pas par la
grâce d'un gate. La CI n'est qu'un **filet conditionnel** : `check-links` attrape un `BACKLOG.md`
périmé, et le test d'égalité du board attrape un `board.html` périmé **quand la PR touche du code**
(le workflow mega-city est skippé sur une PR 100 % markdown via `paths-ignore`). On ne s'appuie donc
**pas** sur « la CI gate tout » ; on s'appuie sur le contrat `ship`, la CI restant un backstop utile
mais partiel. Rien n'est différé au post-merge.

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
- **Différer les vues au post-merge** (une 1ʳᵉ version de cet ADR) : **rejeté** — la cohérence des vues
  doit être garantie *dans* la PR, et rien de fiable ne le fait en post-merge sans déclencheur dédié.
  La CI ne suffit pas comme garant (backstop **partiel** : `check-links` sur BACKLOG, égalité board
  **seulement si la PR touche du code**, PORTFOLIO/PLAN non gatés en CI — relevés Codex PR #210). Le
  garant, c'est le contrat `ship` dans la PR.
- **Relâcher les tests de vues** pour rendre le post-merge viable : plus gros chantier, et on
  **affaiblirait des filets** utiles (le test d'égalité attrape « fiche déplacée, vue oubliée »).
  Écarté au profit de « tout dans la PR ».
