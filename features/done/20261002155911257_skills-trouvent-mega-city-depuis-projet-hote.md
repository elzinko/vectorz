---
id: "20261002155911257"
title: "Les skills ezk retrouvent le catalogue mega-city depuis un projet hôte"
type: bug
priority: P1
product: mega-city
milestone:
version: V0.5
labels: [cross-repo]
status: shipped
pr: "#343"
evidence: none # outillage, pas d'écran
created: 2026-10-02
---

# 20261002155911257 — Les skills ezk retrouvent le catalogue mega-city depuis un projet hôte

**En clair.** Les skills ezk appellent leurs outils par `pnpm --dir products/mega-city …`, un chemin
qui n'existe que dans vectorz. Depuis un projet qui utilise la méthode, comme muti, le ship ou la
régénération du backlog échouent. Or la commande `ezk` installée sur le poste sait déjà où vit
mega-city. Les skills passent par elle, en nommant le projet visé avec `--root`.

**Si tu arrives frais.** *mega-city* est le catalogue d'outils de la méthode (scripts du backlog, des
rétros, des vues). Il vit dans `vectorz/products/mega-city`. Un *projet hôte*, comme muti, utilise la
méthode depuis son propre dépôt. Une *commande projet* est une commande `ezk` qui accepte `--root`
pour viser un autre projet que vectorz.

## Contexte / Problème

Session muti du 2026-10-01 :

- `ezk-backlog ship` et `regen` impossibles depuis muti : le ship d'une fiche mergée a dû être fait à
  la main (PR muti #268).
- Effet de bord : le pilote a conclu à tort « mega-city absent de cette machine », alors qu'il était
  dans le dépôt voisin.
- Même trou pour `ezk:config` et `retro:captures`. Appelés avec le chemin absolu de vectorz, ils
  marchent : seul le chemin pose problème.

**Ce qui existe déjà** (lu le 2026-10-03) :

- **La commande `ezk` trouve mega-city toute seule.** `~/.local/bin/ezk` est un lien vers
  `vectorz/products/mega-city/bin/ezk.mjs`. C'est le point de résolution que cette fiche voulait
  créer.
- **Quelques commandes visent déjà un autre projet** avec `--root` : `backlog check`, `plan-head`,
  `plan-lot`, `rules`, `dor`. Sans `--root`, une commande vise vectorz, comme avant.
- **Le script de ship accepte `--root`** depuis la PR #336 (2026-10-03), mais `ezk backlog ship` n'est
  pas encore une commande projet.

**Ce qui reste cassé.**

- Les skills ne passent pas par `ezk` : 27 appels `pnpm --dir products/mega-city …` dans 7 skills,
  dont 14 dans `ezk-backlog`.
- `backlog ship`, `backlog regen`, `backlog version`, `retro captures` et `config` ne sont pas des
  commandes projet.

**Valeur.** Chaque projet hôte peut livrer et ranger ses fiches sans geste à la main. Et plus aucun
pilote ne conclut à tort que la méthode manque sur le poste.

## Proposition

1. **Le point de résolution est la commande `ezk`.** Pas de nouvelle variable. Si `ezk` est absent,
   le skill le dit et indique comment l'installer (`pnpm link --global` depuis
   `vectorz/products/mega-city`). Jamais un `ENOENT` brut.
2. **Les skills appellent `ezk <domaine> <verbe> --root <racine du projet>`.** La racine est celle
   du dépôt git où tourne le skill (`git rev-parse --show-toplevel`). La cible est toujours nommée,
   jamais devinée.
3. **Les commandes dont un skill a besoin depuis un projet hôte deviennent des commandes projet** :
   `backlog ship`, `backlog regen`, `backlog version`, `retro captures`. Plus `config show`, déjà
   prévue par la fiche du tableau de bord : elle ne se construit qu'une fois.

**Hors périmètre.** Changer le défaut : sans `--root`, chaque commande continue de viser vectorz.

## Critères d'acceptation

- [x] Depuis muti, le ship d'une fiche et la régénération du backlog aboutissent, sans chemin tapé à
      la main. Ils ne modifient que `features/` de muti.
- [x] Depuis muti, `ezk retro captures --check` et `ezk config show` marchent aussi.
- [x] Sans `ezk` installé, le skill dit comment l'installer.
- [x] `ezk-backlog`, `ezk-retro`, `ezk-sprint`, `ezk-product-build` et `ezk-pr` ne contiennent plus
      `pnpm --dir products/mega-city`.
