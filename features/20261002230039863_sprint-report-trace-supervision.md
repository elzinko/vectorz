---
id: "20261002230039863"
title: Le rapport de sprint ne retrouve pas la trace de supervision d'un sprint
type: bug
priority: P3
product: mega-city
milestone:
version:
labels: [retro]
status: idea
pr:
evidence: none # outil en ligne de commande, pas d'écran
created: 2026-10-03
---

# 20261002230039863 — Le rapport de sprint ne retrouve pas la trace de supervision d'un sprint

**En clair.** Le rapport de sprint (`sprint:report`) cherche la trace de supervision dans le
dossier de travail courant. Or la trace s'écrit ailleurs : sous la racine que le serveur de
supervision a reçue. Le rapport échoue donc, et la rétro ne peut pas demander à `ezk-chef` ses
candidats-recette.

**Si tu arrives frais.** La *trace de supervision* est le journal d'un run (ouverture, points
d'arrêt, clôture), écrit par le serveur MCP de supervision. `sprint:report` s'en sert pour dater
un sprint.

## Contexte / Problème

**Le symptôme, daté.** 2026-10-03, rétro de la session du 2026-10-02. La commande
`pnpm --dir products/mega-city sprint:report done-par-story --out <scratch>`, lancée depuis le
dossier de travail `.claude/worktrees/ready-todo-status-distinction-d96e52`, répond : aucun gate
`sprint-done-par-story-checkpoint` sous `<dossier de travail>/products/mega-city/.supervision/runs`.
Le run `2026-10-02T14-26-35-210Z-e464ca1f` existe pourtant ; il a été écrit sous une autre racine.

C'est la suite de la fiche livrée
[« Domaine métriques de sprint »](done/20260826082120062_domaine-metriques-de-sprint-rapport.md).

## Proposition

- `sprint:report` cherche la trace là où le serveur de supervision l'écrit (sa racine déclarée),
  et pas seulement sous le dossier de travail.
- Sans trace trouvée, le message dit où il a cherché et comment pointer la bonne racine.

## Critères d'acceptation

- [ ] Lancé depuis un dossier de travail secondaire, `sprint:report` retrouve la trace d'un sprint
      supervisé depuis ce dossier.
- [ ] Sans trace, le message nomme les racines cherchées.

## Comment vérifier

```bash
pnpm --dir products/mega-city sprint:report <slug> --out /tmp/rapport
```

- Lancé depuis un dossier de travail secondaire après un sprint supervisé : le rapport s'écrit.

## Notes / décisions

- Retenue à la rétro du 2026-10-03 :
  [capture](../docs/captures/2026-10-03-retro-session-2026-10-02.md), proposition 6.
- Priorité **P3 proposée** par l'agent, sur délégation du PO.
