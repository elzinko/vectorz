---
id: "20261114131613689"
title: "`ezk backlog version tag <v>` : un seul verbe pour la coupe"
type: feature
priority: P1
product: mega-city
milestone: board
version:
labels: [release, contrat]
status: idea
blocked:
pr:
evidence: none # un verbe de la méthode, aucun écran modifié
created: 2026-11-14
---

# 20261114131613689 — `ezk backlog version tag <v>` : un seul verbe pour la coupe

**En clair.** Poser une version demande aujourd'hui deux commandes enchaînées à la main, et rien ne
dit quelles fiches livrées entrent dans la version : depuis la dernière, des dizaines de fiches
livrées n'ont aucun numéro. On propose un seul verbe qui calcule le contenu depuis la dernière
étiquette, propose le numéro, exige la passe qualité, écrit le numéro sur les fiches et pose
l'étiquette en local. C'est le geste derrière le bouton « Versionner » de la maquette ; il attend le
panel adverse qui tranche le modèle de version.

**Si tu arrives frais.** Une *version* est un lot de fiches livrées, attesté par une *étiquette* git
`vX.Y.Z` posée en local. La *coupe* est le geste qui décide ce qui entre dans la version et pose
l'étiquette. La *gate de release* (`ezk release <v>`) est la passe qualité qui doit être GO avant.
Un *objectif* est l'unité de préparation du backlog : le champ `milestone:` des fiches (ADR-0083).

## Contexte / Problème

Ce que l'écran attend. Les pages Version et Versions de la maquette montrent la prochaine coupe (ce
qu'elle contiendrait, le numéro proposé) et un bouton « Versionner » qui l'exécute en un geste.

Ce que le code fait aujourd'hui.

- Les verbes de `ezk backlog version` sont `list`, `check`, `ready`, `close`, `freeze`, `unfreeze`,
  `diff`. Aucun `tag`. `products/mega-city/bin/backlog-version.ts:45`.
- L'étiquette se pose par `close <v> --tag`. Ce verbe exige un verdict `ezk release` GO établi sur
  HEAD (`backlog-version.ts:330-348`), puis crée l'étiquette locale (`:354-357`). Deux commandes à
  enchaîner à la main : `ezk release <v>`, puis `close --tag`.
- Le contenu d'une version vient du champ `version:` des fiches
  (`products/mega-city/src/backlog/versions.ts:1-10`). Il n'est jamais calculé depuis la dernière
  étiquette. Les livrées sans numéro tombent dans un compteur `history` (`versions.ts:170-171`).
- Aucun numéro n'est proposé : `proposedTagOf` complète seulement `vX.Y` en `vX.Y.0` (`versions.ts:55-58`).
- Rien n'écrit `version:` sur les fiches.
- Conséquence relevée le 11 novembre par la carte des écarts : depuis v0.22.0, 76 fiches livrées
  n'ont pas de numéro de version (chiffre de la carte, non recompté ici). Le suivi ne les voit pas.
- Un dossier du 10 novembre pose sept questions sur la coupe et propose ce verbe (sa candidate n° 3).
  Il vit hors de ce dépôt, non committé : `docs/plans/2026-11-10-deux-plans-milestone-run-version-coupe.md`
  dans le worktree `plan-milestones-strategy-f11ded`. Ici, `docs/plans/` n'a que le plan du 23 octobre.

## Proposition

Un seul verbe, POC d'abord, qui compose ce qui existe.

1. **`ezk backlog version tag <v> --dry-run`** imprime la coupe sans rien écrire : les fiches
   livrées sans `version:` dont le commit de livraison suit la dernière étiquette `v*`, groupées par
   objectif (complet ou partiel), plus les correctifs. Le calcul vit une fois, dans le cœur pur.
   `ezk board show --json` lira le même calcul pour son bloc `versions.prochaineCoupe` (voir
   [Les versions publiées comme coupes](done/20261114131612759_versions-publiees-comme-coupes.md)).
2. **Le numéro proposé** (ADR-0088 §2.3). Sans numéro imposé : patch si chaque fiche de la coupe est
   `type: bug`, mineure sinon, majeure sur `--major` seulement. Le verbe refuse un numéro inférieur ou
   égal au dernier tag strict atteignable, ou déjà tagué, et un patch quand la coupe contient une fiche
   hors `type: bug` (ADR-0088 §5) ; il nomme alors les deux sorties.
