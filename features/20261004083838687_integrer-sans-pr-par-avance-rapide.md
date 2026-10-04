---
id: "20261004083838687"
title: "Sans PR, intégrer par push en avance rapide, au choix du projet"
type: feature
priority: P2
product: mega-city
milestone:
version:
labels: [github-optionnel, cross-repo]
status: idea
pr:
evidence: none # commandes git, aucun écran
created: 2026-10-04
---

# 20261004083838687 — Sans PR, intégrer par push en avance rapide, au choix du projet

**En clair.** Sans PR, `ezk-sprint` intègre une story par un squash sur le `main` local, sans
rien pousser. Ce geste échoue dans un worktree et ne colle pas aux projets qui poussent directement
sur `origin/main`, comme muti. On ajoute une seconde façon d'intégrer, choisie dans la config : le
push en avance rapide. Elle marche depuis n'importe quel worktree.

**Si tu arrives frais.** Un projet à `github: false` (dans `.vectorz/config.yml`) n'ouvre pas de
PR. Le guichet `ezk forge` est posé par la fiche
[20261004083838593](20261004083838593_guichet-unique-github-archive-reconcile.md) ; le motif est
dans [ADR-0061](../products/mega-city/docs/adr/0061-un-seul-guichet-pour-github.md).

## Contexte / Problème

En `pr: false`, l'étape 10 d'`ezk-sprint` et le `ship` d'`ezk-pr` passent par
`skills/ezk-pr/scripts/ship-merge.sh --local`. Ce script fait `git checkout <base>`, un squash, un
commit, puis réaligne les vues. Il ne pousse jamais.

Vécu sur muti le 2026-10-04 :

- La session tourne dans un worktree. `main` est déjà sorti dans le dossier principal : le
  `git checkout main` du script échouerait.
- Le flux de muti est autre : revue locale, gate locale, puis
  `git merge-base --is-ancestor origin/main HEAD` et `git push origin HEAD:main`. La session l'a
  fait à la main, hors de la méthode.

Le squash local reste juste pour un dépôt sans remote ([ADR-0052](../products/mega-city/docs/adr/0052-merge-local-first-github-execute-le-squash-main-se-realigne.md)
D5). Il manque une option pour un dépôt qui a un remote mais pas de PR.

## Proposition

Mettre en œuvre la décision D3 de
[ADR-0061](../products/mega-city/docs/adr/0061-un-seul-guichet-pour-github.md) :

1. **Le verbe.** `ezk forge integrate --branch <b> [--base main]`. Adaptateur GitHub :
   `gh pr merge --squash`, comme aujourd'hui. Adaptateur local : la stratégie du projet.
2. **Deux stratégies locales.**
   - `local-squash` : le comportement actuel, et le défaut sans PR.
   - `push-ff` : `git fetch`, refus net si `origin/<base>` n'est pas un ancêtre de la branche,
     puis `git push origin HEAD:<base>`, puis réalignement du `main` local par avance rapide
     (ADR-0052 D2). Aucun `git checkout` de `main`.
3. **La clé de config.** Le projet choisit sa stratégie dans `.vectorz/config.yml`, par exemple
   `integration: push-ff`. Le nom exact se fixe au grooming ; `ezk config show` l'affiche.
4. **Les appelants.** L'étape 10 d'`ezk-sprint` et le `ship` d'`ezk-pr` appellent
   `ezk forge integrate` au lieu de choisir eux-mêmes entre `--local` et `--remote`.
5. **Le ship de la fiche.** Après un `push-ff`, `ezk backlog ship … --pr 'local (<sha>)'` garde
   son format actuel.

## Critères d'acceptation

- [ ] Avec la stratégie `push-ff`, depuis un worktree où `main` est sorti ailleurs, une branche à
      jour atterrit sur `origin/main` sans commit de fusion.
- [ ] `push-ff` refuse sans rien pousser si `origin/<base>` a avancé, et dit quoi faire (rebaser).
- [ ] Sans clé de stratégie, le comportement sans PR reste le squash local d'aujourd'hui.
- [ ] Avec `pr` allumé, `ezk forge integrate` lance `gh pr merge --squash` comme `ship-merge.sh
      --remote` aujourd'hui.
- [ ] `ezk config show` affiche la stratégie d'intégration effective.
- [ ] `ezk-sprint` et `ezk-pr` ne citent plus `ship-merge.sh --local` ni `--remote` dans leur
      étape d'intégration : ils citent `ezk forge integrate`.

## Comment vérifier

Un remote nu local remplace GitHub : aucun réseau.

```bash
T=$(mktemp -d) && git init -q --bare "$T/origin.git"
git clone -q "$T/origin.git" "$T/repo" && cd "$T/repo" && git commit -q --allow-empty -m init && git push -q origin HEAD:main
mkdir -p .vectorz && printf 'github: false\nintegration: push-ff\n' > .vectorz/config.yml
git add .vectorz && git commit -q -m "chore: config" && git push -q origin HEAD:main
git worktree add -q ../wt -b feat/demo && cd ../wt && git commit -q --allow-empty -m "feat: demo"
ezk --root . forge integrate --branch feat/demo; echo "rc=$?"
git -C "$T/origin.git" log --oneline -1 main      # → feat: demo, sans commit de fusion
pnpm --dir products/mega-city test
```

## Glossaire

- **Avance rapide** (*fast-forward*) — pousser une branche sur `main` sans commit de fusion,
  parce que `main` n'a pas bougé depuis le départ de la branche.
- **Stratégie d'intégration** — la façon dont une story validée arrive sur `main` : squash local,
  push en avance rapide, ou merge de PR.

## Notes / décisions

- Dépend de [20261004083838593](20261004083838593_guichet-unique-github-archive-reconcile.md),
  qui pose le guichet.
- À trancher au grooming : squasher la branche avant le `push-ff`, ou pousser ses commits tels
  quels (muti pousse tels quels aujourd'hui).
- Le merge strictement hors ligne reste couvert par `local-squash` (ADR-0052 D5).
- **Cas du 2026-10-03** (note du carnet
  `docs/retro-notes/traitees/20261003202803910-revue-backlog-mode-local.md`, rétro légère du
  2026-10-04) : un squash local qui ne contenait que des fiches, le plan et une ligne de config
  (`f0e93201`, branche `squash/github-local`) a vu son push refusé par le garde-fou de Claude Code,
  au motif d'un « merge sans revue ». En mode local, un changement de fiches seul n'a pas de chemin
  de revue prévu. À trancher au grooming : quelle revue, légère, pour un changement sans code.
