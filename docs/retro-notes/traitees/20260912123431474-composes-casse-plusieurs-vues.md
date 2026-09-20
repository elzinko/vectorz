---
date: 2026-09-12
session: run ezk-product-build « boucle auto-amélioration » (worktree ready-todo-status-distinction)
type: friction
---

# Un changement de `composes:` casse plus d'une vue générée — il faudrait UNE commande

**Symptôme.** Éditer `composes:` d'un skill fait rougir `map-data.test.ts` (et le graphe
`skills/README.md`) si on ne régénère pas TOUTES les vues dérivées. Vécu 2× cette itération :
sprint `20260831075615969` (composes +ezk-chef → il fallait `composes:graph` **ET** `map:data`,
découvert par un test rouge) et sprint `20260911224102584` (composes +ezk-retro, même cascade).
Codex avait aussi flaggé un board périmé sur la PR #227.

**Geste / fix.** Régénérer les deux : `pnpm --dir products/mega-city composes:graph` + `map:data`
(+ `regen-backlog.sh` + board `avancement:regen`/`plan-view:regen`/`plan-delta:regen` sur un
changement de statut).

**Piste (à instruire).** Une **commande unique `views:regen`** qui régénère toutes les vues
dérivées d'un coup → plus jamais de vue oubliée, plus de PR rougie par une vue périmée. Recoupe
la fiche `20260830194601233` (ship transactionnel) : **l'enrichir avec ce cas** plutôt que créer
une fiche neuve.
