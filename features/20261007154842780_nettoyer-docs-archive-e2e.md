---
id: "20261007154842780"
title: "Nettoyer docs/ : supprimer archive/, requalifier ou supprimer e2e/"
type: chore
priority: P2
product: vectorz
milestone: rationalisation
version: V0.9
labels: [convention, arborescence]
status: ready
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
3. Nettoyer `docs/index.md` : il porte **deux sections entières** qui pointent `archive/`
   (« Epoch-1 BMAD archive » et « Pre-Phase-A archive ») plus l'ancre et le renvoi du haut — à
   retirer, pas juste un lien. `e2e/` n'y est **pas** référencé (rien à toucher pour lui).
   Coordonner avec la fiche 3 qui édite aussi `index.md`.

**Ancrage (vérifié le 2026-10-07).** `docs/archive/` = **8 fichiers** (`epoch-1-bmad/` : 3,
`pre-phase-a/` : 5), tous historiques. `docs/e2e/` = **3 fichiers** (`README.md`, `auth-panel.md`,
`moniteur-smoke.md`). Le smoke automatisé est `scripts/cobaye-smoke.sh` (script pnpm
`cobaye:smoke`) : lire ce script pour confirmer qu'il exerce bien l'auth (fiche 0003) et le
Moniteur (fiche 0041) **avant** de supprimer `e2e/` ; sinon déplacer en `docs/tests/`. `index.md`
cite `archive/` aux lignes 8 (ancre), 36-40 et 42-44.

## Critères d'acceptation

- [ ] `docs/archive/` n'existe plus ; les **deux sections d'archive** de `docs/index.md` (+ l'ancre
      et le renvoi du haut) sont retirées.
- [ ] `docs/e2e/` est supprimé (couverture smoke vérifiée) **ou** déplacé en `docs/tests/`, avec
      une ligne disant pourquoi.
- [ ] Aucun lien mort introduit (gate liens verte).

## Comment vérifier

```bash
test ! -d docs/archive && echo "OK archive supprimé" || echo "KO archive reste"
ls docs/ | grep -E "^e2e$|^tests$" || echo "OK e2e retiré"
grep -nE "archive|epoch-1-bmad|pre-phase-a" docs/index.md && echo "KO sections d'archive restantes" || echo "OK index.md nettoyé"
bash products/mega-city/bin/test-links-repo.sh .   # 0 lien cassé
# Couverture smoke AVANT de supprimer e2e/ : lire le script, vérifier qu'il exerce auth + moniteur.
grep -nE "auth|moniteur|monitor" scripts/cobaye-smoke.sh
```

## Notes / décisions

- **Indépendante** (ne dépend pas du résolveur). Seule coordination : l'édition de `docs/index.md`
  avec la fiche 3.
- Lot V0.9, lié par `milestone: rationalisation` + `version: V0.9` (pas de chapeau).
