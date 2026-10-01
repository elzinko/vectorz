---
id: "20260825182327490"
title: "Un modèle standard pour tout texte destiné à un humain"
type: feature
priority: P2
product: mega-city
version: V0.3
epic:
depends: []
labels: [lisibilite]
status: shipped
pr: "#283"
created: 2026-08-25
---

# Pattern « livrable lisible » : gabarit + extracteur + rendu

## En clair

Chaque fois qu'un skill produit un **texte pour l'humain** (note de clôture, description de PR, rapport), on refait la même chose au jugé. On s'aperçoit après coup que c'est illisible (retour PO du 2026-08-25 sur le rapport `ezk-archive`). Cette fiche **nomme le pattern** pour ne plus le réinventer. Un livrable humain = **trois pièces** :

1. **Un gabarit** : les sections attendues, et ce qu'on met dans chacune.
2. **Un extracteur** : un script qui sort les **faits** (ADR-0001 : le script range et extrait, le LLM ne recopie pas les chiffres).
3. **Un rendu** : le LLM remplit le gabarit avec ces faits, sous la règle de clarté.

On l'a **déjà trois fois** sans l'avoir nommé : la note de handoff d'`ezk-archive`, la PR rendue depuis la fiche (ADR-0029), la règle « En clair ». Le POC les range sous un seul nom, avec un test qui vérifie que les pièces existent.

## Contexte / Problème

Le pattern existe en pièces détachées. `ezk-archive` a un gabarit (`references/handoff-template.md`), un portier (`scripts/check.sh`) et une consigne « 3 questions, zéro jargon ». `ezk-pr` rend la PR depuis la fiche. La règle de clarté impose « En clair d'abord » à tout.

Résultat : chaque skill re-décide son format dans son coin, et la qualité dérive jusqu'à ce qu'un retour PO la corrige au cas par cas. Nommer et outiller le pattern rend la lisibilité **structurelle**, pas réparée après coup.

## Décisions de grooming

- **Où vivent les gabarits** : **par skill**, comme `handoff-template.md`, en source unique. Pas de dossier commun (on n'a pas de besoin de partage prouvé). Une table « instances connues » dans la règle les recense.
- **Format d'un gabarit** : des sections, et pour chacune une consigne courte « mets / bannis ». Le gabarit **impose l'ouverture « En clair »** : le bloc figure dans le gabarit. Il porte aussi le **périmètre** : ce qu'on montre selon le contexte (cas fondateur : le handoff ne restitue que la session courante).
- **Frontière avec la règle de clarté** : le gabarit fixe le **format**, la règle `human-facing-lisibility` garantit la **lisibilité du texte dedans**. Jamais le gabarit seul.
- **Premier cas** : `ezk-archive` (déjà amorcé), puis le corps de PR (ADR-0029). Le corps de PR révèle un trou honnête : son extracteur (`pr:emit-local`) ne sert que le mode sans GitHub. Avec une PR GitHub, le corps est recopié de la fiche à la main.
- **BMAD** : le prior art (templates + validateurs + elicitation) est dans l'étude [20260817113353538](20260817113353538_etude-prior-art-bmad-templates-elicitation.md). On n'en reprend pas le moteur : on garde le trio, plus simple.

## Critères d'acceptation (reste réel)

- [x] Une règle `documentation-guidelines/readable-deliverable-trio` écrit le trio : définition des trois pièces, format d'un gabarit, frontière avec la règle de clarté, source unique, table des instances connues, mode d'emploi pour en ajouter une.
- [x] La règle est rangée dans le bundle `base` et déclarée par `ezk-archive` (`applies:`). Preuve : `readable-deliverable-trio.test.ts`.
- [x] `ezk-archive` est relu à sa lumière : la table donne son gabarit (`handoff-template.md`), son extracteur (`check.sh`) et son rendu (« 3 réponses, zéro jargon »), et chaque chemin existe.
- [x] Un second livrable (le corps de PR) est recensé, avec son trou dit tel quel : l'extracteur ne couvre que le mode sans GitHub.
- [x] Un test passe au rouge si un chemin de la table n'existe pas, ou si un gabarit recensé ne porte pas le bloc « En clair », ou si une ligne de la table est mal formée (jamais ignorée en silence). Sabotage prouvé : `handoff-template.md` renommé à la main → « Note de handoff… : gabarit introuvable (…) » ; le test d'outil nomme aussi l'extracteur introuvable et le gabarit sans « En clair ».
- [x] La frontière avec la règle de clarté est nette : la règle de clarté est citée dans la règle et testée, le gabarit ne la remplace pas (il embarque « En clair »).

## Comment vérifier

```bash
pnpm --dir products/mega-city exec vitest run src/__tests__/readable-deliverable-trio.test.ts
```

Sabotage : renommer `handoff-template.md`, ou retirer son « En clair ». Le test passe au rouge et nomme la ligne de la table.

## ⚠️ Piège (déjà connu — fiche 0079)

**Le gabarit fixe le format, PAS la clarté du texte dedans.** Un gabarit trop rigide produit du remplissage illisible. Le pattern = gabarit **+** extracteur **+** règle de clarté. Jamais le gabarit seul.

## Suite (hors POC)

- Appliquer le trio au checkpoint de `ezk-sprint`, au rapport de sprint (`sprint-report.ts`) et aux réponses de synthèse.
- Combler le trou du corps de PR : brancher l'extracteur sur le chemin GitHub aussi.
- Faire porter le **périmètre** par chaque gabarit (règle comportementale de [20260812104022246](20260812104022246_composition-comportementale-skills-ezk.md)) ; l'état des autres sessions relève du cockpit [20260825141012293](20260825141012293_ezk-sessions-cockpit.md).
- Cluster à regrouper (cette fiche, `20260824111001836`, `20260817113353676`, `20260817113353538`, `20260812104022246`) : décision PO avec la doctrine de composition.

## Frontière anti-doublon (aucun recouvrement)

Cette fiche pose **l'outillage généralisé** (le trio). Les voisines couvrent d'autres angles :

- **Un gabarit concret déjà livré** : la PR rendue depuis la fiche (ADR-0029). Cette fiche le généralise, elle ne le refait pas.
- **La règle de clarté** : [`20260824111001836`](20260824111001836_regle-clarte-atteint-tout-output-ezk.md) dit que le texte doit être lisible. Ici : comment l'outiller (le squelette + les faits).
- **L'article** : [`20260817113353676`](../20260817113353676_article-templates-reponse-llm.md) vulgarise le sujet. Ici : l'implémentation.
- **Directives composables** : [`20260812104022246`](20260812104022246_composition-comportementale-skills-ezk.md) donne le mécanisme pour appliquer un gabarit dans un skill.

## Notes

Origine : retour PO du 2026-08-25 (le rapport `ezk-archive` illisible, corrigé ponctuellement, d'où l'envie de généraliser).
