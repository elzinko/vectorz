---
id: "20261007154842780"
title: "Nettoyer docs/ : supprimer archive/, requalifier ou supprimer e2e/"
type: chore
priority: P2
product: vectorz
milestone: rationalisation
version: V0.9
labels: [convention, arborescence]
status: idea
pr:
evidence: none # ménage de dossiers, pas d'UI
created: 2026-10-07
---

# 20261007154842780 — Nettoyer docs/ (archive, e2e)

**En clair.** Fiche 4 du lot V0.9. Deux dossiers de `docs/` ne sont plus de la doc vivante :
`archive/` (BMAD époque-1 + pré-pivot, mort) et `e2e/` (checklists de test peu entretenues). On
supprime `archive/` (git garde l'historique) et on requalifie ou supprime `e2e/`. Indépendante des
autres fiches du lot — peut démarrer tout de suite.

**Si tu arrives frais.** Fiche sœur de la [fondation `scrum:`](20261001192624192_regrouper-artefacts-methode-dossier-scrum.md) ;
carte du lot dans [ADR-0066](../products/mega-city/docs/adr/0066-chemins-process-configurables-scrum.md).

## Contexte / Problème

`docs/archive/` contient l'audit/playbook BMAD d'époque-1 (retiré du dépôt par l'ADR-029) et des
docs pré-phase-A. C'est de la paléontologie : git conserve l'historique, le garder inline n'aide
personne. `docs/e2e/` porte 2 checklists E2E **manuelles** (fiches 0041/0003), peu entretenues ;
l'automatisé `pnpm cobaye:smoke` couvre le même terrain. À vérifier avant de supprimer.

## Proposition

1. **Supprimer `docs/archive/`** (git garde tout).
2. **`docs/e2e/`** : vérifier d'abord que `pnpm cobaye:smoke` couvre les checklists 0041/0003. Si
   oui → supprimer ; en cas de doute → déplacer en `docs/tests/` (jamais du process).
3. Nettoyer les liens de `docs/index.md` qui pointaient `archive/` et `e2e/` (coordonner avec la
   fiche 3 qui touche aussi `index.md`).

## Critères d'acceptation

- [ ] `docs/archive/` n'existe plus ; `docs/index.md` n'a plus de lien vers lui.
- [ ] `docs/e2e/` est supprimé (couverture smoke vérifiée) **ou** déplacé en `docs/tests/`, avec
      une ligne disant pourquoi.
- [ ] Aucun lien mort introduit (gate liens verte).

## Comment vérifier

```bash
test ! -d docs/archive && echo "OK archive supprimé" || echo "KO"
ls docs/ | grep -E "^e2e$|^tests$"
bash products/mega-city/bin/test-links-repo.sh .
# Couverture smoke des checklists avant suppression de e2e/ :
grep -nE "moniteur|auth" products/mega-city/… 2>/dev/null; pnpm cobaye:smoke --help 2>/dev/null || true
```

## Notes / décisions

- **Indépendante** (ne dépend pas du résolveur). Seule coordination : l'édition de `docs/index.md`
  avec la fiche 3.
- Lot V0.9, lié par `milestone: rationalisation` + `version: V0.9` (pas de chapeau).
