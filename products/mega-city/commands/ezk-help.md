---
description: Index des commandes ezk — terminal (« ezk <domaine> <verbe> ») et chat (skills) —, généré depuis le manifeste et les frontmatter des SKILL.md
argument-hint: "[domaine | nom-du-skill]"
allowed-tools: Bash(pnpm:*)
---
Façade Claude Code de `ezk help` (fiche 20260903134906920, qui prolonge `ezk:help`, fiche 20260816131704335).
Sources de vérité = `products/mega-city/ezk-manifest.yml` (commandes de terminal) et frontmatter des
`products/mega-city/skills/<name>/SKILL.md` (commandes de chat) — rien codé en dur.

Sans argument : liste les commandes de terminal puis les skills de chat. Avec un nom
(`/ezk-help law`, `/ezk-help ezk-backlog`) : détail d'un domaine de terminal ou d'un skill.

!`pnpm --dir /Users/elzinko/git/bacasable/vectorz/products/mega-city ezk help $ARGUMENTS`

Ci-dessus, l'index ezk généré. Affiche-le tel quel ; ne le reformule pas et n'ajoute pas de commentaire, sauf si l'utilisateur pose une question dessus.
