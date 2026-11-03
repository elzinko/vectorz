> 🗎 Rendu de la fiche [features/20261103191932074_fenetre-fiche-markdown-brut.md](../20261103191932074_fenetre-fiche-markdown-brut.md)

# La fenêtre d'une fiche de mission control affiche le Markdown brut

**En clair.** Le texte d'une fiche garde ses signes de mise en forme dans la fenêtre qui l'ouvre. On lit les
astérisques du gras et de l'italique, et les accents graves du code, tels quels.

**Si tu arrives frais.** Mission control est l'écran de la méthode (cop1). Il lit ce que la méthode
publie par `ezk … --json` et l'affiche, sans le recalculer (ADR-086).

## Contexte / Problème

Gravité : **mineure**.

Reproduction :

1. Ouvre mission control, projet vectorz, onglet « Fiches ».
2. Clique la carte « article — émettre des events en restant fidèle au fonctionnement de Claude
   Desktop/Code ».
3. Lis la section « Contexte » : les astérisques et les accents graves sont affichés.

## Proposition

Un petit rendu en ligne, dans la page web de mission control : le gras (`**…**`), l'italique (`*…*`)
et le code (`` `…` ``) deviennent des éléments React. Aucun HTML n'est injecté : le texte reste du texte.
Un signe sans partenaire reste affiché tel quel. Il s'applique à « En clair », au contexte et aux
critères de la fenêtre d'une fiche. « Comment vérifier » reste un bloc de code brut, c'est voulu.

## Critères d'acceptation

- [ ] Dans la fenêtre d'une fiche, le gras, l'italique et le code s'affichent mis en forme, sans leurs
      signes, dans « En clair », le contexte et les critères.
- [ ] Un texte qui contient du HTML l'affiche comme du texte, sans l'interpréter.
- [ ] Un signe sans partenaire, comme un astérisque isolé, reste affiché.
- [ ] « Comment vérifier » garde son texte brut.

## Comment vérifier

1. Les tests de la page web passent : `pnpm --dir products/cop1/packages/web exec vitest run src/board`.
2. Mission control lancé, la fiche « article — émettre des events… » s'ouvre sans astérisques ni
   accents graves visibles. Captures avant et après dans `docs/pr-evidence/<id>/`.

## Notes / décisions

- Trouvé par ezk-scout, rapport `/private/tmp/claude-501/-Users-elzinko-git-bacasable-vectorz/fa181bfb-37a3-4d65-93d6-545f3a00e4d1/scratchpad/scout-2026-11-03-soir/report.md` (brouillon B5), le 2026-11-03 au soir.
- **Entrée au backlog le 2026-11-03** sur décision d'`ezk-pm`, en mode auto du run délégué par le PO
  (« continuer sans mon intervention »). Ce n'est aucune des quatre décisions humaines : c'est un bug,
  pas une idée produit. Le PO peut la retirer.
- Indice relevé avant le groom : `FicheModal.tsx` affiche le texte sans le mettre en forme.
- **Groomée `ready` le 2026-11-03** (run autonome) : aucun rendu Markdown n'existe dans
  la page web, et ses seules dépendances sont react et react-dom. Un rendu en ligne maison, petit et
  sûr, plutôt qu'une bibliothèque de plus.


## Validation

| Modalité | Statut |
|---|---|
| Gate locale | ✅ 2318 tests et 48 suites de scripts |
| Tests de la page web | ✅ 161 tests (relancés après le resserrement de l'italique) |
| Typecheck web | ✅ |
| Revue ezk-reviewer | ✅ GO |
| Before / after (UI) | docs/pr-evidence/20261103191932074/fenetre-fiche-avant.jpg puis fenetre-fiche-apres.jpg |
