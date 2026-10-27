---
id: "20261027192532935"
title: "Spike : confronter au code les surfaces internes qu'une fiche cite (panne 1, hors gate)"
type: feature
priority: P3
product: mega-city
milestone:
version:
labels: [methode, dor, spike]
depends:
status: idea
pr:
evidence: none # investigation de méthode, pas d'écran ; preuve = verdict écrit + mesure
created: 2026-10-27
---

# 20261027192532935 — Spike : confronter la prémisse citée au code (panne 1)

## En clair

Une fiche peut citer une surface interne qui **n'existe pas** dans le code (ex. un « README `.rules/` »,
une « règle en observation »). Elle semble prête, mais elle est insaisissable : le run la saute en plein
build. C'est la **panne 1** de la DoR, laissée de côté quand on a livré la gate sur `blocked:` (ADR-085).
Ce **spike** éprouve si on peut confronter au code les surfaces citées, **de façon fiable**, avant d'en
faire une vraie porte. Ce n'est **pas** une gate : une investigation qui rend un verdict.

## Si tu arrives frais

« Confronter au code » = un agent liste les surfaces qu'une fiche cite, un script vérifie leur présence
dans le dépôt. L'ennui : certaines « surfaces » sont des concepts (« règle en observation »), pas des
chemins qu'on peut grepper. D'où le doute sur la fiabilité — et donc ce spike avant toute gate.

## Contexte / Problème

- **Cas fondateur (run v0.16)** : la fiche « trier les sorties de rétro »
  ([done/20261002155911271](done/20261002155911271_trier-sorties-retro-par-nature.md)) était prête mais
  a dû être sautée — elle citait une 3ᵉ surface (« README `.rules/` ») et un concept (« règle en
  observation ») absents de tout fichier.
- Le panel du 2026-10-27 ([ADR-085](../docs/adr/ADR-085-prete-gate-reservations-via-blocked.md)) a
  **différé** cette voie : gater « prête » sur un contrôle qui se trompe serait pire que le mal. À
  éprouver d'abord, hors gate.

## Proposition

Un spike **borné** (pas une feature à livrer d'emblée) :

1. Faire lister, par un agent, les **surfaces internes** qu'une fiche cite (chemins, fonctions, concepts).
2. Vérifier mécaniquement la présence des surfaces **greppables** (chemins, symboles) dans le dépôt.
3. Sur un échantillon de fiches (dont le cas fondateur), **mesurer** les faux positifs et faux négatifs —
   notamment ce que les concepts non-greppables font rater.
4. Rendre un **verdict écrit** : une gate fiable est-elle possible (et comment la borner aux surfaces
   greppables), ou non (et pourquoi) ? Le verdict décide s'il y a une fiche de gate à ouvrir ensuite.

**Hors gate** : tant que la fiabilité n'est pas prouvée, ce travail **ne bloque aucune « prête »**.

## Critères d'acceptation

- [ ] Un échantillon de fiches (dont `20261002155911271`) est passé au crible : surfaces citées
      extraites, présence vérifiée.
- [ ] Les faux positifs / faux négatifs sont **mesurés et documentés** (y compris l'angle mort des
      concepts non-greppables).
- [ ] Un **verdict écrit** tranche : gate fiable possible (comment la borner) ou non (pourquoi) —
      reporté dans un ADR ou cette fiche.
- [ ] Rien dans le spike ne rend « prête » bloquante : il reste une investigation.

## Comment vérifier

```bash
# Rejouer le cas fondateur : la fiche cite « .rules/ » et « règle en observation » absents du code.
# Le spike doit dire ce qu'un contrôle automatique attrape et ce qu'il rate.
cat features/done/20261002155911271_trier-sorties-retro-par-nature.md
```

## Notes / décisions

- **Origine** : panne 1 de la fiche DoR [20261015213921103](done/20261015213921103_dor-verifie-premisse-dans-le-code.md),
  différée en spike par [ADR-085](../docs/adr/ADR-085-prete-gate-reservations-via-blocked.md) le 2026-10-27
  (la panne 2 — caveat en prose — a été livrée comme signal le même jour).
- Sujet d'architecture incertain : à groomer (et sans doute à passer en panel) avant toute construction.
  Ne pas forcer `ready` sur la foi de ce brouillon.
