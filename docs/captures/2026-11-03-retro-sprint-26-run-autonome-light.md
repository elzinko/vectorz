---
type: retro
date: 2026-11-03
theme: "Run autonome, sprint 26 : mission control se lit sans deviner"
scope: "sprint 26 du run autonome, clos le 2026-11-03 (trois bugs de la seconde passe scout de la nuit, retenus par ezk-pm en mode auto) ; mode léger : tour 1 et tour 2 portés par l'orchestrateur (round-robin dégradé), sans juge car aucune règle n'est proposée ; carnet inter-sessions hors périmètre (passe dédiée décidée le 2026-10-26)"
participants: [architecture, qualite, dev, produit, po]
actions:
  - proposition: "La preuve d'une correction de mise en page montre la fenêtre entière, pas seulement l'élément corrigé. Au sprint 26, la capture complète a révélé un effet de bord que les tests ne voient pas : le bouton « Fermer » se cassait en deux lignes une fois la pastille corrigée."
    kind: action
    by: [qualite, dev]
    status: ⏳
---

**En clair :** le sprint 26 a livré trois bugs trouvés par la seconde passe du scout. La vue Pilotage
nomme les fiches par leur titre, cliquable. Le contexte d'une fiche affiche ses listes à puces. La
raison d'un blocage revient à la ligne au lieu de déborder. La revue a dit GO sur les trois. Une
proposition attend ta décision ; aucune n'a été appliquée.

## 1 · Les faits de départ

- Trois stories livrées en local : `e928608d` (titres dans Pilotage), `8c017d8f` (listes à puces) et
  `8a7f9c42` (pastille de blocage). Deux revues adverses, GO.
- La seconde passe du scout a confirmé les six correctifs du soir et trouvé quatre défauts mineurs.
  `ezk-pm` en a retenu trois ; le quatrième, le format des versions de samplerz, t'attend.
- Les listes et la pastille touchaient le même fichier : la pastille a été construite après
  l'intégration des listes. Aucun conflit ce sprint, contre deux aux sprints 24 et 25. C'est la
  proposition de la rétro du sprint 25, appliquée à la main ; elle attend toujours ta décision.
- La capture « après » de la pastille a montré un effet de bord : le bouton « Fermer » passait sur deux
  lignes. Corrigé dans la même story. Les tests ne calculent pas la mise en page et ne l'auraient pas vu.
- Le compte rendu du sprint est juste : 48 minutes, 3 fiches.

## 2 · Tour 1 — chaque lentille propose

Le tour 1 est porté par l'orchestrateur, à travers les quatre lentilles : c'est un round-robin
dégradé, sans sous-agent par lentille (mode léger, rétro après chaque sprint par décision du PO).

- **Qualité** : la preuve d'une correction de mise en page montre la fenêtre entière (P1).
- **Dev** : P1 ; la mesure en navigateur prouve l'élément, la capture entière prouve ses voisins.
- **Architecture** : rien de neuf ; enchaîner les stories d'un même fichier a supprimé les conflits.
- **Produit** : la lisibilité de mission control progresse ; le format des versions reste à trancher.

## 3 · Tour 2 — confrontation et convergence

Porté par l'orchestrateur, comme le tour 1.

- P1 est gardée, en action : un effet de bord visible n'est vu que si la preuve le montre.
- Aucune règle n'est proposée.

## 4 · Le juge de cohérence

Sans objet : aucune règle n'est proposée.

## 5 · Les mesures

- P1 : sur les 5 prochaines corrections de mise en page, 0 effet de bord visible découvert après
  l'intégration.

## 6 · Décisions du PO

En attente. Le run autonome continue sans appliquer cette proposition : elle attend ta décision.
