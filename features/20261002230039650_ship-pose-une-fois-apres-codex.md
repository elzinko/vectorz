---
id: "20261002230039650"
title: Poser le commit ship une seule fois, après la revue et la première passe Codex
type: feature
priority: P2
product: mega-city
milestone:
version:
labels: [sprint]
status: idea
pr:
evidence: none # changement de méthode, pas d'écran
created: 2026-10-03
---

# 20261002230039650 — Poser le commit ship une seule fois, après la revue et la première passe Codex

**En clair.** Depuis l'ADR-0049, la fiche d'une story passe en `done/` par un commit « ship »,
dernier de la PR. Aujourd'hui on le pose dès le GO de la revue locale. Chaque retour Codex retenu
oblige alors à le retirer, corriger, puis le reposer. On veut le poser **une seule fois** : après la
revue locale **et** la première passe Codex, corrigées en un seul lot.

**Si tu arrives frais.** *Ship* : le commit qui range la fiche dans `features/done/`
(`ship-in-pr.sh add`). *Codex* : le relecteur automatique des PR GitHub, un filet en plus de la
revue locale (ADR-0059).

## Contexte / Problème

**Le symptôme, daté.** 2026-10-02, PR #333 : le ship a été posé trois fois et retiré deux fois.
Chaque retour Codex fondé a coûté un retrait, un correctif, un nouveau ship, puis une passe CI et
Codex de plus. La fiche a coûté environ 400 000 jetons, pour une cible de 200 000.

## Proposition

- `ezk-sprint` (étape 8) et `ezk-pr ship` posent le ship **après** la revue locale GO **et** la
  première passe Codex, dont les retours retenus sont corrigés en un seul lot.
- **L'attente de Codex est bornée.** Si Codex reste muet ou est coupé (`codex-review: false`), on
  pose le ship sur le GO local seul. Codex reste un filet, jamais une condition de merge
  (ADR-0059).
- Un retour Codex tardif garde le geste actuel : `ship-in-pr.sh undo`, correctif, `add`.

## Critères d'acceptation

- [ ] Le texte d'`ezk-sprint` et d'`ezk-pr` place le ship après la première passe Codex traitée,
      avec une attente bornée et la sortie « Codex muet ».
- [ ] L'ADR-0049 note cette précision, sans en changer la décision.

**Mesure de suivi** — sur les 5 prochaines PR de story, au plus un retrait de ship par PR.

## Comment vérifier

- Relire l'étape 8 d'`ezk-sprint` et la section `ship` d'`ezk-pr` : l'ordre est GO local, passe
  Codex corrigée en lot, ship, merge.
- Sur la première PR suivante : `gh pr view <N> --json commits` montre un seul commit ship.

## Notes / décisions

- Retenue à la rétro du 2026-10-03 :
  [capture](../docs/captures/2026-10-03-retro-session-2026-10-02.md), proposition 3. Produit et
  architecture la portent ; qualité et dev la voyaient en simple consigne.
- Juge de cohérence : compatible avec l'ADR-0049 (ship après le GO, avant le merge) et
  l'ADR-0059, **à condition** que l'attente de Codex soit bornée.
- L'architecture conseille un panel, l'ADR-0049 étant récent.
- Priorité **P2 proposée** par l'agent, sur délégation du PO.
