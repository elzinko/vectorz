---
id: 0058
title: Rapport qualité de PR — les métriques et le résumé du test visibles dans chaque PR
type: feature
priority: P2
epic: 0051
status: idea
ready:
pr:
created: 2026-07-24
---

# 0058 — Rapport qualité de PR

## Contexte / Problème

Demande PO (2026-07-24) : « je dois pouvoir accéder rapidement aux outils et métriques depuis
chaque PR », avec « les métriques demandées par la méthode », « le résumé de ce qui a été
testé » et « les screenshots avant/après », **pour pouvoir valider**. Aujourd'hui, aucune fiche
ne couvre cette surface : les métriques iront dans le journal (0052) et dans mission-control
(0056), mais rien ne les montre **dans la PR**, là où la décision de merge se prend.

## Proposition

Un **commentaire GitHub automatique par PR**, composé de :

- les **métriques exigées par la méthode** (lues depuis le journal `.quality/` / les vues 0055),
  avec le delta vs la base ;
- le **résumé de ce qui a été testé** ;
- les **captures d'écran avant/après** quand la PR touche l'UI.

Règles de posture (héritées d'ADR-033) : le commentaire est une **vitrine, pas une source** —
c'est le **pas tiers (ou un lecteur)** qui poste, jamais la méthode auditée ; et le **gate DoD ne
lit jamais le commentaire** (il lit le journal). Techniquement : token CI standard avec
permission d'écrire les commentaires de PR — **zéro compte externe**. Compose les conventions
existantes (template PR ezk-sprint, `report` d'ezk-pr-pilot) — ne réinvente pas le posteur.

## Critères d'acceptation

- [ ] *(à groomer)* Chaque PR reçoit un commentaire avec ≥1 métrique **lue du journal**
- [ ] Le résumé « ce qui a été testé » y figure ; captures avant/après si UI
- [ ] Le **gate ne lit jamais le commentaire** (la vitrine n'est pas la source)
- [ ] Zéro compte externe (token CI standard)
- [ ] Gate locale verte

## Notes / décisions

- **Séquencement (proposition PO à confirmer au plan)** : à tirer **avant** le gate 0053 —
  bloquer des PRs avant que les devs **voient** les métriques serait le mauvais ordre d'adoption
  (visibilité avant punition).
- Une **version minimale** (une ligne « couverture : X % ») peut atterrir dès 0052 — arbitrage
  PO en cours.
- Dépend de [0052](0052-socle-metrique-port-adaptateur-silo.md) (le journal doit exister).
