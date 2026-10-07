---
id: "20261007115128214"
title: "Descendre la config runtime de cop1 de la racine du monorepo vers products/cop1/"
type: refactor
priority: P2
product: vectorz
milestone: rationalisation
version: V0.9
labels: [convention, arborescence]
status: idea
pr:
evidence: none # refactor d'arborescence, pas d'UI
created: 2026-10-07
---

# 20261007115128214 — Descendre la config runtime de cop1 sous products/cop1/

**En clair.** Trois fichiers de config d'exécution traînent à la **racine** du dépôt :
`cop1.config.example.yaml`, `supervision.registry.example.yaml` et `supervision.registry.yaml`.
Ils servent à faire tourner le produit **cop1**, qui vit aujourd'hui dans `products/cop1/`. On les
descend là où est leur produit, et on corrige les liens dans les docs qui les citent. Effet : la
racine du monorepo ne porte plus que de l'outillage transverse, et la config de cop1 est à côté de
cop1.

**Si tu arrives frais.** vectorz est un monorepo : l'outillage de méthode vit sous
`products/mega-city/`, le produit supervisé **cop1** sous `products/cop1/`. Un fichier `*.example.yaml`
est un **gabarit de config** qu'un utilisateur copie puis adapte pour lancer le produit.

## Contexte / Problème

cop1 a été rangé sous `products/cop1/`, mais sa config d'exemple est restée à la racine du dépôt,
là où elle était avant le découpage. Deux conséquences :

- **La racine ment sur sa fonction.** Elle devrait porter de l'outillage transverse
  (`package.json`, `tsconfig.base.json`, `biome.json`…), pas la config d'un produit précis.
- **La config est loin de son produit.** Un lecteur qui ouvre `products/cop1/` ne trouve pas son
  gabarit de config ; il doit remonter à la racine.

Ces fichiers ne sont **pas** des artefacts de méthode (ils ne relèvent pas du dossier `scrum/` de
la fiche sœur [regrouper les artefacts de méthode](20261001192624192_regrouper-artefacts-methode-dossier-scrum.md)) :
ce sont des **configs runtime de produit**. D'où une fiche à part.

## Proposition

1. `git mv` des trois fichiers vers `products/cop1/` (préserve l'historique).
2. Corriger les références : une dizaine de docs les citent — au moins `GETTING_STARTED.md`,
   `DOGFOOD.md`, `USER-GUIDE-web-ui.md`, `demo-desktop-checklist.md`, deux ADR, `.gitignore`.
3. Vérifier qu'aucun script ou code ne lit ces chemins **en dur** depuis la racine.

## Critères d'acceptation

- [ ] Les trois fichiers vivent sous `products/cop1/`, plus à la racine du dépôt.
- [ ] Aucun lien mort : toutes les docs et scripts qui les citaient pointent le nouveau chemin.
- [ ] `.gitignore` mis à jour pour le nouveau chemin de `supervision.registry.yaml`.
- [ ] Un clone frais permet de lancer cop1 en suivant `GETTING_STARTED.md` sans chemin cassé.

## Comment vérifier

```bash
# 1. Plus aucun des trois fichiers à la racine ; ils sont sous products/cop1/.
ls products/cop1/cop1.config.example.yaml products/cop1/supervision.registry.example.yaml
test ! -e cop1.config.example.yaml && echo "OK racine propre" || echo "KO encore à la racine"
# 2. Plus aucune référence en dur à l'ancien chemin racine (hors historique git).
( grep -rnE "(^|[^/])(cop1\.config\.example|supervision\.registry)" --include='*.md' --include='*.ts' --include='*.sh' . \
    | grep -vE "products/cop1/"; rc=$?
  case $rc in
    0) echo "KO — références à l'ancien chemin ci-dessus"; exit 1 ;;
    1) echo "OK — plus aucune référence racine" ;;
    *) echo "ERREUR grep (rc=$rc)"; exit 2 ;;
  esac )
# 3. Le lien du quickstart résout vers le nouveau chemin.
grep -n "cop1.config" docs/GETTING_STARTED.md
```

## Glossaire

- **config runtime** : fichier qui paramètre l'exécution d'un produit (ports, budgets, routing
  LLM), par opposition à la config d'outillage du dépôt.
- **dossier process `scrum/`** : le foyer des artefacts de méthode proposé par la fiche sœur —
  ces fichiers de config n'en font **pas** partie.

## Notes / décisions

- **Origine** : revue PO de `docs/` et de la racine, 2026-10-06/07. Sortie du périmètre de la
  fiche `scrum/` car c'est de la config produit, pas du process.
- **Lot V0.9 « Ranger la maison »** avec [la fiche scrum](20261001192624192_regrouper-artefacts-methode-dossier-scrum.md).
