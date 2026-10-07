---
id: "20261003201035260"
title: "Les récits de session reviennent sur main : l'historique des runs est figé au 30 août"
type: bug
priority: P2
product: mega-city
milestone:
version: V0.7
labels: [archive, sessions]
status: ready
pr:
evidence: none # outillage, pas d'écran
created: 2026-10-03
---

# 20261003201035260 — Les récits de session reviennent sur main : l'historique des runs est figé au 30 août

**En clair.** Sur `main`, le dernier récit de session date du 30 août. Pourtant, des dizaines de
sprints ont tourné depuis. La vue « Historique des runs » ne bouge donc plus. On veut comprendre
pourquoi, et que chaque clôture qui a quelque chose à raconter laisse son récit sur `main`.

## Contexte / Problème

- `git log origin/main -- docs/sessions/` au 2026-10-03 : dernier récit le 2026-08-30.
- La vue « Historique des runs » charge un récit par fichier de `docs/sessions/`.
- 2026-10-03 : une clôture a écrit son récit sans le committer, dans un worktree que l'app a ensuite
  réutilisé. Note de carnet `20261002230222359-recits-session-absents-de-main`.
- `ezk-archive` n'écrit un récit que si `SPRINT.md` a du contenu, puis propose le commit.

## Proposition

1. Mesurer d'abord : combien de clôtures depuis le 30 août auraient dû écrire un récit.
2. Selon la cause, faire committer le récit par la clôture (dans sa PR), ou corriger la condition.

## Critères d'acceptation

- [ ] La cause est écrite dans la fiche, avec le compte des clôtures concernées.
- [ ] Une clôture qui a un `SPRINT.md` rempli laisse un récit committé dans `docs/sessions/`.

## Comment vérifier

```bash
git log origin/main --oneline -- docs/sessions/ | head -3
```

## Notes / décisions

- Née de la rétro de l'itération V0.5 (capture `docs/captures/2026-10-03-retro-iteration-v0-5.md`), proposée par le produit. Retenue par choix
  délégué du PO à l'agent, P2. Traite la note de carnet sur les récits absents.
- 2026-10-07 : groomée `ready`, version **V0.7** (socle « voir sous le capot »). Le sprint commence
  par une **courte mesure** (combien de clôtures depuis le 30 août auraient dû écrire un récit, et
  la cause), puis corrige — la fiche le prévoit. Fait lot socle V0.7 avec 20261002133125444.
