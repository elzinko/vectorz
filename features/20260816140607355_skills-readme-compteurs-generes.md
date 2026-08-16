---
id: "20260816140607355"
title: "Compteurs & table skills/README générés (câbler /ezk-help, fin de la dérive)"
type: feature
priority: P2
product: mega-city
epic: "20260816131703334"
labels: [doc, decouvrabilite]
status: todo
ready:
pr:
created: 2026-08-16
---

# Compteurs & table skills/README générés

> Fille de l'épic [Rationalisation doc + découvrabilité](20260816131703334_doc-decouvrabilite-rationalisation.md).
> **Déportée** du MVP `/ezk-help` (fiche `20260816131704335`, shippée #151) par arbitrage `ezk-pm` :
> le MVP a livré l'index généré + le test-de-dérive ; ici on branche la **réécriture effective**
> de l'artefact tenu à la main.

## Contexte / Problème

`products/mega-city/skills/README.md` affiche des compteurs **codés à la main** qui ont dérivé :
« 19 skills / 6 agents » alors que le réel est **20 / 7** (l'agent `ezk-archive` oublié, `ezk-codex`
non recompté). Le mécanisme généré existe désormais (`bin/ezk-help.ts` lit les frontmatter — shippé
#151), mais il n'alimente pas encore `skills/README.md` : les compteurs et la table peuvent
continuer à diverger de la réalité.

## Proposition

Fermer la boucle « généré, jamais maintenu » sur `skills/README.md` :

1. **Réécrire les compteurs + la table skills/agents** depuis la source (`bin/ezk-help.ts` /
   `profiles/global.yml` + frontmatters) — un bloc régénéré (marqueurs `<!-- ezk:help:begin -->` …
   `<!-- ezk:help:end -->`) ou un `regen` dédié, comme `regen-backlog.sh`.
2. **Test de non-dérive** : une garde qui **échoue** si le compte affiché dans `skills/README.md`
   diverge du compte réel (mêmes fichiers que `test-scripts.sh`). C'est le filet qui tue le « 19/6 »
   définitivement.
3. **Corriger la valeur courante** (20/7, `ezk-archive` réintégré) au passage.

## Critères d'acceptation

- [ ] les compteurs skills/agents de `skills/README.md` sont **régénérés depuis la source** (pas édités à la main)
- [ ] un test échoue si le compte du README diverge du compte réel du catalogue (câblé dans `test:scripts`)
- [ ] la valeur courante est correcte (20 skills / 7 agents à ce jour) et l'agent `ezk-archive` figure dans la table
- [ ] gate locale verte

## Notes

- S'appuie sur `bin/ezk-help.ts` (déjà shippé) — réutiliser sa lecture de frontmatter, ne pas la redupliquer.
- Voisines : épic parent · [[0068]] (method-map à la main — même antipattern).
