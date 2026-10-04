---
type: retro
date: 2026-10-04
theme: "run cockpit de la V0.6 : des fiches trop grosses pour un sprint, et un ship qui oublie ce qu'il touche (rétro légère)"
scope: "run ezk-product-build du 2026-10-04 soir (cockpit découpé en trois, livré en local : 43dcb587, 7841c073, ec7fc3ec), la correction d'INIT_CWD qui a suivi (f62e0128), et les trois notes du carnet déposées pendant le run"
participants: [pilote, po]
actions:
  - proposition: "`ezk backlog ship` dit tous les fichiers qu'il a touchés et ne regarde que l'id en tête d'une ligne de PLAN.md"
    kind: feature
    by: [pilote]
    status: ✅
    decision: "Retenue par le PO : fiche « ezk backlog ship dit tous les fichiers qu'il touche » (20261004211037977, bug, P2 proposé)"
    date: 2026-10-04
  - proposition: "`ezk run report` accepte une livraison locale (`local (<sha>)`) et la compare au main local quand la config coupe GitHub"
    kind: feature
    by: [pilote]
    status: ✅
    decision: "Retenue par le PO : fiche « ezk run report décrit un run livré en local » (20261004211038053, bug, P2 proposé)"
    date: 2026-10-04
  - proposition: "Une fiche prête tient dans un sprint économe : au grooming, une fiche qui dépasse six critères ou touche plus de deux surfaces (commande, serveur, écran, ADR) se découpe avant de passer « prête »"
    kind: regle
    target: skill:ezk-backlog
    by: [pilote]
    status: ✅
    decision: "Retenue par le PO : règle token-economy/fiche-tient-dans-un-sprint (SHOULD), bundle token-economy, liée à ezk-backlog (applies + porte « prête »)"
    date: 2026-10-04
  - proposition: "Passer en P1 la fiche « Les portiers laissent tranquilles les copies de réserve propres » et l'inscrire au plan, avec les cas de ce soir"
    kind: action
    by: [pilote]
    status: ✅
    decision: "Faite, retenue par le PO : fiche « Les portiers laissent tranquilles les copies de réserve propres » (20261003011750521) passée en P1 et inscrite au plan, en tête de ce qui reste de la V0.6"
    date: 2026-10-04
---

**En clair :** le run a livré le cockpit, mais deux fiches prêtes se sont révélées trop grosses pour
un sprint économe : le PO a dû trancher deux fois, au moment de construire. Les outils de livraison
locale ont aussi montré trois trous, notés au carnet pendant le run. Le PO a retenu les quatre
propositions : deux fiches, une règle de grooming et une priorité relevée.

## 1 · Les faits de départ

- **Deux fiches prêtes, trop grosses pour un sprint.** La fiche du cockpit (15 critères : ADR,
  serveur, écran, commande, captures) était estimée à 500-800k jetons, pour une cible de 200k en mode
  économe. Le PO l'a fait découper en trois au moment de construire ; les trois morceaux ont coûté
  environ 190k, 330k et 200k. La fiche suivante, les réglages d'agents par projet (12 critères), était
  aussi estimée à 500-700k : le PO a préféré arrêter le run.
- **`ezk backlog ship` oublie une partie de ce qu'il touche.** Il recale des liens hors de `features/`
  (l'ADR-0062, d'autres fiches livrées, des corps de PR locaux) mais ne conseille que
  `git add features`. Au premier ship, l'ADR modifié est resté hors du commit et le dossier principal
  est resté sale (note `…214345799-ezk-backlog-ship-laisse-hors-du-commit-un-lien-rec.md`). Deux autres
  ships du run ont touché les mêmes fichiers ; ils ont été ajoutés à la main.
- **Une ligne de PLAN.md qui cite l'id d'une autre fiche bloque son ship.** La ligne des réglages
  d'agents citait l'id de la page « config » dans sa parenthèse ; le ship de la page a refusé, la
  croyant mêlée à une fiche à faire (note `…222239608-une-ligne-de-plan-md-qui-cite-l-id-d-une-autre-fic.md`).
- **`ezk run report` ne sait pas décrire un run local.** Il exige un numéro de PR et refuse
  `local (<sha>)` comme « - ». Le bilan du run a été rendu à la main (note
  `…222239269-ezk-run-report-refuse-une-livraison-locale-sans-nu.md`).
- **Le portier a encore demandé au PO de passer outre**, au début du run puis pour la session : deux
  dossiers voisins propres, aucun lien avec les fiches. C'est la cinquième fois en deux jours.
- **La gate polluait le carnet à chaque passage** : deux notes parasites par `pnpm test:scripts`
  toute la soirée. Corrigé après le run (fiche « ezk ne croit plus un INIT_CWD laissé par un pnpm
  parent », livrée en local f62e0128) : après la gate, le carnet garde ses notes.
- **Les revues ont payé à chaque fois** : redirection détournable par une tabulation, cookie périmé
  qui bloquait l'utilisateur, boucle sans fin plus tôt dans la journée. Chacune a coûté environ 130k.

## 2 · Tour 1 — chaque lentille propose

Rétro **légère**, à la demande du PO : pas de tour d'agents. Le pilote du run a rassemblé les faits
et formulé les propositions ; le PO tranche.

- Fiabiliser `ezk backlog ship` : lister ce qu'il touche, et ne lire que l'id de tête dans PLAN.md.
- Apprendre à `ezk run report` la livraison locale.
- Mesurer la taille d'une fiche au grooming, avant la porte « prête ».
- Relever la priorité de la fiche du portier.

