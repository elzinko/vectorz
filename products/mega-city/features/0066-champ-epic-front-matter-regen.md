---
id: 0066
title: épics — type epic + champ front-matter epic + rendu regen groupé (ADR-0017)
type: feature
priority: P2
status: todo
pr:
created: 2026-07-17
---

# 0066 — Épics : `type: epic`, champ `epic:` et rendu regen

## Contexte / Problème

Le regroupement en épics existe de facto (fiche racine vectorz 0034 « épic » dans le
titre, enfants 0038/0039/0040 référencés en prose) mais n'est ni machine-lisible, ni
visible dans l'index, ni vérifiable. Décision actée : **ADR-0017** — une épic est une
fiche (`type: epic`), le lien enfant→épic est un champ front-matter `epic: <id>`
(relation unique vérifiable, pas de tags libres, pas de dossiers).

## Proposition

1. Playbook ezk-backlog : enum `type` étendu (`epic`), champ optionnel `epic: <id>`
   documenté (template + §add/regen/review).
2. Contrôle d'intégrité : l'id référencé existe et est `type: epic` (vérifié par
   `review` et à l'`add`).
3. `regen` : rendu conditionnel du regroupement (colonne ou sections par épic) si au
   moins une fiche porte `epic:` — même mécanique que la colonne `Version`.
4. Migration au fil de l'eau du backlog racine vectorz : 0034 → `type: epic` ;
   0038/0039/0040 → `epic: 0034`.

## Critères d'acceptation

- [ ] Une fiche avec `epic: <id>` inexistant ou non-epic est signalée (add + review).
- [ ] `regen` sans aucune fiche `epic:` → index inchangé (non cassant).
- [ ] `regen` avec fiches `epic:` → regroupement visible dans l'index.
- [ ] 0034/0038/0039/0040 (racine) migrées, index racine régénéré.
- [ ] Deux niveaux max (épic → story) : pas de sous-épics (ADR-0017 §5).

## Notes / décisions

- Origine : ADR-0017 (2026-07-17). Phase 2 du rollout Pareto d'ADR-0016 §5 — non
  bloquant pour les rituels (le champ est utile en lecture avant même le rendu).
- Le script `regen-backlog.sh` actuel ignore les champs inconnus : poser `epic:` dans
  des fiches avant l'implémentation du rendu est déjà sûr.
