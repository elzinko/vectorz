> 🗎 Rendu de la fiche [features/20261101131506082_compte-rendu-de-sprint-non-date-sans-faux-zero.md](../done/20261101131506082_compte-rendu-de-sprint-non-date-sans-faux-zero.md)

## En clair

Les comptes rendus de sprint d'un run autonome commencent par « a duré 0 min et consommé 0 tokens ».
C'est faux : la durée n'a simplement pas été mesurée. Cette fiche fait dire « non mesuré » dès la
première phrase, et fait poser par le run autonome le point de passage qui permet de dater le sprint.

## Contexte / Problème

Constaté au run du 2026-11-01 : les deux comptes rendus `docs/sprints/2026-11-01-sprint-*.md`
s'ouvrent sur « 0 min » et « 0 tokens ». La raison n'arrive qu'entre parenthèses : aucun point de
passage de supervision `sprint-<slug>-checkpoint` n'a été posé. En mode autonome,
`ezk-product-build` absorbe le point de contrôle d'`ezk-sprint`, et personne ne pose ce point.

La méthode promet déjà le contraire dans `skills/ezk-sprint/SKILL.md` (section « Le compte rendu du
sprint ») : « jamais un faux zéro ». L'outil ne tient pas cette promesse. Effet de bord : la
détection des candidats-recette (`ezk-chef suggest`) ne peut pas tourner, faute de rapport daté.

Constaté aussi le 2026-11-02 : un sprint daté peut porter des chiffres absurdes. Sur 27 comptes
rendus de vectorz, 23 ont une durée de 0 et 3 seulement une durée mesurée. Deux de ces trois sont
faux :

- `2026-11-01-sprint-mission-control-lit-le-board-par-ezk.md` dit 390 h 35, 3,5 milliards de jetons
  et 49 fiches livrées, pour un sprint d'une soirée et une fiche ;
- `2026-10-17-sprint-board-multi-llm-v0-18-emetteur-contrat-0-2-journ.md` dit 3 milliards de jetons
  en 8 minutes.

