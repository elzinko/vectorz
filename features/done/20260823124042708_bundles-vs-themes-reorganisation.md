---
id: "20260823124042708"
title: LA LOI — distinguer thèmes (namespaces) et bundles (packs curated), désenchevêtrer hexagonal
type: refactor
priority: P2
product: mega-city
version:
epic:
status: shipped
ready: 2026-08-30
pr: "#190"
created: 2026-08-23
---

## En clair

Aujourd'hui 10 bundles sur 12 sont des **miroirs exacts** d'un dossier de règles — ils
n'apportent aucune composition. Seuls `base` et `mobile` composent vraiment. Et le sujet
« hexagonal » existe en double : une règle isolée dans le thème `architecture` ET un
dossier entier `hexagonal/`. Cette fiche fixe le modèle cible : **thème = le dossier**
(rangement), **bundle = un pack choisi** (composition). Pas d'urgence : le PO a dit
« on peut laisser vivre » — la fiche capture la cible pour quand la douleur montera.

> Priorité P2 **confirmée** (le PO a délégué le choix, 2026-08-23).
>
> **Verdict du panel adverse (2026-08-23)** : périmètre RÉDUIT. Maintenant : supprimer
> uniquement les 2 bundles orphelins (`documentation-guidelines`, `hexagonal` — zéro
> consommateur). Le reste (suppression des 8 miroirs, sucre `theme:` dans `expand`)
> attend une douleur prouvée : `cop1-target` consomme les 8 miroirs, et `expand`
> ignore silencieusement les références inconnues — une migration ratée perdrait de
> LA LOI sans bruit. Capture : `docs/captures/2026-08-23-panel-adverse-refonte-taxonomie.md`.

## ▶️ NOW tirable — supprimer les 2 bundles orphelins (grooming 2026-08-30)

Cette fiche mélange une **cible large** (retirer les 10 miroirs, un ADR, désenchevêtrer
hexagonal) et une **tranche petite déjà approuvée**. Le grooming isole la tranche NOW,
seule tirable aujourd'hui. Elle correspond au **point 1** de la fiche-conteneur
[`20260824061247344`](../20260824061247344_refonte-trois-etages-reliquat.md) (« reliquat
trois étages »), qui renvoie ici.

**Vérifié le 2026-08-30** : les deux bundles `bundles/documentation-guidelines.yml` et
`bundles/hexagonal.yml` ne sont cités par **aucun profil** (base, global, daily, desktop,
mobile, cop1-target) ni **aucun autre bundle**. Zéro consommateur — la seule occurrence de
leur id est leur propre déclaration. Suppression sûre et réversible (git).

**Ce qu'on touche / ce qu'on ne touche pas** : on supprime les deux **fichiers bundle**
(la grappe). Les **règles** sous `rules/documentation-guidelines/` et `rules/hexagonal/`
restent — elles sont citées directement ailleurs (ex. `documentation-guidelines/human-facing-lisibility`
est LA règle « En clair », référencée partout). Un thème sans bundle miroir reste un thème.

### Critères d'acceptation (tranche NOW uniquement)

- [ ] `products/mega-city/bundles/documentation-guidelines.yml` supprimé.
- [ ] `products/mega-city/bundles/hexagonal.yml` supprimé.
- [ ] Les dossiers `rules/documentation-guidelines/` et `rules/hexagonal/` **inchangés**.
- [ ] `pnpm --dir products/mega-city graph:check` vert (**aucun lien cassé**). Les règles
      des thèmes `documentation-guidelines/` et `hexagonal/` deviennent des orphelins de
      graphe (info, pas erreur) : plus aucun pack ne les regroupe. C'est **attendu** — aucun
      profil ne les recevait via ces bundles, donc **rien de bindé ne change**.
- [ ] `pnpm --dir products/mega-city test` **et** `pnpm --dir products/mega-city test:scripts` verts
      (dont `expand.test.ts` mis à jour : 8 bundles, 48 règles).
