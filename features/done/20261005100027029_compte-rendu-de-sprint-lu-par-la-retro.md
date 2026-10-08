---
id: "20261005100027029"
title: "Chaque sprint laisse un compte rendu committé et standard, que la rétro lit"
type: feature
priority: P1
product: mega-city
milestone:
version: V0.7
labels: [sprint, retro, archive]
status: split
pr: "split — scindée en 20261008072305169, 20261008072306360"
evidence: none # scripts et skills, pas d'écran
created: 2026-10-05
split_into: ["20261008072305169", "20261008072306360"]
---

# 20261005100027029 — Chaque sprint laisse un compte rendu committé et standard, que la rétro lit

**En clair.** Un sprint peut se jouer dans une session, et sa rétro dans une autre, des jours plus
tard. Aujourd'hui, rien ne garde de façon sûre ce qui s'est passé pendant un sprint : le journal du
sprint n'est jamais committé, et l'archive de session mêle parfois plusieurs sessions. On veut qu'à la
fermeture de chaque sprint, la méthode écrive un compte rendu court, toujours au même format, et le
committe. La rétro lit ces comptes rendus, quelle que soit la session qui les a écrits.

**Si tu arrives frais.** Un *sprint* est un lot de fiches, ouvert par `ezk-sprint start` et fermé par
`ezk-sprint close`, qui « scelle l'incrément ». Une *session* est le temps passé dans Claude Code ; elle
se clôt par `ezk-archive`. La *rétro* (`ezk-retro`) améliore la méthode à partir de ce qui s'est passé ;
elle laisse une capture committée dans `docs/captures/`.

## Contexte / Problème

Le besoin, exprimé par le PO le 2026-10-05 : « je peux lancer plusieurs sprints dans plusieurs
sessions différentes, et la rétro dans une autre session encore ; il faut un mécanisme pour historiser
de façon lisible et un peu standardisée ce qu'il s'est passé durant chaque sprint ».

L'historique existe en morceaux, aucun ne le garde de façon sûre :

| Pièce | Ce qu'elle garde | Le trou |
|---|---|---|
| `SPRINT.md` | le lot, les décisions, les incréments scellés | jamais committé ; propre à un dossier de travail ; hérité d'une session à l'autre quand l'app recycle le dossier (trois fois les 2026-10-03 et 04, et encore le 2026-10-05 : il mêlait une session du 2026-10-02) |
| L'archive de session (`docs/sessions/`) | une copie de `SPRINT.md` à la clôture | par session, pas par sprint ; reprend le mélange ; pas committée seule (fiche 20261005100026946) |
| `ezk sprint report` | durée, jetons, indicateurs, sous `docs/sprints/` | livré (20260826082120062) mais jamais lancé : `docs/sprints/` n'existe pas dans vectorz ; il ne retrouve pas la trace de supervision (20261002230039863) |
| Le journal des difficultés (`docs/journal/`) | les galères, par fiche | rempli à la main ; deux fichiers en tout |
| Les captures de rétro (`docs/captures/`) | la rétro et ses décisions | fonctionne : la rétro, elle, est bien stockée |

## Valeur — ce que coûte de ne rien faire

- Une rétro jouée dans une autre session ne voit que ce que le carnet et la mémoire de l'agent ont
  gardé ; un sprint sans note est un sprint oublié.
- La clôture de session archive parfois le journal d'une autre session : le récit est faux sans le dire.
- Les mesures de coût et de qualité, d'un sprint à l'autre, ne s'accumulent nulle part.

## Proposition

```
sprint (n'importe quelle session)        rétro (une autre session)
  start → stories → close                  lit les comptes rendus depuis la dernière capture
                      │                     + le carnet de rétro
                      └─▶ docs/sprints/<date>-sprint-<slug>.md   (committé)
                           objectif · lot et résultat de chaque story · décisions de CE sprint
                           galères · revues · coût
```

1. **Au `close`, un compte rendu par sprint**, sur le patron « gabarit + extracteur + rendu » : un script
   sort les faits (lot, commits ou PR, dates, galères du journal, revues), le texte se rédige sur un
   gabarit unique. Il ne garde que ce sprint.
