---
id: 20260812100109940
title: ship doit synchroniser les vues de planning (PORTFOLIO.md + PLAN.md), pas seulement BACKLOG.md
type: chore
priority: P2
product: mega-city
labels: [process, lisibilite]
status: todo
ready:
pr:
created: 2026-08-12
---

## Contexte / Problème

**En clair.** Quand on marque une fiche livrée (`ezk-backlog ship`), l'index `BACKLOG.md` est
régénéré — mais **pas** les autres vues de planning (`PORTFOLIO.md`, `PLAN.md`). Résultat : elles
continuent de pointer les lecteurs vers du travail **déjà fait**.

Constaté daté : au ship de la fiche 0149 (PR #121 / grooming #125), `PORTFOLIO.md:39` la listait
encore `🔴 todo` (et la fiche suivante 0190 en était absente), et `PLAN.md:44` disait encore
« **build** 0149 » alors qu'elle était livrée. Attrapé par Codex (revue #125, round 3, arrivé
1 min après le merge). La procédure `ship` d'`ezk-backlog` que j'ai suivie (status→shipped, `git mv`
vers `done/`, `regen` de `BACKLOG.md`, commit) **ne mentionne ni `PORTFOLIO.md` ni `PLAN.md`**.

Le correctif ponctuel a été fait à la main (`portfolio.sh` + édition PLAN) — cette fiche vise le
**trou de process** pour que ça ne se reproduise pas.

## Proposition

- **`ship` régénère `PORTFOLIO.md`** en fin de course (`products/mega-city/bin/portfolio.sh`), au
  même titre que `regen` pour `BACKLOG.md` (vue dérivée, script — le LLM ne range pas, ADR-0001).
- **`ship` propose la mise à jour de `PLAN.md`** (curé, pas régénéré) : marquer l'entrée de la fiche
  shippée `~~…~~ — shipped #PR`. Proposition, l'humain valide (PLAN = décision, pas un index).
- Option : `reconcile` **signale** les vues de planning périmées (fiche shippée encore listée `todo`
  dans `PORTFOLIO.md` / en `build` dans `PLAN.md`) — même esprit que le rapprochement fiche↔PR.

## Critères d'acceptation

- [ ] après un `ship`, `PORTFOLIO.md` ne liste plus la fiche livrée comme actionnable (régénéré par script)
- [ ] après un `ship`, l'entrée `PLAN.md` correspondante est marquée shippée (curée, proposée à l'humain)
- [ ] une vérif catche une fiche `shipped` encore listée `todo`/`build` dans une vue de planning
- [ ] la procédure `ship` d'`ezk-backlog` (SKILL.md) documente ces deux vues en plus de `BACKLOG.md`

## Notes

- Première fiche créée avec un **id horodaté** (`mint-id.sh`, fiche 0180 / PR #124 mergée) — fin du `max+1`.
- Voisines : [[0100]] (santé backlog à l'intake), [[0079]] (lisibilité des artefacts humains).
  Le symptôme est un cas de « vue qui ment » : la même famille que la dérive de lisibilité.
