---
date: 2026-10-03
session: session « model et effort configurables par projet » (worktree weak-backlink-3f0945)
type: problème
---

# Deux sessions groomaient la même fiche sans le savoir, deux fois en une nuit

**En clair.** Dans la nuit du 2 au 3 octobre, deux fiches ont été groomées en parallèle par deux
sessions différentes. Chacune a écrit sa version sur sa propre branche. Personne ne l'a vu avant
qu'une version soit poussée sur main. La seconde session découvre alors un conflit, et l'un des deux
groomings part à la poubelle.

**Les faits, datés.**

- **Fiche du cockpit** `20260904080827072`. La session « us - grooming » l'a groomée sur la branche
  `claude/ezk-backlog-grooming-cf040d` (commits `c7ef1cdf` le 2026-10-03 à 00:57, puis `df39e133`),
  sans pousser. La session de ce worktree l'a groomée de son côté et poussée (`81db922d`, puis
  `62f0770d`). Le conflit n'a été vu que par hasard : la note de mémoire du chantier cockpit
  décrivait l'autre branche. Le PO a gardé la version poussée ; l'autre session a confirmé par
  message qu'elle arrêtait.
- **Fiche « les skills retrouvent mega-city depuis un projet hôte »** `20261002155911257`. La branche
  `docs/groom-20261002155911257` (commit `2cb46569`, 2026-10-03 à 01:52, worktree
  `exciting-boyd-81f50a`) porte un grooming non poussé. Cette session l'a aussi groomée et passée
  prête, poussée sur main (`924b95af`). Le portier d'`ezk-archive` l'a signalée à la clôture,
  comme « branche réelle ».
- **Ce qui existe aujourd'hui.** Rien ne dit qu'une fiche est « en cours de grooming ». Le statut
  passe de `idea` à `ready`, sans étape intermédiaire visible depuis main. La fiche sœur
  `20261002130235353` (« en cours » déduit des branches) vise le même trou, côté build.

**Pourquoi ça coince.** Un grooming coûte une séance avec le PO. Le refaire en double, puis arbitrer
entre deux versions, coûte le double, plus un conflit de merge à résoudre.

**Pistes pour la rétro.** Signaler, au début d'un `groom <id>`, toute branche locale non poussée qui
touche déjà cette fiche : la même vérification que celle faite à la main ici
(`git log origin/main..<branche> -- features/<fiche>`). Ou réutiliser la déduction « en cours »
de la fiche `20261002130235353` pour le grooming aussi.
