---
id: 0101
title: Câbler check-links.sh — un contrôle que personne ne lance ne protège de rien
type: chore
priority: P2
product: mega-city
epic:
status: todo
ready:
pr:
created: 2026-07-26
---

## Contexte / Problème

Le 2026-07-26, un contrôle systématique des liens markdown relatifs du backlog et des
ADR a trouvé **45 liens cassés**, dont certains depuis le 2026-07-22. Deux causes, toutes
deux mécaniques :

1. **profondeur relative fausse** (14) — un `../docs/…` recopié d'un dossier vers un
   sous-dossier descend d'un niveau de trop ;
2. **cible déplacée par `ezk-backlog ship`** (25) — le fichier descend dans `done/`,
   aucun lien entrant ne suit. Dans les deux sens : la fiche livrée casse les liens qui
   la visaient, ET ses propres liens vers des sœurs restées actives.

Les 45 sont réparés et `products/mega-city/bin/check-links.sh` (+ `test-check-links.sh`,
9 cas durcis par sabotage) prouve mécaniquement l'état vert. **Mais rien ne l'appelle** :
ni la CI, ni `ezk-backlog ship`. En l'état, la cause n° 2 re-produira des liens cassés
au prochain ship et personne ne le verra — exactement le motif de 0095 (« un contrat
qui ne rougit pas n'est pas un contrat »).

## Proposition

Câbler l'appel. Deux emplacements, non exclusifs, à arbitrer :

- **CI** (`.github/workflows/ci.yml`) — attrape tout, y compris les liens ajoutés par une
  PR qui ne passe pas par `ship`. Deux invocations (mega-city + racine vectorz, cette
  dernière avec ses dossiers en plus). Coût : ~1 s, aucun runner supplémentaire.
- **`ezk-backlog ship`** — attrape au moment exact où ça casse, et peut proposer la
  correction dans la foulée puisqu'il connaît l'ancien et le nouveau chemin. Ne couvre
  pas les autres cas.

Recommandation : **CI d'abord** (filet inconditionnel, indépendant du fait qu'un humain
lance la bonne skill), `ship` ensuite si le PO veut la réparation automatique.

## Critères d'acceptation
- [ ] Un lien cassé introduit dans une fiche ou un ADR fait **rougir** la gate — prouvé
      par sabotage, pas par lecture.
- [ ] Le message d'échec donne `fichier:ligne`, la cible écrite et la résolution fautive.
- [ ] Les deux racines sont couvertes : mega-city ET le backlog racine vectorz
      (`features docs/adr docs/captures`, plus les guides de `docs/` qui citent des fiches).
- [ ] Un `ship` suivi de la gate ne laisse passer aucun lien entrant orphelin.
- [ ] `test-check-links.sh` reste vert et tourne dans la même gate.

## Notes

- Outil livré et vert : [`bin/check-links.sh`](../bin/check-links.sh),
  [`bin/test-check-links.sh`](../bin/test-check-links.sh).
- Invocations : `bin/check-links.sh` (mega-city, périmètre par défaut `features/ docs/adr/`)
  et `bin/check-links.sh <racine-vectorz> features docs/adr docs/captures`.
- Piège d'implémentation déjà payé : un test de schéma d'URL générique `^[a-z.]+:` avale
  `types.ts:75` et rend le contrôle aveugle. La liste des schémas est explicite à dessein,
  et le cas G du test couvre la forme NUE (sans `/` avant le `:`), seule discriminante.
- Voisin thématique : [0068 règle « method-map à jour »](0068-regle-method-map-a-jour.md)
  — même famille (un artefact humain qui se périme sans que rien ne rougisse).
