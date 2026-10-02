# Gate locale rejouée à moitié après un correctif de revue

**En clair.** Après un correctif demandé par Codex, je n'ai relancé que les tests des scripts
(`test:scripts`). La CI a rougi sur un test TypeScript (vitest) qui garde une règle du dépôt.
Une seule commande qui rejoue les deux suites aurait évité l'aller-retour.

**Le symptôme, daté.** 2026-10-02, PR #333 (fiche `20261002114435782`, ship dans la PR).
Le correctif `efe181f0` lisait le statut d'une fiche par `awk` dans
`products/mega-city/skills/ezk-pr/scripts/ship-in-pr.sh`. Local : `test:scripts` vert. CI : le
test `products/mega-city/src/__tests__/fiche-read-via-loader-contract.test.ts` a refusé ce
« parse maison du front-matter hors loader ». Réparé dans `04eefcb2` (lecture par
`bin/fiche-rows.ts`).

**Pourquoi ça arrive.** La gate locale, ce sont **deux** commandes :
`pnpm --dir products/mega-city test` et `pnpm --dir products/mega-city test:scripts`. Après un
petit correctif sur un script bash, on relance d'instinct la suite « bash ». Or certaines règles
qui visent des fichiers bash sont gardées par un test vitest.

**Piste pour la rétro.** Un seul point d'entrée `gate` (les deux suites) que la boucle
`ezk-sprint` et `ezk-codex fix` rejouent après **chaque** correctif. À mesurer : nombre de CI
rouges « vertes en local » sur les 5 prochaines PR.