- [ ] Vues générées régénérées (board avancement + plan-delta, carte map-data) — tests de
      fidélité par construction verts.

### Reste de la fiche = différé (gardé, pas tirable)

Les 8 miroirs, le sucre `theme:` dans `expand`, le désenchevêtrement hexagonal et l'ADR
cible **restent capturés ci-dessous** et **hors** de la tranche NOW : le PO a dit « on peut
laisser vivre », `cop1-target` consomme les 8 miroirs, et `expand` ignore en silence une
référence inconnue — donc on attend une douleur prouvée avant d'y toucher.

## Contexte / problème (mesuré le 2026-08-23)

- `rules/` compte 10 namespaces (architecture, ci-cd, clean-code, conventional-commits,
  development, documentation-guidelines, hexagonal, testing, token-economy, typescript-2026).
- `bundles/` compte 12 fichiers : 10 sont des miroirs 1:1 de ces namespaces (même nom,
  toutes les règles du dossier, rien d'autre). Les 2 seuls vrais packs :
  `base` (no-dead-code + format des commits) et `mobile` (extends base, règles à venir).
- Doublon de granularité : `architecture/hexagonal-architecture` (une règle du thème
  architecture) coexiste avec le thème `hexagonal/` (5 règles) et son bundle miroir.
  Deux endroits disent « fais de l'hexagonal », à deux niveaux de détail.
- Le graphe compilé marque `documentation-guidelines` et `hexagonal` comme bundles
  **orphelins** : aucun profil ne les cite.

Le symptôme de fond : le mot « bundle » recouvre deux idées — *ranger* (le thème) et
*choisir* (le pack). Quand les deux se confondent, chaque nouveau dossier de règles
appelle mécaniquement son bundle miroir, et la composition réelle devient illisible.

## Proposition

1. **Thème = namespace** : le dossier `rules/<theme>/` est l'unité de rangement. Un thème
   peut mêler des règles de types différents (l'intuition PO : « dans hexagonal on
   pourrait avoir des règles de type architecture et d'autres types »).
2. **Bundle = pack curated uniquement** : un bundle existe seulement s'il **choisit**
   (cross-thèmes, sous-ensemble, ou extends). Les 10 miroirs 1:1 disparaissent en tant
   que fichiers : un profil peut citer un thème entier directement (`theme:architecture`
   ou sucre équivalent dans `expand`), le pack implicite étant dérivé du dossier.
3. **Désenchevêtrer hexagonal** : la règle `architecture/hexagonal-architecture` devient
   soit un pointeur d'entrée vers le thème `hexagonal/`, soit elle est absorbée par lui.
   Un seul endroit fait autorité.
4. **Statuer sur les orphelins** : `documentation-guidelines` et `hexagonal` — les citer
   dans un profil qui les veut, ou assumer qu'ils n'ont pas (encore) de consommateur.

## Critères d'acceptation

- [ ] Modèle cible acté (ADR court) : thème vs bundle, avec la règle « un bundle qui ne
      choisit rien n'existe pas ».
- [ ] `expand` sait résoudre un thème cité directement par un profil (test).
- [ ] Plus aucun bundle miroir 1:1 dans `bundles/` ; `base` et `mobile` inchangés.
- [ ] Le sujet hexagonal n'existe plus qu'à un seul niveau de granularité.
- [ ] `pnpm graph:check` vert (aucun lien cassé après la migration).

## Comment vérifier

```bash
pnpm --dir products/mega-city test
pnpm --dir products/mega-city graph:check
ls products/mega-city/bundles/
```

Le dernier `ls` ne doit montrer que des packs qui composent réellement.

## Notes

Origine : retour PO sur la section « Les règles, rangées par bundle » de la carte
compilée (2026-08-23). Décision PO explicite : possibilité de « laisser vivre » et
laisser la structure émerger — cette fiche est la cible, pas une urgence.
