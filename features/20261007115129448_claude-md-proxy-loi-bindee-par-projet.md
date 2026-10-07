---
id: "20261007115129448"
title: "CLAUDE.md = simple proxy vers la loi, bindée par projet et visible dans le dépôt"
type: refactor
priority: P2
product: vectorz
milestone: rationalisation
version: V0.9
labels: [convention, loi]
status: idea
pr:
evidence: none # refactor d'outillage/convention, pas d'UI
created: 2026-10-07
---

# 20261007115129448 — CLAUDE.md proxy + loi bindée par projet

**En clair.** Aujourd'hui le `CLAUDE.md` du projet **recopie** des règles de clarté en dur, et la
loi compilée de la méthode vit **hors du dépôt** (`~/.claude/rules/iamthelaw.md`, déploiement
global) — donc invisible quand on feuillette le projet. On veut l'inverse : un `CLAUDE.md` **mince
qui pointe** vers la loi, et une loi **bindée par projet** (`.iamthelaw/` dans le dépôt), visible et
versionnée avec le code. Effet : on voit la loi qui s'applique, et on ne duplique plus les règles.

**Si tu arrives frais.** La « loi » de la méthode, ce sont des règles (`products/mega-city/rules/`)
compilées par l'outil `lawgiver` (`products/mega-city/bin/lawgiver.ts`). `bind-global` pose le
compilé dans `~/.claude/` (global, tous projets) ; `bind` le pose dans `.iamthelaw/` **à l'intérieur
d'un projet** (local, visible). `CLAUDE.md` est le fichier d'instructions que Claude Code lit au
démarrage d'un projet.

## Contexte / Problème

Constat PO du 2026-10-06/07, en lisant le `CLAUDE.md` de vectorz :

- **Le `CLAUDE.md` porte des règles en dur.** Il redit la règle de clarté (« En clair d'abord »,
  phrases courtes, Markdown seul…) au lieu de **pointer** vers elle. Toute évolution de la règle
  oblige à éditer deux endroits, qui divergent.
- **La loi est invisible dans le projet.** Elle est déployée en global (`~/.claude/rules/`), hors du
  dépôt. Le PO ne la voit pas en feuilletant vectorz — « ça m'embête de ne pas voir ». Elle n'est
  donc ni versionnée avec le code, ni relisible en revue.

Le principe visé : **le `CLAUDE.md` est un aiguilleur**, la loi est la source. C'est le même esprit
que l'ADR-0029 côté fiches (« la fiche est le document, la PR en est le rendu ») appliqué aux
règles : une seule source, des rendus qui pointent.

## Proposition

POC d'abord (binder vectorz sur lui-même, dogfooding), polish ensuite.

1. **Binder vectorz par projet** : `lawgiver bind` pose la loi compilée dans `.iamthelaw/` **dans le
   dépôt**, versionnée. Le global reste comme filet pour les projets pas encore bindés.
2. **Amincir `CLAUDE.md`** : il garde l'orientation (le ton, « écris pour être lu »), mais **renvoie**
   à la loi bindée plutôt que de recopier les règles. Un paragraphe + un lien, pas un règlement.
3. **Vérifier le canal** : Claude Code lit bien `.iamthelaw/ENTRY.md` quand il est présent, et le
   `CLAUDE.md` n'introduit pas de règle qui ne soit pas dans la loi.

## Critères d'acceptation

- [ ] La loi compilée de vectorz est présente **dans le dépôt** (`.iamthelaw/`), versionnée.
- [ ] `CLAUDE.md` ne **recopie** plus de règle : il oriente et **pointe** vers la loi bindée.
- [ ] Une règle modifiée dans `rules/` + un `bind` suffit à mettre à jour ce qui s'applique au
      projet — aucune édition manuelle en double dans `CLAUDE.md`.
- [ ] Le choix global-vs-projet est tranché et consigné (ADR court) : quand binder par projet,
      quand garder le global.

## Comment vérifier

```bash
# 1. La loi bindée existe dans le dépôt.
ls .iamthelaw/ENTRY.md
# 2. CLAUDE.md ne recopie plus les règles : il pointe (présence d'un lien vers la loi, pas d'un
#    bloc de règles dupliqué). Contrôle humain + grep d'un lien.
grep -nE "iamthelaw|\.iamthelaw|loi" CLAUDE.md
# 3. Le bind est rejouable depuis le dépôt.
pnpm --dir products/mega-city lawgiver bind default --root "$(git rev-parse --show-toplevel)"
```

## Glossaire

- **binder (bind)** : compiler la loi (règles + bundles) vers un fichier d'entrée que Claude Code
  lira ; `bind-global` → `~/.claude/`, `bind` → `.iamthelaw/` du projet.
- **proxy / aiguilleur** : un `CLAUDE.md` qui ne porte pas les règles mais renvoie à leur source.

## Notes / décisions

- **Origine** : revue PO 2026-10-06/07 (lecture du `CLAUDE.md` + question « iamthelaw, global ou par
  projet ? »). Jugé connexe au rangement, d'où le lot V0.9, mais concern distinct des docs → fiche
  à part.
- **Lien** : fiche sœur [regrouper les artefacts de méthode](20261001192624192_regrouper-artefacts-methode-dossier-scrum.md),
  même lot « Ranger la maison ».
- **Prior art** : fiches déjà livrées sur lawgiver — `0106` (bind cap claude-code), `0111` (migrer
  les rulesets vers iamthelaw), `0140` (geler/archiver iamthelaw). Vérifier au grooming qu'on ne
  recoupe pas leur périmètre.
