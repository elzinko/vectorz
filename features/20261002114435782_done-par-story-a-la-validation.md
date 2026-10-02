---
id: "20261002114435782"
title: La fiche d'une story arrive en done avec son merge, quel que soit le canal
type: feature
priority: P1
product: mega-city
milestone:
version: V0.5
labels: [sprint]
status: ready
pr:
evidence: none # changement de méthode/outillage, pas d'écran
created: 2026-10-02
---

# 20261002114435782 — La fiche d'une story arrive en done avec son merge

**En clair.** Aujourd'hui, une story merge son code, mais sa fiche reste « à faire » : le passage
en `done/` est repoussé dans des PRs de rangement (`#314` range 8 fiches d'un coup le 2026-10-01).
Du coup, chaque ouverture de session commence par un `reconcile`/`regen` de rattrapage. On veut que
la fiche d'une story arrive en `done/` **dans le même merge que son code**, quel que soit le canal
de merge, et le `reconcile` redevient l'exception.

**Si tu arrives frais.** Une *fiche* est une carte de backlog (un fichier `.md`). La passer *en
done* = mettre `status: shipped` et déplacer le fichier dans `features/done/`. *DoD* = Definition
of Done, la liste des conditions pour accepter une story. `ship` est la seule commande qui fait ce
passage ; `reconcile` le propose quand un merge s'est fait hors du flux.

## Contexte / Problème

**Le symptôme, daté.** Dans l'historique des PRs du 2026-10-01, le code voyage par des PRs
`feat/<id>-<slug>`, mais le passage en `done/` voyage à part, en lot, dans des PRs dédiées :
`#314` (8 fiches), `#313` (3), `#306` (10), `#294` (8), `#285` (7), `#277` (3), `#272` (4). Le
geste « ranger la fiche » est décroché de la validation de chaque story et repoussé en fin de lot.
C'est cette corvée que le PO subit à chaque démarrage (demande PO du 2026-10-02 : « j'en ai marre
de gérer ça avec un regen ou conciliate à chaque démarrage de session »).

**Une décision déjà prise, mais jamais construite.**
[ADR-0049 (ship dans la PR)](../products/mega-city/docs/adr/0049-ship-fiche-dans-la-pr-vues-post-merge.md)
impose l'ordre « valider → shipper → merger » : le `ship` est le dernier commit de la PR, ajouté
après le GO de revue, **avant** le squash. La fiche
[ship sûr](done/20260830194601233_ship-transactionnel-liens-vues.md) a repris ce critère et l'a
déclaré « dans le POC ». Elle a livré la commande `ship` en une seule transaction, mais **pas le
changement d'ordre**. Constat du 2026-10-02 : l'étape 10 d'`ezk-sprint` et `ezk-pr ship` font
toujours « merge, **puis** ship ». Quand le PO merge par l'UI GitHub, il passe donc avant le `ship`,
à chaque fois. Ce n'est pas le canal de merge qui fuit : même le flux merge avant de shipper.

```
ADR-0049              revue GO ──▶ commit ship dans la PR ──▶ merge
skills aujourd'hui    revue GO ──▶ merge ──▶ ship              ← le clic UI passe avant le ship
```

**Le contexte a changé.**
[ADR-0054 (cycle de vie sprint/session)](../products/mega-city/docs/adr/0054-cloture-sprint-vs-archive-session.md)
pose `story ⊂ sprint ⊂ session` : un sprint porte désormais **plusieurs user stories**, une par
`ezk-dev`. La DoD doit donc être vérifiée **par story**. Le passage en `done` devient un **item de
la DoD de la story**, appliqué quand la story est validée — pas une corvée de fin de session, ni un
ship de fin de lot.

**Hors périmètre : le statut « en cours ».** Aucune fiche n'a jamais été « en cours », ce qui rend
le portier d'`ezk-sprint` aveugle. Ce geste est sorti dans la fiche sœur
[« En cours » se déduit des branches](20261002130235353_en-cours-deduit-des-branches.md) : il ne
cause pas la corvée de rattrapage, et il touche au schéma des statuts.

## Proposition

Le besoin : la DoD d'une story inclut « sa fiche est en `done/` », et ce passage atterrit avec le
code, quel que soit le canal de merge. **Effet visé** : à l'ouverture d'une session,
`reconcile`/`regen` ne rattrape plus rien en routine. `reconcile` reste le filet pour un merge
vraiment hors radar.

Avis d'architecte du 2026-10-02 (grooming) : **piste C, c'est-à-dire construire l'ADR-0049.**

- Le commit `ship` entre dans la PR dès que la DoD est verte : revue `ezk-reviewer` GO, validation
  verte, PR ouverte (son numéro est connu).
