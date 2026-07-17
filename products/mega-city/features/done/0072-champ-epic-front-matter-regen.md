---
id: 0072
title: épics — type epic + champ front-matter epic + rendu regen groupé (ADR-0017)
type: feature
priority: P2
status: shipped
ready: 2026-07-17
pr: "#30"
created: 2026-07-17
---

# 0072 — Épics : `type: epic`, champ `epic:` et rendu regen

## Contexte / Problème

Le regroupement en épics existe de facto (fiche racine vectorz 0034 « épic » dans le
titre, enfants référencés en prose) mais n'est ni machine-lisible, ni visible dans
l'index, ni vérifiable. Décision actée : **ADR-0017** (amendée par le panel du
2026-07-17 : A2 épic jamais tirable, A7 intégrité au script, A12 colonne tranchée,
A13 regen paramétré + migration complète).

## Proposition

1. Playbook ezk-backlog : enum `type` étendu (`epic`), champ optionnel `epic: <id>`
   documenté (template + §add/next/regen/review) + règle de résolution multi-backlog
   (le plus proche du cwd, demander si ambigu — A13).
2. **Épic jamais tirable** (A2) : `regen` sort les `type: epic` du tableau actionnable
   trié (section à part, comme les `idea`) ; `next --ready-only` descend sur le
   prochain enfant ready, sinon fiche suivante.
3. **Intégrité au script** (A7) : `regen` émet un warning non bloquant sur `epic:`
   pendant (id inexistant) ou pointant une fiche non-`type: epic` — en plus du
   jugement LLM (`add`/`review`).
4. **Rendu = colonnes conditionnelles** (A12) : `regen` implémente les DEUX colonnes
   (`Version` + `Épic`) — la mécanique `Version` décrite dans le SKILL.md n'existe pas
   encore dans le script (vérifié sur pièce par le panel). Sections par épic différées
   sur preuve d'usage.
5. **Paramétrage du script** (A13) : chemin racine + titre d'index en paramètres, au
   lieu de l'ancrage dur mega-city (l'index racine est déjà une « adaptation »).
6. Migration **complète** du backlog racine (A13) : 0034 → `type: epic` ; filles
   actives (0038/0039/0040) **et livrées** (0035/0036/0037, dans `done/`) → `epic: 0034`.

## Critères d'acceptation

- [ ] Une fiche avec `epic: <id>` inexistant ou non-epic déclenche un warning du script
      (+ signalement add/review côté LLM).
- [ ] `regen` sans aucune fiche `epic:`/`version:` → index inchangé (non cassant).
- [ ] `regen` avec fiches `epic:` → colonne Épic ; avec `version:` → colonne Version ;
      les `type: epic` sortent du tableau actionnable (section à part).
- [ ] Script paramétré (chemin + titre) utilisé tel quel par les DEUX backlogs
      (mega-city et racine).
- [ ] Migration racine complète : 0034 + 0035→0040, index racine régénéré.
- [ ] Deux niveaux max (épic → story) : pas de sous-épics (ADR-0017 §5).

## Notes / décisions

- 2026-07-17 — **gate `ready` passé** (DoR complète : problème / valeur / critères, ADR-0017
  accepté). **Soupape PO journalisée** : fiche P2 tirée devant les têtes P1 (mega-city
  0049/0052/0055/0061/0069/0070 ; racine 0041/0044/0045, toutes non-ready) par décision
  explicite du PO au checkpoint « aucune fiche ready » — motif : compléter l'outillage
  backlog conditionne l'automatisation Desktop et la descente d'épic de `next --ready-only`.
- Origine : ADR-0017 (2026-07-17). Phase 2 du rollout Pareto d'ADR-0016 §5 — non
  bloquant pour les rituels (le champ est utile en lecture avant même le rendu).
- Le script `regen-backlog.sh` actuel ignore les champs inconnus : poser `epic:` dans
  des fiches avant l'implémentation du rendu est déjà sûr.
