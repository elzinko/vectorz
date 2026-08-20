---
id: "20260813131737968"
title: Assainir les références de la méthode — install.sh mort, rot de numérotation, graphe composes: sous-peuplé
type: chore
priority: P2
product: mega-city
version:
epic: "20260813131737959"
status: idea
ready:
pr:
created: 2026-08-13
---

# Assainir les références de la méthode

## En clair

Des textes de skills citent des choses qui n'existent plus ou pointent à côté : un `install.sh`
disparu, des numéros de fiches périmés, et un **graphe de composition généré qui ment** (parce que
le champ `composes:` n'est renseigné que sur 2 skills). Aucune gate ne rougit là-dessus — c'est
exactement le trou prouvé par la fiche [0066](0066-tester-un-skill-avant-merge.md).

## Contexte / Problème (findings audit 2026-08-13)

- 🟡 **`install.sh` mort** — cité dans `skills/ezk-backlog/SKILL.md:93`, `skills/ezk-sprint/SKILL.md:19`
  **et le catalogue `skills/README.md:15`** (« utilisables tels quels via `install.sh` » — instruction
  courante, pas archive) alors qu'aucun `install.sh` n'existe : le déploiement passe désormais par
  `lawgiver bind-global`.
- 🟡 **Rot de numérotation** — des réf « fiche NNNN » en prose pointent vers les **mauvaises** fiches
  courantes : `vz-product-builder/SKILL.md:49-51` & `ezk-backlog/SKILL.md:260` citent « 0057 » pour le
  panel de challenge (aujourd'hui [0161](0161-ezk-challenge-panel.md) ; 0057 = analyse méthode) ;
  « 0060 » pour vz (aujourd'hui 0164 ; 0060 = un bug) ; « 0008 » pour chief-judge (aujourd'hui [0113](0113-chief-judge.md)).
- 🟡 **Graphe `composes:` sous-peuplé** — seuls `ezk-product-builder/SKILL.md:3` et `ezk-sprint/SKILL.md:2`
  déclarent `composes:` ; le graphe Mermaid **généré** (`skills/README.md:49-59` via `src/core/composes-graph.ts`)
  rate donc des couplages réels décrits en prose : `ezk-pr`→preview/device/apk/backlog/commits,
  `ezk-sprint`→**ezk-codex** (étape 10, **délégué-si-présent**), `ezk-retro`→backlog, `vz`→product-builder/sprint.

## Proposition

1. Remplacer **les 3** réf `install.sh` (SKILL ezk-backlog + ezk-sprint **+ `skills/README.md:15`**)
   par le vrai geste de déploiement (`lawgiver bind-global`) — coordonner avec la fille A qui réécrit le README.
2. Re-pointer toutes les réf « fiche NNNN » en prose vers les ids racine courants (ou liens relatifs).
3. **Peupler la composition en CLASSANT chaque arête** (⚠️ ne PAS tout mettre en `composes:`) :
   `composes:` = dépendance **requise** ; `delegates:` = couplage **optionnel / dégradable-si-absent**
   (fiche [0190](0190-composes-delegates-tier-optionnel.md)) ; `composes-external:` = hors-catalogue
   (ADR-0025). Ex. : `ezk-sprint`→`ezk-codex` est **optionnel** (le profil `daily` l'omet) → `delegates:`,
   sinon faux warning de bind. **Se coordonner avec 0190**, ne pas le réinventer.
4. **Rendre ça testable** (le vrai livrable) : un test de contrat qui échoue si un chemin/skill/fiche
   cité dans un `SKILL.md` ne résout pas — calqué sur `skill-emission-contract.test.ts`, périmètre
   porté par [0066](0066-tester-un-skill-avant-merge.md).

## Critères d'acceptation (brouillon — DoR au grooming)

- [ ] 0 réf `install.sh` résiduelle ; réf « fiche NNNN » re-mappées.
- [ ] Chaque arête **classée** (`composes:` requis / `delegates:` optionnel–[0190] / `composes-external:`) ; graphe cohérent avec la prose, **0 faux warning** de bind (profil `daily`).
- [ ] Une réf morte introduite volontairement **fait rougir** une gate (critère sabotage 0066).

## Notes

- Bras d'enforcement `check-links` = fiche [0101](done/0101-cabler-check-links-ship-et-ci.md)
  (4 liens cassés mesurés 2026-08-13). Mécanisme `composes:` = fiche [0149](done/0149-formaliser-composes-inter-skills.md) (shippé) ;
  **tier optionnel `delegates:`** = fiche [0190](0190-composes-delegates-tier-optionnel.md) — cette
  fille s'y **coordonne**, ne le réinvente pas.
- Coordonner avec la fille A (le rename `ezk-pr` déplace des réf).
