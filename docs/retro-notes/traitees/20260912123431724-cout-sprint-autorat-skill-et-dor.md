---
date: 2026-09-12
session: run ezk-product-build « boucle auto-amélioration »
type: friction
---

# Coût d'un sprint « autorat de skill » (~330k) et de la concurrence DoR (~85k)

**Symptôme.** Chaque sprint de ce run éditait un `SKILL.md` (autorat, pas du code applicatif) et
a coûté ~300-425k tokens, dominé par 3 gros agents : `ezk-pm` (DoR ~85k pour un oui/non),
`ezk-architect` (~120k), `ezk-reviewer` (~120k). La concurrence DoR `ezk-pm` en
`--check-ready false` est chère pour ce qu'elle rend (un verdict READY/PAS-READY).

**Piste (à instruire).** Alléger la concurrence DoR (lecture fiche seule bornée, déjà tentée mais
encore ~85k) ; envisager un **mode « autorat de skill » plus léger** dans `ezk-sprint` pour la
prose (l'architecte produit l'édition, le reviewer garde le filet, on saute BDD/TDD/E2E qui ne
s'appliquent pas).

**Note annexe (piège outillage).** Après une reconnexion MCP, le worktree est revenu sur son
ancienne branche (HEAD déplacé) — vérifier `git branch --show-current` en reprise de run.
