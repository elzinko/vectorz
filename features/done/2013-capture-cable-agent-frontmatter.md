---
id: 2013
product: mega-city
title: capture — câbler une interaction/competence capturée dans le frontmatter d'un agent
type: feature
priority: P1
status: shipped
pr: local (squash-merge)
created: 2026-06-26
---

## Contexte / Problème
Le vrai flywheel (cf. commentaire de `Agent` dans `docs/domain.ts` et ADR-0004 §a) :
`/capture ezk-reviewer --interaction "toujours signaler un secret hardcodé"` doit
**rédiger la règle ET l'ajouter aux `interactions[]` de l'agent ciblé**. Le POC 0002
écrit seulement l'artefact (rule/skill/agent) ; il ne **câble** pas encore l'id dans
les listes de frontmatter d'un agent existant.

## Proposition
Étendre `capture` : quand la cible est un agent (`--for <agentId>`), après avoir
écrit l'artefact, **append** son id dans `competences[]` (kind=skill) ou
`interactions[]` (kind=interaction) du frontmatter de l'agent — déterministe,
append-only sur la liste, jamais d'édition manuelle. Le plan pur calcule la
mutation ; la coquille I/O l'applique (parse+stringify gray-matter stable).

## Critères d'acceptation
- [ ] `capture <rule> interaction --for ezk-reviewer` ajoute l'id à `interactions[]` de l'agent
- [ ] idempotent : capturer deux fois n'ajoute pas l'id en double
- [ ] le calcul reste pur (plan), seule la coquille I/O écrit + commit
- [ ] le LLM ne range jamais (append liste = script seul)

## Notes
C'est ce qui rend le flywheel « vivant » : `bind` rechargera l'agent enrichi.
