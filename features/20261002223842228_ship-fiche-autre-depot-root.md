---
id: "20261002223842228"
title: "ship:fiche livre aussi les fiches d'un autre dépôt (--root)"
type: feature
priority: P2
product: mega-city
milestone:
version:
labels: [cross-repo]
status: ready
pr:
evidence: none # commande en ligne de commande, aucun écran
created: 2026-10-03
---

# 20261002223842228 — ship:fiche livre aussi les fiches d'un autre dépôt (--root)

**En clair.** La commande qui livre une fiche, `ship:fiche`, ne savait agir que sur le backlog de
vectorz. Les projets qui utilisent la méthode, comme muti, faisaient donc leurs ships à la main. On
lui ajoute l'option `--root <dossier>` : elle livre alors les fiches de ce dépôt, avec les mêmes
contrôles et le même retour arrière. Sans l'option, rien ne change.

**Si tu arrives frais.** Le « ship » passe une fiche en `shipped`, la range dans `features/done/`,
recale les liens et régénère l'index `features/BACKLOG.md`. muti est un projet qui range son backlog
comme vectorz.

## Contexte / Problème

`products/mega-city/bin/ship-fiche.ts` calculait la racine du dépôt depuis son propre emplacement.
Le résultat était toujours vectorz.

Sur muti, chaque ship se faisait donc à la main. Il fallait éditer le statut, faire `git add` avant
le `git mv` vers `done/`, régénérer l'index et réparer les liens. C'est arrivé le 2026-10-02 (fiche
muti 20261002230051174, PR elzinko/muti#273), et avant sur la PR muti #268.

Le script de régénération, `regen-backlog.sh [racine] [titre]`, acceptait déjà une racine. Seule la
commande de ship était figée.

## Proposition

- `ship:fiche` accepte `--root <dossier>`, ou `--root=<dossier>`. La racine choisie sert aux
  lectures, aux écritures, au `git mv` et à `regen-backlog.sh`.
- Un chemin relatif se lit depuis le dossier où la commande est tapée. Depuis muti, `--root .`
  suffit.
- Les fiches se donnent relatives au dépôt visé, comme avant.
- Seule l'option compte, pas la variable `EZK_ROOT`. Une variable restée dans le shell ne doit pas
  envoyer des écritures dans un autre dépôt. `backlog:apply` fait le même choix.
- Le skill `ezk-backlog` montre l'usage dans sa section `ship`.

## Critères d'acceptation

- [ ] Avec `--root <dépôt>`, la fiche part dans `features/done/` de ce dépôt, avec
  `status: shipped` et `pr:`.
- [ ] L'index `features/BACKLOG.md` de ce dépôt est régénéré, avec le titre déclaré par son
  `features/README.md`.
- [ ] Le recalage des liens ne casse rien de plus dans ce dépôt.
- [ ] Un `--root` sans dossier, ou vers un dossier absent, est refusé (code 1) sans rien écrire.
- [ ] La variable `EZK_ROOT` seule ne change pas le dépôt visé.
- [ ] Sans `--root`, la commande se comporte comme avant.

## Comment vérifier

Les tests du ship. Deux d'entre eux lancent le vrai script sur un dépôt jetable, hors de vectorz :

```bash
pnpm --dir products/mega-city exec vitest run src/backlog/__tests__/ship-fiche.test.ts
```

La suite complète et les tests de scripts :

```bash
pnpm --dir products/mega-city test
pnpm --dir products/mega-city test:scripts
```

Sur muti, un essai à blanc lancé depuis son dossier ne modifie rien :

```bash
pnpm --dir <vectorz>/products/mega-city ship:fiche -- --root . --dry-run --pr '#999' features/<id>_<slug>.md
```

## Notes / décisions

- Cette fiche est une brique de
  [Les skills ezk retrouvent le catalogue mega-city depuis un projet hôte](20261002155911257_skills-trouvent-mega-city-depuis-projet-hote.md).
  Celle-ci garde l'autre moitié : `ship-in-pr.sh` cherche encore `products/mega-city` dans le dépôt
  courant.
- Essai du 2026-10-03 sur une copie jetable de muti : ship complet, aucun lien cassé en plus. La
  ligne 1 de l'index de muti perd « — MUTI », parce que son `features/README.md` ne déclare pas
  `backlog_title:`. La correction se fait dans muti.
- Écart repéré, non traité : avec `backlog:apply`, un `--root` relatif se lit depuis
  `products/mega-city`, pas depuis le dossier de la commande.
