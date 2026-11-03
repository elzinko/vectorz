---
type: retro
date: 2026-11-03
theme: "Run autonome, sprint 25 : l'écran de mission control tient ce qu'il affiche"
scope: "sprint 25 du run autonome, clos le 2026-11-03 (trois bugs d'écran de la passe scout du soir, retenus par ezk-pm en mode auto) ; mode léger : tour 1 et tour 2 portés par l'orchestrateur (round-robin dégradé), sans juge car aucune règle n'est proposée ; carnet inter-sessions hors périmètre (passe dédiée décidée le 2026-10-26)"
participants: [architecture, qualite, dev, produit, po]
actions:
  - proposition: "Au découpage d'un lot, deux stories qui modifient le même fichier se construisent l'une après l'autre : la seconde part du main qui contient déjà la première. Aux sprints 24 et 25, deux paires construites en parallèle ont demandé un recalage avec conflit résolu à la main ; une résolution a perdu une accolade, rattrapée par les tests."
    kind: action
    by: [dev, architecture]
    status: ⏳
---

**En clair :** le sprint 25 a livré trois bugs d'écran trouvés par le scout du soir. La fenêtre d'une
fiche affiche son Markdown mis en forme. La barre « Entonnoir » n'écrit plus de zéro coupé. Le tableau
des versions ne promet plus un clic qui ne fait rien. La revue a dit GO sur les trois. Une proposition
attend ta décision ; aucune n'a été appliquée.

## 1 · Les faits de départ

- Trois stories livrées en local : `630f0029` (Markdown), `0ff9193b` (zéro de l'entonnoir) et
  `25174dc0` (promesse de clic). Une revue adverse pour les trois, GO.
- La revue a trouvé une vraie limite du rendu Markdown : un glob comme `src/**/*.ts`, écrit hors code,
  passait en italique. Corrigé avant l'intégration, avec un test.
- Le zéro coupé ne se montrait sur aucun projet réel ce soir-là. La preuve vient d'un projet de banc
  jetable, ajouté au registre des instances de test sans être committé, puis retiré.
- Deux stories ajoutaient un test au même endroit du même fichier. Le recalage a demandé une
  résolution à la main, qui a d'abord perdu une accolade ; les tests l'ont rattrapée. Le sprint 24
  avait vécu la même chose sur le traducteur du plan.
- Le compte rendu du sprint est juste : 35 minutes, 3 fiches.
- Les six bugs retenus par `ezk-pm` sont livrés. Le septième, l'écriture des réglages ⚙, t'attend.

## 2 · Tour 1 — chaque lentille propose

Le tour 1 est porté par l'orchestrateur, à travers les quatre lentilles : c'est un round-robin
dégradé, sans sous-agent par lentille (mode léger, rétro après chaque sprint par décision du PO).

- **Dev** : deux stories du même fichier se construisent l'une après l'autre (P1).
- **Architecture** : P1 ; le parallèle ne fait gagner du temps que si les fichiers sont disjoints.
- **Qualité** : rien de neuf ; la revue a trouvé la limite du glob avant l'intégration.
- **Produit** : rien de neuf.

## 3 · Tour 2 — confrontation et convergence

Porté par l'orchestrateur, comme le tour 1.

- P1 est gardée, en action : deux sprints de suite, et une résolution à la main qui a cassé un fichier.
- Aucune règle n'est proposée.

## 4 · Le juge de cohérence

Sans objet : aucune règle n'est proposée.

## 5 · Les mesures

- P1 : sur les 5 prochains lots, 0 conflit résolu à la main entre deux stories du même lot.

## 6 · Décisions du PO

En attente. Le run autonome continue sans appliquer cette proposition : elle attend ta décision.
