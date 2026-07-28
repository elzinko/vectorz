---
id: 0053
product: vectorz
title: Gate DoD adossé à une métrique — bloquer une PR si un seuil qualité n'est pas tenu
type: feature
priority: P2
epic: 0051
status: idea
ready:
pr:
created: 2026-07-22
---

# 0053 — Gate DoD adossé à une métrique

## Contexte / Problème

Demande PO : « ne pas valider une PR si des métriques ne sont pas respectées — ce sont des
conditions de build. » *Correction douce : c'est la **DoD** (Definition of Done, au gate de
complétion), pas la DoR (prête à démarrer).* La **règle** (« couverture ≥ seuil ») vit dans la
**méthode** ; elle **lit le port** de métrique et **compare à un seuil** (config) ; l'outil qui
produit le chiffre reste un **adaptateur côté produit**. C'est la matérialisation de la
trichotomie **règle / capacité / config** de l'épic.

## Proposition

Câbler une **règle DoD** via le **Rules port (ADR-020, dod-completion-gate)** qui **consulte la
valeur déjà mesurée** (pas l'adaptateur en direct — cf.
[ADR-033](../docs/adr/ADR-033-port-metrique-qualite-produit.md) F1/F5) et **échoue si sous le
seuil**. La règle est **language-agnostic** (elle parle de la métrique, pas de l'outil) ; le
**seuil est de la config** modifiable sans toucher la règle ; message d'échec **lisible**
(« couverture 71 % < seuil 80 % sur la PR #… »). **Fail-closed** : **pas de mesure valide ⇒
refus** (l'absence de chiffre ne vaut jamais « c'est bon »).

## Critères d'acceptation

- [ ] Une règle DoD **refuse** une PR sous le seuil, **passe** au-dessus (fixture)
- [ ] **Fail-closed** : **pas de mesure valide ⇒ refus** (on ne distingue pas « pas de code
      testable », « outil non lancé », « mesure fabriquée » — les trois bloquent)
- [ ] **Mutation testing** (ou équivalent anti-tests-vides) est un **critère du gate** : une PR à
      couverture haute mais **tests sans assertion échoue**
- [ ] Le **seuil est de la config** : le changer ne modifie **pas** la règle
- [ ] La règle **consulte la valeur déjà mesurée** (pas l'adaptateur en direct ; aucun couplage à
      un outil précis)
- [ ] Message d'échec lisible (métrique, valeur, seuil, PR)
- [ ] Gate locale verte

## Notes / décisions

- Compose **ADR-020** (dod-completion-gate) + l'item 6 de
  [0046](0046-differes-contrat-ameliorabilite-parking.md) (« amélioration adoptée → DoDCheck via
  Rules port »).
- Documenter la distinction **DoR vs DoD** au passage (source de confusion).
- Dépend de [0052](0052-socle-metrique-port-adaptateur-silo.md).
