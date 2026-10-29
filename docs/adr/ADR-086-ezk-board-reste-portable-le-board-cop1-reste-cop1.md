# ADR-086 — `ezk board` reste portable ; le board cop1 reste à cop1 (pour l'instant)

Statut : Proposed
Date : 2026-10-29
Décideurs : PO (après panel adverse : `ezk-architect` + `ezk-reviewer`)

## En clair

`ezk board open` reste pointé sur un board **portable, sans daemon** (aujourd'hui
`ezk-map`). Le board riche de cop1 (`@cop1/web` + daemon) reste **le board DE cop1**, ouvert
par son propre chemin (`mission-control`). On ne repointe pas la commande de la méthode sur le
produit cop1 **tant que** le daemon ne porte pas, pour n'importe quel projet, les capacités de
la méthode. C'est un **« pas encore »**, pas un « jamais ».

## Contexte

Il existe deux tableaux de bord.

Le premier, `products/mega-city/bin/ezk-map.ts`, est le board de la **méthode** : un serveur
`node:http` sans dépendance, port 4173, lancé par `ezk board open` (entrée `board/open` du
manifeste). Il marche depuis n'importe quel projet hôte via `--root`. Il sert les pages
`diagrams/` (carte de la méthode, carte LA LOI, plan), le détail des fiches, des vues
**calculées à la requête** (ADR-0055), un sélecteur de projet. Il a une seule écriture : le
pouce 👍/👎 de revue (`POST /api/verdict`, ADR-0057). Portable, product-agnostique, zéro
install.

Le second, `products/cop1/packages/web` (`@cop1/web`), est une appli React + Vite, port 5173,
lancée par la config `mission-control` de `.claude/launch.json`. Son `vite.config.ts` proxie
`/api` et `/events` vers un **daemon cop1** (`@cop1/app`, port 4242). Les données viennent du
daemon, qui compose le board depuis un registre de projets : c'est un produit multi-projets,
aux vues riches, livré le 2026-10-24. Il ne sert pas `diagrams/` (il y renvoie par un lien) et
n'écrit aucun pouce.

La fiche `features/20261029112813308` proposait de retirer `ezk-map` et de repointer
`ezk board` sur le neuf. En câblant le build (2026-10-29), on a découvert que le neuf n'est pas
un remplaçant portable du vieux : l'ouvrir exige le daemon cop1. D'où ce panel.

## Décision

On retient la **Direction B, révisée par le panel**.

1. `ezk board open` reste pointé sur un board **portable, sans daemon** (aujourd'hui
   `ezk-map`). C'est le board de la méthode, utilisable depuis n'importe quel projet via
   `--root`.
2. Le board riche `@cop1/web` + daemon reste **le board de cop1**, ouvert par `mission-control`.
   Il peut continuer de lier les pages `diagrams/` servies par le board portable.
3. On **ne supprime pas** `ezk-map` et on **ne repointe pas** `ezk board` sur le stack cop1
   **tant que** la condition de convergence (ci-dessous) n'est pas remplie.

### Le motif, énoncé correctement

Le panel a écarté l'argument « inversion de dépendance / DIP » : un manifeste qui **lance un
process** n'est pas un couplage de **code** (le noyau n'importe aucune ligne de `@cop1/app`).
Ce n'est pas la bonne raison.

Les deux vraies raisons :

- **Portabilité zéro-infra.** La commande `ezk board` a un contrat : « marche partout, sans
  rien installer ». `ezk-map` tient ce contrat (conçu deux-racines : pages de la méthode,
  données du projet `--root`). Repointer sur cop1 le casse : tout projet hôte devrait lancer
  le daemon cop1 pour voir son propre board. Sans daemon up, la commande meurt en silence.
- **Propriété des capacités de la méthode.** Pour que la commande marche partout, le daemon
  cop1 devrait **absorber** des responsabilités method-level : servir `diagrams/`, écrire le
  pouce (ADR-0057) pour n'importe quel `--root`. On chargerait le produit du comportement de
  la méthode. C'est ça, le vrai couplage — pas le lien de lancement.

### La condition de convergence (le « gate »)

Cette décision est un **« pas encore »**, cohérent avec la vision cockpit multi-projets
(ADR-074, ADR-079). Le jour où le daemon cop1 **porte** les trois capacités method-level
(servir `diagrams/`, sélecteur de projet, écrire le verdict) pour n'importe quel `--root`,
**et** peut être supposé présent, alors `ezk board` POURRA repointer **sans** rien casser :
à ce moment, ce « produit » sera devenu de l'infrastructure de la méthode. Ce basculement
fera l'objet d'un **nouvel ADR** qui lèvera le présent gate.

## Les deux portes, aujourd'hui et demain

