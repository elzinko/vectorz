---
id: "20260813122510737"
title: ezk-backlog init.sh — le marqueur layout_version doit primer sur la détection legacy « Index auto-généré »
type: bug
priority: P3
product: mega-city
epic:
status: todo
ready:
pr:
created: 2026-08-13
---

# init.sh — le marqueur `layout_version` doit primer sur la détection legacy

## Contexte / Problème

**Symptôme.** Un projet **déjà en layout v2** (front-matter `layout_version: 2` dans
`features/README.md`) dont le README contient encore la mention « Index auto-généré » est
**faussement classé v1** par `ezk-backlog init` : il affiche « layout v1 détecté », refuse de
créer/toucher le backlog et **sort en `exit 2`**. Le projet reste bloqué après le correctif
« stampe `layout_version: 2` » — car ce stamp corrige `check-layout-version.sh` mais **pas**
`init.sh`.

**Reproduction.**
1. Un projet dont `features/README.md` a `layout_version: 2` en front-matter **et** contient
   la chaîne « Index auto-généré » (cas réel : le README muti — voir Notes).
2. Lancer `bash <skill>/init.sh` (ou tout chemin qui l'invoque).
3. → « init: layout v1 détecté … STATUS=behind … exit 2 », alors que le projet est en v2.

**Cause racine.**
[`skills/ezk-backlog/init.sh:44`](../products/mega-city/skills/ezk-backlog/init.sh#L44) fait
un `grep -q 'Index auto-généré'` **inconditionnel** pour décider « legacy v1 » :

```bash
if [[ -f "$FEATURES/README.md" ]] && grep -q 'Index auto-généré' "$FEATURES/README.md" 2>/dev/null; then
  out="$("$CHECK" "$ROOT")"   # <- check-layout-version.sh est appelé…
  echo "$out"                  # …mais son verdict n'est PAS utilisé dans la condition
  ... exit 2
fi
```

Il **ne lit pas d'abord** le marqueur `layout_version:` du front-matter. À l'inverse,
[`check-layout-version.sh:44-59`](../products/mega-city/skills/ezk-backlog/scripts/check-layout-version.sh#L44)
lit `layout_version` **en premier** (via `awk`) et **ne retombe** sur le grep « Index
auto-généré » **que si** aucun marqueur n'est présent (`INSTALLED -eq 0`). `init.sh` invoque
pourtant déjà `$CHECK` (ligne 45) — mais pour **afficher** sa sortie, pas pour **gater** la
condition. La détection legacy y est donc plus grossière que dans le script dédié.

## Proposition

Aligner `init.sh` sur `check-layout-version.sh` : **le marqueur `layout_version` prime sur la
détection legacy**. La détection « Index auto-généré » ne doit s'appliquer **que** si le README
n'a **pas** de `layout_version` en front-matter. Deux voies (POC d'abord) :

1. **Réutiliser le verdict de `check-layout-version.sh`** (déjà appelé ligne 45) : gater le
   `if` sur son `STATUS`/`INSTALLED` (ex. n'entrer dans la branche « migration » que si
   `STATUS=behind` **et** `INSTALLED=1`) au lieu du grep brut. Une seule source de vérité pour
   la détection de version.
2. À défaut, **ajouter la même garde** qu'`check-layout-version.sh` : lire `layout_version`
   du front-matter d'abord, et ne faire le grep que si absent.

Voie 1 préférée (ne pas dupliquer la logique de détection).

## Critères d'acceptation

- [ ] Un `features/README.md` avec `layout_version: 2` **et** « Index auto-généré » ne
      déclenche **plus** le chemin « layout v1 détecté » d'`init.sh` (pas d'`exit 2` à tort).
- [ ] Un README **legacy réel** (index auto-généré, **sans** `layout_version`) déclenche
      **toujours** la proposition de migration 002 (pas de régression du cas legitime).
- [ ] La détection de version d'`init.sh` et de `check-layout-version.sh` donne le **même
      verdict** sur les mêmes entrées (une seule logique, ou deux logiques prouvées équivalentes
      par test).
- [ ] Gate locale verte (tests shell du skill).

## Notes / décisions

- **Origine** : finding Codex (P2) sur la PR **#141** (vectorz), **mergée avant** qu'il soit
  adressé (cap anti-boucle `ezk-codex` à 2 rounds atteint → escaladé, puis capturé ici). Le
  point ne vivait que dans le thread de la PR mergée.
- **Cas concret déclencheur** : le `features/README.md` de **muti** porte « Index auto-généré »
  sans `layout_version` aujourd'hui ; s'il est stampé `layout_version: 2` (fix proposé dans
  [[0186]]), il exposerait précisément ce bug d'`init.sh`. Les deux gestes vont donc ensemble.
- **Priorité P3 proposée** (robustesse/edge-case ; fréquence faible — nécessite un README v2
  gardant la mention legacy) — à confirmer au grooming.
- Voisin : [[0186]] (Skema — le sliver « validateur de conformité » y note déjà le README muti ;
  ce bug-ci est le pendant *outillage* de la même incohérence).
- Fichiers : `products/mega-city/skills/ezk-backlog/init.sh`,
  `products/mega-city/skills/ezk-backlog/scripts/check-layout-version.sh`.
</content>
