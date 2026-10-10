# ADR-0069 — L'étape d'une fiche dans le process se CALCULE par jointure, sans objet « sprint »

- **Statut** : Accepté (2026-10-10)
- **Compose / précise** :
  - [ADR-0003](0003-moteur-bind-plan-pur-coquille-io.md) — cœur pur, coquille d'I/O : le calcul d'étape vit dans un module **pur**, le bord collecte et **injecte**.
  - [ADR-0055](0055-artefacts-generes-hors-versionnage.md) — vues générées non committées : la page `process.html` est committée, son `process.data.js` ne l'est pas.
  - [ADR-0042](0042-concurrence-inter-sessions-advisory-visibilite.md) — le cockpit de sessions dont on **réutilise** le collecteur (worktrees, branches, PR).
- **Fiche** : [Voir les fiches posées sur le schéma du process, avec leur session](../../../../features/20261002115451315_fiches-sur-le-process-avec-session.md).
- **Déciders** : PO (Thomas) ; avis d'architecte du 2026-10-08 porté dans la fiche.

## Contexte

Le board dit **quelles** fiches existent. Il ne dit pas **où elles en sont** dans la méthode :
idée, prête, en sprint, en revue, livrée. Un panel d'archi (2026-08-23) avait gardé le board seul,
mis le reste en attente « jusqu'à ce que l'usage prouve le manque », et **interdit d'inventer un
objet « sprint » en données**. Le 2026-10-02, le PO décrit le manque précis — « visualiser les
fiches dans les étapes du process, avec leur session » — le signal d'usage attendu.

Les morceaux existent déjà, éparpillés : le `status` de chaque fiche, les branches `feat/<id>-…`,
l'état des PR, et le cockpit de sessions (quelle session tient quelle branche). Le risque, en
construisant une vue « process », était d'introduire un état « sprint » persistant — ce que le
panel a proscrit.

## Décision

L'étape d'une fiche se **déduit à la volée**, par une **jointure** des signaux déjà produits
ailleurs. Aucun objet « sprint » n'est créé ni stocké.

1. **Un module pur** — `src/core/process-data.ts`, sur le modèle de `sessions-data.ts` : `buildProcessData(entrées)`, sans aucune I/O (ni git, ni gh, ni disque). Le bord I/O (`src/io/sessions-collect.ts`, appelé par `derived-views.ts`) collecte et **injecte** fiches, sessions, branches et PR ouvertes. Testable sans vrai git (ADR-0003).
2. **Une échelle fixe, premier match gagnant** : `livrée → en revue → en sprint → prête → idée`. Une fiche qui coche plusieurs signaux est posée sur **la plus avancée**.
3. **L'absence de PR est un cas de première classe** : `openPrByBranch` est **nullable**. `null` = pas de `gh`/remote → l'étape « en revue » est **indéterminable**. Une fiche avec une branche reste alors « en sprint », **jamais rétrogradée en silence** ; un bandeau le dit.
4. **Réutilisation, pas duplication** : le collecteur du cockpit de sessions (worktrees, branches, PR) est **extrait** dans `src/io/sessions-collect.ts`, partagé par `ezk-sessions` et la vue process. Le module process ne fait qu'une **jointure** fiches ↔ sessions par branche `feat/<id>-…`.
5. **Branchement cockpit** : une entrée de plus dans `DATA_VIEWS` de `src/io/derived-views.ts` (id `process`), servie par `bin/ezk-map.ts` sans ligne de plus. La page `diagrams/process/process.html` est la coque ; son `process.data.js` n'est pas committé (ADR-0055).

## Conséquences

- **+** Le verdict du panel du 2026-08-23 tient : zéro objet « sprint » en données, la vue est un pur calcul des fichiers existants.
- **+** Le collecteur de sessions devient une brique partagée : une seule source pour les worktrees, branches et PR.
- **−** L'étape est une **heuristique** : une branche `feat/<id>-…` oubliée après un merge fait lire la fiche « en sprint » à tort, jusqu'au ménage des branches. C'est le même angle mort que le cockpit de sessions, assumé.
- **−** L'étape « en revue » dépend de `gh`/remote. Sans eux, elle est inconnue (dégradée en « en sprint » signalé), pas fausse.
- **Hors périmètre (Tranche 2)** : les étapes internes d'un sprint (BDD, TDD, gate, revue) demanderaient que `ezk-sprint` annonce son étape — une autre fiche.
