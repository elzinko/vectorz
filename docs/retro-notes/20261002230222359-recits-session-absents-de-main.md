---
date: 2026-10-03
session: session « WIP-v0.5 » (question du PO « je peux archiver ? »)
type: problème
---

# Plus aucun récit de session sur main depuis le 30 août

**En clair.** Sur main, le dernier récit de session date du 30 août. Pourtant, des dizaines de sprints
ont tourné depuis. La vue « Historique des runs », qui lit ces récits, s'arrête donc à cette date. On
ne sait pas encore quelle part vient du design et quelle part vient d'un commit oublié.

**Les faits, datés.**

- **Sur main.** `git log origin/main -- docs/sessions/` au 2026-10-03 : dernier récit `a0166eb4`
  (2026-08-30, « archive session 2026-08-30 suppr-bundles-orphelins »). Dernier changement du dossier :
  `dc2fe451` (2026-08-31, PR #199).
- **La vue.** `products/mega-city/src/loaders/runs.ts` charge un récit par fichier de `docs/sessions/`.
  Sans nouveau récit, l'historique des runs ne bouge plus.
- **Un cas vu.** Le 2026-10-03, la clôture de la session de la PR #333 a écrit son récit, sa note de
  rétro et son entrée de journal, sans les committer. Ils étaient dans
  `.claude/worktrees/ready-todo-status-distinction-d96e52`. La même nuit, l'app a déplacé une autre
  session hors de ce dossier. Les trois fichiers étaient encore hors de git quand la rétro de cette
  session a démarré.
- **Ce que dit le skill.** `products/mega-city/skills/ezk-archive/SKILL.md`, étape 8 : la clôture
  n'écrit un récit que si `SPRINT.md` a du contenu. Elle propose ensuite le commit
  `docs(sessions): archive session YYYY-MM-DD <slug>` et laisse la main. Le portier de la clôture
  suivante signale seulement « N autre(s) worktree(s) ont des changements non commités ».

**Pourquoi ça coince.** Trois causes possibles, pas encore départagées. Une session sans sprint
n'écrit pas de récit, par design. Un sprint mené par un agent tourne peut-être dans le dossier de
l'agent, supprimé ensuite avec son `SPRINT.md`. Un récit écrit attend un commit que personne ne fait.

**Piste pour la rétro.** Mesurer d'abord : sessions closes depuis le 30 août, récits écrits, récits
committés. Puis choisir un garde-fou. Exemple : le portier nomme le récit non committé, au lieu d'un
simple compte de dossiers. Fiches voisines : `features/20261002155911264_ezk-archive-reprise-run-interrompu.md`
(reprendre une clôture interrompue) et `features/20261002155911250_portier-archive-origin-main-squash.md`
(le portier compare à `origin/main`). À mesurer : sur les 5 prochaines clôtures avec sprint, 5 récits
sur main.
