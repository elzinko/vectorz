# Préparer les prochaines milestones — plan (2026-10-23)

## En clair

Tu veux préparer le travail **par lot de fiches sur une même milestone**, et laisser le numéro de
version s'incrémenter tout seul. Bonne nouvelle : ça ne rouvre **pas** le gros chantier qu'un panel
a différé en octobre. Ça formalise la règle intérimaire déjà écrite dans le plan (« le numéro se
pose à la construction, dans l'ordre, jamais de saut »). Ce document propose **le modèle**, puis
**quatre milestones prêtes à enchaîner**, et te laisse **une décision** : adopter ce modèle.

**Fait le 2026-10-23, après ton « oui, j'adopte », en autonomie.** (1) L'ADR qui acte le modèle est
écrit ([ADR-083](../../products/mega-city/docs/adr/0083-version-etiquette-milestone-unite-de-preparation.md)).
(2) **Tout le pipeline actif est rangé par milestone** — `preparation`, `board`, `recettes`, `carte`,
plus `exploration-app`, `cockpit`, `qualite`, `observabilite` ; 9 fiches prêtes. (3) Les **2 fiches
recettes de muti sont rapatriées** côté vectorz. (4) Le **train de `PLAN.md` est réécrit par milestone**
(le tableau de versions devient un historique). Gate verte (backlog + liens + board). Rien n'est
committé : tu relis le diff. Détail en bas.

## Ce que tu as demandé, et ce que ça implique

Tu l'as dit en une phrase : on ne prépare plus par lot de version, mais par lot de fiches sur la
même milestone, pour enchaîner les milestones sans attendre un numéro.

Le point à lever d'emblée. En octobre, un panel a tranché que **basculer vers un vrai modèle
« milestone = unité séquencée + graphe de dépendances »** était prématuré. Il l'a mis derrière
quatre verrous. Voir [ADR-0081 — séquencement, basculement différé](../../products/mega-city/docs/adr/0081-sequencement-depends-signal-dag-differe.md).

Ta demande **ne touche pas** à ce chantier différé. Elle demande moins : **grouper et ordonner la
préparation par milestone**. Ça, l'ADR-0081 l'autorise déjà (c'est son « noyau »), et le plan actuel
le décrit déjà comme règle intérimaire. Donc rien à rouvrir, rien à sur-construire.

## Le modèle de préparation (léger, déjà permis)

Trois phrases, une image.

- **La milestone est l'unité de préparation.** Un lot de fiches qui forment un tout livrable et
  cohérent. On la groome en entier, puis on la construit.
- **La version est une étiquette.** Elle se pose à la construction, dans l'ordre, jamais de saut.
  Elle s'incrémente toute seule. Elle ne commande plus la préparation.
- **L'ordre vit dans le plan.** [`features/PLAN.md`](../../features/PLAN.md) curé à la main dit
  quelle milestone vient après quelle milestone. Le champ `milestone:` d'une fiche dit à quel lot
  elle appartient.

Image : la **milestone est le wagon** (on le charge, on vérifie qu'il est plein et solide), la
**version est le numéro peint sur le flanc** au moment où le wagon part. On ne garde plus un wagon à
quai parce que le wagon d'à côté porte un numéro plus petit — c'était exactement la douleur « v0.23
prête mais coincée derrière v0.18–v0.22 ».

**Ce qui ne change pas** (et donc ne rouvre aucun débat) :

- Le tirage d'une fiche lit toujours `version:` (ADR-0070). On ne le remplace pas.
- On ne construit **pas** de graphe de dépendances inter-milestone (ADR-0081, différé). `depends:`
  reste un **signal**, pas un barrage.

## L'état réel du backlog (au 2026-10-23)

Le tableau du plan est **périmé** : il présente v0.13 « à construire » alors qu'elle est livrée.
Voici la vérité, lue de `ezk backlog version` et des fiches.

- **v0.1 → v0.22 : livrées** (22 versions, taguées en local).
- **« v0.23 » et « v0.24 » : en cours**, 1 fiche chacune encore à faire / prête.
- **Pipeline actif hors parké : 23 fiches** (3 prêtes, 20 idées).
- **Tas parké : 88 fiches** sorties de version faute d'être construisibles sur le moment.

Les **3 fiches prêtes** (tirables tout de suite, quelle que soit la milestone) :

- [Lire enfin `depends:` + désambiguïser « en cours »](../../features/done/20261016114857813_lire-depends-et-desambiguiser-en-cours.md) — tête du plan.
- [Brancher le board web sur les vraies données](../../features/done/20261018121537582_brancher-board-web-vraies-donnees.md).
- [Attribuer les jetons réels par mode de revue (local vs PR+Codex)](../../features/done/20261017110956989_jetons-par-mode-local-vs-pr-codex.md).

## Les prochaines milestones (lots de fiches, dans l'ordre)

Quatre milestones à enchaîner. L'ordre suit deux règles : **ce qui compose d'abord** (ce qui rend
les suivantes plus propres), puis **la valeur visible**. Chaque fiche est un lien ; `prête` = tirable,
`à groomer` = idée à amener à « prête ».

### Milestone 1 — « Préparer une milestone, pour de vrai »

Pourquoi en premier : c'est l'outillage qui **rend ce plan opérable**. Il discipline la préparation
(groomer un lot, refuser une fiche non prête, mesurer ce qui part vs ce qui est parké) et lit enfin
les dépendances. Il paie tôt : chaque milestone suivante se prépare mieux.

- [Lire `depends:` (en avertissement) + désambiguïser « en cours »](../../features/done/20261016114857813_lire-depends-et-desambiguiser-en-cours.md) — **prête**, tête du plan. Le noyau de l'ADR-0081.
- [Cycle de vie d'une version — préparer, figer (marqueur vérifiable)](../../features/done/20261014200651962_cycle-vie-version-preparer-figer-developper.md) — à groomer. Exactement « préparer puis sceller une milestone ».
- [Groomer les fiches d'une version en une passe, avec rapport](../../features/done/20261015122120198_ezk-backlog-groom-par-version-avec-rapport.md) — à groomer. Préparer un lot d'un coup.
- [La commande `park` refuse une fiche non groomée](../../features/done/20261018234206166_park-refuse-une-fiche-non-groomee.md) — à groomer.
- [Le rapport de run affiche le ratio parké/livré + la couverture de grooming](../../features/done/20261018234207272_rapport-run-ratio-parke-livre-drapeau.md) — à groomer.
- *En option, même thème, laissées en idée* : [La version est un checkpoint du run](../../features/done/20261015125606808_frontiere-version-checkpoint-run-autonome.md) et [« Prête » vérifie la prémisse interne de la fiche](../../features/done/20261015213921103_dor-verifie-premisse-dans-le-code.md).

État : **toutes les fiches prêtes du lot sont livrées — 5 shippées en local** (2026-10-23) : lire `depends:` + désambiguïser « en cours » ; cycle de vie d'une version (figer/dégeler/diff) ; groomer une milestone en une passe ; `park` refuse une fiche non groomée ; rapport de run (ratio parké/livré + drapeau). Le 2026-10-24, **2 de ces idées ont été groomées « prête »** ([version = checkpoint du run](../../features/done/20261015125606808_frontiere-version-checkpoint-run-autonome.md) et [sprint-close jamais bloqué en worktree](../../features/done/20261016203544694_sprint-close-ne-bloque-jamais-en-worktree.md)). Reste **1 idée en attente de panel** : [« prête » vérifie la prémisse](../../features/done/20261015213921103_dor-verifie-premisse-dans-le-code.md) — à ne pas groomer sans arbitrage. La tête tirable passe à la milestone suivante (`carte`).

### Milestone 2 — « Le board dit vrai »

Pourquoi : valeur visible et **à moitié prête**. Le board montre des données d'échantillon ; on le
branche sur le réel, et on fond les trois tableaux de bord en un.

- [Brancher le board web sur les vraies données (read-model + backlog)](../../features/done/20261018121537582_brancher-board-web-vraies-donnees.md) — **prête**.
- [Unifier les tableaux de bord en un seul (Moniteur + cockpit + board), guidé par maquette](../../features/20261007135620590_refondre-vue-supervision-moniteur-lisible.md) — à groomer, P1.

État : **1 prête, 1 en idée** (milestone `board` assignée ; l'unification est un sujet de design, à faire par maquette).

### Milestone 3 — « Recettes & découvrabilité » (rapatrier le chantier muti)

Pourquoi : c'est le chantier que tu as signalé. Deux fiches rédigées **dans le projet muti** parlent
en fait de **méthode (vectorz)**. L'une le dit noir sur blanc : « c'est de la méthode… à reprendre
dans une session vectorz ». Le sujet : **un projet déclare ses outils et recettes** pour qu'agents
et humains les trouvent du premier coup.

Rapatriées côté vectorz le 2026-10-23 (milestone `recettes`, idée, à groomer en panel) :

- [Déclarer et rendre découvrables les outils, recettes et méthodes d'un projet](../../features/20261023120000001_declarer-outils-recettes-methodes-projet.md).
- [Contrat de recette auto-déclarée + catalogue (pilote muti)](../../features/done/20261023120000002_contrat-recette-autodeclaree.md).

**Coordination.** Les fiches **muti d'origine** (`muti:features/20261018084803445…` et `…110931402…`)
restent en place, **ni déplacées ni modifiées** — des sessions muti y travaillent. Les fiches vectorz
ci-dessus sont la **reprise** côté méthode, elles citent l'origine. À part, 5 fiches **parkées**
portent le label `recette` mais relèvent du *harvesting de capabilities* (recipy, launchpad,
LemonSqueezy…) — thème voisin, à traiter dans la passe de tri du parké, pas ici.

État : **2 idées rapatriées** — sujet d'architecture, panel recommandé avant de groomer.

### Milestone 4 — « La carte dit vrai » (dette de méthode)

Pourquoi : la carte de la méthode et le statut « in-progress » mentent par endroits. Deux fiches
ciblées remettent la carte d'aplomb.

- [Aligner la carte de la méthode sur le code](../../features/done/20261015213921021_aligner-carte-methode-sur-le-code.md) — **prête**.
- [Recâbler les surfaces « in-progress » sur le signal déduit des branches](../../features/done/20261015213921062_recabler-surfaces-in-progress-sur-branches.md) — **prête**.

État : **2 prêtes** — groomées le 2026-10-23 (milestone `carte`).

## Plus tard — milestones amorcées ou à définir

À garder au chaud, pas prioritaires. Chacune est un lot cohérent déjà identifiable.

- **« L'app se cartographie »** (l'actuelle « v0.23 ») : [un agent qui utilise l'app d'une PR](../../features/20260821210633457_explorateur-llm-pilote-siege-exploration-pr.md) + [cache de cartographie applicative](../../features/20261014113049954_cache-cartographie-app.md).
- **« Le cockpit s'ouvre »** : [une page d'accueil, une ligne par projet](../../features/20261002115451451_page-une-ligne-par-projet.md) + [rendre les étapes d'un skill configurables](../../features/20260830110131228_schema-etapes-skill-configurables.md).
- **« La qualité tient »** : [revue design-system comme step de release](../../features/done/20261011153019643_revue-design-system-step-composable-release.md), [release local-first macOS signé/notarisé](../../features/20261002130917993_release-local-first-macos.md), [borner le coût du chemin daté de sprint:report](../../features/done/20261013143324505_sprint-report-cout-chemin-date.md).
- **« Voir le vrai coût »** : [attribuer les jetons par mode de revue](../../features/done/20261017110956989_jetons-par-mode-local-vs-pr-codex.md) — **prête**, autonome.
- **« Les portiers ne crient plus au loup »** : [ezk-sprint close ne se bloque jamais en worktree](../../features/done/20261016203544694_sprint-close-ne-bloque-jamais-en-worktree.md), P1.

## Le tas parké (88 fiches) — une passe de tri à prévoir

88 fiches sont sorties de version et marquées `milestone: parked`. Le `park` a **écrasé leur
milestone d'origine** par `parked` — leur thème ne survit que dans `labels:`. C'est le défaut que
l'ADR-0081 nommait (verrou n°3 : « milestone promu en objet »).

Ces 88 fiches ne sont pas mortes : elles forment des clusters nets (lus dans `labels:`).

- supervision / observabilité : ~15
- articles (contenu différé) : 12
- installation / distribution : 10
- cli : 5 · backlog : 5 · **recettes : 5** · dx : 4 · carte : 4

**Proposition** : une passe de tri dédiée qui re-rattache chaque fiche parkée à une milestone à
partir de son `labels:`, et confirme (ou archive) les vieilles idées. À faire milestone par
milestone, pas en bloc. (Les 5 fiches parkées étiquetées `recette` relèvent du *harvesting de
capabilities* — recipy, launchpad, LemonSqueezy… —, un thème voisin : elles iront dans leur propre
milestone à ce moment-là, pas dans `recettes`.)

## Décision — prise le 2026-10-23

Tu as adopté le modèle. Fait en autonomie :

1. **ADR écrit** : [ADR-083](../../products/mega-city/docs/adr/0083-version-etiquette-milestone-unite-de-preparation.md)
   acte « version = étiquette, milestone = unité de préparation », amende ADR-0070/0080/0081 sans les
   contredire (verrou n°4 de l'ADR-0081 honoré). Statut **Accepté**, décision PO tracée.
2. **Tout le pipeline actif rangé par milestone** (9 milestones), groomé où c'était possible — 9 fiches prêtes.
3. **Fiches muti rapatriées** côté vectorz (milestone `recettes`).
4. **`PLAN.md` réécrit par milestone** ; le tableau de versions devient un historique.

Ce qui **reste** (à ton rythme) :

- **Construire la milestone 1** — la fiche-ancre est tirable (`/ezk-sprint run`).
- **Passe de tri du parké**, milestone par milestone.
- **Groomer en panel** les sujets laissés en idée (`recettes`, unification du board) — ils demandent un arbitrage/design.

Rien n'est committé ni irréversible : tu relis le diff.

## Ce qui a changé le 2026-10-23 (diff à relire)

- **Ajouté** : [ADR-083](../../products/mega-city/docs/adr/0083-version-etiquette-milestone-unite-de-preparation.md), ce plan, et 2 fiches `recettes` rapatriées de muti.
- **Fiches** : tout le pipeline actif porte un `milestone:` (9 milestones) ; 9 fiches `ready` (dont les 5 de `preparation`, les 2 de `carte`) ; la fiche « groomer en une passe » réalignée « version » → « milestone ».
- **Build (5 sprints) — la milestone `preparation` a livré toutes ses fiches prêtes.** Cinq fiches **construites et shippées en local**. (1) Lecture de `depends:` (cycle = erreur, ordre = avertissement) + « en cours » coupé en « active » / « incomplète ». (2) Cycle de vie d'une version : `freeze`/`unfreeze`/`diff` (tag `freeze/…`), brouillon → figée → livrée, sans toucher au tirage. (3) `ezk backlog groom-milestone` : prépare une milestone en une passe (sélection + rapport de delta). (4) `park` refuse une fiche non groomée (garde « tenter avant de parker », `--after-groom` lève le refus). (5) Rapport de run : ratio parké/livré + couverture de groom + drapeau (code 3). Gate verte (2199 tests + scripts), revues locales GO (8 constats corrigés). 18 commits locaux, **rien poussé**.
- **Suite autonome du 2026-10-24.** (a) **Groomé** 2 des 3 idées restantes de `preparation` vers « prête » (la 3e attend un panel). (b) **Gate stabilisée** (rétro light, [capture](../../docs/captures/2026-10-24-retro-run-preparation-light.md)) : les **deux** tests qui flakaient sous charge parallèle sont corrigés — `collect-absorbed` (délai élargi + `cwd` injecté) et `project-root-bins` (`fetchRetry` + délai élargi). **Prouvé : suite complète verte 5× de suite.** (c) **Différé, tracé** : les fiches prêtes restantes sont structurelles (aligner la carte = purge de l'épic à travers le code ; métriques jetons par mode ; board sur vraies données) — elles demandent un **panel ou une maquette**, pas de l'autonomie sans relecture. À reprendre avec toi.
- **[`PLAN.md`](../../features/PLAN.md)** : « Ordre de marche » réécrit **par milestone** ; le tableau du train devient un **historique** (v0.1 → v0.22 livrées).
- **Gate verte** : `backlog check`, `check-links` et `board check` passent. Le faux positif « ADR-0081 → fiche 0081 » du board check a disparu (la fiche-ancre a quitté le vieux bloc « petits correctifs »).
- **Rien n'est committé.**

## Et maintenant ?

- `/ezk-sprint run` — la fiche-ancre de la milestone 1 ([lire `depends:` + désambiguïser](../../features/done/20261016114857813_lire-depends-et-desambiguiser-en-cours.md)) est tirable ; construis la milestone 1.
- `ezk backlog version` — relire l'état réel des versions (le tableau de PLAN.md est périmé).
- `git diff` + `git status` — relire les fiches groomées, l'ADR et la bannière du PLAN avant de committer.
