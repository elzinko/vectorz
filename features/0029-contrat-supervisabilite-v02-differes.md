---
id: 0029
title: Contrat de supervisabilité v0.2 — les différés du gel v0.1 (multi-piste, anti-surplace)
type: chore
priority: P3
status: todo
pr:
created: 2026-07-14
---

# 0029 — Contrat v0.2 : les différés du gel v0.1

## Contexte / Problème

Le gel v0.1 (capture §7, PR #60) a volontairement réduit le périmètre. Les différés actés
par le panel design, à ne rouvrir qu'**après au moins un run réel sous v0.1** :

- **Multi-piste intra-run** : v0.1 impose « un run = un flux séquentiel, au plus un gate
  ouvert » (le parallélisme = N runs). v0.2 : champ `scope/track` dans l'enveloppe +
  invariant scopé — si l'usage montre que N-runs ne suffit pas.
- **`max_gate_interval` déclarable** : anti-surplace côté méthode (v0.1 ne l'a que côté
  superviseur : durée/budget max entre gates).
- **Hash-chain natif du journal** (v0.1 : miroir d'audit ; la chain est une option du
  validateur, fiche 0027).
- **`report_schema` optionnel par gate** (revendication « rapport structuré comme unité
  contractuelle » du prior-art, dégonflée en v0.1 au profit d'`outcome`).
- Compatibilité des paires de versions à l'adoption (hors quiescence — cf. article 0026
  « fenêtres de mise à jour »).
- **Typage de l'autorité dans le schéma** (`authority` sur `gate.reached`, `resumed_by`,
  `seat.changed`) + journalisation de la délégation ask→auto du point de décision méthode —
  avis minoritaire de la revue 2026-07-14 (§6.1), à re-poser après 3 runs réels.

## Proposition

Grooming à l'usage : chaque item ci-dessus ne s'ouvre que sur douleur constatée en run réel.
Cette fiche sert de parking officiel pour que rien ne se perde.

## Critères d'acceptation

- [ ] Chaque item porte son gate (« ≥1 run réel v0.1 », ou plus précis) et sa référence.
- [ ] Aucun item n'est implémenté par cette fiche (parking pur, façon [[0046]]).
- [ ] Revue de la fiche au grooming, quand un item est repêché (promotion en fiche dédiée).

## Notes / décisions

- Origine : « Reste pour v0.2 » du compte rendu du panel, capture §7.
- Ne pas implémenter en anticipation (YAGNI) — le v0.1 d'abord, éprouvé par mega-city
  (fiche 0050) + validateur (fiche 0027).
- **2026-07-14 (revue de groupe, DP3) : le MCP émetteur est dé-parqué** — D12 en fait le
  chemin nominal Desktop, ce n'est plus un différé v0.2. Porté par la fiche 0030 (MVP démo,
  étape 1) + mega-city 0050 (kit émetteur).
