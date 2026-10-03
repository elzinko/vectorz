---
id: "20261002231845120"
title: BACKLOG.md ne fait plus conflit entre deux PR ouvertes en même temps
type: feature
priority: P1
product: mega-city
milestone:
version:
labels: [backlog]
status: ready
pr:
evidence: none # vue générée et outillage git, pas d'écran
created: 2026-10-03
---

# 20261002231845120 — BACKLOG.md ne fait plus conflit entre deux PR ouvertes en même temps

**En clair.** `features/BACKLOG.md` est un seul fichier, réécrit par toute PR qui ajoute ou livre
une fiche. Deux PR ouvertes en même temps le réécrivent chacune : la seconde à merger entre en
conflit, à chaque fois. Depuis que le ship voyage dans la PR (ADR-0049), **chaque** PR de story le
touche. On veut que deux PR ouvertes en même temps se mergent l'une après l'autre sans conflit.

**Si tu arrives frais.** `BACKLOG.md` est l'index du backlog, **généré** depuis les fiches par
`regen-backlog.sh`. On ne l'édite jamais à la main. L'[ADR-0055](../products/mega-city/docs/adr/0055-artefacts-generes-hors-versionnage.md)
a sorti de git les autres vues générées, mais il a **gardé** celle-ci, parce qu'on la lit sur GitHub.

## Contexte / Problème

**Le symptôme, daté.** 2026-10-03 : la PR #337 (rangement de la rétro) entre en conflit sur
`BACKLOG.md` seul. Le PO : « sans déconner, ça arrive tout le temps ». Depuis le 2026-10-01,
`BACKLOG.md` a été modifié **24 fois** sur `main`, dont 18 par des PR de fiches. Chaque conflit
coûte la même recette à la main : fusionner `main`, garder un côté, régénérer, rejouer la gate,
pousser, puis attendre la CI.

```
PR A : ajoute une fiche  → réécrit BACKLOG.md ─┐
                                                ├─→ la 2e mergée est en conflit
PR B : livre une fiche   → réécrit BACKLOG.md ─┘
```

**Pourquoi ça empire.** La fiche livrée
[« La fiche d'une story arrive en done avec son merge »](done/20261002114435782_done-par-story-a-la-validation.md)
fait entrer le commit ship, donc la régénération de `BACKLOG.md`, dans **chaque** PR de story.
Deux stories en parallèle conflicteront donc toujours.

## Proposition

**Avis d'architecte du 2026-10-03 (grooming, gardé par le PO) : sortir `BACKLOG.md` de git
(piste 1).**

| | 1 · Sortir de git | 2 · La CI régénère après le merge | 3 · Réduire les lignes qui bougent |
|---|---|---|---|
| Conflits | zéro, par construction | quasi nuls : chaque ship recale encore le lien de sa ligne | moins, pas zéro |
| Pièce nouvelle | aucune | un robot qui committe sur `main` après chaque merge | aucune |
| Lisible sur GitHub | non : `PLAN.md` et la liste des fiches le restent | oui | oui |
| ADR révisé | ADR-0055, pour cette seule vue | ADR-0049 §2 (« pas de vues après le merge ») | aucun |
| Risque principal | 17 liens de doc à rediriger | deux merges rapprochés se disputent le commit du robot | deux fiches ajoutées le même jour se touchent encore |

**Pourquoi la piste 1.**

- L'ADR-0055 pose la règle : une vue générée reste dans git si, et seulement si, on la lit sur
  GitHub. Son verdict « lue sur GitHub » pour `BACKLOG.md` a été affirmé, jamais mesuré. Le PO ne
  sait pas s'il la lit là (2026-10-03).
- Sur GitHub, deux vues restent lisibles : `PLAN.md`, la séquence curée et versionnée, et la liste
  des fiches de `features/`, dont les noms `<id>_<slug>` se lisent.
- C'est la piste la plus simple : aucune pièce nouvelle, rien qui écrive sur `main` après un merge.
- Elle est réversible : il suffit de recommiter le fichier.

**Ce que le build change.**

- `features/BACKLOG.md` sort du suivi git (`git rm --cached`) et entre dans `.gitignore`. `regen` et
  `views:regen` le construisent en local, à la demande.
- Les 17 documents qui pointent vers `BACKLOG.md` pointent vers `features/README.md` ou `PLAN.md`.
- `ezk-backlog` (`regen`, `ship`, recette de conflit) et `ship-in-pr.sh` n'ont plus d'index à
  committer.
- Un ADR court révise le verdict de l'ADR-0055 pour `BACKLOG.md`.

**Correction du 2026-10-03.** La première version de cette fiche disait que la piste 2 contredit
l'ADR-0052. C'est faux : l'ADR-0052 décide que GitHub exécute le squash, il n'interdit pas un commit
de robot sur `main`. C'est l'ADR-0049 §2 qui a écarté les vues régénérées après le merge.

## Critères d'acceptation

- [ ] Un ADR court révise le verdict de l'ADR-0055 pour `BACKLOG.md` : la vue n'est plus committée.
- [ ] `features/BACKLOG.md` n'est plus suivi par git et figure dans `.gitignore` ; `regen` le
      construit en local.
- [ ] Un test sur dépôt jetable ouvre deux branches qui ajoutent chacune une fiche, puis les fusionne
      l'une après l'autre dans `main` : aucune ne conflicte.
- [ ] Plus aucun lien du dépôt ne pointe vers `features/BACKLOG.md` (`test-links-repo` vert).
- [ ] La recette « Conflit sur `BACKLOG.md` » est retirée d'`ezk-backlog`, et `ship-in-pr.sh` ne
      committe plus d'index.

**Mesure de suivi** — sur les 10 prochaines PR de story ou de fiche, 0 conflit sur un fichier
généré.

## Comment vérifier

```bash
pnpm --dir products/mega-city test:scripts
```

- Le test de fusion de deux branches de fiches passe.
- `git ls-files features/BACKLOG.md` ne rend rien ; `bash products/mega-city/bin/regen-backlog.sh .`
  le reconstruit en local.
- Relire l'ADR : il révise le verdict de l'ADR-0055 pour `BACKLOG.md`.

## Notes / décisions

- **Suite de** la fiche livrée
  [« Décider quelles vues générées ne plus committer »](done/20260830194601376_spike-degiter-vues-outillage.md),
  qui a produit l'ADR-0055 et gardé `BACKLOG.md` versionné.
- **P1 demandée par le PO** le 2026-10-03 : le conflit touche désormais chaque PR de story.
- **Grooming du 2026-10-03** : technique « avis de l'architecte », gardée par le PO. Faits vérifiés
  le jour même : `main` n'a pas de protection de branche ; 17 documents hors `features/` citent
  `BACKLOG.md` ; la CI (`ci.yml`, `check-links.yml`) ne régénère aucune vue.
- **Gate « prête » passée le 2026-10-03** : problème daté, valeur, critères vérifiables avant le
  merge, décision prise (piste 1). Aucune dépendance hors du monorepo ; aucun critère propre au
  projet (`.vectorz/dor.yml` absent).
- Le juge de la rétro du 2026-10-03 n'a pas vu ce sujet : il est apparu au merge de la PR de
  rangement (#337).
