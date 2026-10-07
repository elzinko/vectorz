---
id: "20261007115128214"
title: "Descendre cop1.config.example.yaml de la racine vers products/cop1/"
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

# 20261007115128214 — Descendre cop1.config.example.yaml sous products/cop1/

**En clair.** Un gabarit de config traîne à la **racine** du dépôt :
`cop1.config.example.yaml`. Il sert à lancer le produit **cop1**, qui vit dans
`products/cop1/`. On le descend chez son produit et on corrige les **trois endroits** qui le
citent. Effet : la racine ne porte plus que de l'outillage transverse, et le gabarit est à côté
de cop1. Petit et sûr : c'est un exemple qu'on copie, aucun code ne lit son chemin.

**Si tu arrives frais.** vectorz est un monorepo : le produit supervisé **cop1** vit sous
`products/cop1/`. Un fichier `*.example.yaml` est un **gabarit** qu'on copie (`cp`) puis qu'on
adapte pour lancer le produit ; ici, on le copie en `cop1.config.yaml` (lui, ignoré par git).

## Contexte / Problème

cop1 a été rangé sous `products/cop1/`, mais son gabarit de config est resté à la racine, là où
il était avant le découpage. Deux conséquences :

- **La racine ment sur sa fonction.** Elle devrait porter de l'outillage transverse
  (`package.json`, `tsconfig.base.json`, `biome.json`…), pas le gabarit d'un produit précis.
- **Le gabarit est loin de son produit.** Un lecteur qui ouvre `products/cop1/` ne le trouve pas.

**Périmètre réduit au grooming (2026-10-07).** La fiche visait d'abord trois fichiers racine. La
vérification terrain a montré que seul `cop1.config.example.yaml` est un gabarit déplaçable
proprement. Les `supervision.registry.yaml` et `supervision.registry.example.yaml` **restent à la
racine** (décision PO) : c'est de l'infra de supervision **partagée**, lue par du **code** de
mega-city (cockpit : `ezk-map.ts`, `supervision-mcp.ts`, `supervision-doctor.ts`, `cockpit.ts`) et
de cop1, et **résolue par recherche ascendante** du nom de fichier depuis un dossier de départ —
la descendre casserait cette résolution pour les consommateurs situés au-dessus. Hors périmètre.

## Proposition

1. `git mv cop1.config.example.yaml products/cop1/cop1.config.example.yaml` (préserve l'historique).
2. Corriger les **trois références vivantes** :
   - `docs/DOGFOOD.md` (ligne `cp -n cop1.config.example.yaml cop1.config.yaml`) ;
   - `scripts/dogfood-guided.sh` (la commande `cp "$ROOT/cop1.config.example.yaml" …`) ;
   - `docs/index.md` (mention/lien).
   Les fiches de `features/done/` qui le citent (0032, 0034) sont **historiques** : ne pas les
   toucher.
3. Ne rien changer d'autre : aucun code ne lit ce chemin (c'est un exemple copié à la main).

## Critères d'acceptation

- [ ] `cop1.config.example.yaml` vit sous `products/cop1/`, plus à la racine du dépôt.
- [ ] Les trois références vivantes (DOGFOOD.md, dogfood-guided.sh, index.md) pointent le nouveau
      chemin ; aucun lien mort.
- [ ] Le parcours dogfood (`scripts/dogfood-guided.sh`) copie le gabarit sans chemin cassé.
- [ ] Les `supervision.registry.*` sont **inchangés** (restés à la racine).

## Comment vérifier

```bash
# 1. Le gabarit est sous products/cop1/, plus à la racine.
ls products/cop1/cop1.config.example.yaml
test ! -e cop1.config.example.yaml && echo "OK racine propre" || echo "KO encore à la racine"
# 2. Plus aucune référence VIVANTE à l'ancien chemin racine (les fiches done/ sont historiques).
( git grep -n "cop1\.config\.example\.yaml" -- docs/DOGFOOD.md docs/index.md scripts/dogfood-guided.sh \
    | grep -v "products/cop1/"; rc=$?
  case $rc in
    0) echo "KO — références non corrigées ci-dessus"; exit 1 ;;
    1) echo "OK — les 3 références pointent le nouveau chemin" ;;
    *) echo "ERREUR grep (rc=$rc)"; exit 2 ;;
  esac )
# 3. Le dogfood sait copier le gabarit depuis son nouveau chemin.
grep -n "products/cop1/cop1.config.example.yaml" scripts/dogfood-guided.sh
```

## Glossaire

- **gabarit de config (`*.example.yaml`)** : fichier d'exemple qu'on copie puis adapte ; il n'est
  lu par aucun code, seulement par la personne qui démarre le produit.
- **recherche ascendante** : la façon dont le code trouve `supervision.registry.yaml` — il remonte
  les dossiers parents jusqu'à tomber sur le nom ; d'où le fait de laisser ce fichier à la racine.

## Notes / décisions

- **Origine** : revue PO de la racine, 2026-10-06/07. Sortie du périmètre de la fiche
  [regrouper les artefacts de méthode](20261001192624192_regrouper-artefacts-methode-dossier-scrum.md)
  car c'est de la config produit, pas du process.
- **Grooming 2026-10-07** : périmètre réduit de 3 fichiers à 1 après vérification terrain ; les
  `supervision.registry.*` restent à la racine (infra partagée lue par du code, décision PO).
- **Lot V0.9 « Ranger la maison ».**
