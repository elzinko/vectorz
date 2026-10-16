# Panel adverse — séquencement version / milestone / depends (2026-10-16)

Revue adverse de la direction portée par la [fiche milestone + dépendances](../../features/20261016081021364_sequencer-par-milestone-dependances.md),
**avant** d'engager un build. Objet soumis : remplacer le train de versions numérique par un
**séquencement par milestone + un graphe de dépendances** (`depends:` lu comme un DAG ; `version` =
étiquette ; `PLAN.md` = chemin choisi). Décision gravée :
[ADR-0081](../../products/mega-city/docs/adr/0081-sequencement-depends-signal-dag-differe.md).

## Méthode

3 lentilles adverses, **agents indépendants** lancés en parallèle, chacune avec la consigne de
**casser** la décision (pas la valider). Juge = session principale (synthèse + arbitrage PO).

| Lentille | Agent | Verdict |
|---|---|---|
| Architecte (cohérence du modèle) | `general-purpose` | 🟠 GO-avec-changements |
| Dev / faisabilité (coût de câblage) | `general-purpose` | 🟠 GO-avec-changements |
| PO / YAGNI (simplicité du pilotage) | `general-purpose` | 🔴 NO-GO (sur le basculement) |

**Convergence** : les trois tracent la ligne au même endroit — **oui à un noyau cheap maintenant, non
au basculement de modèle maintenant.**

## Findings consolidés (convergences des 3 lentilles)

- **[Diagnostic confirmé par le code] Deux axes d'ordre coexistent déjà.** Le tirage lit `version:`
  (`src/backlog/version-scope.ts`), le board range par un `MILESTONE_ORDER` **codé en dur**
  (`src/core/avancement-data.ts:33`) qui n'alimente **que** l'affichage. Le tangle « version fait deux
  jobs » est réel, pas inventé.
- **[Apport n°1, non négociable] `depends:` est absent du modèle.** Le type `Fiche`
  (`src/loaders/fiches.ts:14-30`) ne porte pas `depends` ; des dizaines de fiches l'écrivent, rien ne
  le lit (`src/backlog/versions-render.ts:83` l'avoue, `src/backlog/plan-order.ts:61` l'ignore). Le
  rendre **vérifié** (en avertissement) est un gain net — ~0,5 j pour le lire, ~1 j pour le contrôle
  PLAN-contre-depends calqué sur `checkVersions`.
- **[Preuve d'usage manquante] Le graphe se bâtirait pour presque rien.** Une poignée de `depends:`
  non vides, pointant surtout des fiches déjà en `done/` ; **zéro arête inter-milestone déclarée**. La
  seule contrainte réelle (board v0.17 → board v0.23) est thématique (`milestone: board` partagé),
  exprimable par l'ordre du plan.
- **[Soupape déjà là] La douleur a un palliatif câblé.** `--all-versions` lève le scope dans les deux
  sélecteurs (`version-scope.ts`, `bin/plan-lot.ts`, `bin/plan-head.ts`) ; `backlog park` et la
  renumérotation débloquent v0.23 aujourd'hui.
- **[Collision ADR] ADR-0080 a déjà différé le graphe** (`0080:59,98-99`) : « dépendances = signal,
  pas graphe ; fiche dédiée si le besoin se prouve ». Rouvrir 10 jours après, sans fait neuf, = la
  cérémonie que la méthode se reproche.
- **[Trou de modèle non résolu] Agrégation par-fiche → par-milestone.** Les `depends:` pointent des
  **ids de fiches** ; « milestone = unité séquencée » exige de résoudre chaque cible → son milestone,
  et de détecter le **cycle au niveau agrégé** (un graphe par-fiche sain peut boucler au niveau
  milestone). Non tranché → milestone reste un regroupement, pas une unité de séquence.
- **[Angle mort pilotage] 4 axes à aligner en multi-sessions.** `version` + `milestone` + `depends` +
  `PLAN.md` : chaque axe de plus est une surface de désynchronisation entre sessions concurrentes.
- **[Valeur magique] `milestone: parked`** : milestone fait déjà thème + corbeille ; en faire l'unité
  séquencée = un 3ᵉ job sur une chaîne libre.

## Ce que les trois NE remettent pas en cause

- Le **diagnostic est juste** : `version:` fait deux jobs, `depends:` est mort, « en cours » est
  ambigu, v0.23 coincée est réel.
- **Lire `depends:` en avertissement** (signal, pas barrage) est raisonnable et peu coûteux — la ligne
  d'ADR-0080.
- La séparation **roadmap (`PLAN.md`) vs rails (`depends:`)** est la bonne direction *à terme*.
- **ADR-0070 et ADR-0080 restent valides** ; le checkpoint de version est orthogonal, non touché.

## Décision (juge + PO)

Option **B** retenue : **noyau vérifié maintenant** (lire `depends:` en avertissement, désambiguïser
« en cours », découper le grain au grooming, débloquer v0.23 par la soupape existante) ; **basculement
différé** (milestone = unité séquencée + DAG + migration) derrière une barre de preuve écrite et quatre
verrous. Détail et verrous :
[ADR-0081](../../products/mega-city/docs/adr/0081-sequencement-depends-signal-dag-differe.md).
