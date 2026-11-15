---
id: "20261110191135802"
title: La méthode émet ses étapes fines, validées par le compilateur (données du schéma Process)
type: feature
priority: P1
product: mega-city
milestone: board
version:
labels: [fabrique, theme:mission-control]
status: shipped
blocked:
pr: "local (510276c0)"
evidence: none # aucun écran modifié : une déclaration, une commande, un contrat, une route
created: 2026-11-10
---

# 20261110191135802 — La méthode émet ses étapes fines

**En clair.** Mission control doit montrer les étapes fines de chaque skill, mais la méthode ne les
publie pas. Aujourd'hui elles sont recopiées à la main dans la page, et elles ont déjà dérivé. On les
déclare dans la méthode, le compilateur les vérifie, et une commande les publie pour que le daemon
les serve à l'écran.

**Si tu arrives frais.** Un *skill* est une commande de la méthode (`ezk-backlog`, `ezk-sprint`…).
Une *étape fine* est un pas à l'intérieur d'un skill : pour le sprint, « scénarios », « code »,
« gate ». *Mission control* est l'écran web de pilotage, dans le produit cop1. Il ne lit jamais les
fichiers de la méthode : il recopie ce que la méthode publie par une commande `ezk … --json`, servie
par un *daemon* (le serveur local de cop1). C'est la règle de
l'[ADR-086](../../docs/adr/ADR-086-la-methode-seul-lecteur-des-fiches-contrat-json.md).

## Contexte / Problème

**Le besoin du PO (2026-11-11).** « Visualiser le process, sa configuration et l'état du projet dans
le process, pour voir et valider ce qu'il se passe de façon fiable. »

**Ce qui manque.** L'écran ne peut montrer que ce que la méthode publie. Elle publie déjà où en est
chaque fiche (`ezk board process --json`) et les réglages du projet (`ezk config show --json`). Elle
ne publie pas les étapes d'un skill.

**La dérive est déjà là.** Constat du 2026-11-11 : les étapes du sprint existent en trois listes, et
aucune ne dit la même chose.

| Où | Ce qui est écrit |
|---|---|
| le skill `ezk-sprint` (la vérité) | 11 pas, numérotés de 0 à 10 |
| la page de mission control (`ProcessView.tsx`, constante `SPRINT_STEPS`) | 5 mots : BDD, TDD, gate, revue, merge |
| la maquette validée le 2026-11-08 | 8 étapes : cadrage → archi → scénarios → code → gate → E2E → revue adverse → intégration |

Rien ne casse quand un skill change un pas. L'écran continue d'afficher l'ancienne liste, fausse et
sans alerte. Un schéma qu'on ne peut pas croire ne sert pas à valider.

**Ce que ça bloque.** La fiche « Schéma Process zoomable » attend ces données. Sans elles, ses
niveaux « étapes de chaque skill » et « détail d'une étape » n'ont rien à afficher.

## Proposition

Quatre gestes, dans cet ordre.

```
 déclarer            vérifier                 publier                    servir
 un fichier    ──▶   le compilateur     ──▶   ezk process show    ──▶    le daemon de cop1     ──▶  l'écran
 de la méthode       refuse le faux           --json (contrat)           /api/process/<projet>      (autre fiche)
```

1. **Déclarer.** Un fichier de la méthode, rangé à côté de `method/ceremonies.yml`, liste pour chaque
   skill ses étapes dans l'ordre. Il liste aussi les liens entre skills, dont la boucle
   rétro → backlog. Point de départ, les quatre skills de la maquette :
   - `ezk-backlog` : capturer → groomer → prête → tirer un lot
   - `ezk-sprint` : cadrage → archi → scénarios → code → gate → E2E → revue adverse → intégration
   - `ezk-retro` : cadrer → round-robin → juge → rangement PO
   - `ezk-archive` : portier → clôture
