---
type: retro
date: 2026-11-03
theme: "Run autonome, sprint 13 : la gate tient dans un worktree neuf et chaque skill lit ses règles"
scope: "sprint 13 du run autonome, clos le 2026-11-03 (deux stories du milestone qualite, plus un correctif après livraison) ; mode léger : tour 1 et tour 2 portés par l'orchestrateur (round-robin dégradé), sans juge car aucune règle n'est proposée ; carnet inter-sessions hors périmètre (passe dédiée décidée le 2026-10-26)"
participants: [architecture, qualite, dev, produit, po]
actions:
  - proposition: "Au grooming, une fiche qui change le texte d'un skill ou d'un agent reçoit un critère : « prouvé sur le banc cop1-cobaye avant la livraison ». La règle de preuve chez l'hôte existe déjà ; c'est le critère qui manquait dans la fiche."
    kind: action
    by: [qualite, produit]
    status: ⏳
---

**En clair :** le sprint 13 a rendu la gate fiable dans un worktree neuf, et chaque skill lit
désormais ses règles au démarrage. La revue a donné GO aux deux. Mais la ligne livrée dans les skills
refusait de tourner dans un projet hôte : je l'ai vu après la livraison, en la lançant sur le banc
`cop1-cobaye`, et corrigé aussitôt. Une proposition attend ta décision ; aucune n'a été appliquée.

## 1 · Les faits de départ

- Deux stories livrées en local : la gate indépendante de l'état du poste (`55a345b6`) et les règles
  lues au démarrage (`0147db7f`). La revue adverse a donné GO aux deux, avec une retouche : un
  `bundle:` passé à `ezk law show` était ignoré en silence ; il est refusé.
- La gate complète est verte dans un worktree neuf, sans l'index généré : 2 264 tests. Le retard sur
  GitHub est prouvé dans un clone jetable, sans toucher la référence partagée.
- Après la livraison, j'ai lancé la nouvelle ligne d'ouverture des skills depuis `cop1-cobaye`. Elle
  refusait de tourner : le lanceur exige `--root` pour toute commande sur un projet. Correctif livré
  (`3a8ef269`), revu GO, gate verte. La règle « une capacité qui vise les hôtes se prouve sur le banc
  avant de livrer » existe, et `ezk-sprint` l'applique ; la fiche ne portait pas ce critère, donc je
  ne l'ai pas joué avant.
- Ironie utile : depuis ce sprint, `ezk-sprint` lit le texte de cette règle à chaque démarrage. Avant,
  il n'en voyait que le nom.
- Le compte rendu du sprint 13 nomme encore deux fiches du sprint 11 comme livrées. C'est la troisième
  fois : la proposition P1 de la rétro du sprint 12 (dates comparées comme du texte) le couvre déjà.
- Le décideur produit a tranché la porte « prête » des deux fiches en 23 secondes, sans lire de
  fichier : la fiche collée dans l'appel suffit.

## 2 · Tour 1 — chaque lentille propose

Le tour 1 est porté par l'orchestrateur, à travers les quatre lentilles : c'est un round-robin
dégradé, sans sous-agent par lentille (mode léger, rétro après chaque sprint par décision du PO).

- **Qualité** : au grooming, une fiche qui change un skill ou un agent reçoit le critère « prouvé sur
  le banc cop1-cobaye » (P1).
- **Produit** : P1 ; c'est le grooming qui rate, pas la règle.
- **Dev** : une règle de plus, « lancer toute nouvelle commande depuis un projet hôte » (P2).
- **Architecture** : rien de neuf ; le lanceur a bien fait son travail en refusant.

## 3 · Tour 2 — confrontation et convergence

Porté par l'orchestrateur, comme le tour 1.

- P1 est gardée, en action : le critère dans la fiche rend la preuve visible à la porte « prête » et
  à la revue.
- P2 est écartée : elle doublerait la règle `development/host-project-proof-before-ship`, que
  `ezk-sprint` lit désormais en entier au démarrage.
- Aucune règle n'est proposée.

## 4 · Le juge de cohérence

Sans objet : aucune règle n'est proposée.

## 5 · Les mesures

- P1 : sur les 3 prochaines fiches qui changent un skill ou un agent, 3 portent le critère du banc
  hôte, et 0 défaut « refuse de tourner chez l'hôte » n'est trouvé après livraison.

## 6 · Décisions du PO

En attente. Le run autonome continue sans appliquer cette proposition : elle attend ta décision.
