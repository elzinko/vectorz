---
id: "20261114131614801"
title: "Une rétro relit une liste de sprints nommés et refuse un sprint déjà relu"
type: feature
priority: P2
product: mega-city
milestone: board
version:
labels: [sprint, theme:mission-control]
status: ready
blocked:
pr:
evidence: none # une option de skill et un en-tête de capture
created: 2026-11-14
---

# 20261114131614801 — Une rétro relit une liste de sprints nommés et refuse un sprint déjà relu

**En clair.** Aujourd'hui une rétro relit « les sprints depuis la dernière rétro », à la date près :
le 4 novembre, elle repropose six sprints dont quatre ont déjà été relus le même jour. Une rétro va
nommer les sprints qu'elle relit, refuser un sprint déjà relu, et chaque sprint saura quelle rétro
l'a relu. Mission control pourra griser les sprints déjà relus, et aucune rétro ne refera le même travail.

**Si tu arrives frais.** Un sprint clos laisse un compte rendu dans `docs/sprints/`, nommé par un
slug. Une rétro laisse une capture dans `docs/captures/`, avec un en-tête que la méthode lit.
`/ezk-retro run` est la cérémonie de rétro, une compétence (skill) Claude Code ; `ezk retro reports`
liste les comptes rendus à relire. Un lancement est une exécution autonome de la méthode.

## Contexte / Problème

Ce que l'écran attend. La page Rétros de la maquette du 11 novembre liste les sprints, grise ceux
qu'une rétro a déjà relus, et laisse en cocher pour la prochaine. Il lui faut un lien rétro → sprints
que la méthode publie.

Ce que la méthode fait aujourd'hui.

- Le périmètre de `/ezk-retro run` est un texte libre : « une PR, un sprint, une friction, la
  méthode en général ». Le lancement autonome l'appelle avec `"itération <slug/dates>"`, en texte aussi.
  `products/mega-city/skills/ezk-retro/SKILL.md:54` et `:69-70`, `skills/ezk-product-build/SKILL.md:490-491`
- `ezk retro reports` liste les comptes rendus datés du jour de la dernière capture ou après. Le
  compromis « même jour » est écrit dans le code.
  `products/mega-city/bin/retro-reports.ts:40-49`, `src/core/sprint-reports-since.ts:37-54`
- Vérifié le 14 novembre : la commande liste les six comptes rendus du 2026-11-04, alors que les deux
  captures de ce jour (sprints 27-28 et 29-30) en relisent déjà quatre. La méthode ne sait pas quel
  sprint a été relu.
- Aucune des 41 captures ne porte de clé `sprints:`. Le gabarit n'a qu'un `scope` en texte libre ;
  la capture des sprints 27-28 y écrit « sprints 27 et 28 du run… » en prose.
  `products/mega-city/skills/ezk-retro/references/capture-template.md:23-36`
- `ezk board show --json` ne publie que le compte des rétros ; les derniers sprints n'ont pas de
  champ `retro`.
  `products/mega-city/contracts/board-show/v1/schema.json:443-456`, `src/core/board-contract.ts:135`, `src/core/sprint-report-summary.ts:23-35`
- L'identifiant d'un sprint existe déjà : le slug de son compte rendu, publié dans
  `derniersSprints[].slug`. Les numéros 27 à 32 ne vivent que dans la prose des captures ; les
  comptes rendus du 4 novembre n'en portent aucun.
  `products/mega-city/src/core/sprint-report-summary.ts:14` et `:84`

## Proposition

La clé d'un sprint est le slug de son compte rendu (`docs/sprints/<date>-sprint-<slug>.md`). Le numéro
continu vient de
[Le sprint se publie avec son numéro continu](done/20261114131612204_sprint-publie-numero-but-branche.md) ;
il sert à l'affichage, le slug reste la clé (voir Notes).

