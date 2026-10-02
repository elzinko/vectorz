---
id: "20261002114435782"
title: Chaque user story porte ses statuts — en cours à la prise, done à sa validation
type: feature
priority: P1
product: mega-city
milestone:
version:
labels: [sprint]
status: idea
pr:
evidence: none # changement de méthode/outillage, pas d'écran
created: 2026-10-02
---

# 20261002114435782 — Chaque user story porte ses statuts

**En clair.** Aujourd'hui une fiche ne suit pas le travail : personne ne la passe « en cours » à
la prise, et son passage en `done/` est repoussé dans des PRs « ship en lot » (`#314` range 8
fiches d'un coup le 2026-10-01). Du coup, chaque ouverture de session commence par un
`reconcile`/`regen` de rattrapage. On veut que **chaque user story porte ses propres statuts** :
« en cours » à la prise, « done » quand elle passe sa DoD, quel que soit le canal de merge, et le
`reconcile` redevient l'exception.

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

**Le statut « en cours » n'est jamais posé.** Sur les 330 fiches du dépôt, aucune n'a jamais
porté `status: in-progress` dans son front-matter (constat du 2026-10-02). Pourtant le portier
d'`ezk-sprint` (`skills/ezk-sprint/scripts/check.sh`, point 3) compte ces fiches pour repérer deux
sessions sur la même story. Le statut existe, il est lu, mais personne ne l'écrit : le portier est
aveugle.

**Une décision déjà prise, mais contournée.**
[ADR-0049 (ship dans la PR)](../products/mega-city/docs/adr/0049-ship-fiche-dans-la-pr-vues-post-merge.md)
veut que le `ship` voyage **dans la PR**, en dernier commit, juste avant le squash. Mais dans les
faits le PO merge surtout par l'UI GitHub, parfois par `gh pr merge`, parfois sans PR du tout —
donc **hors du flux `ezk-sprint`**, le seul qui ajoute ce commit `ship`. L'ADR ne se déclenche donc
quasiment jamais. Le besoin n'est pas de recréer le geste (il existe), mais de le **rendre
indépendant du canal de merge**.

**Le contexte a changé.**
[ADR-0054 (cycle de vie sprint/session)](../products/mega-city/docs/adr/0054-cloture-sprint-vs-archive-session.md)
pose `story ⊂ sprint ⊂ session` : un sprint porte désormais **plusieurs user stories**, une par
`ezk-dev`. La DoD doit donc être vérifiée **par story**. Le passage en `done` devient un **item de
la DoD de la story**, appliqué quand la story est validée — pas une corvée de fin de session, ni un
ship de fin de lot.

## Proposition

Le besoin (pas l'implémentation) :

- À la **prise** d'une story (ouverture du sprint ou tirage), sa fiche passe `in-progress`,
  committé : les autres sessions et le portier la voient.
- La **DoD d'une user story inclut « sa fiche est en `done/` (statut `shipped`) »**, appliquée au
  moment où la story est validée et sa PR mergée, **quel que soit le canal** : flux `ezk-sprint`,
  UI GitHub, `gh pr merge`, ou livraison sans PR.
- **Effet visé** : à l'ouverture d'une session, `reconcile`/`regen` ne rattrape plus rien en
  routine. `reconcile` reste le **filet** pour le cas vraiment exceptionnel (un merge hors radar),
  il n'est pas supprimé.

**Décision d'architecture NON tranchée ici** — elle passe au panel adverse avant tout build. Trois
pistes à peser :

- **A — Garde pré-merge.** Rien ne merge sans son commit `ship` sur la branche. Simple, mais
  fragile quand le PO merge par l'UI GitHub ou travaille sans GitHub.
- **B — Rattrapage automatique à l'arrivée sur `main`.** Un geste qui `ship` ce qui vient d'être
  mergé. Attention : touche l'invariant
  [ADR-0018](../products/mega-city/docs/adr/0018-reconciliation-done-etat-reel-des-prs.md)
  (« `reconcile` propose, ne bascule jamais »). À arbitrer.
- **C — Ship au gate DoD de la story.** Le passage en `done` est déclenché par la **validation** de
  la story (revue + QA), indépendamment de l'étape merge d'`ezk-sprint`. C'est ADR-0049 généralisé
  hors du flux.

## Critères d'acceptation

- [ ] À la prise d'une story, sa fiche passe `in-progress` (committé) ; le portier d'`ezk-sprint`
      la voit.
- [ ] La DoD d'une user story inclut explicitement « fiche en `done/` + `status: shipped` »,
      vérifiée **par story** (pas par sprint, pas par session).
- [ ] Le passage en `done` est déclenché à la **validation + merge** de la story, quel que soit le
      canal (UI GitHub, `gh`, flux `ezk-sprint`, sans PR).
- [ ] Sur le prochain lot livré, **aucune PR « ship en lot » de rattrapage** n'est nécessaire.
- [ ] Au démarrage de **3 sessions d'affilée**, `reconcile` ne propose **0 fiche** (mesure).
- [ ] `reconcile` **reste** le filet pour l'exception — il n'est pas supprimé, juste rendu
      exceptionnel.
- [ ] La piste d'architecture (A/B/C) est **tranchée par un panel adverse + ADR** avant tout build.

## Comment vérifier

```bash
# 1. Plus de PR de rattrapage « ship en lot » sur le dernier lot livré :
gh pr list --state merged --limit 40 --json number,headRefName \
  -q '.[] | select(.headRefName|test("ship|rangement")) | .number'
#    → aucune nouvelle PR chore/ship-* sur le lot livré après adoption.
```

- Après l'ouverture d'un sprint, `grep -l 'status: in-progress' features/*.md` liste les fiches
  du lot.
- À l'ouverture de 3 sessions d'affilée, lancer `/ezk-backlog reconcile` : réponse « rien à
  réconcilier » les 3 fois.
- Relire la DoD (`ezk-sprint` et la DoD du projet) : la ligne « fiche en `done` » y figure **au
  niveau story**.

## Glossaire

- `DoD` — Definition of Done : la liste des conditions pour accepter une story (ici, elle doit
  inclure le passage de la fiche en `done/`).
- `ship` — la seule commande qui passe une fiche en `shipped` et la déplace dans `features/done/`.
- `reconcile` — croise les fiches actives avec les PRs déjà mergées et **propose** de les shipper ;
  il ne bascule jamais tout seul (ADR-0018).

## Notes / décisions

- **Symptôme daté** : PRs « ship en lot » du 2026-10-01 (`#314`, `#313`, `#306`, `#294`, `#285`,
  `#277`, `#272`) ; demande PO du 2026-10-02.
- **Décision déjà prise et contournée** :
  [ADR-0049](../products/mega-city/docs/adr/0049-ship-fiche-dans-la-pr-vues-post-merge.md). Cette
  fiche la **généralise hors du flux `ezk-sprint`**, elle ne la refait pas.
- **Cadre** :
  [ADR-0054](../products/mega-city/docs/adr/0054-cloture-sprint-vs-archive-session.md) (DoD par
  story). **Invariant à arbitrer** :
  [ADR-0018](../products/mega-city/docs/adr/0018-reconciliation-done-etat-reel-des-prs.md) — la
  piste B le toucherait.
- **Voisines distinctes** (vérifiées, pas des doublons) :
  [0053 — gate DoD adossé à une métrique](0053-gate-dod-metrique.md) (même famille DoD, mais
  seuils de qualité, pas le rangement de la fiche) ;
  [grain « lot empilé »](20260906122942715_grain-de-livraison-lot-empile.md) (grain de PR, pas le
  passage en done) ;
  [reconcile systématique des merges hors flux](done/20260823121712781_reconcile-systematique-merges-hors-flux.md)
  (superseded : le geste `ship`/`reconcile` est déjà livré, il ne restait que « détecter un merge
  partiel + aide au conflit »).
- **Priorité P1 proposée** (friction à chaque session), à confirmer par le PO.
- **Préférence PO du 2026-10-02 : piste C** (« très agile / scrum »). C'est une orientation, pas
  encore une décision : le panel la confirme ou la conteste. Point d'attention pour le panel : en C,
  le commit `ship` doit entrer dans la PR **au gate DoD** (revue + QA verts), **avant** le merge.
  Ainsi le canal de merge ne compte plus : UI, `gh` ou flux, la fiche arrive en `done/` avec le
  code. Limite connue : une story construite entièrement hors du flux ne passe aucun gate, donc
  `reconcile` reste le filet.
- La décision A/B/C passe au **panel adverse** (ezk-architect + devs + juge) avant build.
