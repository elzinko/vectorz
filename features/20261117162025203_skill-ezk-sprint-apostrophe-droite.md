---
# id : horodatage AAAAMMDDHHMMSSmmm QUOTÉ (17 chiffres > MAX_SAFE_INTEGER) posé par `add` (scripts/mint-id.sh) — nom <id>_<slug>.md
id: "20261117162025203"
title: La phrase ajoutée au skill ezk-sprint prend l'apostrophe droite du fichier
type: chore
priority: P3
product: mega-city
milestone:
version:
labels: [sprint, methode]
status: ready
pr:
evidence: none # typographie d'un skill et son test, aucun écran
created: 2026-11-17
---

# 20261117162025203 — La phrase ajoutée au skill ezk-sprint prend l'apostrophe droite du fichier

**En clair.** Le skill ezk-sprint compte 136 apostrophes droites et une seule courbe. Cette apostrophe
courbe se trouve dans la phrase ajoutée au sprint 14, et son test la fige. Si quelqu'un uniformise les
apostrophes du fichier, le test casse sans raison. On met l'apostrophe droite, dans la phrase et dans
le test.

**Si tu arrives frais.** Le test `ezk-sprint-fiche-sur-main.test.ts` vérifie que deux phrases figurent
dans le skill. Il compare le texte exact, apostrophes comprises.

## Contexte / Problème

Réserve P3 de la revue adverse de la fiche
[Le skill ezk-sprint met la fiche et sa livraison sur main aux bons moments](done/20261117155420514_sprint-fiche-et-livraison-sur-main.md).

## Proposition

Remplacer l'apostrophe courbe par l'apostrophe droite, dans la phrase du skill et dans le test.

## Critères d'acceptation

- [x] Le skill ezk-sprint ne contient plus d'apostrophe courbe.
- [x] Le test lit la phrase avec l'apostrophe droite, et il passe.

## Comment vérifier

```bash
grep -c "’" products/mega-city/skills/ezk-sprint/SKILL.md   # 0
cd products/mega-city && pnpm exec vitest run src/__tests__/ezk-sprint-fiche-sur-main.test.ts
```

## Notes / décisions

- Créée et tirée au sprint 16 du 17 novembre, par délégation du PO absent.

**Livraison du 2026-11-17.** Revue adverse `ezk-reviewer` : GO, 2 critères prouvés. Deux réserves P3
restent ouvertes. La garde « pas d'apostrophe courbe » vise tout le fichier, comme le dit le critère 1.
Les libellés du test gardent leurs apostrophes courbes. Le même lot corrige aussi `type: fix` en
`type: bug` dans la fiche du sprint 15, signalé par la session parallèle : la valeur n'était pas admise.