2. **Vérifier.** Chaque étape nomme qui la réalise, avec la grammaire déjà en place pour les
   cérémonies : un skill, une sous-commande, un agent ou l'humain. Le compilateur refuse une
   référence qui n'existe pas. Il refuse aussi une étape qu'on ne retrouve plus dans le texte de son
   skill. La régénération échoue, la gate rougit.
3. **Publier.** Une commande `ezk process show --json` sort ces étapes dans un format versionné
   (`contracts/process-show/v1/`), comme les huit contrats déjà publiés. Pour une étape gouvernée
   par un réglage du projet, la sortie donne la clé du réglage et sa valeur pour le projet lu.
4. **Servir.** Le daemon de cop1 expose cette sortie sur `GET /api/process/<projet>`, à côté de
   `/api/maps` et `/api/recipes`, avec le même confinement.

Analogie : `ceremonies.yml` est la carte des quartiers. Cette fiche ajoute le plan de rue de chaque
quartier, avec le même cadastre qui refuse une rue inventée.

**Ce que la sortie doit porter.** Le schéma zoomable a trois niveaux. La sortie couvre les trois, pour
que l'écran n'ait aucune autre source à lire.

| Niveau du schéma | Ce que `ezk process show --json` donne |
|---|---|
| vue d'ensemble | les skills dans l'ordre, et les liens entre eux |
| étapes d'un skill | pour chaque skill, ses étapes dans l'ordre |
| détail d'une étape | qui la réalise, et le réglage qui la gouverne avec sa valeur pour ce projet |

**Choix de structure** (avis d'architecte tenu au grooming, à confirmer par `ezk-architect` au
sprint) :

- **Un fichier dans `method/`, pas dans chaque skill.** Écrire les étapes dans l'en-tête de chaque
  skill changerait le format des skills. C'est le chantier de la fiche sur les étapes configurables,
  qui attend un panel. Un fichier central reprend le patron de `ceremonies.yml`, déjà prouvé.
- **Un fichier à part, pas une extension de `ceremonies.yml`.** `ceremonies.yml` répond à « le Scrum
  Guide est-il couvert ? ». Ce fichier répond à « quels sont les pas de chaque skill ? ». Deux
  questions, deux fichiers, la même vérification des références.
- **Le canal est une commande et son contrat, pas `window.EZK`.** La carte interactive et
  `window.EZK` sont l'ancienne page de la méthode, retirée par l'ADR-086. Mission control est le
  seul écran.
- **La déclaration vaut pour la méthode, la sortie vaut pour un projet.** Les étapes sont les mêmes
  partout. Les valeurs des réglages changent d'un projet à l'autre : la commande lit le projet de
  `--root`.

## Critères d'acceptation

- [x] **Déclarées.** Un fichier de la méthode déclare, pour `ezk-backlog`, `ezk-sprint`, `ezk-retro`
      et `ezk-archive`, leurs étapes dans l'ordre et les liens entre skills, dont la boucle
      rétro → backlog. `ezk process show` les affiche en clair.
- [x] **Vérifiées.** Une étape qui cite un skill, une sous-commande ou un agent inexistant fait
      échouer la validation. Un test le prouve, et `pnpm gate` rougit.
- [x] **Ancrées.** Chaque étape déclarée se retrouve dans le texte de son skill. Renommer ou retirer
      l'étape dans le skill sans toucher la déclaration fait échouer la gate. Un test le prouve.
- [x] **Publiées.** `ezk process show --json`, avec ou sans `--root <projet>`, sort un format
      versionné. Son schéma et son exemple sont générés dans `contracts/process-show/v1/`. Un test
      échoue si la sortie réelle ne respecte plus le schéma. Ajouter une étape au fichier la fait
      apparaître dans la sortie, sans toucher au code.
- [x] **Réglages.** Une étape gouvernée par un réglage porte sa clé et sa valeur pour le projet lu
      (exemple : revue adverse, `review.adverse`, `run`). Une clé que `ezk config show` ne connaît
      pas fait échouer la validation.
- [x] **Servies.** Le daemon de cop1 répond sur `GET /api/process/<projet>` avec cette sortie. Un
      projet inconnu est refusé, comme sur `/api/maps` et `/api/recipes`. Un test du serveur HTTP le
      prouve.

