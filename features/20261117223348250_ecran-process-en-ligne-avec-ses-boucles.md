---
id: "20261117223348250"
title: "L'écran Process se lit de gauche à droite, avec ses boucles, et une étape s'ouvre dans un panneau"
type: feature
priority: P1
product: cop1
milestone: board
version:
labels: [theme:mission-control]
status: idea
blocked:
pr:
evidence: before-after
created: 2026-11-17
---

# 20261117223348250 — L'écran Process se lit de gauche à droite, avec ses boucles

**En clair.** Le PO trouve la carte actuelle du process déroutante : c'est un graphe, on s'y perd.
Il veut un diagramme d'activité simple, qui se lit de gauche à droite comme les schémas Scrum
connus : Backlog, puis Sprint, puis Rétro, avec les boucles de retour dessinées. Un clic zoome sur
une phase, un clic sur une étape ouvre son détail dans un panneau à droite.

**Si tu arrives frais.** *Mission control* est l'écran web de pilotage, dans le produit cop1
(`products/cop1/packages/web`). Il n'affiche que ce que la méthode publie par
`ezk process show --json` ([ADR-086](../docs/adr/ADR-086-la-methode-seul-lecteur-des-fiches-contrat-json.md)).
Une *étape* est un pas à l'intérieur d'un skill, par exemple « Gate » dans le sprint.

## Contexte / Problème

Le 17 novembre, le PO a regardé la page Process et la Carte de la méthode. Son retour : « la carte
de la méthode c'est un peu bizarre en graphe ». Il veut voir le **séquencement dans le temps**, de
gauche à droite, puis zoomer sur chaque étape pour voir ce qu'elle mobilise.

Trois maquettes ont été comparées. Le PO a choisi la **maquette B** (boucles imbriquées) avec le
**détail en panneau à droite** :
https://claude.ai/artifact/5VQH4am9Dp66Bp4u4vAzXB

Deux écarts entre la maquette et les données publiées aujourd'hui :

- **Les boucles internes ne sont pas publiées.** `liens[]` ne relie que des skills entre eux
  (backlog → sprint → rétro → backlog). Les boucles « gate rouge → code », « revue NO-GO → code »,
  « story suivante » et « sprint suivant » ne sortent nulle part. La maquette les dessine en dur.
- **L'archive est publiée comme une étape du flux** (lien sprint → archive). Le PO a tranché :
  l'archive est un **outil**, pas une étape du process.

## Proposition

1. **Côté méthode** : `method/etapes.yml` déclare les boucles entre étapes et marque l'archive comme
   outil. `ezk process show --json` les publie, et le contrat `process-show` les décrit. Le
   compilateur refuse une boucle qui vise une étape inconnue.
2. **Côté écran** : la page Process reprend la maquette B. Une surface à caméra (déplacement et
   zoom animés), trois niveaux : vue d'ensemble, phase, étape. Le détail d'une étape s'ouvre dans un
   panneau à droite.

Le dessin suit les données : une boucle ajoutée dans `etapes.yml` apparaît à l'écran sans toucher
au code de la page.

## Critères d'acceptation

- [ ] De loin, la page montre trois phases de gauche à droite, Backlog, Sprint et Rétro, avec leurs
      étapes numérotées. Toutes les étapes viennent de `ezk process show --json`.
- [ ] Les boucles sont dessinées et nommées : rétro → backlog, gate rouge → code, revue NO-GO →
      code, story suivante, sprint suivant. Elles viennent des données publiées, pas du code de la page.
- [ ] Un clic sur une phase zoome dessus. Un clic sur une étape ouvre le panneau à droite. Un fil
      d'Ariane, la touche Échap et les boutons précédent / suivant permettent de revenir et d'avancer.
- [ ] Le panneau montre les commandes, les agents, les règles du projet et les réglages du projet de
      l'étape. Une rubrique vide le dit (« aucune règle rattachée ») : l'écran n'invente aucun exemple.
- [ ] L'archive apparaît dans une boîte à outils, hors du flux. Aucune flèche du process n'y mène.
- [ ] Sous 700 px de large, le panneau devient un tiroir en bas d'écran. La page ne défile pas à
      l'horizontale.

## Comment vérifier

```bash
pnpm --dir products/mega-city test -- process-show
ezk --root . process show --json | jq '.liens, [.skills[] | {id, outil}]'
pnpm --dir products/cop1/packages/web test -- ProcessView
pnpm cop1:dev   # puis http://localhost:5273, page Process
```

À l'écran : capture avant (graphe actuel) et après (maquette B), puis un clic sur « Revue adverse »
qui ouvre le panneau. Rejouer à 375 px de large pour le tiroir.

## Glossaire

- `maquette B` — la variante « boucles imbriquées » de la maquette du 17 novembre : la ligne des
  trois phases, plus les boucles de retour dessinées au-dessus et au-dessous des étapes.

## Notes / décisions

- Décision PO du 2026-11-17 : maquette B, panneau à droite, archive hors du flux. La version du
  board peut rester en retard sur la dernière maquette de mission control : le PO l'accepte.
- Les règles du panneau restent vides tant que la fiche
  [Rattacher les règles du projet aux étapes du process](20261117223348335_regles-du-projet-rattachees-aux-etapes.md)
  n'est pas livrée. Cette fiche-ci se livre sans elle.
- À trancher au grooming : la Carte de la méthode (page Cartes) reste-t-elle à côté, ou la page
  Process la remplace-t-elle ? Question déjà ouverte depuis le run du 17 novembre.
- Remplace le dessin livré par la fiche
  [Schéma Process zoomable](done/20261110185357446_schema-process-zoomable-semantic-zoom.md)
  (React Flow, zoom à la molette). Code concerné : `ProcessView.tsx`, `ProcessMap.tsx`,
  `processProjection.ts` dans `products/cop1/packages/web/src/board/`.
- Taille : deux surfaces, la commande publiée et l'écran. Six critères. Elle tient dans un sprint.
