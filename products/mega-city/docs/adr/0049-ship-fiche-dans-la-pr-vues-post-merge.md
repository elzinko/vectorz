# ADR-0047 — Le ship complet vit dans la PR (fiche + toutes ses vues)

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
- **On ne peut PAS différer la régénération des vues au post-merge** : dans ce dépôt, presque toutes
  les vues générées sont **gatées par la CI** — `BACKLOG.md` par `check-links`, `PORTFOLIO.md` +
  `PLAN.md` par `check-planning-views`, `board.html` par un **test d'égalité exacte** (mega-city
  vitest). Dès qu'une fiche bouge, la CI **exige** ces vues à jour **dans la PR** (relevés Codex,
  PR #210). Un modèle « vues post-merge » échouerait la CI.

## Décision

**1 — Le ship complet voyage DANS la PR.** À l'étape 10 d'`ezk-sprint`, **après** le GO de revue et
**juste avant** le squash-merge, un **dernier commit** porte : `git mv features/<id>_… → done/`,
`status: shipped`, `pr: #N`, **et la régénération de toutes les vues dérivées** (`BACKLOG.md`,
`PORTFOLIO.md`, curation de `PLAN.md`, `board.html`). Le squash-merge fait atterrir **code + statut +
vues, atomiquement**. Une session en worktree en est capable : elle commit sur **sa** branche, pas sur
`main`. C'est ce que `ezk-backlog ship` fait déjà — on le déplace juste **avant** le merge, dans la PR.

**2 — Pas de « vues post-merge ».** On abandonne la distinction gatées/non-gatées : la CI gate en
pratique toutes les vues dérivées d'une fiche, donc elles sont **toutes** cohérentes dans la PR. Rien
n'est différé.

**3 — Les conflits de vues sont déterministes et sérialisés au merge.** Chaque PR vit dans un worktree
**isolé** et travaille seule. Deux PR ne se mergent **jamais exactement en même temps** (verrou local
et côté GitHub) : les conflits sur les vues générées se présentent **un à un, au merge**. Résolution
**mécanique**, jamais « intelligente » : re-lancer `regen`/`ship` re-dérive la vue depuis les
front-matter à jour. C'est le prix — modéré et déterministe — de l'atterrissage atomique.

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
- **Différer les vues au post-merge** (une 1ʳᵉ version de cet ADR) : **impossible** ici — la CI gate
  les vues (`board.html` à l'égalité exacte, `check-links`, `check-planning-views`). Une fiche déplacée
  sans régénérer ses vues **rougit la CI** (relevés Codex PR #210). Rejeté.
- **Relâcher les tests de vues** pour rendre le post-merge viable : plus gros chantier, et on
  **affaiblirait des filets** utiles (le test d'égalité attrape « fiche déplacée, vue oubliée »).
  Écarté au profit de « tout dans la PR ».
