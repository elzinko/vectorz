---
id: "20260823121712909"
title: "lawgiver doctor — détecter un skill du profil non matérialisé dans ~/.claude (le bug /ezk-pr introuvable)"
type: feature
priority: P2
product: mega-city
status: todo
ready:
pr:
created: 2026-08-23
---

# lawgiver doctor — attraper l'écart silencieux entre le profil et le déploiement réel

## En clair

Un skill **listé dans le profil `global`** mais **jamais lié dans `~/.claude`** reste invisible :
`/ezk-pr` a répondu « Unknown command » alors que la fiche était bien dans `global.yml`. Rien ne détecte
cet **écart** entre la liste source et le déploiement réel. On veut un **`lawgiver doctor`** qui le
signale.

## Contexte / Problème

- `global.yml` (liste source) et `~/.claude/skills/` (matérialisation en liens) peuvent **diverger
  silencieusement** : le bind n'a pas été rejoué après l'ajout / le rename d'un skill.
- Symptôme daté (2026-08-22) : `ezk-pr` présent dans `global.yml:40` et dans le repo, mais **aucun lien**
  `~/.claude/skills/ezk-pr` → commande introuvable. Réparé à la main en rejouant `bind-global`.
- Même **famille de bug** que la vue périmée (`PORTFOLIO.md`) : une source à jour, une projection en retard.

## Proposition

- **`lawgiver doctor <profile>`** : compare la **liste du profil** aux **liens matérialisés** dans la cible
  (`~/.claude`) → rapporte les **manquants** et les **liens morts**, plus les **orphelins** mais
  **restreints aux liens gérés par lawgiver** (retour Codex #164). `~/.claude/skills` est une cible
  **partagée** : elle peut contenir des skills **installés par l'utilisateur ou tiers**, hors profil, qui
  ne sont **pas** des orphelins. La détection d'orphelins se limite donc à ce que lawgiver **a lui-même
  posé** (marqueur / manifeste des liens managés — à définir au grooming), sinon faux positifs.
- **Lecture seule** (diagnostic). Un **`--fix`** optionnel et explicite rejoue le bind.
- Composable en **gate** (avant une session, ou après un bind) pour que l'écart ne reste jamais silencieux.

## Critères d'acceptation (à groomer)

- [ ] `lawgiver doctor global` **liste** les skills du profil **non matérialisés** dans `~/.claude`.
- [ ] Détecte les **liens morts** et les **orphelins gérés par lawgiver** (les skills tiers/user hors
      profil ne sont **pas** signalés comme orphelins).
- [ ] **Lecture seule** par défaut ; `--fix` séparé et explicite.
- [ ] Sortie exploitable en gate (code retour non-nul si divergence).

## Comment vérifier

Retirer un lien de `~/.claude/skills/` → `doctor` le **signale** (et `--fix` le recrée).

## Notes / voisins

- Voisins : [[20260816151112162]] (canal `commands:` dans lawgiver), [[20260813095351680]] (bind copy non
  idempotent pour les agents) — même zone (déploiement lawgiver), sujets distincts.
- **Non ready** — à groomer (portée du diagnostic, forme du `--fix`).
