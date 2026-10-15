# Session 2026-10-14/15 — planning backlog : exploration-app, cycle de vie de version, séquence v0.18→v0.22

## En clair

Session de **planning** (pas de dev, pas de PR, pas de sprint). Elle a cadré une grosse idée — un
agent qui explore l'app et en cartographie l'état — puis l'a **réduite** après une revue adverse, posé
une **séquence de 5 versions** à venir, et fait trancher par l'architecte **comment « figer » une
version**. Tout est committé sur `main` **local** ; rien n'est poussé (geste PO). Cette session **n'a
pas** construit v0.16 (faite ailleurs). Récit écrit à la main (pas de `SPRINT.md` à figer, donc pas
d'`ezk-archive`).

## Ce qui a été décidé / produit

- **Cache de cartographie** (nouvelle fiche, idée, P2) — [20261014113049954](../../features/20261014113049954_cache-cartographie-app.md).
  Cadrée « carte vivante », puis **réduite** après un **panel adverse** (archi / dev / produit) qui l'a
  jugée contradictoire sur son mécanisme et non prouvée. Nouveau périmètre : **index statique des
  routes + test de valeur** ; le cache vivant est différé derrière cette preuve.
- **Explorateur de features** (fiche existante, enrichie) — [20260821210633457](../../features/20260821210633457_explorateur-llm-pilote-siege-exploration-pr.md).
  Reliée au cache par le label `exploration-app`. Doute PO tranché : **pas de nouvel agent qualifieur**
  (composer `ezk-backlog add` + déléguer `ezk-pm`). Dé-parkée pour entrer en v0.22.
- **Review ciblé** des candidates « déjà couvert » : 0433 (portier SPRINT.md) → **P3** (edge legacy) ;
  1451 (page une ligne par projet) → **rattacher au board v0.17** ; la fiche ship-merge untracked reste
  **valide**.
- **Séquence v0.18 → v0.22** posée dans [PLAN.md](../../features/PLAN.md) (+ `version:` sur 24 fiches),
  marquée « proposée, à valider » : *La CLI se tient · La gate ne laisse plus rien passer · Le flux se
  lit et s'allège · Le backlog se discipline · L'app se cartographie*.
- **Cycle de vie d'une version** (nouvelle fiche, idée, P2) — [20261014200651962](../../features/20261014200651962_cycle-vie-version-preparer-figer-developper.md).
  Avis d'architecte : **figer = un marqueur** (pas un gate de dev), **photographié** par un tag git
  `freeze/vX.Y.Z` (persistant, vérifiable), **pas** un `VERSIONS.md`. N'interfère pas avec le tirage
  (ADR-0070), ne viole pas le board lecteur-seul (ADR-074).

## Notes de méthode (galères en chemin)

- **Le worktree périme vite** : d'autres sessions taguent / shippent sur `main` en continu (v0.15
  taguée en pleine session). Conséquence : `version check` / `regen` lancés dans le worktree donnent
  des **faux positifs** (ex. `rouverte v0.15`). Vérité = `ezk --root <checkout principal> …`.
- **Éditer le backlog depuis un worktree** : l'outil d'édition refuse d'écrire dans le checkout
  principal (garde-fou). Donc éditer dans le worktree, committer sur la branche, puis fusionner par
  `git -C <principal> merge --no-ff` après un `status` propre.
- **PLAN ↔ `version:` sont couplés** : poser une séquence dans `PLAN.md` **exige** `version:` sur
  chaque fiche (sinon `version check` refuse, `plan-ecart`). C'est justement la limite que la fiche
  cycle-de-vie veut lever.

## Où ça vit

Toutes les décisions sont dans les **fiches**, le **PLAN.md** et l'**avis d'archi**, committées sur
`main` local (non poussé). La version à construire reste **v0.16**.
