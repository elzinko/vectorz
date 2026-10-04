---
date: 2026-10-04
session: " / ready-todo-status-distinction-d96e52"
type: friction
---

# ezk backlog ship laisse hors du commit un lien recalé hors de features

Le 2026-10-04, `ezk backlog ship` de la fiche 20261004192802828 a recalé un lien dans
`products/mega-city/docs/adr/0062-le-tableau-de-bord-devient-le-cockpit-multi-projets.md`, hors de
`features/`. Son message final conseille seulement `git add features` : l'ADR modifié est resté
hors du commit de ship, et le dossier principal est resté sale. Un `ship-merge.sh --local`
suivant aurait refusé. Rattrapé à la main par un amend du commit de ship (66398dbb puis amendé).

Piste : que `ship` liste tous les fichiers qu'il a touchés, ou conseille `git add` sur cette liste.
