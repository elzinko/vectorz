fiches: 20260821210633457,20260826222044335,20260830110131158,20260830110131228,20261001133500750,20261002115451451,20261002130917993,20261003011750433,20261008182705734,20261008182705749,20261008182705764,20261008182705779,20261008192643426,20261009104401282,20261014113049954,20261016081021364,20261027192532935,20261027194016734,20261029093423195,20261029112813308,20261031160441559,20261101131505997,20261101131506082,20261101131506169,20261101131506254,20261101131506339,20261101162826995,20261101215342537,20261102100505596,20261102100505774,20261102100505955,20261102100506119,20261102103553108,20261102104443762,20261102123552181,20261102123552182,20261102123552183,20261102123552184,20261102123552185,20261102124306840,20261102151630248,20261102165708468,20261102182259416,20261102182259505,20261102182259592,20261102182259680,20261102183114656,20261102234112839,20261103161632129,20261103161632234,20261103191932064,20261103191932067,20261103191932070,20261103191932074,20261103191932077,20261103191932080,20261103203943909,20261103203943912,20261103203943915

# Session du 2026-11-02 au 2026-11-04 — intégration des autres sessions, puis run autonome (sprints 7 à 26)

## En clair
Les 60 commits des autres sessions vectorz sont fusionnés dans main local, et 45 sessions sont archivées. Ensuite, 20 sprints autonomes ont livré 37 fiches, tout en local. Rien n'est poussé : main a 215 commits d'avance sur origin/main, et le push reste ton geste.

## Ce qui a été fait
- Partie 1 : fusion dans main local de 60 commits venus d'autres sessions (tous ancêtres de main, vérifiés commit par commit).
- Partie 2 : run autonome en mode local (github:false, intégration par `ezk forge integrate`). Chaque fiche a eu une revue adverse ezk-reviewer GO et une gate verte.
- Une rétro légère par sprint : `docs/captures/2026-11-0*-retro-sprint-*-run-autonome-light.md`. Toutes leurs propositions sont encore ⏳.
- Quand plus rien n'était tirable, le run a lancé ezk-scout (find-only) et fait trier les brouillons par ezk-pm : 9 bugs de mission control retenus et livrés (sprints 24 à 26).
- Le PO a arrêté le run le 2026-11-04 (« Non, on s'arrête là »). Une 3e passe du scout s'est coupée sur une erreur réseau ; son banc est nettoyé.

## Où lire le détail
Comptes rendus de sprint de cette session : `docs/sprints/2026-11-02-sprint-*.md` et `docs/sprints/2026-11-03-sprint-*.md` (sprints 7 à 26). Le journal brut de sprint n'est pas recopié ici.

## Décisions durables
- Le PO a écrit « Attendre mes décisions », relu comme : ne rien trancher de ce qui lui revient (4 décisions humaines, dé-park, fusion de fiches, push).

## Pièges appris
- `ezk` délègue à la copie de la méthode du checkout de INIT_CWD : pour tester une instance, la lancer depuis son worktree avec `unset INIT_CWD`.
- Recalculer à la main le nom du point de passage d'un sprint fausse le compte rendu.
- `ezk review emit --fiche` attend l'id, pas un chemin.
- La gate mega-city ne lance pas les tests de cop1.
- Deux stories d'un même fichier se construisent l'une après l'autre.

## Galères & gestes (labo)
- Port web : tuer cop1-dev.sh par TERM ne tue pas ses enfants (vite, daemon) — le trap attend la fin du vite au premier plan. Geste : arrêter les enfants par pid. Ctrl-C (SIGINT au groupe) n’a pas ce défaut.

## En attente du PO
- Push de main (215 commits d'avance, dont 60 d'autres sessions).
- Deux bugs du scout non fichés : réglages ⚙ (écriture d'une config partagée par tous les projets) ; versions « V1.0 » de samplerz invisibles (choix de format).
- 17 fiches bloquées et 85 parkées.
