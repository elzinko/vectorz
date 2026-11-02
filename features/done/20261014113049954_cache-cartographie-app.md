---
id: "20261014113049954"
title: "Carte de l'app et suivi de ce qui est testé — une carte vivante que les agents consultent"
type: feature
priority: P2
product: mega-city
milestone: exploration-app
version: v0.23.0
labels: [test-local, exploration-app]
status: split
pr: "split — scindée en 20261102182259416, 20261102182259505, 20261102182259592, 20261102182259680"
evidence: none # capacité de méthode (outil + agents) ; preuve = ses tests + un run de démonstration
created: 2026-10-14
split_into: ["20261102182259416", "20261102182259505", "20261102182259592", "20261102182259680"]
---

# 20261014113049954 — Carte de l'app et suivi de ce qui est testé

> **Découpée le 2026-11-02**, après le panel adverse et la décision du PO. La suite vit dans quatre
> fiches sœurs, listées au § Revue adverse (panel — 2026-11-02). Cette fiche reste comme historique.

**En clair.** Un agent qui explore l'app la re-parcourt entièrement à chaque fois, sans mémoire. On
aimerait une carte de l'app que les agents et les LLM consultent au lieu de tout re-explorer. **Le
panel adverse a tranché le POC** (voir plus bas) : on démarre par le plus honnête et le moins cher —
un **index statique des routes**, tiré du code du routeur, qui ne ment jamais. On **mesure** ensuite
ce qu'une carte fait gagner sur un vrai run. Le **cache vivant** — la carte tenue à jour au fil des
devs, invalidée zone par zone — ne se construit qu'**après** cette preuve.

**Besoin PO (2026-11-02).** Le PO veut aussi savoir **ce qui est testé**. Chaque fonctionnalité de
l'arbre porterait son état de test, visuel et fonctionnel, avec une preuve datée. La preuve expire
avec le temps ou quand le code change, comme un contrôle technique. Ce besoin change la raison d'être
de la fiche : voir § **Besoin PO — savoir ce qui est testé**.

**Si tu arrives frais.** La méthode ezk fabrique des *skills* (capacités) et des *agents*. Deux
existent déjà pour explorer une app qui tourne : `ezk-scout` chasse les bugs, et une fiche
« explorateur » cherche des features. Cette carte leur donne une **mémoire partagée** : au lieu de
redécouvrir l'app à chaque passe, ils consultent une entrée de cache. L'image juste (ta formulation,
PO 2026-10-14) : **presque un cache de cartographie applicative**.

## Direction (décision PO — 2026-10-14)

Le panel a démoli le mécanisme du cache vivant (voir **Revue adverse**). Le PO tranche : on réduit, en
deux pas.

**Pas 1 — un index statique des routes.** Une **fonction pure** du code (le routeur, la config) : la
liste des écrans/routes et des actions possibles, **reconstructible à la demande**, jamais périmée —
le code est la vérité. Il répond déjà à « où est l'action X ? ». Zéro invalidation, zéro dérive, rien
à stocker durablement. C'est le plus petit pas honnête, et il s'aligne sur la méthode (une vue
générée = fonction pure de fichiers, ADR-0055/0043).

**Précision de groom (2026-10-14)** : lire les routes dépend de la **stack** (React Router, routage
par fichiers Next, Vue, routeur backend…). Pour rester portable, le projet **déclare sa source de
routes** dans `.vectorz/config.yml` (un chemin, un glob, ou une petite commande) ; le POC lit **une
seule** stack réelle — l'app jouet du testbed, ou la webapp cop1. Aucun adaptateur multi-stack au POC
(YAGNI).

**Pas 2 — un test de valeur chiffré.** Sur un vrai run d'exploration (scout ou explorateur), mesurer
ce que la re-exploration coûte (tokens, temps) et ce qu'une carte — même faite à la main une fois —
économiserait sur la passe suivante. Économie marginale → on s'arrête à l'index. Économie forte → le
cache vivant gagne son droit d'exister.

**Protocole de groom (2026-10-14)** : prendre un run `ezk-scout` réel, relever le coût de sa passe
(tokens, temps) ; refaire une passe en lui fournissant l'index statique en contexte ; comparer, puis
écrire les deux chiffres et le verdict **dans cette fiche**. Seuil indicatif : sous ~15 % d'économie,
on en reste à l'index.

**Différé derrière le test — le cache vivant.** L'invalidation zone par zone, le mapping code→zone, le
magasin par SHA, la passe complète : toute la section **Architecture** ci-dessous. Elle ne se rouvre
qu'avec une valeur **prouvée** ET un **ADR dédié** qui règle ce que le panel a cassé (invalidation ↔
adressage, éviction, concurrence). Au `ready`, le Pas 1 sera vraisemblablement une fiche sœur tirable
à part ; le cache vivant reste une idée différée.

## Besoin PO — savoir ce qui est testé (2026-11-02)

**Le cas vécu.** Le 2026-11-02, le PO demande une commande pour tester son app à la demande, trouver
les bugs d'affichage et de fonctionnement, et proposer des améliorations. `ezk-scout` existe, mais il
ne répond pas à « ai-je tout testé ? ». Sa passe s'arrête à une borne (30 sondes, 15 minutes). Elle
ne part d'aucune liste des fonctionnalités. Et rien ne garde la trace de ce qu'une passe a déjà
vérifié. La passe suivante repart donc de zéro, sans savoir ce qui reste à couvrir.

