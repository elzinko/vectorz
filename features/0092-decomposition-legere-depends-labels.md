---
id: 0092
title: Décomposition légère du backlog — champs depends: et labels: (anti-JIRA) + avenant ADR-0017
type: feature
priority: P2
product: mega-city
epic:
depends: []
labels: [enabler, method]
status: idea
ready:
pr:
created: 2026-07-25
---

# 0092 — Les axes de regroupement qui manquaient

## Contexte / Problème

Le backlog sait dire priorité, appartenance (`epic:`) et statut, mais pas : (a) une fiche
**dépend** d'une autre (aujourd'hui en prose + `status: blocked`, illisible machine — cf. 0038
« ni epic ni ordre, champ à concevoir ») ; (b) une **étiquette transverse** (article, r&d,
enabler) — aucun champ labels/tags n'existe. C'est du front-matter, pas du stockage.

## Proposition — 2 champs optionnels, zéro moteur

Après `epic:`, dans `feature-template.md` ET l'exemple de `SKILL.md` (les DEUX, sinon dérive
comme `version:`) :

    depends: []   # ids des fiches à shipper AVANT ; un seul sens, "blocks" est DÉRIVÉ, jamais écrit
    labels: []    # lentilles transverses plates, vocab curé (ex. [enabler, article, r&d]) ; classe, ne structure pas

- **Sous-tâches** : PAS de champ — cases `- [ ]` dans les critères ; morceau shippable seul →
  fiche-enfant sous une épic.
- **Enablers** : le concept existe déjà en prose (fiche 0020 « Enabler stratégique ») → un
  **label**, pas un `type:` (type = nature du changement, orthogonal ; 0020 est feature ET
  enabler) ; un enabler se range avant sa feature via `depends:`.
- **Frontière depends vs blocked** : bloqueur = FICHE → `depends: [id]` + `status: todo` (se
  débloque au ship) ; bloqueur non-fiche (repo/ADR/infra) → `status: blocked` + prose.
- **MVP** : on DÉCLARE les champs (le LLM les lit, gratuit), aucune colonne rendue. Warnings
  plus tard, calqués sur l'intégrité épic de `regen-backlog.sh` (l.46-60) ; vérifier aussi
  `portfolio.sh`.

## Critères d'acceptation

- [ ] `depends:` et `labels:` déclarés dans le gabarit ET l'exemple SKILL.
- [ ] Avenant d'un paragraphe à ADR-0017 : nomme les 2 champs (surtout `labels`, qui rouvre le
      différé « pas de tags libres »), pose le vocab curé, nomme le contrat « front-matter =
      port de facto / regen = adaptateur de lecture md ».
- [ ] ≥1 dépendance réelle migrée de prose vers `depends:` (ex. 0039 → `depends: [0038]`).

## Notes

- Garde-fou anti-JIRA (ADR-0013) : dès l'envie de `blocks:` inverse, d'auto-déblocage, d'un
  graphe ou d'une colonne → STOP. Un champ à la fois, DUMB, sur preuve d'usage. Garder la
  décomposition de JIRA, jeter la cérémonie.
- Risque champ mort (cf. `version:`, outillé mais dans 0 fiche) : n'ajouter que si on s'engage à
  remplir. (Cette PR pose déjà `labels:`/`depends:` en exemple sur 0089-0093 — non encore
  déclarés au gabarit : latents, ignorés par `regen` tant que 0092 n'est pas livrée.)
