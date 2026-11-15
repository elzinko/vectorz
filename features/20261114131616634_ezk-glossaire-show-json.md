---
id: "20261114131616634"
title: "`ezk glossaire show --json` : le glossaire publié par la méthode, source unique des boutons « i »"
type: feature
priority: P2
product: mega-city
milestone: board
version:
labels: [contrat, convention]
status: idea
blocked:
pr:
evidence: none # une commande publiée, aucun écran modifié
created: 2026-11-14
---

# 20261114131616634 — `ezk glossaire show --json` : le glossaire publié par la méthode, source unique des boutons « i »

**En clair.** La maquette de mission control met un petit « i » à côté de chaque mot d'écran pour
l'expliquer, mais ce texte n'a pas de source unique : le seul glossaire est un fichier Markdown du
dépôt vectorz, qu'aucune commande ne publie. On déplace le glossaire dans la méthode et on le
publie par une commande en données, avec pour chaque terme sa définition en clair et l'endroit où
il joue. Un mot changé dans la méthode change alors partout, sans texte recopié dans l'écran.

**Si tu arrives frais.** La méthode (mega-city) publie ses données par des commandes
`ezk … --json` au format versionné, dits contrats ; mission control, l'écran de cop1, les lit sans
relire les fichiers (ADR-086). Un bouton « i » est la pastille d'aide à côté d'un mot de l'écran,
dans la maquette du 11 novembre.

## Contexte / Problème

Ce que l'écran attend : un « i » sur chaque mot d'écran (sprint, but du sprint, lot, incrément,
rétro, version, objectif, jalon, session, lancement, module, compétence, agent, commande), et une
section « glossaire » dans la page Annuaire de la méthode. C'est l'écart I1 de la
[carte des écarts](../docs/maquettes/2026-11-14-carte-des-ecarts-maquette-code-backlog.md) ; le
panel du 11 novembre a appliqué l'Annuaire à la maquette
([capture](../docs/captures/2026-11-11-panel-loi-projet-annuaire-maquette.md), section 9).

Ce qui existe le 14 novembre :

- Un glossaire Markdown : [`docs/glossaire-jargon-ezk.md`](../docs/glossaire-jargon-ezk.md), né de
  la fiche [Mise à plat du backlog, carte lisible et glossaire](done/0091-mise-a-plat-carte-glossaire.md).
  127 lignes, 64 entrées en six tableaux, colonnes Terme / En clair / Verdict (garder, traduire,
  supprimer) ; la dernière table, celle de « module », n'a pas de colonne Verdict. Il vit dans le
  dépôt vectorz, hors `products/mega-city`.
- Aucun domaine `glossaire` dans `products/mega-city/ezk-manifest.yml` ; aucun fichier glossaire
  sous `products/mega-city`. Aucune commande ne le publie.
- Les mots d'écran tranchés les 11 et 12 novembre y manquent. Aucune entrée propre pour sprint, but
  du sprint, lot, incrément, version, objectif, milestone, jalon, session, lancement, compétence,
  agent, commande. Il définit « Gate » (ligne 24), « Rétro — Sujet A » et « Sujet B » (lignes 58-59),
  « Vue des sessions » (ligne 63), « Run orphelin » (ligne 74) et « module » (ligne 122).
