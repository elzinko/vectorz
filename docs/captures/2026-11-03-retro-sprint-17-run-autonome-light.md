---
type: retro
date: 2026-11-03
theme: "Run autonome, sprint 17 : la recette du contrat JSON versionné"
scope: "sprint 17 du run autonome, clos le 2026-11-03 (une story de prose, dernière fiche du milestone recettes) ; mode léger : tour 1 et tour 2 portés par l'orchestrateur (round-robin dégradé), sans juge car aucune règle n'est proposée ; carnet inter-sessions hors périmètre (passe dédiée décidée le 2026-10-26)"
participants: [architecture, qualite, dev, produit, po]
actions:
  - proposition: "Une recette qui cite des `fichier:ligne` les fait vérifier par un script : le fichier existe, la ligne existe, et elle contient le mot annoncé. Deux relecteurs ont dû ouvrir treize pointeurs à la main."
    kind: feature
    by: [qualite, dev]
    status: ⏳
---

**En clair :** le sprint 17 a livré la recette « publier un contrat JSON versionné ». Elle part de sept
contrats déjà en place et nomme les trois erreurs qu'ils ont coûtées. Le gardien des recettes et la
revue ont dit GO ; tous deux ont relu treize pointeurs à la main, et deux visaient une ligne de
commentaire au lieu du code. Une proposition attend ta décision ; aucune n'a été appliquée.

## 1 · Les faits de départ

- Une story livrée en local (`c7128975`). Le gardien `ezk-chef` et la revue adverse ont donné GO.
- Les deux relecteurs ont ouvert chacun les treize `fichier:ligne` de la recette. Deux pointeurs
  visaient le commentaire qui raconte le piège, pas la ligne qui pose `process.exitCode`. Corrigés.
- Le sprint a été court : 12 minutes au compte rendu, qui nomme la bonne fiche.
- Le milestone « recettes » est terminé. Le milestone « board » garde une fiche, en attente de ta
  décision sur la stratégie de documentation.

## 2 · Tour 1 — chaque lentille propose

Le tour 1 est porté par l'orchestrateur, à travers les quatre lentilles : c'est un round-robin
dégradé, sans sous-agent par lentille (mode léger, rétro après chaque sprint par décision du PO).

- **Qualité** : un script vérifie les `fichier:ligne` d'une recette (P1).
- **Dev** : P1 ; le contrôle des liens existe déjà, il ne regarde que les liens Markdown.
- **Architecture** : P1 s'ajoute au contrôle mécanique d'`ezk-chef`, sans moteur neuf.
- **Produit** : rien de neuf.

## 3 · Tour 2 — confrontation et convergence

Porté par l'orchestrateur, comme le tour 1.

- P1 est gardée, en feature : les pointeurs dérivent dès que le code bouge, et une relecture à la main
  ne les suit pas dans le temps.
- Aucune règle n'est proposée.

## 4 · Le juge de cohérence

Sans objet : aucune règle n'est proposée.

## 5 · Les mesures

- P1 : un pointeur qui vise une ligne absente, ou une ligne sans le mot annoncé, fait tomber le
  contrôle de la recette.

## 6 · Décisions du PO

En attente. Le run autonome continue sans appliquer cette proposition : elle attend ta décision.
