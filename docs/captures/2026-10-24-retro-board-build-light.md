---
type: retro
date: 2026-10-24
theme: "Run board-data — brancher le board sur les vraies données (endpoint, détail de fiche)"
scope: "le run board du 2026-10-24 : sœurs 1+2 shippées (/api/board + lecteur backlog + détail de fiche), sœur 3 bloquée sur données ; deux revues adverses ; mode light, sans round-robin d'agents"
participants: [dev, qualite, architecture, po]
actions:
  - proposition: "Tout lecteur de fiches dérive l'id du NOM DE FICHIER, jamais du YAML parsé — yaml coerce `id: 0029` en nombre (zéros de tête perdus, 17 chiffres perdent en précision)"
    kind: regle
    target: global
    by: [qualite, dev]
    status: ⏳
  - proposition: "Une fiche read-model (qui affiche une donnée émise) vérifie à la DoR que sa donnée SOURCE existe déjà — la sœur 3 runs en est le cas d'école : chantier/moments jamais émis par les vrais runs"
    kind: action
    by: [architecture]
    status: ⏳
  - proposition: "Quoter les titres de fiche contenant « : » — 5 fiches cassaient le parsing YAML et disparaissaient en silence des lecteurs"
    kind: action
    by: [qualite]
    status: ⏳
---

**En clair :** j'ai branché le board sur les vraies données — l'endpoint `/api/board` sert le plan et
le détail des fiches de vectorz, et deux sœurs sur trois sont livrées en local. Deux revues adverses
ont attrapé de vrais bugs que la gate ne voyait pas (un id de fiche corrompu par YAML, cinq fiches qui
disparaissaient). La troisième sœur, les runs, est bloquée non par l'effort mais par la donnée : les
vrais journaux n'émettent pas encore ce que le board attend. Trois leçons à trancher. Rien n'est poussé.

## 1 · Les faits de départ

- Le board affichait un échantillon en dur ; objectif du run : le brancher sur les vraies données.
- Livré et prouvé bout-en-bout : `/api/board` (daemon) sert le vrai plan (funnel, versions, `done`) et
  le vrai **détail de fiche** (103 fiches actives), sans import mega-city (ADR-021). Sœurs 1 et 2
  shippées en local.
- Sœur 3 (runs) : inspectée sur 132 journaux réels → **aucune clé chantier**, payloads sans
  moments/verdict. Marquée `blocked` (donnée vécue absente).

## 2 · Le débat (round-robin light, lentilles synthétisées)

- **qualité / dev** : la gate verte et le typecheck à 0 n'ont PAS vu deux bugs bloquants — `id: 0029`
  non quoté lu en nombre par `yaml` (37/103 fiches), et 5 fiches au titre à deux-points qui faisaient
  jeter YAML et disparaître la fiche. C'est la **revue adverse** (sous-agent) qui les a trouvés. Parade
  posée : l'id vient du **nom de fichier**, la fiche survit à un YAML cassé, et les 5 titres sont quotés.
- **architecture** : la sœur 3 est une fiche `ready` dont la **prémisse de donnée** n'existe pas — le
  board veut des chantiers/moments que l'émetteur n'écrit pas dans les vrais runs. C'est exactement le
  symptôme de la fiche « prête vérifie la prémisse », mais côté **donnée** plutôt que code.
- **architecture / produit** : « structurel → panel » a été relu — un panel peut être une **revue
  adverse d'agent**, pas forcément un rendez-vous humain. Le design du board étant déjà validé par
  maquette, le câblage restant a pu être décidé (réversible) et construit, puis relu en adverse.

## 3 · Décisions (tranchées en autonomie, à relire par le PO)

- ✅ Sœurs 1 et 2 **shippées** en local, bugs de revue corrigés, gate verte (cop1 603 tests).
- ✅ Sœur 3 **laissée `ready` + `blocked`** : construire sans donnée afficherait des runs vides
  (piège « livré ≠ tourne »). Blocage écrit dans la fiche, avec la preuve.
- ✅ Décisions de frontière **écrites dans les fiches** (macOS, « prête prémisse », cache cartographie).

## 4 · Ce qui est proposé au PO

- **Règle `id` depuis le nom de fichier** (symptôme : 37/103 ids corrompus ; mesure : 0 id numérique
  dans un lecteur de fiches). À ranger `global` si tu la retiens.
- **Action DoR read-model** : une fiche qui affiche une donnée émise vérifie que la donnée source
  existe — renforce la fiche « prête vérifie la prémisse » (cas sœur 3 ajouté).
- **Action titres quotés** : quoter les titres à deux-points (fait pour les 5 ; reste à généraliser).

## 5 · Suivi des décisions de la rétro précédente

Rétro `run-preparation-light` (même jour) : la décision ✅ « board → panel » a été **appliquée** ce run
(cf. son §4). Le board est passé de « différé » à « 2/3 sœurs livrées », via une revue adverse jouant
le rôle de panel. Cohérent, pas de régression.

## 6 · Décisions du PO

| Proposition | Décision | Date |
|---|---|---|
| Règle id depuis le nom de fichier | ⏳ | — |
| Action DoR read-model (donnée source) | ⏳ | — |
| Action titres quotés | ⏳ | — |

## 7 · Glossaire

- `read-model` — un lecteur qui projette une donnée déjà écrite (ici : le backlog, les journaux) en une
  vue, sans la recalculer ailleurs.
- `revue adverse` — un relecteur (ici un sous-agent) qui cherche les défauts d'un diff et rend GO/NO-GO.
- `clé chantier` — l'étiquette qu'un run pose pour que plusieurs sessions d'un même travail se réunissent.
