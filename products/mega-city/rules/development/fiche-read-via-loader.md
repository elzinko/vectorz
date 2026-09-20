---
id: development/fiche-read-via-loader
kind: disposition
level: MUST
title: La lecture d'une fiche passe par le loader testé, jamais par un parse maison
enforcements:
  - type: agent-check
    agent: ezk-reviewer
---

- **Tout outillage qui LIT des fiches** — backlog, migration, `reconcile`, script jetable —
  passe par le loader testé `products/mega-city/src/loaders/fiches.ts` (`loadFiches` /
  `readField`), **jamais** par un `grep` / `awk` / `sed` / regex maison sur le front-matter.
  `readField` gère les valeurs **quotées** et les **commentaires** en fin de ligne ;
  `loadFiches` couvre `features/` **ET** `features/done/`.
- **L'identité d'une fiche se lit sur son champ `id:`** (ou son nom de fichier), jamais par
  présence de la chaîne dans le texte : une fiche B qui **cite** l'id de A en prose ne doit
  jamais être prise pour A. Un `grep <id> features/` remonte les **citations**, pas l'identité.
- **Complète, ne remplace pas** [`development/yaml-emission-via-lib`](yaml-emission-via-lib.md) :
  celle-ci porte sur l'**écriture** du front-matter (émission par la lib), celle-là sur sa
  **lecture** (parsing par le loader). Même principe : une seule implémentation testée,
  plusieurs consommateurs.
- **Mesurable :** aucun script du monorepo (sous `bin/`, `scripts/`, migration jetable) ne
  matche `id:` / `status:` / `epic:` / `milestone:` d'une fiche à la main ; `git grep` d'un
  parse front-matter hors loader = **0**. Un outil qui re-parse le front-matter à la main est
  **refusé en revue**.
- Origine : rétros PO du **2026-09-16** (migration A16, PR #239 — un script python à la regex
  ratait l'enfant **quoté** et ceux de `done/` → 3 rounds Codex) et du **2026-09-20** (session
  `reconcile` — un `grep` de l'id `…856` a remonté la fiche `…858` qui ne fait que le citer).
  Enforcement niveau 1 : l'agent `ezk-reviewer` lit cette règle.
