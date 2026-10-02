---
id: "20261002155911264"
title: "ezk-archive reprend proprement un run interrompu"
type: feature
priority: P2
product: mega-city
milestone:
version: V0.6
labels: [archive]
status: idea
pr:
evidence: none # outillage de clôture, pas d'écran
created: 2026-10-02
---

# 20261002155911264 — ezk-archive reprend proprement un run interrompu

**En clair.** Quand la clôture `ezk-archive` est coupée en plein travail, elle laisse un état à moitié
écrit, et le pilote doit vérifier à la main ce qui est fait. On rend la clôture reprenable : relancée,
elle voit ce qui manque, le complète, et n'écrit rien en double.

**Si tu arrives frais.** À la clôture d'une session, `ezk-archive run` écrit plusieurs choses : un
snapshot dans `docs/sessions/`, la mémoire projet, une note de passation (handoff) et une ligne
d'index de mémoire.

## Contexte / Problème

Session muti du 2026-10-01 : le sous-agent `ezk-archive` a été interrompu par la fin de session. Il
avait écrit le snapshot et la mémoire, mais ni la note de passation ni la ligne d'index. Rien ne
signalait que le run était incomplet : le pilote a tout revérifié avant de compléter.

Une seule occurrence à ce jour, mais elle touche le cœur de la promesse « ne rien perdre entre deux
sessions ».

## Proposition

- Écrire un marqueur de progression (étapes faites) au fil du run.
- Au relancement, `check` signale « run incomplet » et liste les étapes manquantes.
- Rendre chaque écriture idempotente : pas de doublon dans le handoff ni dans l'index.
- Repli si c'est trop lourd : une ligne dans le skill, « si interrompu, relancer `check` puis
  compléter ».

## Critères d'acceptation

- [ ] Un run coupé après l'étape 2, puis relancé, complète exactement les étapes manquantes.
- [ ] Aucun doublon dans la note de passation ni dans l'index de mémoire.
- [ ] `check` dit clairement qu'un run précédent est incomplet.

## Comment vérifier

Un test de la suite shell simule l'interruption (arrêt après l'étape 2), puis la relance :

```bash
pnpm --dir products/mega-city test:scripts
```

*(Bloc provisoire, précisé au grooming.)*

## Notes / décisions

- Origine : rétro muti du 2026-10-02 (capture muti
  `docs/captures/2026-10-02-retro-frictions-outillage-cross-repo.md`). Décision PO ✅, P2.
  L'architecte : la cause est connue (écritures non reprenables), une exploration préalable
  n'apprendrait rien. Avis minoritaires : P3 (dev), exploration d'abord (QA).
- Version V0.6 proposée par le pilote (P2 → release suivante) ; à confirmer au planning.
