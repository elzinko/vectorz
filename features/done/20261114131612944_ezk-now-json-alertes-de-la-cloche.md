---
id: "20261114131612944"
title: "`ezk now --json` publie les alertes de la cloche, dont les décisions à trancher"
type: feature
priority: P1
product: mega-city
milestone: board
version:
labels: [contrat, theme:mission-control, theme:autonomie]
status: shipped
blocked:
pr: "local (633259b6)"
evidence: none # une commande et un contrat ; l'écran suit dans une fiche cop1
created: 2026-11-14
---

# 20261114131612944 — `ezk now --json` publie les alertes de la cloche, dont les décisions à trancher

**En clair.** La maquette de mission control met une cloche sur toutes les pages : fiches bloquées,
idées à préparer, propositions de rétro à trancher, versions à poser. Rien ne publie cette liste, et le
lancement autonome du 4 novembre s'est arrêté sur des décisions que personne ne voyait. La méthode va
publier ces alertes une par une et retenir celles que tu as fermées : quelques minutes de décisions
suffisent à relancer le travail.

**Si tu arrives frais.** `ezk now` est la boussole : la commande qui dit « que faire maintenant ».
Un « contrat » est le schéma versionné d'une sortie `--json`. Groomer une idée, c'est la préparer
jusqu'à la rendre tirable. Une fiche bloquée porte un drapeau `blocked:` avec une raison typée
(`deferred`, `panel`…). Mission control, l'écran de cop1, lit ce que la méthode publie et ne déduit rien (ADR-086).

## Contexte / Problème

Ce que l'écran attend. La maquette du 11 novembre pose une cloche sur toutes les pages, détaillée sur
l'Accueil et la Vue d'ensemble. Six types d'alertes : fiche bloquée avec sa raison, idée à groomer,
proposition de rétro à trancher, question posée par la méthode dans une session, version à poser, sprint
clos sans rétro. Une alerte fermée ne revient pas. La carte « À trancher » a cédé la place à la cloche.

Ce que la méthode publie aujourd'hui.

- `ezk now` rend du texte seulement, sans `--json` ; le domaine `now` n'a aucun verbe. Son cœur connaît
  trois états (sprint ouvert, tête tirable, tête à groomer), un repli « rien de tirable », et rend une à
  trois suites, pas une liste d'alertes.
  `products/mega-city/bin/ezk-now.ts:77-90`, `ezk-manifest.yml:403-406`, `src/core/now.ts:34-89` (`suggestNow`)
- La raison d'une fiche bloquée est publiée en un mot anglais, sans la décision attendue. Lu le
  14 novembre, avant les fiches de la carte des écarts : 17 fiches actives bloquées (9 `deferred`,
  4 `panel`, 3 `design`, 1 `review`) et 4 idées à groomer. La page Fiches de la maquette veut la raison en français.
  `products/mega-city/contracts/board-show/v1/schema.json:61-64`, `contracts/backlog-show/v1/schema.json:46-49`
- La phrase française de chaque raison existe dans une table. Elle n'est imprimée que fiche par
  fiche, en texte, par `ezk run eligibility --fiche <id>`.
  `products/mega-city/src/backlog/run-eligibility.ts:33-43` (`ESCALATION_BY_REASON`), `bin/run-eligibility.ts:56-58`
- Les propositions de rétro en attente sortent d'une autre commande, `ezk retro captures --json`,
  sans contrat. Au 14 novembre : 57 propositions ⏳ sur 41 captures, dont 2 dans la dernière.
- Une version à poser se déduit de `board show --json` : un lot `a-clore` sans étiquette. Au
  14 novembre : v0.23.0 et v0.24.0.
  `products/mega-city/src/core/board-contract.ts:96`
- Une question posée dans une session est un `gate.reached` sans `gate.resumed` dans le dernier
  lancement. La méthode lit ces évènements ; rien ne publie la question ; les gates sont une liste fermée.
  `products/mega-city/src/sprint-metrics/adapters/journalSource.ts:47-70`, `src/supervision/analyze.ts:363-365`, `skills/ezk-product-build/SKILL.md:589`
