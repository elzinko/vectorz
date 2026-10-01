---
id: documentation-guidelines/readable-deliverable-trio
kind: disposition
level: SHOULD
title: A human-facing deliverable = template + extractor + render
enforcements:
  - type: agent-check
    agent: ezk-reviewer
---

- **En clair.** Chaque fois qu'un skill produit un texte pour l'humain (note de clôture, corps de PR, rapport), on refait le format au jugé, et on constate l'illisibilité après coup. Cette règle nomme le pattern pour ne plus le réinventer : un livrable humain = **trois pièces**.
- **Les trois pièces.**
  1. **Gabarit** : un fichier `*-template.md` qui liste les sections attendues **et**, pour chacune, une consigne courte « mets / bannis ». Source unique, lue par tous les chemins qui produisent le livrable.
  2. **Extracteur** : un script qui sort les **faits** (chiffres, états, listes). Le LLM ne les calcule pas et ne les recopie pas : il les **reçoit** (ADR-0001 : le script range et extrait, le LLM juge et rédige).
  3. **Rendu** : le LLM remplit le gabarit avec ces faits, sous la règle [`human-facing-lisibility`](human-facing-lisibility.md).
- **Format d'un gabarit.** Des sections, chacune avec sa consigne « mets / bannis ». Il **impose l'ouverture « En clair »** : le bloc figure dans le gabarit. Il porte aussi le **périmètre** : ce qu'on montre selon le contexte. Cas fondateur : le handoff d'`ezk-archive` ne restitue que la session courante ; les autres sessions sont nommées, jamais déroulées.
- **Frontière avec la règle de clarté.** Le gabarit fixe le **format**. La règle `human-facing-lisibility` garantit la **lisibilité du texte dedans**. Le gabarit ne la remplace jamais : un gabarit trop rigide produit du remplissage illisible. Le pattern = gabarit **+** extracteur **+** règle de clarté, jamais le gabarit seul.
- **Source unique.** Un gabarit n'existe qu'à un endroit. Le skill le **lie** ; il ne le recopie pas, sinon les copies divergent en silence.
- **Où il vit.** Dans le skill qui produit le livrable (`references/` ou `templates/`). Pas de dossier commun tant qu'aucun partage n'est prouvé.

### Instances connues

Chaque ligne nomme les trois pièces d'un livrable qui existe déjà. Les chemins sont relatifs à `products/mega-city/`. Le test `readable-deliverable-trio.test.ts` vérifie que chaque ligne a quatre cellules, que chaque chemin existe et que chaque gabarit porte le bloc « En clair ».

| Livrable | Gabarit | Extracteur | Rendu |
|---|---|---|---|
| Note de handoff de clôture (`ezk-archive`) | `skills/ezk-archive/references/handoff-template.md` | `skills/ezk-archive/scripts/check.sh` | `skills/ezk-archive/SKILL.md` — « 3 réponses, zéro jargon » |
| Corps de PR rendu depuis la fiche | `skills/ezk-backlog/templates/feature-template.md` | `bin/pr-emit-local.ts` — mode sans GitHub seulement | `docs/adr/0029-fiche-est-le-document-pr-en-est-le-rendu.md` |
| Capture de rétro (`ezk-retro`) | `skills/ezk-retro/references/capture-template.md` | `bin/retro-captures.ts` | `skills/ezk-retro/SKILL.md` — temps 5, « La capture (obligatoire) » |

Trou connu : avec une PR GitHub, le corps est recopié de la fiche à la main. L'extracteur ne couvre que le mode sans GitHub.

Cas limite : pour le corps de PR, le « rendu » est un recopiage de la fiche (ADR-0029). L'extracteur et le rendu se confondent presque. Le détail est dans « Cas corps de PR » de [`human-facing-lisibility`](human-facing-lisibility.md).

### Ajouter une instance

1. Écris le gabarit : sections, consigne « mets / bannis », ouverture « En clair ».
2. Sors les faits par un script, pas à la main.
3. Ajoute une ligne à la table ci-dessus. Le test dit si un chemin manque.
4. Le skill déclare cette règle dans `applies:` et lie le gabarit.

Origin: retour PO du 2026-08-25 (rapport `ezk-archive` illisible, corrigé au cas par cas) → fiche 20260825182327490 : poser le pattern pour que la lisibilité soit structurelle, pas réparée après coup. Prior art BMAD (templates, validateurs, élicitation) : [étude](../../../../features/done/20260817113353538_etude-prior-art-bmad-templates-elicitation.md) ; on garde le trio, plus simple que leur moteur. Measure (removability): le prochain livrable humain créé par un skill arrive avec ses trois pièces dans la table, et 0 retour « illisible » du PO sur ce livrable.
