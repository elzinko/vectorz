---
id: "20261004211037977"
title: "ezk backlog ship dit tous les fichiers qu'il touche, et ne lit que l'id en tête d'une ligne de PLAN.md"
type: bug
priority: P2
product: mega-city
milestone:
version:
labels: [backlog, ship, mode-local]
status: idea
pr:
evidence: none # commande de terminal, pas d'écran
created: 2026-10-04
---

# 20261004211037977 — ezk backlog ship dit tout ce qu'il touche, et ne lit que l'id de tête dans PLAN.md

**En clair.** `ezk backlog ship` range une fiche livrée et recale les liens qui pointent vers elle,
y compris hors de `features/`. Mais il ne conseille que `git add features` : un ADR recalé reste hors
du commit, et le dossier principal reste sale. Il refuse aussi un ship quand une autre ligne de
PLAN.md cite l'id de la fiche entre parenthèses. On veut un ship qui dit tout ce qu'il a touché, et
qui ne lit que l'id en tête de chaque ligne du plan.

**Si tu arrives frais.** `ezk backlog ship` est la transaction qui passe une fiche à `shipped` : un
`git mv` vers `features/done/`, le recalage des liens, la régénération de `features/BACKLOG.md` et
l'entrée de `features/PLAN.md` barrée. Il ne committe pas : on committe après lui.

## Contexte / Problème

- **2026-10-04, ship de 20261004192802828** : `ship` a recalé un lien dans
  `products/mega-city/docs/adr/0062-le-tableau-de-bord-devient-le-cockpit-multi-projets.md`, hors de
  `features/`. Son message final ne conseille que `git add features` : l'ADR est resté hors du commit,
  et le dossier principal est resté sale. Un `ship-merge.sh --local` suivant aurait refusé. Rattrapé
  par un amend.
- **Même soir, ships de 20261004192802897 et 20261004192802964** : `ship` a touché l'ADR, d'autres
  fiches de `done/` et des corps de PR locaux. Ajoutés à la main, un par un.
- **Même soir, ship de 20261004192802964** : refus, « la ligne mêle une fiche livrée et une fiche à
  faire ». C'était la ligne des réglages d'agents (20261002205205417), qui citait l'id de la page
  « config » dans sa parenthèse. Corrigé en retirant l'id de la parenthèse.

## Valeur — ce que coûte de ne rien faire

- Chaque ship d'une fiche liée à un ADR laisse le dossier principal sale, et bloque le merge local
  suivant.
- Un plan qui cite une fiche voisine par son id fait refuser un ship légitime.

## Proposition

1. **`ship` imprime la liste des fichiers qu'il a modifiés**, et une ligne `git add` prête à copier
   avec tous ces fichiers (pas seulement `features/`).
2. **`ship` ne lit, dans PLAN.md, que l'id en tête de ligne** (après la puce et la citation) : un id
   cité plus loin dans la ligne ne la rend pas « mêlée ».

## Critères d'acceptation

- [ ] Après un ship qui recale un lien dans un ADR, la sortie liste ce fichier, et la ligne `git add`
      proposée l'inclut. Cas reproduit dans les tests de ship.
- [ ] Après `git add` de cette liste et le commit, le dossier est propre (`git status` vide).
- [ ] Une ligne de PLAN.md dont seule la parenthèse cite l'id de la fiche livrée ne bloque plus le
      ship. Cas reproduit.
- [ ] Une ligne qui porte vraiment deux fiches en tête (« `A` et `B` — … ») est toujours refusée.

## Comment vérifier

```bash
cd products/mega-city && pnpm test && pnpm test:scripts
ezk backlog ship --dry-run --pr 'local (abc1234)' features/<id>_<slug>.md   # liste les fichiers touchés
```

## Notes / décisions

- 2026-10-04 : née de la rétro légère du run cockpit de la V0.6 (capture
  `docs/captures/2026-10-04-retro-run-cockpit-v0-6-legere.md`), proposition 1, retenue par le PO.
  Reprend deux notes du carnet (`docs/retro-notes/traitees/20261004214345799-…` et
  `…20261004222239608-…`).
- P2 proposé par le pilote (un contournement à la main existe) ; à confirmer au planning.
- Voisine : [la transaction de ship](done/20260830194601233_ship-transactionnel-liens-vues.md),
  livrée (20260830194601233).
