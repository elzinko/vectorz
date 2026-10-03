---
id: "20261003201034990"
title: "Voir les PR ouvertes et les branches parallèles avant d'ouvrir un lot ou de groomer une fiche"
type: feature
priority: P1
product: mega-city
milestone:
version:
labels: [coordination, backlog]
status: idea
pr:
evidence: none # outillage, pas d'écran
created: 2026-10-03
---

# 20261003201034990 — Voir les PR ouvertes et les branches parallèles avant d'ouvrir un lot ou de groomer une fiche

**En clair.** Une autre session peut être en train de modifier le plan ou la fiche qu'on s'apprête à
construire ou à groomer. Aujourd'hui, on ne le découvre qu'après coup. On veut que le contexte de run
et le grooming listent d'abord ce travail parallèle.

## Contexte / Problème

- 2026-10-03, run V0.5 : la PR #340 (rétro muti, autre session, non fusionnée) changeait une fiche du
  lot et ajoutait une fiche à la V0.5. Le PO a dû le signaler en cours de run ; le lot a été réordonné
  à la main.
- Nuit du 2 au 3 octobre : deux fiches groomées en double par deux sessions, un grooming jeté à chaque
  fois (note de carnet `20261003071846762-groomings-paralleles-meme-fiche`).

## Proposition

1. `ezk run context` liste les PR ouvertes et les branches locales non fusionnées qui touchent
   `features/PLAN.md` ou une fiche du lot.
2. `ezk-backlog groom <id>` fait la même vérification pour la fiche visée, avant la première question.
3. Lecture seule : on montre, on ne bloque pas. Sans `gh`, seules les branches locales sont listées, et
   la sortie le dit.

## Critères d'acceptation

- [ ] Sur un dépôt jetable avec une branche qui modifie une fiche du lot, `ezk run context` la liste.
- [ ] Le grooming d'une fiche touchée par une autre branche commence par la nommer.
- [ ] Sans `gh` ni remote, la commande le dit et liste quand même les branches locales.

## Comment vérifier

```bash
pnpm --dir products/mega-city test
```

## Mesure de suivi

- [ ] Sur les 5 prochains lots : 0 grooming jeté et 0 réordre manuel dû à un travail parallèle non vu.

## Notes / décisions

- Née de la rétro de l'itération V0.5 (capture `docs/captures/2026-10-03-retro-iteration-v0-5.md`), ralliée par les quatre lentilles. Retenue par
  choix délégué du PO à l'agent, P1. Traite la note de carnet sur les groomings parallèles.
