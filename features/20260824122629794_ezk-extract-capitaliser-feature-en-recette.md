---
id: "20260824122629794"
title: Capitaliser une feature déjà codée en « recette » réutilisable (tâches + rules/profils) — l'extraction n'existe PAS encore
type: feature
priority: P0
product: mega-city
version:
epic:
depends: []
status: idea
ready:
pr:
created: 2026-08-24
---

## En clair

Tu veux prendre une fonctionnalité **déjà implémentée** dans un projet et en faire une
**recette réutilisable** : « voilà les tâches à suivre, les règles et le profil qui vont
avec ». **Ce mécanisme n'existe pas aujourd'hui.** Tu penses à `ezk-ezk extract` — cette
sous-commande **n'a jamais été implémentée** : `ezk-ezk` fait `help | harvest | create |
deploy | audit`, pas `extract`. L'extraction est juste **notée comme idée future**
(ADR-0039 §6). Cette fiche est là pour la construire.

## Ce qui existe déjà (pour ne pas réinventer)

Les briques de la méthode qui serviront — le vocabulaire que tu ne te rappelles jamais :

- **rule** = une consigne de travail (LOI). Elle arrive par un **bundle** (paquet de
  règles) qu'un **profil** embarque.
- **skill (capability)** = un outil + son mode d'emploi (playbook). Un skill peut
  **composer** des rules (mécanisme `composes:`, ADR-0025).
- **profil** = le bon de commande d'une cible : quelles rules + agents + skills.
- **« recette »** = **nature d'objet à trancher au panel** — NE PAS pré-décider ici.
  La définition de l'objet (et de son gardien) est portée par la **fiche-chapeau**
  [`20260824185422122`](done/20260824185422122_recette-artefact-premier-rang-et-gardien.md).
  Deux options en débat : **(A)** objet de premier rang + gardien (pattern steward,
  thèse du chapeau) ; **(B)** simple **skill dont le playbook EST la liste de tâches**,
  qui **compose les rules** et **référence le profil** (approche de la fiche
  `20260821172716540` « recette site produit »). **Cette fiche-ci est le producteur par
  extraction — valable quelle que soit l'issue A/B**, elle ne tranche pas l'objet.
- **`ezk-ezk harvest/create`** = transforme une **discussion de session** en skill —
  mais depuis la CONVERSATION, pas en scannant un projet existant.
- **`ezk-recipy`** (fiche `0147`, **todo, non implémentée**) = entonnoir qui scanne des
  repos froids et **propose des fiches** (sourcing), pas une fabrique de recette.

**Le trou** : rien ne prend une feature codée → produit une recette (tâches + rules +
profil). C'est ça, cette fiche.

## Proposition (à trancher au grooming — architecture)

Deux pistes, à départager par un panel `engineering:architecture` :

1. **`ezk-ezk extract <chemin-feature>`** : lit le code/les fichiers d'une feature
   implémentée, en déduit un brouillon de recette (skill : playbook = tâches ;
   `composes:` = rules détectées ; profil suggéré). Reste un **entonnoir** : sortie =
   brouillon révocable, jamais du code auto-écrit (doctrine ADR-0013).
2. **Étendre `ezk-recipy`** (0147) plutôt qu'`ezk-ezk` : recipy scanne déjà des repos ;
   ajouter « extraire une recette d'une feature précise » y serait cohérent.

Question de fond à graver dans l'ADR : **« recette » devient-elle un objet nommé** (avec
son type), ou reste-t-elle **un skill qui compose des rules** (pas de nouveau concept) ?

## Grooming du 2026-08-24 — le design concret (PO)

**Le PO a déjà créé la 1ʳᵉ recette à la main** : [`recipes/plan-distribution-app.md`](../recipes/plan-distribution-app.md)
(distribution d'app via R2, extraite de `muti`). Le dossier **`recipes/` existe déjà à la
racine de vectorz**. Cette fiche formalise le mécanisme qui GÉNÉRERAIT ces recettes au lieu
de les écrire à la main — la §5 de ce doc s'appelle elle-même « le germe de la fiche vectorz ».

**La commande cible** : `ezk-ezk recipy extract <feature>` (nom à confirmer) → produit **un
fichier markdown de recette** : le plan **tâche après tâche** de ce qui doit être fait, avec
éventuellement des **diagrammes** (via `ezk-diagram`).

**Les DEUX sources d'extraction** (la clé du design) :
- **(a) une implémentation de référence** dans un autre projet (ex. `muti`) — le LLM
  l'analyse et en extrait la recette + repère les briques réutilisables ;
- **(b) une FICHE déjà livrée sans accroc** — insight PO : *une bonne fiche réalisée
  contient déjà tout* (problème, proposition, critères, « Comment vérifier », et via sa PR
  le diff réel). Une fiche `shipped` → une recette, presque gratuitement. C'est la voie la
  plus propre : **bien faire la fiche, c'est déjà écrire la recette**.

**Le format de recette** (déjà éprouvé dans `plan-distribution-app.md`, à standardiser) :
En clair · le mécanisme (avec schéma texte) · une **checklist « rien d'oublié »** à
légende de statut (✅ fait · 🟠 différé · ❌ à faire · ⚙️ config/geste humain) · les
**options à trancher par projet** (les leviers activables) · un journal. Chaque recette
pointe la **référence** (le projet-source) et les **rules/profil** à suivre.

**Stockage** : `recipes/` à la **racine de vectorz** (déjà là) — car une recette est un
**déployable cross-projet**, pas une brique du catalogue mega-city. *(« ou mega-city, à
voir » — arbitrage PO à confirmer au panel ; la racine vectorz est l'état actuel.)*

**Anti-doublon / voisinage** : `0147` (ezk-recipy = sourcing de skills depuis repos froids)
· `0178` (ezk-checks = recette manuelle déclenchable) · `20260821172716540` (recette site
produit à règles activables). L'extraction proposée ici est **distincte** : fiche/impl → recette.

## ▶️ Groomé 2026-08-30 — l'objet est tranché (#192), reste le producteur

**Le débat A/B est clos.** La fiche-chapeau [`20260824185422122`](done/20260824185422122_recette-artefact-premier-rang-et-gardien.md)
a été **construite et shippée (PR #192, 2026-08-30)** : la recette est un **artefact de
premier rang** (option A), avec son gardien **`ezk-chef`**, son gabarit
[`recipes/RECIPE_TEMPLATE.md`](../recipes/RECIPE_TEMPLATE.md), son bundle `rules/recipe/*`
et son livre régénéré `recipes/RECIPES.md`. Donc, **plus de panel à tenir** sur l'objet :

- **Objet** : tranché → artefact de premier rang (pas « skill qui compose »). ✅
- **Stockage** : tranché → `recipes/` racine (le livre pointe, D4). ✅
- **Format** : tranché → `RECIPE_TEMPLATE.md` (rubriques cuisine + front-matter). ✅
- **Producteur** : **`ezk-chef extract`** — une **sous-commande du hub recette** `ezk-chef`,
  PAS un `ezk-*` séparé, ni `ezk-ezk` (qui fabrique des *skills*). **Décision PO 2026-08-30** :
  `ezk-chef` devient le **hub de la famille recette** (comme `ezk-backlog` l'est des fiches) —
  `check` (garder) · `extract` (produire, cette fiche) · `scan` (sourcer, ex-`ezk-recipy` /
  fiche 0147) · `regen`/`list` (le livre). Cohérent avec **D3 de #192** : « une famille de
  verbes appartient au **gardien + son regen**, façon `ezk-backlog` ». On **arrête** de créer
  `ezk-extract` et `ezk-recipy` comme outils `ezk-*` séparés (moins de marques, une porte).

**Implication structurante (le vrai chantier de cette fiche)** : `ezk-chef` est aujourd'hui un
**agent** (livré #192). Le porter en hub lui ajoute un **skill `ezk-chef`** (les verbes) qui
**délègue le jugement à l'agent** — exactement comme `ezk-backlog` (skill) et `ezk-reviewer`
(agent) coexistent. `extract` est la 1ʳᵉ sous-commande à construire ; `scan` suit (fiche 0147).

### MVP proposé

`ezk-chef extract` produit un **brouillon de recette** (fichier markdown depuis
`RECIPE_TEMPLATE.md`, `status: draft`) — un **entonnoir** : sortie révocable, jamais de code
auto-écrit (ADR-0013). **Deux sources**, la (b) en cœur du MVP :

- **(b) depuis une fiche `shipped` (+ sa PR)** — la voie la plus propre (« bien faire la
  fiche, c'est déjà écrire la recette ») : lit la fiche `features/done/<id>_*.md`, en dérive
  l'ossature de la recette (En clair, playbook depuis Proposition/Comment vérifier, `source:`
  depuis la PR, `composes:` proposé). **Cœur du MVP.**
- **(a) depuis une implémentation de référence** (chemin d'un autre projet) — best-effort :
  pointe la racine `source:` et amorce la checklist ; l'analyse fine du code est **différée**
  si trop coûteuse (le dire dans le brouillon, jamais inventer).

Le brouillon passe ensuite la gate d'**`ezk-chef`** (déjà livrée par #192) → l'humain le
finalise `ready`. **Le LLM ne range jamais** : `regen-recipes.sh` (livré) réécrit le livre.

## Critères d'acceptation (enrichis au grooming du 2026-08-24)

- [ ] Panel architecture tenu : `ezk-ezk extract` vs `ezk-recipy extract` (nom) ;
      « recette » = objet nommé vs skill-qui-compose ; storage `recipes/` racine vs
      mega-city. ADR court.
- [ ] La commande produit un **fichier markdown de recette** dans `recipes/` : plan
      tâche-après-tâche + rules/profil à suivre + éventuels diagrammes.
- [ ] Les **deux sources** marchent : (a) une impl de référence d'un autre projet,
      (b) une **fiche `shipped`** (+ sa PR) → recette quasi gratuite.
- [ ] Le **format** est standardisé (En clair · mécanisme+schéma · checklist à légende
      de statut · options par projet · journal) — aligné sur `recipes/plan-distribution-app.md`.
- [ ] La frontière avec `harvest` (session), `ezk-recipy` 0147 (sourcing) et `0178`
      (recette manuelle) est écrite.
- [ ] `recipes/plan-distribution-app.md` est reconnue comme la **1ʳᵉ recette** (le cobaye
      du format) ; la 2ᵉ recette annoncée par le PO est localisée et rattachée.

## Comment vérifier

```bash
grep -m1 argument-hint products/mega-city/skills/ezk-ezk/SKILL.md   # 'extract' doit apparaître une fois construit
```

## Notes

Origine : `/ezk-backlog add` du 2026-08-24 (besoin réel vécu en session samplerz —
capitaliser une feature). P1 proposée (« urgent » dit par le PO) — à confirmer.
Lignée : ADR-0039 §6 (extraction notée), fiche `0147` (ezk-recipy), fiche
`20260821172716540` (recette site produit). **Fiche sœur** : `20260824122629925`
(l'entrée FAQ « comment capitaliser une feature ») **dépend** de celle-ci — on ne
documente le « comment faire » qu'une fois le mécanisme construit.
