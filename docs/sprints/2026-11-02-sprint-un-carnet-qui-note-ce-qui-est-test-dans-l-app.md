# Rapport de sprint — un-carnet-qui-note-ce-qui-est-test-dans-l-app

## En clair

Le sprint **un-carnet-qui-note-ce-qui-est-test-dans-l-app** a duré **8 h 00** et consommé **0 tokens** (grain `session`, fenêtrage sprint vide (aucun message.usage dans la fenêtre) — repli au grain session (total du run).). Il a livré **3 fiche(s)**, essuyé **1 blocage(s)** et mergé **0 PR** sur la fenêtre.

> Un seul gate_reached par sprint dans le journal — pas de ventilation par étape (BDD/archi/TDD/gate/revue/PR) dans ce MVP : total du sprint seulement.

## Lot scellé

- `20261102182259416` — Un carnet qui note ce qui est testé dans l'app, et quand la preuve expire (local af4c64d1) — **livrée**

## Détail

- **Fenêtre** : 2026-11-02T12:23:17.096Z → 2026-11-02T20:23:18.546Z
- **Durée** : 28801450 ms
- **Tokens** : entrée 0 / sortie 0 / cache lu 0 / cache créé 0 / total 0 (grain `session`)
- **Jetons par mode** (mode `local`) : local 0 · pr-codex 0 (somme = total 0)
- **Fiches livrées** (3) : 20261102100505427, 20261102100506285, 20261102124307012
- **Blocages** (1)
  - 2026-11-02T20:15:59.401Z — Gate rouge 2× : test-archive-commit.sh échoue sur main depuis 9e60c6cc (autre session, nettoyage qui épargne les branches neuves) ; indépendant de la story carnet, prouvé sur main et sur 9e60c6cc^.
- **Retouches PR** : 0 PR mergée(s), 0 sans retouche confirmée, 0 indéterminée(s)

_Rapport généré le 2026-11-02T21:15:14.909Z — schéma `sprint-report@0.1`._