2. **Committé avec l'incrément**, en mode local comme en mode PR (le moment exact se tranche au
   grooming).
3. **La rétro lit tous les comptes rendus** écrits depuis sa dernière capture, quelle que soit la
   session.
4. **L'archive de session devient un sommaire** des comptes rendus de la session.

## Critères d'acceptation

- [ ] Après `sprint.sh close` (incrément scellé), `docs/sprints/<date>-sprint-<slug>.md` existe, est
      committé, et porte les sections du gabarit.
- [ ] Le compte rendu ne contient que le lot, les décisions et les galères de ce sprint, même quand le
      `SPRINT.md` du dossier hérite d'une autre session (cas reproduit).
- [ ] Les faits (lot, commits ou PR, dates) viennent d'un script, pas d'une recopie à la main.
- [ ] `ezk-retro run` liste les comptes rendus écrits depuis la dernière capture, y compris ceux de deux
      sessions différentes (cas reproduit).
- [ ] Un sprint abandonné (`close --abandon`) laisse aussi un compte rendu, avec sa raison.
- [ ] L'archive de session renvoie aux comptes rendus de la session, au lieu de recopier `SPRINT.md`.

## Comment vérifier

```bash
cd products/mega-city && pnpm test:scripts
bash products/mega-city/skills/ezk-sprint/scripts/sprint.sh close   # → écrit et committe le compte rendu
ls docs/sprints/
```

## Dépendances constatées (2026-10-08)

État réel des pièces voisines et de la fondation, vérifié sur `main` :

| Fiche | État | Effet sur cette fiche |
|---|---|---|
| [clôture committe l'archive](20261005100026946_cloture-session-committe-son-archive.md) | **livrée** (ADR-0063) | acquis : l'archive de session est déjà committée ; le critère « l'archive renvoie aux comptes rendus » s'appuie dessus |
| [rapport de sprint / métriques](20260826082120062_domaine-metriques-de-sprint-rapport.md) | **livrée** | base de format + dossier `docs/sprints/` déjà posés ; on compose avec, on ne refait pas |
| [journal par branche](../20261004181110201_sprint-md-par-branche-hors-worktree.md) | `idea` | voisine, pas bloqueur (journal vivant ≠ compte rendu durable) |
| [rapport ne retrouve pas la trace supervision](../20261002230039863_sprint-report-trace-supervision.md) | `idea` | voisine, pas bloqueur |
| [chemins `scrum:` configurables](../20261001192624192_regrouper-artefacts-methode-dossier-scrum.md) | `ready`, **V0.9** | **planifiée APRÈS** cette fiche (V0.7) → on ne l'attend pas |

**Lieu tranché : `docs/sprints/` maintenant.** La fondation `scrum:` arrive en V0.9 ; cette fiche est en
V0.7. Le compte rendu vit donc dans `docs/sprints/` (là où le rapport déjà livré écrit). Quand `scrum:`
atterrira, la relocalisation passera par ce mécanisme — ce n'est pas un bloqueur ici.

## Notes / décisions

- 2026-10-05 : créée à la demande du PO, après la clôture de la session V0.5 + cockpit. P1 ; rattachée
  à l'origine V0.6, **réassignée V0.7** (le front-matter fait foi : `version: V0.7`).
- **À groomer avant de construire** : le lieu des fichiers (`docs/sprints/`, ou le dossier
  « process » de la fiche « Regrouper les artefacts de méthode hors de docs/ », 20261001192624192), le
  moment du commit en mode PR, et peut-être un ADR sur le format. Six critères : au seuil de la règle
  `token-economy/fiche-tient-dans-un-sprint` ; à découper si le grooming en ajoute.
- Voisines, à regrouper au grooming :
  - « Le journal de sprint se range par branche, hors du worktree » (20261004181110201) : le journal
    vivant ; celle-ci, le compte rendu durable ;
  - « La clôture de session committe l'archive qu'elle écrit » (20261005100026946) ;
  - « Le rapport de sprint ne retrouve pas la trace de supervision d'un sprint » (20261002230039863) ;
  - le rapport de sprint livré (20260826082120062), dont le dossier et le format peuvent servir de base.
