---
id: 0191
title: Lisibilité qui tient — templates LLM-adaptés + renfort au moment d'écrire (dès la description de PR)
type: feature
priority: P1
product: mega-city
labels: [enabler, lisibilite]
status: todo
ready:
pr:
created: 2026-08-11
---

## Contexte / Problème

**En clair.** La règle de lisibilité existe déjà (fiche 0079, shippée) et pourtant les descriptions
de PR restent souvent illisibles pour qui n'a pas le contexte. Preuve fraîche : la PR #125 (2026-08-11)
avait un corps opaque **malgré** la règle — le PO a dû le signaler et demander une réécriture. La règle
ne suffit pas ; elle n'**atteint pas** le rédacteur au moment où il écrit.

Diagnostic (constaté cette session, à graver) — pourquoi ça ne tient pas :

1. **`gh pr create --body-file` court-circuite `.github/PULL_REQUEST_TEMPLATE.md`.** Le template (3 blocs
   + « un tiers doit reformuler le besoin sans ouvrir le diff ») ne s'affiche qu'en création via l'UI /
   sans `--body`. Un agent qui passe `--body-file` ne le voit **jamais**.
2. **Enforcement post-hoc, sur le mauvais objet.** `human-facing-lisibility` (MUST, bundle
   `documentation-guidelines.yml`) est vérifiée par `ezk-reviewer` en `agent-check` — mais après coup, et
   `ezk-reviewer` relit le **code**, pas la **prose du corps de PR**. Le corps passe entre les mailles.
3. **Règle liée, pas inlinée au moment d'écrire.** 12 skills la référencent par lien ; un lien n'est pas
   le contenu. Au moment de la génération, l'instruction n'est pas saillante (pas « en fin de prompt »).
4. **La structure est templatée, le vocabulaire pour un nouveau ne l'est pas.** La règle impose les 3 blocs
   + « En clair » et mesure « un tiers reformule le besoin », mais n'exige jamais d'**établir le vocabulaire
   projet / un glossaire**. Un corps peut donc être template-conforme ET opaque (cas #125). La règle mesure
   la lisibilité, elle ne force pas l'**onboarding**.

## Proposition

Passer de « la règle existe » à « la règle tient » — viser l'**application au moment de la génération**,
pas une nouvelle règle. Commencer par **la description de PR** (le cas le plus fréquent et le plus visible).

1. **Un template LLM-adapté, ouvert (pas rigide)** pour la description de PR : structuré mais laissant place
   au jugement — impose *En clair* → *section « si tu arrives frais » (vocabulaire projet en 2 lignes)* →
   *chaque changement en symptôme→change→effet* → *glossaire du jargon*. Matérialisé **là où la PR est
   écrite** (l'étape PR d'`ezk-sprint`/`ezk-pr-pilot`), pas seulement dans `.github/` que `gh` court-circuite.
2. **Renforcer au moment d'écrire** : inliner le gabarit + la barre « compréhensible par un dev qui arrive »
   dans l'étape qui rédige le corps (répété là où c'est utilisé), au lieu d'un simple lien vers la règle.
3. **Une vérif sur la prose du corps** (pas seulement le code) : contrat testable ou lentille `ezk-reviewer`
   dédiée au corps de PR — signal observable, pas un avis mou.
4. **Prior art BMAD** : BMAD structurerait ses réponses via un **système de templates** (à vérifier —
   templates + elicitation). Étudier ce qui se transpose à une méthode LLM-native (cf. fiches 0049/0162).

## Critères d'acceptation

- [ ] un **template de description de PR adapté aux LLM** (ouvert/structuré) existe et exige : En clair +
      vocabulaire projet pour un nouveau + symptôme→change→effet + glossaire — matérialisé à l'étape qui écrit
      la PR (pas uniquement `.github/`, court-circuité par `gh --body-file`)
- [ ] l'instruction **atteint le moment de la génération** (inlinée/répétée là où le corps est rédigé), pas
      seulement un lien vérifié après coup
- [ ] une **vérif catch un corps opaque** (test de contrat ou lentille reviewer sur la prose) — mesure de
      0079 tenue en pratique : un tiers reformule le besoin en 1 phrase (3/3 sur 3 PR consécutives)
- [ ] **prior art BMAD étudié** : note « ce qui se transpose / ce qui ne se transpose pas » du système de
      templates BMAD vers une méthode LLM-native
- [ ] **[article]** rédiger un article « Templates de réponse adaptés aux LLM » (structure ouverte, barre
      newcomer, renfort au bon moment) — via `ezk-article`, persona = dev/PM qui arrive sur un projet

## Notes

- **N'est pas 0079** (shippée) : 0079 grave la *règle* + la *voix* + le contrat des 3 blocs. Ici on vise
  l'**application/le renforcement** (le trou entre « la règle existe » et « le corps est clair »).
- Voisines : [[0075]] (curation persona/format), [[0099]] (vérifier la STRUCTURE des directives, pas compter),
  [[0183]] (restitution markdown-first dans le code). BMAD : [[0049]] (article sidecar), [[0162]] (2ᵉ méthode).
- Déclencheur daté : réécriture de la PR #125 (2026-08-11) — corps opaque malgré la règle, PO l'a flaggé ;
  correctif qui a marché = section « si tu arrives frais » + glossaire + En clair « aucun code ».
- **Priorité P1 = proposition** (lisibilité = risque de churn, récurrent) — à confirmer/ajuster par le PO au gate.
