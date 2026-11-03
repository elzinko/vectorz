---
type: retro
date: 2026-11-03
theme: "Run autonome, sprint 16 : les messages du code disent mission control"
scope: "sprint 16 du run autonome, clos le 2026-11-03 (une story, première sœur du découpage de la fiche des guides, milestone board) ; mode léger : tour 1 et tour 2 portés par l'orchestrateur (round-robin dégradé), sans juge car aucune règle n'est proposée ; carnet inter-sessions hors périmètre (passe dédiée décidée le 2026-10-26)"
participants: [architecture, qualite, dev, produit, po]
actions:
  - proposition: "Quand un écran est retiré, la fiche de retrait liste les gestes qu'il offrait et dit, pour chacun, où il vit désormais ou qu'il disparaît. Le bouton « Abandonner ce run » a disparu sans que personne le décide."
    kind: action
    by: [produit, architecture]
    status: ⏳
---

**En clair :** le sprint 16 a fait dire « mission control » aux neuf messages qui nommaient encore
l'ancien écran. Le tri a mis au jour un geste perdu : mission control n'a jamais repris le bouton
« Abandonner ce run ». Un message d'erreur y renvoyait encore. Une proposition et une question
attendent ta décision ; rien n'a été appliqué.

## 1 · Les faits de départ

- La fiche des guides de l'ancien écran était trop grosse pour un sprint : 658 lignes de guides à
  rejouer, plus les messages du code. Elle a été découpée en deux sœurs avec l'outil livré au sprint
  15, qui a proposé leurs lignes de plan. Premier usage réel, il a marché.
- Une story livrée en local (`f75c5760`). La revue a donné GO, avec une retouche utile : la route
  d'abandon du daemon exige l'en-tête `Content-Type: application/json`. Sans lui, un agent qui suit
  le message aurait reçu un refus 415.
- Mission control n'a pas repris le bouton « Abandonner ce run » de l'ancien écran. La route du daemon
  existe, aucun écran ne l'appelle. Personne n'a décidé ce retrait : il s'est fait avec l'écran. Le
  message pointe maintenant vers ce qui existe ; la question du bouton t'attend.
- Dans un worktree neuf, les tests de l'app cop1 demandent `pnpm build` à la racine d'abord. Le piège
  est connu ; il a coûté un faux échec de deux fichiers.
- Le compte rendu du sprint dit vrai : 23 minutes, la fiche du lot.

## 2 · Tour 1 — chaque lentille propose

Le tour 1 est porté par l'orchestrateur, à travers les quatre lentilles : c'est un round-robin
dégradé, sans sous-agent par lentille (mode léger, rétro après chaque sprint par décision du PO).

- **Produit** : retirer un écran oblige à lister ses gestes et à dire où chacun va (P1).
- **Architecture** : P1 ; la route d'abandon montre qu'un contrat peut survivre à son seul écran.
- **Qualité** : rien de neuf ; la revue a fait son travail sur l'en-tête.
- **Dev** : le build des paquets cop1 dans un worktree neuf ; c'est la proposition du sprint 7 sur la
  préparation d'un dossier neuf, toujours en attente, pas une nouvelle.

## 3 · Tour 2 — confrontation et convergence

Porté par l'orchestrateur, comme le tour 1.

- P1 est gardée, en action : un geste perdu sans décision est un défaut produit, et une liste dans la
  fiche de retrait suffit à le voir.
- Aucune règle n'est proposée.

## 4 · Le juge de cohérence

Sans objet : aucune règle n'est proposée.

## 5 · Les mesures

- P1 : au prochain retrait d'écran ou de vue, la fiche liste ses gestes, et 0 geste ne disparaît sans
  décision écrite.

## 6 · Décisions du PO

En attente. Le run autonome continue sans appliquer cette proposition : elle attend ta décision. La
question du bouton « Abandonner ce run » (le reprendre dans mission control, ou l'assumer retiré)
t'attend aussi.
