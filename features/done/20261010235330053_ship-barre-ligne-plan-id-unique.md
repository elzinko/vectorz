---
id: "20261010235330053"
title: ship barre une ligne de PLAN.md à un seul id, même avec un marqueur en queue
type: feature
priority: P2
product: mega-city
milestone:
version:
labels: [ezk-backlog, outillage]
status: merged
pr: "merged — fusionnée dans 20261004211037977"
evidence: none
created: 2026-10-10
merged_into: "20261004211037977"
---

# 20261010235330053 — ship barre une ligne de plan à id unique, même avec un marqueur

**En clair.** Quand une fiche est livrée, l'outil `ship` doit barrer sa ligne dans le fichier
« plan ». Il refuse dès qu'il y a des mots en plus après le nom de la fiche (« → à construire »,
« dépend de F2 »), de peur que la ligne mélange plusieurs fiches. Résultat : j'ai barré à la
main 3 fois pendant le run, alors que chaque ligne ne portait **qu'un** nom. On veut qu'il barre
tout seul une ligne à **un seul** id.

**Si tu arrives frais.** Le fichier « plan » (`features/PLAN.md`) liste la séquence de travail,
une ligne par fiche. À la livraison, `ship` barre la ligne (`~~…~~ — shipped`) pour montrer que
c'est fait. Aujourd'hui il ne barre que les lignes « simples » et laisse les autres à la main.

## Contexte / Problème

- **Symptôme daté (2026-10-10).** Les 3 ships du run ont tous refusé de barrer l'entrée de
  `PLAN.md` (« la ligne mêle une fiche livrée et une à faire »), alors que chaque ligne n'avait
  **qu'un** id — le contrôle butait sur le texte en queue (`→ build`, `conditionne F2`).
- **Pourquoi ça compte.** C'est une friction répétée : chaque ship à id unique demande un geste
  manuel inutile, et en mode autonome ça casse la fluidité.

## Proposition

1. Affiner l'heuristique de barrage (`ship:fiche`) : une ligne qui ne contient **qu'un seul** id
   de fiche est barrée automatiquement, **même** avec un marqueur ou du texte en queue.
2. Ne refuser que les lignes qui contiennent **plusieurs** ids (là, le jugement humain reste
   nécessaire).

## Critères d'acceptation

- [ ] `ship` barre automatiquement une entrée de `PLAN.md` à **un seul** id, avec ou sans
      marqueur/texte en queue.
- [ ] `ship` refuse toujours (et demande un geste manuel) une ligne portant **plusieurs** ids.
- [ ] Un test couvre les deux cas (une ligne à un id + queue → barrée ; une ligne à deux ids →
      refusée).

## Comment vérifier

```bash
# ship d'une fiche dont l'entrée PLAN.md est « `<id>` — … → build ; dépend de X » → barrée seule
ezk backlog ship --dry-run --pr '…' features/<id>_<slug>.md
```

## Glossaire

- `PLAN.md` — le fichier curé qui liste la séquence de travail, une ligne par fiche.
- `ship:fiche` — la transaction qui passe une fiche en « livrée » (déplace en `done/`, régénère
  l'index, barre l'entrée du plan).

## Notes / décisions

- Née de la rétro du 2026-10-10 (grain n°3), capture
  [docs/captures/2026-10-10-retro-run-regles-composables.md](../../docs/captures/2026-10-10-retro-run-regles-composables.md).
- Comportement actuel assumé et documenté dans `ezk-backlog` (« barre-la à la main » quand la
  ligne mêle plusieurs fiches) ; cette fiche réduit les cas où c'est manuel.