**Ce que ça change.** La fiche justifiait la carte par une économie de tokens. Le PO en fait un
**outil de couverture** : savoir ce qui est testé, avec quelle preuve, et jusqu'à quand. Le panel du
2026-10-14 avait écarté la carte vivante faute de consommateur qui la réclame (faille 5). Ce besoin
en apporte deux : le PO lui-même, et `ezk-scout` qui s'en servirait pour cibler ses passes. Un seul
cas ne bloque pas : la règle `agent-ops/preuve-mince-question-pas-veto` s'applique, le PO tranche.

**Le modèle : un contrôle technique par fonctionnalité.**

```
app
├── écran A
│   ├── action « créer »      visuel ✓ 02/11 (capture)   fonctionnel ✓ 02/11 (sonde rejouable)
│   └── action « supprimer »  visuel ✗ jamais testé      fonctionnel ⏳ expiré (code modifié)
└── écran B
    └── …
```

- **L'arbre** range les fonctionnalités par écran, puis par action. C'est l'index du Pas 1.
- **Chaque nœud porte son état de test sur deux axes.** Le visuel : l'écran s'affiche bien. Le
  fonctionnel : l'action fait ce qu'elle doit. Chaque axe vaut *jamais testé*, *valide*, *en échec*
  ou *expiré*.
- **Chaque état valide pointe vers sa preuve.** Une capture pour le visuel. La sonde rejouable du
  journal `ezk-scout` pour le fonctionnel. La preuve porte sa date et le SHA testé.
- **La preuve expire, comme un macaron de contrôle technique.** Elle vaut jusqu'à une date, ou
  jusqu'à ce qu'on touche au code de la fonctionnalité.
  - L'expiration par **date** est simple : elle ne dépend de rien.
  - L'expiration par **code modifié** est le point dur. Il faut savoir quels fichiers forment quelle
    fonctionnalité : c'est l'option B, que le panel a jugée fragile.
- **Le test se lance à la demande.** `ezk-scout` cible une branche de l'arbre, ou seulement les
  nœuds jamais testés ou expirés.
- **La carte est une bibliothèque à part**, que `ezk-scout` utilise comme outil (formule PO). Le
  scout lit la carte et y écrit ses résultats ; il ne la contient pas.

**Le test de valeur change d'objet.** Le seuil de ~15 % d'économie de tokens (Pas 2) ne mesure plus
la bonne chose. La valeur se juge d'abord ainsi : après une passe, le PO voit en un coup d'œil ce qui
est couvert, ce qui ne l'est pas et ce qui a expiré. L'économie de tokens devient une mesure
secondaire.

**Questions ouvertes pour le groom.** Les modalités restent à définir (formule PO). Ce besoin rouvre
une décision du panel du 2026-10-14 : le groom passe donc par un panel adverse.

1. **Le grain de l'arbre.** Écran puis action suffit-il ? Ou faut-il descendre aux états : une
   modale, une étape de formulaire ?
2. **La source de l'arbre.** Le code seul (les routes) ? Ou aussi les fiches livrées (`done/`), qui
   décrivent ce que l'app est censée faire ?
3. **La durée de validité d'une preuve.** Quelle valeur par défaut ? Varie-t-elle entre le visuel et
   le fonctionnel ?
4. **Le lien entre le code et une fonctionnalité.** Déclaré à la main, déduit du diff, ou différé ?
   Une piste pour le POC : l'expiration par date seule. Une autre : le déduire des imports (voir
   § Avis de l'agent).
5. **L'endroit où vivent l'état et les preuves.** Hors dépôt, comme le rapport du scout
   (décision 3) ? Ou un registre léger committé ? Le panel a contesté le magasin clé par SHA
   (faille 1). Un registre daté ne pose pas ce problème, mais il faut le vérifier.
6. **Qui écrit l'état.** `ezk-scout` seul, après une passe ? Ou aussi `ezk-qa`, quand il valide une
   PR ?
7. **L'affichage d'une couverture partielle.** Une passe bornée ne doit pas présenter une carte
   incomplète comme la carte entière : elle affiche « X sur Y testés » (faille 4).

## Avis de l'agent — un registre, pas un cache (2026-11-02)

> Avis rendu à la demande du PO, **à soumettre au panel du groom**. Ce n'est pas une décision.
>
> **Réfuté en partie par le panel du 2026-11-02** (§ Revue adverse — panel du 2026-11-02). Le
> registre de faits datés est retenu. L'expiration par les imports est réfutée : elle se trompe dans
> les deux sens. L'arbre ne se lit dans aucun routeur, car aucune app cible n'en a. L'affirmation
> « aucun outil ne réunit les trois » est fausse en partie. Les réponses aux failles 2 et 3
> ci-dessous ne tiennent donc pas.

**En clair.** Le projet est viable s'il devient un **registre** : un carnet qui note ce qui a été
testé. Il ne doit pas être un **cache** : une copie de l'app à tenir à jour. Le registre est un outil
sans IA, séparé de l'agent qui le pilote.

**L'idée clé : l'expiration se calcule.** Personne n'a à signaler « j'ai touché à cet écran ». Quand
l'agent note une preuve, l'outil note aussi une **empreinte** des fichiers de la fonctionnalité.
Quand on lit l'état, l'outil recalcule l'empreinte. Si elle a changé, la preuve est expirée. C'est le
principe de `make` et des caches de build.

```
l'agent teste « supprimer »  ─▶ l'outil note la preuve, la date
                                et l'empreinte des fichiers de l'écran
… un dev modifie un fichier de cet écran …
on lit l'état                ─▶ l'outil recalcule l'empreinte
                                elle a changé ─▶ « expiré »
```

