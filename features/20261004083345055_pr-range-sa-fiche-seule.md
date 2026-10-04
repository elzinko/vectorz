---
id: "20261004083345055"
title: "Une PR ne range que sa fiche : l'index se régénère après la fusion"
type: feature
priority: P2
product: mega-city
version:
labels: []
epic:
status: idea
pr:
evidence: none # flux git et fichiers générés, pas d'écran
created: 2026-10-04
---

# 20261004083345055 — Une PR ne range que sa fiche : l'index se régénère après la fusion

**En clair.** Quand un sprint livre plusieurs stories, chaque PR range sa fiche elle-même : elle régénère l'index du backlog, barre sa ligne du plan et recale des liens. Les PR d'un même lot se gênent donc sur ces fichiers générés. On veut que la PR ne range que sa fiche, et que l'index, le plan et les liens se régénèrent en un seul geste après la fusion.

## Contexte / Problème

- Au sprint 1 de samplerz, le 2026-10-03, deux PR ont rangé leur fiche, comme le veut l'ADR-0049. La seconde a eu 3 conflits en se mettant à jour avec `main` : `features/BACKLOG.md`, `features/PLAN.md` et un compte rendu de session. Ils ont été résolus à la main, puis l'index a été régénéré.
- Le conflit reviendra à chaque lot de 2 stories ou plus : ce sont des fichiers générés, que chaque PR réécrit.
- La rétro a retenu la variante « la PR ne range que sa fiche ; le reste se régénère après la fusion, en commit direct sur `main` ». Elle amende l'ADR-0049.
- Variantes écartées : sortir `BACKLOG.md` du suivi git ferait perdre un fichier lisible sur GitHub ; un pilote de fusion serait un outil de plus à maintenir. Le repli « seule la dernière PR du lot régénère » est rejeté : l'ordre des fusions n'est pas garanti.

## Notes / décisions

- Priorité P2. Fiche captée le 2026-10-04 par la rétro samplerz du 2026-10-03, piste 2, retenue par le PO. Capture : `docs/captures/2026-10-03-retro-premier-sprint-format-methode.md` dans le dépôt samplerz. À groomer, avec l'architecte : l'amendement de l'ADR-0049 est une décision de conception.
- Question pour le grooming : la PR déplace sa fiche vers `done/`, mais les liens qui y mènent ne seraient recalés qu'après la fusion. Faut-il accepter des liens cassés quelques minutes sur `main`, ou déplacer la fiche après la fusion, elle aussi ?
- Mesure retenue : 0 conflit d'index sur les 3 prochains lots de 2 stories ou plus.
