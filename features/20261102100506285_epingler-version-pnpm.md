---
id: "20261102100506285"
title: "Lancé depuis un environnement neuf, vectorz réinstalle ses dépendances avec un autre pnpm"
type: bug
priority: P2
product: vectorz
milestone:
version:
labels: [scout, outillage]
status: idea
pr:
evidence: none # configuration du dépôt ; pas d'écran
created: 2026-11-02
---

# Lancé depuis un environnement neuf, vectorz réinstalle ses dépendances avec un autre pnpm

**En clair.** Le dépôt ne fixe pas la version de pnpm à utiliser. Sur un environnement neuf (dossier
personnel vide, CI, autre poste), corepack prend donc la dernière version, pnpm 12. Ce pnpm réinstalle
tout `node_modules` avant de lancer le script demandé, et ignore les scripts de build d'esbuild et de
biome. Le poste, lui, utilise pnpm 10.28.2.

**Si tu arrives frais.** Corepack est l'outil de Node qui choisit la version de pnpm. Il lit le champ
`packageManager` du `package.json`. Sans ce champ, il prend la dernière version publiée.

## Contexte / Problème

Gravité : **majeure**. Le défaut a abîmé le `node_modules` de vectorz pendant la passe de scout du
2026-11-02. Il a fallu réinstaller avec pnpm 10.

Reproduction :

1. `cd vectorz && env HOME=$(mktemp -d) XDG_CACHE_HOME=$(mktemp -d) pnpm --version` affiche
   « Downloading the pnpm 12.16.1 binary… » puis 12.16.1. Sur le poste, `pnpm --version` affiche
   10.28.2.
2. Avec ces mêmes variables, `pnpm cop1:dev --no-build` lance d'abord une installation
   (« Packages: +301 »), puis `ERR_PNPM_IGNORED_BUILDS` (biome, esbuild).
3. `grep packageManager node_modules/.modules.yaml` affiche ensuite `pnpm@12.16.1`.

Attendu : le même pnpm partout, et aucune installation implicite au lancement. Obtenu : un pnpm d'une
autre version majeure réinstalle les dépendances.

## Proposition

Ajouter le champ `packageManager` au `package.json` racine, avec la version utilisée sur le poste.

## Critères d'acceptation

- [ ] Sous un dossier personnel vide, `pnpm --version` dans vectorz affiche la version épinglée.
- [ ] Le lancement de mission control depuis un environnement neuf ne réinstalle pas `node_modules`
  avec une autre version majeure de pnpm.

## Comment vérifier

Rejouer l'étape 1 de la reproduction. Ne rejouer l'étape 2 que dans une copie du dépôt, jamais dans le
dépôt de travail.

## Notes / décisions

- Trouvé par ezk-scout, rapport `/private/tmp/claude-501/-Users-elzinko-git-bacasable-vectorz/50a740fe-2443-4e7f-bcb3-17d581e154ae/scratchpad/ezk-scout/cop1-2026-11-02/report.md` (brouillon B6), le 2026-11-02.
- Indice de localisation, non garanti : `package.json:38`.
- Voisine livrée, sur un autre sujet (pnpm introuvable sous launchd) :
  [checklist de démo desktop périmée](done/0060-checklist-demo-desktop-perimee.md).