**Ce que ça répond au panel du 2026-10-14.**

- **Faille 1.** Il n'y a plus de magasin à invalider. L'empreinte porte sur le contenu des fichiers :
  elle marche aussi sur du code pas encore committé.
- **Faille 2.** Les fichiers d'une fonctionnalité se déduisent des imports, de proche en proche,
  depuis l'écran. Un utilitaire partagé modifié fait expirer beaucoup de preuves : c'est trop prudent,
  mais jamais faux.
- **Faille 3.** Le registre ne prétend pas décrire l'app d'aujourd'hui. Il garde des faits datés :
  « testé tel jour, sur tel SHA ». L'état présent se calcule à la lecture. En cas de doute, il dit
  « expiré ».
- **Faille 4.** « X sur Y testés » se calcule depuis le même arbre que la liste.
- **Faille 5.** Le besoin existe désormais : celui du PO, du 2026-11-02.

**Le partage des rôles.** L'ADR-0001 le pose déjà : le programme range, le LLM juge.

- **L'outil est le carnet.** Il construit l'arbre, note les résultats, calcule l'expiration et répond
  en JSON. Il n'ouvre jamais de navigateur et ne juge rien.
- **L'agent est les mains et les yeux.** C'est `ezk-scout`. Il demande quoi tester, teste, juge, puis
  rend le résultat et sa preuve.
- **L'agent pilote l'outil par une commande** `ezk carto … --json`, sur le modèle de l'ADR-086. Pas
  de serveur MCP au départ : un agent appelle une commande tout aussi bien.

**Où vit l'outil : par étapes.**

1. **Un module séparé dans mega-city.** Il ne dépend pas du scout, et un test garde cette
   séparation. Recommandé pour commencer.
2. **Un paquet du monorepo**, quand un deuxième utilisateur arrive : `ezk-qa`, ou mission control
   qui afficherait la couverture.
3. **Un dépôt ou un paquet npm à lui**, seulement s'il sert hors de la méthode.

Un dépôt séparé tout de suite coûterait versions et publications, alors que le contrat bouge encore.
Le « deuxième cas » n'est pas un veto (règle `agent-ops/preuve-mince-question-pas-veto`) : le PO peut
choisir l'étape 2 d'emblée et le noter ici.

**Les risques et leurs parades.**

| Risque | Parade |
|---|---|
| L'arbre dépend du framework de l'app | un seul framework au POC, source déclarée dans `.vectorz/config.yml` |
| Les imports ne voient pas tout : CSS, config, données | ces fichiers-là expirent par date |
| L'agent juge son propre travail | l'outil refuse un « valide » sans preuve rejouable ou visible |
| Le visuel reste subjectif | plus tard, comparer chaque capture à une image de référence |
| Les tests coûtent cher | le registre réduit ce coût : on ne reteste que ce qui a expiré |

**Avant de construire.** Vérifier qu'aucun outil existant ne réunit déjà les trois : l'arbre de l'app,
les preuves de test et l'expiration. Les idées existent séparément. Chromatic ne refait que les tests
visuels des composants dont le code a changé. Turborepo calcule une empreinte de ce qui entre dans
chaque build.

**Décisions pour le PO et le panel.**

1. Passer du cache au registre. Ce choix revient sur la décision du panel du 2026-10-14.
2. Choisir où démarre l'outil : un module (recommandé) ou directement un paquet.
3. Choisir la première app cible, et donc le premier framework.

## Contexte / Problème

L'exploration d'app est **amnésique**. Chaque passe remonte le banc et re-parcourt tout, même les
zones que personne n'a touchées depuis des semaines. C'est lent, et ça coûte cher en tokens.

Trois manques précis :

1. **Rien ne décrit « ce que l'app fait déjà ».** Pas d'inventaire vivant des écrans, des actions
   possibles, des états. Un agent qui veut explorer part de zéro.
2. **Les devs ne sont pas tracés contre une carte.** Quand un sprint modifie un écran, aucune carte
   ne le sait. Une passe ne peut donc pas cibler « ce qui a changé » : elle re-balaye tout, ou rate
   le changement.
3. **Les LLM n'ont pas de vue rapide de l'app.** Pour savoir « où est l'action X », ils relisent le
   code ou re-prennent des captures. L'état de l'app n'est consultable nulle part en un coup d'œil.

Le dogfooding a déjà montré que l'exploration trouve des défauts que rien d'autre ne trouve. Mais
elle coûte une passe complète à chaque fois. Le cache est le chaînon qui rend l'exploration
**incrémentale** au lieu de systématique.

## Proposition

Un **outil à part** : le cache de cartographie applicative. Pas collé à un agent précis. Les agents
le **consultent ou non**. POC d'abord, polish ensuite.

Le modèle mental est un cache (ton image) :

```
Zone de l'app         →  entrée de cache (écran, actions possibles, contexte, dernier état vu)
Un dev touche la zone →  l'entrée est INVALIDÉE (marquée périmée)
Repasse ciblée        →  l'entrée est reconstruite (cache miss) — captures, devtools, Playwright
Passe complète        →  tout le cache rebâti, pour rattraper les zones dérivées (anti-dérive)
Un agent/LLM veut l'état →  il LIT l'entrée fraîche (cache hit, zéro re-exploration)
```

Les pièces :

- **Un format versionné.** Une entrée par zone, estampillée du SHA git qu'elle décrit. Il évolue avec
  l'app, se lit par un humain comme par un LLM, et vit **hors du dépôt cible** (décision d'archi
  ci-dessous — pas « committé », contrairement au premier jet).
