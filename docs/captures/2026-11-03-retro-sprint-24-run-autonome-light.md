---
type: retro
date: 2026-11-03
theme: "Run autonome, sprint 24 : mission control dit vrai sur les fiches"
scope: "sprint 24 du run autonome, clos le 2026-11-03 (trois bugs de la passe scout du soir, retenus par ezk-pm en mode auto) ; mode léger : tour 1 et tour 2 portés par l'orchestrateur (round-robin dégradé), sans juge car aucune règle n'est proposée ; carnet inter-sessions hors périmètre (passe dédiée décidée le 2026-10-26)"
participants: [architecture, qualite, dev, produit, po]
actions:
  - proposition: "`scripts/cop1-dev.sh` lance mission control avec la méthode de son propre checkout : il pose `INIT_CWD` sur sa racine avant de démarrer le daemon. Au sprint 24, une instance lancée par `pnpm --dir <worktree> cop1:dev` depuis le checkout principal exécutait la méthode de `main`, sans le dire : la capture « après » ne montrait pas le correctif."
    kind: feature
    by: [qualite, dev]
    status: ⏳
---

**En clair :** le sprint 24 a livré trois bugs trouvés par le scout du soir. La vue Fiches montre enfin
les 360 fiches livrées : pour cela, la méthode les publie maintenant dans son contrat. Un pouce de revue
refusé dit sa raison. Une fiche découpée n'apparaît plus en idée. La revue a dit GO sur les trois. Une
proposition attend ta décision ; aucune n'a été appliquée.

## 1 · Les faits de départ

- Trois stories livrées en local : `7774944e` (fiches livrées), `ca99dccf` (raison du pouce),
  `e9756c47` (fiche close). Deux revues adverses, GO sans constat bloquant.
- Ces bugs viennent d'une passe du scout lancée parce que plus rien n'était tirable. `ezk-pm` a retenu
  six brouillons sur sept, en mode auto ; le septième, une écriture dans une config partagée par tous
  tes projets, t'attend.
- La correction des fiches livrées touche le contrat de la méthode : `ezk backlog show --json` publie
  `livrees`. Parité vérifiée : 360 livrées publiées, 360 comptées par le board.
- Deux stories modifiaient le même traducteur. Elles ont été intégrées l'une après l'autre ; le
  conflit du recalage a été résolu en gardant les deux ajouts, et la gate a tourné sur l'ensemble.
- **Le piège** : la capture « après » de la vue Fiches ne montrait rien de neuf. `ezk` délègue à la
  copie de la méthode qui contient le dossier de lancement, qu'il lit dans `INIT_CWD`. L'instance de
  test, lancée depuis le checkout principal, exécutait donc la méthode de `main`. Relancée depuis le
  worktree, elle a montré le correctif.
- Le compte rendu du sprint est juste : 28 minutes, 3 fiches.

## 2 · Tour 1 — chaque lentille propose

Le tour 1 est porté par l'orchestrateur, à travers les quatre lentilles : c'est un round-robin
dégradé, sans sous-agent par lentille (mode léger, rétro après chaque sprint par décision du PO).

- **Qualité** : le lanceur de mission control pose `INIT_CWD` sur son checkout (P1). Un banc de
  preuve qui teste la mauvaise copie sans le dire fabrique de fausses preuves.
- **Dev** : P1 ; le piège a coûté une demi-heure de diagnostic.
- **Architecture** : rien de neuf ; la méthode publie, mission control affiche, comme l'ADR-086 le veut.
- **Produit** : le scout a nourri le run quand le backlog était vide de travail tirable.

## 3 · Tour 2 — confrontation et convergence

Porté par l'orchestrateur, comme le tour 1.

- P1 est gardée, en feature : la délégation d'`ezk` est voulue, c'est le lanceur qui doit dire pour
  quel checkout il travaille.
- Aucune règle n'est proposée.

## 4 · Le juge de cohérence

Sans objet : aucune règle n'est proposée.

## 5 · Les mesures

- P1 : une instance lancée par `pnpm --dir <worktree> cop1:dev`, depuis n'importe quel dossier, sert
  la méthode de ce worktree.

## 6 · Décisions du PO

En attente. Le run autonome continue sans appliquer cette proposition : elle attend ta décision.
