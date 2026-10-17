# Rapport de sprint — board-multi-llm-v0-18-emetteur-contrat-0-2-journ

## En clair

Le sprint **board-multi-llm-v0-18-emetteur-contrat-0-2-journ** a duré **8 min** et consommé **3068244431 tokens** (grain `session`, fenêtrage sprint vide (aucun message.usage dans la fenêtre) — repli au grain session (total du run).). Il a livré **0 fiche(s)**, essuyé **0 blocage(s)** et mergé **0 PR** sur la fenêtre.

> Un seul gate_reached par sprint dans le journal — pas de ventilation par étape (BDD/archi/TDD/gate/revue/PR) dans ce MVP : total du sprint seulement.

## Lot scellé

- `20261015133600298` — Émetteur T1 : contrat @0.2 + journal par worktree (le format et l'emplacement) (local 941c8538) — **livrée**
- `20261015133600314` — Émetteur T2 : l'identité de session (le « qui » sur chaque évènement) (local 425203ea) — **livrée**
- `20261015133600328` — Émetteur T3 : la clé de chantier (le « quel travail », pour regrouper) (local 92c3db93) — **livrée**
- `20261015082118353` — Board : read-model chantier → sessions → évènements (fusion par clé) (local 2c1ef371) — **livrée**
- `20261015082118368` — Board : découverte des worktrees + surveillance dynamique des racines (local 40f331b7) — **livrée**
- `20261015082118382` — Board : chronologie à 3 niveaux (D+B) + accueil « Tous les projets » (local 9555603b) — **livrée**
- `20261015082118397` — Rattachement : l'étape d'accueil de session (propose, jamais devine) (local c322143c) — **livrée**

## Détail

- **Fenêtre** : 2026-10-16T14:42:50.900Z → 2026-10-16T14:50:45.285Z
- **Durée** : 474385 ms
- **Tokens** : entrée 3050632506 / sortie 17611925 / total 3068244431 (grain `session`)
- **Fiches livrées** (0) : —
- **Blocages** (0)
- **Retouches PR** : 0 PR mergée(s), 0 sans retouche confirmée, 0 indéterminée(s)

_Rapport généré le 2026-10-17T12:01:13.560Z — schéma `sprint-report@0.1`._
