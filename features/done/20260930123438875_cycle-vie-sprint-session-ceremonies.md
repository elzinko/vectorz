---
id: "20260930123438875"
title: "Séparer clairement fiche, sprint et session (ezk-sprint start/close)"
type: feature
priority: P0
product: mega-city
version: v0.4.0
milestone:
labels: [sprint]
status: shipped
pr: "#275"
evidence: none # méthode / skills / doc, pas d'écran
created: 2026-09-30
---

# 20260930123438875 — Cycle de vie : ezk-sprint start/close, ezk-archive pour la session, cérémonies hors sprint

## En clair

La méthode collait trois choses : la story, le sprint et la session. On les sépare.

- La **story** reste une fiche et une PR.
- Le **sprint** devient un lot de stories qui produit un **incrément**. On l'ouvre avec `ezk-sprint start`. On le ferme avec `ezk-sprint close`.
- La **session** (s'asseoir puis se lever dans Claude Code) reste fermée par `ezk-archive`.
- Le **planning** et la **rétro** restent hors du sprint.

Dans une même session, on enchaîne donc `start → stories → close`, puis une rétro, puis un planning, puis un nouveau sprint.

Ce sprint livre le **POC** : les deux verbes, le partage des rôles avec `ezk-archive` et l'ADR-0054 accepté, le tout testé. Le reste est en « Suite ».

**Ce que ça veut dire pour toi.** Les anciens verbes marchent toujours : `check` devient le dry-run de `start`, `run` déroule tout le cycle. Une fiche seule donne un lot d'une story, donc le même build qu'avant. Après le merge, tu livres la fiche et tu décides de la Suite.

## Contexte / Problème

La méthode collait deux niveaux et il en manquait un :

- `ezk-sprint run` construit **une** feature, soit **une** PR. Un « sprint » valait une feature.
- `ezk-sprint check` (ex-`ezk-start`) ouvre, `ezk-archive` clôt, au niveau **session**.

Il n'existait pas d'étage « sprint = lot de stories → incrément ». En Scrum, un sprint contient 1..N user stories et aboutit à un incrément. Une session peut enchaîner plusieurs sprints. L'asymétrie ressentie (ouverture dans `ezk-sprint`, clôture dehors dans `ezk-archive`) est le symptôme de cet étage manquant.

Le mini-panel du 2026-09-30 avait d'abord rejeté `ezk-sprint close` par argument de cadence : « close = 1×/session, sprint = 1×/feature ». L'argument tombe dès qu'on rétablit le niveau sprint. Une session contient N sprints, donc `close` tourne 1× par sprint, à la bonne cadence.

## Proposition

Trois étages emboîtés : `story ⊂ sprint ⊂ session`. Le détail et les alternatives écartées sont dans l'[ADR-0054](../../products/mega-city/docs/adr/0054-cloture-sprint-vs-archive-session.md).

- **Story** : 1 story = 1 PR, inchangé.
- **Sprint** : verbes `ezk-sprint start` et `ezk-sprint close`. `check` devient `start --dry-run`. `run` devient `start → stories → close`.
- **Session** : `ezk-archive` inchangé. L'ouverture de session est implicite : le handoff se reprend au premier `start`.
- **Cérémonies** : planning et rétro restent hors sprint. La rétro produit des fiches, groomées au planning suivant. Boucle : `retro → fiches → backlog → planning → sprint`.

Nommage écarté : `stop` pour la clôture normale (en Scrum, c'est une fin anormale) et `ezk-sprint retrospective` (il ferait entrer une cérémonie dans le sprint).

## Critères d'acceptation

**POC — ce sprint**

- [x] **A1 — `start` ouvre un sprint.** `sprint.sh start --lot <ids>` passe le portier, écrit `SPRINT.md` avec le lot, refuse sur ALERT (sauf `--override "<raison>"`, journalisé) et refuse si un sprint est déjà ouvert.
- [x] **A2 — `check` = `start --dry-run`, strictement read-only.** Même sortie que le portier. Ni fichier, ni branche, ni commit.
- [x] **A3 — `close` scelle un incrément.** Il refuse tant qu'une story du lot est ouverte. Sinon il passe le sprint à `clos`, inscrit l'incrément dans `SPRINT.md` (section « Incréments scellés de la session ») et rend la main à la session. Il ne touche ni `docs/sessions/` ni `.claude/handoff.md`. Sortie d'un sprint où rien n'est livré : `close --abandon "<raison>"`, sans incrément.
- [x] **A4 — Enchaînement.** `start → close → start` marche dans la même session. Ni l'incrément scellé ni la section « Galères & gestes (labo) » ne se perdent.
- [x] **A5 — `run` = `start → stories → close`**, écrit dans `SKILL.md`. Un lot d'une story donne le build 0→10 d'avant, inchangé.
- [x] **A6 — `ezk-archive` garde la session.** Ses scripts ne changent pas. Son `SKILL.md` dit « session », renvoie à l'ADR-0054 et lève l'ambiguïté de son alias `close`. Aucune sous-commande `retrospective`, aucun verbe `start` hors `ezk-sprint`.
- [x] **A7 — ADR-0054 `Accepté`.** Ses deux questions ouvertes sont tranchées pour le POC : `SPRINT.md` suffit (pas d'objet persistant) et le planning, c'est `ezk-backlog`. La règle de nommage est posée.
- [x] **A8 — Contrat testé.** Vitest (catalogue, `ceremonies.yml`, `SKILL.md`, ADR), suite bash câblée dans `test:scripts`, carte régénérée, gate complète verte.

**Suite — hors POC**

- [ ] `ezk-product-build` repositionné en orchestrateur de la boucle de session (planning → sprint → rétro → planning), avec un seul checkpoint inter-sprint.
- [ ] Lot de plusieurs stories de bout en bout : cadence du checkpoint (par story aujourd'hui, par sprint demain).
- [ ] Panel adverse complet (architecte, scrum master, PO/juge) sur ce repositionnement. Le POC s'appuie sur le mini-panel du 2026-09-30 et sur la revue adverse de sa PR.
- [ ] Nom d'`ezk-product-build` (train, increment ou statu quo) : à décider avec le repositionnement. Voir « Absorbé » plus bas.
- [ ] Alias : date de retrait de `check` et `run`. Sort de l'alias `close` d'`ezk-archive`.
- [ ] Objet « sprint » persistant, seulement si `SPRINT.md` montre ses limites.

## Comment vérifier

```bash
# 1) les verbes existent au bon niveau, et la frontière est écrite côté archive
grep -nE '^\| `(start|close|check|run)`' products/mega-city/skills/ezk-sprint/SKILL.md
grep -c "ezk-sprint close" products/mega-city/skills/ezk-archive/SKILL.md

# 2) le mécanisme : start, close, enchaînement, check en lecture seule
bash products/mega-city/skills/ezk-sprint/scripts/test-sprint-lifecycle.sh

# 3) le contrat de prose, d'ADR et de catalogue
pnpm --dir products/mega-city exec vitest run src/__tests__/ezk-sprint-lifecycle-contract.test.ts

# 4) la gate complète de mega-city
pnpm --dir products/mega-city test
pnpm --dir products/mega-city test:scripts
```

Revue narrative : une session enchaîne bien `start → stories (1 PR chacune) → close (incrément) → ezk-retro → planning → start → … → ezk-archive`.

## Notes / décisions

- Matière de conception (2026-09-30, brainstorm), committée avec la fiche : [ADR-0054](../../products/mega-city/docs/adr/0054-cloture-sprint-vs-archive-session.md) et le [schéma des 3 étages](../../products/mega-city/docs/adr/0054-cloture-sprint-vs-archive-session.svg).
- Verdicts du mini-panel : l'architecte dit GO-avec-amendements (garder 3 corps séparés, façade par pointeurs). Le scrum master note que le vrai conteneur Scrum est la session (retenu). Le terme du livrable de sprint est **Incrément**.
- Décision produit (PO) : le niveau **session** s'appelle « session », terme réel de Claude Code. Priorité **P0**.
- Doctrine réutilisée : les bornes de cycle de vie sont du mécanisme et de l'hygiène, pas des cérémonies (ADR-0039 §2).
- **Choix du grooming (2026-10-01).**
  - `SPRINT.md` suffit pour le POC : pas d'objet « sprint » persistant. Il est ignoré par git. Un nouveau `start` y garde les incréments déjà scellés et la section « Galères & gestes (labo) ».
  - Le planning, c'est `ezk-backlog` (`review`, `groom`, `next --ready-only`), composé par l'intake de `start`. Pas de verbe `planning`.
  - Le checkpoint avant merge (étape 9) reste par story. `close` ne repose pas « on continue ? ».
  - Dans le lot, `[x]` veut dire livrée et `[~]` reportée (elle retourne au backlog). Seule une case `[ ]` bloque `close`.
  - `ezk-archive close` (alias de `run`) reste, avec une phrase qui le distingue de `ezk-sprint close`.
  - Un sprint où rien n'est livré ne peut pas rester ouvert, sinon aucun `start` n'est plus possible. `close --abandon "<raison>"` le ferme sans incrément et garde le savoir de session. `stop` reste réservé à une annulation plus riche.

## ⤓ Absorbé : [`20260903085150321`](20260903085150321_nommage-commandes-scrum-safe.md)

Cette fiche a repris la doctrine de nommage Scrum/SAFe. Ses critères utiles sont intégrés ainsi :

- **Règle de nommage** : posée dans l'ADR-0054. Un mot Scrum là où Scrum en a un (story, sprint, incrément, planning, rétro). Le terme réel de l'outil pour ce que Scrum n'a pas (session). SAFe seulement pour un étage au-dessus du sprint, s'il faut le nommer.
- **Séparation product-build / sprint** : préservée. `ezk-product-build` compose `ezk-sprint` et n'en devient jamais un mode. Le test de contrat le vérifie.
- **Rename d'`ezk-product-build`** : non fait, en Suite. Fait nouveau : l'incrément est maintenant la sortie de chaque `ezk-sprint close`. Appeler `ezk-product-build` « `ezk-increment` » (penchant du PO au 2026-09-03) créerait donc une collision de sens. `ezk-train` ou le statu quo restent ouverts.
- **Panel adverse** : couvert par la revue adverse de la PR pour le POC. Le panel complet est en Suite.
