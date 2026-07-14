---
id: 0050
title: Kit émetteur de supervisabilité — mega-city devient la première méthode conforme au contrat
type: feature
priority: P1
status: in-progress
pr:
created: 2026-07-14
---

# 0050 — Kit émetteur de supervisabilité

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

- [ ] Méthode jouet 2 gates : journal produit, validateur cop1 0027 vert.
- [ ] `upgrade_ok` : vrai sur arbre propre, faux avec worktree ouvert, veto LLM possible
      (→ false uniquement).
- [ ] Consignes intégrées à au moins une skill de méthode réelle ; hooks livrés et
      documentés (classe A vs B).
- [ ] Zéro dépendance à cop1 (le kit fonctionne avec n'importe quel superviseur qui lit
      le format).

## Notes / décisions

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
- Lien : fiche 0016 (cap cop1), fiche 0033 (siège échangeable).
