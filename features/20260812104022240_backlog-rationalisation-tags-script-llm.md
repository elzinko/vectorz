---
id: "20260812104022240"
title: "ezk-backlog aggregate — rationaliser le backlog (regrouper/splitter/épics), moteurs script + LLM"
type: feature
priority: P1 # choisie par le PO (session 2026-08-12)
product: mega-city
epic:
version:
status: todo
ready: 2026-08-26
pr:
created: 2026-08-12
---

# ezk-backlog aggregate — rationaliser le backlog, vite

## En clair

Quand tu crées beaucoup de fiches, le backlog devient illisible. Cette commande
lit tout le stock actif, le regroupe par thème, et te **propose** une remise à plat :
fusionner ce qui se recoupe, découper ce qui est trop gros, ranger sous des épics,
re-prioriser, retirer le périmé. Elle **propose** ; toi tu **tranches** ; un **script
applique**. Jamais d'auto-modification.

C'est le « grand ménage » à la demande — distinct du sanity-check périodique `review`.

## Contexte / Problème

Besoin PO (session 2026-08-12) : quand on **crée beaucoup de fiches**, il faut
périodiquement **rationaliser le backlog** — **regrouper** ou **splitter** les features
en user stories / épics — pour garder un backlog **travaillable**. Sans outil dédié :
prolifération, et tri manuel de plus en plus coûteux (« je crée plein de fiches et je ne
sais plus comment les trier facilement »). Besoin redemandé le 2026-08-26 (« mettre à
plat en restructurant, mergeant, splittant »), décrit comme **structurant** pour la méthode.

**État de la méthode.**
- `review` (fiche `0071`, **shipped**) fait déjà un sanity-check doublons / regroupement
  **par intention** — mais en pur jugement LLM, sans tags ni pré-groupement rapide, et à
  cadence bornée (tous les 5 sprints). C'est de l'hygiène, pas une restructuration délibérée.
- Le champ front-matter **`labels:`** — le modèle de données des tags du mode script — **existe
  déjà** : parsé par `products/mega-city/src/loaders/fiches.ts` dans chaque `Fiche`, et **17 fiches
  actives le peuplent** (ex. `[bmad, lisibilite, doc]`). Le reliquat n'est pas de le **créer** mais
  de le **formaliser** (template + SKILL) et de **backfiller** les ≈122 fiches sans tag. `depends:`
  apparaît dans des fiches mais **n'est pas encore parsé** par le loader.
- Manque : un **geste de rationalisation outillé et rapide**, avec **deux moteurs** (le PO les
  nomme) : un **mode script** (mécanique, sur tags) pour pré-grouper, **et** un **mode analyse
  LLM** pour réconcilier les **faux positifs/négatifs** du script.

## Proposition — le design tranché (2026-08-26)

`ezk-backlog aggregate [options]` — nouvelle **sous-commande** d'ezk-backlog, à lancer à la
demande quand le stock a gonflé.

Comportement :
1. Lit toutes les fiches **actives** (hors `done/`).
2. Les **cluster** par thème (deux moteurs, voir plus bas).
3. Rend un **rapport numéroté** : fusions, splits, épics à créer, re-priorisations, fiches
   périmées. Ouvre par « En clair ».
4. **Ne modifie rien.** Le PO arbitre chaque proposition. Un geste scripté applique
   (statuts + index) — ADR-0001, « le script range ».

Deux moteurs :
- **`script`** — pré-groupe mécaniquement sur `labels:` / `depends:` + heuristiques.
  Déterministe, cheap.
- **`llm`** — passe sur les clusters, rattrape les faux positifs/négatifs, propose épics et
  splits par **intention** (ce que les tags ratent).
- **`both`** (défaut) enchaîne les deux : le script débroussaille, le LLM tranche.

Options :

