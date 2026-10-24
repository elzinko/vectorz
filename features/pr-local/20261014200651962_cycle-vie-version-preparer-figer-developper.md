> 🗎 Rendu de la fiche [features/20261014200651962_cycle-vie-version-preparer-figer-developper.md](../20261014200651962_cycle-vie-version-preparer-figer-developper.md)

# 20261014200651962 — Cycle de vie d'une version

**En clair.** On veut rendre **visible et durable** l'état d'une version dans son cycle : *brouillon*
(on la prépare), *figée* (son périmètre est arrêté), *livrée* (étiquetée). Le passage en *figée* est
un **geste PO** — le « bouton ». Ce gel **ne commande pas** le développement (le tirage reste à
l'ADR-0070) : c'est un **marqueur**. Mais un marqueur qu'on veut **vérifiable** (pouvoir prouver ce qui
était figé) et **persistant** (le retrouver en rouvrant le dashboard plus tard). Le gel est **souple** :
on peut ajouter après coup des fiches de complétude (fix, Dependabot), tracées comme ajouts.

**Si tu arrives frais.** Une *version* (ex. `v0.16.0`) regroupe un lot de fiches. Elle passe
aujourd'hui de « en cours » (la plus basse sans étiquette git, ADR-0070) à « livrée » (étiquetée). Il
n'y a **pas d'étape explicite** « validée, on développe » entre les deux.

## Contexte / Problème

- **L'état d'une version dans son cycle n'est ni explicite ni durable.** On devine « où elle en est »
  (préparée ? arrêtée ? livrée ?) à la prose de `PLAN.md` et aux champs `version:`. Pas de marqueur
  posé par le PO, persistant et relisable par le dashboard.
- **Pas de gel au niveau version.** Les gestes proches sont à d'autres grains : `sprint start --lot`
  fige le lot d'**un sprint** ; `version close` étiquette **à la fin**. Rien ne pose un marqueur
  « je valide et j'arrête le périmètre de cette version ».
- **Préparer puis figer n'est pas matérialisé.** Mettre/retirer des fiches d'une version en
  préparation, puis arrêter le périmètre, se fait à la main dans `PLAN.md` et les champs `version:`,
  sans cycle lisible.
- **La complétude arrive en cours de route.** Pendant le dev, des besoins surgissent (un fix, une mise
  à jour Dependabot, de la dette). Ils doivent pouvoir entrer **sans « rouvrir »** formellement la
  version — sinon soit on bloque, soit on perd la trace de ce qui était prévu vs ajouté.

## Proposition

À cadrer au grooming et avec l'architecte. Direction :

- **Un état de version explicite** : `brouillon` → `figée` → `livrée`. Le passage en `figée` est le
  **geste PO** (« le bouton »). **Ce n'est pas un gate de dev** : le tirage reste gouverné par
  l'ADR-0070 ; figer est un **marqueur**, pas un ordre.
- **Trois forces possibles pour « figer » — le vrai choix** :
  - **déclarer** — un drapeau (ex. `VERSIONS.md`) : dit « figé », n'empêche rien, ne prouve rien ;
  - **photographier** — un **tag git sur le commit** de référence : capture le contenu figé, rend
    toute dérive **détectable** par diff ;
  - **verrouiller** — une **garde** (hook / check) qui refuse d'éditer une fiche figée : empêche
    vraiment, plus lourd.
  Préférence PO (2026-10-15) : **photographier**, *pas* un `VERSIONS.md` déclaratif (un drapeau ne
  garantit rien sur les fiches).
- **Gel souple** : une fois figée, **ajouter** une fiche (fix, Dependabot, dette) reste permis, **tracé
  comme ajout** au périmètre gelé — la base (photographiée) reste distinguable des ajouts.
