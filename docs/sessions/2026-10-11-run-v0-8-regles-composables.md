fiches: 20261008154803440,20261008183238365,20261008154804532

# Sprint 4 — F2 : DoD/DoR en listes de règles/bundles (contrat partagé dev↔reviewer)
Statut: clos   Ouvert: 2026-10-10   Clos: 2026-10-10

## Lot  (1 ligne = 1 story = 1 PR ; [x] livrée · [~] reportée · [ ] ouverte)
- [x] 20261008154804532 — DoD et DoR — des listes de règles/bundles qui définissent prêt et fini (contrat partagé) (local c44c236f)

## Notes / décisions
- Override du portier (ALERT points=2) — session voisine ready-todo-status-distinction-d96e52 (HEAD détaché b5882231) = travail plan v0.10/v0.11 séparé, pas cette fiche ; override PO 2026-10-10 (2026-10-10)
- ADR-0069 (products/mega-city/docs/adr/) : l'étape de process se calcule par jointure, sans objet « sprint ». Module pur process-data.ts, collecteur de sessions extrait et partagé (sessions-collect.ts).
- Revue adverse ezk-reviewer : GO. 4 P1 corrigés AVANT merge : in-progress→en-sprint (pas de recul silencieux), TERMINAUX dérivé du schéma (pas recopié), colonne Livrée « X/Y » (règle MUST human-facing-lisibility), test sur backlog réel (critère n°5). 2 P2 traités (double appel gh = POC assumé ; repli page si data absente).
- github: false → pas de PR : corps de PR émis en local (features/pr-local/), merge local à venir.
- 2e story (cockpit 404) demandée en cours de sprint. 2e revue adverse sur le delta (filtres + fix 404) : GO, 2 P1 corrigés avant merge (troncature livrées masquait la recherche ; resolveFichePath confiné à features/). 4 commits sur la branche, prêts à squasher.
- Override du portier (ALERT points=2) — session voisine ready-todo-status-distinction-d96e52 (détachée b5882231) = travail plan v0.10/v0.11 séparé, ne touche pas cette fiche ; override PO 2026-10-10 reconduit, HEAD inchangé (2026-10-10)
- [Sprint 2] Dev inline (pas d'ezk-dev en worktree isolé) : fiche ciblée + mode lean + worktree secondaire → écriture directe, évite la fragilité de rapatriement. Revue adverse ezk-reviewer conservée comme plancher (modèle Opus distinct).
- [Sprint 2] Implémentation : 2 arêtes EDGE_SOURCES (skill→bundle, agent→bundle, verbe `applique`) + routage par appartenance au catalogue bundle (graph.ts) ; `appliedRuleIds` (expand.ts) déplie par référence. Amende ADR-0040 ; tests vocabulaire mis à jour exprès (couples + compte 16→18). Gate verte : tsc OK, 1899/1899, graph:check sans lien cassé.
- [Sprint 2] Revue adverse ezk-reviewer : **GO**. P1 (non bloquant, accepté par design) : `appliedRuleIds` sans consommateur de prod = brique pour F2 (20261008154804532) ; si F2 ne se fait pas → code mort à retirer (risque possédé, F2 = prochaine P0 du plan). P2 (latent) : garde unicité id règle↔bundle absente, aucune collision réelle. Trace : features/reviews/20261008154803440-citer-un-bundle/REVIEW.md.
- Override du portier (ALERT points=2) — voisine ready-todo-status-distinction-d96e52 inchangée (b5882231), travail v0.10/v0.11 séparé ; override PO reconduit (autorisé tant que HEAD voisin inchangé) (2026-10-10)
- Override du portier (ALERT points=2) — voisine ready-todo-status-distinction-d96e52 inchangée (b5882231), travail v0.10/v0.11 séparé ; override PO reconduit (autorisé tant que HEAD voisin inchangé) (2026-10-10)

## Galères & gestes (labo)
- Numéro d'ADR : DEUX dossiers (docs/adr/ racine en ADR-0NN jusqu'à 038, products/mega-city/docs/adr/ en 00NN jusqu'à 0065). Prochain libre DES DEUX = check-adr-ids.sh . --next → 0069. Consigné aussi au journal.

## Incréments scellés de la session
- Sprint 1 — Vue process : poser les fiches actives sur les 5 étapes, avec leur session (Tranche 1 POC) — 2 livrées, 0 reportée : 20261002115451315 (local bc8a0316), 20261010100030780
- Sprint 2 — Citer un bundle : arête consommateur→bundle, résolue au bind par référence (v0.8.0, loi) — 1 livrée, 0 reportée : 20261008154803440 (local 58357fb6)
- Sprint 3 — Spike : divergence dev↔reviewer ? (verdict pour F2) — 1 livrée, 0 reportée : 20261008183238365
- Sprint 4 — F2 : DoD/DoR en listes de règles/bundles (contrat partagé dev↔reviewer) — 1 livrée, 0 reportée : 20261008154804532 (local c44c236f)
