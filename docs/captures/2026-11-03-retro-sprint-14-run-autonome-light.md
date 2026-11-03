---
type: retro
date: 2026-11-03
theme: "Run autonome, sprint 14 : le compte rendu de sprint dit vrai"
scope: "sprint 14 du run autonome, clos le 2026-11-03 (une story, seule fiche du milestone observabilite) ; mode léger : tour 1 et tour 2 portés par l'orchestrateur (round-robin dégradé), sans juge car aucune règle n'est proposée ; carnet inter-sessions hors périmètre (passe dédiée décidée le 2026-10-26)"
participants: [architecture, qualite, dev, produit, po]
actions:
  - proposition: "Quand un correctif vise un motif de défaut, ici des dates comparées comme du texte, on cherche ce motif dans tout le module avant la revue, pas seulement à l'endroit signalé."
    kind: action
    by: [qualite, dev]
    status: ⏳
---

**En clair :** le sprint 14 a rendu le compte rendu de sprint fiable. Son propre compte rendu, écrit
avec le correctif, est le premier depuis longtemps à nommer exactement sa fiche livrée. La revue a
trouvé le même défaut de dates dans deux fonctions voisines, corrigées avant la livraison. Une
proposition attend ta décision ; aucune n'a été appliquée.

## 1 · Les faits de départ

- Une story livrée en local : le compte rendu de sprint dit vrai (`c7b23798`). La revue adverse a
  donné GO, avec trois retouches appliquées avant la livraison.
- Rejoués avec le nouveau code, les comptes rendus des sprints 12 et 13 nomment exactement leur lot.
  Celui qui annonçait 390 heures et 49 fiches dit maintenant 41 minutes et une fiche.
- Le compte rendu du sprint 14, écrit par la clôture avec le correctif, nomme sa seule fiche et dure
  21 minutes.
- La revue a trouvé que les compteurs de blocages et de retouches de PR comparaient eux aussi des
  dates comme du texte. Le correctif ne visait que le compteur signalé par la fiche.
- La proposition P1 de la rétro du sprint 12 (dates comparées comme du texte) est couverte par cette
  livraison. Elle reste en attente de ta décision : je ne coche jamais ta case.

## 2 · Tour 1 — chaque lentille propose

Le tour 1 est porté par l'orchestrateur, à travers les quatre lentilles : c'est un round-robin
dégradé, sans sous-agent par lentille (mode léger, rétro après chaque sprint par décision du PO).

- **Qualité** : chercher le motif du défaut dans tout le module avant la revue (P1).
- **Dev** : P1.
- **Architecture** : un seul helper `inWindow` sert désormais les trois compteurs ; rien de neuf.
- **Produit** : le milestone « observabilité » est fini.

## 3 · Tour 2 — confrontation et convergence

Porté par l'orchestrateur, comme le tour 1.

- P1 est gardée, en action : la revue a fait le travail, mais une recherche de deux minutes l'aurait
  évité, et le coût d'une revue reprise est bien plus haut.
- Aucune règle n'est proposée.

## 4 · Le juge de cohérence

Sans objet : aucune règle n'est proposée.

## 5 · Les mesures

- P1 : sur les 3 prochains correctifs d'un motif de défaut, 0 revue qui trouve le même motif ailleurs
  dans le module.

## 6 · Décisions du PO

En attente. Le run autonome continue sans appliquer cette proposition : elle attend ta décision.