- **Côté board v0.17** : l'état se **lit** et s'affiche (cop1 lit la méthode, ne l'écrit pas) ; se
  branche sur les **deux jauges par version** (ADR-074).
- **N'interfère pas avec le tirage** (ADR-0070) : le gel est un marqueur **parallèle**, pas la
  « version en cours » du tirage.

## Critères d'acceptation

Niveau *idée* — la cible, à préciser au grooming.

- [ ] Une version porte un **état explicite et persistant** (`brouillon` / `figée` / `livrée`), posé
      en git (survit à un redémarrage du dashboard), lisible par la commande et par le board.
- [ ] Un **geste PO fige** une version (arrête + **photographie** le périmètre), distinct de l'étiquette
      finale.
- [ ] Le périmètre figé est **vérifiable** : on peut montrer le contenu exact figé et **détecter**
      qu'une fiche a bougé depuis (diff).
- [ ] Après le gel, **ajouter** une fiche (fix, Dependabot) reste permis et **tracé comme ajout**, sans
      rouvrir la version ; la base reste distinguable des ajouts.
- [ ] Le gel **ne change pas** ce que le tirage développe (ADR-0070 inchangé).
- [ ] Gate locale verte (typecheck / lint / tests).

## Comment vérifier

Esquisse (noms indicatifs, à trancher au groom).

```bash
ezk backlog version freeze <X>     # brouillon → figée : photographie le périmètre (geste PO)
ezk backlog version diff <X>       # dérive depuis le gel : base photographiée vs état actuel
# ajouter ensuite une fiche version: <X> → tracée « ajout », pas réouverture
ezk backlog version list           # montre l'état (brouillon/figée/livrée) + base vs ajouts
# le board v0.17 LIT et affiche l'état
```

## Architecture — avis de l'architecte (2026-10-15, `--archi`)

S'appuie sur des décisions déjà prises (ADR-0070 tirage, ADR-074 « le board lit, il n'écrit pas »,
ADR-0001 « le script range, le LLM juge »). POC d'abord.

### Décision 1 — La force : **photographier** (force 2), pas verrouiller

