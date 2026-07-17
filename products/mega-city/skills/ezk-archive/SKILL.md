---
name: ezk-archive
argument-hint: "[help|check|run]"
description: >-
  Rituel de CLÔTURE de session avant archivage : clôt proprement un repo pour ne
  RIEN perdre entre deux sessions. A utiliser quand l'utilisateur veut « archiver
  / clôturer une session », « fermer proprement avant de partir », « ne rien
  perdre entre deux sessions », préparer un « handoff » pour la prochaine session,
  ou demande « on archive ? » « avant de fermer ». Pilotable par sous-commandes :
  help, check (dry-run strictement read-only : produit le rapport de clôture),
  run/close (applique les corrections sûres — ship/regen du backlog, mémoire — et
  produit la note de handoff). Vérifie en 7 points : working tree propre +
  stashes, PRs & branches non-mergées (crucial pour les repos sans remote),
  backlog cohérent (délègue à ezk-backlog), ADR de la session restés en
  branche/PR non-mergée, mémoire projet durable, note de handoff persistée dans
  `.claude/handoff.md` (append-only, purge des entrées résolues), verdict
  archivable/pending. Ne merge/push JAMAIS tout seul ; hygiène de clôture
  uniquement (pas du scrum/sprint — ça, c'est ezk-sprint).
---

# ezk-archive

**Point d'entrée mince.** La logique de clôture vit dans le **sous-agent**
`ezk-archive` (`~/.claude/agents/ezk-archive.md` — `model: sonnet`, `effort: medium`),
pour que le rituel de clôture tourne **toujours au même modèle/effort**, quel que
soit le modèle de la session en cours. Ce skill ne fait **QUE déléguer** ; il ne
déroule jamais la checklist lui-même dans la conversation principale.

> **Une seule responsabilité : l'hygiène de clôture.** Ce n'est PAS du sprint ni du
> scrum (ça, c'est [`ezk-sprint`](../ezk-sprint/)), ni le suivi du *quoi* (ça, c'est
> [`ezk-backlog`](../ezk-backlog/)). `ezk-sprint` **ouvre/déroule**, `ezk-backlog`
> suit **le quoi**, **`ezk-archive` clôt**.

## Usage (sous-commandes)

`/ezk-archive [sous-commande]` — ou en langage naturel (« clôture la session »,
« on archive ? »).

| Sous-commande | Effet |
|---|---|
| `help` (ou `?`, ou **sans argument**) | Affiche ce tableau + un mot sur chaque vérification |
| `check` | **Dry-run, ne modifie RIEN** — produit le rapport de clôture (les 7 points) |
| `run` / `close` | Applique les **corrections sûres** (ship/regen backlog, mémoire) puis produit la **note de handoff** + le **verdict** |

Le détail des 7 vérifications, le gabarit de handoff et les garde-fous vivent dans
le sous-agent (`~/.claude/agents/ezk-archive.md`) — pas ici, pour ne jamais dupliquer
le comportement à deux endroits qui pourraient diverger.

## Comment déléguer

Le sous-agent **n'a aucune mémoire de cette conversation** — il ne voit que ce que tu
lui passes explicitement dans le prompt. À chaque invocation :

1. **Détermine la sous-commande** : `help` par défaut si aucune ou non reconnue,
   sinon `check` ou `run`/`close`.
2. **Compose un résumé bref de session** (5-15 lignes) : ce qui a été livré (fiches/
   PRs avec IDs), les décisions ADR prises, les faits notables appris (contraintes,
   choix et leur *pourquoi*) — tout ce qui **n'est pas dérivable du seul état git/gh**
   (le sous-agent lit lui-même `scripts/check.sh` pour l'état git/gh brut).
3. Appelle l'outil **Agent** avec `subagent_type: "ezk-archive"`, `run_in_background:
   false` (son résultat conditionne la suite), et un prompt **autonome** contenant :
   la sous-commande, le chemin du repo courant (cwd), et le résumé de l'étape 2.
4. **Restitue la réponse de l'agent telle quelle** à l'utilisateur — rapport +
   verdict (`check`), ou note de handoff + verdict (`run`).

**Ne déroule pas la checklist toi-même dans la conversation principale** : c'est
précisément pour éviter ça (modèle/effort non maîtrisés sur cette tâche) que ce
skill délègue systématiquement.

## Intégration

- **[`ezk-backlog`](../ezk-backlog/)** : le sous-agent lui délègue `ship`/`add`/
  `regen` ; sa note de handoff renvoie vers `list`.
- **[`ezk-sprint`](../ezk-sprint/)** : complémentaire — le sprint *ouvre/déroule*,
  ezk-archive *clôt*. Typiquement invoqué **après** le checkpoint de fin de sprint.
- **[`ezk-commits`](../ezk-commits/)** : tout commit produit par le sous-agent suit
  les Conventional Commits.
- **`ezk-product-builder`** : à ses pauses inter-sprint, il **rappelle** que
  `/ezk-archive` est disponible si l'utilisateur veut s'arrêter là — il ne
  réimplémente rien du handoff, ça reste ici, seule responsable du fichier.

## Garde-fous (skill)

- **Ne réimplémente jamais la checklist ici** : si tu te surprends à dérouler les 7
  points toi-même dans la conversation principale, arrête-toi — délègue au sous-agent.
- **Toujours fournir un résumé de session** au sous-agent : sans lui, il ne peut voir
  que l'état git/gh, pas ce qui a été décidé/appris/livré pendant la conversation.
- Ne merge/push rien toi-même en préparant l'appel ; ça reste au sous-agent de
  signaler, et à l'utilisateur de trancher.
