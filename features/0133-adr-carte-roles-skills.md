---
id: 0133
title: ADR + diagramme — carte rôles dev → skills/agents ezk-*
type: feature
priority: P1
product: mega-city
status: idea
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

> **Re-scope 2026-07-17 (review) — composer la carte vivante existante, pas en créer une 3ᵉ.**
> Depuis la création de cette fiche, `docs/method-map.md` a été livré (PR #22) : une carte
> **vivante** à 2 couches (la méthode = le flux de travail ; le contrat = les events émis).
> Elle ne porte **pas** l'organigramme des **rôles** (chaîne de valeur PO/BA → Archi → Dev →
> QA → Reviewer → Scrum master). Cette fiche ajoute donc une **strate « rôles »** à
> `method-map.md` (nouvelle couche, même fichier vivant, même règle de maj de la fiche 0068) —
> **et non** un ADR + un diagramme séparés qui divergeraient. L'ADR reste optionnel (juste pour
> figer le vocabulaire rôle vs capacité) si le besoin s'en fait sentir au grooming.

Ajouter à `docs/method-map.md` une **couche « rôles »** montrant **deux strates distinctes** :

- **Rôles de la chaîne de valeur** : PO/BA (`ezk-backlog` + `product-brainstorming`) →
  Architecte (`ezk-architect`) → Dev (`ezk-dev`, cf. 0030 ; TDD = *capacité*, pas rôle) →
  QA (`ezk-qa`) → Reviewer (`ezk-reviewer`/`code-review`, cf. 0031) → Scrum master
  (`ezk-sprint`) → Product Owner multi-sprints (`ezk-product-builder`).
- **Couches de management orthogonales** (hors chaîne de valeur) : integration/release
  manager sur un stock de PRs (`ezk-pr`), clôture de session (`ezk-archive`).

Distinguer explicitement **rôle** vs **capacité** (TDD, rules… = capacités mobilisées
par un rôle — aligné avec le domaine mega-city).

**Clé de voûte** : cette fiche fige le **vocabulaire des rôles**, donc elle éclaire 0045
(qui absorbe l'ancienne 0030 `ezk-dev`→`ezk-dev`) et 0031 (`ezk-reviewer`). Recommandé
**avant** eux, mais non bloquant : 0045 s'appuie déjà sur le modèle de domaine mega-city.

## Critères d'acceptation
- [ ] Une **couche « rôles »** est ajoutée à `docs/method-map.md` (pas un fichier séparé),
      rendant sur GitHub, maj au fil de l'eau (règle 0068).
- [ ] Les deux strates (chaîne de valeur / couches de management) sont visuellement distinctes.
- [ ] Chaque skill/agent `ezk-*` est mappé à un rôle **ou** une couche (aucun orphelin).
- [ ] La distinction rôle vs capacité est explicite.
- [ ] ADR **optionnel** : rédigé seulement si le vocabulaire rôle/capacité mérite d'être figé.

## Notes

Issu du grooming de session livestreamz du 2026-07-12 (composer pour capitaliser
cross-repo : livestreamz / cop1 / mega-city). Parent de 0030 et 0031.