## Hors périmètre (Suite)

- **L'écran.** Afficher ces étapes, et retirer la constante `SPRINT_STEPS` de la page, revient à la
  fiche « Schéma Process zoomable ». Ici, aucune vue ne change.
- **Reconfigurer les étapes.** Activer, couper ou réordonner une étape reste dans
  [Rendre les étapes d'un skill configurables](../20260830110131228_schema-etapes-skill-configurables.md).
  Ici on montre un réglage, on ne le change pas.
- **Poser une fiche sur une étape fine.** Dire « cette fiche est à l'étape gate » demande que le run
  publie son étape courante. Aucune source ne le fait aujourd'hui. C'est une fiche à part.
- **Les étapes dans le graphe compilé.** Les faire entrer comme nœuds dans `.ezk/graph.compiled.json`
  touche le modèle du graphe. À voir avec la fiche sur les étapes configurables.
- **L'ancienne carte interactive.** Elle n'est ni alimentée ni modifiée.

## Comment vérifier

Depuis la racine du dépôt. Les noms de champs JSON sont indicatifs : le contrat les fixe.

```bash
# 1. Tous les garde-fous d'un coup : déclaration valide, étapes ancrées, contrat à jour.
pnpm --dir products/mega-city gate

# 2. La méthode publie ses étapes pour ce projet : en clair, puis en JSON.
ezk process show
ezk process show --json | jq '.skills[] | {skill: .id, etapes: [.etapes[].titre]}'

# 3. Le garde-fou mord. Dans le fichier de déclaration, remplace « agent:ezk-qa » par
#    « agent:fantome », relance la gate, constate le rouge, puis annule la modification.
pnpm --dir products/mega-city gate

# 4. Le daemon sert la même sortie et refuse un projet inconnu. Depuis la racine : la config
#    vitest de cop1 vit à la racine du dépôt, lancée depuis le paquet elle ne trouve aucun test.
pnpm exec vitest run products/cop1/packages/app/src/features/daemon products/cop1/packages/app/src/features/board
```

Preuve avant / après : sans objet, aucun écran ne change (`evidence: none`).

## Glossaire

- `contrat` — la description versionnée d'une sortie `--json` : un schéma et un exemple, rangés dans
  `products/mega-city/contracts/<nom>/v1/`. Mission control s'y fie.
- `gate` — la validation locale complète de la méthode : `pnpm gate` depuis `products/mega-city`.
- `confinement` — le daemon ne sert que les projets qu'il connaît ; toute autre demande est refusée.
- `réglage` — une ligne de la config d'un projet, lue par `ezk config show` (exemple : `github.pr`).

## Notes / décisions

**Fiches liées.**

- **Elle débloque** la fiche
  [Schéma Process zoomable](../20261110185357446_schema-process-zoomable-semantic-zoom.md)
  (`20261110185357446`, produit cop1), arrivée sur `main` le 15 nov. Les deux vont de pair :
  celle-ci donne les données, l'autre l'écran.
- **Elle prend la suite** de
  [La vue Process montre le workflow en schéma](20261104090517801_process-montre-le-workflow-en-schema.md),
  livrée. Sa note de clôture nommait le trou : les étapes du sprint y sont « un libellé fixe de la
  page ».
- **Elle est la première marche** de
  [Rendre les étapes d'un skill configurables](../20260830110131228_schema-etapes-skill-configurables.md),
  sans son mécanisme. Cette fiche-là demande un panel `ezk-architect` + `ezk-pm` avant tout build.
  Ici le panel n'est pas rejoué : la maquette du 2026-11-08 a déjà tranché « déclaration, pas
  extraction » et nommé la commande. L'étape Archi du sprint confirme les choix de structure.

**Écarts avec la demande initiale (2026-11-10), et pourquoi.**

- La demande citait « la vue méthode (`views:regen` / `window.EZK`) ». Ce canal est l'ancienne page
  de la méthode, retirée par l'ADR-086. Il est remplacé par `ezk process show --json`, que la liste
  « à publier » de la maquette nomme déjà.
- La première version de cette fiche demandait que la vue Process lise les étapes. Ce critère part
  dans la fiche du schéma zoomable, qui remplace cette vue.

**Taille.** Six critères, le seuil. Trois surfaces si l'architecte ouvre un ADR : la commande, le
serveur, l'ADR. La fiche reste entière : la route du daemon recopie le patron de `/api/recipes` (un
handler, une source, un test), et la détacher créerait une fiche de quelques dizaines de lignes
entre deux fiches qui s'attendent.

**Ce que la fiche suppose — constaté le 2026-11-11.**

- La vérification des références existe et jette à la première erreur :
  `products/mega-city/src/core/ceremonies.ts`, fonction `validateMethod`.
- Huit contrats sont publiés sous `products/mega-city/contracts/`, dont `config-show` et
  `board-process`.
- Le daemon sert déjà deux lectures par projet sur le même patron :
  `products/cop1/packages/app/src/features/daemon/infrastructure/HttpServer.ts`, routes `/api/maps/`
  et `/api/recipes/`.
- Les réglages lus par `ezk config show` qui gouvernent une étape : `github.pr`, `github.ci`,
  `github.codex-review`, `integration`, `review.adverse`, `grooming.techniques`.
- Aucune dépendance hors du dépôt.

**À trancher au build.**

- Le sprint : la maquette montre 8 étapes, le skill en déroule 11. Défaut : les 8 de la maquette. La
  PR et le checkpoint sont candidats : la PR dépend du réglage `github.pr`, le checkpoint est le
  moment où le PO valide.
- Une cinquième boîte pour `ezk-product-build` : une version de la maquette la montre, la demande en
  cite quatre.
- La forme du contrat. La maquette relue le 2026-11-11 attend, pour le détail d'une étape :
  `skills[]{etapes[]{num, titre, enClair, joueePar, agents[], commandes[], regles[]}}` (transmis par
  la session « Plan et milestones », à relire sur la maquette). Défaut : viser cette forme, et y
  ajouter le réglage de l'étape et les liens entre skills. `regles[]` reste à trancher : lister les
  règles d'une étape demande de les vérifier contre le catalogue des règles, ce qu'aucun critère
  n'exige ici.
- Trois champs de plus, attendus par la maquette relue le 2026-11-14 pour chaque étape, à côté de
  `regles[]` : `momentEmis` (le moment du journal que l'étape émet, à vérifier contre
  `moments.yml`), `gateId` (le jalon que l'étape pose ; aucun catalogue de jalons n'existe, l'id
  reste libre) et `effetStatutFiche` (le statut de fiche que l'étape écrit, à vérifier contre les
  statuts de `src/core/fiche-schema.ts`). Défaut : si la v1 du contrat dépasse le sprint, ces
  champs partent dans une v2 ; le PO tranche la coupe. Même source : la page Process de la maquette
  attend aussi `ezk-release` comme cinquième compétence (l'étape « Versionner ») et le niveau de
  modèle de chaque agent comme donnée d'étape, à côté de `joueePar`. Aucun critère neuf ici : la
  fiche reste au seuil de six critères.

**Voisin à ne pas embarquer.** Le « dernier passage observé » d'une étape, c'est-à-dire ce qui s'est
vraiment passé, demande des moments par étape dans le journal. C'est le point G4 de l'ADR-084, qui
revient au PO. Même famille que « poser une fiche sur une étape fine » : hors de cette fiche.

**Défauts appliqués au build (2026-11-15).** Aucun arbitrage neuf : les défauts écrits plus haut,
rien d'autre.

- 2026-11-15 — défaut appliqué au build : le sprint déclare les 8 étapes de la maquette (cadrage,
  archi, scénarios, code, gate, E2E, revue adverse, intégration). L'intake, le report des cases, la
  PR et le checkpoint du skill ne sont pas déclarés. Les ajouter = quelques lignes de
  `method/etapes.yml`, sans code.
- 2026-11-15 — défaut appliqué au build : quatre skills (`ezk-backlog`, `ezk-sprint`, `ezk-retro`,
  `ezk-archive`). `ezk-release` (« Versionner ») et `ezk-product-build` restent hors périmètre.
- 2026-11-15 — défaut appliqué au build : la forme vise la maquette, `skills[]{etapes[]{num, titre,
  enClair, joueePar, agents[], commandes[], regles[]}}`. Ajouts : un `id` par étape, `reglages[]`
  (`{cle, valeur}`) et `liens[]` (`{de, vers, libelle}`). `joueePar` est la liste des références
  vérifiées ; `agents[]` et `commandes[]` en sont tirés, sans seconde déclaration.
- 2026-11-15 — défaut appliqué au build : `regles[]` est publié **vide**. Rattacher des règles à une
  étape demande de les vérifier contre le catalogue des règles, ce qu'aucun critère n'exige.
- 2026-11-15 — défaut appliqué au build : `momentEmis`, `gateId`, `effetStatutFiche` et le niveau de
  modèle des agents ne sont pas construits. Ils partent en v2 du contrat ; le PO tranche la coupe.
- 2026-11-15 — défaut appliqué au build : l'ancrage est un champ `ancre`, un passage du `SKILL.md`
  recopié mot pour mot (ex. « 3. **BDD** »). Le renommer dans le skill fait échouer la validation.
- 2026-11-15 — défaut appliqué au build : les réglages citables sont les six lignes de
  `ezk config show` (`github.pr`, `github.ci`, `github.codex-review`, `integration`,
  `review.adverse`, `grooming.techniques`). La valeur vient de la même résolution que
  `ezk config show --json`.
- 2026-11-15 — défaut appliqué au build : la route du daemon recopie le gestionnaire de
  `/api/recipes` (patron exact demandé). Les trois lectures par projet (loi, recettes, étapes)
  portent désormais le même bloc ; un helper commun est une piste de refactor, hors de cette fiche.

**Journal.**

- 2026-11-10 — créée, P2, sans milestone.
- 2026-11-11 — groomée. Priorité P2 → P1 : le PO demande de s'y attaquer « très rapidement ».
  Milestone `board`, celle des deux fiches liées. Techniques appliquées : mesurer le coût de ne rien
  faire, rendre chaque critère testable, couper au plus petit morceau utile, constater les
  dépendances, avis d'architecte (tenu par l'agent de grooming, sans appel à `ezk-architect`).
- 2026-11-11 — passée « prête » sur accord du PO. Porte tenue : problème daté, valeur, six critères
  prouvables avant la fusion, aucune dépendance hors du dépôt, taille justifiée.
- 2026-11-12 — le PO demande la fiche **en tête du plan**, section « Mission control lisible ». La
  ligne est posée dans `PLAN.md` sur la branche de la fiche, à la demande de la session « Plan et
  milestones » : la ligne voyage avec la fiche, et une seule arrivée sur `main` suffit. Tant que
  cette arrivée n'a pas eu lieu, aucun sprint ne peut tirer la fiche.
- 2026-11-14 — note ajoutée depuis la [carte des écarts maquette ↔ code ↔ backlog](../../docs/maquettes/2026-11-14-carte-des-ecarts-maquette-code-backlog.md) (écarts C1, E5
  et E7, volet process) : trois champs attendus par la maquette posés dans « À trancher au build »,
  sans critère neuf. La fiche reste prête et en tête du plan.
- **Source** : maquette Mission control validée le 2026-11-08 (vue Process, bloc « Le schéma »).
- 2026-11-15 — construite (sprint 8, lot 2) ; revue adverse `ezk-reviewer` GO, six critères prouvés, cases reportées telles
  quelles. Après rebasage sur `ezk help --json`, la gate a exigé de ranger le domaine `process` dans `taxonomie.yml`
  (une ligne, gate verte). Suivis non bloquants : triple bloc de route daemon à factoriser ; ancre recopiée mot pour mot.