## 3 · Tour 2 — confrontation et convergence

Le pilote a écarté lui-même deux idées :

- Une règle « relire les critères contre les fiches livrées depuis le tampon prête ». La
  contradiction de ce soir (l'écriture de config via `--root`) a été vue à l'ouverture du sprint et
  tranchée par le PO : l'arrêt a joué son rôle. À ressortir si une contradiction passe un jour au
  travers.
- Une règle sur le coût des revues : elles ont trouvé un vrai défaut à chaque passage. Le coût est le
  prix de la qualité, pas une dérive.

## 4 · Le juge de cohérence

Avis du pilote, en l'absence de juge (rétro légère) :

- **Ship plus fiable** : cohérent ; complète la
  [transaction de ship](../../features/done/20260830194601233_ship-transactionnel-liens-vues.md)
  (20260830194601233, livrée). Pas de doublon.
- **Run report en local** : cohérent avec le mode local (`github: false`) ; la fiche
  [« un seul guichet pour GitHub »](../../features/20261004083838593_guichet-unique-github-archive-reconcile.md)
  (20261004083838593) en est voisine sans le couvrir.
- **Règle de taille** : aucune règle de `rules/` ne fixe une taille de fiche (recherche sur « taille »,
  « découp »). Voisine de la technique de grooming « couper au plus petit morceau utile », qui reste
  au choix ; la règle la rend attendue avant la porte « prête ». Pas de contradiction.
- **Priorité du portier** : décision de priorité, rien à juger.

## 5 · Ce qui est proposé au PO

1. **`ezk backlog ship` plus fiable** (feature).
   - Fait vécu : un ADR recalé resté hors du commit ; un ship refusé pour un id cité en parenthèse.
   - Mesure : 0 dossier principal sale après un ship, et 0 refus pour un id cité ailleurs qu'en tête de
     ligne, sur les 10 prochains ships.
2. **`ezk run report` en mode local** (feature).
   - Fait vécu : le bilan du run rendu à la main.
   - Mesure : le prochain run local se clôt par `ezk run report`, sans réécriture à la main.
3. **Règle « une fiche prête tient dans un sprint économe »** (cible `skill:ezk-backlog`, SHOULD).
   - Fait vécu : deux fiches prêtes estimées à 500-800k, découpe décidée au build.
   - Mesure : sur les 5 prochains runs, aucune fiche prête n'est découpée au moment de construire.
4. **Fiche du portier en P1 et au plan** (action).
   - Fait vécu : cinq passages outre en deux jours, aucun vrai risque.

## 6 · Suivi des décisions de la rétro précédente

Rétro légère de fin de V0.5 (`docs/captures/2026-10-04-retro-iteration-v0-5-legere.md`) :

- **Le test de « ezk retro note » qui fuyait** : livré ce soir (f62e0128), cause corrigée dans `ezk`.
  A tenu : le carnet est resté propre après la gate.
- **Règle « éprouver chez un hôte avant de livrer »** : appliquée aux 4 fiches livrées depuis, chacune
  avec sa ligne datée (cop1-cobaye, muti, samplerz). Aucune gêne trouvée chez l'hôte. Mesure en bonne
  voie (4 sur 3 attendues).
- **Journal de sprint rangé par branche** : trop tôt, la fiche est en `idea`.
- **Les deux ajouts de cas** (portier, intégration sans PR) : faits ; le portier revient ci-dessus.

## 7 · Décisions du PO

| Proposition | Décision | Date |
|---|---|---|
| 1 · `ezk backlog ship` plus fiable | ✅ Retenue par le PO : fiche « ezk backlog ship dit tous les fichiers qu'il touche » (20261004211037977, bug, P2 proposé) | 2026-10-04 |
| 2 · `ezk run report` en mode local | ✅ Retenue par le PO : fiche « ezk run report décrit un run livré en local » (20261004211038053, bug, P2 proposé) | 2026-10-04 |
| 3 · Règle « une fiche prête tient dans un sprint économe » | ✅ Retenue par le PO : règle token-economy/fiche-tient-dans-un-sprint (SHOULD), bundle token-economy, liée à ezk-backlog (applies + porte « prête ») | 2026-10-04 |
| 4 · Fiche du portier en P1 et au plan | ✅ Faite, retenue par le PO : fiche « Les portiers laissent tranquilles les copies de réserve propres » (20261003011750521) passée en P1 et inscrite au plan, en tête de ce qui reste de la V0.6 | 2026-10-04 |

**Notes du carnet lues**, versées dans `docs/retro-notes/traitees/` :
`20261004214345799-ezk-backlog-ship-laisse-hors-du-commit-un-lien-rec.md` et
`20261004222239608-une-ligne-de-plan-md-qui-cite-l-id-d-une-autre-fic.md` (→ proposition 1),
`20261004222239269-ezk-run-report-refuse-une-livraison-locale-sans-nu.md` (→ proposition 2).

## 8 · Glossaire

- **Sprint économe** : un sprint en mode `--tokens lean`, cible d'environ 200k jetons par fiche.
- **Ship** : le geste qui range une fiche livrée dans `features/done/` (`ezk backlog ship`).
- **Livraison locale** : merge sur le `main` local, sans PR, quand la config coupe GitHub.
- **Portier** : le contrôle d'ouverture de sprint, qui alerte quand d'autres dossiers de travail sont ouverts.
