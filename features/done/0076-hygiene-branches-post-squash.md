---
id: 0076
title: Hygiène de branches post-squash — classification déterministe absorbée/réelle + suppression aux deux chemins de merge
type: feature
priority: P1
product: mega-city
status: shipped
ready: 2026-07-17
pr: "#31"
created: 2026-07-17
---

# 0076 — Hygiène de branches post-squash (le faux « non-mergé » qui crie au loup)

## Contexte / Problème

Symptôme vécu le 2026-07-17 (vectorz) : **25 branches locales « non-mergées »** signalées
à la clôture — panique du PO (« des features développées et pas mergées ?? ») — alors que
la vérification a prouvé que **100 % de leur contenu était livré**. Cause structurelle :

- la convention du repo est le **squash-merge** (1 fiche = 1 PR = 1 squash) : les commits
  de branche ne deviennent **jamais** ancêtres de main → `git branch --no-merged` les
  signale à vie ;
- il y a **deux chemins de merge** : le PO depuis l'**UI GitHub** (supprime la branche
  remote, jamais la locale — imprévenable côté skill) et les skills (`ezk-sprint`,
  `ezk-pr-pilot`) dont la règle « supprime la branche » ne couvrait ni la copie locale
  ni le worktree ;
- le filet de clôture (`ezk-archive` check n°2) utilisait le `--no-merged` naïf →
  fausse alerte permanente, le vrai pending noyé dans le bruit.

Valeur : « ne rien perdre » ne marche que si le signal est **fiable** — zéro faux
positif (bruit qui fait ignorer l'alerte) et zéro faux négatif (travail réel oublié).
Bonus prouvé pendant l'implémentation : un test ad-hoc en session (zsh, pathspec
non splitté) a rendu 19 faux « absorbée » — la preuve **par script testé** n'est pas
un luxe, c'est la doctrine ADR-0001 appliquée aux branches.

## Proposition — 3 ancrages dans la méthode

1. **`ezk-archive/scripts/check.sh` (le filet — couvre TOUS les chemins, UI GitHub
   incluse)** : classification **déterministe** de chaque branche no-merged —
   **ABSORBÉE** si (a) merger ne changerait rien à la base (`git merge-tree`), ou
   (b) chaque fichier touché a son blob exact dans l'**historique** de la base
   (= contenu présent au moment du squash, même si la base a évolué depuis ; les
   suppressions absentes de la base) ; sinon **RÉELLE** (fichiers non prouvés cités).
   Les branches tenues par un worktree sont marquées `[worktree — remove d'abord]`.
   DoD exécutable : `scripts/test-check-branches.sh` (fixture squash-merge jetable).
2. **Sous-agent `ezk-archive`** : seules les RÉELLES sont du pending (avec action
   proposée — une RÉELLE peut être un brouillon supersédé : jugement sur pièces,
   jamais de suppression silencieuse) ; `run` **purge les ABSORBÉES** comme
   correction sûre (`git branch -D`, prouvé par le script + reflog ~90 j ; worktree
   propre retiré d'abord ; jamais une RÉELLE, jamais un worktree sale).
3. **À la source** : `ezk-sprint` étape 10 et `ezk-pr-pilot ship` suppriment
   branche **remote ET locale** + worktree de session ; après un squash UI GitHub :
   `git fetch --prune` + suppression de la copie locale. `ezk-pr-pilot plan`
   (repo local-only) n'inventorie que les RÉELLES.

## Critères d'acceptation

- [ ] `test-check-branches.sh` vert : squash simple → ABSORBÉE ; squash puis évolution
      de main sur le même fichier → ABSORBÉE (preuve par blob) ; suppression squashée →
      ABSORBÉE ; contenu jamais livré → RÉELLE avec fichiers cités ; le script reste
      strictement read-only.
- [ ] Sur vectorz réel : les résidus squash connus sont classés ABSORBÉE, et les
      brouillons supersédés (contenu jamais byte-dans-main) sont flagués RÉELLE —
      aucun silence.
- [ ] Le sous-agent ne liste plus une ABSORBÉE en pending ; `run` les purge (liste
      affichée) et ne touche jamais une RÉELLE ni un worktree sale.
- [ ] `ezk-sprint` étape 10 et `ezk-pr-pilot ship/plan` portent la règle locale+remote+
      worktree et le cas « squash depuis l'UI GitHub ».
- [ ] Suite mega-city verte (`pnpm test`) + regen backlog sans warning.

## Notes / décisions

- Origine : session review backlog 2026-07-17 (question PO « comment éviter cette
  situation ? consigner ne suffit pas ») — la parade vit dans la méthode, pas dans la
  mémoire d'un assistant.
- La classification est **script-side** (ADR-0001 : le script prouve/range, le LLM
  juge les RÉELLES). `git log --find-object` fait la preuve « a existé dans main »
  sans connaître le SHA de squash.
- Chemin UI GitHub : imprévenable à la source → c'est le **filet** (ancrage 1-2) qui
  le couvre ; la règle `fetch --prune` (ancrage 3) réduit le résidu remote.
