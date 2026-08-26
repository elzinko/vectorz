# Composition des fiches — fusionner, mettre en épic, ou diviser ?

> Doctrine de backlog (fiche 20260825123700998). Elle guide les gestes de composition
> (`add`, regroupement, `ship`) : **quel geste dans quel cas**. L'outil de rationalisation
> (fiche 20260812104022240) la **consomme** ; il ne la redéfinit pas.

## En clair

Quand deux fiches se recoupent, ou qu'une fiche grossit trop, il y a **trois gestes** :
**fusionner** (deux fiches → une), **mettre en épic** (fiches distinctes sous un conteneur),
ou **diviser** (une grosse fiche → plusieurs). **Une seule question tranche.**

## D1 — La sémantique de l'épic (une seule)

Un épic est un **conteneur de fiches-enfants distinctes et tirables séparément** :
`type: epic` sur le conteneur, `epic: <id>` sur chaque enfant. L'épic **n'a pas** de
critères d'acceptation propres, pas de code, pas de PR, et **n'est jamais tirable**
directement (on descend vers l'enfant prêt). Ce n'est **pas** « une grosse fiche pleine de
choses » — ça, c'est le déclencheur d'une **division**.

## D2 — La règle décidable

**Une seule question au grooming : « Combien de PR pour tout livrer, et ont-elles un but commun ? »**

```
Deux fiches se recoupent, ou une fiche grossit
        │
  « Combien de PR pour tout livrer, et un but commun ? »
        │
        ├─ 1 PR, indissociable ......... FUSION
        │                                (une fiche ; les sujets deviennent des sections)
        │
        ├─ N PR, but commun ............ ÉPIC
        │                                (N enfants distincts + un conteneur type: epic)
        │
        └─ N PR, buts distincts ........ FICHES INDÉPENDANTES
                                         (ni fusion ni épic — de simples voisines)

Une fiche empile des sujets livrables séparément → DIVISION, puis on re-pose la question.
```

Le critère est **la PR**, pas le ressenti : une PR = indissociable = fusion. Décidable sans hésiter.

## D3 — Le critère de division (« trop grosse »)

**Un test, pas un seuil** : une fiche est trop grosse quand **on peut en livrer une moitié
dans une PR mergeable et utile toute seule**. Signaux (indices, ils ne tranchent pas) : un
« et » dans le titre qui joint des sujets sans rapport ; plusieurs étages d'une refonte
touchés dans une même fiche ; beaucoup de critères qui se rangent en groupes livrables
séparément (~5+ est un indice, mais c'est l'**indépendance** qui compte, pas le nombre).

## D4 — Les épics au board d'avancement (mécanisme LIVRÉ)

L'épic **ne devient pas une carte tirable** (ça fausserait le compte des tirables et le
tri). Il reste dans sa section, qui affiche le **cumul de l'avancement des enfants**
(« 9 enfant(s) : 2 blocked · 4 shipped · 3 todo »). Le statut de l'épic est **calculé,
jamais saisi** : tous les enfants livrés → épic livré ; au moins un enfant actif → en cours.

Calculé dans [`src/core/avancement-data.ts`](../src/core/avancement-data.ts)
(`buildAvancementData` enrichit chaque épic de `childCounts` + statut dérivé, pas de champ
tenu à la main — ADR-0001) et **affiché** par `diagrams/avancement/board.html`. Répond au
finding Codex P2 sur la [PR #166](https://github.com/elzinko/vectorz/pull/166) (l'épic
n'affichait aucun avancement) sans casser l'invariant « le LLM ne range jamais ».

## D5 — Réversibilité (git = substrat)

Chaque geste est réversible car les relations sont des **champs de front-matter** :

- **Sortir un enfant d'un épic** : vider son champ `epic:`, régénérer l'index. Un seul champ bouge.
- **Défusionner** : rejouer une **division** (ids horodatés neufs) ; le contenu d'origine reste dans `git log`.
- **Traçabilité de la fusion** (le seul geste « lossy ») : noter l'id de la fiche absorbée dans la survivante.

## Frontière doctrine ↔ outil (à garder nette)

- **Cette doctrine** = *quel geste* dans quel cas (l'arbre D2). Elle se matérialise ici (playbook backlog).
- **[Fiche 20260812104022240](../../../features/20260812104022240_backlog-rationalisation-tags-script-llm.md)** = l'**outil** : il applique ces règles **en masse** (clusters sur `labels:`/`depends:`). Il **consomme** cette doctrine, ne la redéfinit pas.

## Reste à faire — direction produit (hors périmètre de ce build)

Le **cas testbed** — matérialiser un épic « cœur testbed + adaptateurs preview/device » et
**débloquer la fiche 0102** — est un acte de **direction produit** : il est **laissé au PO**,
jamais décidé en autonomie (garde-fou du product-builder). La doctrine, elle, rend déjà le
verdict : appliquée au cas testbed (N PR + but commun « voir/tester tourner un travail »),
c'est un **épic**.