Figer = poser une **photo immuable** du périmètre, pas un cadenas. Raisons :
- ça livre le besoin PO (vérifiable + persistant + dérive détectable) au coût le plus bas ;
- **verrouiller** (une garde qui refuse d'éditer une fiche figée) est **différé** : plus intrusif, il
  ne se justifie que si « des fiches figées se font éditer par erreur » devient une vraie douleur
  (YAGNI). Il se poserait **par-dessus** la photo (il faut d'abord savoir ce qui est figé), jamais à
  sa place.
- **Limite assumée** : la photo *enregistre et détecte*, elle n'*empêche* pas. C'est un choix, pas un oubli.

### Décision 2 — Le mécanisme : un tag `freeze/vX.Y.Z`, distinct de la release

- **Figer** = `version freeze <X>` pose un **tag annoté** `freeze/vX.Y.Z` sur `HEAD` (le commit-base ;
  l'annotation porte date + auteur). **Défiger** = `unfreeze` supprime le tag (opération de ref, **pas
  de commit**).
- **État dérivé, zéro fichier** (ADR-0001) : release `vX.Y.Z` → **livrée** ; `freeze/vX.Y.Z` sans
  release → **figée** ; ni l'un ni l'autre → **brouillon**.
- **Aucune interférence avec le tirage** : le préfixe `freeze/` fait qu'ADR-0070 (qui lit `vX.Y.Z`) ne
  le prend jamais pour une release.
- **Base vs ajouts** : la **base** = les fiches `version: X` présentes dans l'arbre du commit
  `freeze/vX.Y.Z` ; les **ajouts** = celles entrées après. `version diff <X>` montre la dérive.
- **Local par défaut** : le tag reste local (marqueur du poste), poussé seulement si on veut le
  partager — cohérent avec « push = geste PO ».

### Décision 3 — Le « bouton » du board ne casse pas ADR-074

ADR-074 interdit au board d'**inventer** une donnée, pas de **déclencher** une commande. Le bouton
**appelle** `version freeze` — c'est la **méthode** qui écrit le tag, le board se contente ensuite de
le **lire** pour afficher le marqueur. POC : la commande d'abord ; le bouton est une tranche du build
du board v0.17.

### Verbes & ordre de construction

`version freeze <X>` · `version unfreeze <X>` · `version diff <X>`, en extension de `version
list/check/close` (socle livré). POC = la commande + l'état dérivé dans `version list`, éprouvé sur la
méthode elle-même. Plus tard : le bouton côté board ; la garde « verrouiller » **uniquement** si un
besoin de prévention se montre.

## Glossaire

- `gel souple` — figer le périmètre d'une version comme **base de référence**, tout en autorisant des
  ajouts **tracés**.
- `ajout de complétude` — une fiche entrée **après** le gel pour que la version soit aboutie (fix, mise
  à jour de dépendance, dette).

## Notes / décisions

- **Aligné sur [ADR-083](../../products/mega-city/docs/adr/0083-version-etiquette-milestone-unite-de-preparation.md)
  (2026-10-23)** : ce qu'on prépare et qu'on fige, c'est la **milestone** ; le numéro de version se
  pose à la construction. Lire « version en brouillon » comme « milestone en préparation ». Le gel
  (tag `freeze/…`) photographie le périmètre de la milestone au moment où on lui assigne son numéro.
  Milestone de cette fiche : `preparation`. Groomée « prête » le 2026-10-23.
- **Origine** : vision PO du 2026-10-14 (conversation de planning) — « préparer les versions et les
  modifier ensuite », « un bouton pour valider et figer pour développer », « droit d'ajouter des
  fiches (fix, Dependabot…) pour que la version soit aboutie ».
- **Étend** la commande `version` (livrée, [[20260824204751403]]) et le **board v0.17**
  ([[20261007135620590]], deux jauges par version, ADR-074).
- **N'interfère pas avec le tirage** :
  [ADR-0070](../../products/mega-city/docs/adr/0070-le-tirage-reste-dans-la-version-en-cours.md) reste
  seul maître de « quelle version on code » ; figer est un marqueur **parallèle** (décision PO
  2026-10-15 : le gel ne commande pas le dev).
- **Grain** : le gel de version est **au-dessus** de `sprint start --lot` (grain sprint).
- **Décidé (PO 2026-10-15)** : (a) figer est un **marqueur**, pas un gate de dev ; (b) il doit être
  **persistant** — en git, relisable au retour sur le dashboard, pas un état volatile de cop1 ;
  (c) **pas** un `VERSIONS.md` déclaratif — préférence pour **photographier** (un tag git sur le commit
  de référence).
- **Tranché par l'avis d'architecte (2026-10-15, voir § Architecture)** : force = **photographier**
  (tag `freeze/vX.Y.Z`, pas de cadenas) ; mécanisme = tag annoté distinct de la release, état dérivé
  des refs ; verbes `freeze` / `unfreeze` / `diff` ; le bouton du board **déclenche** la commande (ne
  viole pas ADR-074).
- **Restent pour le PO / panel** : (a) ajouter un jour la garde « verrouiller » (force 3) — **seulement
  si** un besoin de prévention se montre ; (b) le chemin d'écriture du bouton, à cadrer avec le build
  du board v0.17 ; (c) la sémantique fine « ajout » vs « réouverture ».
- **Limite honnête** : git ne *verrouille* pas un fichier. Un tag **enregistre et détecte** (diff), il
  n'*empêche* pas. Seule une garde (force « verrouiller ») empêche vraiment — à peser si le besoin est
  la prévention, pas seulement la preuve.


## Validation

| Modalité | Statut |
|---|---|
| Gate locale | ✅ (2169 tests + scripts) |
| Revue locale | ✅ (2 constats corrigés) |
| CI | N.A. (local) |
| Before/after (UI) | N.A. — commande CLI sans écran |
