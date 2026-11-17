---
id: "20261114131614982"
title: "Le graphe de la méthode en un contrat compilé : nœuds, arêtes typées, trous nommés"
type: feature
priority: P2
product: mega-city
milestone: board
version:
labels: [carte, contrat]
status: idea
blocked:
pr:
evidence: none # un contrat compilé, aucun écran modifié
created: 2026-11-14
---

# 20261114131614982 — Le graphe de la méthode en un contrat compilé : nœuds, arêtes typées, trous nommés

**En clair.** Les pages de l'annuaire veulent dire, pour chaque compétence ou agent, qui le convoque,
qui le compose, quel script il lance, et où la méthode a des trous. La méthode calcule déjà tout ça,
mais le sort par deux chemins différents, sans format garanti. On compile le graphe une seule fois en
un bloc versionné ; la commande de contrôle le publie, l'écran le lit tel quel.

**Si tu arrives frais.** Le graphe de la méthode relie ses briques (règles, agents, compétences, paquets,
profils, scripts) par des arêtes typées, lues « source verbe cible » : X *compose* Y, X *convoque* Y,
X *applique* Y, X *est vérifié par* Y, X *utilise* Y. Une compétence est ce que le code appelle encore
« skill ». Un contrat JSON est une sortie `--json` décrite par un schéma, versionnée, livrée avec un
exemple. Mission control, l'écran de cop1, ne lit que ces contrats (ADR-086).

## Contexte / Problème

- Ce que l'écran attend. La maquette du 11 novembre met sur chaque page d'objet un schéma « Sa place dans la
  méthode » (profil → paquets → règles → compétences → agents → scripts → commandes), les colonnes « convoqué par »
  et « citée par », et un bloc Santé pour le mainteneur : agents que personne ne convoque, compétences sans rôles,
  liens absents, recettes hors graphe, règles sans effet, dette de la loi. Elle citait un `ezk graph show` : le
  panel dit de ne jamais le citer et de promouvoir `graph check --json`.
- Ce que le code publie aujourd'hui (vérifié le 14 novembre) :
  - Pas de verbe `graph show`. Le manifeste liste `graph compile`, `check`, `query`, `project` et
    `composes` (`products/mega-city/ezk-manifest.yml:208-227`).
  - `ezk graph check --json` imprime `{nodeCount, edgeCount, broken, orphans, edges[], pathRefs}`
    (`bin/ezk-graph.ts:34-37`) : 317 arêtes avec `link` et `verb`, 0 lien cassé, 0 lien par chemin non déclaré,
    orphelins 19 règles, 3 compétences, 5 profils, 8 outils. `nodes[]` manque ; seuls les comptes sortent (dont 113 outils).
  - `ezk graph compile` écrit `nodes[]` et `edges[]` dans `.ezk/graph.compiled.json`, hors git
    (`bin/graph-compile.ts:22-30`, ADR-0040 D5), jamais sur la sortie standard.
  - La carte compile un second bloc : adjacence par nœud, fichier source, étage, orphelins, provenance
    prouvée ou déduite (`src/core/map-data.ts:153-157, 237-270, 381-384`). Mission control le reçoit par
    `ezk board maps --file methode-mega-city carte-interactive.data.js` en `window.EZK = {…}`, sans
    `schema_version` (`map-data.ts:414`). Le graphe sort deux fois ; aucune sortie n'est versionnée.
  - `law show --json` publie sous contrat les arêtes applique et est-vérifié-par, et les comptes
    `rangee` (50) et `orpheline` (19) : les 69 règles sans effet (`contracts/law-show/v1/schema.json:85-96`).
  - Les sortes de nœuds sont fermées : rule, agent, skill, bundle, profile, tool (`src/core/graph.ts:27-30`).
    Les verbes aussi : compose, convoque, applique, est-verifie-par, utilise (`graph.ts:72-75`, test `graph-vocabulary`).
  - Les commandes du manifeste ne sont pas des nœuds. Le lien script → commande vit dans `Tool.commands`
    (`src/core/tools.ts:21-30`, `src/loaders/tools.ts:105-111`), jamais en arête ; le verbe `lance` n'existe
    pas. « Citée par » n'est pas calculé : compétence → script (`uses`) et script → commande (manifeste) existent.
  - La recette n'est pas un nœud : son `composes:` vit dans le front-matter des 16 recettes de `recipes/` (racine de
    vectorz, hors `products/mega-city`) ; le contrat `recipes` publie `source` et `dir`, pas `composes` (`contracts/recipes/v1/schema.json:28-43`).
  - Aucun trou n'est nommé. Trois compétences ont des `roles:` (ezk-ezk, ezk-product-build, ezk-sprint), 23 non ;
    ezk-chef et ezk-archive n'ont aucune arête `convoque` entrante. Ça se lit par filtre sur la carte, sans nom.
  - `law-debt.yml` (20 règles agent-check non citées, mesure du 2026-10-01, `law-debt.yml:12-33`) n'est lu que par un test, jamais publié.
