---
type: retro
date: 2026-11-03
theme: "Run autonome, sprint 15 : un découpage propose ses fiches au plan"
scope: "sprint 15 du run autonome, clos le 2026-11-03 (une story, dernière fiche du milestone preparation) ; mode léger : tour 1 et tour 2 portés par l'orchestrateur (round-robin dégradé), sans juge car aucune règle n'est proposée ; carnet inter-sessions hors périmètre (passe dédiée décidée le 2026-10-26)"
participants: [architecture, qualite, dev, produit, po]
actions:
  - proposition: "Quand le PO met le run en pause, le run pose un point de passage de supervision « pause » puis « reprise ». Le compte rendu retire alors la pause de la durée du sprint, au lieu d'afficher des heures d'attente comme du travail."
    kind: feature
    by: [produit, qualite]
    status: ⏳
---

**En clair :** le sprint 15 a livré la dernière fiche du milestone « préparation » : après un
découpage, l'outil propose la ligne de plan de chaque fiche sœur. La revue a donné GO, avec deux
retouches. Le compte rendu annonce 14 h 35, parce qu'il compte la pause que tu as demandée. Une
proposition attend ta décision ; aucune n'a été appliquée.

## 1 · Les faits de départ

- Une story livrée en local (`5022a2ea`). La revue adverse a donné GO, avec deux retouches. Un plan
  illisible fait maintenant échouer la commande, au lieu de proposer toutes les sœurs. Une sœur déjà
  barrée au plan compte comme « au plan », et c'est écrit.
- Le compte rendu nomme exactement la fiche livrée : le correctif du sprint 14 tient.
- Il annonce aussi 14 h 35. La fenêtre part du point de passage du sprint 14 et compte la pause
  demandée par le PO (« Attendre mes décisions ») : environ 14 heures sans travail.
- La pause a été relue ainsi : ne rien trancher de ce qui revient au PO. Le travail autonome a repris
  sans toucher aux propositions des rétros, aux fiches différées ni au push.

## 2 · Tour 1 — chaque lentille propose

Le tour 1 est porté par l'orchestrateur, à travers les quatre lentilles : c'est un round-robin
dégradé, sans sous-agent par lentille (mode léger, rétro après chaque sprint par décision du PO).

- **Produit** : une pause du PO se marque dans le journal, et le compte rendu la retire de la durée
  (P1).
- **Qualité** : P1 ; une durée gonflée trompe la rétro outillée, comme les zéros d'avant.
- **Dev** : rien de neuf sur le code livré.
- **Architecture** : P1 passe par les points de passage existants (`gate_reached`), sans événement
  neuf.

## 3 · Tour 2 — confrontation et convergence

Porté par l'orchestrateur, comme le tour 1.

- P1 est gardée, en feature : c'est un défaut structurel du calcul de durée, qu'une règle de
  discipline ne corrige pas.
- Aucune règle n'est proposée.

## 4 · Le juge de cohérence

Sans objet : aucune règle n'est proposée.

## 5 · Les mesures

- P1 : un sprint coupé par une pause du PO affiche une durée de travail, sans les heures de pause ;
  la pause est nommée dans le compte rendu.

## 6 · Décisions du PO

En attente. Le run autonome continue sans appliquer cette proposition : elle attend ta décision.