```
AUJOURD'HUI (gate fermé) :
  ezk board open ───▶ board PORTABLE (ezk-map, zéro install, tout --root)
  mission-control ──▶ board de COP1 (@cop1/web + daemon 4242, vues riches)
                        └─ lie les pages diagrams/ servies par le portable

DEMAIN (gate levé, via un nouvel ADR) — SI le daemon devient :
  • method-aware  : sert diagrams/ + écrit le verdict pour tout --root
  • portable      : plus de pré-requis d'install lourd
  • supposable up : présent quand on tape la commande
  ALORS ezk board open ───▶ board cop1 (devenu infra de la méthode)
```

## Options considérées

### Direction A — cop1 devient le board universel
`ezk board` lance le stack cop1 ; `ezk-map` disparaît.
- Compromis : une seule porte, vues riches partout. Mais casse le contrat zéro-infra et oblige
  le daemon à porter des responsabilités de la méthode.
- **Non rejetée par dogme** : c'est la **grande marche différée** (étape 1 de la fiche maître,
  gatée sur le chantier board v0.24). Elle devient la bonne direction **une fois la condition
  de convergence remplie**.

### Direction B révisée — la méthode reste portable (retenue)
`ezk board` garde `ezk-map` ; le neuf reste le board de cop1 ; gate de convergence explicite.
- Compromis : deux portes à **nommer** clairement, et la porte officielle à **clarifier** (la
  fiche se reforme en ce sens). Coût de maintenance d'`ezk-map` quasi nul (zéro dépendance, pas
  de build). Portabilité préservée.

### Direction C — extraire un « service de board » derrière un contrat
Un contrat de board dont le daemon cop1 serait l'implémentation de référence.
- Compromis : élégant si plusieurs produits consomment le board. Mais **C résout un autre
  problème** que celui du panel (« qui lance quoi »), et il n'y a **qu'un seul** consommateur
  aujourd'hui. À rouvrir si un 2e produit réclame le board riche — la minceur de preuve est une
  question à instruire, pas un veto (`agent-ops/preuve-mince-question-pas-veto`). **Écartée
  maintenant.**

## Analyse des trade-offs

Le critère décisif n'est pas la richesse des vues, ni une règle de dépendance abstraite. C'est
le **contrat de la commande de la méthode** : zéro-infra, marche partout. A achète de
meilleures vues en cassant ce contrat **aujourd'hui**, alors que le daemon n'est pas portable.
B garde le contrat au prix d'assumer deux outils de portées différentes — coût réel mais local,
réglé par un étiquetage clair et une porte officielle nette. C paie une généricité sans second
cas. On choisit le moins cher et le plus réversible aujourd'hui (B), **en nommant** le chemin
vers A pour le jour où le daemon sera portable.

## Conséquences

Deviennent plus faciles :
- `ezk board` reste utilisable depuis n'importe quel projet, sans daemon ni install.
- Les capacités method-level (diagrams, pouce ADR-0057) restent chez la méthode.
- cop1 fait évoluer son board riche librement, sans contrainte de portabilité.

Deviennent plus durs / assumés :
- Deux portes coexistent : il faut **nommer** chacune et **clarifier la porte officielle**
  (c'est la plainte réelle de la fiche : « la mauvaise porte est l'officielle »).
- Le board portable n'hérite pas des vues riches du neuf ; ses améliorations restent sans
  daemon.

À revisiter :
- **Quand** le daemon cop1 devient method-aware + portable + supposable présent → nouvel ADR
  qui autorise la convergence (`ezk board` → board cop1). C'est le point de rencontre avec
  ADR-074/079.
- Les idées parkées (carte LA LOI, vue des rétros) enrichissent le board **portable**, pas le
  daemon.

## Effet sur la fiche maître

La décision **retourne** la fiche `features/20261029112813308` :
elle ne « retire plus le vieux board » et ne « repointe plus `ezk board` ». Elle devient
**« clarifier les deux portes »** : documenter que `ezk board` = board de la méthode (portable)
et `mission-control` = board de cop1, et lever l'ambiguïté « le board = ezk-map » dans les
skills / docs / mémoires. Le `blocked: panel` se lève à l'acceptation de cet ADR.

## Provenance

Panel adverse du 2026-10-29. L'architecte (`ezk-architect`) a recommandé la Direction B. Le
reviewer (`ezk-reviewer`) a rendu un **NO-GO sur « B telle quelle »** : il confirme la
destination mais casse trois points du raisonnement (le motif DIP est faux ; B doit être un
gate « pas encore », pas un absolu ; « nommer » est un remède trop mince). Le présent ADR est
la **B révisée** qui intègre ces corrections.

Note registre : le tableau de `docs/adr/README.md` s'arrête à l'ADR-037 et ne liste pas les ADR
récents (074, 078, 079, 084, 085) ; aucune ligne 086 n'y est ajoutée, par cohérence avec ses
voisins.
