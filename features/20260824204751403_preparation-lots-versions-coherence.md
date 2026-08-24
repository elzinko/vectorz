---
id: "20260824204751403"
title: Méthode de préparation — lotir les features en versions (milestones) & contrôler la cohérence d'un lot, au-dessus du sprint
type: feature
priority: P2
product: mega-city
epic:
status: idea
ready:
pr:
created: 2026-08-24
---

# 20260824204751403 — Lotir les features en versions (milestones) & cohérence de lot

## En clair

Développer les features avec les agents est **rôdé**. Ce qui reste dur, c'est **l'amont** :
préparer et **planifier** le travail. Le cycle réel — alimenter le backlog, le corriger,
**lotir** les fiches, parfois **re-lotir** — n'a pas d'outil dédié quand on pilote plusieurs
agents. Cette fiche est une **idea à méditer** (pas encore une décision) : faut-il, et comment,
outiller le niveau **version / milestone** dans ezk ?

Le manque précis : ezk sait grouper un **sprint** (lot court), mais pas raisonner au niveau
**version** (le lot de livraison qui regroupe plusieurs sprints/fiches). Le champ `version:`
existe dans le front-matter, mais il est **passif** : c'est une étiquette, personne ne vérifie
qu'un lot-version **tient debout**. La tâche que je cherchais n'est donc pas « groomer une fiche »
— c'est un **contrôle de cohérence sur le lot** : ce lot forme-t-il une version livrable ?
manque-t-il une fiche ? y en a-t-il une qui n'a rien à y faire ?

## Contexte / Problème

Origine : session 2026-08-24 (PO, depuis le repo muti). En réfléchissant à un grooming
multi-agents du backlog, le PO reformule le vrai besoin : **prévoir des artefacts de livraison**
(les versions) en **lotissant** les features, et disposer d'un **contrôle de cohérence de lot**.

Trois échelles se confondent aujourd'hui dans la méthode :

```
  fiche          →   sprint            →   version / milestone
  (DoR par fiche)    (lot court)           (lot de livraison)
  gate `ready`       0065 · 0090 · 0100    ??? — c'est le trou
```

- **fiche** : outillé — le gate `ready` (DoR), le groom (`0160`, shipped).
- **sprint** : outillé — lot cohérent (`0065`, shipped), cohérence concurrentielle
  multi-worktrees (`0090`, shipped), intake & santé du backlog (`0100`, idea).
- **version / milestone** : **rien de premier ordre**. Juste le champ `version:` passif et
  `PLAN.md` (séquence NOW, court horizon). Aucun objet « lot-version », aucun contrôle
  transversal de sa cohérence.

Le coût de ce trou grandit avec le débit de fiches et le nombre d'agents : plus on crée, plus
lotir/re-lotir à la main devient cher (c'est déjà le constat de la fiche `20260812104022240`,
« je crée plein de fiches et je ne sais plus les trier »).

## Rapport avec l'existant (anti-doublon — à ne PAS ré-écrire)

Cette idea est le **chapeau** d'un cluster déjà là ; elle ne doit couvrir que le **delta
version/milestone + cohérence de lot**, et renvoyer au reste :

- `0065` (shipped) — *lot cohérent de **sprint** ; sprint ≠ PR*. Même intuition « lot », une
  échelle en dessous. À réutiliser, pas à refaire.
- `0090` (shipped) — cohérence **concurrentielle** (deux sessions ne tirent pas la même fiche).
  Autre sens du mot « cohérence » ; hors périmètre.
- `0100` (idea) — **sprint planning** + DoR + santé du backlog + garde « pas de sprint possible ».
  Le voisin le plus proche côté *préparation*. Le lotissement-version **s'appuierait** dessus.
- `20260812104022240` (idea, P1) — **rationaliser** le backlog (regrouper/splitter, script + LLM).
  C'est le bras « alimenter/corriger ». Le lotissement-version en est le **débouché**.
- `0055` (idea) — KPI agrégés jusqu'à la **version**. Mesure d'une version, pas sa composition.
- `20260823124042842` (todo, ready) — **voir** les fiches sur le process scrum (board lot 0).
  Vue, pas méthode de lotissement.

## Pistes (à challenger, rien de tranché)

1. **Ne PAS créer un 4ᵉ système scrum** (ADR-0013, déjà invoqué par le panel adverse de la vue
   `…842`). La piste sobre : **compiler depuis le front-matter existant** (`version:` + statut +
   dépendances), zéro objet nouveau — comme le « board lot 0 ».
2. **Contrôle de cohérence de lot** = un *review transversal* d'une version : complétude (toutes
   les fiches nécessaires sont là), pertinence (pas d'intrus), séquencement (dépendances internes
   satisfaites), taille (livrable réaliste). Extension de `ezk-backlog review` (`review --version <X>`)
   plutôt qu'une skill neuve ?
3. **Lotir / re-lotir en multi-agents** : un *workflow* à la demande (analyse globale → proposition
   de lots → revue adverse → arbitrage PO), exactement la forme discutée le 2026-08-24. Pas une
   discipline manuelle permanente.
4. **Champ `version:`** : le rendre actif (le review le lit) plutôt qu'inventer un objet milestone.

## Questions à méditer

- Faut-il un **objet milestone de premier ordre**, ou `version:` + une vue/review suffisent ?
- « Lot cohérent » de sprint (`0065`) et « lot-version » : **même mécanique à deux échelles**, ou
  deux choses distinctes ?
- Le contrôle de cohérence : **commande dédiée** ou **extension de `review`** ?
- **Devrait-on** l'implémenter dans vectorz, ou est-ce sur-outiller une méthode déjà lourde ?
  (la question ouverte du PO)

## Comment vérifier (signaux que l'idea est mûre pour décider go/no-go)

- [ ] Une **note de cadrage** tranche « objet milestone » vs « `version:` actif + vue/review ».
- [ ] Le **périmètre minimal** est arbitré PO, et **ne recoupe pas** `0100` / `20260812104022240`
      (fusionner si recouvrement — sinon on recrée le doublon que ce cluster dénonce).
- [ ] Une **esquisse** de la surface (ex. `review --version <X>` : complétude / intrus /
      séquencement / taille) existe, assez concrète pour un groom `ready`.
- [ ] Décision explicite : **promue en `todo` groomée**, **rattachée à un épic**, ou **classée**.

## Notes / décisions

- Capturée en `idea` (non groomée) à la demande PO — matière à méditer, pas à tirer telle quelle.
- `priority: P2` **proposée** (idea exploratoire, alignée sur `0055`/`0065`/la vue `…842`) —
  à monter en P1 si le PO la juge aussi structurante que la rationalisation `…240`.
- `product: mega-city` (la méthode ezk vit dans mega-city).
