---
id: 0028
title: ADR + diagramme — carte rôles dev → skills/agents ezk-*
type: feature        # feature | bug | refactor | chore
priority: P1         # P0 | P1 | P2 | P3
status: idea         # idea | todo | in-progress | blocked | shipped
pr:
created: 2026-07-12
---

## Contexte / Problème

La suite `ezk-*` forme **déjà** un organigramme d'entreprise de dev — mais implicite,
nulle part rendu **consultable**. Conséquences : la composition est ad-hoc, et on
confond **activités** et **rôles** (ex. « tester une app » n'est pas un rôle : c'est
éclaté entre QA = cahier de test, dev = faire tourner l'app, integration manager =
séquencer le stock). Sans carte, chaque nouveau skill/agent est placé au jugé.

## Proposition

Un **ADR** (dans la convention ADR de mega-city) + un **diagramme Mermaid** (rendu sur
GitHub, diffable, **maj au fil de l'eau**), montrant **deux strates distinctes** :

- **Rôles de la chaîne de valeur** : PO/BA (`ezk-backlog` + `product-brainstorming`) →
  Architecte (`ezk-architect`) → Dev (`ezk-dev`, cf. 0030 ; TDD = *capacité*, pas rôle) →
  QA (`ezk-qa`) → Reviewer (`ezk-reviewer`/`code-review`, cf. 0031) → Scrum master
  (`ezk-sprint`) → Product Owner multi-sprints (`ezk-product-builder`).
- **Couches de management orthogonales** (hors chaîne de valeur) : integration/release
  manager sur un stock de PRs (`ezk-pr-pilot`), clôture de session (`ezk-archive`).

Distinguer explicitement **rôle** vs **capacité** (TDD, rules… = capacités mobilisées
par un rôle — aligné avec le domaine mega-city).

**Clé de voûte** : cet ADR fige le **vocabulaire des rôles**, donc il **pilote** 0030
(rename `ezk-tdd`→`ezk-dev`) et 0031 (`ezk-reviewer`). À faire **avant** eux.

## Critères d'acceptation
- [ ] ADR écrit dans la convention mega-city, avec la décision et ses conséquences.
- [ ] Diagramme Mermaid (as-code) rendant sur GitHub, facile à maj.
- [ ] Les deux strates (chaîne de valeur / couches de management) sont visuellement distinctes.
- [ ] Chaque skill/agent `ezk-*` est mappé à un rôle **ou** une couche (aucun orphelin).
- [ ] La distinction rôle vs capacité est explicite.

## Notes

Issu du grooming de session livestreamz du 2026-07-12 (composer pour capitaliser
cross-repo : livestreamz / cop1 / mega-city). Parent de 0030 et 0031.
