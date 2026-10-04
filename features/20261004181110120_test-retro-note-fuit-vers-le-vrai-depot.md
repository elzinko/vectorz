---
id: "20261004181110120"
title: "Le test de « ezk retro note » n'écrit plus dans le vrai dépôt quand il tourne sous pnpm"
type: bug
priority: P1
product: mega-city
milestone:
version:
labels: [retro, tests]
status: idea
pr:
evidence: none # script de test, pas d'écran
created: 2026-10-04
---

# 20261004181110120 — Le test de « ezk retro note » n'écrit plus dans le vrai dépôt quand il tourne sous pnpm

**En clair.** Le test de la commande `ezk retro note` dépose une note de carnet dans le vrai dépôt
vectorz quand on le lance par `pnpm test:scripts`. Deux notes parasites l'ont montré pendant la rétro
de fin de V0.5. On fait viser au test son propre dépôt jetable, on vérifie où la note atterrit, et on
retire les deux parasites.

**Si tu arrives frais.** `ezk retro note` dépose une note pour la prochaine rétro, hors de git, dans
`<git-common-dir>/ezk/retro-notes/`. Son test est `skills/ezk-retro/scripts/test-note.sh` ; le cas
N5 passe par la commande `ezk` elle-même. Sous `pnpm`, la variable `INIT_CWD` contient le dossier
d'où `pnpm` a été lancé.

## Contexte / Problème

- Le 2026-10-04, deux notes « Depuis la commande ezk » sont apparues dans
  `vectorz/.git/ezk/retro-notes/` (19 h 41 et 19 h 53), une par lancement de `pnpm test:scripts`.
- Cause : sous `pnpm`, `INIT_CWD` désigne le dossier d'où `pnpm` a été lancé, dans vectorz. Le routeur `ezk` s'en sert pour
  trouver le dépôt de l'utilisateur ; le cas N5 vise alors vectorz, pas son dépôt jetable. Lancé
  hors `pnpm`, le même cas écrit au bon endroit (reproduit le 2026-10-04).
- Le contrôle de N5 ne vérifie que le nom du fichier, pas son dossier : il est resté vert.

## Valeur — ce que coûte de ne rien faire

- Chaque gate locale ajoute une note parasite au carnet réel. La rétro suivante les lit comme des
  frictions.
- Un test qui écrit hors de son dossier jetable peut, demain, abîmer autre chose qu'un carnet.

## Proposition

1. N5 neutralise `INIT_CWD` (`env -u INIT_CWD …`) et lance `ezk` depuis le dépôt jetable.
2. N5 vérifie que la note atterrit sous le `git-common-dir` du dépôt jetable.
3. Les deux notes parasites de vectorz sont retirées : fait le 2026-10-04, pendant la rétro.

## Critères d'acceptation

- [ ] Après `pnpm test:scripts`, `bash products/mega-city/skills/ezk-retro/scripts/note.sh list`
      lancé dans vectorz rend la même liste qu'avant.
- [ ] N5 échoue si la note atterrit ailleurs que dans le dépôt jetable (cas reproduit avec
      `INIT_CWD` pointé sur un autre dépôt).
- [x] Les deux notes « depuis-la-commande-ezk » ne sont plus dans `vectorz/.git/ezk/retro-notes/`
      (retirées le 2026-10-04, pendant la rétro).

## Comment vérifier

```bash
bash products/mega-city/skills/ezk-retro/scripts/note.sh list
pnpm --dir products/mega-city test:scripts
bash products/mega-city/skills/ezk-retro/scripts/note.sh list
```

## Notes / décisions

- 2026-10-04 : née de la rétro légère de fin de V0.5 (capture
  `docs/captures/2026-10-04-retro-iteration-v0-5-legere.md`), proposition 1, retenue par le PO.
- P1 proposé par le pilote (le test pollue le dépôt réel à chaque gate) ; à confirmer au planning.
- Voisine : « les tests qui lisent le vrai dépôt vérifient une invariante »
  (20261003201035080) traite la lecture ; ici, c'est une écriture.
