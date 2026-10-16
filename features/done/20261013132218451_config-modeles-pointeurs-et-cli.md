---
id: "20261013132218451"
title: "Config des modèles : pointeurs au bind + commande ezk config (voir/régler)"
type: feature
priority: P1
product: mega-city
milestone: board
version: v0.17.0
labels: [installation, board, config]
status: shipped
blocked:
pr: "local (5b0b559a)"
evidence: none # pointeurs de fichiers + CLI, pas d'écran
split_from: "20261002205205417"
created: 2026-10-13
---

# 20261013132218451 — Config des modèles : pointeurs au bind + commande ezk config

**En clair.** Le réglage d'un rôle arrive à l'agent par un **pointeur mince** posé dans le projet : un
petit fichier d'agent qui porte le modèle et l'effort, puis charge le rôle depuis sa source (jamais
recopié). On voit et on règle tout en terminal : `ezk config show` affiche, pour chaque agent, son
tier, son modèle, son effort et **d'où vient la valeur** ; `ezk config` règle un tier ou un agent, et
écrit dans le projet visé.

**Si tu arrives frais.** Un *pointeur mince* est un fichier d'agent posé dans `<projet>/.claude/agents/`
qui porte le modèle/effort et dit « joue le rôle écrit dans `<source>` ». Le *bind* installe agents,
skills et règles dans un projet. `--root <projet>` dit quelle cible viser.

## Contexte / Problème

Découpée de la fiche [Régler le modèle et l'effort de chaque agent](20261002205205417_modele-effort-agents-par-projet.md),
**côté pointeurs + CLI**. Le schéma et le résolveur pur sont posés par la fiche sœur
[schéma + résolveur](20261013132218242_config-modeles-schema-et-resolveur-pur.md). Ici on **câble** le
résultat du calcul jusqu'à l'agent (le pointeur) et jusqu'au pilote (la commande). Le pointeur mince
est prouvé avec Cursor depuis le 2026-09-04 et avec Claude Code le 2026-10-03 (Claude Code 2.1.274).

## Proposition

- **Le pointeur.** Le `bind` d'un projet n'écrit un pointeur que pour un agent dont le réglage **diffère
  du défaut**. Claude Code préfère l'agent du projet à l'agent global du même nom. Le pointeur porte le
  modèle et l'effort, puis charge le rôle depuis sa source — le texte du rôle n'est jamais recopié
  (ADR-0048).
- **Voir.** `ezk --root <projet> config show` affiche, pour chaque agent : tier, modèle, effort, et la
  **source** de la valeur (défaut / tier du projet / réglage de l'agent).
- **Régler.** `ezk config modeles set <tier> …` et `ezk config agents set <agent> …` réutilisent
  l'écriture actuelle (qui garde les commentaires du fichier), puis mettent à jour les pointeurs du
  projet. Revenir au défaut retire le pointeur.
- **Cibler.** Sans `--root`, l'écriture vise le projet courant ; avec `--root`, le projet nommé. Elle
  **nomme toujours sa cible** et affiche le chemin du fichier modifié.

## Critères d'acceptation

- [ ] Régler le tier `performant` dans samplerz fait tourner l'architecte, le PO et le reviewer de
      samplerz sur ce modèle/effort ; les mêmes agents dans vectorz gardent leur défaut.
- [ ] Un agent réglé à part l'emporte sur son tier.
- [ ] Le pointeur ne recopie pas le rôle : modifier le rôle source une fois suffit, pour tous les projets.
- [ ] `ezk --root <projet> config show` affiche, pour chaque agent : tier, modèle, effort et source.
- [ ] Régler par la commande garde les commentaires du fichier et met les pointeurs à jour ; revenir au
      défaut retire le pointeur.
- [ ] Une écriture affiche le chemin exact du fichier modifié ; sans `--root`, elle écrit dans le projet
      courant, jamais ailleurs.

## Comment vérifier

```bash
cd products/mega-city && pnpm typecheck && pnpm test
ezk --root <samplerz> config modeles set performant --model claude-opus-5-5 --effort xhigh
ezk --root <samplerz> config show   # → ezk-architect : performant · claude-opus-5-5 · xhigh · tier du projet
ezk config show                     # depuis vectorz → ezk-architect : performant · claude-opus-4-8 · high · défaut
head -8 <samplerz>/.claude/agents/ezk-architect.md   # le pointeur porte le modèle, pas le texte du rôle
```

## Notes / décisions

- Découpée de `20261002205205417` le 2026-10-13 (**pointeurs + CLI**). Fiches sœurs, même version
  v0.17.0, milestone `board` :
  [schéma + résolveur pur](20261013132218242_config-modeles-schema-et-resolveur-pur.md) (à construire
  d'abord) et [route gardée + page ⚙ config outil](20261013132218656_config-outil-page-reglage-mapping.md).
- 6 critères, cohérents (un seul chemin voir/régler/pointeur) ; 2 surfaces (CLI `ezk config` + écriture
  de pointeurs au bind) : dans le budget de taille.
- Contrainte du routeur (`src/core/ezk-cli.ts`) : toutes les commandes `config` prennent un verbe
  (`config show`, `config modeles`, `config agents`). Code existant : `bin/ezk-config.ts`,
  pointeur ADR-0048. Question au build : pointeurs du projet committés ou ignorés par git ?
- **État de construction (2026-10-16) — fiche LIVRÉE EN ENTIER (les deux moitiés) :**
  - ✅ **Livré (le « voir et régler en terminal ») :** `ezk config show` affiche, pour chaque agent,
    son tier, son modèle, son effort et la **source** (défaut / tier du projet / réglage de l'agent).
    `ezk config roles set <agent> <tier>`, `ezk config modeles set <tier> <modèle> [effort]`,
    `ezk config agents set <agent> <modèle> [effort]`, et `unset` pour revenir au défaut.
    L'écriture **garde les commentaires** du YAML, **nomme le fichier** modifié, vise le **projet
    courant** sans `--root` ; une **valeur inconnue est refusée** en la nommant. Le résolveur pur
    (fiche 242) sous-tend tout. Loader/writer miroir de `writeGithubConfig`. Tout testé
    (suite mega-city verte). Satisfait les critères « config show … source », « régler garde les
    commentaires », « agent direct l'emporte », « écriture nomme sa cible / projet courant ».
  - ✅ **Livré (le « câblage jusqu'à l'agent ») :** le **pointeur mince au bind**
    (`src/core/model-pointers.ts`, câblé dans `bin/lawgiver.ts` runBind). Au bind d'un projet, un agent
    dont la config modèles **diffère du défaut** reçoit un pointeur mince : il **surcouche** le
    modèle et l'effort (frontmatter) sans recopier le rôle (chargé depuis sa source, ADR-0048) et
    **préserve le reste du frontmatter** (`isolation: worktree`, `model_spare`). Un agent au défaut
    garde son rôle complet ; revenir au défaut (`unset`) **retire** le pointeur au prochain bind. Un
    `.vectorz/config.yml` invalide n'empêche pas le bind (avertissement, pointeurs non appliqués).
    Prouvé de bout en bout (`config agents set ezk-dev gpt-5` + `bind` → `ezk-dev` pointeur gardant
    son isolation, `ezk-architect` complet). Satisfait les critères « fait tourner … sur ce modèle »,
    « le pointeur ne recopie pas le rôle », « met les pointeurs à jour / revert retire ».
