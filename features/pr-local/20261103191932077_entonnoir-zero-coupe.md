> 🗎 Rendu de la fiche [features/20261103191932077_entonnoir-zero-coupe.md](../done/20261103191932077_entonnoir-zero-coupe.md)

# Un « 0 » coupé dépasse au bout de la barre « Entonnoir » de mission control

**En clair.** Quand aucune fiche n'est prête, le segment « prêtes » de la barre « Entonnoir » a une largeur
nulle, mais son chiffre « 0 » est quand même écrit. Il apparaît à moitié coupé au bord droit de la
barre.

**Si tu arrives frais.** Mission control est l'écran de la méthode (cop1). Il lit ce que la méthode
publie par `ezk … --json` et l'affiche, sans le recalculer (ADR-086).

## Contexte / Problème

Gravité : **mineure**.

Reproduction :

1. Ouvre la vue d'ensemble de vectorz avec 0 fiche prête.
2. Regarde le bout droit de la barre « Entonnoir » : un demi « 0 » dépasse.
3. Dans la console du navigateur : le segment `.funbar .fun-ready` mesure 0 px, son texte va au-delà
   du bord de la barre.

## Proposition

Dans la barre « Entonnoir » de la vue d'ensemble, un segment vide n'affiche plus son chiffre. C'est
déjà le cas du segment « en cours » ; les segments « idées » et « prêtes » font de même. La légende
sous la barre garde tous les comptes, zéros compris.

## Critères d'acceptation

- [ ] Avec 0 fiche prête, la barre n'affiche aucun « 0 » coupé.
- [ ] Un segment non vide garde son chiffre.
- [ ] La légende sous la barre affiche toujours les trois comptes, zéros compris.

## Comment vérifier

1. Les tests de la page web passent : `pnpm --dir products/cop1/packages/web exec vitest run src/board`.
2. Mission control lancé, la vue d'ensemble d'un projet sans fiche prête ne montre aucun « 0 » au bout
   de la barre. Captures avant et après dans `docs/pr-evidence/<id>/`.

## Notes / décisions

- Trouvé par ezk-scout, rapport `/private/tmp/claude-501/-Users-elzinko-git-bacasable-vectorz/fa181bfb-37a3-4d65-93d6-545f3a00e4d1/scratchpad/scout-2026-11-03-soir/report.md` (brouillon B6), le 2026-11-03 au soir.
- **Entrée au backlog le 2026-11-03** sur décision d'`ezk-pm`, en mode auto du run délégué par le PO
  (« continuer sans mon intervention »). Ce n'est aucune des quatre décisions humaines : c'est un bug,
  pas une idée produit. Le PO peut la retirer.
- Indice relevé avant le groom : `OverviewView.tsx`, rendu de la barre « Entonnoir ». Le segment
  « en cours » n'affiche déjà rien quand il est vide.
- **Groomée `ready` le 2026-11-03** (run autonome) : cause dans `OverviewView.tsx`,
  barre « Entonnoir » : seul le segment « en cours » masque son zéro.
- **Preuve du 2026-11-03** : aucun projet réel n'avait 0 fiche prête ce soir-là. Les captures avant et
  après viennent d'un projet de banc jetable, deux idées et aucune fiche prête, ajouté au registre des
  instances de test sans être committé.


## Validation

| Modalité | Statut |
|---|---|
| Gate locale | ✅ 2318 tests et 48 suites de scripts |
| Tests de la page web | ✅ 155 tests |
| Typecheck web | ✅ |
| Revue ezk-reviewer | ✅ GO |
| Before / after (UI) | docs/pr-evidence/20261103191932077/entonnoir-avant.jpg puis entonnoir-apres.jpg (projet de banc sans fiche prête) |
