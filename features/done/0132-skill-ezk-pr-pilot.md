---
id: 0132
title: "ezk-pr-pilot : orchestrateur du test-puis-merge d'un stock de PRs (+ convention Validation)"
type: feature
priority: P1
product: mega-city
status: shipped
pr: "merge local feat/skill-ezk-pr-pilot"
created: 2026-07-06
---

## Contexte / Problème

Rétrofit livestreamz 2026-07-06 (PRs #69–#79) : un stock de PRs hétérogènes (docs /
web mergeable-si-vert / mobile device-test-obligatoire) sans ordre de merge ni plans
de test rejouables. 7/8 corps de PR avaient une section Validation, aucune n'était
exécutable sans contexte. Le tri manuel a montré le pattern : plan (merge-tree,
sessions groupées) → run (bancs, checklists, signaux observables) → report → ship.

## Proposition

Skill `ezk-pr-pilot` (voir [ADR-0009](../../products/mega-city/docs/adr/0009-ezk-pr-pilot-orchestrateur-validation-prs.md)) :
`init` installe la convention « Validation » (template PR **mince** lié à
`docs/PR_VALIDATION.md` ; template existant → **jamais écrasé**, section-lien
agrégée) ; `plan` / `run` / `report` / `ship` consomment le stock en composant
ezk-preview, ezk-device/ezk-apk, verify/run, ezk-backlog, ezk-commits.

## Critères d'acceptation

- [x] SKILL.md conforme (description déclenchante, sous-commandes, frontière ezk-sprint, garde-fous)
- [x] Asset `PR_VALIDATION.template.md` générique (adaptable : modalités du repo)
- [x] `init` distingue template absent (créer) / existant (agréger un lien, ne pas écraser)
- [x] Catalogue skills/README.md à jour ; ADR-0009
- [x] Référencé par le profil global (bind daily-driver) — finding steward

## Notes

- **Follow-up (dogfooding)** : première exécution réelle de `plan`/`run` sur le stock
  livestreamz — à faire à la prochaine session de validation.

- Né en session livestreamz (worktree fervent-borg) — la version manuelle du plan
  vit dans les commentaires « 🧪 Plan de test » des PRs livestreamz #69–#78 et la
  convention dans sa PR #79.
- Symlink `~/.claude/skills/ezk-pr` à poser après retour du checkout principal
  sur une branche contenant le skill (déploiement non-destructif, cf. ezk-ezk).
