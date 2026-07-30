---
id: 0164
title: vz-product-builder — product-builder autonome à corpus de reviewers (overlay, n'écrase pas ezk-*)
type: feature
priority: P1
product: mega-city
status: in-progress
pr:
created: 2026-07-14
---

# 0060 — vz-product-builder : l'autonomie par le corpus, pas par le silence

## Contexte / Problème

Le PO veut utiliser le product-builder **sans avoir à répondre à ses questions** : quand
l'agent se pose une question, c'est **lui qui convoque un corpus de reviewers** (panel
multi-lentilles + contradicteurs + synthèse — la mécanique de la revue cop1 du 2026-07-14)
au lieu d'interrompre l'humain. Contraintes posées par le PO :

- **Ne pas toucher aux skills ezk-\*** (sa prod) → préfixe distinct `vz-`, skill **overlay**.
- Les **4 STOP humains** (ADR-0011 §3) restent non automatisables.
- Un panel coûte cher (~0,4-1M tokens) → **échelle de coût de décision** à 3 crans
  (l'idée « hybrid decision cost-ladder » de la revue du 2026-07-14,
  `docs/captures/2026-07-14-revue-groupe-deux-sieges.md`).

## Proposition

`skills/vz-product-builder/SKILL.md` : charge la doctrine d'ezk-product-builder telle
quelle, puis applique 3 overrides — (1) checkpoints → convocations de corpus selon
l'échelle solo / ezk-pm / panel ; (2) les 4 STOP humains + garde-fou merge inchangés ;
(3) **supervisabilité obligatoire** : le mode refuse de démarrer sans le kit émetteur
(fiche 0050) — chaque décision de corpus = un `gate_reached` journalisé dont le rapport
EST le rapport du panel. L'audit du matin répond à « qui a décidé quoi cette nuit, et
pourquoi ». vz-product-builder devient ainsi la **première méthode réelle conforme au
contrat** (critère de la fiche 0050).

## Critères d'acceptation

- [ ] Un `build` complet enchaîne ≥2 sprints sans question à l'humain hors des 4 STOP —
      **à jouer via la Recette de preuve ci-dessous** (exige une session outillée MCP).
- [ ] Chaque décision de checkpoint est journalisée (gate + rapport de corpus en artefact) —
      idem, Recette de preuve (les gates exigent les 5 outils MCP du kit en contexte).
- [ ] Un checkpoint « structurant » convoque un vrai panel (≥3 lentilles + ≥1 contradicteur)
      et la synthèse tranche (pas de « les deux se valent ») — idem, joué pendant le run
      de la recette (le corpus cran-3 se déclenche sur une décision structurante réelle).
- [x] ezk-product-builder est chargé, jamais modifié (diff ezk-* vide) — **vérifié
      mécaniquement** : le commit introduisant le skill (`71d32a5`) touche 0 fichier
      `ezk-*` (uniquement `skills/vz-product-builder/SKILL.md` + fiche + index), et le
      garde-fou « overlay strict » est encodé dans le SKILL.md.
- [x] `--tokens cap` par défaut (l'autonomie exige une borne) — encodé dans le SKILL.md,
      Override 2 : « `--tokens cap` est le **défaut** de ce mode (pas de cap, pas
      d'auto) », merge autonome conditionné à ce cap.

## Recette de preuve (AC1-AC3) — à jouer depuis une session outillée

Les 3 AC de run réel ne se prouvent PAS depuis une session sans le kit émetteur en
contexte (l'Override 3 du skill refuse de démarrer — le contourner serait tricher).
Protocole, depuis un client MCP configuré (Claude Desktop ou équivalent) :

1. **Outillage** : serveur MCP émetteur configuré (`src/supervision/README.md`
   § « Configurer dans Claude Desktop » ; `SUPERVISION_PROJECT_ROOT` = racine du repo
   cible), les 5 outils visibles dans le contexte. Backlog cible avec **≥2 fiches
   ready** (le run doit pouvoir enchaîner 2 sprints).
2. **Lancement** : `/vz-product-builder build --tokens cap` (le cap est le défaut —
   le laisser). Ne PAS répondre aux checkpoints : c'est le test.
3. **Attendus pendant le run** :
   - AC1 : ≥2 sprints enchaînés, zéro question à l'humain hors des 4 STOP ;
   - AC2 : chaque décision de checkpoint = un `gate_reached` dont le
     `report_markdown` contient le rapport du décideur (cran 1/2/3), suivi d'un
     `gate_resumed` self-reported ;
   - AC3 : au premier checkpoint structurant rencontré, un corpus cran-3 réel
     (≥3 lentilles + ≥1 contradicteur, sous-agents frais) et une synthèse qui
     TRANCHE (minoritaires consignés dans le rapport).
4. **Vérification post-run** — builder d'abord le validateur (le `dist/` n'est pas
   commité) : `pnpm --filter @cop1/journal-validator... build` (depuis la racine
   vectorz), puis `node products/cop1/packages/journal-validator/dist/cli.js
   validate <racine>/.supervision/runs/<run_id>` → zéro violation attendu ; lecture des
   rapports de gates = l'audit « qui a décidé quoi, et pourquoi ».
5. **Clôture** : cocher AC1-AC3 avec le `run_id` en preuve, puis `ship` de la fiche.

## Notes / décisions

- Origine : demande PO 2026-07-14 (« avancer sans répondre à mes questions » + « autre
  préfixe pour ne pas écraser mes skills »). Compose : fiche 0050 (kit émetteur,
  in-progress) et la revue cop1 du 2026-07-14
  (`docs/captures/2026-07-14-revue-groupe-deux-sieges.md`), d'où viennent l'échelle de
  coût de décision (cost-ladder), le modèle de siège échangeable et le modèle
  un-siège/deux-autorités (le corpus = la policy du point de décision MÉTHODE ; le
  régalien humain/cop1 n'est pas touché).
- Préfixe `vz-` = signature Vectorz ; renommable par le PO.
- **2026-07-18 — arbitrage ezk-pm (checkpoints auto, Option B)** : incrément livré SANS
  clôture — AC4/AC5 prouvés (diff ezk-* vide vérifié, cap par défaut encodé) + recette de
  preuve ci-dessus ; la fiche RESTE in-progress, la preuve vivante (run réel outillé MCP)
  est sa condition de clôture. Re-scoper AC1-3 pour shipper sans run vécu = décision
  d'exigences → refusée par ezk-pm, réservée au PO. Corpus cran-3 en session : refusé
  (lean + non journalisable ici).

## Suivi (dette connue)

- Depuis la création de cette fiche, `main` a extrait **0057 `ezk-challenge`** — la
  primitive réutilisable de panel adversarial (relecteurs frais, une-lentille-par-agent,
  gate de contre-lecture, registre de lentilles). Le **cran-3 (corpus)** ci-dessus doit
  à terme **composer 0057** (via la formalisation `composes`, fiche 0044) au lieu de
  réimplémenter le panel inline. Non bloquant pour le POC ; à traiter au 2ᵉ temps —
  0057 recommande elle-même de ne centraliser la primitive qu'ensuite.