- Les décisions du 12 novembre (vocabulaire Scrum à l'écran, « run » hors écran) et celle du 11
  novembre (« Objectif » = le mot des milestones) ne vivent que dans la capture du 11 novembre,
  lignes 129 à 133, encore non committée au 14 novembre, et dans la maquette.
- [ADR-086](../docs/adr/ADR-086-la-methode-seul-lecteur-des-fiches-contrat-json.md), décision 3
  (lignes 80-83), dit « le glossaire renvoie au bon mot », sans nommer les mots d'écran. Son
  amendement est porté par
  [Amendements d'ADR du 12 novembre](done/20261114131614058_amendements-adr-du-12-novembre.md), comme le
  renommage de « Le run » dans `products/mega-city/method/ceremonies.yml:69`.

Ce qui manque : une source unique, possédée par la méthode, publiée par contrat, lue par les « i »
et par l'Annuaire. Aujourd'hui les « i » de la maquette ont deux sources possibles : le glossaire
Markdown, ou un texte figé dans l'écran.

## Proposition

POC d'abord : un fichier déplacé, une commande, un contrat.

- Le glossaire devient un fichier de données possédé par la méthode, sous `products/mega-city/`.
  Emplacement candidat : `products/mega-city/method/glossaire.yml`, à côté de `ceremonies.yml`,
  seul fichier de `method/` aujourd'hui. Forme à trancher au grooming : YAML, ou Markdown avec
  front-matter. `docs/glossaire-jargon-ezk.md` devient un pointeur d'une ligne, pour que les liens
  des ADR et des fiches ne cassent pas.
- Chaque entrée porte : le terme, sa définition en clair (une phrase), où il joue (écran, commande,
  fichier), son verdict (garder, traduire, supprimer, comme aujourd'hui), le mot Scrum équivalent
  s'il existe, et des renvois.
- `ezk glossaire show --json` publie le glossaire par un contrat versionné
  `products/mega-city/contracts/glossaire/v1/` (schéma tolérant, exemple généré sur une fixture,
  test de contrat), selon la recette
  [Publier les données d'un outil par un contrat JSON versionné](../recipes/publier-un-contrat-json-versionne.md).
  Sans `--json`, la commande rend la liste en texte lisible.
- Le manifeste déclare le domaine `glossaire`, verbe `show`.
- Les quatorze mots d'écran entrent dans le glossaire avec les définitions des 11 et 12 novembre,
  une fois les ADR amendés : sprint, but du sprint, lot, incrément, rétro, version, objectif
  (milestone), jalon (gate), session, lancement (run), module, compétence (skill), agent, commande.
- Hors périmètre : les boutons « i » eux-mêmes et le menu, portés par
  [Mission control range son menu par portée](20261114131616818_mission-control-menu-par-portee-et-vocabulaire.md)
  et le lot Annuaire ; les amendements d'ADR et le renommage « Le run » → « Le sprint » (fiche des
  amendements) ; `ezk help --json`
  ([`ezk help --json` publie les commandes](done/20261114131613129_ezk-help-json-commandes-etage-famille.md)).

## Critères d'acceptation

- [ ] Le glossaire vit dans un fichier possédé par la méthode sous `products/mega-city/` ;
      `docs/glossaire-jargon-ezk.md` n'est plus qu'un pointeur vers lui, et les liens existants vers
      ce chemin restent valides.
- [ ] `ezk glossaire show --json` publie chaque terme avec sa définition en clair, où il joue, son
      verdict et, s'il existe, son mot Scrum ; `ezk glossaire show` sans `--json` rend la même liste
      en texte.
- [ ] Le contrat `glossaire` v1 existe sous `products/mega-city/contracts/glossaire/v1/` : schéma
      tolérant, exemple généré sur une fixture, test de contrat vert ; `schema_version` 1 ouvre la
      sortie.
- [ ] Le glossaire publié contient, en une phrase chacun, les quatorze mots d'écran : sprint, but du
      sprint, lot, incrément, rétro, version, objectif (milestone), jalon (gate), session, lancement
      (run), module, compétence (skill), agent, commande ; il garde les 64 entrées d'aujourd'hui, ou
      journalise celles qu'il retire.
- [ ] Un terme en double, ou sans définition, fait échouer la validation de la méthode (compilateur
      ou test), jamais en silence.
- [ ] Le manifeste déclare le domaine `glossaire` et son verbe `show` ; l'aide de la méthode les liste.

**Mesure de suivi** — les « i » de mission control et la section glossaire de l'Annuaire lisent ce
contrat ; aucun texte de définition figé dans l'écran, sur les trois prochaines fiches d'écran.

## Comment vérifier

```bash
ezk glossaire show --json | jq '.schema_version, (.termes | length)'
ezk glossaire show --json | jq -r '.termes[].terme' | grep -i -c -E '^(sprint|but du sprint|lot|incrément|rétro|version|objectif|jalon|session|lancement|module|compétence|agent|commande)$'   # 14
ezk glossaire show | head -20
ezk help glossaire
test -f products/mega-city/contracts/glossaire/v1/schema.json && test -f products/mega-city/contracts/glossaire/v1/example.json && echo "contrat présent"
pnpm --dir products/mega-city test -- src/__tests__/glossaire-contract.test.ts   # à créer, sur le modèle de src/__tests__/board-contract.test.ts
```

- Le pointeur : `docs/glossaire-jargon-ezk.md` tient en quelques lignes et renvoie au fichier de la
  méthode ; `grep -rn 'glossaire-jargon-ezk' docs products` liste les liens entrants, tous valides.
- Pas de preuve d'écran : une commande.

## Glossaire

- `contrat JSON versionné` — la sortie `--json` d'une commande, décrite par un schéma publié avec un
  numéro de version, un exemple et un test.
- `bouton « i »` — la pastille d'aide à côté d'un mot d'écran, dans la maquette de mission control.
- `Annuaire de la méthode` — la page de la maquette qui liste compétences, agents, règles, profils,
  commandes, glossaire et documents de la méthode.

## Notes / décisions

- Origine : la [carte des écarts](../docs/maquettes/2026-11-14-carte-des-ecarts-maquette-code-backlog.md)
  du 14 novembre, écart I1, scindé en deux : les amendements d'ADR et le renommage dans
  [Amendements d'ADR du 12 novembre](done/20261114131614058_amendements-adr-du-12-novembre.md), le
  glossaire publié ici. Pilote « Oui, crée-les ». Statut `idea` : le PO tranche.
- Dépend de la fiche des amendements : les définitions des mots d'écran viennent des ADR amendés
  (ADR-086 décisions 2 et 3, ADR-079 D11, ADR-0054 section Nommage).
- Points laissés ouverts le 12 novembre, à confirmer par le PO avant d'écrire les définitions :
  « But du sprint » comme nom du Sprint Goal ; le sort du « but de version » ouvert dans
  [l'ADR-0080](../products/mega-city/docs/adr/0080-checkpoint-de-version.md), lignes 87-88.
- Prérequis : committer la capture du 11 novembre, seul dossier de preuves des décisions. Geste hors
  de cette fiche.
- Fiches voisines :
  [Un seul vocabulaire pour les boards](done/20261031160441559_un-seul-vocabulaire-boards.md) (a
  retiré « Moniteur », « cockpit », « dashboard ») ;
  [Aligner le vocabulaire des commandes sur Scrum](done/20260903085150321_nommage-commandes-scrum-safe.md),
  absorbée par la section Nommage de [l'ADR-0054](../products/mega-city/docs/adr/0054-cloture-sprint-vs-archive-session.md) ;
  [La méthode émet ses étapes fines](20261110191135802_methode-emet-ses-etapes-fines.md), qui publiera les noms de `method/`.
- À trancher au grooming : les noms des clés du contrat (`termes`, `terme`, `en_clair`, `ou_il_joue`,
  `verdict`, `scrum`) et la forme du fichier (YAML ou Markdown).
- Risques : deux glossaires qui divergent si le pointeur est oublié ou si une fiche recopie une
  définition (le critère « pointeur » et la mesure de suivi le gardent) ; le glossaire mélange mots
  d'écran et jargon à « supprimer » (le champ verdict laisse l'écran filtrer « garder », « traduire »).
