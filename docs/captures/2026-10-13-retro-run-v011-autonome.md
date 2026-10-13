# Rétro — run autonome v0.11 « La qualité tient » (2026-10-13)

**En clair.** Un run `ezk-product-build` autonome a construit **7 fiches sur 7** de la version
v0.11, en local. Deux fiches ont été **sorties de la version** en cours de route, faute d'être
faisables proprement dans une passe frugale. Trois frictions d'outillage/process sont ressorties ;
deux donnent des fiches neuves.

## Ce qui s'est passé

- v0.11 livrée 7/7 (état « à clore », tag = geste PO) : deps vitest 4, `ezk release` (gate de
  version composable), commande `gate` unique, relecteur-prouve-critères, bug `regen --root`, revue
  rejoue les scripts bash, `ezk adr new`.
- Démarrage retardé : la gate de `main` était **rouge** au lancement, pour des restes d'une session
  pair (collision ADR-039 ↔ 0039 + 3 liens cassés dans une capture). Corrigé en coordination avec
  cette session (renumérotation en ADR-074 + liens vers `done/`), pas par moi seul — les fichiers
  étaient à elle et l'un était en édition.

## Frictions → décisions

1. **`ship` ne committe que `features/`** → les recals de liens entrants hors `features/` (une
   capture de rétro) restent non committés, le principal devient « dirty », et le `close` suivant
   diffère son compte rendu. Vécu **2×**. → fiche
   [20261013013553044](../../features/20261013013553044_ship-committe-recals-liens-hors-features.md).
2. **Pas de contrôle de taille au grooming** : la fiche `ezk release` touchait 8 surfaces (bien
   au-delà de « 2 surfaces »), et les fiches 5/8 ont dû être sorties en cours de run faute de
   découpage/cadrage. → fiche
   [20261013013553179](../../features/20261013013553179_grooming-applique-regle-taille-fiche.md).
3. **Fiches reportées hors v0.11** (déjà re-groomées en `idea`, pas de nouvelle fiche) :
   [20261011091555006](../../features/20261011091555006_gate-attrape-forme-vues-et-confinement.md)
   (critère 3 = spike « détecter une garde de confinement sans test » ; critères 1-2 déjà couverts
   par le test du bug `regen --root`) et
   [20261001133500750](../../features/20261001133500750_lint-ne-couvre-pas-mega-city.md) (396
   erreurs lint existantes : résorption massive ou baseline à trancher).

## Ce qui a bien tenu

- **Garde-fou de version-scope (ADR-0070)** : le tirage est resté dans v0.11 tout du long ; v0.12→
  v0.17 ont été écartées à chaque intake. Le run s'arrête net à la borne v0.11 (tag = geste PO).
- **`ezk release` dogfoodé** : la gate de version qu'on vient de livrer aurait justement attrapé le
  démarrage sur base rouge.
