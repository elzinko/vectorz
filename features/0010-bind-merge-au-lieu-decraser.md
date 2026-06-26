---
id: 0010
title: bind — merge/backup au lieu d'écraser CLAUDE.md et les hooks existants
type: feature
priority: P1
status: todo
pr:
created: 2026-06-26
---

## Contexte / Problème
Revue de la fiche 0001 (finding F3). Le cap claude-code produit un `CLAUDE.md`
qui **écrase** tout contenu existant, et `applyPlan` **écrase** un
`.git/hooks/commit-msg` perso sans backup ni avertissement. Destructif dès qu'on
`bind` sur un vrai projet (pas un projet jouet). Déjà tracé en dette dans
[`docs/adr/0003`](../docs/adr/0003-moteur-bind-plan-pur-coquille-io.md).

## Proposition
La frontière I/O (`src/io/apply.ts`) lit l'état du projet et fusionne au lieu
d'écraser :
- `CLAUDE.md` : append/merge idempotent d'un bloc délimité (marqueurs
  `<!-- iamthelaw:start -->…<!-- iamthelaw:end -->`), réécrit uniquement ce bloc.
- hooks : si un hook existe et diffère, backup (`<stage>.bak`) ou refus explicite
  avec message, jamais d'écrasement silencieux.

Le **cœur reste pur** : le merge est une affaire de coquille I/O (lecture de
l'état projet), pas du plan. Le plan peut exposer une intention (`replace` vs
`merge-block`) que la coquille applique.

## Critères d'acceptation
- [ ] un `CLAUDE.md` existant conserve son contenu ; seul le bloc iamthelaw est (ré)écrit
- [ ] un hook `commit-msg` perso n'est jamais écrasé silencieusement (backup ou refus)
- [ ] idempotent : deux `bind` successifs ne dupliquent pas le bloc
- [ ] le calcul (load→expand→cap→plan) reste 100 % pur, testé sans FS

## Notes
Distinct de F1 (déjà corrigé) : ici la cible est *dans* le projet, le dégât est
borné mais réel sur un projet existant.
