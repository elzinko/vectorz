---
id: "20260825123700998"
title: Doctrine de composition des features — fusion, épic ou division : quand et comment
type: feature
priority: P2
product: mega-city
version:
epic:
depends: []
labels: [backlog, methode, doctrine]
status: todo
ready: 2026-08-25
pr:
created: 2026-08-25
---

# Composition des features : fusionner, mettre en épic, ou diviser ?

## En clair

Quand deux fiches se recoupent, ou qu'une fiche grossit trop, on a **trois gestes** : **fusionner**
(deux fiches → une, les sujets deviennent des sections), **mettre en épic** (les fiches restent
distinctes sous un conteneur), ou **diviser** (une grosse fiche → plusieurs). Jusqu'ici on tranchait
au jugé. Cette fiche pose la **doctrine** — et **une seule question suffit à choisir**.

**Grooming du 2026-08-25 (panel `ezk-architect`) : doctrine tranchée.** Elle ne construit pas
d'outil ; elle donne les **règles de décision** que l'outil de rationalisation appliquera. Appliquée
au cas testbed, elle rend un verdict net : **c'est un épic** (voir plus bas).

## Contexte / Problème

Besoin PO (2026-08-25) : *« une épic, c'est une grosse feature avec trop de choses dedans. Si deux
fiches ont des sujets similaires, on peut les regrouper… Est-ce qu'un regroupement en épic est la
bonne stratégie, ou faut-il fusionner en une fiche ? Comment gère-t-on la composition et la
séparation d'une fiche ? »*

La session du 2026-08-25 a fait trois gestes sans doctrine : dédoublonnage « recette » (fusion),
lot 4b (une fiche absorbée), une fiche suite (division). À chaque fois le choix a été tranché à la
main. La doctrine ci-dessous rend ce choix **décidable**.

## La doctrine (tranchée)

### D1 — La sémantique de l'épic (une seule)

Un épic est un **conteneur de fiches-enfants distinctes et tirables séparément** : le couple déjà en
place, `type: epic` sur le conteneur, `epic: <id>` sur chaque enfant. L'épic **n'a pas** de critères
d'acceptation propres, pas de code, pas de PR.

Ce qu'un épic **n'est pas** :

- **Pas** « une grosse fiche pleine de choses ». Ça, c'est le **déclencheur d'une division**.
  L'épic naît *après* la découpe, comme conteneur.
- **Pas tirable** directement. On ne « prend » jamais un épic ; on descend vers l'enfant prêt.

*C'est déjà ce que fait le board* : il sort les `type: epic` de la liste des fiches actives.
Choisir cette sémantique, c'est épouser l'existant — zéro objet neuf.

### D2 — La règle décidable (fusion vs épic vs division)

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

### D3 — Le critère de division (« trop grosse »)

**Un test, pas un seuil** : une fiche est trop grosse quand **on peut en livrer une moitié dans une
PR mergeable et utile toute seule**. Si oui, elle est divisible.

Signaux qui invitent à poser le test (des indices, ils ne tranchent pas) :

- un **« et »** dans le titre qui joint des sujets sans rapport (« device **et** preview **et** testbed ») ;
- plusieurs **étages** de la refonte trois-étages (ADR-0039) touchés dans une même fiche ;
- beaucoup de critères d'acceptation qui se rangent en **groupes livrables séparément** (~5+ est un
  indice, mais c'est l'**indépendance** qui compte, pas le nombre).

Les seuils numériques restent des indices soumis à l'arbitrage PO.

### D4 — Les épics au board d'avancement (réponse au finding Codex P2)

L'épic **ne devient pas une carte** dans la liste des fiches tirables — l'y injecter fausserait le
compte des tirables et le tri par priorité. Il reste dans **sa propre section**, qui gagne un
**cumul de l'avancement des enfants** : « 3 enfants — 1 livré / 1 en cours / 1 todo », plus un ratio.

