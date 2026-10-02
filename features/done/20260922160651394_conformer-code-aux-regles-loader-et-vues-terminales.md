---
id: "20260922160651394"
title: "Mettre le code en conformité avec les règles de dev récentes"
type: chore
priority: P2
product: mega-city
version: V0.1
epic:
labels: [socle]
status: shipped
pr: "#270"
evidence: none # code / outillage, pas d'écran
created: 2026-09-22
---

# Conformer le code aux règles `fiche-read-via-loader` + `active-views-exclude-terminal-status`

## En clair

La rétro du 2026-09-20 a posé deux règles `MUST`. Le code existant les violait dès leur activation.
Le **volet B** est livré : les vues du plan cachent les fiches closes (PR #256). Il reste le **volet A** :
des outils lisent encore le front-matter des fiches avec leur propre `awk` ou leur propre regex, au
lieu du loader testé. Ce POC migre les lecteurs qui n'appellent aucune décision d'architecture. Il fait
aussi émettre le front-matter de `ezk-chef extract` par la lib YAML (fiche absorbée). Enfin il fige, par
un test, la liste de ce qui reste. Le reste part en « Suite ».

**Si tu arrives frais.** Le *front-matter* est le bloc YAML entre deux `---` en tête d'une fiche. Le
*loader* (`src/loaders/fiches.ts`) est l'unique code testé qui sait le lire.

> **MAJ 2026-09-22 : volet B livré dans la PR #256.** Les vues `plan-*` filtrent les statuts
> terminaux. La règle `active-views-exclude-terminal-status` est pleinement respectée.

## Contexte / Problème

Retour Codex sur la PR #256 (2026-09-21), deux constats.

1. **Lecteurs de fiche en parse maison.** La règle `development/fiche-read-via-loader` exige que tout
   lecteur passe par `loadFiches` ou `readField`. Or plusieurs outils parsent le front-matter à la
   main. Un `awk` ne sait ni lire une valeur quotée avec `#`, ni distinguer le front-matter du corps.
2. **Vues `plan-*` qui laissaient fuiter les terminaux.** Corrigé par le volet B.

La liste « legacy » de la règle nomme trois lecteurs. L'inventaire réel du 2026-10-01 en trouve plus
(voir Notes). Le test de garde ci-dessous rend cette liste exacte et la fige.

Le sprint « verrou de statut » (PR #267) a déjà centralisé le schéma (`src/core/fiche-schema.ts`).
Cette fiche part de là et ne touche pas au schéma.

## Proposition (POC)

**Volet A, ce qui est migré :**

1. **Un module de lecture pour le bash.** `src/loaders/fiche-rows.ts` sort les onze champs que les
   anciens `extract()` awk lisaient, en s'appuyant sur `frontMatter` et `readField`. Un petit CLI
   `bin/fiche-rows.ts` l'expose aux scripts.
2. `bin/portfolio.sh` appelle ce CLI. Plus d'`awk` de front-matter. Il gagne son premier test,
   `bin/test-portfolio.sh`.
3. `bin/plan-head.ts` lit par `loadFiches`. Son `readField` maison et son scan disparaissent.
   `fmField` de `planning-views.ts` délègue aussi au loader.
4. `bin/ezk-chef-extract.sh` lit titre et PR par le même CLI.

**Fiche absorbée, ce qui est migré :**

5. `ezk-chef extract` émet son front-matter par la lib `yaml` (`src/core/recipe-frontmatter.ts`),
   plus par `echo`. Les champs libres restent entre guillemets doubles, pour les lecteurs `awk` des
   recettes.

**Garde :**

6. `fiche-read-via-loader-contract.test.ts` applique la mesure de la règle. Un nouveau parse de
   front-matter hors loader fait échouer la suite. Une entrée migrée doit sortir de la liste.
7. La règle est mise à jour avec la liste exacte.

## Critères d'acceptation

- [x] Les vues `plan-*` ne présentent plus un statut terminal comme actif : exclus de `plan-delta`,
  marqués `closed` dans `window.EZK_PLAN`. *(Volet B, PR #256.)*
- [x] La règle `active-views-exclude-terminal-status` est pleinement conforme. *(Volet B.)*
- [x] `fiche-rows` rend les onze champs, testés : valeur quotée avec `#` ou `:`, commentaire de fin,
  champ cité dans le corps, produit absent. Preuve : `fiche-rows.test.ts`, 8 tests.
- [x] `portfolio.sh` lit par ce module. `PORTFOLIO.md` régénéré est identique à l'octet. Preuve :
  comparaison avant/après sur les fiches du dépôt, et `test-portfolio.sh` qui échoue sur l'ancien `awk`.
- [x] `plan-head.ts` lit par `loadFiches`. La sortie de `plan:head` est inchangée. Preuve : sortie
  comparée avant/après.
- [x] `ezk-chef extract` lit par le CLI et émet par la lib YAML. Un titre hostile (`:`, `#`,
  guillemets, antislash, accents) donne un front-matter valide pour `yaml` ET `gray-matter`, avec le
  titre que voit le loader. Preuve : cas J de `test-ezk-chef-extract.sh`, rouge sur l'ancien script
  (`Invalid escape sequence`), vert sur le nouveau ; `recipe-frontmatter.test.ts`, 14 tests.
- [x] La liste legacy de la règle est exacte et figée par un test : un nouveau parse hors loader
  échoue, une entrée migrée sort de la liste. Preuve : `fiche-read-via-loader-contract.test.ts`
  (13 entrées restantes, chacune avec sa raison).

## Comment vérifier

```bash
# Le module de lecture, le générateur de front-matter et le garde de la règle
pnpm --dir products/mega-city exec vitest run fiche-rows recipe-frontmatter fiche-read-via-loader-contract
# extract : titres hostiles, front-matter valide des deux parseurs
bash products/mega-city/bin/test-ezk-chef-extract.sh | tail -6
# portfolio : son test, puis la vue régénérée est identique (aucune sortie attendue)
bash products/mega-city/bin/test-portfolio.sh | tail -2
bash products/mega-city/bin/portfolio.sh . && git diff --stat PORTFOLIO.md
# plan:head inchangé
pnpm --dir products/mega-city plan:head
```

## Suite (hors POC)

- **`regen-backlog.sh` et sa copie vendored.** Les deux copies doivent rester identiques (test
  `bin ≡ skill`), et la copie vendored sert hors monorepo, sans `tsx` ni loader. Migrer exige une
  décision : repli `awk` gardé par un test de parité, ou bundle JS compilé dans le skill, ou
  abandon du mode copie. À trancher par ADR court.
- **`ezk-archive/scripts/check.sh` et `ezk-sprint/scripts/check.sh`** : lecteurs bash dans des skills
  déployables hors monorepo. Même question de vendoring.
- **`sprint-metrics/adapters/repoSource.ts` et `tools/outcomes/sources.ts`** : deux lecteurs
  TypeScript qui appliquent leurs regex sur le fichier ENTIER. Simples à migrer (`loadFiches`), mais
  sans test aujourd'hui : écrire d'abord le test.
- **Autres émetteurs de front-matter** : `src/review/render.ts` (quotage maison, correct), les
  scripts `ezk-backlog add` et `ship`, et les fixtures de test en chaîne brute.
- **Migrations `apply-003` et `apply-005`** : scripts jetables qui réécrivent des fiches en place.
- **Règle `yaml-emission-via-lib` absente de tout bundle** (`bundles/development.yml` en porte 15
  pour 16 règles). Elle n'est donc matérialisée dans aucun profil. Décision de méthode : au PO.

## Notes / anti-doublon

- **Née du retour Codex sur la PR #256** (les deux règles de la rétro 2026-09-20). Recoupe la note de
  carnet N5 (aligner les vues bash sur `TERMINAUX`) et l'élargit aux vues `plan-*`.
- Voisin : [20260910155608287](../20260910155608287_problematique-regles-ezk-typologie-verification-mesure.md)
  (typologie et vérification des règles). Cadre général ; ici, c'est la mise en conformité concrète.
- **Inventaire des parses de front-matter hors loader (2026-10-01).** Migrés par ce POC :
  `bin/portfolio.sh`, `bin/plan-head.ts`, `bin/ezk-chef-extract.sh`, `fmField` de `planning-views.ts`.
  Restent 13 fichiers, listés avec leur raison dans `fiche-read-via-loader-contract.test.ts` :
  `bin/regen-backlog.sh` et sa copie dans le skill `ezk-backlog`, `ezk-archive/scripts/check.sh`,
  `ezk-sprint/scripts/check.sh`, `repoSource.ts`, `tools/outcomes/sources.ts`, la sonde de
  `fiche-validator.ts`, `apply-003`, `apply-005` et deux scripts python jetables. Hors fiches (recettes,
  méta de diagramme) : `bin/regen-recipes.sh`, `ezk-diagram/scripts/publish.sh`.
- **Convention** : un titre qui contient ` #` doit être quoté. Lu par le loader, un `#` précédé d'un
  blanc ouvre un commentaire YAML, donc le titre nu serait coupé. L'ancien `awk` le gardait en entier,
  ce qui n'était pas du YAML correct. Aucune fiche n'est concernée : zéro titre nu avec ` #` dans
  `features/` et `features/done/` (vérifié par grep le 2026-10-01).
- **Décision de grooming** : le `title` d'une recette est celui que voit le loader (`readField` ne
  dé-échappe pas). Un titre contenant `\"` garde donc ses antislash, comme au board. Le dé-échappement
  est un autre chantier, il toucherait tous les consommateurs du loader.

## ⤓ Absorbe (tri du 2026-09-30)

Cette fiche reprend le périmètre de
[`20260830194601307`](20260830194601307_front-matter-emis-par-lib-yaml.md) : front-matter généré
émis et validé par la lib YAML, jamais par concaténation. Critères repris ici : titre hostile valide
(fait pour `ezk-chef extract`), générateurs émettant par la lib (fait pour `ezk-chef extract`, le
reste en « Suite »), fixtures re-parsées par le vrai parseur (fait pour les nouveaux tests).
