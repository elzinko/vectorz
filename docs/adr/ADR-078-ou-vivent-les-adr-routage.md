# ADR-078 — Où vivent les ADR : deux dossiers + une règle de routage

- Statut : accepté (2026-10-15)
- Deciders : PO (Thomas), sur une analyse en lecture seule tenant les lentilles architecte + product/method-owner ; décision prise au build v0.16
- Fiche : [Où vivent les ADR dans un repo multi-projets](../../features/done/20261011142027875_ou-vivent-les-adr-repo-multi-projets.md)
- Lié : [ADR-025 §5](ADR-025-monorepo-codev-cop1-megacity.md) (« les ADR ne déménagent pas ») · `ezk adr new` (allocateur du prochain id libre des deux dossiers) · `check-adr-ids.sh` (gate d'unicité)

## En clair

Le dépôt tient **deux dossiers d'ADR** : la racine `docs/adr/` pour l'**ombrelle** (cop1, packaging,
monorepo, supervision — graphie `ADR-NNN`), et `products/mega-city/docs/adr/` pour la **méthode
`ezk-*`** (graphie `NNNN`). Le vrai problème n'était **pas** la numérotation — elle est déjà réglée :
les deux dossiers partagent **une seule suite** de numéros, tenue par `ezk adr new` + une gate. Le seul
trou, c'était l'**absence de règle écrite** disant quel ADR va dans quel dossier. Cet ADR écrit cette
règle. **On ne déplace rien** : zéro lien cassé, et on respecte « les ADR ne déménagent pas » (ADR-025 §5).

## Décision

On **garde les deux dossiers** et on acte la règle de routage suivante.

1. **ADR sur la méthode `ezk-*`** — ses skills, sa LOI compilée, le cycle de vie du backlog, ses gates —
   → `products/mega-city/docs/adr/` (graphie `NNNN`). C'est le `--scope methode` de `ezk adr new`.
2. **ADR ombrelle ou transverse** — cop1, packaging, monorepo, supervision, ou toute décision qui
   touche **plusieurs produits** ou la structure du dépôt — → racine `docs/adr/` (graphie `ADR-NNN`).
   C'est le `--scope ombrelle` (défaut) de `ezk adr new`. Cet ADR-078 en est lui-même un exemple.
3. **Un nouveau produit** gagne son propre `products/<p>/docs/adr/` **seulement quand** il accumule des
   décisions qui lui sont propres. D'ici là, ses décisions vont à la racine (comme cop1 aujourd'hui, qui
   n'a pas de dossier d'ADR).
4. **La numérotation reste la suite unique déjà livrée** : `ezk adr new` prend le prochain id libre des
   **deux** dossiers (`check-adr-ids.sh --next`), donc pas de collision. La graphie 3 vs 4 chiffres reste
   le **repère visuel** d'appartenance (ombrelle vs méthode).

## Conséquences

- **Coût quasi nul** : aucun ADR déplacé, aucun des ~130 liens markdown vers `products/mega-city/docs/adr/`
  ni des ~90 vers la racine n'est cassé. Les ~2 700 mentions en prose (« voir ADR-0066 ») référencent par
  **numéro**, pas par chemin : elles survivent de toute façon tant que le numéro reste unique (garanti).
- **La méthode reste portable** : ses ADR voyagent avec ses skills (`products/mega-city/`), découplés du
  layout de l'ombrelle.
- **On s'interdit** de fusionner les deux dossiers (ce serait ~130 liens à recâbler + une contradiction
  avec ADR-025 §5, pour un gain surtout cosmétique) et de créer un dossier d'ADR par produit « par
  symétrie » tant qu'un produit ne l'a pas mérité.
- **Réversible** : si un jour un produit mérite son dossier, on l'ouvre sans toucher aux deux existants.

> Panel adverse complet jugé **non nécessaire** ici : l'option retenue ne déplace rien physiquement et
> respecte une doctrine déjà écrite. La décision repose sur l'analyse en lecture seule (lentilles
> architecte + method-owner, convergentes) et l'accord du PO.
