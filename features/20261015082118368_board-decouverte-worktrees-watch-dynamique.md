---
id: "20261015082118368"
title: "Board : découverte des worktrees + surveillance dynamique des racines"
type: feature
priority: P1
product: cop1
milestone: board
version: v0.23.0
labels: [dashboard, board, supervision, multi-session, daemon]
status: ready
blocked:
pr:
evidence: none # plomberie daemon ; prouvée par tests + logs
created: 2026-10-15
---

# 20261015082118368 — Board : découverte des worktrees + watch dynamique

**En clair.** En modèle B, chaque ouvrier a son carnet dans son établi (worktree). Pour les
montrer tous, le board doit **trouver les établis** et **suivre ceux qui apparaissent et
disparaissent**. Aujourd'hui il ne surveille que des racines figées, lues une fois au démarrage.
C'est du code neuf, et le panel a insisté : ce n'est pas « déjà outillé ».

**Si tu arrives frais.** Le *daemon* est le service du board qui lit les journaux en continu. Un
*watch-root* est un dossier qu'il surveille. Détail dans
[ADR-079](../docs/adr/ADR-079-run-et-session-deux-entites-multi-llm.md) §D9.

## Contexte / Problème

Le watcher reçoit une liste de racines **statique** (lue une fois à l'init ; le hot-reload a été
différé par ADR-028). Les worktrees, eux, naissent et meurent en cours de session. Et cop1
**n'importe jamais mega-city** (ADR-0021) : l'outillage worktree d'`ezk-sessions` vit dans
mega-city — il faut une couture **propre à cop1**.

**Valeur.** Le board ne voit que les établis connus **au démarrage**. Un ouvrier qui ouvre son
worktree après coup reste **invisible** — c'est exactement le trou que la supervision
multi-sessions doit boucher. Cette fiche alimente le read-model : sans les carnets, rien à fusionner.

## Proposition (ADR-079 §D9)

- Un **énumérateur de worktrees local à cop1** (recopie légère, comme le lecteur `registry.ts`
  l'a fait pour éviter la dépendance mega-city).
- Une **gestion dynamique des watch-roots** : ajout/retrait de racines à chaud (ré-énumération
  périodique), sans redémarrage du daemon.
- Revoir le cap `MAX_WATCHED_RUN_DIRS = 512` à l'échelle projets × worktrees × runs.
- Noter la re-projection **fichier entier** (ADR-028) sur de longs journaux multi-sessions : le
  replay incrémental différé est rouvert (borné).

## Critères d'acceptation

- [ ] Un worktree créé **après** le démarrage du daemon apparaît sans redémarrage ; un worktree
      supprimé retire proprement ses watchers (pas d'orphelin).
- [ ] La découverte des worktrees ne dépend d'**aucun** import de mega-city (ADR-0021 tenu).
- [ ] Le cap de dossiers surveillés est dimensionné pour le multi-worktree, et dégrade
      proprement (pas de crash) quand il est atteint.

## Comment vérifier

- Daemon lancé, puis créer un worktree `feat/xxx` : il apparaît sur le board sans redémarrage.
- Supprimer le worktree : il disparaît, aucun watcher ne reste.
- Vérifier qu'aucun fichier/symbole mega-city n'est importé par le daemon.

## Notes / décisions

- Décision : [ADR-079](../docs/adr/ADR-079-run-et-session-deux-entites-multi-llm.md) §D9
  (amende le hot-reload différé d'ADR-028).
- **Sœurs (sans chapeau)** : émetteur, read-model, chronologie+accueil, étape d'accueil —
  `milestone: board` + `v0.23.0`. Alimente la [fiche read-model](20261015082118353_board-read-model-chantier-sessions-evenements.md).
