---
id: "20261102123552185"
title: "La méthode n'a plus de page web : retirer `ezk board open` quand mission control montre tout"
type: refactor
priority: P2
product: mega-city
milestone: board
version:
depends: ["20261102123552181", "20261102151630248", "20261102123552182", "20261102123552183", "20261102123552184", "20260826222044335"]
labels: [board, un-seul-ecran]
status: ready
pr:
evidence: none # retrait d'une page ; les écrans de remplacement ont leurs captures dans leurs fiches
created: 2026-11-02
---

## En clair

La méthode a encore sa propre page web, ouverte par `ezk board open`. Le PO a décidé que mission
control serait le seul écran, et que la méthode garderait seulement sa ligne de commande. Cette fiche
retire la page web et son serveur, une fois que mission control montre tout ce qu'elle montrait.
C'est la dernière fiche du chantier.

## Contexte / Problème

- L'[amendement du 2026-11-02 de l'ADR-086](../docs/adr/ADR-086-la-methode-seul-lecteur-des-fiches-contrat-json.md)
  le décide : la méthode garde `ezk board show`, `ezk board check` et ses commandes `--json` ;
  mission control est le seul écran.
- Deux écrans montrent aujourd'hui une partie des mêmes choses, chacun à sa façon. Le PO a jugé la
  page de la méthode peu lisible le 2026-11-01, et lui préfère mission control.
- La page web vit dans `bin/ezk-map.ts`, un serveur sans dépendance. Elle sert douze cartes de
  `diagrams/`, un choix du projet, la config et le pouce de revue.

## Valeur

- Un seul écran à apprendre, à tenir à jour et à tester.
- La méthode devient plus petite : une ligne de commande et des contrats, sans interface à maintenir.

## Proposition

Attendre que toutes les fiches de portage soient livrées, puis retirer en une fois :

1. la commande `ezk board open`, son serveur `bin/ezk-map.ts` et le raccourci `pnpm ezk:map` ;
2. les cinq pages interactives devenues inutiles : avancement, pilotage, runs, process et la carte
   de la loi. Partent avec elles les générateurs de `ezk views regen` qui ne servent plus qu'à ces
   pages ; un générateur qu'une commande utilise encore reste ;
3. les mentions de `ezk board open` et de `ezk:map` dans les skills, les agents et la documentation.

Les sept documents de `diagrams/` restent : mission control les montre.

## Critères d'acceptation

- [ ] **La commande est retirée.** `ezk help board` ne liste plus que `show` et `check` ;
      `bin/ezk-map.ts` n'existe plus.
- [ ] **Les pages inutiles sont retirées.** Les cinq pages interactives ne sont plus dans
      `diagrams/` ; les sept documents y sont toujours.
- [ ] **Plus de mention vivante.** `ezk board open`, `ezk:map` et `ezk-map` n'apparaissent plus dans
      les skills, les agents ni la documentation, hors historique : ADR, captures et fiches livrées.
- [ ] **Rien n'est perdu.** Chaque ligne du tableau de l'amendement est vérifiée : ce que montrait la
      page retirée se lit dans la vue de mission control indiquée.
- [ ] **La gate passe.** Les tests de la méthode passent. La fiche du serveur de test orphelin est
      close « superseded », car ce serveur n'existe plus.

## Comment vérifier

```bash
ezk help board
ls diagrams
grep -rn "ezk board open\|ezk:map" products/mega-city/skills products/mega-city/agents products/mega-city/docs --include=*.md
```

Signal observable : la commande n'est plus listée, les sept documents restent, et la recherche ne
trouve plus de mention hors historique.

## Notes

- Dernière fiche du chantier « un seul écran ». Les fiches du chantier sont liées par
  `milestone: board` et le label `un-seul-ecran`, sans fiche chapeau. Elle dépend de toutes les
  fiches de portage, dont les deux du pouce, et de la
  [vue « Loi » de mission control](20260826222044335_carte-la-loi-graphe-visuel.md).
- Rend sans objet [le serveur de test ezk-map orphelin](20261101131506169_serveur-de-test-ezk-map-orphelin.md).
  Tant que la page existe, cette fiche reste utile.
- La fiche [un seul vocabulaire pour les boards](20261031160441559_un-seul-vocabulaire-boards.md)
  corrige les mots ; celle-ci retire la commande.
- Un projet hôte sans mission control garde le terminal : `ezk board show` et les commandes `--json`.
- Priorité P2, fixée par le PO le 2026-11-02 pour tout le chantier.
- Groom du 2026-11-03 (run autonome) : périmètre mesuré dans le code. Les vues générées sont cinq :
  `board`, `pilotage`, `runs`, `process` et `carte`. Seule `carte` reste, car `ezk board maps --file`
  en calcule les données. Partent avec les quatre autres leurs constructeurs de bloc
  (`build…DataBlock`), et les modules qui ne servent qu'à eux ; un module qu'une commande utilise
  encore reste (`buildProcessData` pour `ezk board process`, `buildAvancementData` pour
  `ezk board show`). La route du pouce de `bin/ezk-map.ts` (`src/io/verdict-endpoint.ts`) part aussi :
  `ezk review verdict` la remplace, et son test compare désormais le fichier écrit à la forme attendue,
  plus à la route. Mentions vivantes trouvées : 16 fichiers de `src`, 5 de `bin`, un skill, un guide,
  les deux `package.json`, le manifeste et une recette.
- Le tableau de l'amendement est couvert par les fiches livrées des sprints 8 à 10 : pouce, pilotage,
  process, cartes et loi.- Prête le 2026-11-03 : porte « prête » passée en run autonome (ezk-pm GO, taille limite). Deux commits
  ordonnés dans la branche : le code et les pages, puis les mentions. Le corps de PR reprend une ligne
  par entrée du tableau de l'amendement.
