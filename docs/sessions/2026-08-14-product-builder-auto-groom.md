# Sprint — 0191 Lisibilité qui tient (product-builder --check-ready false)
Statut: fiche auto-groomée + ready (concurrence ezk-pm) — build à lancer
Run supervision: 2026-08-14T10-01-16-828Z-d779f2a1

## Notes / décisions (auto-mode)
- 2026-08-14 — **Sélection** : PO pré-autorise P1 ; auto-triage skippe 0050/0052/0051 (parkées LATER),
  20260812134515706 (travail concurrent ezk-ci), 0102/…846 (blocked), 0030/0164 (in-progress), 0034 (épic).
  PO choisit **0191** parmi les 5 groomables.
- 2026-08-14 — **Auto-groom + concurrence ezk-pm** (garde-fou ADR-0028, --check-ready false) :
  DoR atteinte (problème daté #125, critère testable AC3 « 3/3 reformulation » + vérif corps opaque).
  Scope **MVP AC1-AC3 IN** (template PR LLM-adapté matérialisé à l'étape d'écriture + inlining au moment
  de générer + vérif prose testable). **Déporté** : AC4 (étude BMAD) + AC5 (article ezk-article) → 2 fiches
  filles à créer à la clôture. ezk-pm **CONCOURT** → `ready: 2026-08-14` posé (auto-tampon, pas de STOP humain).
- Risque cadré par ezk-pm : la « vérif sur la prose » (AC3, 2ᵉ volet) peut exiger une décision archi
  (lentille ezk-reviewer dédiée corps de PR vs test de contrat) → 1 avis ezk-architect au build, sans
  remettre en cause le ready.

## Backlog du sprint
- [ ] feat: 0191 MVP — template PR LLM-adapté + inlining au moment d'écrire + vérif prose testable
- [ ] clôture: créer fiches filles AC4 (BMAD) + AC5 (article), lier à 0191

## À construire (MVP, cf. fiche 0191)
AC1 template · AC2 inlining au moment de générer · AC3 vérif prose (3/3 reformulation) · gate locale verte.
Cible probable : étape PR d'ezk-sprint/ezk-pr-pilot + asset template + check/lentille. Décision archi AC3 à trancher.
