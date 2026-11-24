---
id: "20261101131506254"
title: "Après un découpage, l'outil propose d'inscrire les fiches sœurs au plan"
type: feature
priority: P2
product: mega-city
milestone: preparation
version: v0.23.0
labels: [backlog, plan, decoupage]
status: shipped
pr: "local (5022a2ea)"
evidence: none # outillage et documents, sans écran
created: 2026-11-01
---

## En clair

Quand une fiche est découpée en sœurs, aucune ne rejoint le plan. L'outil de tirage les déclare
alors « hors plan » et ne les retient pas, même prêtes. Cette fiche fait proposer l'inscription des
sœurs au plan dans la même passe, avec l'accord du PO.

## Contexte / Problème

Constaté le 2026-11-01 : la fiche du contrat JSON du board, regroomée et découpée en quatre sœurs
(milestone `board`), n'était pas dans `features/PLAN.md`. Une fois prête, `ezk backlog plan-lot 1`
l'a listée « hors plan (prêtes, non retenues : la séquence vient du PLAN) ». Il a fallu l'inscrire à
la main, avec ses trois sœurs.

Le plan est tenu à la main (`skills/ezk-backlog/SKILL.md`, « séquence décidée ») : l'outil doit
proposer, pas écrire en silence.

## Valeur

Pour le PO qui découpe : les fiches qu'il vient de créer entrent dans la séquence sans geste oublié.
Pour le run autonome : plus de fiche prête bloquée « hors plan ».

## Proposition

Précisée au grooming du 2026-11-03 (run autonome), d'après le code. L'outil propose, il n'écrit pas
le plan : le plan reste tenu à la main.

1. **Une fonction pure rédige les lignes de plan.** Pour une liste de fiches absentes du plan, elle
   rend une ligne au format du plan, rangée par milestone :
   `` - `<id>` — <titre> · groom `` pour une idée, `` · build `` pour une fiche prête.
2. **Le découpage les imprime.** Après `ezk backlog apply split <source> --into <a>,<b>` (et à blanc
   avec `--dry-run`), la sortie dit quelles sœurs manquent au plan et donne leurs lignes, à copier sous
   la milestone de chaque sœur dans `features/PLAN.md`. Une sœur déjà au plan n'est pas reproposée.
3. **`plan-lot` dit comment inscrire une fiche « hors plan ».** Sous chaque fiche prête écartée faute
   d'être au plan, la sortie donne la ligne à copier et sa milestone.

```
aujourd'hui   split → sœurs créées → hors du plan → plan-lot : « hors plan » → inscription à la main, à deviner
après         split → « au plan, sous milestone `board` : - `<id>` — <titre> · groom » → copier la ligne
```

## Critères d'acceptation

- [x] Après un découpage, la sortie propose la ligne de plan de chaque sœur absente du plan, rangée
      sous sa milestone ; une sœur déjà au plan n'est pas reproposée.
- [x] `plan-lot` donne, pour chaque fiche prête « hors plan », la ligne à copier et sa milestone.
- [x] Aucune écriture du plan : `features/PLAN.md` ne change pas, hors l'entrée barrée de la source.

**Mesure de suivi** : sur les 5 prochains découpages, 0 fiche prête « hors plan » juste après.

## Comment vérifier

```bash
ezk backlog plan-lot 1
```

## Notes

- Née de la rétro légère du 2026-11-01 (P7 de la rétro), acceptée par le PO le même jour :
  [rétro du run des contrats JSON](../../docs/captures/2026-11-01-retro-run-contrats-json-light.md).
- Priorité P2 par défaut, comme les fiches de la rétro précédente : à ajuster au grooming.
- Groomée le 2026-11-03 (run autonome) : proposition précisée d'après le code ; « 0 fiche hors plan sur
  5 découpages » passe en mesure de suivi, car elle ne se prouve pas au build.
- Prête le 2026-11-03 : porte « prête » passée en run autonome (ezk-pm GO). Condition : un test sur la
  fonction pure, un sur la sortie de `apply split --dry-run`, un sur celle de `plan-lot`.
- **Preuves du build (2026-11-03).** Tests : la fonction pure (`plan-proposal.test.ts`), la sortie de
  `apply split --dry-run` sur un dépôt jetable (la sœur absente est proposée sous sa milestone, la sœur
  déjà au plan ne l'est pas, `PLAN.md` inchangé), et la sortie de `plan-lot` (ligne à copier sous une
  fiche hors plan).