| Option | Effet | Défaut |
|---|---|---|
| `--scope <all\|<produit>\|Pn\|epic:<id>>` | Restreint la passe (produit, seau de priorité, enfants d'un épic) | `all` (stock actif) |
| `--focus <merge\|split\|epics\|dedup\|reprioritize>` | Cible un type de remaniement | tous |
| `--mode <script\|llm\|both>` | Choisit le moteur | `both` |

Pas de `--apply` : `aggregate` **propose** seulement. L'application fusion/split est un geste
à part (voir **Dépendances**).

## Décision d'architecture (2026-08-26) — sous-commande, pas extension de `review`

Tranché avec le PO (Thomas) : le geste est une **nouvelle sous-commande
`ezk-backlog aggregate`** — ni un mode de `review`, ni une skill séparée.

- `review` reste le **contrôle d'hygiène périodique** (cadence bornée) : validité, doublons
  de surface, staleness. Léger, réactif.
- `aggregate` est le **geste de restructuration délibéré**, à la demande : clustering du stock
  entier, fusion / split / épics, re-priorisation. Lourd, proactif.
- **Anti-chevauchement** : le dédoublonnage **profond** appartient à `aggregate`. Le contrôle #2
  de `review` reste un **signal léger** et **renvoie** vers `aggregate` au-delà d'un seuil de
  stock, au lieu de refaire le clustering.
- **Réutilise** la plomberie ezk-backlog : front-matter = source de vérité, `regen`, index.
  N'invente aucun objet.
- **À confirmer à l'étape Archi du sprint** (`ezk-architect`) avant build ; ratification **ADR**
  possible si la frontière `review` ↔ `aggregate` doit être gravée.

## Critères d'acceptation

- [ ] `ezk-backlog aggregate` lit toutes les fiches actives et rend un rapport « En clair » +
  propositions **numérotées** (fusion / split / épic / re-prio / périmé).
- [ ] La commande **ne modifie aucune fiche** : `git status` propre après un run sans arbitrage.
- [ ] Chaque **fusion** proposée nomme les fiches **sources** et la **résultante**, et décrit la
  provenance (sources → `merged`, back-références dans les deux sens). Idem split → `split`.
  *(Application effective des statuts gated sur [[20260823121712652]].)*
- [ ] `--scope`, `--focus`, `--mode` supportées et documentées. **Les trois modes tournent**, quel
  que soit le taux de tags. `--mode script` regroupe sur les `labels:` présents + heuristiques ; sur
  les fiches **sans tag**, il rend un clustering **partiel** et **affiche sa couverture**
  (« N/139 fiches taguées ») — **jamais de crash, jamais de bascule silencieuse** vers `llm`.
  `--mode llm` n'utilise pas les tags ; `both` = script puis llm.
- [ ] Pour chaque proposition, la sortie indique le **geste d'application** (`ship`, futur
  `merge` / `split`) **sans l'exécuter**.
- [ ] Frontière avec `review` écrite dans le SKILL : `review` **renvoie** vers `aggregate` au-delà
  d'un seuil de stock.
- [ ] Documentée dans le SKILL (`argument-hint` + table d'usage) → visible dans `ezk-help`.

## Comment vérifier

- Lancer `ezk-backlog aggregate` sur le backlog vectorz (≈136 fiches actives). Attendu : rapport
  « En clair » + propositions numérotées ; `git status` propre (rien de modifié).
- `ezk-backlog aggregate --scope mega-city` → ne remonte que les fiches `product: mega-city`.
- `ezk-backlog aggregate --mode script` sur un stock **partiellement tagué** (17/139) → clustering
  partiel + ligne de **couverture** affichée, zéro crash, aucune bascule vers `llm`.
- `grep -n aggregate products/mega-city/skills/ezk-backlog/SKILL.md` → l'entrée d'usage existe ;
  `ezk-help` la liste.

## Dépendances (internes)

- **Statuts `merged` / `split`** (fusion/split avec provenance) → [[20260823121712652]] (modèle de
  statut kanban validé par schéma, todo P1). Sans lui, `aggregate` **propose** fusions et splits,
  mais **appliquer** les statuts d'absorption attend cette fiche. Le moteur de **proposition** LLM
  n'en dépend pas → **cœur buildable maintenant**.
- **Tags `labels:`** (moteur `script`) → le champ **existe et est parsé** (17/139 fiches taguées).
  Ce n'est plus un champ à créer mais un **enabler de couverture** : formaliser `labels:` (template +
  SKILL) puis **backfiller** les ≈122 fiches sans tag (ici ou en fiche fille — arbitrage Archi). Le
  mode `script` est donc **buildable maintenant** sur les tags existants ; sa **qualité** monte avec
  le backfill. (Outiller `depends:`, non parsé aujourd'hui, est un enabler optionnel distinct.)

## Direction PO (2026-08-25) — la fusion/split garde la provenance

Geste voulu : quand un **sujet est recoupé par plusieurs fiches**, le LLM **propose** de les
**fusionner dans une NOUVELLE fiche** qui intègre tout ; les anciennes passent à un statut disant
qu'elles ont été **absorbées**, sans perdre l'historique. Symétrique pour le split.

- **Nouveaux statuts** `merged` / `split` (« merged / splitted » selon le PO) — à ajouter à la liste
  validée par schéma : **couplé à** [[20260823121712652]] (modèle de statut kanban).
- **Back-références dans les deux sens** : la/les fiche(s) **résultante(s)** citent la/les **initiale(s)** ;
  les initiales (`merged`/`split`) pointent la résultante.
- **Invariant** : le LLM **propose** ; le PO arbitre ; un **script** applique (statuts + index) — ADR-0001.
- **Modèle interne d'abord** (décision PO 2026-08-25) : intégrer ces concepts dans la méthode locale ;
  export vers GitHub plus tard (comme pour les PR — cf. [[0174]] `ezk-issues`).

## Notes / décisions

- **Absorbe `0092`** (fermée le 2026-08-23, paquet 1) : `depends:` et `labels:` existent déjà côté
  fiches (et `labels:` est parsé par le loader). Le reliquat n'est plus le **champ** mais le **geste**
  de rationalisation qui l'exploite + le **backfill** des tags.
  Registre : `docs/captures/2026-08-23-fermetures-backlog-paquet1.md`. Étend l'esprit
  de `0071` (review, shipped). **Distinct** de `0065` (lui = granularité sprint/PR,
  pas organisation du stock).
- Voisin de méthode : [[20260812104022237]] (owner de PR, même session).
- Origine : session 2026-08-12. Design tranché et groomé ready le 2026-08-26.
