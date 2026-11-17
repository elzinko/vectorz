---
id: "20261117165112301"
title: "`ezk-backlog add` et `ready` refusent d'écrire une fiche que `backlog check` juge non conforme"
type: feature
priority: P2
product: mega-city
milestone:
version:
labels: [backlog, sessions-paralleles]
status: idea
blocked:
pr:
evidence: none # un contrôle de la méthode, aucun écran modifié
created: 2026-11-17
---

# 20261117165112301 — `ezk-backlog add` et `ready` refusent d'écrire une fiche que `backlog check` juge non conforme

**En clair.** Le 17 novembre, une session a committé sur `main` une fiche avec `evidence: required`, une
valeur que la méthode ne connaît pas. La gate de la session voisine est passée au rouge : son test de
conformité du corpus lit toutes les fiches du dépôt. Les gestes qui écrivent une fiche contrôlent
désormais son front-matter avant d'écrire : une fiche non conforme n'arrive plus sur `main`.

**Si tu arrives frais.** `ezk backlog check` valide le front-matter de chaque fiche (mode avertissement,
ADR-0040). Le test `src/backlog/__tests__/fiche-corpus.test.ts` de la gate, lui, exige un corpus conforme.

## Proposition

`ezk-backlog add`, `groom` et `ready` valident la fiche qu'ils écrivent avec le validateur de `backlog check`,
et refusent d'écrire sur une anomalie, en la nommant.

## Critères d'acceptation

- [ ] `ready` sur une fiche au front-matter non conforme refuse, nomme le champ fautif, et n'écrit rien.
- [ ] `add` refuse de créer une fiche non conforme, avec la même phrase.

## Comment vérifier

```bash
pnpm --dir products/mega-city test -- src/backlog
```

## Notes / décisions

- Origine : [rétro légère du sprint 5 du 17 novembre](../docs/captures/2026-11-17-retro-sprint-5-corrections-des-retros.md), proposition P2.
- Priorité P2 tranchée par ezk-pm le 17 novembre, par délégation du PO : plus intrusif, à livrer après le correctif du test du portier.
