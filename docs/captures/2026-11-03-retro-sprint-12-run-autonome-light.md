---
type: retro
date: 2026-11-03
theme: "Run autonome, sprint 12 : le scout et mission control tiennent le carnet de tests"
scope: "sprint 12 du run autonome, clos le 2026-11-03 (deux stories du milestone exploration-app) ; mode léger : tour 1 et tour 2 portés par l'orchestrateur (round-robin dégradé), sans juge car aucune règle n'est proposée ; carnet inter-sessions hors périmètre (passe dédiée décidée le 2026-10-26)"
participants: [architecture, qualite, dev, produit, po]
actions:
  - proposition: "Le compte rendu de sprint compare les dates de livraison au bon fuseau horaire. Aujourd'hui il compare comme du texte une date « +01:00 » et une date « Z » : il nomme des fiches d'un autre sprint et oublie celles du lot."
    kind: feature
    by: [qualite, dev]
    status: ⏳
  - proposition: "`ezk carto` sait retirer une note fausse du carnet, avec sa raison, au lieu d'une édition à la main du journal."
    kind: feature
    by: [dev, produit]
    status: ⏳
  - proposition: "Le banc du scout sur mission control lit un dépôt qui a un historique de runs. Une branche neuve n'en a pas : la Chronologie y paraît vide à tort."
    kind: action
    by: [qualite, architecture]
    status: ⏳
---

**En clair :** le sprint 12 a livré le carnet de tests côté scout et côté mission control, avec un GO
de la revue au premier passage. La première passe du scout a monté le carnet de 0 à 19 contrôles sur
70. En relisant le compte rendu du sprint, j'ai trouvé qu'il nomme les mauvaises fiches livrées. Trois
propositions attendent ta décision ; aucune n'a été appliquée.

## 1 · Les faits de départ

- Deux stories livrées en local : le scout part du carnet et y note ses résultats (`979d03da`), et
  mission control tient son carnet (`94d8c82f`). La revue adverse a donné GO aux deux du premier
  coup, avec une retouche de rédaction. La gate est passée verte du premier coup : 2 261 tests.
- La première passe du scout a ouvert les 12 vues et joué 10 actions sans écriture, en 10 minutes.
  Elle a trouvé un défaut mineur : l'en-tête commun s'appelle encore « board v0.17.0 ».
- La même passe a d'abord noté un faux défaut : la Chronologie vide. Le banc lisait la branche du
  sprint, qui n'a pas de dossier de runs. Sur le dépôt principal, le même code trouve 3 chantiers.
  Pour retirer la note fausse, j'ai dû éditer le journal du carnet à la main : aucune commande ne le
  fait.
- Le compte rendu du sprint 12 liste deux fiches livrées, qui viennent des sprints 10 et 11. Celui du
  sprint 11 avait le même défaut, et la rétro du sprint 11 l'avait dit juste : elle n'avait lu que le
  lot scellé, qui est correct. La cause : `products/mega-city/src/sprint-metrics/domain/kpi.ts:14`
  compare comme du texte la date du commit de livraison, écrite en heure locale « +01:00 », aux
  bornes du sprint, écrites en heure universelle « Z ». Une livraison à 00 h 20 heure de Paris passe
  pour être dans la fenêtre ; une livraison à 01 h 44 passe pour en être sortie.
- Le journal des sondes du scout, `sondes.log`, n'est pas parti dans le commit des preuves : le
  `.gitignore` du dépôt ignore les fichiers `.log`. Le rapport du scout porte déjà ses reproductions.

## 2 · Tour 1 — chaque lentille propose

Le tour 1 est porté par l'orchestrateur, à travers les quatre lentilles : c'est un round-robin
dégradé, sans sous-agent par lentille (mode léger, rétro après chaque sprint par décision du PO).

- **Qualité** : corriger la comparaison de dates du compte rendu (P1) ; donner au banc un dépôt avec
  des runs (P3).
- **Dev** : P1 ; une commande pour retirer une note fausse du carnet (P2) ; renommer le journal des
  sondes en `.txt` (P4).
- **Architecture** : P3 ; le banc lit le registre de projets, c'est là qu'il faut choisir le dépôt.
- **Produit** : P2 ; le carnet doit rester juste, sinon la mesure « X sur Y » ment.

## 3 · Tour 2 — confrontation et convergence

Porté par l'orchestrateur, comme le tour 1.

- P1 est gardée : un compte rendu qui nomme les mauvaises fiches trompe toute rétro jouée plus tard
  dans une autre session, et le défaut touche au moins deux sprints.
- P2 est gardée : la seule façon de corriger le carnet est aujourd'hui une édition à la main d'un
  fichier caché.
- P3 est gardée, en action : une consigne dans le guide du scout suffit, sans code.
- P4 est écartée : le rapport du scout porte déjà chaque reproduction, le journal la double.
- Aucune règle n'est proposée.

## 4 · Le juge de cohérence

Sans objet : aucune règle n'est proposée.

## 5 · Les mesures

- P1 : les 3 prochains comptes rendus de sprint listent, comme fiches livrées, exactement les fiches
  du lot scellé.
- P2 : 0 édition à la main du journal du carnet sur les 3 prochaines passes.
- P3 : 0 faux défaut « vue vide » dû au banc sur les 3 prochaines passes du scout sur mission control.

## 6 · Décisions du PO

En attente. Le run autonome continue sans appliquer ces propositions : elles attendent ta décision.
