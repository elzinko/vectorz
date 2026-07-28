---
id: 2103
product: mega-city
title: "Harness dogfood E2E-LLM — acteur Claude Code + assertions déterministes (nightly / label dogfood)"
type: feature
priority: P1
epic:
depends: [2094]
labels: [method, dogfood, enabler, testbed]
status: todo
ready:
pr: '#62'
created: 2026-07-28
---

# 2103 — Harness dogfood E2E-LLM (acteur + juge déterministe)

## Contexte / Problème

Le dogfood **humain** de l'époque 2 ([`docs/DOGFOOD.md`](../docs/DOGFOOD.md) §D) prouve la
chaîne **méthode → émission MCP → `events.jsonl` → Moniteur** — exactement le trou
observationnel des fiches [2094](2094-emetteur-branche-sur-claude-code.md) /
[2095](2095-ezk-product-builder-n-emet-pas.md). Le smoke mécanique
([`scripts/dogfood-smoke.sh`](../scripts/dogfood-smoke.sh)) couvre link / probe / demo-run /
journal-validator **sans** session Claude Code : il ne charge jamais un vrai skill qui
appelle les outils MCP.

Conséquence : les AC « un vrai `ezk-sprint` produit un journal » restent **parkés**
(`blocked`) faute d'humain 30–45 min, ou de filet machine équivalent. Un E2E Playwright
classique ne déclenche pas non plus `ezk-sprint` / consignes d'émission.

On a besoin d'un cran intermédiaire : **LLM-as-actor** (exécute un scénario figé) +
**juge déterministe** (scripts, pas un second LLM) — cadence **nightly / label `dogfood`**,
pas sur chaque PR.

## Valeur

- Débloque périodiquement les AC observationnels de **2094** (chemin sprint trivial /
  `supervision-demo` → journal + API Moniteur) sans monopoliser l'opérateur.
- Filet de confiance **produit** (méthode réelle + MCP), complémentaire au smoke
  mécanique (filet pas cher) et au dogfood humain (1× sensation Moniteur).