Le statut de l'épic est **calculé, jamais saisi** : tous les enfants livrés → épic livré ; au moins
un enfant actif → épic en cours. Le cumul se calcule dans `avancement-data.ts` (on enrichit
l'objet épic de compteurs par statut) — **pas de champ tenu à la main** (ADR-0001).

Ça répond au finding Codex P2 sur la [PR #166](https://github.com/elzinko/vectorz/pull/166)
(aujourd'hui l'épic n'affiche aucun avancement) sans casser l'invariant « le LLM ne range jamais ».

### D5 — Réversibilité (git = substrat)

Chaque geste est réversible parce que les relations sont des **champs de front-matter** et les
fusions du **markdown** :

- **Sortir un enfant d'un épic** : vider son champ `epic:`, régénérer l'index. Un seul champ bouge.
  Si l'épic tombe à zéro enfant, on le retire.
- **Défusionner** : rejouer une **division** (nouvelles fiches, ids horodatés neufs) ; le contenu
  d'origine reste dans `git log`. La division est l'inverse de la fusion.
- **Traçabilité de la fusion** (le seul geste un peu « lossy ») : noter l'id de la fiche absorbée
  dans la survivante (comme lot 4b : « 0177 absorbée »). Le tombstone reste lisible sans fouiller git.

## Frontière doctrine ↔ outil (à garder nette)

- **Cette fiche = la doctrine.** Elle dit **quel geste** dans quel cas (l'arbre D2). Elle se
  matérialise dans `rules/` (ou le playbook backlog).
- **[20260812104022240](20260812104022240_backlog-rationalisation-tags-script-llm.md) = l'outil.**
  Il applique ces règles **en masse** (clusters sur `labels:` / `depends:` ; sanitation LLM des faux
  positifs). Il **consomme** cette doctrine comme sa fonction de décision ; il ne la redéfinit pas.
- Modèle de données des tags = fiche `0092` (`labels:` / `depends:`). La doctrine s'y adosse, ne
  réinvente aucun champ. Sanity-check doublons/regroupement = fiche `0071` `review` (shipped).

## Application au cas testbed (le 1er cas concret)

**Verdict : ÉPIC « cœur testbed + adaptateurs preview/device » — pas une skill fusionnée.**

On applique D2. Les trois se livrent-ils en **une seule PR indissociable** ? Non :

- **0102 `ezk-testbed`** (le cœur « démarrer l'env selon la recette ») se livre seul et sert seul —
  il a déjà 4 consommateurs (`ezk-pr run`, `ezk-preview` cas B, `ezk-sprint` étape 6, `verify`/`run`) ;
- **`ezk-preview`** (surface URL) et **`ezk-device`** (surface téléphone/adb) se posent **par-dessus**,
  chacune livrable à son rythme.

But commun ? Oui — « voir / tester tourner un travail en cours ». **N PR + but commun → épic.**

Conséquences (à construire à ton OK) : créer un conteneur `type: epic` ; **débloquer 0102** et le
rattacher comme **enfant-cœur** (il n'est pas absorbé, il devient la première brique) ;
`ezk-preview` et `ezk-device` = enfants-adaptateurs.

**La « commande unique à modes » du PO n'est pas contradictoire — elle est orthogonale.** Une seule
commande `ezk-preview` (modes web / device / desktop) via socle d'agent + compétences composables,
c'est du **packaging / UX de la surface** (combien de commandes l'utilisateur tape). La doctrine
tranche le **backlog** (combien de livrables distincts). On peut avoir un **épic à enfants distincts**
*dont* les surfaces sont exposées **derrière une commande unique**. Les deux ne s'opposent pas.

> **Reste ouvert (arbitrage PO au build)** : preview et device sont deux adaptateurs minces. S'ils se
> livrent dans **la même PR** → les fusionner en un enfant « surfaces » → épic à **2 enfants**. S'ils
> se livrent sur des calendriers indépendants → **3 enfants**. À trancher selon la finesse réelle des
> adaptateurs. Le verdict « épic » ne dépend pas de ce choix.

## Critères d'acceptation (build — à ton OK)

- [ ] La règle décidable D2 écrite dans `rules/` (ou le playbook backlog), avec l'arbre de décision.
- [ ] La sémantique de l'épic (D1) documentée — une seule définition.
- [ ] Le board affiche le cumul des enfants d'un épic (D4) — calculé, pas saisi (finding Codex P2 clos).
- [ ] La frontière doctrine ↔ outil ([20260812104022240](20260812104022240_backlog-rationalisation-tags-script-llm.md)) écrite.
- [ ] Le cas testbed matérialisé en épic (conteneur + 0102 débloqué en enfant-cœur).

## Comment vérifier

La règle D2 tranche sans hésiter les trois cas réels de la session du 2026-08-25 (recette = fusion,
lot 4b = division + absorption, fiche suite = division) et le cas testbed (= épic).

## Anti-doublon

- Fiche **20260812104022240** « Rationalisation du backlog » = l'**outil**. **Cette fiche = la
  doctrine** qu'il applique. Distinctes.
- Fiche `0071` `review` (shipped) — sanity-check doublons/regroupement par jugement LLM.
- Fiche `0092` — champs `labels:` / `depends:` (le modèle de données des tags).

## Notes

Origine : demande PO du 2026-08-25 (`/ezk-backlog add`), née du finding Codex P2 sur le board
(#166) et des trois gestes de composition faits à la main pendant la mise à plat du backlog.
Grooming : 2026-08-25, panel `ezk-architect` (décisions D1–D5 + verdict testbed).
