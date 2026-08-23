---
id: development/adversarial-review-before-merge
kind: disposition
level: MUST
title: Toute livraison passe une revue adverse avant merge
enforcements:
  - type: agent-check
    agent: ezk-reviewer
---

- **Aucun merge sans revue adverse.** Avant tout squash-merge sur `main`, le diff de la
  feature est passé au crible par un juge qui cherche activement à le CASSER
  (correctness, sécurité, perf, contrats, qualité réelle des tests) et rend un verdict
  **GO/NO-GO bloquant**.
- **Le juge tourne sur un modèle DIFFÉRENT de celui qui a écrit le code.** C'est la
  valeur du mécanisme : une seconde opinion indépendante, pas une relecture par le même
  regard.
- **La revue ne dépend d'aucun support particulier.** Une pull request est UN moyen
  (module GitHub) — une branche locale suffit : la règle porte sur le diff, pas sur
  l'outil qui le présente. Quand un bot de revue externe (Codex) est branché, ses
  findings se traitent en plus, jamais à la place.
- Origine : décision PO du 2026-08-24 — « la revue est une règle de développement
  (DoD), pas une habitude » ; l'exécutant de l'enforcement est l'agent `ezk-reviewer`.
