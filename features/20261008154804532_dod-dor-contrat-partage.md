---
id: "20261008154804532"
title: DoD et DoR — des listes de règles/bundles qui définissent prêt et fini (contrat partagé)
type: feature
priority: P0
product: mega-city
milestone:
version:
labels: [loi, revue]
status: idea
pr:
evidence: none
created: 2026-10-08
---

# 20261008154804532 — DoD et DoR, listes de règles/bundles (contrat partagé)

**En clair.** La DoR (prête à tirer) et la DoD (finie) sont des **listes** : chacune référence des
**règles et/ou des bundles** qui disent ce qui doit tenir. Ce ne sont **pas** des bundles ; ce
sont des **fichiers** qui en **composent**. Aujourd'hui la DoR vit en partie dans `.vectorz/dor.yml`
et en prose, il n'y a pas de DoD, et `ezk-reviewer` recopie à la main les règles qu'il contrôle.
On veut que la DoR et la DoD soient des listes **partagées** : le producteur (`ezk-dev`) les
**applique**, le vérificateur (`ezk-reviewer`) les **contrôle**, en lisant **la même liste**.

**Si tu arrives frais.** *DoR* = Definition of Ready (gate d'entrée, au `ready`). *DoD* =
Definition of Done (gate de sortie, à la revue/merge). *Contrat partagé* = une liste lue des deux
côtés, pour que le vérificateur ne lise jamais « l'essence » du producteur. Une *règle* est un
atome ; un *bundle* groupe des règles ; une DoR/DoD **référence** règles et/ou bundles. Frontière
moteur/méthode : ADR-0039.

## Contexte / Problème

- Il n'existe **pas** de liste DoD. Le bundle `development.yml` **mélange** des critères à
  **contrôler** (`acceptance-criteria-before-merge`, `adversarial-review-before-merge`…) et des
  règles de **procédé** du dev (`local-first-feedback`, `use-project-scripts`…).
- `ezk-reviewer` **recopie à la main** 3 règles dans son `interactions:`. Dev et reviewer peuvent
  donc contrôler un contrat différent de celui qui est appliqué — entorse au
  single-source-of-truth (le principe d'ADR-0029).
- La DoR vit en prose (socle 3 critères dans `ezk-backlog`) **plus** `.vectorz/dor.yml` : c'est
  **déjà** une liste DoR par projet (overlay opt-in, ADR-0016 / ADR-0050). **À garder**, pas à
  jeter.

## Proposition

1. **Test pas cher d'abord — condition de la fiche.** Vérifier si les règles appliquées par
   `ezk-dev` et contrôlées par `ezk-reviewer` **divergent vraiment** aujourd'hui, et si une rétro
   l'a noté. **Sans divergence prouvée, la fiche se re-parque** (décision PO 2026-10-08).
2. Définir la **DoD** et la **DoR** comme des **listes** référençant des **règles et/ou des
   bundles** (via F1). Une liste n'est pas un bundle : elle **compose**.
3. La **même** liste est lue des deux côtés : `ezk-dev` l'applique, `ezk-reviewer` la contrôle —
   plus de recopie manuelle. **Garder la frontière adverse** : la DoD porte des critères de
   « done », **pas** le procédé du dev (sinon on émousse la revue, ADR-0059).
4. Si un sous-groupe de règles recommence, en faire un **bundle** (via F1) que la liste
   référence. Le bundle reste un sac de règles **bête** ; le rôle (applique/contrôle) et le
   moment (le checkpoint) vivent dans la **méthode**, jamais dans le fichier.
5. **DoR** : la *config de checkpoint* (`slots`, `heading`, `items`, `health.min-ready`)
   **reste** dans `.vectorz/dor.yml` ; seul le *contenu des critères* peut migrer vers des
   règles/bundles référencés. **Pas de nouveau `kind`** ; honnêteté ADR-0050 tenue (garantie ⇔
   gate réel).

## Critères d'acceptation

- [ ] Test de divergence dev↔reviewer **fait et consigné** ; la suite n'est engagée **que** si la
      divergence est prouvée.
- [ ] La DoD est une **liste** référençant règles et/ou bundles — **pas** un bundle — contenant
      **uniquement** des critères de « done » (aucun procédé dev).
- [ ] `ezk-dev` et `ezk-reviewer` lisent la **même** liste DoD (via F1) ; aucune recopie manuelle.
- [ ] Le reviewer n'hérite **pas** des règles de procédé du dev (frontière adverse préservée).
- [ ] La config de checkpoint DoR (`.vectorz/dor.yml`) est **préservée** ; aucun `kind` nouveau ;
      honnêteté ADR-0050 tenue.

## Comment vérifier

```bash
pnpm --dir products/mega-city test
pnpm --dir products/mega-city graph:check
# montrer que ezk-dev et ezk-reviewer lisent la MÊME liste DoD
```

## Glossaire

- `contrat partagé` — une liste (DoR/DoD) référencée par un producteur (applique) et un
  vérificateur (contrôle), définie une seule fois.
- `liste DoR/DoD` — un fichier qui **compose** des règles et/ou des bundles ; ce n'est pas un
  bundle.
- `frontière moteur/méthode` — règle et bundle sont moteur ; rôle et checkpoint sont méthode
  (ADR-0039).

## Notes / décisions

- **Conditionnée au test de divergence** (décision PO 2026-10-08) : on lance le test pas cher ;
  on n'implémente **que** si dev et reviewer divergent réellement, sinon re-park.
- **Dépend de F1** (20261008154803440_consommateur-cite-un-bundle.md). **ADR neuf** à créer,
  amendant **ADR-0016** (cycle DoR) et **ADR-0050** (couche `.vectorz/`).
- Voisines (à référencer, pas fusionner) : **0053 — gate DoD sur métrique**
  (0053-gate-dod-metrique.md), **le relecteur coche les critères**
  (20261003075821760_relecteur-coche-les-criteres.md).
- Ordre : au **PLAN** après F1 (prérequis). Avis : `ezk-architect` GO-avec-réserves fortes
  (liste composant règles/bundles, pas de `kind`, honnêteté 0050, checkpoint DoR préservé) ;
  `ezk-pm` P0 après F1 ; `product-brainstorming` conditionner au test (retenu).
