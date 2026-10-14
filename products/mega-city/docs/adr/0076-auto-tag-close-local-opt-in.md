# ADR 0076 — Auto-tag et clôture de version en local, en opt-in explicite

**Statut :** Accepté (grooming, 2026-10-14)
**Date :** 2026-10-14
**Deciders :** PO (Thomas, demande du 2026-10-11 : « tague et merge en local tout seul » pour un run multi-versions) ; conception tranchée au build autonome v0.15
**Fiche :** [`20261013131852581`](../../../../features/20261013131852581_auto-tag-close-local-opt-in.md) (« Auto-tag et clôture de version en local, en opt-in explicite »)
**Compose :** [`src/core/run-context.ts`](../../src/core/run-context.ts) (`sealPolicy`, `RunSettings.sealVersions`) · [`skills/ezk-product-build/SKILL.md`](../../skills/ezk-product-build/SKILL.md) · s'appuie sur [`bin/backlog-version.ts`](../../bin/backlog-version.ts) (`close --tag`, existant) et [ADR-0001](0001-monorepo-composable-coeur-deterministe.md) (le skill décide, le script exécute le git)

## En clair

Poser l'étiquette d'une version (`ezk backlog version close <v> --tag`) est **le seul geste git que la
méthode réserve au PO**. Le PO a demandé qu'un run autonome puisse taguer et clore **en local** tout
seul, pour dérouler plusieurs versions d'affilée sans tenir la barre entre chacune. On l'ajoute, mais
**derrière un opt-in explicite** — un drapeau `--seal-versions local`, **absent par défaut** — et **en
flux local uniquement** (`github: false`, rien n'est poussé). Pas d'auto-tag silencieux, jamais quand
quelque chose partirait sur GitHub.

Analogie : jusqu'ici, seul le PO tenait le tampon de version. Ce drapeau lui permet de **déléguer le
tampon au run**, mais seulement dans l'atelier (local), et seulement s'il pose explicitement le
drapeau. La porte reste fermée par défaut.

## Décision

1. **Opt-in explicite, absent par défaut.** Un drapeau `--seal-versions local` sur
   `ezk-product-build run`. **Sans lui**, un run multi-versions clôt chaque version (`version close`)
   mais **ne tague pas** : le tag reste un geste du PO (statu quo, garde-fou voulu).

2. **Flux local uniquement.** Le drapeau ne mord que si le flux est local — `github.pr` coupé, donc
   rien n'est poussé. La décision est un cœur pur, `sealPolicy(sealVersions, githubLocalFlow)` :
   - sans drapeau → `po-default` (tag au PO) ;
   - `local` **et** flux local confirmé → `auto-local` (le run tague, en local, réversible) ;
   - `local` **hors** flux local (GitHub actif, ou flux non résolu) → `po-not-local` : le drapeau
     **ne s'applique pas**, le tag reste au PO. Par sûreté, un flux non résolu ne déclenche **jamais**
     l'auto-tag.

3. **Le skill décide, le script exécute (ADR-0001).** Le pilote **décide** de poser le drapeau et, à
   chaque frontière de version, passe (ou non) `--tag` à `ezk backlog version close`. Le git — créer
   l'étiquette **locale** sur HEAD — reste dans `bin/backlog-version.ts`, inchangé. La gate de release
   joue toujours : un tag auto reste refusé tant que la passe qualité n'est pas GO.

4. **Rien n'est poussé.** `close --tag` crée une étiquette **locale** (réversible : `git tag -d`). Le
   `git push origin <tag>` reste, lui, un geste du PO en toutes lettres — y compris en flux local.

## Conséquences

- **Un run multi-versions peut sceller ses frontières seul, en local**, quand le PO l'a explicitement
  autorisé par le drapeau. Le contrat de run (`ezk run context`) **affiche** la politique de scellage
  en clair : « je pose l'étiquette moi-même (local) » ou « le tag reste au PO ».
- **Le garde-fou PO n'est pas supprimé, il est rendu délégable** — sous double condition (drapeau +
  flux local). Hors de ces conditions, le comportement d'avant est strictement préservé.
- **Limite assumée :** en flux GitHub, cet ADR ne change rien — le tag/la release restent au PO. Un
  éventuel auto-tag distant serait une autre décision, non prise ici.