La fenêtre de mesure semble partir d'un point de passage bien plus ancien que le sprint. Ces chiffres
empêchent aussi mission control d'afficher le temps et les jetons cumulés
([vue d'ensemble : sprints et rétros réels](../done/20261102104443762_vue-ensemble-sprints-retros-reels.md)).

Revu le 2026-11-02 au soir, sprint 7 du run autonome : le compte rendu
`2026-11-02-sprint-mission-control-se-prot-ge-et-compte-vrai.md` est daté (1 h 25, point de passage
posé), mais il annonce « 0 fiche(s) livrée(s) » pour deux fiches livrées, et 306 millions de jetons.
Le point de passage ne suffit donc pas : le compte des fiches et la fenêtre des jetons sont faux eux
aussi.

Même défaut au sprint 8, le même soir. Le compte rendu
`2026-11-02-sprint-le-pouce-de-revue-passe-par-la-m-thode.md` annonce « 1 fiche(s) livrée(s) », et
c'est une fiche d'une autre session, le carnet de tests. Les deux fiches du lot, livrées en local
(`382412eb`, `b6711c6b`), n'y figurent pas. Les jetons annoncés, 152 millions, sont presque tous des
lectures de cache. Piste : le compte des fiches livrées ne reconnaît pas un ship local
(`pr: local (<sha>)`), et prend ce qui a été livré dans la fenêtre, quelle que soit la session.

Au sprint 9, le même soir, le compte rendu est juste : 2 fiches livrées sur 2, 33 minutes, des ships
locaux eux aussi. Le défaut n'est donc pas « un ship local n'est jamais compté » : il dépend de la
fenêtre. Piste plus précise : le compte retient ce qui tombe dans la fenêtre du point de passage, et
les sprints 7 et 8 ont eu des ships hors de cette fenêtre, ou une fiche d'une autre session dedans.

## Valeur

Pour le PO qui relit un sprint : un chiffre faux en première phrase trompe plus qu'une absence
dite. Et un sprint daté rend la rétro outillée (recettes, durées) possible.

## Proposition

Précisée au grooming du 2026-11-03 (run autonome), d'après le code. Quatre causes, quatre gestes.

1. **Les dates se comparent comme des instants.** `src/sprint-metrics/domain/kpi.ts:14` compare comme
   du texte la date du commit de livraison, en heure locale (`2026-11-03T00:20:35+01:00`), aux bornes
   de la fenêtre, en heure universelle (`2026-11-03T00:05:36Z`). Une livraison à 00 h 20 à Paris passe
   pour être dans la fenêtre, une livraison à 01 h 44 passe pour en être sortie. Les comptes rendus des
   sprints 11, 12 et 13 du 2026-11-03 nomment ainsi les fiches du sprint d'avant. On compare les
   instants (`Date.parse`).
2. **Les fiches livrées sont celles du lot.** Quand le lot scellé est connu, le compte ne retient que
   ses fiches livrées dans la fenêtre : une fiche d'une autre session n'est plus comptée. Sans lot, le
   compte reste celui de la fenêtre.
3. **La fenêtre part du même run.** `domain/duration.ts:49` prend le point de passage précédent, quel
   que soit son run, et sinon le tout premier run du dépôt : d'où 390 h. Le début devient le point de
   passage précédent DU MÊME run, sinon le démarrage de ce run.
4. **Non mesuré se dit.** Un compte rendu sans point de passage ouvre par « durée et jetons non
   mesurés », jamais par « 0 min » ni « 0 tokens ». Et `ezk-product-build`, en mode autonome, pose le
   point de passage `sprint-<slug>-checkpoint` avant `close` : son texte le dit à l'étape 4.

```
aujourd'hui   commit 01:44+01:00 (= 00:44Z)  vs  fin 00:45Z  →  « 01:44 » > « 00:45 » en texte  →  exclu
après         Date.parse(00:44Z) <= Date.parse(00:45Z)                                          →  compté
```

## Critères d'acceptation

- [x] Un compte rendu sans point de passage dit « non mesuré » dans sa première phrase, et aucun zéro
      de durée ou de jetons n'y apparaît.
- [x] Une livraison datée en heure locale est comptée selon son instant : sur une fixture, un commit
      à `00:20+01:00` sort d'une fenêtre `00:05Z → 00:45Z`, un commit à `01:44+01:00` y entre.
- [x] Quand le lot est connu, une fiche livrée dans la fenêtre hors du lot n'est pas comptée.
- [x] La fenêtre commence au point de passage précédent du même run, sinon au démarrage de ce run :
      sur une fixture à deux runs, un sprint du second run ne part jamais d'un point du premier.
- [x] Le texte d'`ezk-product-build` dit de poser `sprint-<slug>-checkpoint` avant `close` en mode
      autonome.

## Comment vérifier

```bash
pnpm --dir products/mega-city exec vitest run src/sprint-metrics
```

Signal observable : les comptes rendus écrits après ce correctif ne contiennent ni « 0 min » ni
« 0 tokens », et leur liste « Fiches livrées » est celle de leur lot. Les comptes rendus déjà committés
ne sont pas régénérés : ils restent l'historique, avec leurs zéros d'époque.

## Notes

- Née de la rétro légère du 2026-11-01 (P5 de la rétro), acceptée par le PO le même jour :
  [rétro du run des contrats JSON](../../docs/captures/2026-11-01-retro-run-contrats-json-light.md).
- Priorité P2 par défaut, comme les fiches de la rétro précédente : à ajuster au grooming.
- Groomée le 2026-11-03 (run autonome) : causes lues dans le code. La cause n° 1 vient de la rétro du
  sprint 12 du 2026-11-03 (proposition P1 en attente du PO), qui la décrit comme un défaut neuf : elle
  est couverte ici, ce n'est pas une fiche de plus. L'ancien critère « au prochain run autonome, chaque
  compte rendu porte une durée non nulle » est tenu par ce run : les sprints 12 et 13 durent 40 et
  34 minutes.
- Prête le 2026-11-03 : porte « prête » passée en run autonome (ezk-pm GO, sans condition). Coupe si le
  build déborde : gestes 1 et 4, puis 3, puis 2 ; le reste en fiche fille du même milestone.
- **Preuves du build (2026-11-03).** Rejoués avec le nouveau code, sur le vrai journal et le lot de
  chaque compte rendu :
  - sprint 12 du 2026-11-03 : 2 fiches livrées, exactement son lot (avant : deux fiches des sprints 10
    et 11) ; la fenêtre part du démarrage de son run, 34 min ;
  - sprint 13 du 2026-11-03 : 2 fiches livrées, exactement son lot (avant : deux fiches du sprint 11) ;
  - `mission-control-lit-le-board-par-ezk` du 2026-11-01 : 41 min et 1 fiche livrée (avant : 390 h et
    49 fiches).
  - Un compte rendu non daté ouvre par « Durée, jetons et fiches livrées sont donc non mesurés », et
    aucun « 0 min » ni « 0 tokens » n'y figure (test).
- **Après la revue (GO, 2026-11-03).** Les compteurs de blocages et de retouches de PR comparent eux
  aussi des instants : une PR fusionnée pile à la borne, sans millisecondes, sortait de la fenêtre.
  « Comment vérifier » vise les tests, plus les anciens comptes rendus, qui gardent leurs zéros.


## Validation

| Modalité | Statut |
|---|---|
| Gate locale | ✅ 2282 tests 47 suites |
| Rejeu sur le vrai journal | ✅ sprints 12 et 13 et le sprint des 390 h |
| Revue ezk-reviewer | ✅ GO |
| Before / after (UI) | N.A. — rapport markdown et domaine sans écran |
