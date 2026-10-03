---
id: "20261003075821858"
title: Deux formes de PR — la PR de dev rend la fiche, la PR de backlog la désigne
type: feature
priority: P1
product: mega-city
milestone:
version:
labels: [pr]
status: idea
pr:
evidence: none # forme du corps de PR, pas d'écran
created: 2026-10-03
---

# 20261003075821858 — Deux formes de PR : la PR de dev rend la fiche, la PR de backlog la désigne

**En clair.** Une PR qui ne fait que ranger une fiche (l'ajouter, la groomer, la passer prête) ne
livre aucun code : il n'y a rien à tester. Pourtant on lui donne le même corps qu'une PR de dev, avec
la fiche recopiée et ses critères vides, ce qui brouille ce que le PO valide. On veut deux formes : la
PR de **dev** rend la fiche (ADR-0029) ; la PR de **backlog** dit ce qui change dans le backlog et
pointe vers la fiche.

**Si tu arrives frais.** Une *PR de backlog* ne touche que des fiches et des docs de suivi
(`features/`, captures, archives de session). Une *PR de dev* livre du code avec sa fiche.
L'[ADR-0029](../products/mega-city/docs/adr/0029-fiche-est-le-document-pr-en-est-le-rendu.md) fait du
corps de la PR de dev le **rendu** de sa fiche.

## Contexte / Problème

**Le symptôme, daté.** 2026-10-03, PR #339 : elle ajoute une fiche, sans code. Son corps recopiait
toute la fiche, critères vides compris. Le PO : « on n'a rien à valider, vu que c'est qu'une fiche, ce
n'est pas la phase de dev… une PR devrait uniquement indiquer que c'est une fiche ».

**Pourquoi.** L'ADR-0029 vise la PR de dev : « à la création (ezk-sprint étape PR) ». Mais l'outil qui
fabrique le corps (`pr:emit-local`) et le contrôle du corps (`check-pr-body.sh`) ne connaissent qu'une
forme. On l'applique donc par habitude aux PR de backlog.

**Ce n'est pas rare.** 13 des 30 dernières PR mergées sont des PR de backlog (`docs(features)`,
constat du 2026-10-03).

## Proposition

- **La forme se choisit d'après les fichiers touchés.** Si la PR ne change que `features/`,
  `docs/captures/`, `docs/sessions/`, `docs/retro-notes/` ou `docs/journal/`, c'est une PR de backlog.
  Sinon, c'est une PR de dev.
- **Corps d'une PR de backlog**, court :
  - « En clair » : ce qui change dans le backlog ;
  - chaque fiche touchée, par son titre et son lien, avec son statut et sa priorité ;
  - « Rien à tester : le contenu se relit dans la fiche. Ses critères seront validés à la PR de
    dev » ;
  - ce que le PO valide : le cadrage, la priorité, la décision.
- **Corps d'une PR de dev** : inchangé, le rendu de la fiche (ADR-0029).
- `check-pr-body.sh` et `pr:emit-local` gagnent la forme « backlog ». L'ADR-0029 précise sa portée :
  la PR de dev.

## Critères d'acceptation

- [ ] Pour une liste de fichiers qui ne touche que des fiches et des docs de suivi,
      `check-pr-body.sh` accepte un corps court de backlog. Pour une liste qui touche du code, il
      exige le rendu de la fiche.
- [ ] L'outil qui fabrique le corps produit la forme « backlog » pour une PR de backlog.
- [ ] L'ADR-0029 précise qu'il vise la PR de dev, et nomme la forme « backlog ».
- [ ] `ezk-backlog` et `ezk-sprint` disent quelle forme employer, et quand.

**Mesure de suivi** — sur les 10 prochaines PR de backlog, aucune ne recopie une fiche entière.

## Comment vérifier

```bash
pnpm --dir products/mega-city test:scripts
```

- Le test de `check-pr-body.sh` couvre les deux formes.
- Relire l'ADR-0029 : sa portée y figure.

## Notes / décisions

- **P1 demandée par le PO** le 2026-10-03.
- Option retenue au brainstorm du 2026-10-03 : un corps court, choisi d'après les fichiers touchés.
  Écartées pour l'instant : garder le rendu complet avec un bandeau « aperçu » (redondant avec
  l'onglet « Files changed » de GitHub) ; supprimer les PR de backlog au profit d'un push direct sur
  `main` (une confirmation de push à chaque geste ; à revoir après la fiche
  [« BACKLOG.md ne fait plus conflit »](20261002231845120_backlog-md-sans-conflit-entre-pr.md)).
- Le corps de la PR #339 a été réécrit à la main dans la forme courte, le 2026-10-03, comme essai.
