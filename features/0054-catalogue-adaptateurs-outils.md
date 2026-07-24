---
id: 0054
title: Catalogue d'adaptateurs — ajouter un outil de métrique sans réinventer la roue
type: feature
priority: P2
epic: 0051
status: idea
ready:
pr:
created: 2026-07-22
---

# 0054 — Catalogue d'adaptateurs (ajouter un outil sans réinventer)

## Contexte / Problème

Demande PO : « ajouter de l'outillage pour avoir des métriques, sans ré-inventer la roue » et
« les outils doivent être language-agnostic sinon on ne s'en sort pas ». Après la couverture
(0052), il faut pouvoir brancher **sécu** (CodeQL / Snyk) et **qualité globale** (SonarCloud)
**sans réécrire** la chaîne. Point clé : **installer un outil = un PRÉALABLE (provisioning)**,
distinct de la règle et de l'ajout de règle.

## Proposition

- **Documenter + outiller le pattern** « nouvel adaptateur derrière `MetricPort` » : un contrat
  d'adaptateur, un test de conformité, un point d'enregistrement.
- Ajouter un **2ᵉ adaptateur** (sécu : CodeQL ou Snyk) et un **3ᵉ** (SonarCloud) — tous
  **language-agnostic**.
- **Provisioning** décrit comme **préalable** : installation / activation du SaaS,
  consentement, secret — **par config**, jamais en dur, jamais dans la règle.
- Moissonner la **liste de capteurs** du relicat (0024) comme carte de départ.

## Critères d'acceptation

- [ ] Un **2ᵉ adaptateur** (sécu) produit un chiffre dans le silo **via le même port**
- [ ] Ajouter cet adaptateur **ne change ni le silo ni les règles** (extension pure)
- [ ] Doc « **ajouter un outil de métrique** » (contrat d'adaptateur + provisioning préalable)
- [ ] Le provisioning (secret/consentement) passe par la **config**
- [ ] Gate locale verte

## Notes / décisions

- Priorité aux outils **language-agnostic** (Codecov, SonarCloud, CodeQL le sont) — un adaptateur
  peut être spécifique à un langage, **le port et le silo ne le sont jamais**.
- **Codecov (couverture, SaaS) rejoint ce catalogue comme 1ᵉʳ adaptateur SaaS** (déplacé de 0052 —
  doctrine local-first, PO 2026-07-24). Candidats locaux zéro-compte d'abord : **jscpd**
  (duplication) puis **osv-scanner** (vulnérabilités).
- Alimente la **boucle rétro → config** (épic) : une rétro « ajoute un outil » = provisionner un
  adaptateur ici.
- Dépend de [0052](0052-socle-metrique-port-adaptateur-silo.md).
