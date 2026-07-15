---
id: 0030
title: MVP démo Desktop — un manager supervisé de bout en bout (mode moniteur pur)
type: feature
priority: P1
status: in-progress
pr:
created: 2026-07-14
---

# 0030 — MVP démo Desktop : un manager supervisé de bout en bout

## Contexte / Problème

Décisions DP1–DP8 de la revue de groupe du 2026-07-14
(`docs/captures/2026-07-14-revue-groupe-deux-sieges.md`), actées par le PO. Objectif :
l'usage réel le plus court — un manager (ezk-product-builder) tourne dans Claude Desktop,
émet le journal du contrat v0.1, cop1 monitore. **Mode moniteur pur** : zéro executor,
zéro siège cop1, zéro `commands.jsonl` (différés post-3-runs, DP7).

## Proposition

Fiche-épic : porte l'étape 0 + le déroulé de démo ; les étapes 1-4 vivent dans leurs fiches.

| # | Étape | Effort | Où |
|---|---|---|---|
| 0 | Checklist setup Desktop (cette fiche) | S | config MCP par projet (`project_root` fixé à l'**init du serveur**, jamais paramètre d'outil), allowlist « toujours autoriser » des 5 outils, daemon cop1 lancé, watch-roots configurés |
| 1 | MCP émetteur minimal (5 outils étroits, enveloppe calculée **serveur**) | S/M | mega-city 0050 (+ 0029 dé-parquée) |
| 2 | Consignes d'émission dans ezk-product-builder (~15 lignes, checkpoint = gate) | S | mega-city 0050 |
| 3 | Validateur 0027, scope réduit — parallèle, jamais bloquant, **vert exigé dans la démo** | S/M | fiche 0027 |
| 4 | Lecteur `.supervision/runs/` dans la mission-control | M/L | fiche 0031 |

**Règle worktree (DP6, décidée avant le premier dogfooding sur cop1)** : `.supervision/`
vit dans l'**arbre principal** du projet supervisé, gitignoré d'office.

**Déroulé de démo (minute-par-minute — toute étape non écrite est réputée manquante)** :

1. Le soir : lancement d'ezk-product-builder dans Claude Desktop sur un vrai sujet ;
   `run_start` → `events.jsonl` naît dans `<projet>/.supervision/runs/<run_id>/`.
2. La mission-control (daemon déjà lancé, étape 0) affiche le run **live** :
   `launched → running → at_gate`, badge « classe B — best-effort », tokens
   « mesurés | absents-et-dits-absents », âge du dernier événement.
3. Au checkpoint, la skill émet `gate_reached` ; rapport rendu **inerte** ; run garé 🟡.
4. Le matin : le PO continue **dans SA session Desktop** (aucun bouton cop1) ; la skill
   émet `gate.resumed` (self-reported) ; la mission-control affiche l'origine de la reprise.
5. `run_finished` ; le validateur 0027 passe au **vert** sur le dossier du run — une perte
   détectée fait partie du script (« c'est ça le produit »).

## Critères d'acceptation

- [ ] Un run réel (pas une fixture) émis depuis Claude Desktop traverse les 5 temps du déroulé.
- [ ] La mission-control l'affiche live, badge classe B + origine de chaque reprise visibles.
- [ ] Le validateur 0027 est vert sur le dossier du run (ou la perte détectée est montrée).
- [ ] Zéro `commands.jsonl` écrit ; zéro code executor touché (mode moniteur pur).
- [x] Checklist étape 0 rédigée et rejouable (un lecteur peut refaire la démo) — `docs/demo-desktop-checklist.md`, rejouée en local (PR #3).

## Notes / décisions

- Origine : revue de groupe 2026-07-14 (DP3–DP6) ; verdicts Q1 (option c : un seul siège
  contractuel, deux autorités) et Q2 (viewer = projection read-only) actés — voir la capture.
- Si l'étape 1 dépasse 2 jours : re-scoper (divergence §6.4 consignée).
- Vectorz (ADR-027) et executor-seam (ADR-026/0020) : fenêtre post-démo groupée (DP8),
  avec la révision d'ADR-022 (brique 1 = « octroie des clairances »).
