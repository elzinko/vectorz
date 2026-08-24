---
id: "20260824122629794"
title: Capitaliser une feature déjà codée en « recette » réutilisable (tâches + rules/profils) — l'extraction n'existe PAS encore
type: feature
priority: P1
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
- **« recette »** = **PAS un objet de premier rang aujourd'hui**. La forme la plus
  proche : un **skill dont le playbook EST la liste de tâches**, qui **compose les
  rules** à respecter et **référence le profil**. (C'est déjà l'approche de la fiche
  `20260821172716540` « recette site produit » : un skill à règles activables.)
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
