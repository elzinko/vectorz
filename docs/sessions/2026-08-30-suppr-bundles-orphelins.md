# Sprint — supprimer les 2 bundles orphelins [20260823124042708]
Périmètre: XS mécanique (tranche NOW de la fiche)   Statut: en attente de validation (push/PR/merge)

## Backlog  (1 ligne = 1 feature = 1 PR)
- [x] refactor(mega-city): supprimer les 2 bundles orphelins documentation-guidelines + hexagonal  (branche feat/20260823124042708-suppr-bundles-orphelins, commit 3ad8919, PAS encore poussée)

## Definition of Done
- graph:check vert (0 lien cassé) ✅
- vitest 640/640 ✅
- test:scripts 13 suites ✅
- revue adverse traitée : EN ATTENTE (Codex à déclencher après push)
- squash-merge : EN ATTENTE (action sortante → OK humain)

## Notes / décisions
- Tête NOW livrée (carte-loi #187, ezk-sessions #188/#189). Tête suivante = conteneur
  20260824061247344 « à scinder » (point 3 = arbitrage PO) → non tirable telle quelle.
- Son point 1 ≡ fiche 20260823124042708 (périmètre panel réduit) → groomée + tamponnée
  ready (2026-08-30) → construite.
- Orphelins vérifiés : documentation-guidelines.yml + hexagonal.yml cités par 0 profil,
  0 bundle. Suppression sans effet sur ce qui est bindé.
- Conséquence mécanique traitée : expand.test.ts (10→8 bundles, 59→48 règles) + 3 vues
  régénérées (board avancement + écart-plan, carte map-data, index BACKLOG).
- Correction d'honnêteté : critère « aucune règle orpheline » remplacé par « graph:check
  vert / rien de bindé ne change » (les règles des 2 thèmes deviennent orphelins de graphe,
  info attendue).
