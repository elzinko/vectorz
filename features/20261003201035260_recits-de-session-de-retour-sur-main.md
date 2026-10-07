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

- [x] La cause est écrite dans la fiche, avec le compte des clôtures concernées — mesuré par proxy (borne basse), le compte exact de clôtures étant non reconstituable de l'historique committé. → section « Mesure et cause » ci-dessous.
- [x] Une clôture qui a un `SPRINT.md` rempli laisse un récit committé dans `docs/sessions/`. → garanti par `archive-commit.sh` (ADR-0063), appelé à l'étape 8 d'`ezk-archive`, prouvé par `test-archive-commit.sh` (tout vert).

## Mesure et cause (2026-10-07)

**En clair.** Le trou est réel mais **déjà rebouché**. Entre le 30 août et le 3 octobre, aucune clôture
n'a committé son récit. La cause : la clôture *proposait* le commit sans le faire, et le fichier se
perdait quand l'application réutilisait le worktree. Depuis le 3 octobre, la clôture committe elle-même
son récit — c'est pour ça que `docs/sessions/` a repris.

**Le trou, mesuré sur `main`.**

- Dernier récit committé avant le trou : **2026-08-30**. Reprise : **2026-10-03**. Entre les deux, zéro
  récit committé dans `docs/sessions/`.
- Activité dans la fenêtre, comme proxy : **12 commits `docs(features): ship`** (plusieurs sessions —
  run V0.1→V0.4, V0.5, cockpit V0.6…).
- **Compte exact de clôtures introuvable** depuis l'historique committé : le journal de supervision
  (`.supervision/runs/`) est gitignoré, donc le nombre précis de sessions fermées dans la fenêtre n'est
  pas reconstituable. Le proxy ci-dessus (≥ 12 fiches livrées, plusieurs sessions) est l'estimation
  honnête, borne basse.

**La cause.** Avant [ADR-0063](../products/mega-city/docs/adr/0063-cloture-committe-son-archive.md), `ezk-archive`
écrivait le récit puis *proposait* le commit à l'humain. Ce geste manuel était souvent sauté, ou le récit
écrit dans un worktree de session que l'app réutilisait ensuite — il disparaissait avec le conteneur
(note de carnet [récits de session absents de main](../docs/retro-notes/traitees/20261002230222359-recits-session-absents-de-main.md)).

**Le correctif, déjà livré.** ADR-0063 (fiche 20261005100026946, shippée le 2026-10-05) a remplacé la
proposition par une action : `archive-commit.sh` committe le récit dans un **worktree git jetable** issu
de `main`, puis l'intègre. Même si la session perd son worktree, le récit est déjà committé. C'est exactement
le flux « faire committer le récit par la clôture » que proposait cette fiche. Rien de plus à construire :
cette fiche **constate et clôt** la mesure.

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
