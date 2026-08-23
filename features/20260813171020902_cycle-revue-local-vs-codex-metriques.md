---
id: "20260813171020902"
title: Accélérer & fiabiliser le cycle de revue — alternative locale à Codex + métriques (temps, blocages)
type: feature
priority: P2 # aligné 0136 (famille revue) — à confirmer au grooming
product: mega-city
version:
epic:
status: idea
ready:
pr:
created: 2026-08-13
---

# Cycle de revue — alternative locale à Codex + métriques

## Contexte / Problème

Cas PO daté (session 2026-08-13). À chaque push d'une PR, une **revue Codex automatique** se
déclenche. Elle est **souvent pertinente** (désactivable, mais on veut la garder), mais :

1. **Lente** — le cycle « push → attendre le verdict Codex » ajoute plusieurs minutes à chaque
   itération.
2. **Bloquante côté Claude** — la session Claude reste **en attente** du passage de Codex ;
   pire, il arrive qu'elle **reste bloquée alors que Codex est déjà passé** (désynchro entre
   l'état réel de la revue et ce que la boucle d'attente perçoit).
3. **Non mesurée** — impossible aujourd'hui d'objectiver le coût : combien de **minutes** par
   revue, combien de **blocages/attentes** subis.

Besoin : **obtenir un résultat équivalent à Codex, plus vite et en local**, pour gagner du
temps — et **des métriques** pour décider en connaissance de cause (garder Codex, le compléter,
ou le court-circuiter en local).

## Piste (à groomer)

- **Revue adverse locale** : l'agent **`ezk-reviewer`** (récemment activé) rend déjà un verdict
  adverse GO/NO-GO en local (sur Opus) et **remplace Codex quand la CI cloud est indisponible**
  (quota GitHub épuisé, repo privé — le cas courant) → court-circuite l'attente Codex.
- **Fiabiliser l'attente Codex** : corriger la désynchro « bloqué côté Claude alors que Codex
  est passé » — probablement dans la boucle d'attente **bornée** du verdict.
- **Mesurer le cycle** : minutes par revue (Codex cloud vs local), nombre de blocages/attentes.

## Prior art & candidats-regroupement (à trancher au grooming)

- **0136** (`ezk-reviewer`) — le **rôle** reviewer local + coordination
  avec un reviewer externe (cumul/complément/attente). **Recouvre le volet « revue locale »** ;
  ce sujet-ci ajoute la **friction (blocage)** et les **métriques**. Fort candidat regroupement.
- **`ezk-codex`** (skill) — gère les retours Codex et **attend le verdict de façon bornée** :
  lieu probable du **bug de blocage** (facette 2).
- **`ezk-retro`** — le PO se demande si c'est un **sujet de rétro** : la comparaison « Codex vs
  local » peut sortir d'une rétrospective outillée.
- **[0051](0051-observabilite-qualite-produit.md)** / **[0100](0100-sprint-intake-sante-backlog-metriques.md)**
  — porteurs possibles des **métriques de cycle de revue**.

## Critères d'acceptation (esquisse — à définir au grooming)

- [ ] Un chemin de **revue locale** documenté produisant un verdict équivalent à Codex **sans push** (via `ezk-reviewer`).
- [ ] La désynchro « bloqué côté Claude alors que Codex est passé » est **reproduite puis corrigée** (ou contournement sûr documenté).
- [ ] **Métriques** émises : durée par revue (cloud vs local), nombre de blocages/attentes.
- [ ] Décision PO documentée : Codex gardé / complété / court-circuité en local, **sur la base des métriques**.

## Notes

- La **facette 2 (blocage)** est un **candidat bug distinct** (défaut de la boucle d'attente
  Codex) — à scinder au grooming si besoin ; capturée ici avec le reste pour ne rien perdre.
- Capturée en `idea` (capture cheap) ; **doublon/regroupement avec 0136 à trancher au grooming**
  (méthode PO : capturer le problème, consolider en revue de backlog).
