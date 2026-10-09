---
id: "20261009104436287"
title: next nu montre la suite, pas la liste entière
type: refactor
priority: P1
product: mega-city
milestone:
version:
labels: [ergonomie-cli]
status: idea
pr:
evidence: none
created: 2026-10-09
---

# 20261009104436287 — `next` nu montre la suite, pas la liste entière

**En clair.** Aujourd'hui `ezk backlog next`, tapé seul, est un **alias de `list`** : il
déballe tout le backlog trié. On s'attend pourtant à ce que « next » montre **ce qui vient
ensuite**. Le vrai « suivant » est caché derrière `next --ready-only`. On veut que `next` nu
montre la suite proche, et on veut trancher si `plan-head` — un helper interne — doit rester
une commande exposée au CLI.

## Contexte / Problème

- `next` seul = `list` (déballage complet, tri P0→P3). Documenté ainsi, mais contre-intuitif :
  le mot « next » promet « la prochaine », pas « toutes ».
- La sémantique « donne-moi la prochaine à tirer » vit dans le **flag** `--ready-only`. Le flag
  porte tout le sens ; le verbe nu ne sert à rien de distinct de `list`.
- `plan-head` est un helper **mécanique** (calcule la tête du plan) sur lequel `next --ready-only`
  s'appuie. Il est aujourd'hui exposé comme commande CLI alors qu'il relève de la tuyauterie.
- Symptôme daté : le PO, 2026-10-09, « on ne comprend pas bien ce que font `plan-head` et
  `next --ready-only` ; `next` devrait montrer ce qui vient prochainement ».

## Proposition

1. **`next` nu montre la suite proche** : la prochaine fiche tirable + la tête bloquée (ce que
   fait `--ready-only` aujourd'hui), pas le déballage complet. Le déballage reste sur `list`.
2. Garder un chemin explicite pour l'ancien comportement si besoin (`next --all` ou simplement
   `list`), sans casser `ezk-sprint` / `ezk-product-build` qui appellent `--ready-only`.
3. **Trancher `plan-head`** : s'il est pur plumbing, le **retirer** de la surface CLI humaine
   (le garder comme helper interne appelé par `next`), ou au minimum le sortir des blocs
   « Et maintenant ? » et de la doc tournée vers l'humain.

## Critères d'acceptation

- [ ] `ezk backlog next` (sans flag) renvoie la prochaine fiche tirable + la tête bloquée, pas la
      liste entière.
- [ ] `list` (et un chemin explicite type `--all`) conservent le déballage complet.
- [ ] `ezk-sprint` et `ezk-product-build` tirent toujours la bonne fiche (le point d'entrée ne
      casse pas).
- [ ] Décision tranchée et appliquée sur `plan-head` : interne, ou exposé mais justifié — écrite
      dans la fiche et reflétée dans le SKILL.md.
- [ ] Le SKILL.md d'`ezk-backlog` décrit la nouvelle sémantique (`next` ≠ `list`).

## Comment vérifier

```bash
pnpm --dir products/mega-city test
ezk backlog next          # montre la suite, pas tout le stock
ezk backlog list          # déballage complet
```

## Notes / décisions

- Friction remontée par le PO le 2026-10-09 en pilotant le grooming du trio loi.
- Candidate v0.9 « ranger la maison » (rationalisation de la surface CLI) — à confirmer par le PO.
