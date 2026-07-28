---
id: 2077
product: mega-city
title: Kit émetteur — hooks Claude Code classe A (émission déterministe)
type: feature
priority: P1
epic:
status: todo
ready:
pr:
created: 2026-07-18
---

## Contexte / Problème

Suite de la fiche 0050 (kit émetteur de supervisabilité, 1ʳᵉ PR livrée en classe B :
lib append + serveur MCP 5 outils + consignes de skill). En classe B, l'émission repose
sur la discipline du LLM — il peut « oublier » d'émettre. La proposition d'origine
(fiche 0050, point 3) prévoyait des **hooks Claude Code en renfort** (~20 l.) pour une
émission **déterministe** (classe de conformité A) : le hook émet, le LLM ne peut pas
l'omettre. Sortie de la 1ʳᵉ PR par décision journalisée du 2026-07-14 (« hors 1ʳᵉ PR »).

**Valeur** : en classe B, un run peut franchir un gate sans le journaliser — l'audit du
matin a alors un **trou silencieux**, invisible. La classe A rend l'émission des moments
mécaniques **impossible à oublier** : le journal ne peut plus mentir par omission. C'est
le cran qui fait passer la supervisabilité de « best-effort » à « garantie » là où ça
compte le plus (démarrage, gate, reprise, fin).

## Proposition

- Hooks Claude Code (config `settings.json` du projet supervisé) qui émettent les
  événements du contrat v0.1 aux moments mécaniques (fin de tour au gate, reprise).
- Réutilise la lib `src/supervision/journal.ts` (aucune logique dupliquée) ;
  matérialisation vers les projets via cap/bind comme le reste du kit.
- Documenter la complémentarité classe A (hooks) / classe B (MCP + consignes) dans
  `src/supervision/README.md`.

## Critères d'acceptation

- [ ] Un hook Claude Code émet un événement du contrat **sans aucune action du LLM** :
      sur un tour où le LLM n'émet rien, l'événement apparaît quand même dans
      `<projet>/.supervision/runs/<run_id>/events.jsonl`.
- [ ] **Zéro duplication de l'enveloppe** : le hook passe par `src/supervision/journal.ts`
      (unique émetteur) ; vérifiable en revue — aucun calcul d'`event_id`/`seq`/`ts` dans
      le hook.
- [ ] Le journal produit par la voie hook **passe le validateur** cop1 (mêmes invariants
      que la classe B — un run mixte hooks + MCP reste valide).
- [ ] `src/supervision/README.md` documente **quand choisir A vs B** (déterministe des
      moments mécaniques vs best-effort du sémantique) et **comment brancher** les hooks
      (config `settings.json` du projet supervisé).
- [ ] Matérialisation via **cap/bind** comme le reste du kit (pas d'installation manuelle
      ad hoc).

## Notes

- Priorité **héritée de la fiche mère 0050 (P1)** — à re-prioriser au prochain review si
  la classe B suffit en pratique.
- **Groom 2026-07-18** : DoR complétée (valeur explicitée, critères rendus observables :
  émission sans LLM prouvée par le journal, passage au validateur, non-duplication en
  revue) en vue du gate `ready` — candidate au run de recette vz-product-builder (fiche
  0060). Statut/`ready:` inchangés (le gate reste au PO).
- Réfs : fiche 0050 (Notes 2026-07-14 et 2026-07-17), capture cop1
  `docs/captures/2026-07-13-contrat-methode-et-versions.md` §7 (classes de conformité).
