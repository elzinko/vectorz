---
composes: [ezk-backlog]
name: ezk-start
argument-hint: "[help|check|run]"
description: >-
  Garde-fou d'OUVERTURE de session avant de démarrer un sprint : inspecte le dépôt
  en lecture seule (working tree, worktrees parallèles, fiches in-progress, handoff,
  tête PLAN) et rend un verdict CLEAR ou ALERT. À utiliser quand l'utilisateur veut
  « démarrer un sprint », « on commence ? », « lancer ezk-sprint », ou avant l'intake
  d'une nouvelle feature. Sur ALERT : s'arrête et présente des choix explicites
  (rejoindre le sprint en vol / interrompre journalisé) — jamais de démarrage silencieux.
  Symétrique d'ezk-archive (clôture) ; ne merge/push/claim JAMAIS. Sous-commandes :
  help, check (dry-run read-only), run (check + présentation des choix si ALERT).
---

# ezk-start

**Ce skill ne démarre jamais un sprint tout seul.** C'est l'invariant — pendant
symétrique d'`ezk-archive` : celui-ci **clôt**, celui-ci **ouvre**. Il **inspecte**
(read-only) et **alerte** ; l'humain tranche.

> **Une seule responsabilité : la cohérence d'ouverture.** Ce n'est PAS du scrum
> complet (ça, c'est [`ezk-sprint`](../ezk-sprint/)), ni la clôture (ça, c'est
> [`ezk-archive`](../ezk-archive/)). **`ezk-archive` clôt**, **`ezk-start` ouvre**,
> **`ezk-sprint` déroule**.

## Usage (sous-commandes)

`/ezk-start [sous-commande]` — ou en langage naturel (« on démarre un sprint ? »,
« garde-fou d'ouverture »).

| Sous-commande | Effet |
|---|---|
| `help` (ou `?`, ou **sans argument**) | Affiche ce tableau + les 3 points de contrôle |
| `check` | **Dry-run, ne modifie RIEN** — produit le rapport du portier |
| `run` | Même portier que `check`, puis **présente les choix** si ALERT |

Le gabarit de présentation des choix vit dans
[`references/choice-template.md`](references/choice-template.md).

## Le portier décide

### 1. Interroge le portier — **une seule commande**

```bash
bash <chemin-du-skill>/scripts/check.sh --gate
```

Le portier est **read-only** : working tree, worktrees, fiches `in-progress`,
handoff (`handoff.sh carry` best-effort), tête PLAN (`plan:head` best-effort).

### 2. Lis `VERDICT:` — et une seule des deux branches suivantes

#### `VERDICT: CLEAR` → tu peux enchaîner vers l'intake sprint

Aucun signal de collision. **En clair d'abord** (≤ 3 phrases), puis le bloc gate.
Indique que [`ezk-sprint`](../ezk-sprint/) peut prendre la suite (intake étape 0).

> ⚠️ **`check` est un dry-run : il n'écrit RIEN.** Sur `check`, produis le rapport
> dans le chat sans modifier le dépôt. Seul `run` formalise la présentation des
> choix (même sur CLEAR, c'est une confirmation explicite).

#### `VERDICT: ALERT points=…` → **STOP — choix humain obligatoire**

**Ne tire pas la prochaine fiche. Ne crée pas de branche. Ne marque rien
`in-progress`.** Présente le rapport selon
[`references/choice-template.md`](references/choice-template.md) :

| Choix | Effet attendu |
|---|---|
| **Rejoindre** | Reprendre le sprint / worktree / fiche signalée — pas de nouveau sprint |
| **Interrompre journalisé** | Clôturer proprement l'autre session (`/ezk-archive`) ou journaliser l'override PO dans `SPRINT.md` / handoff — **puis** relancer `ezk-start check` |

Attends la décision explicite de l'utilisateur avant toute action sprint.

### 3. Modèle (Claude Code)

Ce skill est **inline** (pas de sous-agent dédié). Utilise le modèle de la session ;
**interdit** Opus 5 / Fable 5 / alias `opus` non piné. Si délégation nécessaire
(ex. arbitrage PO), préfère **`claude-opus-4-8`** ou **`sonnet`** — jamais Opus 5.

## Intégration

- **[`ezk-sprint`](../ezk-sprint/)** : l'intake (étape 0) invoque **`ezk-start check`**
  **avant** `ezk-backlog next` — sur ALERT, le sprint s'arrête.
- **[`ezk-archive`](../ezk-archive/)** : complémentaire — archive clôt, start ouvre.
  Le handoff pending est lu via `ezk-archive/scripts/handoff.sh carry` (best-effort).
- **[`ezk-backlog`](../ezk-backlog/)** : `plan:head` pour la tête PLAN (best-effort).

## Garde-fous (skill)

- **Ne démarre jamais silencieusement** un sprint sur ALERT — c'est le risque grave.
- **`check` n'écrit jamais** : pas de claim, pas de `status: in-progress`, pas de branche.
- **Ne merge/push rien** ; l'ouverture est advisory (tâche 2 claim/verrou = hors scope).
- **Ne recopie pas le gabarit de choix ici** : il vit dans `references/choice-template.md`.
