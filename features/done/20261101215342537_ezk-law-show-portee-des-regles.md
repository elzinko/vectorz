---
id: "20261101215342537"
title: "La méthode publie sa loi en JSON : chaque règle, qui l'applique, et si elle est vraiment lue"
type: feature
priority: P2
product: mega-city
milestone: board
version:
labels: [loi, contrat, json, mission-control]
status: shipped
pr: "local (0961c355)"
evidence: none # une commande en lecture seule, sans écran
created: 2026-11-01
---

## En clair

Aujourd'hui, personne ne voit d'un coup d'œil quelles règles de la méthode sont vraiment lues par tes
sessions. La méthode a tous les faits, mais éparpillés dans trois sorties texte. Cette fiche ajoute
la commande `ezk law show`. Pour chaque règle, elle dit où la règle est rangée, quel skill ou agent
l'applique, et si elle est installée sur ton poste. Avec `--json`, c'est la source de la carte de la
loi dans mission control.

## Contexte / Problème

Le 2026-11-01, la règle « une story se construit dans un worktree dédié » est sortie d'une rétro. Son
id était cité par le skill de sprint, et pourtant aucune session ne lisait son texte. Personne ne
l'a vu avant de chercher à la main.

Mesure faite à la main le même jour, sur le catalogue compilé et les fichiers de loi installés :

| Portée | Règles | Ce que ça veut dire |
|---|---|---|
| lue partout | 10 | dans `~/.claude/rules/iamthelaw.md` : chargée par toutes tes sessions |
| lue dans ce projet seulement | 0 | dans `.iamthelaw/ENTRY.md` de vectorz, pas dans la loi globale |
| citée sans être installée | 17 | un skill ou un agent la nomme, mais elle n'est dans aucune loi installée |
| rangée sans effet | 50 | dans un bundle, mais aucun profil installé ne la porte, et personne ne la cite |
| orpheline | 19 | dans aucun bundle |
| **total** | **96** | |

Les pièces existent, mais pas assemblées :

- `ezk graph project` liste, en texte, chaque skill et agent avec les règles qu'il applique.
- `ezk law status <profil>` dit ce qui est installé, profil par profil.
- `.ezk/graph.compiled.json` contient le graphe, mais c'est un fichier de travail : non suivi par
  git, sans numéro de format, et périmé dès qu'une règle bouge.

Décision amont : [ADR-086](../../docs/adr/ADR-086-la-methode-seul-lecteur-des-fiches-contrat-json.md).
La méthode est le seul programme qui interprète ses fichiers, et elle publie le résultat par
`ezk … --json`.

## Valeur

- Le PO voit, sans chercher, les règles écrites mais lues par personne. Il décide alors de les
  installer, de les citer dans un skill, ou de les retirer.
- Mission control peut afficher la loi sans recopier la méthode, comme il le fait pour le board
  depuis le 2026-11-01.

## Proposition

Une commande en lecture seule, `ezk law show [--json]`, qui marche aussi sur un projet hôte avec
`--root`.

**Une entrée par règle** : id, titre, niveau (MUST, SHOULD, MAY), catégorie, fichier, bundles,
profils, qui l'applique (skill ou agent, en direct ou par un bundle), qui la vérifie, et sa portée.

**La portée vient des fichiers installés, pas d'une déduction.** Une règle installée figure en titre
`## <id>` dans le fichier de loi. On lit donc :

- `~/.claude/rules/iamthelaw.md`, au même chemin que `ezk law bind-global` ;
- `.iamthelaw/ENTRY.md` du projet visé.

Puis on classe chaque règle dans une seule portée, dans cet ordre : `partout`, `projet`, `citee`,
`rangee`, `orpheline`. Un fichier de loi absent est dit (« loi globale non installée »). Il n'est
jamais compté comme zéro règle.

**Une entrée par objet du modèle qui porte des règles** : skill, agent, bundle, profil. Chaque objet
a un champ `regles`, la liste des ids de règles qui s'y attachent, avec le lien qui les attache :
`applies` pour un skill, `interactions` pour un agent, ses règles pour un bundle, ses bundles pour un
profil. Un programme récupère ainsi les règles d'un objet sans lire de Markdown.

**Le schéma publié joue le rôle d'une DTD.** `contracts/law-show/v1/schema.json` déclare chaque type
d'objet et son champ `regles`, comme une DTD déclare les éléments d'un XML, ou un schéma OpenAPI les
objets d'une API. Il reprend le modèle typé de la méthode (`src/core/graph.ts`, ADR-0040), qui
déclare déjà ces liens.

**En texte** : une ouverture « En clair » avec les cinq comptes, puis la liste des règles citées sans
être installées. C'est la liste sur laquelle le PO peut agir.

**En JSON** : un contrat versionné, rangé comme celui du board dans
`products/mega-city/contracts/law-show/v1/` (schéma et exemple), et gardé à jour par un test.

On réutilise `products/mega-city/src/core/loi-view.ts` et la projection d'`ezk graph project`. On
calcule depuis le catalogue courant, jamais depuis un `.ezk/graph.compiled.json` périmé.

## Critères d'acceptation

- [x] **Texte.** `ezk law show` ouvre par « En clair » avec les cinq comptes, qui somment au total des
      règles, puis liste les règles citées sans être installées, chacune avec qui la cite.
- [x] **JSON.** `ezk law show --json` sort `schema_version: 1`, une entrée par règle, une par objet
      (skill, agent, bundle, profil) avec son champ `regles`, et les comptes. Le schéma déclare ce
      champ pour chaque type d'objet. Le schéma et l'exemple sont dans `contracts/law-show/v1/`, et un
      test échoue s'ils ne correspondent plus à la sortie.
- [x] **Portée vraie.** Sur un jeu de test (catalogue et fichiers de loi factices), chaque règle tombe
      dans la bonne portée, les cinq portées sont couvertes, et un fichier de loi absent est signalé
      au lieu de compter zéro.
- [x] **Jamais périmé.** Une règle ajoutée au catalogue apparaît dans la sortie sans relancer
      `ezk graph compile`.
- [x] **Projet hôte.** `ezk --root <projet> law show --json` lit la loi de ce projet-là.

## Comment vérifier

```bash
ezk law show
ezk law show --json | jq '.comptes'
ezk law show --json | jq '.objets[] | select(.id == "skill:ezk-sprint") | .regles'
ezk --root /Users/elzinko/git/bacasable/muti law show --json | jq '.comptes'
```

Signal observable : la première commande cite `development/story-dans-un-worktree-dedie` parmi les
règles citées sans être installées, avec `ezk-sprint` comme source. Les comptes somment à 96, ou au
nombre de règles du catalogue au jour du build.

## Notes

- Fiche sœur de [Mission control montre la loi](20260826222044335_carte-la-loi-graphe-visuel.md), qui
  consomme ce contrat. Découpage du 2026-11-01, sans fiche chapeau, lié par `milestone: board`, sur
  le modèle de l'ADR-086.
- Limite assumée : une règle `citee` peut quand même être lue, si un skill recopie son texte dans son
  corps. C'est le cas de la règle du worktree dédié depuis le 2026-11-01. Le graphe ne voit que
  l'id cité, pas le texte : la portée dit « citée », jamais « lue par personne ».
- Hors de cette fiche : les règles de la couche projet (`.vectorz/rules/`, ADR-0050), les outils
  qu'utilise chaque skill, et le sort du board de la méthode (port 4173).
- Priorité P2, reprise de la fiche sœur. Milestone `board` : la suite du chantier mission control.