- L'étape 10 d'`ezk-sprint` ne fait plus que le merge. `ezk-pr ship` ajoute le commit `ship` s'il
  manque, avant `gh pr merge`.
- Le canal de merge ne compte plus : UI GitHub, `gh` ou flux, la fiche arrive en `done/` avec le
  code, d'un seul coup.
- Un NO-GO après le commit `ship` le retire de la branche (ADR-0049).
- Mode sans PR (`pr: false`) inchangé : un seul acteur local, et le sha du squash n'existe qu'après
  le merge.
- Pas de nouvel ADR : on construit l'ADR-0049, puis on le passe « Accepté ».

**Pistes écartées.**

- **B — rattrapage automatique à l'arrivée sur `main`** : écartée. Elle contredit
  [ADR-0018](../products/mega-city/docs/adr/0018-reconciliation-done-etat-reel-des-prs.md)
  (`reconcile` propose, ne bascule jamais), ADR-0049 (aucun déclencheur après le merge) et
  [ADR-0052](../products/mega-city/docs/adr/0052-merge-local-first-github-execute-le-squash-main-se-realigne.md)
  (GitHub exécute le merge, rien d'autre n'écrit sur `main`).
- **A — garde pré-merge** : gardée comme **filet**, pas comme mécanisme, et renvoyée en Suite. Un
  check CI rougit quand une PR `feat/<id>-…` n'a pas sa fiche dans `done/`. Sans protection de
  branche, il ne bloque pas le bouton de l'UI, mais il rend l'oubli visible avant le clic.

## Critères d'acceptation

- [x] La DoD d'une story, dans `ezk-sprint`, liste « fiche en `done/` + `status: shipped` » parmi
      ses conditions, **au niveau story** (pas sprint, pas session).
- [x] Dans `ezk-sprint`, le commit `ship` arrive **après** le GO de revue et la validation verte,
      **avant** le merge ; l'étape 10 ne fait plus que merger. **Preuve anti-triche** : sur la
      première PR de story construite après le changement, la liste de ses commits montre le
      `ship` **avant** le merge. Réécrire le texte du skill ne suffit pas : c'est exactement ce que
      la fiche « ship sûr » avait déclaré sans que l'ordre change.
- [x] `ezk-pr ship` ajoute le commit `ship` à une PR qui ne l'a pas, **avant** `gh pr merge`.
- [ ] Une PR de story mergée **depuis l'UI GitHub** arrive sur `main` avec sa fiche déjà dans
      `done/`. *Se prouve au merge de la PR qui livre cette fiche.*
- [x] Un NO-GO de revue arrivé **après** le commit `ship` retire ce commit : la branche ne présente
      plus la story comme livrée. Le retrait est un commit de revert : pas de réécriture
      d'historique, pas de `push --force`.
- [x] `reconcile` détecte toujours une PR mergée **sans** commit `ship` (story faite hors du flux)
      et propose son `ship`.
- [x] Le mode sans PR (`pr: false`) ne régresse pas : squash local, puis `ship <id> local (<sha>)`.
- [x] L'ADR-0049 passe « Accepté ».

**Mesure de suivi** — à relever après livraison, ne se coche pas à la PR :

- sur le lot livré suivant, aucune PR « ship en lot » de rattrapage ;
- à l'ouverture de 3 sessions d'affilée, `reconcile` ne propose aucune fiche.

## Comment vérifier

```bash
# Ordre des gestes, sur la première PR de story construite après le changement (<N>) :
gh pr view <N> --json commits -q '.commits[].messageHeadline'
#   → « docs(features): ship <id> #<N> » figure dans la PR, avant le merge.

# Après un merge fait depuis l'UI GitHub :
git fetch origin main
git ls-tree --name-only origin/main features/done/ | grep <id>
#   → la fiche est dans done/, sans PR de rattrapage.

# Non-régression du mode sans PR (squash local puis ship local) :
pnpm --dir products/mega-city test:scripts
```

- **NO-GO** : après le commit `ship`, lancer
  `bash products/mega-city/skills/ezk-pr/scripts/ship-in-pr.sh undo --repo . --fiche-id <id>` ; la
  fiche revient sous `features/` et un commit de revert annule le `ship`.
- **Garde du merge** : `ship-merge.sh --remote` refuse (exit 3) une branche de story sans son
  `ship`, avant tout appel à `gh`. Le test `skills/ezk-pr/scripts/test-ship-in-pr.sh` rejoue
  `check`, `add`, `undo` et cette garde sur des dépôts jetables.
- **Filet** : merger une PR **sans** commit `ship`, puis lancer `/ezk-backlog reconcile` ; il
  propose le `ship` de cette fiche.
- **DoD** : relire la section DoD d'`ezk-sprint` ; la ligne « fiche en `done` » y figure au niveau
  story.
