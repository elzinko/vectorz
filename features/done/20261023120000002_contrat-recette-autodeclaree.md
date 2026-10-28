---
id: "20261023120000002"
title: "Contrat de recette auto-déclarée + catalogue (pilote muti validation/)"
type: chore
priority: P2
product: mega-city
milestone: recettes
version:
labels: [recettes, decouvrabilite, methode, contrat, spike]
depends:
status: shipped
pr: "local (e1b13c9b)"
evidence: none # spike de contrat ; preuve = un répertoire-pilote reconnu comme recette
created: 2026-10-23
---

# 20261023120000002 — Contrat de recette auto-déclarée + catalogue

## En clair

Un répertoire se déclare lui-même **recette réutilisable** en portant un petit fichier de déclaration.
On ne construit pas un système de recettes ailleurs. On pose juste un **contrat** qui vérifie si un
répertoire peut être vu comme une recette, parce qu'il contient ce fichier. Les projets balaient ces
déclarations comme un **catalogue** et peuvent dire « tiens, je tente cet outil ». Idée de Thomas,
2026-10-18. Pilote déjà posé dans muti : `apps/desktop/validation/RECIPE.md`.

## Contexte / Problème

Deux constats de la session du 2026-10-18 (muti).

1. **`SKILL.md` n'est pas le bon support pour déclarer un outil.** `SKILL.md` déclare un *skill* : une
   capacité qu'un humain invoque. Un outil, une recette ou un composant, c'est une *brique* qu'un skill
   (ou n'importe quel objet du domaine) réutilise. Les deux ne se confondent pas. Un répertoire peut
   porter un skill ET être une recette réutilisable : deux déclarations, deux fichiers.
2. **Déclarer et extraire sont deux axes différents.** L'**ADR-0013** encadre l'**extraction** d'un
   moteur générique : on attend un 2e usage (règle de trois), et son amendement du 2026-08-24 en fait
   même une **question à instruire**, pas un veto. Mais cela vise l'extraction, **pas la déclaration** :
   déclarer est bon marché et c'est CE QUI REND la découverte possible. Attendre un 2e besoin pour
   déclarer tue le catalogue. Donc on déclare tout de suite ; on extrait plus tard. *(La fiche citait
   « ADR-0015 » — corrigé : la règle du 2e cas est l'ADR-0013.)*

## Proposition

Réutiliser la **primitive recette existante**, pas un format neuf. Un répertoire d'un projet hôte se
déclare recette en portant un **fichier de déclaration** — un `RECIPE.md` à front-matter, le même
contrat que [`recipe-frontmatter.ts`](../../products/mega-city/src/core/recipe-frontmatter.ts). Un **scan
en lecture seule** bâtit le **catalogue** des recettes déclarées d'un projet : la même sortie que
`recipes/RECIPES.md`, étendue aux répertoires d'un projet hôte. Spike borné : éprouver le contrat sur
le pilote muti `apps/desktop/validation/` avant de généraliser. La découverte depuis un projet hôte
(la commande `ezk recipes`) et le garde-fou de dérive vivent dans la sœur
[001](20261023120000001_declarer-outils-recettes-methodes-projet.md), qui dépend de celle-ci.

## Critères d'acceptation

Niveau *spike* — on cherche la forme du contrat, pas encore le moteur.

- [x] Un contrat minimal décide si un répertoire est une recette (il porte le fichier de déclaration).
- [x] Un scan liste les recettes déclarées d'un projet (catalogue).
- [x] Un dossier calqué sur le pilote muti `apps/desktop/validation/` (hors dépôt, non touché) est reconnu par le contrat.
- [x] La déclaration d'une recette est distincte de celle d'un skill (`SKILL.md`).
- [x] Le contrat réutilise le front-matter recette existant (`recipe-frontmatter.ts`), sans schéma concurrent.

## Comment vérifier

- Lancer le scan sur un projet portant au moins un `RECIPE.md` → le catalogue le liste.
- Un répertoire sans déclaration n'apparaît pas au catalogue.

## Notes / décisions

- **Origine** : rédigée dans muti le 2026-10-18 (fiche `muti:features/20261018110931402_contrat-recette-autodeclaree.md`,
  type spike). La fiche muti le dit : « c'est de la méthode (vectorz)… à reprendre dans une session
  vectorz ». Rapatriée ici le 2026-10-23. **Ne pas** déplacer ni modifier la fiche muti ni son pilote.
- Milestone `recettes`. Sœur de [Déclarer les outils/recettes/méthodes](20261023120000001_declarer-outils-recettes-methodes-projet.md),
  qui **dépend de celle-ci** (`001 depends: 002`) : la déclaration est l'atome, le catalogue et la
  découverte en dérivent.
- **Dépendance constatée le 2026-10-28** : la primitive recette existe déjà —
  [`recipe-frontmatter.ts`](../../products/mega-city/src/core/recipe-frontmatter.ts) (contrat de
  front-matter) et `bin/regen-recipes.sh` (catalogue `recipes/RECIPES.md`). Le spike réutilise ce
  contrat, il ne crée pas de format neuf.
- **2026-10-28 — tirée (`ready`) sur décision PO.** Le panel du 2026-10-27 recommandait déjà « 002
  avant 001 » : 002 est l'atome que le panel endosse. La preuve ne repose que sur un cas (muti), mais
  ce n'est pas un veto (règle
  [`agent-ops/preuve-mince-question-pas-veto`](../../products/mega-city/rules/agent-ops/preuve-mince-question-pas-veto.md),
  ADR-0013 amendé). Le PO tranche d'avancer maintenant : la découvrabilité servira en avance.
- **2026-10-28 — spike livré (local).** La forme du contrat est éprouvée : cœur **pur**
  [`recipe-contract.ts`](../../products/mega-city/src/core/recipe-contract.ts) + 13 tests
  ([`recipe-contract.test.ts`](../../products/mega-city/src/core/__tests__/recipe-contract.test.ts)).
  Un dossier EST une recette s'il porte un `RECIPE.md` à front-matter recette — **mêmes champs** que
  `recipe-frontmatter.ts` / `regen-recipes.sh` (`id`, `title`, `makes`, `source`, `status`), aucun
  schéma neuf. Le scan liste les dossiers déclarés, écarte les non-déclarés **et** les `RECIPE.md`
  mal formés sans planter. Revue adverse `ezk-reviewer` : **GO** — elle a attrapé deux vrais bugs
  (scan qui plantait sur un YAML cassé ; `id` numérique nu silencieusement corrompu), corrigés et
  gardés par des tests. **Hors scope, à la sœur [001](20261023120000001_declarer-outils-recettes-methodes-projet.md)** :
  le marcheur de dossiers sur disque et la commande terminal `ezk recipes` (découverte depuis un
  projet hôte). Le cœur est pur (ADR-0003) ; il reçoit des dossiers déjà lus.
