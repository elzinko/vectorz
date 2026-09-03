---
id: "20260903085150321"
title: Aligner le vocabulaire des commandes sur Scrum/SAFe (doctrine de nommage — dont ezk-product-build → train/increment)
type: refactor
priority: P2
product: mega-city
version:
epic:
labels: [nommage, methode, doctrine]
status: idea
ready:
pr:
created: 2026-09-03
---

# Aligner le vocabulaire des commandes sur Scrum/SAFe

## En clair

Aujourd'hui, `ezk-product-build` porte le nom du **résultat** (« construire un produit »), pas du
**rythme**. Toutes les autres commandes nomment un rôle ou une cérémonie Scrum : sprint, retro,
backlog, pm, reviewer. `product-build` est l'intrus. La question ouverte par le PO
(2026-09-03) : faut-il **ancrer les noms de commandes dans un lexique agile connu** (Scrum, et
SAFe pour ce que Scrum n'a pas), plutôt que dans des noms ad-hoc ? Ce n'est pas un simple rename,
c'est une **doctrine de nommage** à trancher (elle produira un ADR), dont **un** rename découle.

## Contexte / Problème

- **Le malaise (PO, 2026-09-03).** « Ça m'embête d'avoir des commandes qui n'ont pas de rapport
  dans leur nom avec le langage de la méthode Scrum ou SAFe. » Exemple type : `ezk-product-build`.
- **Pourquoi c'est réel.** Scrum s'arrête au sprint : il n'a **aucune** cérémonie au-dessus du
  sprint. Or `ezk-product-build` est précisément l'étage au-dessus — la boucle qui enchaîne les
  sprints, ajoute les étapes inter-sprint, et où le PO décide *quelle* fiche et *quand*. Ce concept
  (« livrer en continu à travers les itérations »), c'est ce que **SAFe** a ajouté par-dessus
  Scrum : le **train** (Agile Release Train) qui roule sur des **incréments** (Program Increment).
- **Ce n'est pas couvert par les fiches de nommage existantes.** La fiche
  [20260813131737962](20260813131737962_nommage-catalogue-adr0022.md) et l'épic
  [20260813131737959](20260813131737959_rationalisation-coherence-methode-epic.md) règlent les
  **préfixes** (`ezk-`/`supervision-`/`vz-`) et le **catalogue** (README, ADR-0022). Ils ne posent
  **pas** la question du *lexique métier* des noms. Angle distinct → nouvelle fiche, liée, pas un
  doublon.

## Proposition

Traiter la question comme une **décision de doctrine**, pas un rename ponctuel. Deux sous-décisions
à poser dans un **ADR** (ADR-0022 gouverne déjà le nommage ; ADR-0039 la taxonomie en trois étages) :

1. **La règle de nommage.** Ancrer les noms dans un lexique agile : **Scrum** là où Scrum a un mot ;
   **SAFe seulement** pour l'étage que Scrum n'a pas (au-dessus du sprint). Bénéfice : un principe
   réutilisable pour toute commande future, pas un correctif à l'unité.
2. **Le seul rename qui en découle** : `ezk-product-build` → un nom de **cadence**.
   - Version SAFe : **`ezk-train`** (le train qui roule sur les incréments) — l'emprunt le plus
     honnête pour cet étage.
   - Version 100 % Scrum : **`ezk-increment`** (l'incrément produit est le seul artefact Scrum qui
     traverse toute la livraison).
   - `ezk-sprint` **ne bouge pas** : c'est déjà le bon mot Scrum.

**Options examinées à la capture (arbitrage au grooming) :**

| Option | Idée | Verdict provisoire |
|---|---|---|
| 1 — `/ezk-train` (SAFe) | Renommer product-build avec le mot SAFe de l'étage au-dessus du sprint | **Recommandée** — juste conceptuellement ; risque = un seul mot SAFe dans un lexique Scrum → à encadrer par la règle #1 |
| 2 — mode de `/ezk-sprint` (`--chain`) qui remplace product-build | Une commande de moins, nom « sprint » | **Écartée** — fond la boucle de décision du PO **dans** la commande du scrum master ; re-soude une séparation tracée exprès |
| 3 — doctrine + ADR (rename qui en découle) | Trancher la règle une fois, le rename tombe tout seul | **Recommandée** — c'est le cadre de 1, pas une alternative |

### Catégorie du nom : événement, artefact ou rôle (nuance PO, 2026-09-03)

Scrum range ses objets en **trois familles** :

- **événements** (ce qui se passe dans le temps) : le Sprint (le contenant), le Planning, le Daily, la Review, la Rétro ;
- **artefacts** (ce qui est produit, un livrable) : Product Backlog, Sprint Backlog, **Incrément** ;
- **responsabilités / rôles** (le qui) : PO, Scrum Master, Devs.

Conséquence directe pour le nommage :

- **`ezk-sprint` est nommé d'après un événement** — le timebox de l'itération (« l'étape »).
- **`ezk-increment` serait nommé d'après un artefact** — le livrable. Deux catégories différentes → légère incohérence **en vocabulaire Scrum**.

Ce qui sauve `increment` : le mot **n'a pas le même sens en Scrum et en SAFe**.

- Scrum : Incrément = le **livrable** (artefact).
- SAFe : **Program Increment (PI)** = un **timebox** de plusieurs itérations (une **cadence**), donc un conteneur de temps comme le sprint en plus grand.

Donc `ezk-increment` n'est cohérent avec `ezk-sprint` que **si on assume le sens SAFe** (PI = la cadence au-dessus du sprint) ; au sens Scrum, un lecteur comprend « le livrable » et se perd. À l'inverse, **`ezk-train`** (Agile Release Train) nomme l'**équipe / le véhicule**, pas un timebox : non ambigu, mais engage la métaphore SAFe entière.

**Constat de fond** : les commandes ezk **ne tombent pas toutes dans une seule famille** — `sprint`/`retro` = événements, `backlog` = artefact, `pm`/`reviewer` = rôles. « Aligner sur le vocabulaire » ne veut donc pas dire « tout nommer dans la même catégorie », mais **pour chaque commande, prendre le terme méthodo qui décrit le mieux ce qu'elle fait**. Pour la boucle au-dessus du sprint, **aucun mot n'est parfait** (increment ambigu ; train = l'équipe) → raison de plus pour un **ADR + panel**, pas une décision à chaud.

**Garde-fou n°1 — ne PAS fondre product-build dans `ezk-sprint` (option 2).** Les deux skills
encodent une frontière que la méthode utilise : `ezk-sprint` = le scrum master qui exécute **un**
sprint (BDD→TDD→gate→revue→PR) ; `ezk-product-build` = le product owner **au-dessus**, qui décide
quoi/quand, en boucle. product-build **compose** sprint (il ne le ré-implémente pas). Un `--mode`
glisserait la décision du PO dans la commande du scrum master, grossirait la grosse commande et
brouillerait *qui décide*. La séparation doit survivre au rename : le train reste **au-dessus** du
sprint, jamais un mode de celui-ci.

**Garde-fou n°2 — le rename coûte.** Références croisées, re-bind des profils, mémoire des doigts,
docs. La fiche [20260813131737962](20260813131737962_nommage-catalogue-adr0022.md) documente les
**résidus** qu'un rename laisse (`applyGlobalPlan` n'itère que le nouveau plan → l'ancienne entrée
subsiste). Donc la doctrine doit **valoir le coup** avant de renommer, et le rename doit passer par
le retrait gardé des anciens noms (déjà outillé, PR #162).

## Critères d'acceptation (brouillon — DoR au grooming)

- [ ] Un **ADR** tranche la doctrine : quel lexique pour quel étage (Scrum jusqu'au sprint, SAFe
      au-dessus), et *pourquoi ce périmètre d'emprunt* (pas de cargo-cult SAFe complet).
- [ ] La décision sur `ezk-product-build` est actée : renommé (`ezk-train` **ou** `ezk-increment`)
      **ou** gardé sciemment, avec justification.
- [ ] Si rename : **0 résidu** de l'ancien nom (mêmes exigences que la fille A / PR #162), profils
      re-bindés, catalogue à jour.
- [ ] La **séparation** product-build/sprint est préservée : la commande de l'étage supérieur
      **compose** ezk-sprint, elle n'en est jamais un mode.
- [ ] Passage au **panel adverse** (décision structurante) avant application.

## Comment vérifier

- **La doctrine existe et fait loi** : un ADR (namespace mega-city) énonce la règle Scrum/SAFe ;
  `ezk-help` / le catalogue la reflètent.
- **Le rename est propre** (si retenu) : `grep -r "product-build"` ne rend plus que des mentions
  historiques assumées (ADR, fiches datées) ; `grep -r "<ancien nom>"` dans `~/.claude/skills` et
  `~/.claude/agents` = 0 entrée résiduelle après re-bind.
- **La frontière tient** : le SKILL.md de la commande renommée dit toujours qu'elle *compose*
  ezk-sprint (backlog + brainstorming + sprint), sans réimplémenter la boucle de sprint.

## Notes / décisions

- **Statut `idea`** : direction/question capturée cheap, à groomer quand le PO la tirera. La
  priorité P2 s'aligne sur les autres fiches de nommage (arbitrée PO le 2026-09-03).
- **PO 2026-09-03 — la règle de nommage n'est PAS tranchée** (« je ne sais pas »). Elle reste la
  question ouverte à décider au grooming / dans l'ADR.
- **PO 2026-09-03 — penche pour `ezk-increment`** plutôt que `ezk-train`, **sous réserve** de
  l'ambiguïté artefact (Scrum) vs cadence (SAFe) documentée ci-dessus. Non tranché.
- **Autonome, pas rattachée à un épic** : l'épic
  [20260813131737959](20260813131737959_rationalisation-coherence-methode-epic.md) est en voie de
  clôture (solde porté par le lot 4b) et son périmètre est l'*hygiène* (préfixes/refs/catalogue),
  pas la *doctrine* de lexique. Le PO tranchera au grooming s'il faut la rattacher.
- **Voisines** : nommage catalogue
  [20260813131737962](20260813131737962_nommage-catalogue-adr0022.md) ; carte des rôles d'analyse
  [20260813131737971](20260813131737971_carte-roles-analyse-methode.md) ; ADR-0022 (nommage),
  ADR-0039 (taxonomie trois étages).
- **Rappel méthodo** : Scrum = mono-équipe, borné au sprint (pas de cérémonie au-dessus). SAFe
  ajoute l'**itération** (= sprint), le **Program Increment** et l'**Agile Release Train** (le
  « train ») pour la livraison continue au-dessus du sprint.
