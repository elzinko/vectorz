---
id: "20261015082118353"
title: "Board : read-model chantier → sessions → évènements (fusion par clé)"
type: feature
priority: P1
product: cop1
milestone: board
version: v0.23.0
labels: [dashboard, board, supervision, multi-session, read-model]
status: idea
blocked:
pr:
evidence: none # couche de lecture, pas d'écran ; prouvée par tests du read-model
created: 2026-10-15
---

# 20261015082118353 — Board : read-model chantier → sessions → évènements

**En clair.** Aujourd'hui le board lit **un** journal et n'en sort que des résumés. Pour montrer
« un chantier, ses ouvriers, ce que fait chacun », il faut une nouvelle couche de lecture qui
**réunit plusieurs journaux par la clé de chantier** et rend la **liste des évènements**,
étiquetés par session. C'est le vrai morceau de code que le panel a sorti de l'ombre.

**Si tu arrives frais.** Le *read-model* est la couche qui transforme les journaux bruts en
données prêtes à afficher. Détail et contraintes dans
[ADR-079](../docs/adr/ADR-079-run-et-session-deux-entites-multi-llm.md) §D8.

## Contexte / Problème

Le projecteur actuel lit un seul journal et rend des agrégats (état, jalons), sans liste
d'évènements ni notion de session, et la clé de stockage est le **dossier de run** (anti-collision
délibérée : le `run_id` n'est jamais une clé). Un chantier réparti sur N journaux n'a donc, pour
l'instant, aucun moyen d'être reconstitué.

## Proposition (ADR-079 §D2, D8)

- Un projecteur qui expose la **liste d'évènements étiquetés `session_id`** (pas seulement des
  agrégats).
- Un **index « clé de chantier → sessions → évènements »**, + le champ `piloted_by` (hiérarchie).
- **Regroupement par la clé de chantier, qualifiée par la racine de projet** ; le **dossier de
  run reste la clé de stockage** (jamais le `run_id` ; anti-collision préservée).
- Une **règle d'ordonnancement inter-journaux tolérante** : pas le `ts` brut (semi-hostile) —
  `ts` + départage stable par `session_id`/`seq`, dérive bornée.
- Le **cycle de vie d'un chantier réparti sur N journaux** (en cours / au jalon / fini / orphelin)
  et la **sémantique badges/compteurs** (par-session vs par-chantier), sans double compte.

## Critères d'acceptation

- [ ] Deux journaux portant la même clé de chantier sont réunis en **un** chantier, avec ses
      sessions et la liste de ses évènements étiquetés.
- [ ] Deux journaux de **racines de projet différentes** avec la même clé ne fusionnent **pas**.
- [ ] Le `run_id` n'est jamais une clé de fusion ni d'écrasement ; le dossier de run reste la clé
      de stockage.
- [ ] Le fil fusionné d'un chantier est ordonné par une règle tolérante (prouvée sur `ts`
      désordonné/absent) ; filtrer par session est un accès à l'index, pas un recalcul.
- [ ] Le cycle de vie du chantier (en cours/jalon/fini/orphelin) et les compteurs tiennent sans
      double compte.

## Comment vérifier

- Jeu de deux journaux (2 worktrees, même clé) → le read-model rend un chantier à 2 sessions,
  ses évènements dans l'ordre, chacun étiqueté.
- Journal avec `ts` cassé → l'ordre dégrade proprement (règle tolérante), pas de crash.
- Tests du read-model (sans serveur) sur les deux cas.

## Notes / décisions

- Décision : [ADR-079](../docs/adr/ADR-079-run-et-session-deux-entites-multi-llm.md) §D8. Dépend
  de la clé posée par l'émetteur ([T3 clé de chantier](20261015133600328_emetteur-cle-de-chantier.md)).
- **Sœurs (sans chapeau)** : émetteur, découverte, chronologie+accueil, étape d'accueil —
  `milestone: board` + `v0.23.0`.
- Respecte « live, jamais committé » (ADR-0043/0055) : le read-model sert, il n'écrit rien.
