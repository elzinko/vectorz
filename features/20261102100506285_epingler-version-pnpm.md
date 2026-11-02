---
id: "20261102100506285"
title: "Lancé depuis un environnement neuf, vectorz réinstalle ses dépendances avec un autre pnpm"
type: bug
priority: P2
product: vectorz
milestone:
version:
labels: [scout, outillage]
status: ready
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

## Valeur

Une seule version de pnpm, la même sur le poste, en CI et dans tout environnement neuf. Un agent qui
isole son dossier personnel, comme le fait ezk-scout, ne peut plus abîmer les dépendances du dépôt de
travail. Une montée de version de pnpm devient un geste décidé : on change une ligne, on la relit.
Elle n'arrive plus en douce le jour où pnpm publie une version majeure.

## Proposition

1. **Épingler pnpm dans le `package.json` racine** : `"packageManager": "pnpm@10.28.2"`. C'est la
   version que corepack utilise sur le poste aujourd'hui (sa dernière version connue).
2. **Laisser la CI lire cette épingle.** Les trois étapes `pnpm/action-setup@v4` fixent aujourd'hui
   `version: 10` : deux dans `.github/workflows/ci.yml`, une dans `.github/workflows/check-links.yml`.
   On retire ce `version:`, et l'action lit `packageManager`. Sinon, deux sources disent la version,
   et l'action peut refuser de démarrer quand elles diffèrent. Ce comportement est à confirmer au
   build, en rejouant la CI en local.

Hors périmètre : resserrer `engines.pnpm` (aujourd'hui `>=9.0.0`). L'épingle suffit à choisir la
version. `engines` ne fait qu'avertir.

## Critères d'acceptation

- [x] Le `package.json` racine porte `"packageManager": "pnpm@10.28.2"`.
- [x] Sous un dossier personnel vide, `pnpm --version` lancé dans vectorz affiche `10.28.2`.
- [x] Aucune étape de CI ne fixe une version de pnpm différente de l'épingle.
- [x] Sur le poste, `pnpm install --frozen-lockfile` ne change rien : même version, lockfile
  inchangé.

**Mesure de suivi** — à relever après la livraison, au premier run de CI (GitHub ou `act`) :

- La CI installe et teste sous pnpm 10.28.2. Non observable le 2026-11-02 : la CI cloud est coupée
  par la config du projet et Docker était arrêté. Décision PO du 2026-11-02 : livrer sans attendre,
  et relever ce point au premier run.

## Comment vérifier

Depuis la racine de vectorz :

```bash
# 1. L'épingle est posée
grep '"packageManager"' package.json

# 2. Un environnement neuf prend la version épinglée (lecture seule, ne réinstalle rien)
env HOME="$(mktemp -d)" XDG_CACHE_HOME="$(mktemp -d)" pnpm --version

# 3. Aucune version concurrente en CI
grep -n -A2 'pnpm/action-setup' .github/workflows/*.yml

# 4. Le poste n'est pas dérangé
pnpm install --frozen-lockfile && git status --short pnpm-lock.yaml
```

Attendu : la ligne en 1, `10.28.2` en 2, aucun `version:` sous `pnpm/action-setup` en 3, aucune
modification en 4. Pour la CI, rejouer le job `ci.yml` en local avec `ezk-ci`, ou lire le résultat
du prochain run GitHub.

Ne jamais lancer `pnpm cop1:dev` sous un dossier personnel vide dans le dépôt de travail : c'est ce
qui a déclenché l'incident. Ce test-là se fait dans une copie du dépôt.

## Notes / décisions

- Trouvé par ezk-scout, rapport `/private/tmp/claude-501/-Users-elzinko-git-bacasable-vectorz/50a740fe-2443-4e7f-bcb3-17d581e154ae/scratchpad/ezk-scout/cop1-2026-11-02/report.md` (brouillon B6), le 2026-11-02.
- Indice de localisation, non garanti : `package.json:38`.
- Groom du 2026-11-02. Constats : sur le poste, `pnpm` est le relais de corepack
  (`node_modules/corepack/dist/pnpm.js`), dont la dernière version connue est 10.28.2. La CI fixe
  `version: 10` à trois endroits. `pnpm-workspace.yaml` autorise le build de biome
  (`onlyBuiltDependencies`) mais pas celui d'esbuild : pnpm 10 ignore donc lui aussi le build
  d'esbuild. C'est sans effet constaté, puisque `pnpm ezk` tourne, et hors de cette fiche.
- Dépendances externes : aucune, hors le registre npm d'où corepack télécharge pnpm. Ce n'est ni un
  dépôt, ni un service à compte, ni un secret.
- Taille : 4 critères, deux surfaces (le `package.json` et les fichiers de CI).
- Effet de bord à connaître : avec l'épingle, corepack refusera de lancer yarn dans ce dépôt. C'est
  voulu.
- Voisine livrée, sur un autre sujet (pnpm introuvable sous launchd) :
  [checklist de démo desktop périmée](done/0060-checklist-demo-desktop-perimee.md).
