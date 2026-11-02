---
id: "20260826222044335"
title: "Mission control montre la loi : les règles de chaque skill, et celles que personne ne lit"
type: feature
priority: P2
product: cop1
version:
milestone: board
depends: ["20261101215342537"]
labels: [carte, loi, mission-control]
status: idea
pr:
evidence: before-after
created: 2026-08-27
---

## En clair

Tu veux voir d'un coup d'œil quelles règles s'appliquent à chaque skill et à chaque agent, et
lesquelles ne servent à rien. Aujourd'hui, seule la carte « LA LOI » du board de la méthode en
montre une partie, en colonnes et en listes, sans dire si une règle est installée. Cette fiche ajoute
une vue « Loi » dans mission control. Elle lit la loi par `ezk law show --json`, dit pour chaque règle
si elle est lue, et trace les liens de ce que tu sélectionnes.

## Contexte / Problème

- Le 2026-08-27, à la relecture de la carte « LA LOI » (PR #179), le PO notait : « on ne voit pas
  les liens entre les bundles et les règles ». La carte les donne en listes, au clic.
- Le 2026-11-01, le PO a demandé à visualiser l'ensemble du process avec les règles de chaque skill.
  Le même jour, il a jugé le board de la méthode (port 4173) peu lisible, et préféré mission control
  comme écran. Mission control lit déjà le board par `ezk` depuis le
  [branchement du 2026-11-01](done/20261031160441412_mission-control-consomme-ezk.md).
- La carte actuelle ne dit pas la chose qui compte : si la règle est lue. Le même jour, une règle
  citée par le skill de sprint n'était lue par aucune session, et rien ne le montrait. La mesure
  de la fiche sœur : sur 96 règles, 10 lues partout, 17 citées sans être installées, 50 rangées
  sans effet, 19 orphelines.

## Valeur

- Le PO voit, sans chercher, les règles écrites mais sans effet, et décide quoi en faire.
- Pour un skill, il voit d'un coup les règles qu'il applique, au lieu d'ouvrir son fichier.
- C'est la première vue propre au board de la méthode qui passe dans mission control. Si elle tient,
  le board de la méthode a une raison de moins d'exister.

## Proposition

Une vue « Loi », dans la partie « Méthode » de la navigation de mission control, à côté de
« Process ».

1. **Les comptes en tête.** Cinq compteurs, dits en mots : lues partout, lues dans ce projet, citées
   sans être installées, rangées sans effet, orphelines. Cliquer un compteur filtre la liste.
2. **Deux colonnes reliées.** À gauche, les skills et les agents. À droite, les règles.
   - Sélectionner un skill met ses règles en avant et trace un trait vers chacune.
   - Sélectionner une règle met en avant les skills et agents qui l'appliquent, ses bundles et ses
     profils.
   - Les traits ne sont dessinés que pour la sélection : 96 règles reliées d'un coup feraient un plat
     de spaghettis.
3. **Le détail d'une règle** : niveau, portée en une phrase (« lue dans toutes tes sessions »,
   « citée par ezk-sprint, absente de la loi installée »), bundles, profils, qui l'applique, qui la
   vérifie, fichier source.

Côté serveur, même schéma que le plan : une source qui garde la dernière réponse
d'`ezk law show --json` par projet et la rafraîchit en arrière-plan, servie sur `/api/law`. La loi
bouge rarement : un rafraîchissement toutes les cinq minutes suffit.

## Critères d'acceptation

- [ ] **Mêmes comptes.** Les cinq compteurs valent `ezk law show --json | jq .comptes` pour le projet
      affiché.
- [ ] **Sélection reliée.** Sélectionner un skill met en avant ses règles et trace les traits vers
      elles ; sélectionner une règle met en avant ses consommateurs, ses bundles et ses profils.
- [ ] **Portée en mots.** Chaque règle dit sa portée par une phrase, jamais par un code. La règle
      `development/story-dans-un-worktree-dedie` se lit « citée par ezk-sprint, absente de la loi
      installée ».
- [ ] **Jamais de faux chiffre.** Sans `ezk`, ou avec un format inconnu : « loi indisponible : <raison> »,
      jamais de compteurs à zéro.
- [ ] **Jamais d'attente.** `/api/law` répond en moins de 100 ms pendant qu'un appel à `ezk` tourne.
- [ ] **Avant / après.** Capture de la carte « LA LOI » du board de la méthode (avant) et de la vue
      « Loi » de mission control (après).

## Comment vérifier

```bash
ezk law show --json | jq '.comptes'
pnpm cop1:dev
```

Ouvrir http://localhost:5273, puis « Méthode » et « Loi ». Signal observable : les cinq compteurs
valent ceux du JSON. Sélectionner `ezk-sprint` trace un trait vers ses règles, dont celle du worktree
dédié.

## Notes

- Dépend de [La méthode publie sa loi en JSON](done/20261101215342537_ezk-law-show-portee-des-regles.md),
  qui fournit le contrat. Découpage du 2026-11-01, sans fiche chapeau, lié par `milestone: board`.
- Réécrite le 2026-11-01. Avant, elle visait à dessiner les traits dans la carte « LA LOI » du board
  de la méthode, et elle était parkée. Le PO a choisi mission control comme écran : la fiche change
  de produit (`mega-city` → `cop1`) et sort du parking. Suite de la
  [carte qui montre la loi](done/20260821172716537_carte-ne-montre-pas-la-loi.md) (PR #179) et
  d'[ADR-0041](../products/mega-city/docs/adr/0041-carte-la-loi-lecteur-runtime-graphe-compile.md).
- **Taille.** Six critères, deux surfaces : le serveur de cop1 et la page. La fiche reste entière.
- Hors de cette fiche : les outils qu'utilise chaque skill, et le retrait du board de la méthode.
  Ce retrait amende l'ADR-086 : c'est au PO de le trancher, une fois cette vue en service.
- Priorité P2, inchangée.
- 2026-11-02 : cette vue est l'une des pages à porter avant [le retrait de la page web de la
  méthode](20261102123552185_retirer-la-page-web-de-la-methode.md), décidé par [l'amendement de l'ADR-086](../docs/adr/ADR-086-la-methode-seul-lecteur-des-fiches-contrat-json.md).
