---
type: retro
date: 2026-11-03
theme: "Run autonome, sprint 10 : les cartes et la loi de la méthode dans mission control"
scope: "sprint 10 du run autonome, clos le 2026-11-03 (deux stories, milestone board) ; mode léger : tour 1 et tour 2 portés par l'orchestrateur (round-robin dégradé), sans juge car aucune règle n'est proposée ; carnet inter-sessions hors périmètre (passe dédiée décidée le 2026-10-26)"
participants: [architecture, qualite, dev, produit, po]
actions:
  - proposition: "Chaque commande ezk refuse une option qu'elle ne connaît pas, avec un code d'erreur, au lieu de l'ignorer et de faire autre chose en silence."
    kind: feature
    by: [qualite, dev]
    status: ⏳
  - proposition: "Une branche de story intégrée sur main disparaît quand son dossier de travail est retiré, dès qu'elle est identique à son commit d'intégration. Aucune branche morte ne reste ralentir les vues qui examinent chaque branche."
    kind: feature
    by: [dev, architecture]
    status: ⏳
---

**En clair :** le sprint 10 a livré en local deux vues de mission control : les cartes de la méthode et
la loi. La revue a dit GO aux deux, et ses trois remarques ont été appliquées avant la livraison. Deux
accrocs d'outillage reviennent : une commande qui accepte en silence une option inconnue, et des
branches déjà intégrées qui ralentissent la gate jusqu'à la faire tomber. Deux propositions attendent
la décision du PO ; aucune n'a été appliquée.

## 1 · Les faits de départ

- Deux stories livrées en local : les cartes (`977774be`) et la loi (`e1ad0479`). Une seule revue
  adverse pour les deux patchs : GO et GO.
- La fiche « cartes » décrivait une option `--data`, choisie au groom ; le build l'a remplacée par
  `--file <id> <nom>` sans mettre la fiche à jour. Pire, `ezk board maps --data …` affichait la liste
  avec le code 0 : l'option inconnue était ignorée en silence. La revue l'a vu. La fiche est corrigée,
  et la commande refuse désormais une option inconnue (code 2).
- La gate des cartes est tombée deux fois sur le même fichier de tests, cette fois sans autre suite en
  parallèle : 21 secondes au lieu de 4. Quatre branches de sprint déjà intégrées restaient en local,
  tenues par leurs dossiers de travail au moment de l'intégration. Chacune était identique à son commit
  d'intégration, vérifié fichier par fichier. Supprimées, la gate est repassée verte : 2420 tests et 47
  suites de scripts.
- La méthode ne les avait pas supprimées : à l'intégration, elle laisse une branche tenue par un
  dossier de travail. Et une fois que main a évolué, son contrôle strict ne la juge plus absorbée.
- Le compte rendu du sprint 10 est juste : 2 fiches, 30 minutes.
- Dans un dossier neuf, la page « LA LOI » de la méthode était vide faute de graphe compilé. La vue
  « Loi » de mission control, elle, lit `ezk law show --json` et n'en dépend pas.

## 2 · Tour 1 — chaque lentille propose

Le tour 1 est porté par l'orchestrateur, à travers les quatre lentilles : c'est un round-robin
dégradé, sans sous-agent par lentille (mode léger, rétro après chaque sprint par décision du PO).

- **Qualité** : chaque commande ezk refuse une option inconnue (P1).
- **Dev** : P1 ; supprimer la branche intégrée quand son dossier de travail part (P2).
- **Architecture** : P2, car la vue « board » et la vue « process » examinent chaque branche locale ;
  une branche morte coûte à chaque lecture.
- **Produit** : rien de neuf ; les deux vues ferment le tableau de l'amendement de l'ADR-086, sauf le
  retrait de la page lui-même.

## 3 · Tour 2 — confrontation et convergence

Porté par l'orchestrateur, comme le tour 1.

- P1 est gardée : un succès muet sur une option inconnue a laissé une fiche décrire une commande qui
  ne marchait pas. La correction faite pour `board maps` n'en couvre qu'une.
- P2 est gardée, et rejoint la proposition du sprint 9 sur les délais des tests : P2 retire une cause,
  la proposition du sprint 9 rend la gate robuste à toutes.
- « Mettre la fiche à jour quand le build change l'interface » est écarté : c'est déjà la règle de
  l'ADR-0029 (la fiche est le document), et la revue l'a fait respecter.
- Aucune règle n'est proposée.

## 4 · Le juge de cohérence

Sans objet : aucune règle n'est proposée.

## 5 · Les mesures

- P1 : chaque commande du manifeste, lancée avec une option inconnue, sort avec un code d'erreur et
  n'écrit rien sur sa sortie standard.
- P2 : après la clôture d'un sprint, aucune branche locale identique à son commit d'intégration ne
  reste.

## 6 · Décisions du PO

En attente. Le run autonome continue sans appliquer ces propositions : elles attendent ta décision.
