---
id: 0080
title: "Chaque rétro laisse un compte rendu clair et des propositions ciblées"
type: feature
priority: P2
product: mega-city
version: V0.4
labels: [sprint]
epic:
status: idea
pr:
created: 2026-07-18
---

# 0080 — ezk-retro consigne ses cérémonies

## En clair

Quand `ezk-retro` tient une rétro, le débat s'évapore. Le skill range les règles décidées. Il ne garde pas le compte rendu : qui a proposé quoi, ce qui a été écarté, ce que le PO a tranché.

Cette fiche fait laisser un document par rétro, dans `docs/captures/`. Un humain le lit. Un script le lit aussi : un en-tête structuré liste les décisions, sans deviner dans la prose.

Elle absorbe la demande de proposer de vraies features et des règles ciblées sur un agent ou un skill. Chaque proposition passe par le même rapport, avec une case que le PO remplit lui-même.

> Regroomée le 2026-10-01 sur le reste réel. Les critères de la fiche absorbée sont intégrés ci-dessous.

## Contexte / Problème

La rétro du 18 juillet 2026 a laissé une vraie capture, écrite à la main sur demande du PO. La rétro du 24 septembre 2026 (PR #261) a rangé ses règles et ses fiches, mais n'a laissé aucune capture. Sans geste du PO, le débat se perd. La future vue rétros (fiche parkée) n'aurait rien à afficher.

Deuxième manque : la cérémonie retombe sur des règles générales. Le format prévoit la catégorie `feature`, mais rien ne pousse à la proposer. Une règle n'a pas de cible : rien ne dit si elle vaut pour tous, pour un agent ou pour un skill.

## Déjà livré (ne pas refaire)

- [x] Le lien explicite skill → règle (`applies:`) et agent → règle (`interactions:`) existe. Preuve : verbe « applique » dans `src/core/graph.ts`, [ADR-0040](../products/mega-city/docs/adr/0040-modele-fichiers-ezk-compile-schema-valide.md). Le trou noté par la fiche absorbée est comblé.
- [x] Les candidats-recette ont leur case ⏳ / ✅ / ❌, jamais pré-remplie. Preuve : `ezk-retro/SKILL.md`, temps 3.
- [x] `retire` existe et reste réversible. Preuve : `ezk-retro/SKILL.md`, section « Contrôle direct du PO ».

## Proposition (POC)

Le pattern [gabarit + extracteur + rendu](../products/mega-city/rules/documentation-guidelines/readable-deliverable-trio.md), en quatre pièces :

1. **Gabarit** `ezk-retro/references/capture-template.md` : « En clair », sections du récit, en-tête structuré, section « Suivi des décisions de la rétro précédente ».
2. **Extracteur** `retro:captures` : lit l'en-tête de chaque capture, vérifie le format, liste les décisions. `--check <fichier>` valide une capture avant la PR. `--json` nourrira la future vue rétros.
3. **Skill** `ezk-retro` : le temps 5 exige la capture et sa validation. Le temps 3 type chaque proposition (règle, feature, action, spike, recette), pose la cible d'une règle (`global`, `agent:<nom>` ou `skill:<nom>`) et demande de proposer une `feature` quand le symptôme est structurel. Une règle ciblée déclare sa portée par le lien explicite de sa cible. Le bundle déploie le texte, il ne porte pas la portée. `retire` enlève aussi ce lien.
4. **Modèle** : la capture du 18 juillet passe au format cible. Elle prouve que l'extracteur lit un vrai fichier.

Forme de l'en-tête : un bloc YAML. Chaque action porte `proposition`, `kind`, `target` (règles), `by` (qui a proposé), `status` (✅ ❌ ⏳), `decision` et `date`. Un statut ✅ ou ❌ sans décision ni date est refusé. Un statut ⏳ avec une date aussi : la case n'est jamais pré-remplie.

## Critères d'acceptation (reste réel)

- [ ] Le SKILL.md d'`ezk-retro` exige la capture au temps 5, avec le gabarit, la validation `retro:captures --check` et le lien de la capture dans la PR de rangement.
- [ ] Le gabarit existe, ouvre par « En clair », et figure dans la table des instances de la règle `readable-deliverable-trio` (test vert).
- [ ] `retro:captures` accepte la capture du 18 juillet et en liste les 7 décisions. Il refuse, avec le fichier et le champ nommés : un en-tête absent, un statut inconnu, une règle sans cible valide, un ✅ ou ❌ sans décision ni date, un ⏳ daté.
- [ ] Une proposition de type `feature` est acceptée par l'extracteur. Le temps 3 dit quand en proposer une.
- [ ] Une règle ciblée déclare sa portée par `applies:` ou `interactions:` de sa cible. Le SKILL dit que le bundle déploie le texte sans porter la portée, et `retire` enlève aussi le lien.
- [ ] La capture du 18 juillet porte l'en-tête cible, fidèle à son tableau « Décisions du PO ».
- [ ] Gate locale verte.

## Comment vérifier

```bash
pnpm --dir products/mega-city retro:captures
pnpm --dir products/mega-city retro:captures --check docs/captures/2026-07-18-retro-cinq-sprints.md
pnpm --dir products/mega-city exec vitest run src/core/__tests__/retro-capture.test.ts
```

Sabotage : retirer `date:` d'une action ✅ de la capture. La commande sort en erreur et nomme l'action.

## Suite (hors POC)

- Preuve par l'usage : la prochaine rétro réelle doit produire sa capture sans demande du PO. Cela se constate à ce moment-là.
- Déploiement ciblé du texte de la règle (livré seulement avec l'agent ou le skill visé). Aujourd'hui `expandProfile` ne prend les règles que dans les bundles : le lien déclare la portée, il ne filtre pas encore ce qui est déployé.
- Quatrième cible, demandée par le PO le 2026-08-26 : le LLM qui traite les retours (output-style). Non traitée ici.
- La page `ezk:map retros` consommera `retro:captures --json`. C'est sa propre fiche.
- Boucle d'élicitation pour des propositions plus riches.
- Rattrapage de la capture de la rétro du 24 septembre, si le PO le souhaite.

## Notes

- Priorité P2. Prérequis bloquant de la vue rétros.
- Origine : rétro du 2026-07-18, demande directe du PO. L'extractibilité vient du grooming des sous-pages `ezk:map` du 2026-08-26.

## ⤓ Absorbe (tri du 2026-09-30)

Cette fiche reprend désormais le périmètre de :

- [`20260826082120069`](done/20260826082120069_ezk-retro-propose-features-et-regles-ciblees.md) — ezk-retro — proposer des features ET des règles ciblées (agent / skill par composition), validées dans le rapport  
  _Pourquoi_ : Même skill : on améliore ezk-retro en une fois.

Critères intégrés au grooming du 2026-10-01.
