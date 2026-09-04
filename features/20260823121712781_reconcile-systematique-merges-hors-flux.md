---
id: "20260823121712781"
title: "Ship atomique dans la PR — filet reconcile + re-regen au conflit de merge"
type: feature
priority: P1
product: mega-city
status: idea
ready:
pr:
created: 2026-08-23
---

# Ship atomique dans la PR — le filet et la résolution de conflit

## En clair

Le modèle est tranché par l'**ADR-0049** : le ship complet (fiche → `done/` + statut + **toutes** ses
vues régénérées) voyage **dans la PR**, comme dernier commit. Cette fiche porte les **deux briques
restantes** : le **filet `reconcile`** (rattraper un merge fait hors flux) et le geste **déterministe
de re-`regen`** quand deux ships se disputent une vue générée au merge.

## Contexte / Problème

- Le `status` d'une fiche est un **cache** de l'état *merged* de sa PR (ADR-0018). Sans le ship, il
  décroche.
- **Récurrence datée (session muti 2026-09-01/02)** : PR #171 mergée, `ship` de `20260830194321545`
  jamais atterri (bloqué worktree→`main`, fini « en vol » sur une branche non poussée).
- Symptôme antérieur (échange PO 2026-08-23) : « parfois je squash-merge sur GitHub et on rate les
  `ship` ».
- ADR-0049 met le ship **dans la PR**. Restent deux angles morts : le merge **hors flux** (pas de
  commit de ship du tout), et le **conflit de vues** entre deux PR de ship parallèles.

## Proposition (cadrée par ADR-0049)

1. **Ship complet dans la PR** *(porté par `ezk-sprint` étape 10 + `ezk-backlog ship`)* : `git mv` vers
   `done/` + `status: shipped` + `pr: #N` + **régénération de toutes les vues** (`BACKLOG.md`,
   `PORTFOLIO.md`, curation de `PLAN.md`, `board.html`), dernier commit après le GO. ⚠️ Le contrat
   `ship` actuel ne régénère **pas** `board.html` : **l'étendre** pour régénérer **toute** vue dérivée
   d'une fiche fait partie de cette fiche — les 3 blocs board (`avancement:regen`, `plan-delta:regen`,
   `plan-view:regen`) **et tout futur bloc**. **Garde-fou définitif** : les tests d'égalité exacte
   mega-city doivent être verts — on ne s'appuie pas sur une liste de commandes à tenir à jour.
2. **Filet `reconcile`** *(cœur de cette fiche)* : détecter un merge **100 % hors flux** (UI GitHub,
   sans commit de ship) et **proposer** le `ship` manqué, sans lancement manuel. Il **propose**, `ship`
   exécute (invariant ADR-0018).
3. **Merge `main` puis re-`regen` au conflit** *(cœur de cette fiche)* : deux PR de ship touchent les
   mêmes vues → conflit au 2ᵉ merge. Comme les merges sont **sérialisés** (jamais deux à la fois) et
   les vues **déterministes**, la résolution est mécanique, **dans cet ordre** : (1) **merger `main`**
   dans la branche — sinon on ne voit pas la fiche déplacée par la 1ʳᵉ PR et un `regen` seul re-produit
   des vues périmées ; (2) **re-régénérer toutes les vues** + rejouer les gates. Outiller ce geste
   (helper ou doc), pas d'arbitrage au jugement.

## Critères d'acceptation (à groomer)

- [ ] Un merge fait **hors flux** (UI GitHub, sans commit de ship) est **détecté** et **proposé** au
      `ship` sans lancement manuel.
- [ ] Le contrôle **propose**, ne bascule **rien** seul (ADR-0018).
- [ ] Un conflit de vues au merge se résout par **merge de `main` PUIS re-`regen`** déterministe
      (documenté/outillé), sans édition manuelle des vues générées.
- [ ] Le contrat `ezk-backlog ship` (+ `ezk-sprint` étape 10) est **étendu** pour régénérer aussi
      `board.html` (aujourd'hui il ne fait que BACKLOG/PORTFOLIO/PLAN).
- [ ] Silencieux/inoffensif quand il n'y a rien à réconcilier.
- [ ] Point d'ancrage tranché au grooming : hook local, job CI, ou étape `ezk-pr` ?

## Comment vérifier

- Merger une PR **sans** commit de ship (UI GitHub) → la fiche correspondante est **signalée à
  shipper** sans lancement manuel.
- Ouvrir deux PR de ship, merger la 1ʳᵉ, puis la 2ᵉ → le conflit de vue de la 2ᵉ se résout par un
  `regen`, aucune édition manuelle.

## Notes / voisins

- **ADR-0049** — le cadre : ship complet (fiche + toutes ses vues) dans la PR ; cette fiche = filet
  `reconcile` + re-`regen` au conflit.
- Voisins : [[0185]] (ezk-archive croise branches réelles ↔ PR ouvertes), [[20260812100109940]]
  (sync des vues de planning au `ship`), `ezk-backlog reconcile` (la brique composée).
- **Non ready** — à groomer (point d'ancrage du filet + outillage de résolution de conflit).
