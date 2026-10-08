---
id: "20260813095351680"
title: "Rendre l'installation des skills robuste (3 défauts de lawgiver)"
type: bug
priority: P2
product: mega-city
version: v0.4.0
labels: [installation]
epic:
status: shipped
pr: "#304"
created: 2026-08-13
---

# 20260813095351680 — Matérialisation lawgiver robuste (agents, skills du projet, regroupement)

## En clair

`lawgiver bind-global` en mode copie plante au deuxième passage : il refuse de réécrire un agent qu'il a
lui-même copié. On corrige ce bug en marquant les fichiers qu'il écrit, comme il le fait déjà pour la loi.
On règle aussi deux fragilités voisines de la même installation : les skills posés dans un projet ne
portent pas leurs fichiers annexes, et le regroupement des fichiers d'un skill peut en perdre un sans bruit
dans deux cas rares.

## Où on en est (relu contre le code du 2026-10-01)

- `assertReplaceableAgent` (`src/io/apply.ts`) refuse tout fichier `agents/<id>.md` réel. Un fichier
  plat n'a aucun marqueur « à moi », alors qu'un dossier de skill est reconnu par son contenu
  (ADR-0027) et que le fichier de loi l'est par son en-tête (`src/domain/law-file.ts`, ADR-0056).
- Le cap projet (`src/caps/claude-code.ts`) écrit encore `.claude/skills/<id>.md` (fichier plat) : il ne
  peut porter aucun fichier annexe. Claude Code lit pourtant ses skills dans `.claude/skills/<id>/SKILL.md`.
  Le cap global et le cap bureau, eux, passent par `skillFolderFiles` (ADR-0027).
- `groupBySkillDir` retrouve le dossier d'un skill en cherchant ses `SKILL.md`. Deux cas le trompent
  (retours Codex de la PR #138) : un fichier annexe nommé `SKILL.md` (modèle de skill), et deux skills
  imbriqués (`foo`, `foo/bar`). Aucun skill du catalogue ne les déclenche aujourd'hui (vérifié).

## Décisions

- **Agents : option A** (copie idempotente). La copie d'un agent porte la clé d'en-tête
  `generated-by: lawgiver bind-global`, ajoutée par le cap global (le contenu du plan la contient : `status`
  et `doctor` restent justes). Un fichier réel avec ce marqueur est remplaçable ; sans marqueur, il reste
  protégé, avec un message qui dit quoi faire. Une ancienne copie sans marqueur se supprime à la main une fois.
- **Projet : forme dossier.** `bind <profil> <projet>` écrit `.claude/skills/<id>/SKILL.md` et les annexes
  (via `skillFolderFiles`). Un ancien fichier plat `.claude/skills/<id>.md` n'est pas touché : il coexiste.
  Pas de nettoyage automatique (on ne peut pas prouver qu'il est à nous), mais `lawgiver bind` le SIGNALE
  (retour de la revue adverse : un projet déjà bindé ne garde pas une copie périmée en silence).
- **Regroupement : le plan porte le dossier.** `FileWrite.skillDir` (optionnel) dit à quel skill appartient
  chaque fichier ; plus de déduction par `SKILL.md`. Sans cette métadonnée, l'ancien repérage sert de repli.
  Skills imbriqués : posés dans l'ordre parent puis enfant en copie ; refusés avec un message clair en
  `--link` (un lien sur le parent couvrirait déjà l'enfant, et le retirer abîmerait le catalogue).
- Pas d'ADR : décision journalisée ici (critère de la fiche d'origine : « ADR court ou note »).

## Critères d'acceptation

- [x] Un 2ᵉ `bind-global` en copie réussit, agents compris. Preuve : `src/__tests__/apply-global-robust.test.ts`
      (plan réel du profil `global`, deux passages) ; et le vrai CLI sur un dossier jetable : deux passages
      `bind-global global --target <jetable>` sortent en code 0, `doctor` dit « Tout est en place ».
- [x] Un vrai fichier agent de l'utilisateur (sans marqueur) n'est jamais écrasé ; le refus dit quoi faire.
      Une ancienne copie faite avant le marqueur est dans le même cas : refusée une seule fois, avec le
      message qui dit de la supprimer puis de relancer. Ce n'est pas un défaut. Preuve : mêmes tests (le
      message contient « supprime » et la commande `rm`).
- [x] `status` et `doctor` restent justes : copie à jour = ok, copie périmée = signalée. Preuve : test
      `diagnose` sur une copie à jour puis périmée. `expectedItems` suit aussi le dossier déclaré par le plan.
- [x] `bind <profil> <projet>` porte les annexes d'un skill (`approaches/`, `scripts/` en `+x`) ; un ancien
      fichier plat n'est pas écrasé ni supprimé, et le bind le signale. Preuve : `apply-project-skills.test.ts`
      (dont `staleFlatSkillFiles`), `claude-code.test.ts`.
- [x] Un fichier annexe nommé `SKILL.md` est livré en copie, sans être pris pour un skill. Preuve : `apply-global-robust`
      (y compris au 2ᵉ passage) et `skill-content.test.ts`.
- [x] Deux skills imbriqués sont posés tous les deux en copie ; en `--link`, refus explicite. Preuve :
      `apply-global-robust` (le catalogue n'est pas abîmé, rien n'est écrit).
- [x] Preuves sur dossiers jetables (`--target` ou racine de test), jamais sur `~/.claude`.
- [x] Gate locale verte (typecheck, 1412 tests, scripts bash, liens).

## Comment vérifier

```bash
pnpm --dir products/mega-city exec vitest run apply-global
# sur un dossier jetable, jamais sur ~/.claude :
pnpm --dir products/mega-city exec tsx bin/lawgiver.ts bind-global global --target /tmp/essai-lawgiver
pnpm --dir products/mega-city exec tsx bin/lawgiver.ts bind-global global --target /tmp/essai-lawgiver   # 2ᵉ passage : OK
```

## Suite (hors de ce POC)

- Retirer automatiquement l'ancien fichier plat `.claude/skills/<id>.md` (il faudrait un marqueur écrit par
  l'ancienne version, donc rien de prouvable) : aujourd'hui le bind le signale, à toi de le supprimer.
- Confirmer sur une vraie session que Claude Code ignore la clé d'en-tête `generated-by` d'un agent. Indice :
  `model_spare`, autre clé propre à lawgiver, est déjà déployée dans les agents sans gêner leur chargement.
- Alléger la contrainte qui force `ezk-backlog` à minter ses ids en ligne (« la copie ne livre que
  SKILL.md ») : à évaluer à part, maintenant que le projet porte aussi les scripts.
- Cycle de vie des artefacts déployés (versioning, registre de bind) : fiche 0186.

## Notes

- Voisine de la garde des skills (ADR-0027, PR #138) : même problème de fond, « distinguer le géré de
  ce qui est à l'utilisateur », ici pour un fichier plat.

## Absorbe (tri du 2026-09-30)

Cette fiche a repris le périmètre de :

- [`20260813095351681`](20260813095351681_cap-projet-claude-code-skills-dossier-assets.md) : cap projet
  en forme dossier pour porter les annexes. Ses critères sont intégrés ci-dessus (projet, coexistence).
- [`20260813122619707`](20260813122619707_robustesse-groupage-skill-dir-materialisation.md) : cas
  limites du regroupement par `SKILL.md`. Ses critères sont intégrés ci-dessus (annexe `SKILL.md`, imbrication).
