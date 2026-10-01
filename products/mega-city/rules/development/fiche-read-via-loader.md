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
  `loadFiches` couvre `features/` **ET** `features/done/`. **Un script bash** n'a pas à re-parser :
  il appelle `bin/fiche-rows.ts`, qui sort les champs lus par le loader.
- **L'identité d'une fiche se lit sur son champ `id:`** (ou son nom de fichier), jamais par
  présence de la chaîne dans le texte : une fiche B qui **cite** l'id de A en prose ne doit
  jamais être prise pour A. Un `grep <id> features/` remonte les **citations**, pas l'identité.
- **Complète, ne remplace pas** [`development/yaml-emission-via-lib`](yaml-emission-via-lib.md) :
  celle-ci porte sur l'**écriture** du front-matter (émission par la lib), celle-là sur sa
  **lecture** (parsing par le loader). Même principe : une seule implémentation testée,
  plusieurs consommateurs.
- **Déploiement (grandfathering documenté).** La règle mord sur **tout nouveau** lecteur de
  fiche. Le legacy pré-existant est une **dette listée** — à migrer (fiche `20260922160651394`),
  pas une violation silencieuse. La liste **vit dans le test de contrat**
  `src/__tests__/fiche-read-via-loader-contract.test.ts` (chaque entrée porte sa raison), pas ici :
  une seule liste, exacte. Premières migrations faites : `bin/portfolio.sh`, `bin/plan-head.ts`,
  `bin/ezk-chef-extract.sh`, `fmField` de `planning-views.ts`. **Aucune nouvelle entrée** dans la liste.
- **Mesurable :** ce test. Un parse de front-matter hors loader qui n'est pas dans sa liste **fait
  échouer la suite** ; une entrée migrée **doit en sortir**. Limite : la détection est une
  heuristique sur le motif ancré `^champ:` ; un parse écrit autrement lui échappe, et la revue reste
  le filet. Tout **nouvel** outil qui re-parse le front-matter à la main est refusé en revue ; la
  migration du legacy est suivie par la fiche `20260922160651394`.
- Origine : rétros PO du **2026-09-16** (migration A16, PR #239 — un script python à la regex
  ratait l'enfant **quoté** et ceux de `done/` → 3 rounds Codex) et du **2026-09-20** (session
  `reconcile` — un `grep` de l'id `…856` a remonté la fiche `…858` qui ne fait que le citer).
  Enforcement niveau 1 : l'agent `ezk-reviewer` lit cette règle.
