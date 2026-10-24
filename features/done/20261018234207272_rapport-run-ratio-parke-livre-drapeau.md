---
id: "20261018234207272"
title: "Le rapport de run affiche le ratio parké/livré + la couverture de groom, avec drapeau au seuil"
type: feature
priority: P2
product: mega-city
milestone: preparation
version:
labels: [backlog, observabilite]
status: shipped
pr: "local (63474320)"
evidence: none # outillage, pas d'écran
created: 2026-10-19
---

# 20261018234207272 — rapport de run : ratio parké/livré + drapeau

**En clair.** Parker 16 fiches sur 22 (73 %) n'a levé **aucune** alerte : la boîte a rangé plus de
fiches qu'elle n'en a construit, en silence. On veut que le rapport de run **montre** ce ratio et la
couverture de groom, et **lève un drapeau** au-delà d'un seuil — pour que l'anomalie se voie à la
clôture, pas trois jours plus tard.

## Contexte / Problème

Rétro du 2026-10-19 (capture `docs/captures/2026-10-19-retro-run-parking-frilosite.md`). Le
`run-report` nomme bien les fiches parkées avec leur raison, mais **ne dit pas** si le groom a été
tenté, ni quelle part du stock a été écartée. Un run « 6 livrées / 16 parkées, 0 appel d'agent de
groom » passe pour normal. Règle maison : « un compteur à côté d'une liste ment s'il ne signale pas
l'anomalie ».

## Proposition

`bin/run-report.ts` calcule et affiche deux faits (côté script, pas un comptage LLM — ADR-0001) :
- **couverture de groom** : `groomé X / Y fiches idea rencontrées` ;
- **ratio** : `parké ÷ (parké + livré)`.

Au-delà d'un seuil (proposition : 30 %), **ou** si `parks > 0` et `groom-tenté == 0`, le rapport
**lève un drapeau** (sortie en attention, code dédié) et surface au PO : « la boîte parke plus
qu'elle ne construit — lot mal calibré, ou grooming sauté ? ».

## Critères d'acceptation

- [ ] Le rapport imprime la ligne de couverture de groom et le ratio parké/livré.
- [ ] Un jeu 16-parké / 6-livré déclenche le drapeau ; un jeu 2-parké / 20-livré ne le déclenche pas.
- [ ] `parks > 0` avec `groom-tenté == 0` déclenche le drapeau quel que soit le ratio.

## Comment vérifier

```bash
pnpm --dir products/mega-city test   # un test de l'extracteur couvre les 3 cas
```

## Notes

- Rend visible le symptôme de la règle `development/tenter-avant-de-parker`. Fiche sœur : le park qui
  refuse une fiche non groomée (20261018234206166).
