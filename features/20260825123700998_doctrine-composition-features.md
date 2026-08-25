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
status: idea
ready:
pr:
created: 2026-08-25
---

# Composition des features : fusionner, mettre en épic, ou diviser ?

## En clair

Quand deux fiches se recoupent, ou qu'une fiche grossit trop, on a **trois gestes possibles**
et **aucune règle claire** pour choisir : **fusionner** (deux fiches → une seule, ses sujets
devenant des sections à l'intérieur), **regrouper sous un épic** (les fiches restent distinctes,
un conteneur les chapeaute), ou **diviser** (une grosse fiche → plusieurs). Cette fiche pose la
**doctrine** — quel geste dans quel cas, et ce qu'est vraiment un épic. Elle ne construit pas
d'outil : elle donne les **règles de décision** que l'outil de rationalisation du backlog
appliquera.

## Contexte / Problème

Besoin PO (2026-08-25) : *« une épic, c'est une grosse feature avec trop de choses dedans. Si
deux fiches ont des sujets similaires, on peut les regrouper, puis on verra comment découper.
Est-ce qu'un regroupement en épic est la bonne stratégie, ou faut-il fusionner en une fiche en
séparant les sujets dedans ? Comment gère-t-on efficacement la composition (fusion) et la
séparation (division) d'une fiche ? »*

Aujourd'hui ces gestes se font **au jugé**, sans critère écrit. La session du 2026-08-25 en a
fait trois sans doctrine : dédoublonnage « recette » (fusion vers une fiche-chapeau, faux amis
laissés distincts), lot 4b (requalification + une fiche absorbée), et une fiche suite créée par
division d'une brique. À chaque fois le choix fusion / épic / division a été tranché à la main.

## Les trois gestes (à cadrer)

1. **Fusion** — deux fiches → **une seule**, les sujets devenant des **sections** internes.
   Pertinent quand les sujets sont **indissociables** (même livraison, même PR).
2. **Épic** — les fiches restent **distinctes et tirables séparément** ; un **conteneur**
   (`type: epic`) les chapeaute. Pertinent quand les sujets se livrent **séparément** mais
   partagent un but. Un épic n'est **pas tirable** directement (on descend vers l'enfant prêt).
3. **Division** — une fiche trop grosse → **plusieurs fiches** (+ éventuellement un épic pour
   les tenir). Pertinent quand une fiche empile des sujets **hétérogènes** (cf. lot 4b : la
   refonte trois-étages avait été scindée car elle empilait cinq tâches).

## Questions à trancher (grooming)

- **Définition de l'épic** : conteneur de fiches-enfants (le `epic:` actuel) vs « grosse fiche à
  découper ». Trancher une seule sémantique.
- **Critère fusion vs épic** : indissociable (même PR) → fusion ; séparable → épic. Le rendre
  décidable (un gate ? une question posée au grooming ?).
- **Critère de division** : à partir de quand une fiche est « trop grosse » — nombre de sujets,
  de critères d'acceptation, hétérogénéité des étages (ADR-0039) ?
- **Mécanique** : les champs `epic:` (lien enfant→conteneur), `depends:`, `labels:` (fiche 0092,
  modèle de données des tags), et l'outil de rationalisation (fiche 20260812104022240). Cette
  doctrine dit **quoi faire** ; l'outil dit **comment le faire en masse**.
- **Réversibilité** : peut-on « défusionner » / sortir un enfant d'un épic proprement (git = substrat) ?
- **Affichage** : le board d'avancement **exclut aujourd'hui les épics de ses cartes** (finding
  Codex P2 sur la [PR #166](https://github.com/elzinko/vectorz/pull/166)). La doctrine doit dire
  si/comment un épic paraît dans une vue d'avancement (une carte ? une section ? le cumul de ses enfants ?).

## Critères d'acceptation (brouillon — à groomer)

- [ ] Une règle décidable « fusion vs épic vs division » écrite (dans `rules/` ou le playbook backlog).
- [ ] La sémantique de l'épic tranchée et documentée (une seule définition).
- [ ] La frontière avec l'outil de rationalisation (20260812104022240) écrite : doctrine vs outil.
- [ ] Le traitement des épics par le board d'avancement décidé (finding Codex P2).

## Anti-doublon

- Fiche **20260812104022240** « Rationalisation du backlog — regrouper/splitter via tags » =
  l'**outil** (script + analyse LLM). **Cette fiche-ci = la doctrine** qu'il applique ; distinctes.
- Fiche `0071` `review` (shipped) — sanity-check doublons/regroupement par jugement LLM.
- Fiche `0092` — champs `labels:` / `depends:` (le modèle de données des tags).

## Comment vérifier

Au grooming : la règle de décision fusion/épic/division existe et tranche les trois cas réels de
la session du 2026-08-25 (recette, lot 4b, fiche suite) sans hésitation.

## Notes

Origine : demande PO du 2026-08-25 (`/ezk-backlog add`), née du finding Codex P2 sur le board
(#166) et des trois gestes de composition faits à la main pendant la mise à plat du backlog.