1. La capture porte un en-tête `sprints: [<slug>, …]`. Le gabarit le définit. L'extracteur
   `products/mega-city/src/core/retro-capture.ts` le lit. `ezk retro captures --check` vérifie que
   chaque slug existe dans `docs/sprints/`. Le champ est facultatif : les 41 captures existantes
   restent valides, et `[]` veut dire « sprints non tracés ».
2. `/ezk-retro run --sprints <slug>[,<slug>…]` fixe le périmètre ; la compétence ne lit aucune option
   aujourd'hui. Les sprints n'ont pas à se suivre. Sans option, le périmètre par défaut est : les
   comptes rendus qu'aucune capture valide ne cite.
3. Un sprint déjà cité par une capture valide est refusé, avec le nom de cette capture. Une relecture
   volontaire demande une option explicite, par exemple `--relire`, notée dans la nouvelle capture.
4. `ezk retro reports` passe de « depuis la dernière capture » à « non cité par une capture
   valide ». Le compromis du même jour disparaît.
5. `ezk-product-build --retro` passe à la rétro les slugs des sprints qu'il vient de construire, à la
   place de `"itération <slug/dates>"`.
6. Publication : `ezk board show --json` ajoute `derniersSprints[].retro`, le fichier de la capture
   qui a relu le sprint, ou `null`. Le contrat `board-show` le décrit. Le lien dans l'autre sens,
   `sprints[]` par capture, se publie une seule fois, dans le contrat des captures de rétro porté par
   [Une page qui liste les rétros passées et leurs décisions](done/20260826072532537_vue-retros-actions-ezk-map.md).
   Pas de tableau `retros[]` en double dans `board show`.
7. Les captures récentes nomment leurs sprints par numéro dans leur nom et leur `scope`. On peut
   renseigner `sprints:` à la main pour elles. Les autres restent « non tracées ».

Hors périmètre : la page Rétros de cop1, qui consomme ; le bouton « Lancer la rétro »
([Demander une rétro depuis mission control](20261114131617010_demander-une-retro-depuis-mission-control.md)) ;
la profondeur de la cérémonie ([ezk-retro : un mode light](20261013131625303_ezk-retro-mode-light.md)).

## Critères d'acceptation

- [ ] `/ezk-retro run --sprints a,b` relit exactement les sprints `a` et `b`, qu'ils se suivent ou
  non ; sans option, elle relit les comptes rendus qu'aucune capture valide ne cite.
- [ ] La capture porte `sprints: […]` ; le gabarit, l'extracteur et `ezk retro captures --check` le
  lisent ; un slug absent de `docs/sprints/` est une erreur de `--check` ; les 41 captures
  existantes restent valides.
- [ ] Un sprint déjà cité par une capture valide est refusé par `run`, avec le nom de cette capture ;
  une relecture volontaire laisse une trace dans la nouvelle capture.
- [ ] `ezk retro reports` ne liste plus un compte rendu cité par une capture valide ; sur vectorz,
  les comptes rendus du 2026-11-04 déjà relus sortent de la liste.
- [ ] Le contrat `board-show` décrit `derniersSprints[].retro`, fichier de la capture ou `null`, et
  l'exemple rangé est égal à la sortie de la commande.
- [ ] `ezk-product-build --retro` passe les slugs des sprints construits ; la capture produite les
  porte dans `sprints:`.

## Comment vérifier

```bash
ROOT="$(git rev-parse --show-toplevel)"
# avant : six comptes rendus du 4 novembre ; après : seuls ceux qu'aucune capture ne cite
ezk --root "$ROOT" retro reports
# une capture renseignée : ses sprints ; un slug inventé est refusé par le contrôle de forme
ezk --root "$ROOT" retro captures --json | jq '.captures[] | select(.file | test("2026-11-04-retro-sprints-27-28")) | .sprints'
ezk --root "$ROOT" retro captures --check docs/captures/<capture-avec-un-slug-faux>.md
# le lien sprint → rétro, publié au board
ezk --root "$ROOT" board show --json | jq '.derniersSprints[] | {slug, retro}'
```

