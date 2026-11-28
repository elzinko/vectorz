---
id: "20261128094701695"
title: "La page d'une session montre ses lancements, son fil, ses sprints et son récit"
type: feature
priority: P2
product: cop1
milestone: board
version:
labels: [theme:mission-control, sessions]
status: ready
blocked:
depends: ["20261128093846710", "20261128094701629", "20261114131614243"]
pr:
evidence: before-after
created: 2026-11-28
---

# 20261128094701695 — La page d'une session montre ses lancements, son fil, ses sprints et son récit

**En clair.** Sur la page d'une session, quatre cartes disent « non publié » : Lancements, Le fil, Sprints,
Le récit. Le journal de supervision, la liste des sprints et le fichier du récit existent. On branche ces
cartes sur ce qui est publié.

**Si tu arrives frais.** Une session est un ouvrier : une branche et son dossier de travail. Elle enchaîne
des lancements de la méthode. À sa clôture, elle laisse un récit dans `docs/sessions/`. Le journal de
supervision note les moments de chaque lancement. Mission control n'invente rien (ADR-086). La maquette
est la référence d'écran du PO : pages « Sessions » et « Une session ».

## Contexte / Problème

La maquette montre, pour une session : ses lancements (dates, fins de sprint, état), un fil « en clair »
des moments qui comptent, ses sprints, son récit rendu en sections, et les fiches citées. L'app n'a que
l'en-tête et les fiches citées.

## Proposition

1. **Le récit** : le fichier de la session, rendu en sections par la lecture gardée du daemon, avec
   « Ouvrir le récit complet ».
2. **Ses sprints** : les sprints publiés dont la branche et la période sont celles de la session.
3. **Ses lancements** et **Le fil** : les lancements du journal de supervision rattachés à la session, par
   branche quand le journal la porte, sinon par période. Le fil liste les moments qui comptent, du plus
   ancien au plus récent, en mots.
4. **Sessions en cours** : la page Sessions montre une session vivante quand le journal a un lancement
   ouvert, avec sa branche et son dernier moment.
5. Hors de ce que le journal et la méthode publient, chaque carte garde « non publié » et dit pourquoi.

## Critères d'acceptation

- [ ] La carte « Le récit » rend le fichier de la session en sections ; sans fichier, « non publié ».
- [ ] La carte « Ses sprints » liste les sprints publiés de la branche sur la période.
- [ ] Les cartes « Ses lancements » et « Le fil » montrent les lancements du journal rattachés à la
  session, ou « non publié pour cette période » quand le journal ne les couvre pas.
- [ ] Une session vivante apparaît dans « En cours ».
- [ ] Capture avant / après jointe.

## Comment vérifier

- vue Une session : http://localhost:5274 → Sessions → la session la plus récente
- `pnpm --dir products/cop1/packages/web exec vitest run`
- `pnpm --dir products/cop1/packages/app exec vitest run`

## Notes / décisions

- 2026-11-28 — L'en-tête structuré du récit et la vue par session côté méthode sont deux autres fiches :
  « Le récit de session porte un en-tête structuré » et « `ezk board session <branche> --json` ».
- 2026-11-28 — Contrôle « prête » (ezk-pm) : GO. À tirer après l'en-tête structuré du récit et la liste complète des sprints. Les lancements se rattachent par période quand le journal n'a pas la branche.