3. **La gate d'abord** (ADR-0088 §2.4). Sans `--dry-run`, la gate de release joue sur HEAD avant toute
   écriture ; rien n'est écrit sans son GO. La soupape `--release-ok "<raison>"` reste, journalisée.
4. **L'écriture.** Sur GO : `version: <v>` sur les fiches coupées, le fichier de version
   `features/versions/<v>.md` (ADR-0088 §7 : `version`, `date`, `commit`, `gate`, `numero: propose|impose`,
   corps = notes par objectif et correctifs), un commit, puis l'étiquette **locale** sur ce commit, et les
   vues régénérées. Le verbe refuse de tourner hors de la branche principale. Le push reste au PO, dit en
   toutes lettres dans la sortie.

Hors de cette fiche, découpée le 17 novembre : le retrait de `close --tag`, `--seal-versions`,
`ezk run versions` et du gel, et le remplacement de la passe `dod-mecanique`, portés par la sœur
[Retirer les anciens verbes de coupe](20261117141828103_retirer-anciens-verbes-de-coupe.md).

Hors périmètre : le dossier lui-même, son panel et l'ADR-0088, portés par
[Trancher la coupe](done/20261114131613874_trancher-la-coupe-dossier-panel-adr-0088.md). Le tirage par
objectif, porté par [Séquencer par milestone](20261016081021364_sequencer-par-milestone-dependances.md).

## Critères d'acceptation

- [ ] `ezk backlog version tag <v> --dry-run` liste les fiches livrées sans `version:` dont le
      commit de livraison suit la dernière étiquette `v*`, groupées par objectif complet ou
      partiel, plus les correctifs, sans rien écrire.
- [ ] Sans numéro imposé, la commande propose un numéro : patch si chaque fiche est `type: bug`,
      mineure sinon, majeure sur `--major` seulement ; elle refuse un numéro inférieur ou égal au
      dernier tag strict, et un patch qui couperait une fiche hors `type: bug`.
- [ ] La commande refuse si le verdict `ezk release <v>` n'est pas GO sur HEAD, et accepte
      `--release-ok "<raison>"`, journalisée dans la sortie.
- [ ] Sur GO, la commande écrit `version: <v>` sur les fiches coupées et `features/versions/<v>.md`,
      committe, pose l'étiquette locale sur ce commit et régénère les vues ; sa sortie dit que le push
      reste au PO. Tout se vérifie sur des dépôts jetables : aucune vraie étiquette n'est posée sur vectorz.
- [ ] Les livrées d'avant le champ `version:`, sans commit de livraison connu, restent dans
      l'historique et n'entrent dans aucune coupe.
- [ ] Le cœur du calcul de coupe est couvert par des tests sans I/O ; `board show --json` l'appelle
      sans le dupliquer.

## Comment vérifier

Sur une copie jetable du dépôt, jamais sur vectorz lui-même : poser une version reste un geste du PO.

```bash
ROOT="$(git rev-parse --show-toplevel)"
COPIE="$(mktemp -d)/vectorz" && git clone -q "$ROOT" "$COPIE"
ezk --root "$COPIE" backlog version tag --dry-run          # la coupe et le numéro proposé, rien d'écrit
git -C "$COPIE" status --porcelain features                # vide
ezk --root "$COPIE" backlog version tag --release-ok "copie jetable"   # écrit version:, le fichier de version, committe, tague
git -C "$COPIE" tag -l 'v0.*' | tail -1                    # la nouvelle étiquette, locale à la copie
ls "$COPIE/features/versions/"                             # <v>.md
```

Tests à lancer :

```bash
pnpm --dir products/mega-city test -- src/backlog/__tests__/versions.test.ts
pnpm --dir products/mega-city test -- src/__tests__/backlog-version-bin.test.ts
```

Aucune preuve d'écran : la fiche change un verbe, pas un écran.

## Glossaire