- [x] Sans `--root`, chaque commande se comporte comme aujourd'hui.

## Comment vérifier

```bash
# 1. non-régression : la gate mega-city reste verte
cd products/mega-city && pnpm typecheck && pnpm test && pnpm test:scripts

# 2. plus aucun chemin en dur dans les skills utilisés depuis un projet hôte → 0
grep -c "pnpm --dir products/mega-city" \
  products/mega-city/skills/{ezk-backlog,ezk-retro,ezk-sprint,ezk-product-build,ezk-pr}/SKILL.md

# 3. depuis muti : les commandes visent muti, pas vectorz
cd <chemin-de-muti>
ezk backlog regen --root "$(git rev-parse --show-toplevel)"
ezk retro captures --check --root "$(git rev-parse --show-toplevel)"
ezk config show --root "$(git rev-parse --show-toplevel)"
git status --porcelain   # → seuls des fichiers de features/ de muti ont bougé
```

4. Depuis muti, lancer `/ezk-backlog ship <id>` sur une fiche dont la PR est mergée : il aboutit
   sans chemin tapé à la main.

Sur le terrain : 0 ship à la main sur les 3 prochains ships muti.

## Notes / décisions

- Origine : rétro muti du 2026-10-02 (capture muti
  `docs/captures/2026-10-02-retro-frictions-outillage-cross-repo.md`). Décision PO ✅, P1.
  L'architecte proposait P0 : c'est la frontière muti ↔ vectorz, et elle éteint une cause de fausse
  affirmation.
- Distincte de la fiche `20261001192624192` (sortir les artefacts de méthode de `docs/`).
- Version V0.5 proposée par le pilote (P1 → release en cours) ; à confirmer au planning.
- **Prête le 2026-10-03** (porte de « prête » passée : incident daté, valeur dite, 5 critères
  prouvables, dépendance muti constatée).
- **Groomée le 2026-10-03 : on réutilise `ezk`.** La variable `VECTORZ_ROOT` et la découverte d'un
  dépôt voisin sont abandonnées : la commande `ezk` installée résout déjà mega-city. La cible est
  nommée par `--root`, comme dans la fiche des modèles.
- **Recoupements.** La PR #336 a donné `--root` au script de ship : reste à en faire une commande
  projet. `config show` est aussi un critère de la fiche
  [Un seul tableau de bord pour tous tes projets](../20260904080827072_admin-partage-multiprojets-vs-app-par-projet.md) :
  la première des deux fiches construite la livre.
- **À trancher au build** : `ezk-ci` (3 appels) et `supervision-analyze` (1 appel) servent surtout
  vectorz. Les passer aussi par `ezk`, ou les laisser.
- Dépendance muti — accès constaté le 2026-10-03. Dépôt git dans `~/git/bacasable/muti`, sur `main`.
- **Construite le 2026-10-03** (run V0.5). Trois décisions de build :
  1. **Un worktree de vectorz lance son propre `ezk`.** Le `ezk` du poste pointe sur le dossier
     principal de vectorz ; depuis un worktree, il refusait toute commande « fixe ». Il passe
     désormais la main au lanceur du worktree, s'il a ses dépendances. Sans ce relais, passer les
     skills par `ezk` cassait tout le travail en worktree.
  2. **Une commande qui écrit (`writes: true`) n'écoute que `--root`.** `backlog ship`, `regen`,
     `version` et `config` ignorent une variable `EZK_ROOT` restée dans le shell, et le script ne la
     reçoit pas. C'est la règle que `ship:fiche` suivait déjà.
  3. **`ezk-ci` et `supervision-analyze` gardent leur appel** : ils servent vectorz seul.
  Référence unique : `products/mega-city/docs/ezk-depuis-un-projet-hote.md`.
- Preuve des critères 1 et 2, le 2026-10-03, sur une copie jetable de muti avec le lanceur de la
  branche : `regen` (titre « MUTI » gardé, 193 fiches), ship d'une fiche (passée dans `done/` de
  muti, vectorz intact), `config show`, `retro captures --check`. Le geste depuis le vrai muti
  (item 4 de « Comment vérifier ») suit le merge et la mise à jour du dossier principal de vectorz.
