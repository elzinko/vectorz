---
type: retro
date: 2026-11-03
theme: "Run autonome, sprint 19 : la config pré-règle le menu de grooming"
scope: "sprint 19 du run autonome, clos le 2026-11-03 (une story, premier morceau de la fiche « configurer les étapes et les choix de la méthode », milestone methode-configurable) ; mode léger : tour 1 et tour 2 portés par l'orchestrateur (round-robin dégradé), sans juge car aucune règle n'est proposée ; carnet inter-sessions hors périmètre (passe dédiée décidée le 2026-10-26)"
participants: [architecture, qualite, dev, produit, po]
actions:
  - proposition: "Les réglages de la méthode ajoutés à `.vectorz/config.yml` (revue adverse, menu de grooming) sont montrés par mission control dans sa vue « Configuration », puisque la méthode les publie déjà dans son contrat."
    kind: feature
    by: [produit, architecture]
    status: ⏳
---

**En clair :** le sprint 19 a livré le premier morceau de la configuration de la méthode : un projet
peut pré-régler le menu de grooming, avec les noms du catalogue. Une clé mal nommée est refusée en la
nommant. La revue a dit GO du premier coup, avec deux retouches de texte. Une proposition attend ta
décision ; aucune n'a été appliquée.

## 1 · Les faits de départ

- Une story livrée en local (`5f502df1`). La revue adverse a rejoué l'erreur en vrai, en texte et en
  JSON, et a dit GO.
- Deux retouches : un paramètre `--archi` donné à la commande l'emporte sur la config ; le catalogue
  compte 10 techniques, le texte en annonçait 9.
- Le compte rendu du sprint est juste : 13 minutes, la fiche du lot. Un nouveau run de supervision
  avait été ouvert avant le sprint, ce qui évite l'emprunt de fenêtre vu au sprint 18.
- Deux réglages de la méthode sont nés en deux sprints (revue adverse, menu de grooming). La méthode
  les publie dans `ezk config show --json`, mais mission control ne les montre pas encore.
- Le comportement de `groom` réglé reste porté par son texte ; un vrai auto-groom réglé est en mesure
  de suivi.

## 2 · Tour 1 — chaque lentille propose

Le tour 1 est porté par l'orchestrateur, à travers les quatre lentilles : c'est un round-robin
dégradé, sans sous-agent par lentille (mode léger, rétro après chaque sprint par décision du PO).

- **Produit** : mission control montre les réglages que la méthode publie déjà (P1).
- **Architecture** : P1 suit l'ADR-086 : la méthode publie, mission control affiche.
- **Qualité** : ouvrir un run de supervision avant chaque reprise de sprint ; c'est déjà la
  proposition P1 de la rétro du sprint 18, pas une nouvelle.
- **Dev** : rien de neuf.

## 3 · Tour 2 — confrontation et convergence

Porté par l'orchestrateur, comme le tour 1.

- P1 est gardée, en feature : un réglage qu'on ne voit pas à l'écran s'oublie, surtout celui qui
  saute la revue.
- Aucune règle n'est proposée.

## 4 · Le juge de cohérence

Sans objet : aucune règle n'est proposée.

## 5 · Les mesures

- P1 : la vue « Configuration » de mission control affiche `review.adverse` et `grooming.techniques`
  tels que `ezk config show --json` les publie, sans les recalculer.

## 6 · Décisions du PO

En attente. Le run autonome continue sans appliquer cette proposition : elle attend ta décision.
