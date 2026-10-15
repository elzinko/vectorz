---
id: "20261015082118397"
title: "Rattachement : l'étape d'accueil de session (propose, jamais devine)"
type: feature
priority: P2
product: mega-city
milestone: board
version: v0.23.0
labels: [supervision, methode, multi-session, onboarding]
status: ready
blocked:
pr:
evidence: none # comportement de méthode ; prouvé par le journal (clé posée) + le texte
created: 2026-10-15
---

# 20261015082118397 — Rattachement : l'étape d'accueil de session

**En clair.** Quand tu ouvres une session toi-même, la méthode doit **te proposer** : « ta
demande ressemble au chantier *réalisation v0.17* — tu t'y rattaches, ou c'est à part ? ». Tu
réponds en un mot. Jamais deviné en silence. C'est ça, le rattachement « à la main » — l'autre
voie étant le pilote qui passe la clé à ses ouvriers.

**Si tu arrives frais.** Un *chantier* (run) = un travail de méthode ; sa *clé* vient de la
version. Détail dans [ADR-079](../docs/adr/ADR-079-run-et-session-deux-entites-multi-llm.md) §D3.

## Contexte / Problème

Sans ce pas, soit la session manuelle n'est reliée à rien (tu dois tout gérer à la main, risqué),
soit on devine le rattachement par co-présence dans le projet (faux et dangereux). On veut un pas
d'accueil qui rend le lien **facile** sans le rendre **deviné**.

## Proposition (ADR-079 §D3)

- À l'ouverture d'une session, une **étape d'accueil** (crochet `CLAUDE.md` + skill d'ouverture)
  lit les **chantiers ouverts** + la **version/le sprint en cours** et **propose** : rattacher à
  un chantier, ou autonome.
- L'humain **confirme** ; une **règle de config** peut auto-confirmer les cas clairs (ex. branche
  du sprint en cours) ; sinon la session est **autonome** (ou « hors méthode », visible comme
  telle).
- **Garde-fous** : advisory (pas un verrou), **ne bloque jamais**, **dégrade en autonome** si
  doute, **débrayable par config** du projet. En run autonome sans humain : clé passée par le
  pilote (explicite) ou autonome par défaut — aucune question.
- Tool-agnostique : vit côté méthode, pas dans un IDE précis.

## Critères d'acceptation

- [ ] À l'ouverture, la session voit les chantiers ouverts + la version en cours et **propose**
      rattachement/autonome ; rien n'est deviné en silence.
- [ ] Une règle de config auto-confirme un cas clair ; un cas ambigu demande ; par défaut autonome.
- [ ] L'étape est **débrayable** par la config du projet et **ne bloque jamais** le travail.
- [ ] Une session non rattachée apparaît « hors méthode » sur le board (cas 7B), pas invisible.

## Comment vérifier

- Ouvrir une session sur la branche du sprint en cours → l'accueil propose (ou auto-confirme) le
  rattachement ; le journal porte la bonne clé de chantier.
- Ouvrir une session pour un travail à part → reste autonome ; apparaît « hors méthode ».
- Désactiver l'accueil par config → aucune proposition, aucune gêne.

## Notes / décisions

- Décision : [ADR-079](../docs/adr/ADR-079-run-et-session-deux-entites-multi-llm.md) §D3 ; affine
  le volet « rattachement » de la [fiche de design](done/20261014122044421_board-runs-concurrents-identite-lisible.md).
- **Sœurs (sans chapeau)** : émetteur, read-model, découverte, chronologie+accueil —
  `milestone: board` + `v0.23.0`.
- Rejoint le besoin déjà noté d'un **rituel d'ouverture de session** ; lui donne un job précis.
