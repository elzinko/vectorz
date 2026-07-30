---
id: 0154
title: Kit émetteur de supervisabilité — mega-city devient la première méthode conforme au contrat
type: feature
priority: P1
product: mega-city
status: shipped
pr: "#35"
created: 2026-07-14
---

# 0154 — Kit émetteur de supervisabilité

## Contexte / Problème

Le contrat de supervisabilité v0.1 est gelé côté cop1 (capture cop1
`docs/captures/2026-07-13-contrat-methode-et-versions.md` §7, PR cop1#60). Sa décision D12
est explicite : **l'émetteur canonique est fourni par la méthode** — être
« contract-compliant » pour mega-city inclut d'embarquer son émetteur ; le superviseur ne
fait que lire. mega-city est censée être la *première implémentation de référence* du
contrat : sans kit émetteur, la revendication est vide. Le panel design a chiffré le coût
d'adoption réel : **~85 lignes** — à condition que le kit existe.

## Proposition

Livrer dans mega-city (matérialisé vers les projets via cap/bind, comme le reste) :

1. **Script d'append** (~50 l.) : `emit-event <type> <payload>` — crée
   `.supervision/runs/<run_id>/`, enveloppe `{event_id, run_id, seq, ts, contract, type}`,
   une ligne = un `write()` O_APPEND, `run.started` au premier appel ; calcule
   `upgrade_ok` mécaniquement au `gate.reached` (git propre, zéro worktree/sous-run en
   vol) — le LLM ne peut que le forcer à `false` (veto), jamais à `true`.
2. **Consignes de skill** (~15 l.) à intégrer aux skills de méthode (ezk-product-builder,
   ezk-sprint) : « à chaque fin d'étape : `emit gate.reached {outcome, report_ref}` puis
   S'ARRÊTER et attendre ; à la reprise : `emit gate.resumed` ; en cas de blocage non
   bloquant : `emit escalation` et continuer ailleurs ».
3. **Hooks Claude Code en renfort** (~20 l.) : émission déterministe (classe de
   conformité A) — le LLM ne peut pas « oublier » d'émettre.

Conformité prouvée par le **validateur de journal** (fiche cop1 0027) : une méthode jouet
à 2 gates doit passer le validateur, puis ezk-product-builder instrumenté en réel.

## Critères d'acceptation

- [x] Méthode jouet 2 gates : journal produit, validateur cop1 0027 vert — **déroulé réel
      2026-07-18** (runtime piloté par script, journal de 7 événements, « Aucune
      violation », état `finished`, exit 0) ; déroulé reproductible documenté dans
      `src/supervision/README.md` § « Conformité prouvée ».
- [x] `upgrade_ok` : vrai sur arbre propre, faux avec worktree ouvert, veto LLM possible
      (→ false uniquement) — couvert par `src/supervision/__tests__/upgrade-ok.test.ts`
      (3 cas + impossibilité de forcer `true` par construction de la signature).
- [x] Consignes intégrées à au moins une skill de méthode réelle — **`ezk-sprint`**
      (2026-07-17 : `run_start` à l'intake, `gate_reached`/`gate_resumed` au checkpoint ⛳,
      `escalate` sur stop&ask, `run_finished` à la clôture ; classe B documentée).
- [x] Hooks classe A livrés et documentés — **sortis en fiche de suite `0077`**
      (décision « hors 1ʳᵉ PR » du 2026-07-14, Notes ; priorité héritée P1).
- [x] Zéro dépendance à cop1 (le kit fonctionne avec n'importe quel superviseur qui lit
      le format) — vérifié : aucun import cop1 dans `src/supervision/` ; le validateur
      cop1 n'est consommé qu'en vérification externe (déroulé manuel, pas la CI).
      Assumé : l'URI de contrat `cop1/supervisability@0.1` référence cop1 **par
      convention de nommage de la spec**, pas par dépendance de code.

## Notes / décisions

- **`pr:` vidé le 2026-07-17 (review)** : le `#8` précédent datait du repo mega-city
  **standalone** (pré-subtree) et pointe désormais sur une PR vectorz sans rapport (piège
  de numérotation pré-subtree). La fiche reste in-progress ; le vrai n° de PR sera posé au
  ship, dans la numérotation vectorz.
- Origine : D12 + compte rendu du panel design (capture cop1 §7) ; fiches sœurs côté
  cop1 : 0027 (validateur), 0028 (policy de siège), 0029 (différés v0.2).
- ~~Le MCP émetteur (chemin nominal Claude Desktop) est un différé v0.2 (fiche cop1 0029)~~
  **Dé-parqué le 2026-07-14** (revue de groupe cop1, DP3 — capture cop1
  `docs/captures/2026-07-14-revue-groupe-deux-sieges.md`) : le **MCP émetteur entre au
  périmètre de ce kit** comme chemin nominal Desktop (classe B). Contraintes gravées :
  **5 outils étroits** (`run_start`, `gate_reached(gate_id, outcome, report_markdown?)`,
  `gate_resumed`, `escalate(type, detail)`, `run_finished(status)`) — jamais d'`emit_event`
  générique ; enveloppe calculée **serveur**, jamais LLM ; `project_root` fixé à l'**init du
  serveur** (env/config), jamais paramètre d'outil ; seq relu au démarrage ; refus d'un 2ᵉ
  `run_start` sur run ouvert ; relance post-`run.finished` = **nouveau run_id** ; le résultat
  d'outil de `gate_reached` dit « STOP et attends » ; `report_ref` confiné realpath sous la
  racine projet. Sprint en cours = lib append + MCP + consignes (étapes 1-2 de cop1 0030) ;
  hooks classe A = suite de fiche, hors 1ʳᵉ PR.
- Lien : fiche 0121 (cap cop1), fiche 0138 (siège échangeable).
- **Incrément 2026-07-17** : consignes intégrées à `ezk-sprint` (AC « skill réelle » ✔ —
  la 1ʳᵉ méthode de prod parle). Restent avant clôture : **AC1 à dérouler** (méthode jouet
  `supervision-demo` → journal → validateur cop1 0027 vert — l'automatiser en test créerait
  une dépendance de test croisée mega-city→cop1 à trancher côté cop1 ; a minima un
  déroulé manuel documenté), et **hooks classe A** (suite de fiche). L'ADR-032 (gravé,
  guide `docs/brancher-une-methode-existante.md`) confirme ce chemin comme canonique.
- **Clôture 2026-07-18** : AC1 déroulée en réel (journal 7 événements → validateur cop1
  vert, exit 0 ; script `bin/supervision-demo-run.ts` + déroulé documenté au README du
  kit, volontairement PAS automatisé en CI — ADR-021, couplages interdits : le cœur de
  mega-city ne dépend jamais de cop1). Hooks classe A → **fiche 0077**. Branche WIP
  `feat/0154-emission-ezk-sprint` purgée (absorbée par le squash #25/bb6ed88, vérifiée
  ligne à ligne — cas fiche 0076).
