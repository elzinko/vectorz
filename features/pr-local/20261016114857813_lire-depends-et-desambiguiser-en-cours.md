> 🗎 Rendu de la fiche [features/20261016114857813_lire-depends-et-desambiguiser-en-cours.md](../done/20261016114857813_lire-depends-et-desambiguiser-en-cours.md)

# 20261016114857813 — Lire enfin `depends:` + désambiguïser « en cours »

**En clair.** Deux petites dettes, réglables tout de suite et utiles toutes seules. (1) Sur les
fiches, une case `depends:` dit « celle-ci en attend une autre d'abord » ; elle est écrite sur des
fiches mais **personne ne la lit** — on la fait enfin lire, pour **prévenir** (pas bloquer) quand
l'ordre ne colle pas. (2) Le mot « en cours » veut dire **deux choses** dans l'outil ; on le coupe en
deux libellés clairs.

**Si tu arrives frais.** `depends:` est un champ de fiche (« dépend de telle fiche »). « en cours »
apparaît dans `ezk backlog version` : parfois pour dire *ce lot n'est pas fini*, parfois pour dire
*c'est la version active du tirage*.

## Contexte / Problème

- **`depends:` est déclaré mais inerte.** Le type `Fiche` ne le charge pas ; le séquenceur l'ignore ;
  le rendu l'avoue (« le champ `depends:` n'est pas encore lu »). Un champ qui a l'air d'une
  contrainte et n'en est pas — le pire état (un lecteur croit que l'ordre est garanti, il ne l'est
  pas).
- **« en cours » est surchargé.** La colonne État de `version list` dit « en cours » pour *lot
  incomplet* (plusieurs versions à la fois), alors que la règle de tirage (ADR-0070) entend *la
  version active* (une seule). Même mot, deux sens → confusion de pilotage.

Les deux sont une **dette réelle, indépendante** de tout changement de modèle : on les règle sans
toucher au rôle de `version`, sans rouvrir ADR-0070 ni ADR-0080.

## Proposition

- **Lire `depends:`** : l'ajouter au type `Fiche` et au loader (le lecteur `readListField` existe
  déjà, il sert `labels:`).
- **Un contrôle qui avertit, pas qui bloque** : `version check` / `plan check` **signale** une entrée
  de `PLAN.md` (ou un `version:`) qui place une fiche **avant** une dépendance non livrée ; il
  **refuse** une dépendance en cycle (le message nomme la boucle). Contrôle **pur, avant la
  sélection** — même point d'insertion que le filtre de version existant ; ADR-0070 inchangé.
- **Désambiguïser « en cours »** : deux libellés distincts dans le rendu (ex. « incomplète » pour le
  lot, « active » pour le tirage).

Signal, pas barrage (aligne ADR-0080). Aucun graphe inter-milestone ici : c'est le **noyau** extrait
de la cible différée.

## Critères d'acceptation

- [ ] `depends:` est **chargé** dans le modèle (type `Fiche`) et **lu** par le séquenceur (plus de
      « non lu » dans le rendu).
- [ ] Une entrée de plan (ou un `version:`) placée **avant** une dépendance non livrée est
      **signalée en avertissement** (pas un blocage du tirage).
- [ ] Une dépendance **en cycle** est **refusée**, avec un message qui nomme la boucle fautive.
- [ ] L'état « en cours » s'affiche en **deux libellés distincts** (lot incomplet vs version active) ;
      aucun autre comportement du tirage ne change.
- [ ] Gate locale verte (typecheck / lint / tests).

## Comment vérifier

```bash
pnpm --dir products/mega-city test
# sur un plan jouet : une fiche placée avant une dépendance non livrée → version check AVERTIT (code 0, message) ;
# deux fiches qui se dépendent en cycle → REFUS (code 1, boucle nommée) ;
# ezk backlog version → la colonne État et la « version active » portent deux libellés distincts.
```

## Notes / décisions

- **Extrait de** la cible différée
  [séquencer par milestone + dépendances](../20261016081021364_sequencer-par-milestone-dependances.md),
  par décision du panel
  [ADR-0081](../../products/mega-city/docs/adr/0081-sequencement-depends-signal-dag-differe.md) : c'est le
  « noyau à faire maintenant ». Le basculement de modèle (milestone = unité, vrai graphe) reste dans
  la fiche parente, différé.
- **Ne touche pas** au rôle de `version` ; **ne rouvre pas** ADR-0070 ; **aligne** ADR-0080
  (dépendances = signal, pas graphe).
- **Repères de code** (donnés par le panel) : type `Fiche` sans `depends`
  (`products/mega-city/src/loaders/fiches.ts`) ; « depends non lu »
  (`src/backlog/versions-render.ts`) ; contrôle PLAN/version existant à étendre
  (`src/backlog/versions.ts`, codes `plan-ecart`/`plan-absente`).


## Validation

| Modalité | Statut |
|---|---|
| Gate locale | ✅ |
| Revue locale | ✅ (1 constat corrigé) |
| CI | N.A. (local) |
| Before/after (UI) | N.A. — correctif CLI sans écran |
