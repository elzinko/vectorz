---
id: "20261008072306360"
title: "La rétro et l'archive lisent les comptes rendus de sprint"
type: feature
priority: P1
product: mega-city
milestone: compte-rendu-sprint
version: v0.7.0
labels: [retro, archive]
status: idea
pr:
evidence: none # scripts et skills, pas d'écran
created: 2026-10-08
split_from: "20261005100027029"
---

# 20261008072306360 — La rétro et l'archive lisent les comptes rendus de sprint

**En clair.** Une fois que chaque sprint laisse un compte rendu committé (sa fiche sœur producteur), la
rétro doit les lire tous — même ceux écrits dans d'autres sessions — et l'archive de session doit y
renvoyer au lieu de recopier le `SPRINT.md`. Cette fiche branche les deux lecteurs.

**Si tu arrives frais.** La *rétro* (`ezk-retro`) améliore la méthode à partir de ce qui s'est passé ;
elle laisse une capture dans `docs/captures/`. L'*archive de session* (`ezk-archive`) fige la session à
sa clôture, sous `docs/sessions/`.

## Contexte / Problème

Dépend de sa sœur [au close, le sprint écrit et committe son compte rendu](20261008072305169_close-ecrit-et-committe-le-compte-rendu.md),
qui produit les comptes rendus sous `docs/sprints/`. Sans lecteurs, ces comptes rendus existent mais
personne ne s'en sert : la rétro continue de ne voir que la mémoire de l'agent, et l'archive continue de
recopier un `SPRINT.md` parfois pollué.

## Valeur — ce que coûte de ne rien faire

- Une rétro dans une autre session reste aveugle aux sprints qu'elle n'a pas vécus.
- L'archive de session recopie parfois le journal d'une autre session : le récit est faux sans le dire.

## Proposition

1. **La rétro lit tous les comptes rendus** écrits depuis sa dernière capture, quelle que soit la
   session qui les a écrits (`ezk-retro run` les liste et les charge).
2. **L'archive de session devient un sommaire** : elle renvoie aux comptes rendus de la session (sous
   `docs/sprints/`) au lieu de recopier `SPRINT.md`.

## Critères d'acceptation

- [ ] `ezk-retro run` liste les comptes rendus écrits depuis la dernière capture, y compris ceux de deux
      sessions différentes (cas reproduit).
- [ ] L'archive de session renvoie aux comptes rendus de la session, au lieu de recopier `SPRINT.md`.

## Comment vérifier

```bash
cd products/mega-city && pnpm test:scripts
# après au moins deux sprints clos dans des sessions différentes :
# ezk-retro run  → doit lister leurs comptes rendus sous docs/sprints/
```

## Notes / décisions

- Fille **consommateur** du découpage de la fiche source (décision PO 2026-10-08, ADR-0068). Sœur
  producteur : [20261008072305169](20261008072305169_close-ecrit-et-committe-le-compte-rendu.md).
  **Dépend de A** : ne se teste qu'une fois A produisant des comptes rendus. À tirer après A.
