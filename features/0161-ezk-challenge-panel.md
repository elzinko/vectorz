---
id: 0161
title: ezk-challenge — panel de challenge adversarial réutilisable (relecteurs frais + gate)
type: feature
priority: P2
product: mega-city
epic: "20260813131737959"
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
- **Contrat de composition (candidat retenu, 2026-07-15)** : une **option générique
  `--challenge`** offerte par convention à tous les skills ezk-* — n'importe quelle
  invocation peut demander que son artefact de sortie passe par le panel avant d'être
  finalisé. Elle **ride la formalisation `composes` (0044)** plutôt que d'inventer sa
  propre plomberie. Bonus contrat de supervisabilité (0050) : la gate du panel peut émettre
  `gate.reached {outcome}` — la revue adverse devient elle-même un événement supervisable.

## Critères d'acceptation (esquisse)

- [ ] La primitive est **lens-agnostic** : elle expose un registre + un contrat, chaque skill injecte ses lentilles
- [ ] Le **gate** (contre-lecture à froid, verdict ship/no-ship) est centralisé, pas ré-écrit par consommateur
- [ ] `steelman` puis `red-team` sont des lentilles first-class du registre
- [ ] Au moins 2 consommateurs la composent (candidats : grooming 0056, ezk-article 0049, ezk-reviewer 0031)
- [ ] Décision documentée : primitive réutilisable vs étape interne — trancher au 2e consommateur
- [ ] L'option générique `--challenge` est spécifiée comme convention d'invocation (ride 0044) ; détails affinés au 1er consommateur réel
- [ ] Ligne rouge respectée : le registre de lentilles ne recopie PAS la bibliothèque de techniques BMAD (`methods.csv`) — voir Notes

## Notes

- **Contrat de composition (mis à jour 2026-07-15)** : `ezk-challenge` est FAIT pour être
  **appelé par d'autres skills**. Candidat retenu : l'option générique `--challenge` (cf.
  Proposition). Les détails (passage des lentilles, format du verdict) restent à affiner au
  1er/2e consommateur réel — la convention est posée, pas figée.
- **Pas une réinvention de la roue BMAD** (vérifié 2026-07-15) : l'*advanced elicitation*
  BMAD est un menu **séquentiel** de techniques (1-5 en v6), **human-in-the-loop**, dans le
  **même contexte** de conversation, à visée d'**enrichissement**. ezk-challenge est un panel
  **parallèle** en contextes **frais** (verdicts indépendants, sans ancrage), automatisable,
  à visée de **véto** (gate). Composant absent de BMAD, composable avec lui. **Ligne rouge** :
  si le registre de lentilles se met à cataloguer des dizaines de techniques d'élicitation,
  il recopie `methods.csv` de BMAD → stop.
- Substrats voisins qui partagent le shape (à ne pas réimplémenter) : `deep-research`
  (adversarially verify), skill `verify`, pattern adversarial-verify des workflows.
- Origine : discussion session 2026-07-15. Lié à 0049 (qui flague déjà l'extraction du panel)
  et à 0031. Frontière « composer, pas réimplémenter » (idiome ezk-ezk / ezk-pr-pilot).
