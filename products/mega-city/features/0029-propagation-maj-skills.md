---
id: 0029
title: Propager les maj *breaking* d'un skill aux projets (pull + hook de drift + migrations datées)
type: feature        # feature | bug | refactor | chore
priority: P2         # P0 | P1 | P2 | P3
status: idea         # idea | todo | in-progress | blocked | shipped
pr:
created: 2026-07-12
---

## Contexte / Problème

Un skill versionné est déployé **par symlink** (une source → global) : son **code** se
met à jour partout instantanément. Mais un changement de **schéma** (nouveau statut,
nouveau champ de front-matter, nouvelle structure de dossier…) impacte les **données
par-projet** (fiches, index, config) qui doivent l'adopter.

- Un ajout **non-breaking** (ex. `status: idea`, cf. skill `ezk-backlog`) = **0 migration**.
- Un changement **breaking** a besoin d'un mécanisme — sinon les N projets qui utilisent
  le skill divergent silencieusement.

## Proposition

**Pull, pas push** (push skill→repos = risqué). Esquisse :

- Le skill porte un `VERSION` + un dossier `migrations/` (markdown **ordonnés + datés**,
  façon Flyway, chaque migration avec sa section « revert »).
- Chaque projet garde un marqueur des migrations **appliquées**.
- Un **SessionStart hook** (bash/node pur, **zéro appel LLM**) compare `VERSION` vs
  appliquées et **remonte « N migrations en attente »** dans un system-reminder → le LLM
  ne dépense des tokens **que si** l'utilisateur déclenche `migrate`. (C'est exactement ce
  que fait un SessionStart hook.)
- **Rollback natif** : les données par-projet (`features/`…) sont **trackées git** →
  `git revert` suffit. Pas de moteur de rollback à écrire.

**Portée** : mécanisme **transverse mega-city** (pas spécifique à `ezk-backlog`).

## Critères d'acceptation
- [ ] Format de migration défini (markdown daté + revert).
- [ ] Marqueur des migrations appliquées, par-projet.
- [ ] Hook de détection de drift **cheap** (sans LLM) qui remonte l'info.
- [ ] Commande `migrate` (pull) déclenchée par l'utilisateur.
- [ ] Doc rollback = `git revert` (natif).

## Notes

Complément de [0018 — coquille I/O link vs copy] : 0018 propage le **code** live via
symlink ; 0029 gère les **données/schéma**. Épic, à groomer : granularité du marqueur,
migrations non-linéaires, rollback « dur » (au-delà du git revert). Issu du grooming
session 2026-07-12.

**Lien [0087](0087-plugin-claude-code-distribution.md)** (plugin Claude Code) : cette fiche
postule un `VERSION` porté par le skill — 0087 doit trancher **d'où vient cette version**
(tag umbrella vs version mega-city indépendante). Si 0087 aboutit, le `VERSION` de 0029
devient celui du plugin, et `/plugin update` remplace le « pull » esquissé ici pour le
**code** (0029 garde la charge des **migrations de données**). À re-groomer après 0087.
