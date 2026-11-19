---
id: "20261117223348335"
title: "Rattacher les règles du projet aux étapes du process"
type: feature
priority: P2
product: mega-city
milestone: board
version:
labels: [loi, contrat, theme:mission-control]
status: idea
blocked:
pr:
evidence: none # une donnée publiée par une commande ; l'écran qui l'affiche relève de la fiche Process
created: 2026-11-17
---

# 20261117223348335 — Rattacher les règles du projet aux étapes du process

**En clair.** Quand le PO clique une étape du process, il veut voir les règles qui la gouvernent.
Aujourd'hui, la méthode ne relie aucune règle à une étape : la rubrique « Règles » est vide partout.
La méthode publiera, pour chaque étape, les règles qui s'y appliquent et d'où vient ce lien.

**Si tu arrives frais.** Une *règle* est un fichier du catalogue de la méthode (`rules/`) ou de la
couche d'un projet (`.vectorz/rules/`). Un skill déclare déjà les règles qu'il applique dans son
champ `applies:` ; un agent, dans `interactions:`. `ezk process show --json` publie les étapes de
chaque skill, avec un champ `regles` qui reste vide pour l'instant.

## Contexte / Problème

Le contrat `process-show` le dit lui-même : « Toujours vide en v1 : aucune règle n'est encore
rattachée à une étape » (`products/mega-city/src/core/process-show.ts`). La maquette choisie par le
PO le 17 novembre montre des règles dans le panneau d'une étape, mais ce sont des **exemples**.

Le lien existe déjà à un étage plus haut. Le skill `ezk-sprint` applique sept règles par son champ
`applies:`, mais on ne sait pas laquelle vaut pour « Gate » et laquelle pour « Intégration ». Et
les règles propres au projet ne portent aucun lien vers une étape.

## Proposition

Deux sources, publiées ensemble dans `regles` :

1. **Par héritage** : une étape reçoit les règles des skills et des agents qui la jouent
   (`joue_par` dans `method/etapes.yml`). Rien à déclarer de plus.
2. **Par rattachement direct** : `etapes.yml` peut nommer une règle sur une étape précise. Le
   compilateur refuse une règle absente du catalogue ou de la couche du projet.

Chaque règle publiée dit sa provenance : héritée de tel skill, ou rattachée à l'étape. Le champ
`regles` passe de liste de textes à liste d'objets ; le contrat change de version.

À trancher au grooming :

- Une règle du projet se rattache-t-elle dans `etapes.yml` (méthode) ou dans sa propre fiche
  `.vectorz/rules/<id>.md` (projet) ? La seconde garde le projet maître de sa couche.
- L'héritage par skill noie-t-il le panneau ? `ezk-sprint` en donnerait sept à chacune de ses huit
  étapes. Le rattachement direct pourrait alors primer, l'héritage passant en second plan.

## Critères d'acceptation

- [ ] `ezk process show --json` publie, pour chaque étape, ses règles avec leur id, leur niveau
      (MUST, SHOULD, MAY) et leur provenance.
- [ ] Une règle rattachée à une étape inconnue, ou une étape qui cite une règle inexistante, fait
      échouer `ezk process show`. La gate rougit.
- [ ] Une règle du projet lu (`--root`) apparaît sur l'étape où elle est rattachée.
- [ ] Le contrat `process-show` décrit le nouveau champ, et son exemple est régénéré.

## Comment vérifier

```bash
pnpm --dir products/mega-city test -- process-show
ezk --root . process show --json | jq '.skills[] | .etapes[] | {id, regles}'
pnpm --dir products/mega-city board:contract --write && git diff --stat contracts/
```

## Notes / décisions

- Née de la décision PO du 2026-11-17 sur l'écran Process (maquette B + panneau). L'écran est la
  fiche [L'écran Process se lit de gauche à droite](done/20261117223348250_ecran-process-en-ligne-avec-ses-boucles.md),
  qui se livre sans celle-ci.
- Voisines, sans doublon : [`ezk law show` sert chaque objet de la loi](20261114131615350_ezk-law-show-regle-paquet-profil.md)
  publie une règle seule ; [Un seul lecteur de la loi du projet](20261114131615534_un-seul-lecteur-de-la-loi-du-projet.md)
  unifie la lecture des règles du projet. Cette fiche-ci relie une règle à une étape.
- Taille : une surface, la commande publiée. Quatre critères.
