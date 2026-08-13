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

- 🟡 **`install.sh` mort** — cité dans `skills/ezk-backlog/SKILL.md:93` et `skills/ezk-sprint/SKILL.md:19`
  (« installés via `install.sh` de ce repo ») alors qu'aucun `install.sh` n'existe : le déploiement
  passe désormais par `lawgiver bind-global`.
- 🟡 **Rot de numérotation** — des réf « fiche NNNN » en prose pointent vers les **mauvaises** fiches
  courantes : `vz-product-builder/SKILL.md:49-51` & `ezk-backlog/SKILL.md:260` citent « 0057 » pour le
  panel de challenge (aujourd'hui [0161](0161-ezk-challenge-panel.md) ; 0057 = analyse méthode) ;
  « 0060 » pour vz (aujourd'hui 0164 ; 0060 = un bug) ; « 0008 » pour chief-judge (aujourd'hui [0113](0113-chief-judge.md)).
- 🟡 **Graphe `composes:` sous-peuplé** — seuls `ezk-product-builder/SKILL.md:3` et `ezk-sprint/SKILL.md:2`
  déclarent `composes:` ; le graphe Mermaid **généré** (`skills/README.md:49-59` via `src/core/composes-graph.ts`)
  rate donc des couplages réels décrits en prose : `ezk-pr-pilot`→preview/device/apk/backlog/commits,
  `ezk-sprint`→**ezk-codex** (étape 10), `ezk-retro`→backlog, `vz`→product-builder/sprint.

## Proposition

1. Remplacer les réf `install.sh` par le vrai geste de déploiement (`lawgiver bind-global`).
2. Re-pointer toutes les réf « fiche NNNN » en prose vers les ids racine courants (ou liens relatifs).
3. **Peupler `composes:`** (et `composes-external:`) sur chaque skill composant → le graphe généré dit vrai.
4. **Rendre ça testable** (le vrai livrable) : un test de contrat qui échoue si un chemin/skill/fiche
   cité dans un `SKILL.md` ne résout pas — calqué sur `skill-emission-contract.test.ts`, périmètre
   porté par [0066](0066-tester-un-skill-avant-merge.md).

## Critères d'acceptation (brouillon — DoR au grooming)

- [ ] 0 réf `install.sh` résiduelle ; réf « fiche NNNN » re-mappées.
- [ ] `composes:` renseigné sur tous les composants ; graphe généré cohérent avec la prose.
- [ ] Une réf morte introduite volontairement **fait rougir** une gate (critère sabotage 0066).

## Notes

- Bras d'enforcement `check-links` = fiche [0101](0101-cabler-check-links-ship-et-ci.md)
  (4 liens cassés mesurés 2026-08-13). Mécanisme `composes:` = fiche [0149](done/0149-formaliser-composes-inter-skills.md) (shippé).
- Coordonner avec la fille A (le rename `ezk-pr` déplace des réf).
