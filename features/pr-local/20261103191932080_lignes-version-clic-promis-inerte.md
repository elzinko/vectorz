> 🗎 Rendu de la fiche [features/20261103191932080_lignes-version-clic-promis-inerte.md](../done/20261103191932080_lignes-version-clic-promis-inerte.md)

# Les lignes de version promettent « clique pour le détail » mais ne réagissent pas

**En clair.** Le tableau « Versions dans le process » de la vue d'ensemble annonce « clique pour le détail ».
Cliquer une ligne ne fait rien. Seuls les boutons « Voir le run » et « ▸ Lancer » agissent, et ils
n'apparaissent que sur certaines lignes.

**Si tu arrives frais.** Mission control est l'écran de la méthode (cop1). Il lit ce que la méthode
publie par `ezk … --json` et l'affiche, sans le recalculer (ADR-086).

## Contexte / Problème

Gravité : **mineure**.

Reproduction :

1. Ouvre la vue d'ensemble de vectorz.
2. Clique la ligne « v0.24.0 », puis le nom « v0.22.0 ».
3. La page ne change pas.

## Proposition

Recadrée par `ezk-pm` : on retire la promesse, on n'invente pas de panneau. Le sous-titre du tableau
« Versions dans le process » perd « clique pour le détail ». Il garde « où en est chaque version » et
« ligne verte = en run ». Les boutons « Voir le run » et « ▸ Lancer » restent les seuls gestes.

## Critères d'acceptation

- [ ] Le sous-titre du tableau ne promet plus de détail au clic.
- [ ] Les boutons « Voir le run » et « ▸ Lancer » marchent comme avant.

## Comment vérifier

1. Les tests de la page web passent : `pnpm --dir products/cop1/packages/web exec vitest run src/board`.
2. Mission control lancé, le sous-titre de la vue d'ensemble ne dit plus « clique pour le détail ».
   Captures avant et après dans `docs/pr-evidence/<id>/`.

## Notes / décisions

- Trouvé par ezk-scout, rapport `/private/tmp/claude-501/-Users-elzinko-git-bacasable-vectorz/fa181bfb-37a3-4d65-93d6-545f3a00e4d1/scratchpad/scout-2026-11-03-soir/report.md` (brouillon B7), le 2026-11-03 au soir.
- **Entrée au backlog le 2026-11-03** sur décision d'`ezk-pm`, en mode auto du run délégué par le PO
  (« continuer sans mon intervention »). Ce n'est aucune des quatre décisions humaines : c'est un bug,
  pas une idée produit. Le PO peut la retirer.
- **Recadrée par `ezk-pm` le 2026-11-03** : le critère est de retirer la promesse du sous-titre.
  Inventer un panneau de détail serait une idée produit, qui revient au PO.
- Indice relevé avant le groom : `OverviewView.tsx`, sous-titre du tableau.
- **Groomée `ready` le 2026-11-03** (run autonome) : un panneau de détail de version
  reste une idée produit pour le PO, si elle lui sert.


## Validation

| Modalité | Statut |
|---|---|
| Gate locale | ✅ 2318 tests et 48 suites de scripts |
| Tests de la page web | ✅ 163 tests avec les deux autres corrections du sprint |
| Typecheck web | ✅ |
| Revue ezk-reviewer | ✅ GO |
| Before / after (UI) | docs/pr-evidence/20261103191932080/vue-ensemble-avant.jpg puis vue-ensemble-apres.jpg |