- Ce qui manque : un contrat, une source unique, les nœuds commande et recette, le verbe `lance`, « citée par », les trous nommés, la dette publiée.

## Proposition

- **Décision 3 du PO du 14 novembre, à confirmer par le panel adverse avant d'être écrite en ADR**
  (fiche [Amendements d'ADR du 12 novembre](done/20261114131614058_amendements-adr-du-12-novembre.md)) : les liens se
  déclarent dans le front-matter des objets de process ; la méthode les compile en UN bloc typé (adjacence, étage,
  orphelins, provenance) ; ce bloc compilé EST le contrat publié. `ezk graph check` le lit ; il n'est pas un deuxième
  canal. Cohérent avec la décision 2 du même jour : les objets se déclarent dans leur front-matter, la méthode extrait,
  mission control consomme (ADR-086).
- Un contrat `contracts/graph-check/v1/` : schéma et exemple générés, test de conformité sur la sortie réelle. Patron :
  `bin/law-contract.ts` et la recette
  [Publier les données d'un outil par un contrat JSON versionné](../recipes/publier-un-contrat-json-versionne.md).
  Le panel l'appelait « graph » ; la fiche prend le nom de la commande, comme `board-show` ; le PO confirme.
  Contenu : `nodes[]` (kind, id, fichier, etage, famille) ; `edges[]` (from, fromKind, link, verb, to, toKind) ;
  `broken[]`, `orphans[]`, `pathRefs`, `provenance` ; `sante` : `skillsSansRoles[]`, `agentsJamaisConvoques[]`,
  `liensAbsents[]` (les `pathRefs.undeclared`), `recettesHorsGraphe[]`, et un renvoi aux comptes de `law show` (règles sans effet).
- Une seule source. `ezk graph check --json` imprime ce bloc. `ezk board maps --file methode-mega-city …` enveloppe le même
  bloc dans `window.EZK`. `buildMapData` ne re-dérive plus les liens en reparcourant le catalogue, ce que `src/core/__tests__/map-data-graph-parity.test.ts` constate aujourd'hui.
- Le vocabulaire fermé s'étend : sortes `command` (les 74 commandes du manifeste) et `recipe`, verbe
  `lance` (commande → script). C'est une décision de conception (`graph.ts:72-73`) : un ADR court ou un
  amendement de l'ADR-0040 D1 et de l'ADR-0058, écrit avant le build ; `graph-vocabulary` fige le jeu.
- « Citée par » : l'arête compétence → commande se déduit d'abord par jointure, `uses` × manifeste (les 74
  commandes lancent 64 scripts distincts). L'arête par mention `ezk <domaine> <verbe>` dans la doc d'une
  compétence est l'ajout, calculée comme `utilise` l'est déjà (ADR-0058).
- La recette devient un nœud `recipe` : ses `composes:` deviennent des arêtes compose ; une recette que rien ne cite
  sort dans `orphans`. Ça reprend le point 8 de l'ADR-0040, encore ouvert (« la frontière “les recettes consomment le
  modèle” », « liens de recette = des ids du graphe »). Le catalogue (`loadCatalog`) ne lit pas `recipes/` aujourd'hui ;
  `bin/ezk-recipes.ts:26-30` le lit depuis la racine de la méthode. L'ADR court fixe cette racine.
- La dette de la loi sort dans `law show --json` : la liste `uncited` et sa date de mesure. Pas dans le graphe, c'est une donnée
  de la loi. Un champ qui s'ajoute ne change pas `schema_version` (règle de la recette) : schéma et exemple sont regénérés par `pnpm law:contract --write`.
- Hors périmètre : les écrans, fiches [Mission control range son menu par portée](20261114131616818_mission-control-menu-par-portee-et-vocabulaire.md)
  et [Mission control montre une recette](20261114131616451_mission-control-montre-une-recette.md) ; le corps d'une recette, fiche [`ezk recipes show <id> --json`](20261114131616266_ezk-recipes-show-json-corps-de-recette.md).

## Critères d'acceptation

- [ ] Le payload de la carte servi par `ezk board maps --file methode-mega-city …` porte ce même bloc,
  à l'octet près : plus aucune adjacence recalculée à côté.
- [ ] Les 16 recettes sont des nœuds `recipe`, leurs `composes:` des arêtes compose ; une recette que
  rien ne cite figure dans `orphans`.
- [ ] Le bloc `sante` nomme `skillsSansRoles[]`, `agentsJamaisConvoques[]`, `liensAbsents[]`,
  `recettesHorsGraphe[]` et renvoie aux comptes de `law show` pour les règles sans effet. À la première
  exécution : 23 compétences sans rôles, ezk-chef et ezk-archive jamais convoqués, 0 lien absent, 69 règles sans effet.
- [ ] `law show --json` publie la dette de la loi (`uncited`, date de mesure) ; le schéma et l'exemple
  de `law-show` la décrivent, `schema_version` inchangé.

*Trois critères (le contrat, les commandes comme briques, le lien compétence → commande) sont passés le 2026-11-17 dans la fiche [La méthode publie son graphe en contrat, commandes comprises](20261117114544666_graphe-publie-en-contrat-commandes-comprises.md).*

## Comment vérifier

```bash
ROOT="$(git rev-parse --show-toplevel)"
ezk --root "$ROOT" graph check --json | jq '{v: .schema_version, nodes: (.nodes|length), edges: (.edges|length), kinds: ([.nodes[].kind]|unique), verbs: ([.edges[].verb]|unique)}'
ezk --root "$ROOT" graph check --json | jq '.sante'
ezk --root "$ROOT" graph check --json | jq -c '[.edges[] | select(.verb=="lance")][:3]'
ezk --root "$ROOT" law show --json | jq '{comptes, dette}'
pnpm --dir products/mega-city graph:contract   # à créer sur le patron de law:contract : code 1 si le schéma a dérivé
pnpm --dir products/mega-city test -- src/__tests__/graph.test.ts src/__tests__/graph-vocabulary.test.ts src/__tests__/compiled-graph.test.ts src/__tests__/map-data.test.ts src/core/__tests__/map-data-graph-parity.test.ts
```

- Source unique : `ezk board maps --file methode-mega-city carte-interactive.data.js` contient le JSON de `graph check --json` ; comparer les deux après avoir retiré l'enveloppe `window.EZK = …;`.
- Trous nommés : un test par trou, sur un catalogue construit en mémoire comme dans `src/__tests__/graph.test.ts`, qui le fait apparaître puis disparaître. Aucun écran modifié : pas de preuve avant/après.

## Glossaire

- `nœud`, `arête` — une brique de la méthode ; un lien typé entre deux briques, lu « source verbe cible ».
- `vocabulaire fermé` — la liste des sortes de nœuds et des verbes ; en ajouter un est une décision de conception (ADR-0040 D1).
- `orphelin` — un nœud que rien ne référence.
- `provenance` — pour chaque brique et chaque lien : prouvé (un fichier le déclare) ou déduit.
- `contrat JSON` — un format `--json` décrit par un schéma, versionné, livré avec un exemple (ADR-086).

## Notes / décisions

- Origine : la [carte des écarts du 14 novembre](../docs/maquettes/2026-11-14-carte-des-ecarts-maquette-code-backlog.md),
  écarts C2 et C3 ; le panel du 11 novembre, § 4 « Santé » et § 6 ([capture](../docs/captures/2026-11-11-panel-loi-projet-annuaire-maquette.md), pas encore suivie par git).
- Décision 3 du PO du 14 novembre : écrite dans la proposition ; à confirmer par le panel adverse, puis en ADR
  par la fiche [Amendements d'ADR du 12 novembre](done/20261114131614058_amendements-adr-du-12-novembre.md), dont cette fiche dépend.
- Laissé au PO : la portée de « compétence sans agents déclarés » (23 compétences sur 26 sans `roles:`, dont ezk-retro qui
  convoque en prose) ; le sens de `liensAbsents[]` : la maquette donne « ezk-archive → agent », une convocation en prose
  sans `roles:`, que `pathRefs.undeclared` ne voit pas (0 aujourd'hui) ; la racine des recettes ; la découpe en deux sprints
  si la fiche déborde : (a) le contrat tel quel (nœuds, arêtes, trous, provenance, source unique), (b) `command`, `recipe`, `lance`, « citée par », `sante` complet.
- ADR : [ADR-0040](../products/mega-city/docs/adr/0040-modele-fichiers-ezk-compile-schema-valide.md) (D1 vocabulaire
  fermé, D5 artefact non versionné, point 8 recettes) ; [ADR-0058](../products/mega-city/docs/adr/0058-les-outils-entrent-dans-le-graphe.md)
  (outils, verbe utilise) ; [ADR-086](../docs/adr/ADR-086-la-methode-seul-lecteur-des-fiches-contrat-json.md).
- Déjà livré, en partie : [Compiler la méthode en un seul graphe](done/20260821204737357_cabler-la-methode-modele-compile.md) (#265) ;
  [Montrer sur la carte les scripts et commandes](done/20260917123943914_outils-dans-la-carte-methode.md) (#293) ;
  [La méthode publie sa loi en JSON](done/20261101215342537_ezk-law-show-portee-des-regles.md) (applique, est-vérifié-par, comptes) ;
  [Mission control montre les cartes de la méthode](done/20261102123552184_mission-control-montre-les-cartes-de-la-methode.md) (le canal actuel) ;
  [Chaque élément de la carte montre son fichier](done/20260821163346493_carte-provenance-prouvee.md) (le champ `source`) ;
  [Déployer vraiment les règles chez les agents](done/20260903134909124_loi-non-compilee-chez-l-agent.md) (`law-debt.yml`) ;
  [Mission control montre la loi](done/20260826222044335_carte-la-loi-graphe-visuel.md) (règles sans effet, déjà affichées).
- Voisines : [La méthode s'évalue elle-même](20260821163346503_methode-auto-evaluation-validite.md) (parkée, une note globale) ;
  [`ezk help --json`](done/20261114131613129_ezk-help-json-commandes-etage-famille.md) porte la carte d'identité, ce contrat les relations.
- Risques : un troisième canal du même graphe si la source unique n'est pas tenue ; le bloc Santé reste réservé au mainteneur
  de la méthode, jamais sur la page Loi d'un projet ; `law-show` change ici et dans
  [`ezk law show` sert chaque objet de la loi](20261114131615350_ezk-law-show-regle-paquet-profil.md) : deux ajouts au même schéma, regénérés dans l'ordre d'arrivée, sans montée de version.