- **L'invalidation.** Les agents de dev et de conception (sprint, product-build…) marquent périmées
  les zones qu'ils modifient. C'est le registre « ce qui a été touché ».
- **La repasse ciblée.** Elle ne visite que les zones invalidées, reconstruit leurs entrées, et peut
  au passage remonter de nouveaux bugs (c'est là que screenshots / devtools / Playwright entrent).
- **La passe complète.** De temps en temps, tout est re-parcouru pour rattraper les **dérives** :
  les zones qui ont changé sans avoir été marquées. C'est le garde-fou contre une méthode qui laisse
  filer des changements.
- **Les consommateurs.** L'explorateur de features lit le cache pour choisir où explorer. `ezk-scout`
  le lit pour cibler ses sondes. Un LLM le lit pour répondre « où est l'action X » sans re-explorer.
- **Activable par projet.** Un interrupteur dans la config ezk (`.vectorz/config.yml`), sur le modèle
  des plugins optionnels (github / ci). Sans le cache, les agents **re-explorent** comme avant, sans
  casser : dégradation propre, jamais d'erreur.

La carte **compose** des briques existantes au lieu de les refaire : le lanceur universel et le
testbed (monter le banc isolé), le mécanisme de captures partagé, et la **brique d'exploration
commune** déjà décidée par le PO. Le cache est la **couche mémoire** sous cette brique.

## Critères d'acceptation

Niveau *idée*, **scope réduit** (décision PO — voir § Direction). *Près* = le Pas 1 et le Pas 2 ; le
reste est **différé** derrière le test de valeur.

**Pas 1 — index statique des routes**
- [ ] Un **index des routes/écrans + actions** est produit par une **fonction pure** du code
      (routeur / config), **reconstructible à la demande**, sans rien stocker durablement.
- [ ] Un LLM répond « où est l'action X ? » depuis cet index, **sans explorer l'app**.
- [ ] L'index est **activable / désactivable par projet** via la config ezk ; absent, aucun agent ne casse.

**Pas 2 — test de valeur**
- [ ] Sur **un run réel** (scout ou explorateur), le coût de re-exploration (tokens, temps) et
      l'économie estimée d'une carte sont **mesurés et écrits** dans la fiche.
- [ ] La décision « index seul » vs « cache vivant justifié » est **tranchée sur ce chiffre**, pas au feeling.

> Amendé le 2026-11-02 (besoin PO) : ce chiffre devient une mesure **secondaire**. La valeur se juge
> d'abord sur la couverture (critères ci-dessous et § Besoin PO).

**Étage couverture — besoin PO du 2026-11-02** (les modalités se tranchent au groom)
- [ ] Sur une app réelle, le PO obtient en **une commande, sans lancer de passe**, la liste des
      fonctionnalités jamais testées ou expirées.
- [ ] Chaque nœud de l'arbre affiche son état de test sur **deux axes**, visuel et fonctionnel :
      jamais testé, valide, en échec ou expiré.
- [ ] Chaque état valide pointe vers **sa preuve** (capture ou sonde rejouable), datée et estampillée
      du SHA testé.
- [ ] Une preuve plus vieille que sa durée de validité passe **expirée** sans intervention.
- [ ] `ezk-scout` peut cibler **une branche de l'arbre**, ou seulement les nœuds jamais testés ou
      expirés.
- [ ] Une couverture partielle s'affiche **« X sur Y testés »**, jamais comme une couverture complète.

- [ ] Gate locale verte (typecheck / lint / tests).

**Différé derrière le test** (le cache vivant — section Architecture, ne pas construire sans ADR
dédié) : format versionné hors dépôt clé par SHA, signal d'invalidation code→zone, repasse ciblée,
passe complète anti-dérive, éviction, concurrence.

## Comment vérifier

Procédure cible du **scope réduit** (noms indicatifs, à trancher au groom).

```bash
# Pas 1 — index statique, fonction pure du routeur (rien de stocké)
ezk carto routes <app>       # liste écrans/routes + actions, calculée à la demande
ezk carto where "action X"   # où trouver l'action X, répondu depuis l'index

# Pas 2 — test de valeur, sur un vrai run
#   mesurer le coût d'une re-exploration complète (tokens, temps)
#   l'écrire dans la fiche, décider index-seul vs cache-vivant sur ce chiffre

# Étage couverture — besoin PO du 2026-11-02 (noms indicatifs, à trancher au groom)
ezk carto status <app>              # l'arbre, avec l'état visuel et fonctionnel de chaque nœud
ezk carto status <app> --todo       # seulement les nœuds jamais testés ou expirés
/ezk-scout run <app> --zone "<nœud>"   # une passe ciblée sur une branche de l'arbre
```

- **Couverture lisible** : `status --todo` répond sans lancer l'app ni de passe.
- **Expiration** : une preuve datée au-delà de sa durée de validité ressort `expiré`.
- **Pas de mensonge** : après une passe bornée, l'en-tête dit « X sur Y testés ».

- **Fonction pure** : deux appels de `routes` sur le même commit rendent le même index ; aucun fichier
  durable écrit (rien à gitignorer, rien à purger).
- **Interrupteur projet** : index désactivé dans `.vectorz/config.yml`, les agents tournent sans erreur.
- **Test de valeur** : le chiffre (coût re-exploration vs économie estimée) est **présent dans la
  fiche** avant d'ouvrir le cache vivant.

## Architecture — avis de l'architecte (2026-10-14, `--archi`)

> ⚠ **Contesté par le panel adverse (2026-10-14).** Le mécanisme central ci-dessous — « cache
> incrémental clé par SHA » — est jugé **contradictoire** et dépendant du mapping fichier→zone
> différé. Lis la section **Revue adverse** plus bas avant de t'appuyer sur ces décisions. Le reframe
> **est décidé** (PO 2026-10-14, voir § Direction) : le cache vivant est **différé** derrière un test
> de valeur ; les décisions ci-dessous ne concernent que ce futur étage et **restent à réparer**
> (invalidation ↔ adressage, éviction, concurrence, ADR dédié).

Cette section tranche les six points durs. Elle s'appuie sur des décisions **déjà prises** par la
méthode, pour ne pas les rouvrir. POC d'abord : le moins de pièces possible, on mesure, on ajoute au
besoin.

### Décision 1 — Qu'est-ce qu'une « zone »

Une zone = un **état d'écran atteignable et distinguable**, repéré par une clé stable. Au POC, **grain
route** : une entrée par écran / route. Chaque entrée porte sa clé, les **actions** possibles dans ce
contexte, les **préconditions** pour l'atteindre, le **dernier état vu**, et une **évidence** (capture
+ assertions DOM).

