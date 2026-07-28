---
id: 2081
product: mega-city
title: Carnet de préparation de rétro — chaque session note ses sujets (par config), la rétro n'oublie plus rien
type: feature
priority: P1
epic:
status: idea
ready:
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

## Critères d'acceptation (à affiner au groom)

- [ ] Le déclencheur est **configuré** (config/hook versionné), pas une habitude : une
      session qui se clôt sans passage par le carnet est détectable.
- [ ] Une note déposée est relisible à froid : test = un relecteur sans contexte
      comprend le sujet et peut le re-vérifier (zéro référence morte).
- [ ] `ezk-retro run` liste les notes du carnet au temps 1 et marque leur traitement
      (traitée / écartée avec raison) dans la capture de cérémonie.
- [ ] Le carnet survit aux worktrees et aux sessions (commité, convention du repo).

## Notes

- **P1 — donnée par le PO à la capture** (2026-07-18).
- Trio rétro : **0079** (la voix des restitutions) · **0080** (le support/compte rendu) ·
  **0081** (l'entrée/le carnet). S'articule avec 0077 (hooks classe A) pour le
  déclenchement déterministe, et avec ezk-archive (clôture de session) comme moment
  naturel de collecte.
- Anti-doublon vérifié (2026-07-18) : 0080 = la sortie de la cérémonie, 0063 (shippée) =
  la cérémonie elle-même ; rien ne portait la collecte amont continue.
