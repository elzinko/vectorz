# Journal des difficultés — feat/20261002114435782-done-par-story-a-la-validation

## [20261002114435782] Correctif rejoué sur une seule suite
- **Coincé** : Un correctif de revue Codex lisait le statut d'une fiche par awk dans un script bash ; seul test:scripts avait été relancé, la CI a rougi sur le test de contrat fiche-read-via-loader (vitest).
- **Réglé** : Lire le statut par bin/fiche-rows.ts via tsx (loader résolu une fois, absent ou en panne = exit 2) ; rejouer vitest ET test:scripts après chaque correctif.
- **Pourquoi** : Les règles de dépôt sont gardées par des tests vitest, même quand le fichier touché est un script bash.
