---
id: "20260816151112162"
title: "Installer les slash-commands comme les skills"
type: feature
priority: P3
product: mega-city
version: V0.4
labels: [installation]
epic:
status: idea
pr:
created: 2026-08-16
---

# 20260816151112162 — Canal `commands:` dans lawgiver

## En clair

Claude Code charge trois sortes d'outils depuis `~/.claude/` : les skills, les agents et les
slash-commands (les `/trucs` du chat). Lawgiver, le moteur qui reconstruit ce dossier depuis le dépôt,
n'en connaît que deux. La commande `/ezk-help` a donc été copiée à la main : elle ne se réinstalle pas sur
une autre machine. On apprend à lawgiver un troisième canal, `commands:`, qui se comporte comme les deux
autres (copie ou lien, jamais d'écrasement d'un fichier de l'utilisateur).

## Où on en est (relu contre le code du 2026-10-01)

- Les profils (`profiles/*.yml`) n'ont que `bundles`, `agents`, `skills`. La source de la commande existe
  déjà : `products/mega-city/commands/ezk-help.md` (façade du CLI `ezk help`).
- La condition posée en août est levée : l'option A attendait la décision plugin. `0170` (modèle d'extension)
  est close ; `0087` (distribuer en plugin) est parquée (`milestone: parked`). Un plugin
  servirait à distribuer à d'autres ; le canal local reste ce qui rend **ton** `~/.claude` reproductible.
- La garde non destructive (marqueur d'en-tête, ici posé par la fiche 20260813095351680) et le diagnostic
  `status` / `doctor` existent : le troisième canal les réutilise.

## Décision : option A

Canal `commands:` complet, symétrique des agents. Les options B (ne rien généraliser) et C (script à part)
laisseraient une source de vérité de plus hors de `bind-global`.

- Un profil déclare `commands: [ezk-help]`. Le catalogue lit `commands/*.md` (un fichier = une commande,
  `id` = nom du fichier).
- `bind-global` pose `commands/<id>.md` dans la cible : copie (avec marqueur d'en-tête) ou lien (vers la
  source), comme pour les agents. Un fichier réel sans marqueur n'est jamais écrasé.
- `ezk law status` et `ezk law doctor` comptent aussi les commandes.
- `global.yml` déclare `ezk-help` ; un test garde « toute commande du catalogue est dans `global` ».

## Critères d'acceptation

- [x] Décision A tranchée et journalisée (cette fiche, section « Décision : option A »).
- [x] Un profil accepte `commands:` ; l'héritage (`extends`) les cumule, dédoublonnées et triées. Preuve :
      `src/__tests__/commands-channel.test.ts` (expansion) ; `global.yml` déclare `ezk-help`.
- [x] `bind-global global --target <jetable>` pose `commands/ezk-help.md` en copie ET en `--link`. Preuve :
      tests d'application, et le vrai CLI sur deux dossiers jetables (copie : fichier marqué ; lien : symlink
      vers `products/mega-city/commands/ezk-help.md`).
- [x] Non destructif : un vrai fichier commande de l'utilisateur n'est pas écrasé ; un 2ᵉ passage en copie
      réussit ; copie ↔ lien sans blocage. Preuve : mêmes tests.
- [x] `status` et `doctor` voient les commandes (manquante, copie périmée, lien mort). Preuve : tests de
      diagnostic ; `status` affiche « commands (1) » et `doctor` « Tout est en place : 31 éléments et la loi ».
- [x] Tests : catalogue (`catalog-commands.test.ts`), expansion, plan, application (copie et lien),
      diagnostic (`commands-channel.test.ts`), garde « toute commande du catalogue est dans `global` »
      (`global-profile-covers-ezk.test.ts`), et l'essai bout en bout ci-dessus.
- [x] Preuves sur dossier jetable, jamais sur `~/.claude`. Gate locale verte (typecheck, 1436 tests, scripts
      bash, liens).

## Comment vérifier

```bash
pnpm --dir products/mega-city exec tsx bin/lawgiver.ts bind-global global --target /tmp/essai-lawgiver
ls /tmp/essai-lawgiver/commands            # ezk-help.md
pnpm --dir products/mega-city exec tsx bin/lawgiver.ts status global --target /tmp/essai-lawgiver
```

## Suite (hors de ce POC)

- **Chemin codé en dur** : `commands/ezk-help.md` appelle `pnpm --dir <chemin absolu du dépôt de l'auteur>`.
  Sur une machine neuve, le dépôt n'est pas au même endroit : la commande se pose, mais ne marche que
  si ce chemin existe. À paramétrer (variable résolue au `bind`) avant de dire « reproductible partout ».
- Renommer une commande (registre `renames.yml`, aujourd'hui `skill` / `agent`).
- Commandes en sous-dossiers (`/groupe:nom`) : le catalogue lit un seul niveau.
- Aligner sur le registre de bind de la fiche 0186 si elle se fait.

## Notes

- Déclencheur daté : 2026-08-16, copie manuelle de `/ezk-help` dans `~/.claude/commands/`.
- Cette fiche ne touche pas au CLI `ezk help` (fiche 20260816131704335) : seulement à son déploiement.
- Même thème « distinguer le géré de ce qui est à l'utilisateur » que la fiche 20260813095351680, dont
  elle dépend pour le marqueur.
