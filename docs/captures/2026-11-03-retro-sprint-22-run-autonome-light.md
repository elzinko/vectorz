---
type: retro
date: 2026-11-03
theme: "Run autonome, sprint 22 : le lanceur de mission control refuse ce qui le trompe"
scope: "sprint 22 du run autonome, clos le 2026-11-03 (deux derniers bugs de la passe scout du 2026-11-02, hors milestone) ; mode léger : tour 1 et tour 2 portés par l'orchestrateur (round-robin dégradé), sans juge car aucune règle n'est proposée ; carnet inter-sessions hors périmètre (passe dédiée décidée le 2026-10-26)"
participants: [architecture, qualite, dev, produit, po]
actions:
  - proposition: "La gate de livraison lance aussi les tests de mission control (vitest à la racine et tests de la page web) quand la story touche `products/cop1`. Aux sprints 21 et 22, l'agent les a lancés à la main pour chacune des cinq stories ; `pnpm --dir products/mega-city gate` ne les lance pas."
    kind: feature
    by: [qualite, dev]
    status: ⏳
---

**En clair :** le sprint 22 a livré les deux derniers bugs du scout sur le lanceur de mission control.
Un port mal écrit est refusé avant tout lancement. Deux instances lancées du même dossier gardent
chacune son fichier de pid. La revue a dit GO sur les deux. Le compte rendu du sprint est juste, grâce
au nom du point de passage calculé d'avance. Une proposition attend ta décision ; aucune n'a été
appliquée.

## 1 · Les faits de départ

- Deux stories livrées en local : `10a05e52` (port mal écrit) et `e2e6084b` (un pid par port). Une
  seule revue adverse pour les deux, GO sans constat bloquant.
- Pour le pid, le groom a choisi un fichier par port plutôt qu'un refus du second daemon : ton
  `.claude/launch.json` lance volontairement deux instances du même dossier.
- Le lanceur a désormais un test dans la gate, `scripts/test-cop1-dev.sh`. Il échoue sur l'ancien
  lanceur, sur ses 10 cas.
- Le compte rendu dit 16 minutes et 2 fiches livrées : il est juste. Le nom du point de passage a été
  calculé avec la même formule que `sprint.sh`, et noté avant le sprint. C'est la parade manuelle à la
  proposition 1 de la rétro du sprint 21, qui attend ta décision.
- Deux limites connues, notées dans la revue : un daemon lancé par l'ancien code garde `daemon.pid`
  jusqu'à son redémarrage ; le refus du même port par `cop1 start` n'a pas de test dédié.
- Les deux gates ont tourné en même temps, chacune dans son worktree, sans se gêner.
- La gate de la méthode ne lance pas les tests de mission control. L'agent les a lancés à part pour
  chaque story de cop1 : 783 à 798 tests à la racine, 152 tests de la page web.

## 2 · Tour 1 — chaque lentille propose

Le tour 1 est porté par l'orchestrateur, à travers les quatre lentilles : c'est un round-robin
dégradé, sans sous-agent par lentille (mode léger, rétro après chaque sprint par décision du PO).

- **Qualité** : la gate de livraison lance les tests de mission control quand la story y touche (P1).
  Le nom calculé d'avance confirme la proposition 1 du sprint 21.
- **Dev** : P1 ; les deux limites de la revue sont transitoires ou couvertes autrement.
- **Architecture** : rien de neuf.
- **Produit** : la section « correctifs de la passe scout » du plan est soldée.

## 3 · Tour 2 — confrontation et convergence

Porté par l'orchestrateur, comme le tour 1.

- P1 est gardée, en feature : un geste fait à la main cinq fois de suite finit par être oublié.
- Aucune règle n'est proposée.

## 4 · Le juge de cohérence

Sans objet : aucune règle n'est proposée.

## 5 · Les mesures

- P1 : sur les 5 prochaines stories qui touchent `products/cop1`, la gate de livraison rend le
  compte des tests de mission control, sans geste à part.

## 6 · Décisions du PO

En attente. Le run autonome continue sans appliquer cette proposition : elle attend ta décision.
