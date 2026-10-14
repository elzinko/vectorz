---
id: "20261014113049954"
title: "Cache de cartographie applicative — une carte vivante de l'app que les agents consultent"
type: feature
priority: P2
product: mega-city
milestone:
version:
labels: [test-local]
status: idea
pr:
evidence: none # capacité de méthode (outil + agents) ; preuve = ses tests + un run de démonstration
created: 2026-10-14
---

# 20261014113049954 — Cache de cartographie applicative

**En clair.** Aujourd'hui, quand un agent veut explorer l'app pour trouver des bugs ou des idées,
il remonte le banc et re-parcourt toute l'application à chaque fois. Rien ne se souvient de ce qui
existe déjà. Je propose un **cache de cartographie** : une carte vivante de l'app (ses écrans, ses
actions, le contexte), tenue à jour **au fil des devs**, que les agents lisent au lieu de tout
re-explorer. Un dev qui touche une zone **invalide** son entrée ; une repasse ciblée la reconstruit.

**Si tu arrives frais.** La méthode ezk fabrique des *skills* (capacités) et des *agents*. Deux
existent déjà pour explorer une app qui tourne : `ezk-scout` chasse les bugs, et une fiche
« explorateur » cherche des features. Cette carte leur donne une **mémoire partagée** : au lieu de
redécouvrir l'app à chaque passe, ils consultent une entrée de cache. L'image juste (ta formulation,
PO 2026-10-14) : **presque un cache de cartographie applicative**.

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

- **Un format versionné, committé.** Il décrit les zones et évolue avec l'app. Lisible par un humain
  et par un LLM.
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

Niveau *idée* : ces critères donnent la cible. Les détails (granularité d'une zone, format exact,
noms de commandes) se tranchent au grooming et avec l'architecte.

- [ ] Un **format versionné committé** décrit les zones de l'app (écran / route, actions possibles,
      contexte), lisible par un humain et par un LLM.
- [ ] Un agent de dev peut marquer une zone **invalidée** après l'avoir modifiée, par un signal
      traçable.
- [ ] Une **repasse ciblée** ne visite que les zones invalidées et reconstruit leurs entrées.
- [ ] Une **passe complète** rebâtit tout le cache et **détecte les zones dérivées** (changées sans
      avoir été marquées).
- [ ] Le cache est **activable / désactivable par projet** via la config ezk ; désactivé, les agents
      re-explorent sans erreur.
- [ ] Au moins un agent (`ezk-scout` ou l'explorateur) **consulte** le cache : démontré sur un cas où
      la passe avec cache est plus courte que sans.
- [ ] Un LLM **lit l'état** d'une zone depuis le cache sans re-capturer (ex. « où est l'action X ? »
      répondu depuis le cache).
- [ ] Gate locale verte (typecheck / lint / tests).

**Mesure de suivi** *(après merge)* — sur quelques sprints réels, vérifier qu'une repasse ciblée
coûte nettement moins qu'une passe complète (tokens / temps), et que les dérives rattrapées par la
passe complète restent rares (sinon le signal d'invalidation est trop lâche).

## Comment vérifier

Procédure cible (noms de commandes **indicatifs**, à trancher au groom). À jouer sur l'app jouet du
testbed, pas sur une app réelle.

```bash
# POC sur l'app de démonstration
ezk carto build <app>         # passe complète → écrit le cache versionné
ezk carto invalidate <zone>   # un dev marque une zone touchée
ezk carto refresh             # repasse ciblée : seules les zones invalidées
ezk carto show <zone>         # un LLM lit l'état d'une zone, sans re-explorer
```

- **Ciblage** : après `invalidate` sur une zone, `refresh` ne touche **que** cette entrée dans le
  cache (diff du cache à l'appui).
- **Anti-dérive** : modifier une zone **sans** l'invalider, puis lancer `build` complet — la passe
  **signale** la zone dérivée.
- **Interrupteur projet** : cache désactivé dans `.vectorz/config.yml`, une passe d'`ezk-scout`
  tourne quand même (re-exploration), aucune erreur.

## Glossaire

- `cache de cartographie` — la carte de l'app stockée et réutilisée, comme un cache mémoire : on lit
  l'entrée si elle est fraîche, on la reconstruit sinon.
- `zone` — un endroit de l'app : un écran, une route, un état, avec les actions possibles dans ce
  contexte.
- `invalidation` — marquer une entrée « périmée » parce que le code de cette zone a changé.
- `dérive` — une zone qui a changé **sans** avoir été marquée ; seule une passe complète la rattrape.
- `cache hit / miss` — l'entrée est fraîche, on la lit / elle est périmée ou absente, on la reconstruit.
- `banc` / `testbed` — l'app lancée dans un environnement isolé, explorée sans risque pour l'état réel.

## Notes / décisions

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
- **À trancher au groom / par l'architecte** :
  - Qu'est-ce qu'une « zone », et à quelle granularité ? (route, composant, parcours ?)
  - **Point dur** : comment un agent de dev **signale** qu'il a touché une zone ? Mapping code → zone,
    convention, ou détection par diff ?
  - Format versionné : un fichier par zone, un index ? Où vit-il — dans le dépôt cible, ou hors dépôt
    comme les rapports `ezk-scout` ?
  - Cache partagé entre agents, ou par-branche ?
  - Bornage du coût tokens d'une passe complète.
  - Risque **« juge et partie »** hérité de l'explorateur : un agent qui explore peut taire ce qui le
    gêne. La parade reste à choisir.
- **Risque de dérive.** Si le mapping code → zone est approximatif, le cache **ment** (zones dérivées
  non vues). La passe complète périodique est le garde-fou ; sa fréquence est à régler.
