---
# id : horodatage AAAAMMDDHHMMSSmmm QUOTÉ (17 chiffres > MAX_SAFE_INTEGER) posé par `add` (scripts/mint-id.sh) — nom <id>_<slug>.md
id: "20261117114426425"
title: ezk-sprint prévoit le développeur isolé et rapatrie son travail par patch
type: feature
priority: P3
product: mega-city
milestone:
version:
labels: [ezk-sprint, agents]
status: idea
pr:
evidence: none # pas d'écran : texte d'un skill
created: 2026-11-17
---

# 20261117114426425 — ezk-sprint prévoit le développeur isolé et rapatrie son travail par patch

**En clair.** Quand ezk-sprint confie le code à ezk-dev, l'outil isole le développeur dans son propre
dossier de travail. Le brief lui demande pourtant d'écrire dans le dossier de la session : il ne le peut
pas, le dit, et l'orchestrateur rapatrie le travail à la main. Le skill doit prévoir ce cas dès le brief.

**Si tu arrives frais.** ezk-sprint est le skill qui mène un sprint. ezk-dev est l'agent qui écrit le
code en TDD. Un dossier de travail (worktree) est une copie du dépôt sur sa propre branche.

## Contexte / Problème

Au sprint du 17 novembre, le brief d'ezk-dev disait « travaille uniquement dans le dossier de la
session ». L'outil a placé l'agent dans `.claude/worktrees/agent-<id>` et lui a interdit d'écrire
ailleurs. Le travail est revenu par un patch, appliqué à la main. La mémoire du projet note le même
symptôme lors de sprints antérieurs.

## Proposition

1. Le brief type d'ezk-dev, dans `skills/ezk-sprint/SKILL.md`, dit : tu écris dans ton dossier isolé,
   tu ne committes pas, tu rends la liste des fichiers.
2. L'étape suivante d'ezk-sprint nomme le geste de rapatriement : patch indexé du dossier de l'agent,
   appliqué sur la branche de la story, puis installation des dépendances si le lockfile a changé.

## Critères d'acceptation

- [ ] Le brief type d'ezk-dev ne demande plus d'écrire hors de son dossier isolé.
- [ ] ezk-sprint décrit le rapatriement par patch en une étape, avec la commande.
- [ ] Un test de contrat sur le texte du skill vérifie la présence de ces deux points.

**Mesure de suivi** — sur les 3 prochaines délégations à ezk-dev, aucun aller-retour « je ne peux pas
écrire dans ce dossier ».

## Comment vérifier

```bash
cd products/mega-city && pnpm exec vitest run src/__tests__ -t "ezk-sprint"
```

## Notes / décisions

- Origine : [rétro du sprint 1 du 17 novembre](../docs/captures/2026-11-17-retro-sprint-1-voir-le-process-de-chaque-projet.md),
  proposition 2, retenue par délégation du PO absent.
- Priorité P3 posée par délégation ; le PO peut la revoir.