- `coupe` — le geste qui décide ce qui entre dans une version et pose son étiquette.
- `étiquette` — un tag git `vX.Y.Z`, posé en local ; le push est un geste du PO.
- `objectif` — l'unité de préparation du backlog, le champ `milestone:` des fiches (ADR-0083).
- `gate de release` — `ezk release <v>` : la passe qualité GO / NO-GO qui précède l'étiquette.

## Notes / décisions

- Origine : [la carte des écarts du 14 novembre](../docs/maquettes/2026-11-14-carte-des-ecarts-maquette-code-backlog.md),
  écart E4 (pages Version, Versions).
- **Blocage `panel`.** Le dossier du 10 novembre n'a pas eu son panel adverse. Le modèle de version
  (contenu d'une coupe, sort des verbes existants) doit être tranché avant le build :
  [Trancher la coupe](done/20261114131613874_trancher-la-coupe-dossier-panel-adr-0088.md). La fiche
  reste P1 parce que la page Versions repose sur ce verbe.
- Décision du PO du 14 novembre (à confirmer par le panel adverse avant d'être écrite en ADR) : le
  nom en clair d'une version vit dans le front-matter de la version elle-même, pas dans `PLAN.md`.
  Elle est portée par [Les versions publiées comme coupes](done/20261114131612759_versions-publiees-comme-coupes.md)
  et [Trancher la coupe](done/20261114131613874_trancher-la-coupe-dossier-panel-adr-0088.md). Ce verbe
  pose le numéro, pas le nom.
- Fiches livrées dont le code bouge ou disparaît :
  [Découper le backlog en versions](done/20260824204751403_preparation-lots-versions-coherence.md)
  (le socle `list / check / close`),
  [Auto-tag et clôture de version en local](done/20261013131852581_auto-tag-close-local-opt-in.md) (`--seal-versions`),
  [ezk-product-build enchaîne plusieurs versions](done/20261013131852375_product-build-boucle-multi-versions.md) (`run versions`),
  [Cycle de vie d'une version](done/20261014200651962_cycle-vie-version-preparer-figer-developper.md)
  (les étiquettes `freeze/`),
  [La version est un checkpoint du run](done/20261015125606808_frontiere-version-checkpoint-run-autonome.md).
- Voisine : [Proposer la version d'une fiche](20261008192643426_proposeur-version-sprint-aware.md), différée.
- ADR de la méthode : [0083 — version, étiquette, milestone](../products/mega-city/docs/adr/0083-version-etiquette-milestone-unite-de-preparation.md)
  et [0070 — le tirage reste dans la version en cours](../products/mega-city/docs/adr/0070-le-tirage-reste-dans-la-version-en-cours.md).
- Risque : retirer `--seal-versions` change le comportement d'un lancement autonome qui s'en servait.
  La compétence doit dire le nouveau geste.
- Risque : une fiche n'a pas de champ « date de livraison ». Le calcul « commit postérieur à la
  dernière étiquette » suppose un commit de livraison lisible par fiche. À établir au panel.

## Journal

- 2026-11-17 — groomée sur l'ADR-0088 §2, §5 et §7, puis découpée en deux par le run autonome (ezk-pm, par délégation du PO) : ce verbe ici, six critères ; le retrait des anciens verbes dans la sœur [Retirer les anciens verbes de coupe](20261117141828103_retirer-anciens-verbes-de-coupe.md). Le calcul « livré depuis la dernière étiquette » existe depuis le 17 novembre (`src/core/coupe.ts`) : ce verbe le réutilise.

- 2026-11-14 — créée depuis la carte des écarts (lot validé par le PO), `blocked: panel`.
- 2026-11-14 (soir) — le panel adverse de la coupe a eu lieu ([capture](../docs/captures/2026-11-14-panel-coupe-deux-plans-milestone-version.md)) :
  blocage levé. L'[ADR-0088](../products/mega-city/docs/adr/0088-deux-plans-milestone-unite-du-lancement-version-coupe.md)
  (accepté par le PO le 15 novembre) fixe ce que cette fiche construit : la borne de la coupe, le numéro proposé
  sur le type des fiches, la séquence gate d'abord puis écriture puis tag, les deux refus, le retrait du gel et de
  `close --tag`, `--seal-versions`, `ezk run versions`. À groomer avec ces amendements avant d'être prête.