- Dans une session, rejouer `/ezk-retro run --sprints <slug-déjà-relu>` : la cérémonie refuse et
  nomme la capture.
- Tests :

```bash
pnpm --dir products/mega-city test -- src/__tests__/sprint-reports-since.test.ts src/__tests__/ezk-retro-capture-contract.test.ts src/__tests__/board-contract.test.ts
```

Pas de preuve d'écran : la fiche livre une option de compétence, un en-tête et un champ de contrat.

## Glossaire

- capture de rétro — le compte rendu d'une rétrospective, `docs/captures/AAAA-MM-JJ-retro-<slug>.md`,
  dont l'en-tête est lu par `ezk retro captures` ; elle est valide quand `--check` l'accepte.
- compte rendu de sprint — le fichier `docs/sprints/AAAA-MM-JJ-sprint-<slug>.md`, écrit à la clôture d'un sprint.

## Notes / décisions

- Origine : [la carte des écarts du 14 novembre](../docs/maquettes/2026-11-14-carte-des-ecarts-maquette-code-backlog.md),
  écart F2.
- Décision du PO du 14 novembre (point 1), à confirmer par le panel adverse avant d'être écrite en
  ADR : le vrai numéro d'un sprint est le compte continu depuis le début du projet ; il se calcule
  depuis l'historique des sprints scellés et `ezk board show --json` l'émet. Le compteur qui repart à
  1 par branche ne se publie jamais comme le numéro.
- Clé du lien rétro → sprint : la fiche retient le slug du compte rendu, déjà publié ; le numéro
  continu s'affiche à côté. La carte demandait de fixer l'identifiant avant de coder : si le PO
  préfère le numéro comme clé, la fiche sur le numéro continu passe devant celle-ci.
- Dépend de : [Le sprint se publie avec son numéro continu](done/20261114131612204_sprint-publie-numero-but-branche.md).
- Nourrit : l'alerte « sprint clos sans rétro » de [`ezk now --json` publie les alertes de la cloche](done/20261114131612944_ezk-now-json-alertes-de-la-cloche.md) ;
  le bouton de [Demander une rétro depuis mission control](20261114131617010_demander-une-retro-depuis-mission-control.md) ;
  la colonne « sprints relus » de [Une page qui liste les rétros passées](done/20260826072532537_vue-retros-actions-ezk-map.md).
- Fiches livrées voisines : [La rétro et l'archive lisent les comptes rendus](done/20261008072306360_retro-et-archive-lisent-les-comptes-rendus.md), la borne de date (ADR-0068) ;
  [La Vue d'ensemble résume le dernier sprint](done/20261104090517904_vue-ensemble-dernier-sprint-et-kpi.md) ;
  [Rétro systématique en fin d'itération](done/20260911224102584_retro-systematique-fin-iteration-multi-sprint.md)
  et [ezk-product-build enchaîne plusieurs versions](done/20261013131852375_product-build-boucle-multi-versions.md), les deux appelants de la rétro.
- Risque de taille : la fiche touche la compétence, le gabarit, l'extracteur, `--check`, `retro reports`,
  le contrat board et l'appelant : c'est la taille que le backlog marque `blocked: oversized`. Au
  grooming, la couper en deux si elle ne tient pas dans un sprint : la cérémonie (points 1 à 5), puis la publication (point 6).
- Décision à confirmer par le PO : renseigner `sprints:` à la main sur les captures récentes, ou laisser toutes les captures passées « non tracées ».
- Références :
  [ADR-0068](../products/mega-city/docs/adr/0068-compte-rendu-de-sprint-faits-rapport-commit-archive.md),
  [ADR-086](../docs/adr/ADR-086-la-methode-seul-lecteur-des-fiches-contrat-json.md).
- 2026-11-28 — Contrôle « prête » (ezk-pm) : GO. À couper en deux dans le sprint : d'abord l'en-tête `sprints:` des captures et sa publication, ensuite l'option `--sprints`, les refus et les reports. Si la seconde moitié déborde, elle est parkée.
