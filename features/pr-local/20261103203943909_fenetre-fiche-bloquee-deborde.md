> 🗎 Rendu de la fiche [features/20261103203943909_fenetre-fiche-bloquee-deborde.md](../20261103203943909_fenetre-fiche-bloquee-deborde.md)

# La fenêtre d'une fiche bloquée déborde à droite dans mission control

**En clair.** Quand une fiche est bloquée, la fenêtre qui l'ouvre montre sa raison dans une pastille qui ne revient
jamais à la ligne. Une raison longue est coupée à droite, et la fenêtre gagne une barre de défilement
horizontale.

**Si tu arrives frais.** Mission control est l'écran de la méthode (cop1). Il lit ce que la méthode
publie par `ezk … --json` et l'affiche, sans le recalculer (ADR-086).

## Contexte / Problème

Gravité : **mineure**.

Reproduction :

1. Ouvre mission control, projet muti, onglet « Process ».
2. Clique la carte « Sortir la 1.8.0 (suivre le runbook de release) ».
3. La pastille « bloquée : … » est coupée ; `.sheet2` a un `scrollWidth` de 797 px pour un
   `clientWidth` de 543 px.

## Proposition

La pastille « bloquée : … » de la fenêtre d'une fiche reçoit une variante qui revient à la ligne. Les
autres pastilles, courtes, gardent leur règle `white-space: nowrap` : on ne touche pas à la règle
globale de `board.css`. L'en-tête de la fenêtre peut déjà passer à la ligne (`.dhead`, `flex-wrap`).

## Critères d'acceptation

- [ ] Une raison de blocage longue se lit en entier, sur plusieurs lignes.
- [ ] La fenêtre d'une fiche bloquée n'a plus de défilement horizontal.
- [ ] Les autres pastilles (version, statut) gardent leur rendu sur une ligne.

## Comment vérifier

1. Les tests de la page web passent : `pnpm --dir products/cop1/packages/web exec vitest run src/board`.
2. Mission control lancé, la carte « Sortir la 1.8.0 » de muti, ouverte depuis Process, montre sa
   raison en entier, et `.sheet2` a un `scrollWidth` égal à son `clientWidth`. Captures avant et après
   dans `docs/pr-evidence/<id>/`.

## Notes / décisions

- Trouvé par ezk-scout, rapport `/private/tmp/claude-501/-Users-elzinko-git-bacasable-vectorz/fa181bfb-37a3-4d65-93d6-545f3a00e4d1/scratchpad/scout-2026-11-03-nuit/report.md` (brouillon B1), le 2026-11-03 dans la nuit.
- **Entrée au backlog le 2026-11-03** sur décision d'`ezk-pm`, en mode auto du run délégué par le PO
  (« continuer sans mon intervention »). Ce n'est aucune des quatre décisions humaines : c'est un bug,
  pas une idée produit. Le PO peut la retirer.
- Indice relevé avant le groom : `FicheModal.tsx`, la pastille `bloquée : …` est en
  `white-space: nowrap`.
- **Groomée `ready` le 2026-11-03** (run autonome) : la cause est la règle globale `.pill`
  (`board.css`, `white-space: nowrap`). Une variante pour la seule pastille de blocage, pas un
  changement global.


## Validation

| Modalité | Statut |
|---|---|
| Gate locale | ✅ 2319 tests et 48 suites de scripts |
| Tests de la page web | ✅ 173 tests |
| Typecheck web | ✅ |
| Mesure en vrai navigateur | ✅ scrollWidth 543 pour clientWidth 543 (797 avant) |
| Revue ezk-reviewer | ✅ GO |
| Before / after (UI) | docs/pr-evidence/20261103203943909/fenetre-bloquee-avant.jpg puis fenetre-bloquee-apres.jpg |
