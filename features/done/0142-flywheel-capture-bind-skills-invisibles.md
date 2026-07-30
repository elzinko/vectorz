---
id: 0142
title: flywheel cassé — capture écrit des skills/rules que loadCatalog ne relit jamais
type: bug
priority: P1
product: mega-city
status: shipped
pr: local (squash-merge)
created: 2026-07-06
---

## Contexte / Problème
Le round-trip capture→bind ne se referme pas (bug confirmé par l'audit moteur du
2026-07-05) : (a) `capture` kind=skill écrit `skills/<id>.md` PLAT (DESTINATIONS,
`src/core/capture.ts:59-64`) alors que `loadSkills` ne lit que `skills/<name>/SKILL.md`
(`src/loaders/catalog.ts:104-114`) — une skill capturée n'entre jamais au catalogue, donc
n'est jamais bindée ; (b) une rule à id slashé canonique (ex. `clean-code/no-todo` →
`rules/clean-code/no-todo.md`) atterrit dans un sous-dossier que `listFiles` NON-récursif
ignore (`catalog.ts:44-50`). Seuls les agents referment la boucle. C'est le mécanisme
central d'ADR-0004 (flywheel) qui est silencieusement inopérant pour 2 kinds sur 4.

## Proposition
Fix minimal découplé (extrait de la fiche 0044) : DESTINATIONS écrit
`skills/<id>/SKILL.md` ; `listFiles` devient récursif pour `rules/` (ou les rules à id
slashé s'aplatissent — trancher avec la convention de la fiche 0006 qui va créer ~53 rules).
Test round-trip capture→loadCatalog→bind pour les 4 kinds.

## Critères d'acceptation
- [ ] une skill capturée apparaît dans `loadCatalog` puis dans le bind suivant
- [ ] une rule à id slashé capturée apparaît dans `loadCatalog` puis dans un bundle/bind
- [ ] test round-trip couvrant les 4 kinds (rule, skill, agent, interaction)
- [ ] gate locale verte (93+ tests)

## Notes
Découplé de la fiche 0044 (composes) sur recommandation de revue : bug avéré ≠ chantier
structurel. Précédent de typage : fiche 0025 (défaut de couture → bug P1). La convention
de chemin des rules doit être cohérente avec la migration 0006.
