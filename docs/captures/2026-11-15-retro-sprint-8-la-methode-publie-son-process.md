---
type: retro
date: 2026-11-15
theme: "Sprint 8 « La méthode publie son process et son annuaire » : deux stories en parallèle, un conflit d'intégration attrapé par la gate"
scope: "sprint 8 du journal de branche (lot de deux stories de code : ezk help --json et les étapes fines du process), lancé par le PO le 15 novembre (« Lance le lot 2 »), mode auto ; mode léger : tours 1 et 2 portés par l'orchestrateur (round-robin dégradé), sans juge car aucune règle neuve n'est proposée"
participants: [architecture, qualite, dev, produit, po]
actions:
  - proposition: "Quand deux stories d'un même lot se construisent en parallèle, la seconde intégrée rejoue la gate complète après rebasage, avant son intégration, même si sa revue est déjà GO. Au sprint 8, ce rejeu a attrapé un conflit que ni les deux constructeurs ni les deux relecteurs ne pouvaient voir : la garde de complétude d'ezk help --json refusait la nouvelle commande process show, non rangée dans taxonomie.yml."
    kind: action
    by: [qualite, architecture]
    status: ✅
    decision: "Retenue (PO, 15 novembre) : geste de l'orchestrateur ; la seconde story d'un lot construit en parallèle rejoue la gate complète après rebasage, avant son intégration."
    date: 2026-11-15
  - proposition: "Le rangement des 28 domaines de commandes dans taxonomie.yml (39 en méthode, 15 en modules, 20 en librairie, plus process) est un premier jet éditorial, fait au build d'ezk help --json : le PO le valide ou le corrige, puisque l'Annuaire de mission control l'affichera tel quel."
    kind: action
    by: [produit]
    status: ✅
    decision: "Retenue avec deux déplacements (PO, 15 novembre) : config passe en méthode, carto passe en librairie ; le reste tel quel."
    date: 2026-11-15
  - proposition: "Factoriser le câblage des trois routes de lecture par projet du daemon cop1 (/api/law, /api/recipes, /api/process) : le gestionnaire est recopié trois fois, et la quatrième route viendra avec le graphe ou le glossaire."
    kind: feature
    by: [dev, architecture]
    status: ✅
    decision: "Retenue (PO, 15 novembre) : fiche 20261115180227117, P2 (le serveur de mission control regroupe ses routes de lecture par projet)."
    date: 2026-11-15
  - proposition: "Le slug du compte rendu de sprint perd toujours ses accents (« la-m-thode-publie… ») : deuxième occurrence après le sprint 7, la proposition de la rétro précédente reste à ranger en fiche."
    kind: action
    by: [dev]
    status: ✅
    decision: "Retenue (PO, 15 novembre) : portée par la même fiche que la proposition 4 du sprint 7, 20261115180226950."
    date: 2026-11-15
---

**En clair :** le sprint a livré deux publications de la méthode pour mission control : l'annuaire
(`ezk help --json`) et les étapes fines de chaque compétence (`ezk process show --json`, servies par le
daemon). Les deux stories se sont construites en même temps, chacune dans son dossier, et chacune a eu sa
revue adverse GO. Le gain vient du rejeu de la gate après rebasage, qui a trouvé un conflit invisible
autrement. Quatre propositions attendent.

## 1 · Les faits de départ

- Deux stories livrées en local, en 58 minutes de sprint d'après le
  [compte rendu](../sprints/2026-11-15-sprint-la-m-thode-publie-son-process-et-son-annuaire.md) ; jetons
  non mesurés au grain sprint, dit tel quel.
- Construction en parallèle : `ezk help --json` dans un dossier de travail dédié, les étapes fines dans
  celui de la session. Un seul fichier commun, le manifeste des commandes.
- Revue adverse GO sur les deux, six critères sur six prouvés chacune, aucun NO-GO.
- Après l'intégration d'`ezk help --json`, la gate des étapes fines rebasées a rougi : la commande
  `process show` n'était rangée nulle part dans `taxonomie.yml`. Une ligne a suffi.
- La forme de `process show` diffère sur quatre points de celle qu'attend l'écran zoomable ; le pilote les
  reporte dans sa fiche, comme convenu.
- Le slug du compte rendu perd encore les accents.

## 2 · Tour 1 — chaque lentille propose

- **Qualité** : P1, rejouer la gate de la seconde story après rebasage.
- **Architecture** : P1 ; P3, le triple câblage de route.
- **Produit** : P2, le rangement des domaines est un choix d'écran, au PO.
- **Dev** : P3 ; P4, le slug.

## 3 · Tour 2 — confrontation et convergence

- P1 gardée en action : elle change l'ordre des gestes de l'orchestrateur, sans règle neuve.
- P2 gardée en action, à trancher par le PO.
- P3 gardée en fiche : un refactor court et testable, avant la quatrième route.
- P4 gardée : même symptôme qu'au sprint 7, à classer en fiche avec la proposition d'alors.

## 4 · Le juge de cohérence

Aucune règle neuve proposée : pas de juge convoqué.

## 5 · Les mesures

- Sprint 8 : 2 stories, 2 revues adverses GO du premier coup, 1 conflit d'intégration attrapé par la gate,
  gates finales vertes (2402 tests, 48 suites ; cop1 223 tests).

## 6 · Décisions

Le PO a tranché le 15 novembre (« 1 à 6 oui, 7 plus tard ») : voir l'en-tête. Rien d'autre n'est rangé.
