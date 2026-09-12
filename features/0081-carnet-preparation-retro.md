---
id: 0081
title: Carnet de préparation de rétro — chaque session note ses sujets, la rétro n'oublie plus rien
type: feature
priority: P1
product: mega-city
epic:
status: ready
ready: 2026-09-12
pr:
created: 2026-07-18
---

# 0081 — Le carnet de préparation de rétro

## Contexte / Problème

Demande PO (2026-07-18, à chaud après la première rétro réelle) : « pouvoir demander
systématiquement (par config) à l'agent d'une session, à un moment donné, de noter ses
idées dans une liste de préparation de la rétro ». Aujourd'hui, le temps 1 de la
cérémonie (« rassembler les signaux ») part de la **mémoire de la session en cours** :
les frictions des sessions précédentes sont perdues si personne ne les a notées, et
des sujets s'oublient. La première rétro n'a fonctionné que parce qu'elle portait sur
la session du jour même.

## Valeur

**Plus aucun sujet oublié entre deux rétros.** Les problèmes et idées sont capturés au
fil de l'eau, là où ils apparaissent ; la cérémonie démarre d'un corpus réel accumulé,
pas d'un souvenir. Le carnet sert aussi hors rétro : exposer des problèmes, proposer
des idées.

## Proposition (direction — à groomer au tirage)

1. **Un carnet versionné** (emplacement à trancher au groom — ex. `docs/retro-notes.md`
   append-only, ou un dossier par période) où l'agent d'une session dépose ses
   observations : friction vécue, idée, problème, avec date et session/contexte.
2. **Déclenchement systématique PAR CONFIG, pas au bon vouloir de l'agent** — un
   mécanisme configuré (hook de session Claude Code, à articuler avec la fiche 0077
   hooks classe A ; ou consigne de clôture dans ezk-archive) qui pose la question à
   l'agent au(x) moment(s) choisi(s).
3. **Notes auto-porteuses** : relisibles et parfaitement compréhensibles des semaines
   plus tard, sans contexte de session — aucun lien cassé, références conformes à la
   règle `documentation-guidelines/proven-outbound-references` (citer = vérifié),
   chemins/commits explicites plutôt que « voir plus haut ».
4. **Consommé par `ezk-retro`** : le temps 1 de la cérémonie lit le carnet (en plus des
   symptômes de la session) et **le purge/archive** après traitement (une note traitée
   est marquée, jamais re-débattue silencieusement).

## Critères d'acceptation

- [ ] **Le carnet existe comme convention versionnée** : dossier `docs/retro-notes/`, une
      note par fichier `<AAAAMMDDHHMMSSmmm>-<slug>.md`, décrit dans `docs/retro-notes/README.md`
      (emplacement, format de note, cycle de vie). Observable : dossier + README commités.
- [ ] **Une note est auto-porteuse** : relisible à froid par un relecteur sans contexte, qui
      comprend le sujet et peut le re-vérifier — zéro référence morte, chemins/commits explicites
      (règle `documentation-guidelines/proven-outbound-references`).
- [ ] **`ezk-retro run` consomme le carnet au temps 1** : il liste les notes de `docs/retro-notes/`
      (hors `traitees/`) en plus des symptômes de session ; après la cérémonie chaque note est
      marquée dans la capture (traitée / écartée + raison) puis **déplacée vers
      `docs/retro-notes/traitees/`** — une note traitée n'est jamais re-débattue silencieusement.
- [ ] **Déclencheur best-effort à la clôture** : `ezk-archive run`/`close` invite la session à
      déposer une note si une friction/idée durable mérite d'atteindre la prochaine rétro.
      Observable : la consigne figure dans `ezk-archive/SKILL.md` et une clôture produit soit une
      note, soit un « rien à noter » explicite (même garde-fou que « Galères & gestes (labo) »).
- [ ] **Le carnet survit aux worktrees et aux sessions** : une note = un fichier à id horodaté
      (idiome anti-collision fiche 0180) → aucun conflit d'append entre worktrees parallèles.

> **Déféré à la fiche 0077 (hooks classe A) — HORS MVP.** La garantie *déterministe* « une session
> qui se clôt sans passage par le carnet est **détectable** » exige un hook qui émet **sans action
> du LLM**. C'est l'objet de 0077 (non construite). Tant qu'elle n'est pas là, le déclencheur reste
> **best-effort** (consigne de clôture, que le LLM peut oublier — la même faiblesse « classe B » que
> 0077 corrige). C'est le seul écart au « par config » du titre.

## Notes

- **P1 — donnée par le PO à la capture** (2026-07-18).
- Trio rétro : **0079** (la voix des restitutions) · **0080** (le support/compte rendu) ·
  **0081** (l'entrée/le carnet). S'articule avec 0077 (hooks classe A) pour le
  déclenchement déterministe, et avec ezk-archive (clôture de session) comme moment
  naturel de collecte.
- Anti-doublon vérifié (2026-07-18) : 0080 = la sortie de la cérémonie, 0063 (shippée) =
  la cérémonie elle-même ; rien ne portait la collecte amont continue.
