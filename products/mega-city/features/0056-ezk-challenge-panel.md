---
id: 0056
title: ezk-challenge — panel de challenge adversarial réutilisable (relecteurs frais + gate)
type: feature
priority: P2
status: idea
pr:
created: 2026-07-15
---

## Contexte / Problème

Le même déroulé de **confrontation adversariale** réapparaît dans plusieurs skills, ré-encodé
à chaque fois : relecteurs **frais / zéro-contexte**, **une lentille par relecteur**,
application des retours, puis **contre-lecture à froid** rendant un verdict explicite
(ship / no-ship) — l'invariant qui rattrape ce que le consensus a manqué. On le voit déjà sur
3 artefacts hétérogènes : décisions d'archi (ADR), `ezk-article` (0049, panel de relecteurs
frais), et code-review (`ezk-reviewer` 0031). Règle de trois franchie → capacité **transverse**,
pas un détail interne à un skill.

## Proposition (à cadrer)

Extraire une **primitive MINCE** `ezk-challenge` (nom candidat) que d'autres skills composent :

- **Cœur invariant** (centralisé) : (1) discipline de relecteurs frais / zéro-contexte,
  (2) fan-out parallèle une-lentille-par-agent, (3) **gate** de contre-lecture à froid avec
  verdict explicite, (4) un **registre de lentilles** réutilisables (steelman→red-team,
  fidélité-aux-sources, testabilité / cohérence, correctness / sécurité, lecteur cible…).
- **Laissé au consommateur** : le **choix des lentilles** et l'**artefact** sous revue.
- **Séquence anti-abstraction-prématurée** : inline chez le 1er consommateur, extraire vers la
  primitive **au 2e** — ne centraliser d'abord que le gate + le registre.

## Critères d'acceptation (esquisse)

- [ ] La primitive est **lens-agnostic** : elle expose un registre + un contrat, chaque skill injecte ses lentilles
- [ ] Le **gate** (contre-lecture à froid, verdict ship/no-ship) est centralisé, pas ré-écrit par consommateur
- [ ] `steelman` puis `red-team` sont des lentilles first-class du registre
- [ ] Au moins 2 consommateurs la composent (candidats : grooming 0055, ezk-article 0049, ezk-reviewer 0031)
- [ ] Décision documentée : primitive réutilisable vs étape interne — trancher au 2e consommateur

## Notes

- **Point ouvert (relevé par l'utilisateur)** : `ezk-challenge` est FAIT pour être **appelé par
  d'autres skills** — le **contrat de composition** (comment un skill l'invoque, lui passe ses
  lentilles, récupère le verdict) reste **à cadrer plus tard**. Ne pas le figer maintenant ;
  le laisser émerger du 1er/2e consommateur réel.
- Substrats voisins qui partagent le shape (à ne pas réimplémenter) : `deep-research`
  (adversarially verify), skill `verify`, pattern adversarial-verify des workflows.
- Origine : discussion session 2026-07-15. Lié à 0049 (qui flague déjà l'extraction du panel)
  et à 0031. Frontière « composer, pas réimplémenter » (idiome ezk-ezk / ezk-pr-pilot).