Pourquoi ce grain : c'est le plus grossier qui reste stable, donc le plus facile à relier au code.
Descendre aux sous-états (modale, étape de formulaire) fait exploser la carte **et** le problème de
mapping. On affine plus tard si besoin (YAGNI).

### Décision 2 — Le signal « code → zone » (le point dur)

| Option | Principe | Faiblesse |
|---|---|---|
| A — Explicite | l'agent de dev marque la zone qu'il touche | repose sur la discipline ; un oubli laisse une entrée périmée |
| B — Par diff | déduire les zones d'après les fichiers changés, via un mapping fichier↔zone | le mapping doit exister, se maintenir, et reste approximatif (un util partagé touche tout) |
| C — Hybride | A + B + passe complète périodique | la plus complète, mais B coûte cher à écrire |

**Décision : C, par étapes.** Le POC livre **A (signal explicite) + la passe complète en filet** — les
deux plus fiables et les moins chers. Le mapping fichier↔zone (B) est **différé** : on ne construit pas
d'abord la pièce la plus fragile. On mesure le taux de dérive (déjà prévu en « mesure de suivi »), et
on ajoute B seulement s'il est trop haut.

**Sous-décision clé** : marquer une zone est un geste **cheap et local** — une écriture dans le magasin
du cache (hors dépôt), jamais un commit ni une PR. Aucun churn.

### Décision 3 — Où vit le cache (et la tension « committé »)

Le cache est un **artefact généré**, gros, qui change tout le temps. La méthode a déjà tranché ce cas :

- une vue générée ne reste dans git que si on la lit sur GitHub — [ADR-0055](../../products/mega-city/docs/adr/0055-artefacts-generes-hors-versionnage.md) ;
- un état vivant propre à la machine se sert en direct, jamais committé — [ADR-0043](../../products/mega-city/docs/adr/0043-vue-sessions-live-servie-jamais-committee.md) ;
- `ezk-scout` [[20260910165637000]] range déjà rapport, captures et journal **hors du dépôt cible**.

**Décision : le cache vit HORS du dépôt cible, clé par SHA git.** Pas committé. « Versionné » veut dire
**estampillé du commit décrit**, pas « rangé dans git ».

⚠ **Ceci corrige le mot « committé »** de mon premier jet. Le committer rejouerait exactement les
conflits entre PR que l'ADR-0055 a tués. Un test garde la frontière (le magasin n'est jamais suivi par
le git du dépôt cible), sur le modèle d'`untracked-views.test.ts`.

```
dépôt cible (git)                 magasin du cache (hors dépôt, par SHA)
  features/*.md                     <cache>/<repo>/<sha>/
  code produit        ──┐             index + une entrée par zone + évidences
                        └─ une passe LIT le code et l'app,
                           ÉCRIT seulement dans le magasin (jamais dans le dépôt)
```

### Décision 4 — Partagé, pas par-branche

Magasin **partagé, clé par SHA**. Deux branches sur le même commit partagent les entrées. Une branche
sur un autre commit hérite des entrées encore fraîches du commit parent et reconstruit le reste. Clé
par SHA = une entrée décrit toujours une **version connue** de l'app.

### Décision 5 — Bornage du coût

On réutilise `ezk-scout` : bornes `--max-probes` / `--max-min` sur une passe, avertissement avant tout
fan-out coûteux. La passe **ciblée** est cheap par construction (seulement les zones invalidées). La
passe **complète** est la chère : bornée et explicite.

### Décision 6 — Risque « juge et partie »

Une entrée stocke une **évidence dure** (capture + assertions DOM), pas seulement la prose d'un agent.
Un lecteur, humain ou agent, peut auditer ce que la passe a vraiment vu. Le risque est plus faible ici
que pour l'agent découvreur : le cache **enregistre un état**, il ne décide pas de ce qui mérite d'être
signalé.

### Invariant transverse — find-only + banc isolé

La passe est **find-only** sur le code produit (elle explore, ne modifie jamais), via le garde-fou et
l'isolation d'état d'`ezk-scout`. Le seul écrit d'une passe est le magasin du cache, hors dépôt.

### Interrupteur projet (aligné sur [ADR-074](../../docs/adr/ADR-074-board-unifie-run-moments-fiches-deux-portees-config.md))