- Un sprint clos sans rétro n'est pas calculable : l'historique ne porte que deux comptes, et les
  derniers sprints n'ont pas de champ `retro`.
  `products/mega-city/src/core/sprint-reports-since.ts:61-69`, `src/core/sprint-report-summary.ts:23-35`
- La mémoire des alertes fermées n'existe nulle part : ni contrat, ni fichier, ni stockage écran.

## Proposition

POC d'abord : la commande et son contrat. L'écran suit dans une fiche cop1, écrite au grooming.

1. `ezk now --json` publie `alertes[]`, décrit dans un nouveau contrat, proposé sous le nom
   `contracts/now-show/v1/schema.json`, avec `schema_version`, selon la recette
   [Publier un contrat JSON versionné](20261101131506339_recette-publier-un-contrat-json-versionne.md).
   Une entrée par élément, jamais de regroupement : `type`, `id`, `titre`, `raison`, `decision`, `fichier`, `date`.
2. Six types : `fiche-bloquee`, `idee-a-groomer`, `proposition-retro`, `question-session`,
   `version-a-poser`, `sprint-sans-retro`.
   - `fiche-bloquee` reprend le cœur de la fiche « À trancher » : la décision attendue vient de la
     table `ESCALATION_BY_REASON`. Une raison inconnue donne « raison non tracée, à requalifier ».
   - `proposition-retro` cite la capture et l'index de l'action, sans la recopier. Règle proposée : la
     dernière rétro seulement, comme la maquette (2 aujourd'hui, pas 57) ; les décisions en attente, voir Notes.
   - `question-session` : un `gate.reached` sans `gate.resumed` dans le dernier lancement ; rien ne le calcule encore.
   - `version-a-poser` : la projection des lots `a-clore` sans étiquette.
   - `sprint-sans-retro` attend le lien rétro → sprints de
     [Une rétro relit une liste de sprints nommés](../20261114131614801_retro-relit-une-liste-de-sprints-nommes.md) ; en attendant, `non_mesure[]`.
3. Ce que la méthode ne mesure pas encore va dans `non_mesure[]`, en mots, jamais dans un faux zéro.
4. La sortie texte de `ezk now` ne change pas. Ses suites sortent aussi dans le JSON, dans `suites[]`.
5. Fermer une alerte passe par une commande, proposée sous la forme `ezk now close <type>:<id>`. Elle
   écrit un fichier dans le projet, comme les verdicts de revue dans `features/reviews/verdicts/`
   (ADR-0057, ADR-086 point 4). Le JSON publie `fermees[]` ; une alerte sans cause sort d'elle-même.
6. La raison de blocage en français (écart A8) : `board show --json` (`actives[]`) et
   `backlog show --json` (`fiches[]`, fiche seule) portent `blockedLibelle`, tiré de la même table que
   `decision`. Il vaut `''` sans blocage. Le mot anglais `blocked` reste tel quel.

Hors périmètre : la cloche côté cop1 (fiche cop1 au grooming) ; trancher depuis l'écran ; les libellés
français des autres énumérations (tier, effort, stage), autre lot de la carte ; un numéro court (Notes).

## Critères d'acceptation

- [ ] `ezk now --json` rend `alertes[]`, `fermees[]`, `non_mesure[]` et `suites[]`, décrits dans un
  contrat versionné avec `schema_version` ; l'exemple rangé est égal à la sortie.
- [ ] Chaque alerte porte un des six types, un id, un titre, une raison ou une décision attendue, un
  fichier source et une date ; une raison inconnue donne « raison non tracée, à requalifier ».
- [ ] Sur vectorz, toute fiche active bloquée donne une alerte `fiche-bloquee`, toute idée non bloquée
  une `idee-a-groomer`, tout lot « à clore » sans étiquette une `version-a-poser` (17, 4 et 2 le
  14 novembre, avant les fiches de la carte) ; la sortie texte de `ezk now` est inchangée.
- [ ] Une alerte fermée par la commande ne revient pas ; la mémoire est un fichier du projet écrit
  par `ezk` ; une alerte dont la cause a disparu sort de la liste sans geste.
- [ ] Les types non mesurés sont dits en mots dans `non_mesure[]` ; aucun type n'affiche un zéro qui ment.
- [ ] Les contrats `board-show` et `backlog-show` portent `blockedLibelle`, tiré de la même table
  que `decision`, sans changer de numéro de version (ajout compatible) ; `blocked` ne change pas ;
  toute fiche bloquée a un libellé non vide.

## Comment vérifier

```bash
ROOT="$(git rev-parse --show-toplevel)"
# les alertes par type ; une fiche bloquée et le non mesuré ; fermer une alerte, elle ne revient pas
ezk --root "$ROOT" now --json | jq '.alertes | group_by(.type) | map({type: .[0].type, n: length})'
ezk --root "$ROOT" now --json | jq '[.alertes[] | select(.type=="fiche-bloquee")][0], .non_mesure'
ezk --root "$ROOT" now close fiche-bloquee:<id>
ezk --root "$ROOT" now --json | jq '.fermees'
# la raison en français ; la sortie texte, inchangée ; les tests
ezk --root "$ROOT" board show --json | jq '[.actives[] | select(.blocked!="")] | map(.blockedLibelle) | unique'
ezk --root "$ROOT" now
pnpm --dir products/mega-city test -- src/__tests__/now.test.ts src/__tests__/board-contract.test.ts src/__tests__/backlog-show.test.ts
```

Pas de preuve d'écran : la fiche livre une commande et un contrat. L'écran vient avec la fiche cop1.

## Glossaire

- lancement (`run`) — une exécution autonome de la méthode, tracée dans le journal de supervision.
- gate — un arrêt du lancement où la méthode pose une question ; `gate.reached` l'ouvre, `gate.resumed` la ferme.
- capture de rétro — le compte rendu d'une rétrospective, dans `docs/captures/` ; une proposition en attente porte ⏳.

## Notes / décisions

- Origine : [la carte des écarts du 14 novembre](../../docs/maquettes/2026-11-14-carte-des-ecarts-maquette-code-backlog.md), écarts B1 et A8.
- Décision du PO du 14 novembre (point 4) : la cloche absorbe « À trancher » ; la carte de la Vue
  d'ensemble a disparu au profit de la cloche. La fiche [« À trancher » : les décisions qui bloquent le prochain run](20261104204526440_a-trancher-decisions-qui-bloquent-le-run.md)
  passe `superseded` au profit de celle-ci : son cœur, la décision attendue par raison, devient le type
  `fiche-bloquee`. Pas de suppression, pas de gonflage de vélocité ; le pilote édite l'ancienne fiche.
- Décision du PO du 14 novembre (point A8) : pas de numéro court stocké sur les fiches ; les ids
  horodatés restent ([Idées sans numéro](0180-idees-sans-numero.md)). Le numéro court est un
  affichage calculé par l'écran cop1, noté dans [Mission control range son menu par portée](20261114131616818_mission-control-menu-par-portee-et-vocabulaire.md).
- Décisions à prendre par le PO : l'emplacement du fichier des alertes fermées, pour lequel la fiche
  propose un dossier du projet écrit par `ezk`, jamais un stockage navigateur par poste, comme
  [les verdicts de revue](../../products/mega-city/docs/adr/0057-le-tableau-de-bord-ecrit-un-seul-dossier.md) ;
  et, pour `proposition-retro`, la dernière rétro seulement (proposé) ou toutes les captures.
- Dépend de : [Trancher la coupe](20261114131613874_trancher-la-coupe-dossier-panel-adr-0088.md) et
  [Amendements d'ADR du 12 novembre](20261114131614058_amendements-adr-du-12-novembre.md), où vivent les
  décisions en attente que la cloche affichera comme propositions de rétro ; elle les cite sans les recopier.
  Pour `sprint-sans-retro` : [Une rétro relit une liste de sprints nommés](../20261114131614801_retro-relit-une-liste-de-sprints-nommes.md).
- Fiches voisines : [Boussole de session](20261010091118580_boussole-session-quoi-faire-maintenant.md), livrée, la commande que cette fiche étend ;
  [Le board range une version « à clore »](20261102100505774_board-version-a-clore-rangee-a-venir.md), livrée, l'état que `version-a-poser` projette ;
  [Rétro systématique en fin d'itération](20260911224102584_retro-systematique-fin-iteration-multi-sprint.md), livrée, la « rétro due » dont `sprint-sans-retro` descend ;
  [Demander une rétro depuis mission control](../20261114131617010_demander-une-retro-depuis-mission-control.md), qui ajoutera un type d'alerte `retro-demandee` ;
  [Un test vérifie que chaque écran montre ce que la méthode publie](../20261104204526516_controle-auto-des-ecrans-mission-control.md), la preuve écran ↔ JSON ;
  [Une reco de commande suivante à chaque réponse](../20261008182705764_reco-commande-suivante-a-chaque-reponse.md), même famille, à ne pas dédoubler ;
  [Les raisons de blocked : un mot anglais](20261027180541168_raisons-blocked-mot-anglais.md), dont la décision du 27 octobre porte sur la valeur écrite, pas sur le libellé affiché.
- Risques : la cloche déborde si on publie les 57 propositions ⏳, d'où « dernière rétro seulement ».
  La question de session vient d'un journal que cop1 lit aussi en direct : une seule source, la méthode.
- Références : [ADR-086](../../docs/adr/ADR-086-la-methode-seul-lecteur-des-fiches-contrat-json.md), [ADR-085](../../docs/adr/ADR-085-prete-gate-reservations-via-blocked.md),
  règle [La rétro due est un choix chiffré](../../products/mega-city/rules/token-economy/retro-due-choix-chiffre.md).

## Note du 2026-11-26 — périmètre POC retenu (contrôle « prête » ezk-pm : GO)

**En clair.** On livre d'abord la lecture : `ezk now --json` publie la liste des alertes, une par élément.
La mémoire des alertes fermées, qui demande un geste d'écriture, part dans une fiche suivante.

### Critères d'acceptation (POC)

- [x] `ezk now --json` rend `alertes[]`, `non_mesure[]` et `suites[]` dans un contrat versionné `now-show/v1`, avec `schema_version` ; l'exemple rangé est égal à la sortie.
- [x] Chaque alerte porte un des six types, avec id, titre, raison ou décision attendue, fichier source et date ; une raison inconnue donne « raison non tracée, à requalifier ».
- [x] Sur vectorz : toute fiche active bloquée donne `fiche-bloquee`, toute idée non bloquée `idee-a-groomer`, tout lot « à clore » sans étiquette `version-a-poser` ; la sortie texte de `ezk now` est inchangée.
- [x] Les types non mesurés (`question-session`, `sprint-sans-retro`) sont dits en mots dans `non_mesure[]` ; aucun type n'affiche un zéro qui ment.
- [x] Les contrats `board-show` et `backlog-show` portent `blockedLibelle` (même table que `decision`), ajout compatible sans changement de version ; `blocked` reste inchangé ; toute fiche bloquée a un libellé non vide.

- Revue adverse : ezk-reviewer GO (contrat now-show/v1, sortie texte figée par test d'or, blockedLibelle compatible). Gate : pnpm --dir products/mega-city gate verte (2565 vitest, 49 suites de scripts).

### Hors périmètre du POC

- Fermer une alerte et s'en souvenir (`close`, `fermees[]`). Le daemon n'a pas de geste d'écriture. Voir la fiche « La cloche se souvient des alertes fermées ».