- Rapport machine (JSON + markdown) consommable en CI / revue.
- Respecte la doctrine : **LLM rédige / agit aux bords ; le script range et juge**
  ([ADR-0001](../products/mega-city/docs/adr/0001-monorepo-composable-coeur-deterministe.md),
  [ADR-032](../docs/adr/ADR-032-emission-adaptateur-separable.md) — supervision
  method-agnostic, on teste l'émetteur, on ne réinvente pas BMAD dans le moniteur).

## Proposition

Harness **composable** (proche esprit [2102](2102-ezk-testbed-brique-boot-env-test.md) —
banc isolé — mais métier distinct : *exercice LLM*, pas *boot d'env*).

1. **Scénarios Gherkin** (style `ezk-qa` : Given / When / Then = DoD du harness), au
   minimum le chemin **2094** :
   - Given cobaye + MCP supervision branché (`supervision:link` / probe vert)
   - When acteur LLM lance sprint **trivial** **ou** `/supervision-demo`
   - Then `events.jsonl` présent, shapes attendues, journal-validator vert, run listable
     via API Moniteur (daemon up)
2. **Acteur** : Claude Code headless / CLI, MCP supervision connecté, prompt figé,
   **budget max** tokens + outils (fail-fast si dépassement).
3. **Assertions déterministes en premier** : `supervision:probe`, formes
   `run.started` / gates / `run.finished` dans `events.jsonl`,
   `@cop1/journal-validator`, éventuellement archive `check` → CLEAN/DIRTY attendu.
4. **Juge LLM optionnel, secondaire** : lisibilité Moniteur (« la carte est-elle
   lisible ? ») — **jamais** seul verdict de pass/fail.
5. **Rapport** : artefact CI `dogfood-report.json` + `dogfood-report.md`.
6. **Cadence** : workflow `nightly` **ou** label PR `dogfood` — **interdit** sur le chemin
   critique de chaque push/PR (coût + flakiness).

### Hors périmètre (explicite)

- **Ne remplace pas** la mesure tokens de [2088](2088-ezk-archive-cout-cloture-session-disciplinee.md)
  par un jugement LLM. La facture se lit via **parser de transcripts / usage API**
  (compteur de session) — sibling possible en AC séparé ou fiche dédiée, jamais « l'acteur
  estime son coût ».
- **2095** (product-builder multi-sprint) : candidat nightly **rare** / plus cher — hors
  MVP de cette fiche (noter en extension).
- Remplacer le dogfood humain §D pour la *sensation* Moniteur au merge — le harness
  **complète**, il ne substitue pas le 1× opérateur.

## Critères d'acceptation

- [ ] **AC1 — Gherkin 2094.** Au moins un scénario Given/When/Then versionné couvre :
      cobaye + MCP → sprint trivial **ou** supervision-demo → `events.jsonl` + validation
      journal + run visible API Moniteur (daemon). Style ezk-qa (scénario = DoD).
- [ ] **AC2 — Acteur borné.** Lancement Claude Code headless/CLI avec MCP supervision ;
      budget max tokens **et** max outils documenté ; dépassement = fail explicite (pas
      timeout silencieux).
- [ ] **AC3 — Juge déterministe d'abord.** Pass/fail dérivé uniquement de scripts
      (probe, shapes `events.jsonl`, journal-validator, éventuellement portier archive).
      Aucun verdissement possible par seul avis LLM.
- [ ] **AC4 — Juge LLM optionnel.** S'il existe, son score est **secondaire** (annexe du
      rapport) ; CI ne fail que sur le bras déterministe.
- [ ] **AC5 — Rapport.** Chaque run produit `*.json` + `*.markdown` (ou `.md`) en artefact
      CI : scénario, verdict, chemins journal, budget consommé, erreurs.
- [ ] **AC6 — Cadence.** Workflow GitHub Actions `schedule` (nightly) **et/ou**
      `pull_request` filtré sur label `dogfood` ; **absent** du `push`/`pull_request`
      sans label (grep de contrôle sur `.github/workflows`).
- [ ] **AC7 — Hors 2088.** Doc + commentaire workflow : la mesure ≤28k tokens archive
      CLEAN reste un **parser transcript/usage**, pas ce harness ; pas de AC qui fasse
      juger le coût par le LLM acteur.
- [ ] **AC8 — Alignement ADR.** README du harness rappelle : LLM aux bords (rédige /
      agit) ; script range + juge ; supervision method-agnostic (ADR-032) — on exerce
      l'émetteur mega-city, pas un shim moniteur.
- [ ] Gate locale verte sur le code du harness (typecheck/lint/tests) ; smoke mécanique
      existant (`dogfood-smoke.sh`) **reste** le filet PR-cheap.

## Notes / décisions

- **Priorité P1** : filet qui sort 2094 du park observationnel sans bloquer chaque PR.
  P2 si le PO préfère garder le dogfood 100 % humain jusqu'à merge #62 — à arbitrer au
  `ready`.
- **Frontière 2102** : `ezk-testbed` = démarrer un env isolé ; **2103** = y faire jouer un
  acteur LLM + assertions. Composition naturelle (`testbed start` puis harness) si 2102
  est livré ; MVP 2103 peut bootstraper via cobaye déjà documenté dans DOGFOOD.md.
- **Smoke vs harness** : `dogfood-smoke.sh` = mécanique sans LLM ; 2103 = couche au-dessus.
  Ne pas fusionner les deux scripts (coûts et flakiness différents).
- **Flakiness assumée** : même prompt → chemins variables ; d'où nightly + budget + juge
  déterministe. Quarantine / retry borné OK ; jamais « flaky = vert ».
- Origine : arbitrage PO 2026-07-28 (« ok go ») après discussion E2E-LLM vs dogfood
  manuel sur PR #62 / programme époque 2.
- Statut `todo` **sans** `ready:` — DoR à passer au gate `ready 2103` avant tirage sprint
  (dépendances Claude Code headless / secrets CI à constater accessibles).
