---
id: development/tenter-decoupage-et-local-avant-ecarter
kind: disposition
level: SHOULD
title: Avant d'écarter une fiche, tenter le découpage et le flux local ; mener un spike borné
---

- **En clair.** Deux parkings étaient trop rapides : une fiche « trop grosse » jamais découpée, et une
  fiche « a besoin de GitHub » écartée alors que le repo est **public** et testable en local. Et des
  spikes ont été parkés faute de bornes, alors que l'investigation était menable. Avant d'écarter,
  **on tente la voie de contournement.**
- **La règle.** Le verdict `escalate` du portier d'éligibilité n'est pas un écart automatique :
  - **« trop gros » (`à-découper`)** → tenter d'abord le **découpage en fiches sœurs** (pas de fiche
    chapeau, lien par même milestone + version) ; n'escalader que si le découpage lui-même exige un
    arbitrage produit ;
  - **dépendance à un service externe** → vérifier CLI / MCP / trousseau (règle
    `agent-ops/verify-access-before-asking`) ; sur un **repo public en `github: false`**, c'est un
    `build` avec valeurs de test et `--dry-run`, jamais un `escalate` ;
  - **spike** → se mène **borné** : un objectif (question fermée + preuve attendue), une borne (nombre
    d'essais ou plafond de jetons), un repli (skip journalisé si la borne tombe — jamais un park muet).
    L'investigation vit sur branche jetable ; le livrable est la **réponse écrite dans la fiche**.
- **Mesure (retirabilité).** Sur les 5 prochains runs : **0 fiche escaladée `à-découper` sans tentative
  de découpage tracée**, **0 fiche parkée « dépend de GitHub » quand le repo est public et le chemin
  local existe**, et **chaque spike reçoit un lancement borné** (objectif + borne + repli dans `SPRINT.md`).
- **Origine.** Rétro du 2026-10-19 (capture `docs/captures/2026-10-19-retro-run-parking-frilosite.md`).
