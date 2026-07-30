---
id: 0028
title: Policy de siège — l'auto-continue configurable sur signaux typés
type: feature
priority: P3
product: vectorz
status: todo
pr:
created: 2026-07-14
---

# 0028 — Policy de siège (auto-continue configurable)

## Contexte / Problème

D13 (capture §7) : la *politique* du siège est hors contrat — quand le superviseur-siège
continue seul vs demande à l'humain — mais le contrat garantit les signaux typés qui la
rendent implémentable : `outcome` des jalons (feu tricolore), escalades ouvertes, télémétrie
régalienne. Aujourd'hui rien dans cop1 ne matérialise cette politique : le scénario opérateur
du panel (« ce soir je veux configurer auto-continue sauf échec ») n'a aucun objet de config.

## Proposition

- Objet de config dans `cop1.config.yaml` (même veine qu'ADR-015 model-tiering, fiche 0023) :
  règles déclaratives **exclusivement sur les champs typés du flux** — jamais sur le contenu
  des artefacts (D8 durci : anti-injection du siège). Exemple de défaut proposé :
  `auto_continue si outcome == ok ∧ budget_pct < seuil ∧ zéro escalade authority ouverte ;
  sinon hold {reason: policy} + notification`.
- Chaque décision automatique est journalisée dans `commands.jsonl` avec `policy_ref`
  (l'audit du matin répond à « pourquoi ce run est-il garé ? »).
- Config invalide ⇒ fail-fast au démarrage (cohérent D5).
- Mission-control : afficher la règle appliquée à chaque décision.

## Critères d'acceptation

- [ ] Config validée au démarrage, erreurs lisibles.
- [ ] Décisions auto journalisées + visibles dans la mission-control.
- [ ] Une règle ne peut référencer QUE des champs typés (garde-fou testé).
- [ ] Tests : auto-continue sur ok, hold sur attention/failed, blocage si escalade
      authority ouverte.

## Notes / décisions

- Origine : lentille opérateur du panel design (capture §7).
- Dépend de l'implémentation du journal côté cop1 (event-stream seam) et du gel v0.1
  (PR #60). Voisin : ADR-017 (budget killswitch) fournit déjà le signal budget.
- **2026-07-14 (revue de groupe, DP7) — différée P3, à ouvrir après 3 runs réels** (il faut
  des `outcome` vécus pour écrire une policy sensée). Gravé dès maintenant dans le scope :
  **allowlist de `gate_id` auto-continuables, default deny** (un gate inconnu n'est JAMAIS
  auto-continué — parade à l'auto-continue de gates-direction, attaque avocat-2 A2) +
  **plafond de `continue`/heure** (anti spam-de-gates, red-team). La question du typage
  `authority` dans le schéma est à l'agenda v0.2 (fiche 0029), pas ici.
