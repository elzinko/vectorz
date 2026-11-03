---
type: retro
date: 2026-11-03
theme: "Run autonome, sprint 11 : la page web de la méthode est retirée, un seul vocabulaire"
scope: "sprint 11 du run autonome, clos le 2026-11-03 (deux stories, dernières du milestone board) ; mode léger : tour 1 et tour 2 portés par l'orchestrateur (round-robin dégradé), sans juge car aucune règle n'est proposée ; carnet inter-sessions hors périmètre (passe dédiée décidée le 2026-10-26)"
participants: [architecture, qualite, dev, produit, po]
actions:
  - proposition: "Le détecteur de commandes fantômes, qui garde déjà la FAQ, lit aussi les scripts de lancement et les scripts de package.json. Une commande ezk qui n'existe plus y fait tomber la gate."
    kind: feature
    by: [qualite, dev]
    status: ⏳
---

**En clair :** le sprint 11 a fermé le milestone « board ». La page web de la méthode est retirée, avec
son serveur et cinq pages, soit 5 800 lignes de moins, et les documents parlent un seul vocabulaire.
La revue a bloqué une fois, à juste titre : un remplacement de mot en masse avait rendu des guides
faux. Une proposition attend la décision du PO ; aucune n'a été appliquée.

## 1 · Les faits de départ

- Deux stories livrées en local : le retrait de la page web (`26e2878a`) et le vocabulaire
  (`6203ec0a`). Le retrait a eu GO du premier coup, avec trois retouches appliquées.
- Le vocabulaire a eu un NO-GO. J'avais remplacé « Moniteur » par « mission control » partout, y
  compris dans cinq guides qui décrivent pas à pas l'ancien écran. Le mot remplacé y rendait des
  phrases fausses, comme « l'onglet mission control ». Le glossaire citait aussi une commande qui
  n'existe pas, `ezk sessions open`. Le décideur produit a choisi de garder ces guides tels quels sous
  un bandeau « Ancien écran, retiré », et de reporter leur réécriture dans une fiche sœur. Après
  correction, GO.
- Le filet a tenu : la revue adverse a arrêté les phrases fausses avant la fusion. Aucune règle de
  plus n'est nécessaire pour ce cas.
- En retirant le serveur, on a trouvé que `pnpm dev:branch` lançait `ezk dashboard`, une commande
  morte depuis son renommage en `ezk board open`. Personne ne l'avait vu : aucun contrôle ne lit les
  scripts de lancement. Le lanceur ouvre désormais mission control.
- Dans un dossier neuf, `vitest` lancé seul a donné 11 faux échecs, faute de graphe compilé ; le
  script `pnpm test` le compile d'abord. C'est la proposition du sprint 7 sur la préparation d'un
  dossier neuf, toujours en attente, pas une nouvelle.
- Le compte rendu du sprint 11 est juste : 2 fiches, 44 minutes.
- La session « Test fonctionnel », que l'application n'avait pas pu archiver, a basculé son dossier
  de travail sur une nouvelle branche pendant le sprint : elle est active. Le run n'y a pas touché.

## 2 · Tour 1 — chaque lentille propose

Le tour 1 est porté par l'orchestrateur, à travers les quatre lentilles : c'est un round-robin
dégradé, sans sous-agent par lentille (mode léger, rétro après chaque sprint par décision du PO).

- **Qualité** : faire lire les scripts de lancement au détecteur de commandes fantômes (P1).
- **Dev** : P1 ; une règle « un remplacement de vocabulaire ne touche pas un document qui décrit un
  état passé » (P2).
- **Architecture** : rien de neuf ; la méthode ne garde plus qu'une vue générée, la carte.
- **Produit** : le milestone « board » est fini ; la fiche sœur des guides reste à tirer.

## 3 · Tour 2 — confrontation et convergence

Porté par l'orchestrateur, comme le tour 1.

- P1 est gardée : une commande morte a dormi dans un script de lancement sans qu'aucun contrôle ne la
  voie, alors que le détecteur existe déjà pour la FAQ.
- P2 est écartée : la revue adverse, plancher de toute fusion, a fait ce travail. Une règle de plus
  doublerait un filet qui a tenu.
- Aucune règle n'est proposée.

## 4 · Le juge de cohérence

Sans objet : aucune règle n'est proposée.

## 5 · Les mesures

- P1 : un script de lancement qui cite une commande ezk inexistante fait tomber la gate, avec le nom
  du fichier et de la commande.

## 6 · Décisions du PO

En attente. Le run autonome continue sans appliquer cette proposition : elle attend ta décision.
