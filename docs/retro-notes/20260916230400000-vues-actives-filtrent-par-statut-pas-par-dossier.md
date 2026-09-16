# Une vue « active » exclut par STATUT terminal, pas seulement par dossier `done/`

**Symptôme (daté, mesurable).** Migration « retrait de l'épic » (ADR-0017 A16), PR #240, 2026-09-16.
En fondant 5 fiches-chapeau en `superseded` **tout en les gardant dans `features/`** (déplacer vers
`done/` casse ~20 liens relatifs — règle `0051`), elles ont **fuité au board actif** : `buildAvancementData`
filtrait `actives` sur le **dossier** (`!f.done`), jamais sur le **statut**. Codex l'a attrapé (finding P2,
#240). Tant que l'épic masquait `0051` par `type: epic`, le trou était invisible ; le retrait de l'épic l'a
exposé.

**Correctif appliqué.** Constante `TERMINAUX = [superseded, merged, split]` (products/mega-city/src/core/
avancement-data.ts), exclue de `actives`/`tirables`/`filtres` ET du cumul par milestone. Board vérifié.

**Loose end (à finir).** Le même raisonnement folder-vs-statut vaut pour les **autres vues** : `regen-backlog.sh`
et `portfolio.sh` (bash) sélectionnent encore par `$5 != "idea"` / dossier et **affichent** donc une fiche
`superseded` gardée dans `features/` dans leur tableau principal. À vérifier / aligner sur `TERMINAUX`.

**Candidat de règle (à trancher en rétro).** Toute vue qui présente le **stock actif** d'un backlog exclut
les statuts terminaux (`superseded`/`merged`/`split`) **par le statut**, pas seulement par l'emplacement
`done/` — parce qu'une fiche terminale peut légitimement rester dans `features/` (préservation de liens).
Mesurable : une fiche `superseded` dans `features/` n'apparaît dans **aucune** colonne/tableau « actif »
(board, BACKLOG, portfolio).

**Voisin.** Même famille que le pattern « source unique d'énum » : `STATUTS`/`TERMINAUX` centralisés dans
`avancement-data.ts` et réutilisés par le validateur — une seule définition, plusieurs consommateurs.
