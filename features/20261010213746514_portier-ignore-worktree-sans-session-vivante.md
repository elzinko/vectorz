---
id: "20261010213746514"
title: Le portier de sprint distingue un worktree vivant d'un worktree abandonné (ne plus crier au loup)
type: feature
priority: P2
product: mega-city
milestone:
version:
labels: [ezk-sprint, portier]
status: idea
pr:
evidence: none
created: 2026-10-10
---

# 20261010213746514 — Le portier ne signale que les worktrees VIVANTS

**En clair.** Avant chaque sprint, un contrôle de sécurité vérifie si un **autre dossier de
travail** (worktree) tourne en parallèle, pour éviter que deux sessions s'écrasent. Le problème :
il signale **tous** les dossiers voisins, même ceux dont la session est **terminée et archivée**
— des restes sur le disque. Du coup il réclame une autorisation humaine pour un dossier mort, à
chaque sprint. On veut qu'il ne s'alarme que pour un dossier **réellement vivant**.

**Si tu arrives frais.** Un *worktree* est une copie de travail du dépôt, une par session, pour
que deux sessions ne se marchent pas dessus. Le *portier* est le contrôle que `ezk-sprint`
lance à l'ouverture d'un sprint (`check.sh`) ; il peut dire `CLEAR` (vas-y) ou `ALERT`
(demande à l'humain). Une *session archivée* est une session finie et rangée : plus personne ne
travaille dedans.

## Contexte / Problème

- **Symptôme daté (2026-10-10).** Pendant un run `ezk-product-build` de 3 sprints, le portier a
  levé `ALERT` à **chaque** sprint pour le même dossier voisin
  (`ready-todo-status-distinction-d96e52`). Or **toutes** les sessions de ce dossier étaient
  archivées — aucune ne tournait. C'était un **dossier abandonné**, pas du travail parallèle.
  J'ai dû donner une autorisation humaine 3 fois pour rien. (Le dossier a depuis été nettoyé.)
- **La cause.** Le portier regarde les dossiers voisins **présents sur le disque**, mais pas
  s'ils sont **tenus par une session vivante**. Un reste d'une session archivée compte comme une
  alerte, au même titre qu'une vraie session concurrente.
- **Pourquoi ça compte.** Chaque alerte inutile demande une décision humaine. En mode autonome,
  ça casse l'autonomie et use le pilote — exactement ce qu'un run « auto » doit éviter.

## Proposition

1. Avant d'alerter sur un dossier voisin, le portier vérifie s'il est **tenu par une session
   vivante** (en cours, ou active récemment). Sinon, il ne lève **pas** d'`ALERT` bloquante.
2. Un dossier voisin **sans session vivante** est traité comme un **reste à nettoyer** : signal
   d'information (non bloquant), pas une alerte qui réclame une autorisation.
3. Garder l'alerte **pleine** pour un dossier tenu par une **vraie** session parallèle vivante
   (le cas que le portier doit vraiment attraper).

## Critères d'acceptation

- [ ] Le portier **ne lève pas** d'`ALERT` bloquante pour un dossier voisin dont la session est
      archivée / non vivante.
- [ ] Il **lève** toujours l'`ALERT` pour un dossier tenu par une session vivante en parallèle.
- [ ] Un dossier abandonné détecté est **signalé en information** (« reste à nettoyer »), pas en
      alerte.

## Comment vérifier

```bash
# scénario 1 : un worktree voisin dont la session est archivée → portier CLEAR (ou info, pas ALERT)
# scénario 2 : un worktree voisin tenu par une session vivante → portier ALERT
bash products/mega-city/skills/ezk-sprint/scripts/check.sh --gate
```

## Glossaire

- `portier` — le contrôle `check.sh` lancé par `ezk-sprint` à l'ouverture d'un sprint.
- `worktree voisin` — un autre dossier de travail du même dépôt, à côté du sien.
- `session vivante` — une session en cours ou active récemment (pas archivée).

## Notes / décisions

- Née de la rétro du run « règles composables » du 2026-10-10 (grain n°1), capture
  [docs/captures/2026-10-10-retro-run-regles-composables.md](../docs/captures/2026-10-10-retro-run-regles-composables.md).
- **Question ouverte pour le grooming** : comment un script bash (`check.sh`) apprend-il
  qu'un worktree a une session vivante ? L'app connaît l'état des sessions ; un script, non
  directement. Pistes à trancher : lire une liste de sessions exposée par l'app, ou un repli
  heuristique (worktree sans commit récent + branche déjà fusionnée = probablement mort). À
  cadrer avant de construire.
- Priorité P2 proposée (réduction de bruit, confort d'autonomie) ; à confirmer.
