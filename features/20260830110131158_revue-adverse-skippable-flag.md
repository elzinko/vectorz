---
id: "20260830110131158"
title: Revue adverse skippable par flag — --review adverse|skip (ezk-product-build → ezk-sprint)
type: feature
priority: P2
product: mega-city
version:
epic:
status: idea
ready:
pr:
created: 2026-08-30
---

# 20260830110131158 — Revue adverse skippable par un flag

## En clair

La revue adverse est **déjà obligatoire** : chaque sprint la fait (étape 7 d'`ezk-sprint`,
déléguée à `ezk-reviewer`, verdict GO/NO-GO bloquant). On veut juste pouvoir la **sauter
volontairement** par un flag, pour rester souple sur du trivial ou du jetable — sans jamais
la sauter en silence.

## Contexte / Problème

Aujourd'hui le skip de la revue est un **jugement implicite** : `ezk-sprint` autorise de
sauter une étape « pour le trivial », revue comprise. Rien ne l'expose comme un **choix
explicite et traçable** au niveau du product-build. Résultat : on ne peut pas dire « ce run,
pas de revue » proprement, ni retrouver dans le journal que la revue a été sautée.

À ne pas confondre : la revue adverse **interne** (`ezk-reviewer`, locale, dans la méthode)
n'est pas la revue **Codex** (plugin GitHub, cloud, automatique, hors méthode). Ce flag ne
concerne que la première. Codex reste géré par composition (`ezk-codex`), hors de ce skill.

## Proposition

- **Flag `--review adverse|skip`** (défaut `adverse`) sur `ezk-product-build`.
- **Transmis à `ezk-sprint`** (frontière « compose, ne réimplémente rien ») : c'est `ezk-sprint`
  qui possède l'étape 7 ; il gagne le skip explicite, `ezk-product-build` l'expose et le passe.
- **`skip` retire le reviewer, PAS la gate locale.** Les tests / lint / build (étape 5)
  restent obligatoires. On troque une seconde opinion contre de la vitesse, jamais la sécurité
  de base.
- **En `--mode auto`, jamais d'auto-skip.** Sauter la revue est un choix humain explicite au
  lancement ; `ezk-pm` ne le décide pas seul. Le skip est **journalisé** dans `SPRINT.md` et
  signalé au checkpoint (« revue adverse SKIPPÉE »).

## Critères d'acceptation

- [ ] `ezk-product-build run --review skip` déroule un sprint **sans** l'étape reviewer, mais
      **avec** la gate locale verte.
- [ ] Le skip apparaît dans `SPRINT.md` (`## Notes / décisions`) et au résumé de checkpoint.
- [ ] Défaut inchangé : sans flag, la revue adverse tourne (GO/NO-GO bloquant).
- [ ] En `--mode auto`, le skip n'est jamais pris automatiquement (flag explicite requis).

## Comment vérifier

Lancer un sprint sur une fiche triviale avec `--review skip` : vérifier l'absence de l'étape
reviewer, la présence de la gate locale, et la trace du skip. Relancer sans le flag : la revue
adverse bloque sur un défaut injecté.

## Notes / décisions

- **Instance concrète** d'une idée plus large : rendre les **étapes d'un skill configurables**
  (cf. fiche « schéma d'étapes de skill », même session). Ce flag est le cas particulier
  buildable tout de suite ; le schéma généralisera.
- Touche **deux skills** (`ezk-product-build` + `ezk-sprint`). Origine : revue de conception
  de la bascule du défaut `--mode auto` (session 2026-08-30).
