---
id: "20260920185910202"
title: Complétion dynamique des paramètres dans le /slash Claude Code (menu qui filtre)
type: feature
priority: P3
product: mega-city
version:
epic:
labels: [cli, decouvrabilite]
status: idea
ready:
pr:
evidence: none # affordance de saisie, pas d'écran d'app
created: 2026-09-20
---

# 20260920185910202 — Complétion dynamique des paramètres (Claude Code /slash)

**En clair.** Quand on tape une commande `/ezk-…` dans Claude Code et qu'on arrive aux
options (`--`), rien ne propose les paramètres restants ni leurs valeurs. Il faut les
connaître par cœur. L'idée : un **menu qui se remplit à mesure** — les flags encore
disponibles, leurs valeurs, en masquant ceux déjà tapés. But du PO : lancer les modes sans
retaper des paramètres complexes de mémoire. **⚠️ Spike tranché le 2026-09-20 : Claude
Code ne sait PAS faire ce menu dynamique aujourd'hui — voir le verdict juste en dessous.**

**Si tu arrives frais.** *`/slash`* = les commandes de la méthode invoquées dans Claude Code
(`/ezk-product-build …`). *complétion dynamique* = une liste d'options qui s'affine pendant
la frappe, comme l'autocomplétion d'un shell.

## Spike de faisabilité — VERDICT 2026-09-20 : ❌ pas possible aujourd'hui

Recherche dans la doc Claude Code (agent `claude-code-guide`). **La complétion dynamique
d'arguments dans le `/slash` n'existe pas**, et **aucun point d'extension** ne permet de la
fournir :

- `argument-hint` reste une **chaîne statique** ; la complétion TAB ne couvre que les **noms**
  de commandes, pas leurs arguments.
- Pas de champ frontmatter (type `choices`/`options`), pas de hook, pas d'API MCP, pas de
  script de complétion.
- **Aucune différence** CLI vs app desktop. Rien d'annoncé (doc `code.claude.com`, changelog
  2.1.278 du 19 sept 2026).

**Conséquence.** Le menu dynamique visé ici n'est pas buildable. Ce qui reste :

1. **Vraie complétion → le terminal**, via la fiche sœur [[20260903134908019]] (complétion
   shell `ezk`). C'est LA piste réelle.
2. **Petit lever côté `/slash`** : structurer les `argument-hint` (chaîne statique plus
   lisible). Mineur, pas de l'interactif.
3. **Contournement menu numéroté** rendu par la skill à l'invocation — mais ça recoupe
   [[20260825160456259]] (affordance next-step), pas cette fiche.

**Statut** : gardée en `idea`, **parquée** — à ré-ouvrir seulement si Claude Code ajoute une
complétion d'arguments. Ne pas re-spiker.

## Contexte / Problème

Déclencheur daté : **2026-09-20**, le PO (Thomas), pendant la session de renommage
`--check-ready` → `--review` (ADR-0053). Il veut des « modes auto faciles sans taper plein de
paramètres complexes », et relève qu'il n'y a **aucune complétion** pour l'aider.

Ce qui existe déjà, et ne suffit pas : le champ **`argument-hint`** du front-matter d'une
skill affiche une liste **statique** des options à l'invocation. Utile, mais figé : il ne
filtre pas à mesure, ne masque pas les flags déjà posés, ne propose pas les valeurs d'une
option.

**Réserve de faisabilité (le nœud).** On ne sait pas si Claude Code sait afficher un menu
d'arguments **dynamique** pour une commande de skill. Tant que ce n'est pas vérifié, cette
fiche est d'abord un **spike de faisabilité**, pas un build.

## Proposition (esquisse — à confirmer au grooming)

1. **Spike d'abord** : établir si le `/slash` de Claude Code offre un point d'extension pour
   une complétion d'arguments dynamique, au-delà de l'`argument-hint` statique. Sortie =
   oui/non + par où.
2. Si oui : sur `--`, lister les flags **restants** de la commande `ezk`, avec leurs valeurs
   (`--mode manuel|auto`, etc.), et masquer ceux déjà saisis. Source = l'`argument-hint` /
   le manifeste des commandes, pas une liste réécrite à la main.
3. Si non : consigner la limite, garder l'`argument-hint` statique comme repli, et router le
   vrai besoin vers le terminal (fiche sœur [[20260903134908019]], complétion shell).

## Critères d'acceptation

- [ ] (à définir au grooming — DoR) — commence par le spike de faisabilité
- [ ] Le spike tranche « dynamique possible dans /slash ? » avec une **preuve** (pas une
      supposition), et nomme le point d'extension s'il existe.

## Comment vérifier

<à groomer> Exemple attendu (si faisable) : taper `/ezk-product-build --` et voir la liste
des flags restants s'afficher, `--review` compris, sans ceux déjà tapés. Sabotage : un flag
déjà saisi ne doit plus être re-proposé.

## Glossaire

- `argument-hint` — champ du front-matter d'une skill ; chaîne d'usage **statique** affichée à l'invocation.

## Notes / décisions

- **Sœur terminal** : [[20260903134908019]] (CLI `ezk` complet) — porte la complétion
  **shell** côté terminal. Découpage validé par le PO le 2026-09-20 : cette fiche = surface
  **Claude Code `/slash`** (cible principale) ; la sœur = surface **terminal** (bonus).
- **Voisine, pas doublon** : [[20260825160456259]] (affordance next-step) — propose la
  commande *suivante* en fin de skill ; ici on complète les *paramètres* de la commande en
  cours. Thèmes proches (découvrabilité), gestes différents.
- **Origine** : session de renommage `--check-ready` → `--review` (ADR-0053, Action Item 3).
- P3 = « cool, si possible et pas coûteux » (mot du PO). À confirmer au grooming.