Le projet déclare l'intention dans `.vectorz/config.yml` (« carto : on / off »), qui **voyage avec le
repo**. L'emplacement du magasin est un réglage du **poste**, qui ne voyage pas — exactement la « config
à deux portées » d'ADR-074. Désactivé, les agents re-explorent, sans erreur.

### Ordre de construction (et découpe probable au `ready`)

POC → format d'entrée + magasin par SHA + signal explicite + passe complète + **un** consommateur
(ex. `ezk-scout` qui lit la carte). Plus tard : mapping par diff (B), émission vers le Moniteur, grain
sous-état.

Au `ready`, cette fiche se **découpe** sûrement (règle « une fiche tient dans un sprint ») : (1) le
moteur de cache, (2) le câblage du signal d'invalidation dans les agents de dev, (3) l'intégration d'un
consommateur. Sœurs liées par un milestone, **pas** de fiche chapeau.

## Revue adverse (panel — 2026-10-14)

Trois lentilles adverses (architecte / dev / produit) ont challengé l'approche. **Convergence forte,
et sévère** sur le cache.

**Verdicts** : architecte → *fragile-à-revoir* ; dev → *risqué* ; produit → *à abandonner ou réduire*.

**Failles confirmées** (recoupées par au moins deux lentilles) :

1. **Le mécanisme central se contredit.** La Décision 2 décrit un cache **mutable** (on invalide, on
   reconstruit en place) ; la Décision 4 un magasin **immuable par SHA**. Les deux ne tiennent pas
   ensemble. Pire : l'**invalidation** se produit en *temps working-tree* (arbre sale, pas encore de
   SHA — l'état même où les agents usent l'app), donc inadressable dans un magasin clé par SHA.
2. **La valeur dépend de la pièce différée.** L'invalidation fiable ET l'« héritage du commit parent »
   exigent le mapping **fichier→zone** (option B) que la fiche renvoie à plus tard. Sans B, « cache
   incrémental » est un **nom, pas un mécanisme** : on garde la pièce chère (passe complète) et on
   diffère celle qui rapporte.
