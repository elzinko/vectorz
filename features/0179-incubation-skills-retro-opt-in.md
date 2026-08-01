---
id: 0179
title: Incubation de skills en rétro — opt-in sprint + mesure (pas un jeu formel)
type: feature
priority: P2
product: mega-city
version:
epic:
status: idea
ready:
pr:
created: 2026-08-01
---

# 0179 — Incubation de skills / capacités pendant la rétro

## Contexte / Problème

La rétro (`ezk-retro`) produit déjà des propositions `action` / `feature` / `spike` /
`règle`. Manque un **pattern léger** pour : proposer une **capacité ezk à éprouver**
pendant le sprint suivant, la mesurer en fin de sprint, tracker dans le CR rétro + fiche —
sans formaliser un « jeu de l'évolution » lourd.

Symptôme vécu (session 2026-08-01 city-guided) : envie d'ajouter `ezk-checks` au catalogue
**et** de l'éprouver à la main **avant** câblage process.

## Proposition (variante recommandée)

**Opt-in sprint + tracker** — la plus simple :

1. En **rétro** (`ezk-retro run`) : si une friction « on a fait X à la main N fois » →
   proposition typée `feature`/`spike` = « incubate skill Y ».
2. Le PO tranche : skill draft + fiche backlog (`idea`) ; **pas** d'ajout auto à ezk-sprint.
3. Pendant le sprint : usage **manuel** (`/ezk-<skill>`) sur ≥ 1 PR / feature.
4. Fin de sprint / prochaine rétro : mesure simple (ex. « utilisé sur N PRs ? Friction restante ? »)
   → garder / itérer / retirer (même réversibilité que les règles).

**Non retenu pour l'instant** : « jeu de l'évolution » formel (brackets, scores, saison) —
trop de cérémonie vs valeur MVP.

## Critères d'acceptation (brouillon)

- [ ] `ezk-retro` documente le type de proposition « incubation skill » (symptôme + mesure)
- [ ] Toute incubation a une fiche backlog + entrée dans le CR rétro
- [ ] Aucune incubation n'entre dans la table de délégation sprint sans mesure + feu vert PO
- [ ] Au moins 1 exemple dogfood (`ezk-checks` / 0178)

## Notes

- Compose `ezk-retro` + `ezk-backlog` + `ezk-ezk` (create/deploy) — pas un 4ᵉ orchestrateur.
- Lien : fiche 0178 (`ezk-checks`) = premier cobaye.
