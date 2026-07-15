---
id: 0060
title: vz-product-builder — product-builder autonome à corpus de reviewers (overlay, n'écrase pas ezk-*)
type: feature
priority: P1
status: in-progress
pr:
created: 2026-07-14
---

# 0060 — vz-product-builder : l'autonomie par le corpus, pas par le silence

## Contexte / Problème

Le PO veut utiliser le product-builder **sans avoir à répondre à ses questions** : quand
l'agent se pose une question, c'est **lui qui convoque un corpus de reviewers** (panel
multi-lentilles + contradicteurs + synthèse — la mécanique de la revue cop1 du 2026-07-14)
au lieu d'interrompre l'humain. Contraintes posées par le PO :

- **Ne pas toucher aux skills ezk-\*** (sa prod) → préfixe distinct `vz-`, skill **overlay**.
- Les **4 STOP humains** (ADR-0011 §3) restent non automatisables.
- Un panel coûte cher (~0,4-1M tokens) → **échelle de coût de décision** à 3 crans
  (l'idée « hybrid decision cost-ladder » de la fiche 0034).

## Proposition

`skills/vz-product-builder/SKILL.md` : charge la doctrine d'ezk-product-builder telle
quelle, puis applique 3 overrides — (1) checkpoints → convocations de corpus selon
l'échelle solo / ezk-pm / panel ; (2) les 4 STOP humains + garde-fou merge inchangés ;
(3) **supervisabilité obligatoire** : le mode refuse de démarrer sans le kit émetteur
(fiche 0050) — chaque décision de corpus = un `gate_reached` journalisé dont le rapport
EST le rapport du panel. L'audit du matin répond à « qui a décidé quoi cette nuit, et
pourquoi ». vz-product-builder devient ainsi la **première méthode réelle conforme au
contrat** (critère de la fiche 0050).

## Critères d'acceptation

- [ ] Un `build` complet enchaîne ≥2 sprints sans question à l'humain hors des 4 STOP.
- [ ] Chaque décision de checkpoint est journalisée (gate + rapport de corpus en artefact).
- [ ] Un checkpoint « structurant » convoque un vrai panel (≥3 lentilles + ≥1 contradicteur)
      et la synthèse tranche (pas de « les deux se valent »).
- [ ] ezk-product-builder est chargé, jamais modifié (diff ezk-* vide).
- [ ] `--tokens cap` par défaut (l'autonomie exige une borne).

## Notes / décisions

- Origine : demande PO 2026-07-14 (« avancer sans répondre à mes questions » + « autre
  préfixe pour ne pas écraser mes skills »). Compose : fiche 0050 (kit émetteur, mergée
  PR #8), fiche 0034 (cost-ladder), fiche 0033 (siège échangeable), revue cop1
  2026-07-14 (modèle un-siège/deux-autorités : le corpus = la policy du point de décision
  MÉTHODE ; le régalien humain/cop1 n'est pas touché).
- Préfixe `vz-` = signature Vectorz ; renommable par le PO.
