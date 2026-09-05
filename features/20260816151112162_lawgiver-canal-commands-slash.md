---
id: "20260816151112162"
title: "Canal commands: dans lawgiver — déployer les slash-commands comme les skills"
type: feature
priority: P2
product: mega-city
epic:
status: idea
ready:
pr:
created: 2026-08-16
---

# 20260816151112162 — Canal `commands:` dans lawgiver

## Contexte / Problème

**En clair.** Claude Code sait charger **trois** sortes d'outils depuis ton profil
`~/.claude/` : les **skills**, les **agents**, et les **slash-commands** (les `/trucs`
qu'on tape dans le chat). Chez toi, ce profil n'est jamais bricolé à la main : un moteur
maison, **lawgiver**, le **reconstruit depuis le repo** (`lawgiver bind-global global --link`).
Une seule liste source — `products/mega-city/profiles/global.yml` — dit quoi installer, et
sur n'importe quelle machine `bind-global` te réinstalle exactement les mêmes outils.
Versionné, reproductible : c'est tout l'intérêt.

**Le trou.** lawgiver ne connaît que **deux** des trois sortes : `skills:` et `agents:`.
**Il ignore les slash-commands** — `global.yml` n'a aucune rubrique `commands:`, et
`~/.claude/commands/` n'existait même pas avant aujourd'hui.

**Analogie.** C'est un gestionnaire de paquets qui saurait installer les bibliothèques
(skills) et les plugins (agents), mais **pas** les raccourcis clavier (commands) : ceux-là,
tu es obligé de les recopier à la main sur chaque poste.

**Le cas concret qui a déclenché ça (2026-08-16).** Pour rendre `/ezk-help` invocable, on a
dû **copier le fichier à la main** dans `~/.claude/commands/ezk-help.md`. Ça marche sur
**cette** machine, mais c'est « hors système » :

- ça **ne se réinstalle pas ailleurs** — sur une autre machine, un `bind-global` propre ne
  la remet pas ;
- lawgiver ne la **gère** ni ne la **met à jour** ;
- c'est exactement la dérive « posé à la main, pas piloté depuis le repo » que ta méthode
  combat partout ailleurs.

## Proposition

Apprendre à lawgiver un **3ᵉ canal `commands:`**, symétrique de `skills:` / `agents:` :
une rubrique `commands:` dans les profils, un dossier source dans le repo (déjà amorcé :
`products/mega-city/commands/`), et `bind-global` qui matérialise `~/.claude/commands/<name>.md`
(mode `copy` par défaut, `--link` en live), **non destructif** comme le reste (ne clobbe pas
un fichier utilisateur).

**Options à trancher (le sujet à lire et décider) :**

- **(A) Canal `commands:` complet** — le vrai « comme les skills ». Toucher
  `model` / `catalog` / `expand` / `bind` / `apply` + tests, ajouter `commands:` à
  `global.yml`. Reproductible partout via `bind-global`. Utile si d'autres slash-commands
  ezk viennent — **mais à séquencer après la décision plugin/extension** ([[0087]] / [[0170]],
  voir « Cohérence » ci-dessous) : un plugin Claude Code embarque déjà un dossier `commands/`,
  au risque de rendre ce canal redondant.
- **(B) Ne rien généraliser** — assumer `/ezk-help` comme une **commodité locale**, copiée
  à la main et documentée comme telle. Zéro code. Convient si `/ezk-help` reste la seule
  slash-command.
- **(C) Demi-mesure** — un petit `deploy-command.sh` (comme `skills/ezk-ezk/scripts/deploy.sh`
  pour les skills) qui pose/met à jour la copie depuis le repo, **sans** l'intégrer à
  `bind-global` / `global.yml`. Entre les deux.

## Critères d'acceptation

- [ ] Décision **A / B / C tranchée** et journalisée (note dans la fiche ou ADR court).
- [ ] Si A : `global.yml` accepte une clé `commands:` ; `bind-global global` matérialise
      `~/.claude/commands/ezk-help.md` en `copy` **et** `--link`.
- [ ] Si A : la matérialisation est **non destructive** (un vrai fichier commande
      utilisateur préexistant n'est pas écrasé — même exigence que la garde skills/agents).
- [ ] Si A : un **test** couvre le bind d'une commande (comme `expand`/`apply` le font pour
      les skills).
- [ ] `/ezk-help` **reproductible sur une machine neuve** via `bind-global` (fin de la copie
      manuelle).
- [ ] Gate locale verte (typecheck / lint / tests).

## Notes / décisions

- **Déclencheur daté** : 2026-08-16, installation manuelle de `/ezk-help` (copie dans
  `~/.claude/commands/`, hors lawgiver). La **source versionnée existe déjà** :
  `products/mega-city/commands/ezk-help.md` (façade qui appelle le CLI).
- `/ezk-help` lui-même = le CLI `ezk:help` (`products/mega-city/bin/ezk-help.ts`, fiche
  `20260816131704335`, PR #151). **Cette fiche ne touche PAS au CLI** — seulement à son
  **déploiement** en tant que slash-command.
- Famille lawgiver / déploiement. Voisines : [[0106]] (le cœur `bind`, cap claude-code) ·
  [[20260813095351680]] (idempotence `copy` des agents — même thème « distinguer le géré du
  user », à respecter pour `commands:`).
- Rattachement **lâche** à l'épic [[20260816131703334]] (découvrabilité) via `/ezk-help`,
  mais **hors périmètre** de l'épic (l'épic = *générer la doc* ; ici = *infra de déploiement*).

## Cohérence avec le backlog à venir (mini-review du 2026-08-16)

- **Séquencement (le point dur)** — [[0170]] (P1, « concevoir le modèle d'extension/plugin
  **AVANT** tout adaptateur outillage ») et [[0087]] (P1, distribuer le catalogue en **plugin
  Claude Code** + marketplace). Un plugin Claude Code embarque déjà `commands/`. **⇒ l'option A
  est gated derrière 0170/0087** : ne pas coder un canal lawgiver `commands:` avant de savoir
  si la voie plugin le rend redondant. Tant que ce n'est pas tranché, **B ou C** est le choix
  cohérent.
- **Recouvrement** — [[0186]] (P2, Skema généralisé : versioning + **registre de bind** de
  *tout* artefact mega-city). Une commande n'est qu'un artefact bindable de plus : si 0186 se
  fait, aligner A dessus plutôt que coder un canal ad hoc. Même thème « distinguer le géré du
  user » que [[20260813095351680]] (garde non-destructive), à respecter pour `commands:`.
- **Jumelle `/ezk-help`** — [[20260816140607355]] (P2, *dans* l'épic découvrabilité) exploite
  le **script** `ezk:help` pour générer les compteurs `skills/README` ; cette fiche-ci déploie
  la **slash-command**. Aucun recouvrement — les deux filles de `/ezk-help` se complètent
  (l'une génère, l'autre distribue).
- **Priorité** — P2 cohérente : au niveau des sœurs « mécanique de déploiement » (0186,
  20260813095351680) et **sous** les P1 stratégiques (0087, 0170) qui doivent trancher d'abord.
- **Pas d'épic (constat)** — la famille distribution/déploiement (0087, 0170, 0186,
  [[20260813124026215]], cette fiche, 20260813095351680) est **éclatée en fiches isolées** ;
  un épic « distribution & déploiement » pourrait les regrouper — décision PO, hors scope ici.
