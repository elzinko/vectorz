---
id: 0139
title: Garde-fous d'intégrité/qualité des agents (advisory + enforced)
type: feature
priority: P3
product: mega-city
status: idea
pr:
created: 2026-07-12
---

## Contexte / Problème
Un agent (ex. le dev qui reçoit une revue) peut être **paresseux** : appliquer aveuglément tous les
findings, ou au contraire les rationaliser/ignorer. On veut lui donner des **garde-fous
d'intégrité/qualité** — pas de la « morale » floue, des **invariants vérifiables** — qui viennent de
mega-city (catalogue Rules/iamthelaw appliqué aux agents).

## Proposition
Des règles d'intégrité **advisory ET enforced** sur les agents. Exemple : « le dev ne ferme jamais un
finding sans l'appliquer OU le rejeter avec justification traçable ». Enforcement en 3 couches
(échelle de coût) :
1. **Contrat de sortie structuré** (fonction) : pour chaque finding, `{decision: applied|rejected,
   evidence}` ; aucun finding silencieusement abandonné ; `applied` → un diff touche le file:line.
   Échec → le tour de l'agent est rejeté (il refait). = un `DoDCheck` sur l'artefact de réponse.
2. **Evidence gate** (fonction) : « applied » mais le diff ne touche pas l'endroit → violation.
3. **Juge** (llm, la part floue) : la justification d'un rejet est-elle substantielle ? verdict qui bloque.

La règle = advisory (texte dans le prompt) ; le **check** = enforced. Livré via le mécanisme `capture`
(interaction/competence sur l'agent, cf. 0013).

## Critères d'acceptation
- [ ] au moins 1 invariant d'intégrité exprimé advisory + enforced (check).
- [ ] le check est **hybride** (fonction pour le structurel, juge pour le flou).
- [ ] appliqué au moins à l'agent dev (ezk-dev, cf. 0030) sur la boucle de revue.
- [ ] articulation clarifiée avec le chief-judge (0008, lui advisory/non-bloquant).

## Notes / décisions (brainstorm 2026-07-12)
- S'appuie sur **0013** (capture d'interaction dans le frontmatter d'agent) : c'est le VÉHICULE de livraison.
- Cousin **enforced** de **0008** (chief-judge = advisory, non-bloquant). Distinguer les deux.
- Facette de [[0033]] (le modèle typé) : les garde-fous = attributs de nœud-agent.
- Domaine à creuser avant impl (le « domaine » des règles d'intégrité vient de mega-city).
