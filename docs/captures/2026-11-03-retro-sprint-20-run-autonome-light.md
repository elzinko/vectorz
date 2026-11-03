---
type: retro
date: 2026-11-03
theme: "Run autonome, sprint 20 : le ship marche depuis un projet hôte"
scope: "sprint 20 du run autonome, clos le 2026-11-03 (une story, bug P1 sans milestone, vécu au run livestreamz du 2026-10-27) ; mode léger : tour 1 et tour 2 portés par l'orchestrateur (round-robin dégradé), sans juge car aucune règle n'est proposée ; carnet inter-sessions hors périmètre (passe dédiée décidée le 2026-10-26)"
participants: [architecture, qualite, dev, produit, po]
actions:
  - proposition: "L'ouverture du compte rendu de sprint sépare les jetons neufs des jetons relus en cache. Le sprint 20 annonce 60 269 122 jetons, dont 60 110 763 relus en cache, soit 99,7 %."
    kind: feature
    by: [produit, qualite]
    status: ⏳
---

**En clair :** le sprint 20 a réparé le ship depuis un projet hôte. Les deux commandes de ship
marchent hors de vectorz, et une fiche à trois chiffres est acceptée. La preuve a été rejouée sur un
clone jetable de livestreamz, jamais sur le vrai dépôt. La revue a dit GO du premier coup. Une
proposition attend ta décision ; aucune n'a été appliquée.

## 1 · Les faits de départ

- Une story livrée en local (`1829a56e`). La revue adverse a rejoué un vrai ship depuis le clone : la
  fiche à trois chiffres est rangée, le commit part, l'index de l'hôte est régénéré.
- Deux remarques non bloquantes de la revue. Un message reste flou hors d'un dépôt git ; c'était déjà
  le cas avant. Le contrôle des fiches ne signale plus un fichier `123.md` sans séparateur.
- Le compte rendu est juste sur la durée et la fiche : 15 minutes. Le run de supervision avait été
  ouvert avant le sprint.
- Le compte rendu annonce 60 269 122 jetons en ouverture. 60 110 763 sont des relectures du cache,
  bien moins chères qu'un jeton neuf. Le détail le dit plus bas, l'ouverture non.
- La preuve sur un vrai run hôte reste à faire : la fiche le note dans « À tester ».

## 2 · Tour 1 — chaque lentille propose

Le tour 1 est porté par l'orchestrateur, à travers les quatre lentilles : c'est un round-robin
dégradé, sans sous-agent par lentille (mode léger, rétro après chaque sprint par décision du PO).

- **Produit** : l'ouverture du compte rendu sépare jetons neufs et relus en cache (P1). Un chiffre
  de 60 millions fait peur et ne dit pas ce que le sprint a coûté.
- **Qualité** : P1 ; le total reste juste, c'est sa lecture qui trompe.
- **Dev** : le clone jetable a suffi à prouver le ship ; rien de neuf à proposer.
- **Architecture** : P1 reste dans l'extracteur du compte rendu, sans moteur neuf.

## 3 · Tour 2 — confrontation et convergence

Porté par l'orchestrateur, comme le tour 1.

- P1 est gardée, en feature : le chiffre est dans chaque compte rendu committé, et il pèse sur la
  lecture du coût d'un run.
- Les deux remarques de revue ne deviennent pas des propositions. La première précède ce sprint ; la
  seconde vise un nom de fichier qu'aucune fiche ne porte.
- Aucune règle n'est proposée.

## 4 · Le juge de cohérence

Sans objet : aucune règle n'est proposée.

## 5 · Les mesures

- P1 : l'ouverture du compte rendu affiche le total, puis la part relue en cache ; la somme des deux
  parts égale le total du détail.

## 6 · Décisions du PO

En attente. Le run autonome continue sans appliquer cette proposition : elle attend ta décision.
