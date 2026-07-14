---
id: 0031
title: Lecteur de journal .supervision/runs/ dans la mission-control (mode moniteur)
type: feature
priority: P1
status: in-progress
pr: "#2"
created: 2026-07-14
---

# 0031 — Lecteur de journal dans la mission-control

## Contexte / Problème

Étape 4 du MVP démo (fiche 0030, DP4). La mission-control n'affiche aujourd'hui que les runs
que cop1 pilote lui-même (EventBus interne → SSE `/events`). En mode moniteur (D13, rôle
toujours actif), cop1 doit afficher un run qu'il n'a **pas** lancé : une session Claude
Desktop émet `events.jsonl` dans `<projet>/.supervision/runs/<run_id>/` — il faut le lire,
le rejouer, l'afficher. Fiche **séparée de la 0022** (ne pas l'étirer — revue 2026-07-14).

## Proposition

- `JournalWatcherAdapter` : fs.watch + offset par fichier sur les watch-roots configurés →
  parse enveloppe v0.1 (lecteur tolérant : ligne invalide ⇒ `contract.violation`, jamais
  jetée en silence) → `EventBus.emit` → le SSE `/events` existant diffuse
  (`HttpServer.setEventBus`).
- Vue run (nouvelle) : **replay de la machine à états** (`launched → running ⇄ at_gate →
  finished | aborted`), badge **classe B — best-effort** bien visible, « dernier événement
  il y a Xs », formulations « aux dernières nouvelles ».
- **Origine de chaque reprise affichée** : `gate.resumed.command_ref` présent = clairance
  par commandes ; absent = self-reported en session (revue 2026-07-14, §2.3).
- Timeout d'orphelin : `stalled → presumed_dead` après N minutes de silence **en `running`**
  (jamais armé en `at_gate`, D8 — le silence au jalon est le comportement exigé).

**Verrous DP2 (non négociables)** : panneau **strictement read-only** (aucune décision
métier depuis la mission-control) ; rendu **inerte** des `report_ref` (échappé, refs
confinées realpath sous la racine projet) ; **interdiction de tout mapping gate→phase côté
cop1** — la phase courante se lit dans les rapports de la méthode, jamais dans le code cop1.

## Critères d'acceptation

- [ ] Un dossier `.supervision/runs/<id>/` alimenté à la main (fixtures) s'affiche live
      (états, gates, âge du dernier événement) sans redémarrage du daemon.
- [ ] Badge classe B + provenance tokens (« mesurés | absents-et-dits-absents ») visibles.
- [ ] Origine des reprises affichée (command_ref vs self-reported).
- [ ] `presumed_dead` déclenché sur silence en `running`, jamais en `at_gate`.
- [ ] Ligne JSONL invalide ⇒ `contract.violation` affichée, run toujours lisible.
- [ ] Zéro mapping gate→phase dans le code cop1 (vérifié en revue de code).

## Notes / décisions

- Origine : revue de groupe 2026-07-14 (DP4 + verrous DP2) ; effort chiffré **M/L**
  (le « M » du panel jugé optimiste — divergence §6.4).
- Compose avec la fiche 0030 (épic démo) et le validateur 0027 (mêmes fixtures de run).
