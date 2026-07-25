---
id: 0093
title: BacklogStore — port de persistance agnostique (md/git · GitHub · Jira…) — IDEA, sur trigger
type: feature
priority: P3
epic:
depends: []
labels: [r&d, article]
status: idea
ready:
pr:
created: 2026-07-25
---

# 0093 — La gateway de backlog (question ouverte, pas un chantier)

## Contexte / Problème

« Et si le produit était agnostique à la manière dont les états scrum sont stockés (.md, GitHub
Issues, Jira, autre) ? » — une gateway + adaptateurs pilotés par un agent. Presque un nouveau
produit.

## Verdict (panel 2026-07-25) : ne PAS construire maintenant

- **YAGNI** : persistance plate (fiches md + regen + skill qui édite) ; on créerait un port sans
  2ᵉ adaptateur à remplir.
- **Rouvre un invariant tranché** : ADR-0016 (C) / ADR-0017 (D) ont **rejeté** GitHub
  Projects/Jira pour garder « backlog md sur main = source de vérité, relu en diff, visible de
  tous les worktrees ». Git n'est pas un stockage interchangeable : il EST le journal d'audit +
  la revue en diff + la synchro worktrees.
- **Inversion coûteuse** : rendre le store interchangeable réifie en CODE le jugement qui est
  aujourd'hui un PROMPT (contre ADR-0001 « le script range, le LLM juge »).

## TRIGGER (ne groomer que si atteint)

Un 2ᵉ consommateur réel qui ne vit QUE dans GitHub Issues, ou un client qui impose Jira. Alors
seulement : ADR de **réouverture** (pas un simple ajout de champ).

## Sous-tâche (article)

- [ ] **Article — intégration des LLM dans les patterns d'archi** (labels `article`, `r&d`) :
  thèse déjà sous les yeux — LLM + md + git jouent DÉJÀ l'adaptateur, le LLM remplace la couche
  use-case codée ; argument CONTRE l'hexagonalisation prématurée. Ouvre un champ de R&D « quand
  (dé)matérialiser un pattern d'archi à l'ère des LLM ».

## Notes

- Graine gratuite (dans `0092` ou un ADR) : nommer le contrat existant (« front-matter = port de
  facto ; regen = adaptateur md ; extraire un BacklogStore au 2ᵉ consommateur réel »).
- Instinct PO « presque un nouveau produit » = le bon signal : pari ultérieur sur demande, pas un
  refactor du produit actuel.
