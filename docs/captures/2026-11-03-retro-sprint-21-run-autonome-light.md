---
type: retro
date: 2026-11-03
theme: "Run autonome, sprint 21 : mission control dit ce que la méthode publie, et son API répond juste"
scope: "sprint 21 du run autonome, clos le 2026-11-03 (trois bugs de la passe scout du 2026-11-02, hors milestone comme leurs aînés) ; mode léger : tour 1 et tour 2 portés par l'orchestrateur (round-robin dégradé), sans juge car aucune règle n'est proposée ; carnet inter-sessions hors périmètre (passe dédiée décidée le 2026-10-26)"
participants: [architecture, qualite, dev, produit, po]
actions:
  - proposition: "`sprint.sh start` imprime le nom exact du point de passage du sprint (`GATE_ID: sprint-<slug>-checkpoint`), celui que `close` cherchera. Au sprint 21, l'agent l'a recalculé à la main avec une lettre de trop : le compte rendu affiche 0 minute et 0 fiche livrée au lieu de 3."
    kind: feature
    by: [qualite, dev]
    status: ⏳
  - proposition: "`ezk review emit --fiche` refuse un chemin de fiche, ou en extrait l'identifiant. Donné un chemin, il range la revue dans `features/reviews/features/<chemin>/` : vu au sprint 21, et deux dossiers de ce genre sont déjà suivis par git."
    kind: feature
    by: [dev, qualite]
    status: ⏳
  - proposition: "Retirer de cop1 le module `rule-application` et l'écouteur `SidecarSyncListener` : ni l'un ni l'autre n'est appelé par du code de production, et plus rien n'émet les événements que l'écouteur attend depuis le retrait des propositions de règle."
    kind: feature
    by: [architecture, qualite]
    status: ⏳
---

**En clair :** le sprint 21 a livré trois bugs trouvés par le scout. Le board écrit « à clore » pour
une version finie et pas encore étiquetée. Un corps de requête invalide reçoit 400 au lieu de 404. Les
routes de propositions de règle, branchées sur rien, sont retirées. La revue a dit GO sur les trois. Le
compte rendu du sprint, lui, est faux à cause d'un point de passage mal nommé. Trois propositions
attendent ta décision ; aucune n'a été appliquée.

## 1 · Les faits de départ

- Trois stories livrées en local : `c6a25fa8`, `bb67c8a6`, `f1e4ceca`. Une seule revue adverse pour
  les trois patchs, GO sans constat bloquant.
- L'écran a changé pour la première : captures avant et après dans
  `docs/pr-evidence/20261102100505774/`.
- La reproduction du scout ne marchait plus telle quelle : le garde-fou contre les écritures d'un autre
  site répond 415 à une requête sans en-tête JSON. Les fiches disent maintenant d'ajouter l'en-tête.
- Le compte rendu du sprint 21 affiche 0 minute et 0 fiche livrée. Le vrai sprint a duré environ
  28 minutes et livré 3 fiches. Cause : l'agent a posé un premier point de passage avec un nom faux,
  puis le bon quinze secondes plus tard. La fenêtre du compte rendu part du premier.
- `ezk review emit --fiche <chemin>` a rangé la revue dans un dossier imbriqué. Deux revues anciennes
  ont subi le même sort et sont suivies par git.
- La revue a trouvé du code mort voisin : le module `rule-application` et l'écouteur
  `SidecarSyncListener` de cop1.
- Le lint de cop1 est rouge sur 9 erreurs, dans des fichiers du 2026-10-26 que ce sprint n'a pas
  touchés. Aucune gate ne lance biome sur cop1. Le cas est ajouté à la fiche
  [le lint ne vérifie pas le code de mega-city](../../features/20261001133500750_lint-ne-couvre-pas-mega-city.md),
  en attente de ta décision.

## 2 · Tour 1 — chaque lentille propose

Le tour 1 est porté par l'orchestrateur, à travers les quatre lentilles : c'est un round-robin
dégradé, sans sous-agent par lentille (mode léger, rétro après chaque sprint par décision du PO).

- **Qualité** : le script d'ouverture donne le nom du point de passage (P1). `review emit` refuse un
  chemin (P2).
- **Dev** : P1, P2 ; recalculer un nom à la main est le geste qui a raté.
- **Architecture** : retirer le module et l'écouteur morts d'un coup (P3), au nom de la loi
  `clean-code/no-dead-code`.
- **Produit** : rien de neuf ; les trois corrections se voient ou se rejouent.

## 3 · Tour 2 — confrontation et convergence

Porté par l'orchestrateur, comme le tour 1.

- P1 est gardée, en feature : la rétro du sprint 18 a déjà vu une fenêtre empruntée, par une autre
  cause. Deux causes en quatre sprints : le nom doit venir de la machine.
- P2 est gardée, en feature : trois occurrences du même piège.
- P3 est gardée, en feature : elle sort du périmètre du sprint, la fiche du retrait l'a signalée.
- Aucune règle n'est proposée.

## 4 · Le juge de cohérence

Sans objet : aucune règle n'est proposée.

## 5 · Les mesures

- P1 : sur les 5 prochains sprints, 0 compte rendu dont la fenêtre part d'un point de passage mal nommé.
- P2 : `ezk review emit --fiche features/<fichier>.md` écrit dans `features/reviews/<id>/`, ou refuse.
- P3 : aucun fichier de cop1 ne cite `RuleApplicationService` ni `SidecarSyncListener`, hors historique.

## 6 · Décisions du PO

En attente. Le run autonome continue sans appliquer ces propositions : elles attendent ta décision.
