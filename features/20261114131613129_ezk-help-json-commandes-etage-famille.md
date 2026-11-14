---
id: "20261114131613129"
title: "`ezk help --json` publie les commandes avec leur étage et leur famille"
type: feature
priority: P1
product: mega-city
milestone: board
version:
labels: [contrat, carte]
status: ready
blocked:
pr:
evidence: none # une commande publiée, aucun écran modifié
created: 2026-11-14
---

# 20261114131613129 — `ezk help --json` publie les commandes avec leur étage et leur famille

**En clair.** Mission control veut afficher l'annuaire de la méthode : chaque commande, chaque
compétence, chaque agent, avec une ligne en clair et sa place dans la méthode. Aujourd'hui la méthode
dit les commandes en texte pour un humain, et glisse la carte d'identité des compétences et des agents
dans les données de la carte, sans format garanti. On ajoute à `ezk help` une sortie lisible par un
programme, versionnée, où chaque commande porte son étage ; l'écran l'affiche sans relire un seul
fichier de la méthode.

**Si tu arrives frais.** La méthode range ses briques sur trois étages : méthode (le cœur Scrum),
modules (par famille : hôte LLM, GitHub, observabilité, techno, overlay) et librairie (la fabrique de
la méthode). Une compétence est ce que le code appelle encore « skill ». Un contrat JSON est une sortie
`--json` décrite par un schéma, versionnée, livrée avec un exemple. Mission control est l'écran de
cop1 : il ne lit que ces contrats, jamais les fichiers (ADR-086).

## Contexte / Problème

- Ce que l'écran attend. La maquette du 11 novembre a un Annuaire de la méthode. Onglet Commandes :
  domaine, verbe, ce qu'elle fait, écrit le projet, script lancé, citée par. Onglet des compétences :
  description, sous-commandes, fichier, étage. Pages Agent : description, fichier, modèle et effort par
  défaut. La carte des écarts demande en plus un étage et une famille par commande (écart C5). Le panel
  du 11 novembre nomme cette publication « la moins chère et la première à faire ». Mission control n'a
  pas le droit de lire `ezk-manifest.yml` ni les `SKILL.md` (ADR-086).
- Ce que le code publie aujourd'hui (vérifié le 14 novembre) :
  - `ezk help` existe en texte seul. `ezk help --json` est refusé, code 2 : « --json n'est ni un
    domaine ni un skill » (`products/mega-city/bin/ezk.ts:67-83`).
  - La matière est déjà lue. Le manifeste `products/mega-city/ezk-manifest.yml` compte 74 commandes
    (67 avec verbe, 7 où le domaine est la commande, 0 dépréciée). Chaque entrée porte domain, verb,
    run, summary, root, project, writes, deprecated (`src/core/ezk-cli.ts:24-51`). `ezk help` texte
    affiche ces 74 commandes et les 26 commandes de chat.
  - Les 26 compétences sont lues par `listSkills` et `skillDetail` : nom, argument-hint, description
    (`bin/ezk-help.ts:67-98`). Les 8 agents sont lus par `readAgent` : description, competences,
    model, effort (`src/loaders/catalog.ts:174-189`).
  - La carte d'identité des compétences et des agents (description, usage, fichier source, étage,
    famille, modèle, effort) est déjà compilée par `buildMapData` (`src/core/map-data.ts:237-270`).
    Mission control la reçoit par `ezk board maps --file methode-mega-city carte-interactive.data.js`,
    sous la forme `window.EZK = {…}`, sans `schema_version` (`map-data.ts:414`).
  - L'étage existe pour les compétences et les agents : `taxonomie.yml:22-64` est le fichier unique
    de classification (ADR-0039) ; `validateTaxonomie` exige la complétude (`src/core/taxonomie.ts:80-86`).
    Il n'existe pas pour les commandes : ni champ, ni section, ni validation.
  - `law show --json` ne donne par compétence ou agent que id, type, litSesRegles, regles
    (`contracts/law-show/v1/schema.json:205-253`) : ni description, ni sous-commandes, ni fichier.
  - `products/mega-city/contracts/` compte huit contrats (backlog-show, board-maps, board-process,
    board-show, config-show, law-object, law-show, recipes). Aucun pour l'aide ou le catalogue.
- Ce qui manque : une sortie JSON versionnée de `ezk help` ; les 74 commandes avec leur résumé, leur
  script, leur portée et « écrit le projet » ; un étage et une famille par commande.
