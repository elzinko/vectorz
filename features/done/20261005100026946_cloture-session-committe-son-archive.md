---
id: "20261005100026946"
title: "La clôture de session committe l'archive qu'elle écrit, au lieu de la laisser hors de git dans le dossier de travail"
type: bug
priority: P1
product: mega-city
milestone:
version: V0.6
labels: [archive, sessions, mode-local]
status: shipped
pr: "local (807fdd95)"
evidence: none # script de clôture, pas d'écran
created: 2026-10-05
---

# 20261005100026946 — La clôture de session committe l'archive qu'elle écrit

**En clair.** À la clôture (`/ezk-archive run`), la méthode écrit l'archive de la session dans
`docs/sessions/`, puis s'arrête : elle propose le commit sans le faire. Le fichier reste hors de git,
dans le dossier de travail de la session. Si l'app supprime ce dossier avant que quelqu'un committe,
l'archive est perdue. On veut que la clôture committe elle-même ce qu'elle écrit ; le push reste un
geste du PO.

**Si tu arrives frais.** `ezk-archive` clôt une *session* Claude Code : il écrit une note de
passation (hors de git, dans le dossier commun du dépôt) et une archive de la session (un fichier
versionné sous `docs/sessions/`). En *mode local* (`github.pr: false` dans `.vectorz/config.yml`), la
méthode intègre par un squash sur le `main` local, avec `ship-merge.sh --local`.

## Contexte / Problème

- **2026-10-05.** `/ezk-archive run` a écrit `docs/sessions/2026-10-05-cloture-v0-5-et-cockpit-v0-6.md`
  dans le worktree de la session, sans le committer. Le skill le prévoit : « proposer le commit, ne pas
  committer à l'aveugle ». Le PO a demandé : « il faut commiter les archives de session non ? pourquoi
  ce n'est pas fait automatiquement ? ». Le commit a été fait à la main ensuite (4ac4674a).
- **Le risque est réel.** L'app supprime un worktree qui porte des fichiers non validés, avec tout son
  contenu (constaté le 2026-09-28) ; c'est ainsi que des notes de passation ont été perdues avant la
  fiche « La note de passation et le carnet de rétro survivent à la suppression d'un worktree »
  (20261003105820077, livrée le 2026-10-04).
- Note du carnet de rétro du 2026-10-05 : « la clôture prépare l'archive de session mais ne la
  committe pas ».

## Valeur — ce que coûte de ne rien faire

- Chaque clôture demande un geste de plus au PO, qui pense que c'est fait.
- Une archive oubliée part avec le dossier de travail : le récit de la session est perdu pour la rétro.

## Proposition

1. `ezk-archive run` committe l'archive sur une branche `docs/archive-session-<date>`, en
   conventional commit (`docs(sessions): archive session <date> <slug>`).
2. **Mode local** : il l'intègre au `main` local par `ship-merge.sh --local`. Le push reste au PO, et
   la sortie le dit.
3. **Mode PR** : la branche attend sa PR ; la sortie donne la commande pour l'ouvrir. Rien n'est poussé.
4. Si le dossier principal n'est pas propre, il ne merge pas : l'archive reste committée sur sa
   branche, et la sortie dit pourquoi.

## Critères d'acceptation

- [ ] Après `run`, l'archive est dans un commit : `git status` ne la montre plus comme non suivie.
- [ ] En mode local, ce commit est sur le `main` local ; rien n'est poussé, et la sortie dit de pousser.
- [ ] En mode PR, le commit attend sur sa branche ; la sortie donne la commande d'ouverture de la PR,
      et rien n'est poussé.
- [ ] Un dossier principal sale bloque le merge, pas le commit : l'archive reste sur sa branche, et la
      sortie dit pourquoi.
- [ ] `check` n'écrit et ne committe toujours rien.

## Comment vérifier

```bash
cd products/mega-city && pnpm test:scripts      # les tests de clôture d'ezk-archive
# sur un dépôt jetable en mode local : /ezk-archive run, puis
git log -1 --oneline                            # « docs(sessions): archive session … »
git status --short docs/sessions/               # rien
```

## Notes / décisions

- 2026-10-05 : créée à la demande du PO, après une clôture de session (« ne faut-il pas ouvrir un bug
  pour vectorz à ce sujet ? »). P1 et V0.6, décision PO du même jour.
- Fiche sœur, plus large : « Chaque sprint laisse un compte rendu committé et standard, que la rétro
  lit » (20261005100027029). Si elle fait de l'archive de session un sommaire des comptes rendus,
  cette fiche-ci reste valable : ce sommaire doit aussi être committé.
- La note du carnet `…20261005115524677-la-cl-ture-pr-pare-l-archive-de-session-mais-ne-la.md` sera
  versée à la prochaine rétro, avec un renvoi vers cette fiche.