3. **Appui ADR-0055 / ADR-0043 pris à l'envers.** Ces vues-là sont des **fonctions pures de fichiers
   committés** (reconstructibles, jamais périmées). Le cache, lui, doit **exécuter l'app** → il périme
   et peut **mentir**. ADR-0043 a même **écarté** l'alternative « regen hors-git servi » pour les
   raisons qui frappent le cache (péremption, dépendance d'ordre, fichier à gérer).
4. **Trous de cycle de vie** : aucune **éviction** (magasin de snapshots non borné), aucune
   **concurrence** traitée (deux sessions dans le même bucket SHA réintroduisent le conflit que
   l'ADR-0055 a tué), et une passe complète **bornée** présente une carte **tronquée** comme « la
   carte » (ment — cf. la loi « un compte à côté d'une liste tronquée ment »).
5. **Besoin non prouvé (YAGNI).** Aucun consommateur shippé ne réclame le cache : `ezk-scout` (livré)
   re-explore exprès, l'explorateur est parké. Le coût « lent / cher » n'est **ni chiffré ni daté**
   (`evidence: none`). La méthode vient justement de **payer** (ADR-0055) pour apprendre qu'un généré
   cher et divergent est un passif.

**Ce qui tient** : find-only + isolation (réemploi `ezk-scout`), évidence dure (capture + DOM),
dégradation propre + interrupteur projet, « hors dépôt » (vrai progrès sur « committé »), et la clé
par SHA **pour la correction** (une entrée ne décrit jamais en douce la mauvaise version).

**Recommandation convergente** : **réduire**. Démarrer par un **index statique des routes** (fonction
pure du routeur — reconstructible, ne ment jamais sur la topologie), répondre déjà à « où est l'action
X ? », et **mesurer la valeur** (sur un vrai run : ce que la re-exploration coûte vs ce qu'une carte
économise) **avant** de bâtir le cache vivant. Le cache vivant (invalidation, magasin SHA, passe
complète) reste **différé** derrière ce test chiffré.

**Arbitrages PO** :
- Réduire au départ à l'index statique + test de valeur, **ou** réparer l'archi du cache vivant
  (réconcilier invalidation ↔ adressage, éviction, concurrence, **ADR dédié** qui assume la déviation)
  avant `ready`, **ou** mettre le cache en pause ?
- Si cache vivant : budget de rétention du magasin, et faut-il d'abord **factoriser la brique
  d'exploration commune** (le moteur de `ezk-scout` est livré **en ligne**, non factorisé) ?

## Revue adverse (panel — 2026-11-02)

**En clair.** Trois lentilles adverses ont challengé le besoin PO et l'avis de l'agent : architecte,
dev et produit. Elles retiennent le registre de faits datés. Elles réfutent l'expiration par les
imports et l'arbre tiré d'un routeur. Elles proposent de commencer par un arbre écrit à la main et
une expiration par date, sur mission control.

**Verdicts** : architecte → *fragile-à-revoir* ; dev → *risqué* ; produit → *à réduire*. Les preuves
ci-dessous ont été revérifiées dans le dépôt par le juge du panel, le 2026-11-02.

**Failles confirmées.**

1. **L'expiration par les imports se trompe dans les deux sens** (les trois lentilles). L'avis disait
   « trop prudent, mais jamais faux » : c'est faux.
   - Elle fait expirer presque tout. `types.ts` est importé par 23 fichiers de
     `products/cop1/packages/web/src/board/`.
   - Elle laisse passer de faux « valide ». L'écran lit ses données par `fetch('/api/board')`
     (`products/cop1/packages/web/src/board/Board.tsx:205`). Un autre paquet les sert, en lisant
     `ezk` (`products/cop1/packages/app/src/features/board/boardProvider.ts:1-6`). Aucun import ne
     relie les deux. Le CSS global est importé hors de toute vue
     (`products/cop1/packages/web/src/main.tsx:4`).
   - Elle dépend du poste. Une empreinte sur du code non committé n'est pas une fonction pure de
     fichiers committés. C'est pourtant l'appui que réclament les ADR-0055 et 0043
     (`products/mega-city/docs/adr/0055-artefacts-generes-hors-versionnage.md:24-26`,
     `products/mega-city/docs/adr/0043-vue-sessions-live-servie-jamais-committee.md:66-69`).
2. **Aucune app cible n'a de routeur** (dev, produit). Mission control change d'écran par une
   variable (`products/cop1/packages/web/src/main.tsx:6-10`,
   `products/cop1/packages/web/src/board/Board.tsx:34-43`), sans bibliothèque de routage. L'appli
   bureau de muti n'utilise pas `vue-router`. samplerz est écrit en JavaScript sans framework. Le
   Pas 1, « une fonction pure du routeur », ne s'applique donc pas : l'arbre se déclare à la main.
3. **Les preuves disparaissent** (dev, produit). Le scout range son journal et ses captures dans un
   dossier temporaire (`products/mega-city/skills/ezk-scout/SKILL.md:79`). Le registre doit garder sa
   propre copie de chaque preuve.
4. **L'écriture concurrente n'était pas modélisée** (architecte, dev). Deux passes peuvent écrire en
   même temps. Parade : un journal où l'on ne fait qu'ajouter, une ligne par nœud, axe et passe. On
   n'y réécrit jamais une ligne.
5. **« Aucun outil ne réunit les trois » est faux en partie** (produit). Qase relie des exigences au
   dernier résultat de leurs tests, et signale ceux à refaire. Mais il suit des tickets, pas le code,
   et c'est un service en ligne
   (https://docs.qase.io/en/articles/9123660-requirements-traceability-report). Le panel n'a trouvé
   aucun outil local, gratuit et pilotable par un agent. Les agents de test de Playwright produisent
   un plan en Markdown, qui peut servir de premier arbre (https://playwright.dev/docs/test-agents).

**Ce qui tient.** Des faits datés qu'on ne modifie jamais, plutôt qu'une copie de l'app à tenir à
jour. Un module dans mega-city, séparé du scout. Un registre hors du dépôt : un registre dans le
dépôt ferait aussi tomber la garde find-only du scout, qui lit les fichiers non suivis
(`products/mega-city/skills/ezk-scout/scripts/find-only-guard.sh:57`). Un « X sur Y » calculé depuis
le même arbre que la liste.

**Points de vigilance.**

- Le registre ne compte que les passes d'exploration. Mission control a déjà ses tests de
  composants : le registre doit le dire, sinon ses « jamais testé » paraîtront faux.
- Une expiration au moindre commit ferait tout passer « expiré » en quelques jours : `web/src` a
  reçu 6 commits en 14 jours. D'où l'expiration par date, avec le nombre de commits depuis la preuve
  affiché à côté.
- L'axe visuel restera vide si le scout ne passe qu'en HTTP. La passe du 2026-11-02 sur mission
  control n'utilisait que des requêtes (`docs/sessions/2026-11-02-scout-sprint5-mission-control.md:13`).

**Mesure de valeur** (proposée par le produit), sur les 3 premières passes du scout sur mission
control :

- chaque passe part de la liste « à tester » du registre ;
- « X sur Y testés » monte à chaque passe ;
- au moins un défaut est trouvé sur un nœud jamais testé ;
- quand le PO consulte, moins de la moitié des nœuds sont expirés.

Deux échecs sur ces quatre points, et on retire l'outil.

**Décisions PO (2026-11-02).** Le PO a accepté la synthèse en bloc (« applique tout ») :

1. Un registre de faits datés plutôt qu'un cache.
2. Un module dans mega-city, séparé du scout.
3. Première app : mission control. L'app jouet du scout sert de fixture de test.
4. L'arbre est déclaré à la main. Les preuves expirent par date au départ. L'expiration quand le code
   change est différée derrière la mesure.
5. Découpage en quatre fiches sœurs. Le mode « améliorations » du scout, qui propose des fiches de
   fonctionnalité, est traité à part.

**Découpage** (milestone `exploration-app`, sans fiche chapeau), dans l'ordre de construction :

1. [20261102182259416](20261102182259416_carnet-de-tests-arbre-declare-expiration-date.md) — Un
   carnet qui note ce qui est testé dans l'app, et quand la preuve expire.
2. [20261102182259505](../20261102182259505_scout-lit-et-remplit-le-carnet.md) — `ezk-scout` part du
   carnet pour choisir quoi tester, et y note ses résultats.
3. [20261102182259592](../20261102182259592_carnet-mission-control-premiere-app-mesure.md) — Tenir le
   carnet de tests de mission control, et mesurer s'il sert.
4. [20261102182259680](../20261102182259680_carnet-expiration-quand-le-code-change.md) — Faire expirer
   une preuve quand le code de la fonctionnalité change. Différée derrière la mesure.

Le Pas 1 (index du routeur) et le Pas 2 (test d'économie de tokens) sont remplacés par ces fiches.
L'architecture du cache vivant, plus haut, reste écartée. Coût du panel : environ 490 000 jetons,
pour trois agents.

## Glossaire

- `cache de cartographie` — la carte de l'app stockée et réutilisée, comme un cache mémoire : on lit
  l'entrée si elle est fraîche, on la reconstruit sinon.
- `zone` — un endroit de l'app : un écran, une route, un état, avec les actions possibles dans ce
  contexte.
- `invalidation` — marquer une entrée « périmée » parce que le code de cette zone a changé.
- `dérive` — une zone qui a changé **sans** avoir été marquée ; seule une passe complète la rattrape.
- `cache hit / miss` — l'entrée est fraîche, on la lit / elle est périmée ou absente, on la reconstruit.
- `banc` / `testbed` — l'app lancée dans un environnement isolé, explorée sans risque pour l'état réel.
- `couverture` — la part des fonctionnalités de l'arbre qui a une preuve de test valide.
- `preuve` — ce qui montre qu'un test a eu lieu : une capture d'écran, ou une sonde qu'on peut
  rejouer. Elle porte une date et le SHA testé.
- `expiration` — le moment où une preuve cesse de compter : sa durée de validité est passée, ou le
  code de la fonctionnalité a changé.

## Notes / décisions

- **Panel et découpage (2026-11-02).** Le panel adverse a réfuté l'expiration par les imports et
  l'arbre tiré d'un routeur. Le PO a accepté sa synthèse, puis le découpage en quatre fiches sœurs.
  Détail dans § Revue adverse (panel — 2026-11-02).
- **Besoin PO — couverture (2026-11-02).** Le PO veut tester son app à la demande et savoir ce qui
  est testé, visuellement et fonctionnellement, avec des preuves qui expirent. Il voit la carte comme
  une bibliothèque à part, que `ezk-scout` utilise comme outil. Décision PO : **enrichir cette fiche**
  plutôt qu'en créer une autre, car c'est le même objet et la même milestone. La priorité ne change
  pas (P2). Le titre change pour dire « ce qui est testé ». Détail dans § Besoin PO. Ce besoin rouvre
  une décision du panel du 2026-10-14 : le groom passe par un panel adverse.
- **Avis de l'agent (2026-11-02).** À la demande du PO : le projet est viable sous la forme d'un
  **registre** dont l'expiration se calcule par empreinte des fichiers, et non d'un cache à
  invalider. L'outil est séparé de l'agent qui le pilote, et commence comme un module de mega-city.
  C'est un avis à ratifier par le panel, pas une décision. Détail dans § Avis de l'agent.
- **Découpage — décision PO (2026-10-14).** « Le meilleur des deux mondes » : la carte est un **outil
  à part** (cette fiche), activable par projet ; les agents la **consultent ou non**. Framing PO :
  « presque un cache de cartographie applicative ». Priorité fixée à **P2** par le PO (voisines en P2).
- **La moitié « agent découvreur » existe déjà.** La fiche explorateur [[20260821210633457]]
  (« Un agent qui utilise l'app d'une PR et propose des fiches ») EST le découvreur de features.
  Cette carte en est la **mémoire**. À enrichir côté explorateur, suite à ta demande :
  le split **agent « en rupture »** (explore, diverge) / **agent qualifieur** (rationalise avec l'app,
  ne filtre pas), et la question du **sas `features/brainstormed`** (dossier de propositions séparé du
  backlog). Cette précision est portée dans la fiche explorateur pour ne pas dupliquer.
- **La lentille bugs est livrée.** `ezk-scout` [[20260910165637000]] chasse les bugs en tâche de fond.
  Même compose possible du cache.
- **Brique d'exploration commune (déjà décidée par le PO, 2026-09-10).** Monter le banc isolé, user
  l'app, collecter des observations, rapporter sous gate humaine. Le cache est la **couche mémoire**
  sous cette brique — à factoriser, jamais dupliquer.
- **Compose, ne refait pas.** Le lanceur universel [[20260917162000501]] et le testbed
  [[0102]] montent le banc ; le mécanisme de captures
  [[20260812104022228]] fournit les images.
- **Interrupteur projet.** Réutiliser le lecteur de config `.vectorz/config.yml` + `ezk config`
  (modèle des plugins optionnels github / ci).
- **Distinct de** [[20260812104022231]] (« DoR — balayer les surfaces produit au grooming ») : celle-là
  liste les surfaces **au grooming**, avant de construire ; ici, carte **vivante** d'une app qui tourne.
- **Distinct de** la carte de la **méthode** (method-map / `ezk dashboard`) : là ce sont les skills ;
  ici, l'app du projet cible.
- **Décisions d'architecture (2026-10-14, `--archi`)** : les six points durs sont tranchés dans la
  section **Architecture** ci-dessus (grain de zone, signal code → zone, emplacement hors dépôt clé par
  SHA, magasin partagé, bornage, parade juge-et-partie). Appuis : ADR-0055, ADR-0043, ADR-074 et le
  précédent `ezk-scout`.
- **Restent ouverts (PO / panel)** : le nom exact de l'interrupteur dans `.vectorz/config.yml` ; le
  seuil de fréquence de la passe complète (à régler sur le taux de dérive mesuré) ; l'opportunité
  d'ajouter le mapping par diff (option B), à décider **après** mesure. Un panel adverse peut ratifier
  l'ensemble avant le `ready` (décisions structurantes).
- **Risque de dérive.** Si le signal explicite est trop souvent oublié, le cache **ment** (zones
  dérivées non vues). La passe complète périodique est le garde-fou ; sa fréquence se règle sur le taux
  de dérive (mesure de suivi).