- **Mesure de suivi** : après le lot suivant, la commande ci-dessous ne liste aucune nouvelle PR.

```bash
gh pr list --state merged --limit 40 --json number,headRefName \
  -q '.[] | select(.headRefName|test("ship|rangement")) | .number'
```

## Glossaire

- `DoD` — Definition of Done : la liste des conditions pour accepter une story (ici, elle doit
  inclure le passage de la fiche en `done/`).
- `ship` — la seule commande qui passe une fiche en `shipped` et la déplace dans `features/done/`.
- `reconcile` — croise les fiches actives avec les PRs déjà mergées et **propose** de les shipper ;
  il ne bascule jamais tout seul (ADR-0018).
- `portier` — le contrôle qu'`ezk-sprint` lance à l'ouverture d'un sprint (`start --dry-run`) : il
  signale le travail en cours ailleurs avant d'en commencer un nouveau.

## Notes / décisions

- **Symptôme daté** : PRs « ship en lot » du 2026-10-01 (`#314`, `#313`, `#306`, `#294`, `#285`,
  `#277`, `#272`) ; demande PO du 2026-10-02.
- **Décision déjà prise, jamais construite** :
  [ADR-0049](../products/mega-city/docs/adr/0049-ship-fiche-dans-la-pr-vues-post-merge.md). Cette
  fiche **la construit**, elle ne la refait pas.
- **Cadre** :
  [ADR-0054](../products/mega-city/docs/adr/0054-cloture-sprint-vs-archive-session.md) (DoD par
  story). **Invariant préservé** :
  [ADR-0018](../products/mega-city/docs/adr/0018-reconciliation-done-etat-reel-des-prs.md) — la
  piste B, qui le touchait, est écartée.
- **Découpage du 2026-10-02 (grooming)** : le « en cours » est sorti dans la fiche sœur
  [« En cours » se déduit des branches](20261002130235353_en-cours-deduit-des-branches.md) (P2).
  Cette fiche garde le plus petit morceau qui supprime la corvée : le « done ».
- **Voisines distinctes** (vérifiées, pas des doublons) :
  [0053 — gate DoD adossé à une métrique](0053-gate-dod-metrique.md) (même famille DoD, mais
  seuils de qualité, pas le rangement de la fiche) ;
  [grain « lot empilé »](20260906122942715_grain-de-livraison-lot-empile.md) (grain de PR, pas le
  passage en done) ;
  [reconcile systématique des merges hors flux](done/20260823121712781_reconcile-systematique-merges-hors-flux.md)
  (superseded : le geste `ship`/`reconcile` est déjà livré, il ne restait que « détecter un merge
  partiel + aide au conflit »).
- **Priorité P1 proposée** (friction à chaque session), à confirmer par le PO.
- **Préférence PO du 2026-10-02 : piste C** (« très agile / scrum »), confirmée par l'avis
  d'architecte du même jour (grooming). Limite connue : une story construite entièrement hors du
  flux ne passe aucun gate, donc `reconcile` reste le filet.
- **Panel adverse non nécessaire** : la décision existe déjà (ADR-0049). `ezk-reviewer` revoit le
  build (plancher de revue, ADR-0059).
- **Titre de l'index, rien à prévoir** (constat du 2026-10-02) : un `ship` fait dans une PR (#317)
  avait remis le titre « Backlog — mega-city » en tête de `BACKLOG.md`. Corrigé sur `main` par #323 :
  `regen-backlog.sh` lit `backlog_title:` dans `features/README.md`, et `ship:fiche` l'appelle sans
  titre (`products/mega-city/bin/ship-fiche.ts:65`). Le ship dans la PR hérite donc du bon titre.
- **Suite** : le filet A (check CI « PR `feat/<id>-…` sans sa fiche dans `done/` »).
- **Dépendance GitHub** (`gh`, dépôt `elzinko/vectorz`, merges par l'UI et `gh pr merge`) — accès
  constaté le 2026-10-02 (droit ADMIN).
- **Construit le 2026-10-02** : `ship-in-pr.sh` (`check` / `add` / `undo`) et la garde de
  `ship-merge.sh --remote` ; texte d'`ezk-sprint`, `ezk-pr`, `ezk-backlog` ; ADR-0049 « Accepté ».
  Revue `ezk-reviewer` GO ; ses 3 constats P1 sont corrigés. Écarté : lire le nom de branche par
  `gh pr view` dans la garde (appel réseau de plus ; `ezk-pr` passe déjà la branche lue par `gh`).
- **Gate « prête » passée le 2026-10-02** : problème, valeur, critères et dépendance externe tenus ;
  aucun slot propre au projet (`.vectorz/dor.yml` absent).