- Un désaccord de vocabulaire. L'écart C5 relève que la maquette dit « méthode / module / hôte ».
  `taxonomie.yml` dit methode / modules (famille hote-llm, github, observabilite, techno, overlay) /
  librairie : « hôte » y est une famille, pas un étage. Le panel du 11 novembre écrit déjà, pour
  l'onglet des compétences, « méthode / module et sa famille / librairie ».

## Proposition

- Le routeur accepte `--json` comme option de `help`, sans le prendre pour un sujet
  (`bin/ezk.ts:67-83`). `ezk help` texte reste inchangé et lit la même source.
- Un contrat `contracts/help/v1/` : schéma et exemple générés, un test de conformité sur la sortie
  réelle. Patron : `bin/law-contract.ts` et la recette
  [Publier les données d'un outil par un contrat JSON versionné](../recipes/publier-un-contrat-json-versionne.md).
  Nom : `help`, comme chaque contrat porte le nom de sa commande (`board-show`, `recipes`). Le panel
  laissait ouvert le canal de la carte d'identité : `help --json`, `objets[]` de `law show`, ou un
  `ezk catalogue show --json` ; la fiche tranche `help --json`, le PO confirme.
- `commandes[]` : une entrée par commande du manifeste. Champs : domaine, verbe, enClair (summary),
  script (run), racine (root), projet (project), ecritLeProjet (writes), deprecie, etage, famille.
- `skills[]` : id, description, sousCommandes (l'argument-hint découpé), fichier
  (`products/mega-city/skills/<id>/SKILL.md`), etage, famille. La source est le catalogue compilé que
  la carte sert déjà, pas une troisième lecture des `SKILL.md`.
- `agents[]` : id, description, fichier (`products/mega-city/agents/<id>.md`), etage, famille, modele,
  effort. Modèle et effort viennent du front-matter de l'agent, que le catalogue lit déjà. Le test
  `src/core/__tests__/model-config.test.ts` garantit qu'ils égalent les défauts `TIER_DEFAULTS` et
  `ROLE_TIER` de `src/core/model-config.ts:35-51` : publier l'un, c'est publier l'autre.
- Les relations (composes, roles, applies, competences) ne sont pas dans ce contrat. Elles vivent dans
  le contrat du graphe, fiche
  [Le graphe de la méthode en un contrat compilé](20261114131614982_graphe-de-la-methode-en-contrat-compile.md).
  Sinon la même arête sort deux fois.
- Étage des commandes : `taxonomie.yml` gagne une section `commandes`, rangée par domaine. Une ligne
  par domaine ; une commande peut dévier de son domaine. `validateTaxonomie` exige la complétude : une
  commande sans étage fait échouer la gate.
- Vocabulaire publié : celui de `taxonomie.yml` (methode, modules avec leur famille, librairie). La
  maquette renonce à « hôte » comme étage : « hôte » reste la famille `hote-llm`. Le PO confirme, ou
  amende le fichier et l'ADR-0039.
- Hors périmètre : le texte de `ezk help` ; un framework de commandes publié, fiche
  [CLI `ezk` complet et publié](20260903134908019_cli-ezk-complet-publie.md) (parkée) ; les écrans de
  mission control, fiche
  [Mission control range son menu par portée](20261114131616818_mission-control-menu-par-portee-et-vocabulaire.md).

## Critères d'acceptation

- [ ] `ezk help --json` sort le contrat `contracts/help/v1/` : `schema_version`, un schéma et un
  exemple générés, et la sortie réelle le respecte. `ezk help` texte est inchangé et lit la même source.
- [ ] `commandes[]` porte les 74 entrées du manifeste avec domaine, verbe, enClair, script, racine,
  projet, ecritLeProjet, deprecie. Son compte égale celui des commandes de terminal de `ezk help` texte.
- [ ] Chaque commande porte `etage` et, pour un module, `famille`, avec les valeurs de `taxonomie.yml`.
  Une commande du manifeste absente de la taxonomie fait échouer la validation.
- [ ] `skills[]` porte les 26 compétences (id, description, sousCommandes, fichier, etage, famille) et
  `agents[]` les 8 agents (id, description, fichier, etage, famille, modele, effort), avec les valeurs
  que la carte sert déjà.
- [ ] Aucune relation (composes, roles, applies, competences) ne figure dans ce contrat.
- [ ] Rien n'est codé en dur : une commande ajoutée au manifeste et rangée dans la taxonomie, ou une
  compétence ajoutée au dossier, apparaît dans la sortie sans toucher au code.

## Comment vérifier

```bash
ROOT="$(git rev-parse --show-toplevel)"
ezk --root "$ROOT" help --json | jq '{v: .schema_version, commandes: (.commandes|length), skills: (.skills|length), agents: (.agents|length)}'
ezk --root "$ROOT" help --json | jq -c '.commandes[] | select(.domaine=="graph") | {verbe, etage, famille, ecritLeProjet}'
ezk --root "$ROOT" help | awk '/^Commandes de terminal/{f=1;next} /^$/{if(f){exit}} f' | wc -l   # = .commandes|length
pnpm --dir products/mega-city help:contract   # à créer sur le patron de law:contract : code 1 si le schéma a dérivé
pnpm --dir products/mega-city test -- src/__tests__/ezk-cli.test.ts src/__tests__/ezk-manifest.test.ts src/__tests__/map-data.test.ts
```

- Test de conformité à écrire sur le modèle de `src/__tests__/law-show.test.ts` : schéma zod, exemple,
  sortie réelle, aucun champ en trop.
- Test de complétude sur un catalogue jouet (option `--skills-dir` vers un dossier temporaire, comme
  `bin/test-ezk-help.sh` le fait) : une commande non rangée fait échouer ; rangée, elle sort avec son étage.
- Aucun écran modifié : pas de preuve avant/après.

## Glossaire

- `étage` — l'un des trois rangs d'une brique de la méthode : methode, modules, librairie (ADR-0039).
- `famille` — le sous-rang d'un module : hote-llm, github, observabilite, techno, overlay.
- `manifeste` — `ezk-manifest.yml`, le fichier qui dit quelle commande `ezk` lance quel script.
- `contrat JSON` — un format `--json` décrit par un schéma, versionné, livré avec un exemple (ADR-086).

## Notes / décisions

- Origine : la [carte des écarts du 14 novembre](../docs/maquettes/2026-11-14-carte-des-ecarts-maquette-code-backlog.md),
  écarts C4 et C5 ; le panel du 11 novembre, § 4 « L'Annuaire » et § 6 « Ce que la méthode doit publier »
  ([capture](../docs/captures/2026-11-11-panel-loi-projet-annuaire-maquette.md), pas encore suivie par git).
- Décisions prises par la fiche, à confirmer par le PO : le nom `help` du contrat ; le rangement par
  domaine avec dérogation par commande ; modèle et effort lus dans le front-matter de l'agent ; le
  vocabulaire de `taxonomie.yml`, « hôte » restant une famille.
- Dépend de : aucune fiche du lot. Voisine du lot :
  [Le graphe de la méthode en un contrat compilé](20261114131614982_graphe-de-la-methode-en-contrat-compile.md)
  porte les relations ; cette fiche porte la carte d'identité. Jamais les deux.
- Déjà livré, en partie : [/ezk-help, index généré](done/20260816131704335_ezk-help-index-commandes-genere.md) (#151, le texte des compétences) ;
  [Une seule commande `ezk`](done/20260903134906920_cli-ezk-point-d-entree-unique.md) (#281, le manifeste et l'aide texte) ;
  [Mission control montre les cartes de la méthode](done/20261102123552184_mission-control-montre-les-cartes-de-la-methode.md) (la carte d'identité, servie sans contrat) ;
  [Refonte trois étages, le reliquat](done/20260824061247344_refonte-trois-etages-reliquat.md) (superseded ; la taxonomie des compétences et des agents, pas celle des commandes).
- Voisines non couvrantes : [CLI `ezk` complet et publié](20260903134908019_cli-ezk-complet-publie.md) (parkée, autre intention) ;
  [Brainstorm : la CLI de la méthode est-elle un DSL cohérent](20261010153046143_brainstorm-dsl-cli-methode.md) (parkée, attend un panel sur la surface des commandes).
- Risques : une troisième lecture des `SKILL.md` (déjà `bin/ezk-help.ts` et `src/loaders/catalog.ts`) ;
  la carte et `help --json` qui divergent si la source n'est pas le même catalogue compilé ; un
  amendement de l'ADR-0039 si le PO veut « hôte » comme étage.

## Journal

- 2026-11-14 — créée depuis la carte des écarts (lot de 27 fiches validé par le PO le 14 novembre).
- 2026-11-14 (soir) — groomée en autonomie (run du soir, mandat du PO jusqu'à minuit) : dépendances constatées
  (`ezk-manifest.yml` et `taxonomie.yml` dans le dépôt, aucune dépendance hors dépôt), six critères prouvables
  par commande, une seule surface. Passée « prête » sur tampon `ezk-pm` (mode auto) ; lot 2 du run avec
  « La méthode émet ses étapes fines » : la méthode publie son process et son annuaire.
