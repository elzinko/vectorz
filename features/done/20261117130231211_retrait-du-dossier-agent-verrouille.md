---
# id : horodatage AAAAMMDDHHMMSSmmm QUOTÉ (17 chiffres > MAX_SAFE_INTEGER) posé par `add` (scripts/mint-id.sh) — nom <id>_<slug>.md
id: "20261117130231211"
title: Le brief du développeur isolé dit comment retirer un dossier d'agent verrouillé
type: bug
priority: P3
product: mega-city
milestone:
version:
labels: [ezk-sprint, agents]
status: shipped
pr: "local (0060a88d)"
evidence: none # pas d'écran : texte d'un skill
created: 2026-11-17
---

# 20261117130231211 — Le brief du développeur isolé dit comment retirer un dossier d'agent verrouillé

**En clair.** Le skill ezk-sprint dit maintenant de retirer le dossier d'un développeur délégué avec
`git worktree remove --force`. Mais ce dossier est verrouillé par la session elle-même tant qu'elle
tourne, et git refuse alors avec une seule force. Il faut la double force, et le dire.

**Si tu arrives frais.** Un dossier d'agent est un worktree git créé par l'outil pour un sous-agent. Git
peut verrouiller un worktree ; `--force` deux fois passe outre le verrou.

## Contexte / Problème

Le 2026-11-17, au sprint 3, `git worktree remove --force .claude/worktrees/agent-<id>` a répondu
« cannot remove a locked working tree, lock reason: claude agent … (pid …) ». Le pid était celui de la
session en cours. `git worktree remove -f -f` a réussi.

## Proposition

Dans la section « Le développeur délégué travaille dans son dossier isolé » de
`skills/ezk-sprint/SKILL.md`, remplacer la commande de retrait par `git worktree remove -f -f
<dossier-agent>`, avec une phrase : le verrou vient de la session elle-même, le contenu est déjà
rapatrié. Le test de contrat suit.

## Critères d'acceptation

- [x] La section du skill donne `git worktree remove -f -f` et dit pourquoi en une phrase.
- [x] Le test de contrat `ezk-sprint-dev-isole.test.ts` vérifie la double force.

## Comment vérifier

```bash
cd products/mega-city && pnpm exec vitest run src/__tests__/ezk-sprint-dev-isole.test.ts
```

## Notes / décisions

**Livraison du 2026-11-17.** Revue adverse `ezk-reviewer` : GO, 2 critères prouvés. Garde faible notée (P2) : le test cherche le mot « verrouille » sans le lier à la commande.


- Origine : [rétro du sprint 3 du 17 novembre](../../docs/captures/2026-11-17-retro-sprint-3-carte-lisible-et-outillage.md),
  proposition 3, retenue par délégation du PO absent.
