---
id: "20260825182327490"
title: Pattern « livrable lisible » — template + extracteur scripté + rendu LLM (généraliser handoff / PR / rapport)
type: feature
priority: P2
product: mega-city
version:
epic:
depends: []
labels: [lisibilite, methode, template]
status: idea
ready:
pr:
created: 2026-08-25
---

# Pattern « livrable lisible » : template + extracteur + rendu

## En clair

Chaque fois qu'un skill produit un **texte destiné à l'humain** (note de clôture, description de PR,
rapport, réponse de synthèse), on refait la même chose au jugé — et on s'aperçoit *après coup* que
c'est illisible (retour PO du 2026-08-25 sur le rapport `ezk-archive` : jargon recraché). Cette fiche
**nomme le pattern** pour ne plus le réinventer : un livrable humain = **trois pièces**.

1. **Un template** — les sections attendues **et** ce qu'on met dans chacune (pas de la prose libre).
2. **Un extracteur scripté** — un script qui sort les **données factuelles** (ADR-0001 : le script
   range/extrait, jamais le LLM à la main).
3. **Un rendu LLM** — le LLM **remplit** le template avec ces données, en respectant la règle de clarté.

On l'a **déjà trois fois** (sans l'avoir nommé) : la note de handoff (`ezk-archive`), la PR = *rendu*
d'une fiche (`ezk-pr`, ADR-0029), la règle « En clair ». Cette fiche en fait un **pattern réutilisable**.

## Contexte / Problème

Le pattern existe en pièces détachées, jamais posé comme tel :
- `ezk-archive` a un `references/handoff-template.md` + (depuis le 2026-08-25) une consigne « 3 questions,
  zéro jargon » ;
- `ezk-pr` : la PR est le **rendu** de la fiche (ADR-0029), avec un gabarit ;
- la règle de clarté (`0079`, `20260824111001836`) impose « En clair d'abord » à **tout** output.

Résultat : chaque skill re-décide son format dans son coin, et la qualité dérive jusqu'à ce qu'un
retour PO la corrige **au cas par cas** (ce qui vient d'arriver à `ezk-archive`). Nommer et outiller
le pattern rend la lisibilité **structurelle**, pas réparée après coup.

## Proposition (à groomer)

Poser le pattern « livrable lisible » comme un **trio instanciable** (même esprit que « recette =
artefact + gardien » = instance du pattern steward — voir [20260824185422122](20260824185422122_recette-artefact-premier-rang-et-gardien.md)) :

- **Template** : un fichier `*-template.md` par livrable, listant les sections **et** une consigne
  courte « quoi mettre / quoi bannir » par section. Source unique (comme `handoff-template.md`).
- **Extracteur** : un script qui produit les données du livrable (ex. `check.sh` du portier, `git log`,
  `regen-*`). Le LLM ne calcule ni ne recopie les chiffres — il les **reçoit**.
- **Rendu** : le LLM assemble template + données, sous la règle de clarté (`0079`). Le template fixe le
  **format** ; la règle garantit la **lisibilité du texte dedans**.

À trancher au grooming :
- Où vivent les templates (par skill, comme aujourd'hui, vs un dossier commun `templates/`) ?
- Quels livrables en bénéficient d'abord (clôture `ezk-archive`, PR `ezk-pr`, checkpoint `ezk-sprint`,
  réponses de synthèse) ?
- Le format d'un template (sections + consigne) — assez cadré pour aider, assez souple pour ne pas
  brider la clarté.

## Critères d'acceptation (brouillon)

- [ ] Le pattern est écrit (trio template / extracteur / rendu) dans `rules/` ou un ADR court.
- [ ] Au moins **un** livrable existant est relu à sa lumière (`ezk-archive` = 1er cas, déjà amorcé).
- [ ] La frontière avec la **règle** de clarté (`0079`) est nette : le template ne remplace pas la règle.

## Comment vérifier

Au grooming : appliquer le pattern à `ezk-archive` (template handoff + extracteur `check.sh` + rendu
3-questions) sans rien réinventer — c'est la preuve que le trio décrit bien l'existant.

## ⚠️ Piège (déjà connu — fiche 0079)

**Le template fixe le format, PAS la clarté du texte dedans.** Un gabarit trop rigide produit du
remplissage illisible. Le pattern = template **+** extracteur **+** règle de clarté ; jamais le
template seul.

## Frontière anti-doublon (aucun recouvrement)

Cette fiche pose **l'OUTILLAGE généralisé** (le trio). Les voisines couvrent d'autres angles :

- **Un template concret déjà livré** : la PR = rendu de fiche (`0191` livrée + ADR-0029). Cette fiche
  le **généralise**, elle ne le refait pas.
- **La règle de clarté** : [`20260824111001836`](20260824111001836_regle-clarte-atteint-tout-output-ezk.md)
  et `0079` disent que le texte doit être lisible. Ici = **comment l'outiller** (le squelette + les données).
- **L'article** : [`20260817113353676`](20260817113353676_article-templates-reponse-llm.md) vulgarise le
  sujet (éditorial). Ici = l'implémentation, pas l'article.
- **Prior-art** : [`20260817113353538`](20260817113353538_etude-prior-art-bmad-templates-elicitation.md)
  (BMAD = templates + elicitation) → matière d'entrée pour le grooming.
- **Directives composables** : [`20260812104022246`](20260812104022246_composition-comportementale-skills-ezk.md)
  (format imposé aux skills) → mécanisme voisin, pour *appliquer* un template dans un skill.

## Notes

Origine : retour PO du 2026-08-25 (le rapport `ezk-archive` illisible, corrigé ponctuellement — d'où
l'envie de généraliser). Ce cluster (cette fiche + `0079`/`836`/`676`/`538`/`246` + `0191`) est un
**candidat au regroupement en épic** — à décider avec la doctrine des épics
([20260825123700998](20260825123700998_doctrine-composition-features.md)).
