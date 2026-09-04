# Panel adverse — objet sprint léger + cérémonie de planning (2026-09-04)

**En clair.** Trois attaquants indépendants ont attaqué la proposition « objet sprint léger +
cérémonie de planning ». Verdict du juge, **unanime : NO-GO** sur l'objet et la cérémonie. Trois
raisons qui se cumulent : le gate du 23/08 n'est pas franchi (le board est livré mais personne ne
s'en est servi pour nommer un manque daté) ; la mesure de sprint livrée le 30/08 (#191) **n'a
jamais tourné** (`docs/sprints/` n'existe pas, aucun skill n'appelle `sprint:report`) ; la
proposition contredit trois ADR récents (0042 pas de verrou ni d'ordonnanceur, 0043 pas d'état
vivant committé, 0044 frontières dérivées en lecture) et réintroduit un état orphelin déjà
observé. **Survivent** : `ready` en colonne (fiche 652, à finir en mince), `doing` **dérivé** des
branches `feat/<id>` dans le cockpit (jamais écrit), et l'obligation de **faire tourner** le
rapport de sprint avant de rouvrir la question. Le mot « sprint » reste à faire dire vrai.

- Sujet cadré par : demande PO du 2026-09-04 — « distinguer le statut `ready` (groomé, DoR ok)
  du statut `todo` (passe dans le prochain sprint) », « je veux la cérémonie pour mesurer »,
  puis « il me faut un panel adverse car c'est trop important ».
- Précédents : panel du 2026-08-23 ([capture](2026-08-23-panel-adverse-refonte-taxonomie.md),
  findings B-6 et C-7, plan étape 6 : « sprint-as-data se décide quand le board prouve le
  manque »). Le board lot 0 est **livré** depuis (fiche `done/20260823124042842`, vue Plan, vue
  écart) : la condition du gate est atteinte, reste à juger si le manque est prouvé.
- Doctrine en vigueur : ADR-0016 (accepté — rituels scrum, planning = `next --ready-only`,
  vélocité en Phase 2 « sur preuve d'usage »), ADR-0042 (concurrence : visibilité, pas de
  verrou), ADR-0043 (l'état vivant ne se committe jamais), ADR-0044 (métriques de sprint côté
  lecture, frontières = checkpoints), gate anti-surproduction de méta-outillage.
- Attaquants indépendants (sans mémoire de session) : **A** = architecte adverse
  (`ezk-architect`) · **B** = puriste Scrum / Kanban · **C** = pragmatiste YAGNI / implémenteur.
- Juge : session principale (synthèse ci-dessous, rapports verbatim en annexe). Arbitrages
  produit : PO.

---

## Objet soumis

**Proposition « objet sprint léger + cérémonie de planning »** (intention PO) :

1. **Statuts en colonnes** : `idea → ready → todo → doing → done` — `ready` devient une colonne
   (fin du champ date `ready:`), `todo` = engagée pour le sprint, `done` remplace `shipped`,
   `blocked` orthogonal. La fiche `20260823121712652` prévoit déjà `ready` en colonne.
2. **Un objet sprint léger** : { id horodaté, but en une ligne, fenêtre, liste des fiches
   engagées }. Persistance à décider (fichier `features/sprints/<id>.md` committé, champ
   `sprint:` sur les fiches, ou autre).
3. **Une cérémonie de sprint planning** : sélectionne N fiches `ready` → les passe `todo` +
   crée l'objet sprint avec son but. Committée sur `main`. « Pas deux plannings en même temps »
   accepté comme règle de confort. Peut ne contenir qu'une fiche.
4. **`doing` = réservation sans commit** : la session passe la fiche en `doing` dans son
   worktree sans committer (fichier « chaud » pour le détecteur d'intersection d'ADR-0042) +
   branche `feat/<id>-<slug>`. La réservation meurt avec le worktree.
5. **Mesure « engagé vs livré »** en nombre de fiches (pas de points d'estimation), comme
   extension du domaine `sprint-metrics` (ADR-0044) — contrat seulement, l'implémentation
   appartient à une autre session.

Modèle multi-session visé : « on choisit un lot (planning), puis la session enchaîne les
fiches du lot en flux ; sous-agents parallèles possibles, avec réconciliation ».

**Alternative « zéro objet »** (comparée) : sprint = fenêtre entre checkpoints (ADR-0044) ;
colonnes de statut (652) ; `doing`-sans-commit + branche ; le lot = `epic:` (0065,
`--delivery=per-epic`) ou la section NOW de `PLAN.md` ; mesures kanban dérivées (débit, temps
de cycle, coût/fiche) ; aucune cérémonie, aucun objet.

---

## Verdict du juge, finding par finding

Trois lentilles, trois classes de défauts, **aucune contradiction entre les rapports** : A voit
les contradictions de structure, B les mots qui mentent et la mesure qui n'existe pas, C le coût
et la douleur jamais constatée. Fait corrigé par B : **2** fiches `todo` portent un `ready:` daté,
pas 3 (la 3ᵉ, `0102`, est `blocked`).

### Écarté — l'objet sprint (id, but, fenêtre, fiches engagées)

| Attaque | Preuve |
|---|---|
| A-1 / B-3 / C-1 (P0) : **le gate n'est pas franchi** | `board.html:240-243` = le gel du 23/08 recopié ; DoR `842:86-87` « c'est ELLE [la section manques] qui instruira » ; **aucune** note d'usage datée depuis le 24/08 |
| C-2 / B (P0) : **la mesure livrée n'a jamais tourné** | `docs/sprints/` inexistant ; `sprint:report` dans `package.json:36` seulement, appelé par aucun `SKILL.md` ; #191 mergée le 30/08 |
| A-5 / B-7 (P0/P1) : **c'est l'alternative rejetée par ADR-0044** | `0044:50-54` « poser un id de sprint sur les émetteurs — rejeté » ; deux définitions de frontière (déclarée vs observée) |
| A-4 / C-3 / B-7 (P0) : **orphelin garanti** | `in-progress` : aucun writer, aucun closer, 4 fiches à la main depuis 9 à 52 jours ; un planning ouvre, rien ne ferme |
| A-6 (P1) : **deuxième source de vérité** | fichier `sprints/` duplique l'appartenance ; champ `sprint:` = second writer sur la fiche |
| C-8 (P1) : **4ᵉ système scrum** | cop1 `sprint-core` : 12 features de sprint, 0 appelant, encore dans le dépôt ; ADR-0013 §4 |
| C-6 (P1) : **doublon** | les `idea` `20260826121429274` → `20260826072532452` décrivent déjà un sprint dérivé à la clôture, « jamais saisi à la main » |

### Écarté — la cérémonie de planning committée

| Attaque | Preuve |
|---|---|
| B-2 (P0) : **déjà livrée sous un nom honnête** | `plan set` + `ready` + `next --ready-only` ; `PLAN.md` = but daté + Product Goal ; 40 commits, 3 réalignements PO datés |
| A-7 (P1) : **ordonnanceur déguisé** | ADR-0042 D4 mot pour mot : « pas de mécanisme de mise en file à construire » |
| A-8 / C-4 (P1) : **pire client du détecteur d'intersection** | flippe N fiches + `BACKLOG.md` + 3 vues régénérées sur `main`, × 6 worktrees ; piège #169/#170 documenté |
| B-5 (P1) : **replenishment kanban sans WIP, pas un Sprint Planning** | un item, six sessions, zéro limite de WIP ; « pas deux plannings » borne la cérémonie, pas le travail |

### Écarté — `todo` = « engagée pour le sprint »

| Attaque | Preuve |
|---|---|
| A-3 / B-4 (P0) : **retourne le sens de 54-56 fiches** | ADR-0016:103-105 ; 2 `ready` seulement ; 8/10 fiches passent ready→done le même jour (groom au tirage) |
| B-10 (P2) : **l'engagement n'est pas un statut** | carryover = retour arrière de statut à chaque fin de lot ; dimension orthogonale (NOW de `PLAN.md`, ou `lot:`) |

### Écarté — `shipped → done`

| A-10 / C-5 (P1/P2) : **~318 occurrences, 43 fichiers, 15 tests, 4 doctrines, zéro information nouvelle** | `done: boolean` déjà porté par le dossier `done/` (`fiches.ts:25`) ; `ezk-archive/scripts/check.sh:462,632` code `shipped` en dur |
|---|---|

### Écarté sous cette forme, **retenu sous une autre** — `doing`

A-2 / B-6 / C-10 convergent : un `doing` **non committé** ne peut pas être une **colonne** du board,
qui se compile depuis le committé — colonne fantôme. L'**intention** du PO (pas de commit, la
réservation meurt avec le worktree) est juste ; la **représentation** (un statut) est fausse.
**Retenu** : `doing` **dérivé** de la branche `feat/<id>-<slug>` dans le cockpit de sessions
(patron ADR-0044 : côté lecture), jamais écrit dans le front-matter. C-10 : ~20 lignes dans
`deriveSubject` (`sessions-data.ts:89-92`). Limite assumée (A-9) : deux sous-agents dans le
**même** worktree ne sont pas distingués — ADR-0042 D2 le dit déjà.

### Retenu — l'hygiène de statuts (fiche 652)

`ready` devient une colonne, `blocked` un flag orthogonal (cas réel `0102`), validateur
bloquant. Seule brique avec une **douleur documentée** (confusion PO du 23/08). Déjà
`in-progress`, à **finir en mince** — sans rename `shipped`, sans statut `doing` écrit.

### Retenu — faire tourner #191 avant tout

C'est **la pièce que le gate exige** : 5 rapports `docs/sprints/`, câblage en une ligne. Tant
qu'il n'a pas tourné, « la mesure existe déjà » est vrai au catalogue et faux à l'usage.

### Retenu (B) — la variante « Lot = NOW daté, zéro objet »

`plan set` **est** le planning. « Engagé vs livré » se dérive de `git log -- features/PLAN.md`
(chaque réalignement daté = une frontière ; les ids du NOW = l'engagement ; les ships avant le
réalignement suivant = le livré) — même patron que `plan-delta-data.ts`. Suppose d'**amender
ADR-0016 §2** (groom du NOW d'avance, pas au tirage) → arbitrage PO ci-dessous.

### Sur la mesure demandée par le PO

B-8 tranche : pas de vélocité sans points, et « engagé vs livré » **vaut 100 % par construction**
sur des lots de 1 à 4 bornés par le plafond de tokens — c'est la mesure la moins informative ici.
Mesures honnêtes, toutes dérivables sans objet : **débit** (fiches `done`/semaine : 7-11 de W30 à
W34, pic 30 en W35, 3 en W36), **temps de cycle**, **coût médian tokens/fiche**, **âge** des items
en cours. Prévision = Monte-Carlo sur le débit, pas des points.

---

## Le plan par étapes (séquence C, enrichie B — chacune petite, réversible, apprend quelque chose)

| # | Geste | Taille | Ce qu'on apprend |
|---|---|---|---|
| 1 | **Faire tourner `sprint:report`** sur les 5 derniers checkpoints réels → `docs/sprints/` committés ; câbler l'appel en 1 ligne (ezk-sprint étape 9 ou ezk-archive) — *territoire de la session `retrospectives-sprint-metrics`, à lui passer* | S | ce que le rapport répond déjà, et **la donnée qui manque vraiment** — à écrire, datée, dans « ce que le board ne sait PAS montrer » |
| 2 | **Finir 652 en mince** : `ready` colonne, `blocked` flag, migration scriptée (2 `ready:` actifs + 132 `done/`) ; **aucun** rename `shipped`/`in-progress` | M | le validateur bloquant tient-il (0 faux positif) ? la confusion PO tombe-t-elle **sans** objet sprint ? |
| 3 | **Cockpit : id de fiche dérivé de la branche**, croisé avec `status` (`ready` + branche active = doing de facto ; `in-progress` sans branche > N jours = orphelin à rétrograder) | XS | `in-progress` a-t-il encore une raison d'exister comme statut saisi ? |
| 4 | **Après 5 rapports lus** : « engagé vs livré » depuis `git log -- PLAN.md` + `createdAt` dans `RepoSource` (extension de contrat `sprint-metrics`) | S | le chiffre promis, **sans objet ni cérémonie**. S'il est indéterminable → l'objet a sa preuve, sous le nom « lot » ou « run » |

Jamais deux étapes en parallèle ; chaque étape se livre seule.

---

## Arbitrages PO

Questions posées au PO **pendant** le panel : « à la rétro, que veux-tu voir que le board et le
rapport de sprint ne montrent pas ? » — **sans réponse au moment du verdict**, et c'est
précisément la pièce que les trois attaquants réclament ; « un sprint courant partagé, ou un par
session ? » — **sans objet** après le NO-GO.

Restent à trancher (produit, pas technique) :

1. **`todo` : garder ou retirer ?** Garder = sens actuel (« créée, à groomer », 54 fiches).
   Retirer (B-10) = chaîne `idea → ready → doing → done`, les non-ready redeviennent des `idea`
   (ce que `review` propose déjà par staleness), l'engagement devient orthogonal (NOW de
   `PLAN.md`). *Reco du juge : retirer — c'est l'ambiguïté du mot `todo` qui a déclenché toute
   cette question.* — **à trancher**
2. **Amender ADR-0016 §2** : groomer le NOW **d'avance** (lot prêt, buffer borné à la taille du
   NOW) au lieu d'« au tirage » ? Condition de la variante B. *Reco du juge : oui, borné au NOW.*
   — **à trancher**
3. **Le mot « sprint »** (B-1 : troisième sens dans le dépôt) : à instruire dans la fiche
   `20260903085150321` (nommage Scrum/SAFe), **pas ici**. — **rattaché**
4. **Câblage de `sprint:report`** (étape 1 du plan) : appartient à la session
   `retrospectives-sprint-metrics`, active pendant ce panel — **relais**, pas décision.

Statut du panel : **verdict rendu, arbitrages 1-2 ouverts.**

---

## Annexe — rapports verbatim

### Rapport A — architecte adverse

*(agent `ezk-architect`, sans mémoire de session ; chemins rendus relatifs au dépôt)*

**En clair.** NO-GO sur l'objet sprint + la cérémonie committée. Le gate posé par les deux panels précédents n'est pas franchi : le board a été livré, mais personne n'a montré une question que le board ne sait pas répondre — or c'était LA condition (« l'usage du board dira quelle donnée manque VRAIMENT »). Et la proposition rouvre trois décisions archi tranchées il y a moins de deux semaines (0042, 0043, 0044), tout en réintroduisant un état orphelin déjà observé (`in-progress`). La partie saine — colonnes de statut + `doing`-sans-commit + branche — survit **sans** objet ni cérémonie.

1. **[P0] Le gate n'est pas atteint : le board n'a PROUVÉ aucun manque.** Preuve : `features/done/20260823124042842…md` — « le board révélera **par l'usage** quelle donnée manque VRAIMENT (avant d'inventer un objet sprint) » ; capture étape 6 : « quelle donnée manque vraiment (sprint-as-data se décide LÀ) ». La proposition ne cite **aucune** observation d'usage du board où une question serait restée sans réponse. Conséquence : on décide sur une envie de conception, pas sur la douleur mesurée — précisément le déclencheur d'ADR-0013 (« trois systèmes scrum parallèles abandonnés »).
2. **[P0] Contradiction interne : `doing` ne peut pas être à la fois une colonne et une réservation jamais committée.** Le point 1 fait de `doing` une valeur de l'enum `STATUTS` (`avancement-data.ts:12-18`), lue depuis le front-matter **committé** (`fiches.ts:65-78`) et compilée dans le board committé. Le point 4 définit `doing` comme un edit **jamais committé** qui meurt avec le worktree. Conséquence : le board (compilé du committé) n'affichera **jamais** `doing` — une colonne fantôme, visible du seul `git status` local. Une colonne du kanban partagé qui n'existe dans aucune vue partagée n'est pas une colonne.
3. **[P0] La cérémonie surcharge `todo` et casse le tirage.** Aujourd'hui `add`→`todo` (backlog), et le tirable = `todo && ready` (`plan-head.ts:54`). La cérémonie ferait de `todo` = « engagé pour ce sprint ». Preuve : 57 `todo`, dont **3 seulement** avec `ready:`. Conséquence : les 54 `todo`-sans-`ready` (backlog non engagé, état légitime et populeux — ADR-0016 point 2) deviennent faussement « engagés dans un sprint » ; la logique de tête (`plan-head.ts:54,58`) doit être inversée, et il n'existe plus de statut pour « groomé, tirable, pas encore engagé » dans l'enum à 5 colonnes proposé.
4. **[P0] État orphelin déjà prouvé, réplication garantie.** `in-progress` est dans l'enum mais **aucun script ne l'écrit** : seuls `add`→`todo` (`init.sh:80`, template) et `ship`→`shipped` (`ezk-backlog/SKILL.md:413`) posent un statut. Résultat : 4 fiches `in-progress` posées à la main — dont la fiche 652 **elle-même**. Conséquence : le `todo`-engagé (écrit par la cérémonie) et l'objet sprint (qui le ferme ?) hériteront de la même maladie. Un sprint jamais clos = un `in-progress` de plus, en pire.
5. **[P0] L'objet sprint EST l'alternative explicitement rejetée par ADR-0044.** `0044…md:50-54` rejette « poser un id de sprint sur les émetteurs » ; sa décision : frontières = checkpoints **journalisés**, attribution **côté lecture**, zéro instrumentation. Le point 5 de la proposition (« extension du domaine `sprint-metrics`, contrat ») ré-instrumente ce que l'ADR a écarté. Conséquence : `sprint-metrics` aurait **deux** définitions de frontière — le gate journalisé (0044) et l'objet committé — sans dire laquelle fait foi. On rouvre une décision de structure vieille de 5 jours.
6. **[P1] Deuxième source de vérité, quelle que soit l'option de persistance.** Le front-matter est la source (ADR-0016 inv. n°1 ; `fiches.ts`). Option (a) fichier `sprints/<id>.md` listant les « fiches engagées » : duplique l'appartenance déjà portée par le statut de chaque fiche → dérive garantie (fiche `done` encore listée « engagée »). Option (b) champ `sprint:` : ajoute un **second writer** sur la fiche (cérémonie pose `sprint:`+`todo`, `ship` pose `done`). Conséquence : incohérence HEAD-fiche/objet — exactement le « regen concurrent capture un état incohérent » déjà documenté.
7. **[P1] Ordonnanceur déguisé : contredit ADR-0042 D4 mot pour mot.** `0042…md:63-67` : « **Pas d'ordonnanceur de sprints** […] "Un sprint actif à la fois" est une règle de confort […] **rendue visible**, pas un mécanisme de mise en file à construire. » La cérémonie committée + « pas deux plannings en même temps » construit précisément la file refusée. Conséquence : on bâtit la coordination qu'un ADR a choisi de ne pas bâtir, pour un opérateur solo.
8. **[P1] Committer un lot engagé sur `main` fabrique les faux conflits que 0042/0043 combattent.** `0043…md` : committer l'état vivant crée « du churn permanent et de faux conflits inter-sessions ». Une cérémonie qui flippe N statuts et régénère 2-3 vues (BACKLOG + board + plan-view) atterrit sur `main` pendant que **6 worktrees** tournent (confirmé : `git worktree list`). Conséquence : PR re-conflictées en boucle sur les vues générées — le piège déjà mesuré cette semaine.
9. **[P1] `doing`-sans-commit lâche exactement sur le cas parallèle visé par le PO.** ADR-0042 D2 : « deux sessions dans le **même répertoire** = tout est en collision » — le détecteur d'intersection ne distingue pas deux sous-agents dans **un** worktree (le modèle « sous-agents parallèles + réconciliation » du PO). Et un worktree resetté après reconnexion MCP efface la réservation en silence. Conséquence : la réservation meurt là où le PO en a le plus besoin.
10. **[P2] Rayon de migration massif, réversibilité faible.** `shipped`→`done` touche **43 fichiers** code/skills/diagrams (grep, hors `node_modules`) + ~132 fiches `done/` ; le portier de clôture code `shipped` en dur (`ezk-archive/scripts/check.sh:462,632`). Retrait de `ready:` casse `plan-head.ts:54`, `fiches.ts:71`, `plan-view-data.ts`. Un rename en masse corrompt les textes qui comparent deux noms et rate `.html`/`.mmd` en silence. Conséquence : un « sprint courant » committé et partagé ne survit pas à 6 sessions ; seul un objet **par session** survivrait — mais alors il ne doit pas être committé (0043), et l'objet n'a plus de forme viable.

**Variante qui survit — « zéro objet »** : (1) colonnes de statut (fiche 652) : validateur bloquant + `ready` comme colonne, `blocked` **orthogonal** (flag, pas colonne — cas `0102`) ; (2) `doing`-sans-commit + branche `feat/<id>-<slug>`, cohérent avec le détecteur d'ADR-0042 ; (3) le « lot » = `epic:` (ADR-0017, `--delivery=per-epic`) **ou** la section NOW de `PLAN.md` — déjà lus par `plan-view-data.ts`, « sans inventer d'objet sprint » ; (4) mesures kanban dérivées côté lecture depuis `sprint-metrics` + git : débit, temps de cycle, coût-tokens/fiche — jamais de points ; frontières = checkpoints (ADR-0044), inchangé. « Engagé vs livré » se lit déjà : `todo`+`ready` en tête de plan (engagé) vs `done` (livré).

**VERDICT A : NO-GO — condition principale : livrer d'abord la variante zéro-objet (colonnes + `doing`-sans-commit + lot = épic/NOW + métriques kanban en lecture) ; ne rouvrir l'objet sprint que le jour où un usage DATÉ du board produit une question chiffrée qu'aucune de ces briques ne sait répondre — la pièce B-6 (SPRINT.md corrompu par l'entrelacement) se règle par le vocabulaire kanban, pas par un 4ᵉ système scrum.**

### Rapport B — puriste Scrum / Kanban adverse

*(agent `general-purpose`, sans mémoire de session ; référence Scrum Guide 2020 + Kanban Guide for Scrum Teams)*

**En clair.** La proposition réinvente, sous un nom Scrum, une cérémonie qui existe déjà et dit vrai (`PLAN.md` NOW + `plan set` + `next --ready-only`). Le manque qu'elle prétend combler n'a pas été prouvé : les deux instruments livrés pour le prouver (section « manques » du board, rapports `docs/sprints/`) n'ont jamais été utilisés. Seule l'hygiène de statuts mérite un GO, et elle est déjà en cours dans une autre fiche.

Deux faits du brief corrigés à la mesure : **2** `todo` ont un `ready:` daté (pas 3 ; le 3ᵉ est 0102, `blocked`) ; **`docs/sprints/` n'existe pas** (zéro rapport produit depuis #191).

1. **[P0] La proposition donne au mot « sprint » un troisième sens dans le même dépôt, sans retirer les deux premiers.** Preuve : `ezk-sprint/SKILL.md:98` « 1 ligne = 1 feature = 1 PR », `:120` « La boucle de sprint — par feature » (sprint = une fiche) ; `ezk-product-build/SKILL.md:61-62` : `--max-sprints N` compte des fiches construites ; ADR-0044:29-32 : une fenêtre = un checkpoint par fiche. L'objet proposé = N fiches. Guide 2020 : « The Sprint Goal is the single objective for the Sprint ». Conséquence : `ezk-sprint` ne construirait pas un « sprint », `--max-sprints` ne compterait pas des sprints, `sprint-metrics` mesurerait autre chose que l'objet. Le panel B-1 du 23/08 demandait de renommer OU de re-fonder ; la proposition ne fait ni l'un ni l'autre : c'est la 6ᵉ étiquette fausse.
2. **[P0] La cérémonie proposée est déjà livrée, sous un nom honnête : la section NOW de `PLAN.md`, que `next --ready-only` suit depuis la fiche 0089 (shippée #52).** Preuve : `ezk-backlog/SKILL.md:312-322` « PLAN.md d'abord… la priorité est un seau, PLAN.md est la séquence » ; `:431-455` `plan set` = « la séquence décidée… après arbitrage PO… commité sur main » ; `features/PLAN.md:32-35` porte un but en une ligne, daté, et `:3-9` un Product Goal (brouillon) ; 40 commits sur `PLAN.md` en 6 semaines, 3 réalignements datés (08-23, 08-26, 09-03). Conséquence : « choisir N ready, poser un but, committer sur main » = `plan set` + `ready`. L'objet n'ajoute qu'un id à une liste déjà là. Doublon d'artefact, pas manque.
3. **[P0] Le manque n'est pas prouvé : la pièce que le gate exigeait n'a jamais été produite.** Preuve : DoR du board, `features/done/20260823124042842:86-87` : « une section “ce que le board ne sait PAS montrer” liste les manques constatés — c'est ELLE qui instruira (ou pas) le sprint-as-data ». Ce que dit la section, `board.html:240-243` : « Pas de sprint… volontairement gelé… tant que l'usage du board n'a pas prouvé le manque » : c'est le gel recopié, aucun constat d'usage daté. Côté mesure, `done/20260826082120062:47` prévoit `docs/sprints/<date>-sprint-<slug>.{md,json}` ; le répertoire n'existe pas. Conséquence : « la condition du gate est atteinte » est faux. Le lot 0 est livré, pas utilisé. Le seul manque écrit par le board (`:247-249`, « Pas d'historique ») pointe la fiche 20260823121712716, pas un objet sprint.
4. **[P0] `todo` = « engagée pour le sprint » retourne le sens de 56 fiches et ouvre une colonne vide : le stock `ready` est de 2.** Preuve : ADR-0016:103-105 « un `todo` né via `add` n'est pas présumé ready » ; `regen-backlog.sh:170` ; mesure : 56 `todo`, 2 avec `ready:` daté ; sur les 10 dernières fiches `done` avec `ready:`, 8 sont passées ready→done **le même jour**, conforme à ADR-0016:106-107 « on groome quand on s'apprête à tirer ». Guide : les items sont « deemed ready for selection in a Sprint Planning event » **après** refinement, donc avant le planning. Conséquence : un planning qui choisit « N fiches ready » a 2 candidats. Pour former un lot, il faut groomer d'avance, donc amender ADR-0016 §2, et migrer 54 `todo` non ready vers `idea` ou une colonne « à groomer ». « Grooming hors sprint, planning avant » est conforme au Guide ; c'est le câblage actuel qui ne l'est pas, et l'objet sprint ne règle pas ça.
5. **[P1] Un planning « qui peut ne contenir qu'une fiche », pour six sessions parallèles, n'est pas un Sprint Planning ; c'est du replenishment Kanban, et sans limite de WIP, même pas.** Preuve : Guide : Sprint Planning « initiates the Sprint », par « the entire Scrum Team », produit un Sprint Backlog = but + items + plan ; ici Pourquoi ≡ titre de fiche, Quoi = un item (B-9 du 23/08). Kanban : le WIP limité est la condition du flux tiré. Mesure : 5 worktrees, 4 `in-progress` posés à la main dont 0030 depuis juillet ; aucune limite de WIP nulle part ; ADR-0042 D4 fait de « un sprint à la fois » une « règle de confort ». Conséquence : « pas deux plannings en même temps » borne la cérémonie, pas le travail en cours. Plusieurs sprints parallèles chez un solo = une équipe avec WIP 6 sans timebox : le Guide n'a pas de mot pour ça, Kanban en a un.
6. **[P1] `doing` sans commit rend le WIP invisible au board, qui se compile depuis le frontmatter du checkout.** Preuve : `avancement-data.ts:12-18` (STATUTS lus du disque) ; le cockpit sessions (#188) lit, lui, worktrees et branches (ADR-0042 D2). Kanban, pratique n°1 : visualiser le flux. Conséquence : la colonne `doing` du board serait toujours vide ou fausse. La source vraie du « en cours » est la branche `feat/<id>` : dériver `doing` en lecture (patron ADR-0044), ne jamais l'écrire. L'intention (pas de commit) est bonne ; la représentation (un statut) est fausse.
7. **[P1] L'objet sprint crée une deuxième source de vérité pour des frontières que l'ADR-0044 vient de dériver en lecture, et il n'a pas de fin.** Preuve : ADR-0044:29-33, `:50-54` « poser un id de sprint — rejeté » ; `sprint-metrics/domain/duration.ts:9-28`. Conséquence : fenêtre déclarée ≠ fenêtre observée. Un Sprint a une Review qui le ferme ; la proposition a un planning qui l'ouvre et aucun événement qui le termine.
8. **[P1] « Engagé vs livré » est la seule mesure qui exige l'objet, et c'est la moins informative ici.** Preuve : ni « velocity » ni engagement chiffré ne figurent dans le Guide 2020 ; « engagé vs livré » est la Program Predictability Measure de SAFe. La seule session multi-sprints (`docs/sessions/2026-08-26-product-build-4-sprints.md:7,57`) s'est arrêtée « aux checkpoints de budget », ~400k tokens par sprint dont 90-200k de revue. Conséquence : avec des lots de 1 à 4 fiches bornés par `--tokens cap`, le ratio mesure le plafond, et vaut 100 % par construction dès que le planning tient une fiche. Tout le reste (débit, temps de cycle, âge, coût par fiche, blocages) se dérive de git + frontmatter + journal, sans objet.
9. **[P2] Le template `SPRINT.md` décrit déjà un sprint multi-fiches avec but, et la boucle le contredit vingt lignes plus bas.** Preuve : `ezk-sprint/SKILL.md:94-101` vs `:120` ; singleton corrompu par l'entrelacement (B-6 du 23/08). Conséquence : le skill porte déjà en germe l'objet demandé, comme scratch non commité. Avant d'ajouter un objet, aligner ce template sur ce que le skill fait, ou le promouvoir en manifeste du run product-build. Pas les deux.
10. **[P2] Nommage : `todo` n'est pas un mot du Guide ; la chaîne honnête a quatre colonnes, et l'engagement n'est pas un statut.** Preuve : Guide 2020 : zéro occurrence de « todo », « velocity », « story point » ; la fiche 652:44-45,57 propose déjà « `ready` devient une colonne… Ce qu'on ne fait PAS : objets sprint » ; `regen-backlog.sh:103` traite tout statut inconnu comme `todo`. Conséquence : `idea → ready → doing → done`. `todo` meurt : les 54 non-ready sont des `idea` à groomer, ce que `review` propose déjà (ADR-0016:131, staleness). L'appartenance à un lot est une dimension orthogonale (NOW de `PLAN.md`, ou un champ `lot:`). La coder dans `todo` impose un retour arrière de statut à chaque fin de lot (le carryover) : c'est la panne exacte des 56 `todo` d'aujourd'hui.

**Réponse au PO sur l'unité de vélocité.** Il n'y a pas de vélocité ici, et il ne faut pas en fabriquer : le mot n'est pas dans le Guide 2020, et sans points il n'a pas d'unité ; une valeur par fiche serait arbitraire. Les mesures honnêtes, toutes dérivables aujourd'hui sans objet : **débit** = fiches `done` par semaine (mesuré : 7-11 par semaine de W30 à W34, pic 30 en W35, 3 en W36) ; **temps de cycle** ready→done (8/10 le même jour, donc `ready` est posé au tirage) ; **coût** = tokens par fiche en médiane, pas en moyenne ; **âge** des items en cours (0030 : depuis juillet). Prévoir un lot = Monte-Carlo sur le débit observé (Kanban Guide for Scrum Teams), pas des points. Le burndown en fiches sur des lots de 1 à 4 est une marche d'escalier à 3 marches.

**Variante qui survit : « Lot = NOW daté, zéro objet ».** Le planning = `plan set` (but en une ligne + ids, daté, sur `main`) + `ready` posé **d'avance** sur exactement ces ids (amendement explicite d'ADR-0016 §2 : groom au tirage → groom du NOW, buffer borné à la taille du NOW) ; statuts `idea → ready → doing (dérivé des branches) → done`, `todo` retiré. « Engagé vs livré » se calcule en lecture depuis `git log -- features/PLAN.md` : chaque réalignement daté est une frontière, les ids du NOW à la date D sont l'engagement, les ships avant le réalignement suivant sont le livré. Même patron que `plan-delta-data.ts` et ADR-0044, zéro écriture. Si après 5 lots cette dérivation est indéterminable, l'objet a sa preuve, et son vrai nom sera « lot » ou « run », pas « sprint », tant qu'`ezk-sprint` construit une fiche.

**VERDICT B : NO-GO — condition principale : produire d'abord la preuve que le gate exigeait (au moins 5 rapports `docs/sprints/` via le collecteur #191, et un « engagé vs livré » calculé en lecture depuis l'historique de `PLAN.md`), et faire dire vrai au mot « sprint » (renommer le run de fiche OU ne pas appeler « sprint » le lot) avant tout objet ; la seule partie GO immédiate est l'hygiène de statuts `idea → ready → doing → done`, déjà portée par la fiche in-progress 20260823121712652.**

### Rapport C — pragmatiste YAGNI / implémenteur adverse

*(agent `general-purpose`, sans mémoire de session)*

**En clair.** Le board livré le 24/08 dit lui-même, en toutes lettres, que le sprint manque « tant que l'usage n'a pas prouvé le manque » ; depuis, personne n'a écrit une seule ligne datée de manque. L'outil de mesure de sprint (ADR-0044, #191, 30/08) n'a produit zéro rapport et n'est appelé par aucun skill. On propose donc un objet pour nourrir une mesure jamais lancée, et un 4ᵉ système scrum pendant que le 3ᵉ (cop1 `sprint-core`) est encore dans le dépôt. Verdict : NO-GO, avec une séquence de 4 petits pas qui donnent le chiffre promis sans objet ni cérémonie.

1. **[P0] Le manque n'est pas prouvé : le board le déclare lui-même « gelé tant que l'usage n'a pas prouvé le manque », et aucune pièce d'usage n'a été versée depuis.** Preuve : `diagrams/avancement/board.html:240-243` (« Pas de sprint. […] tant que l'usage du board n'a pas prouvé le manque ») ; critère d'acceptation de `features/done/20260823124042842:86-87` : « une section liste les manques constatés — c'est ELLE qui instruira ». Contenu réel de la section : les 3 items gelés recopiés du panel + 2 manques concrets (historique, compteur d'épic) — le second est déjà livré (`childCounts`, `avancement-data.ts:56-58`). Aucune fiche, capture ou note datée « j'ai voulu voir X et je n'ai pas pu » entre le 2026-08-24 et aujourd'hui. Conséquence : la condition du gate du 23/08 était une douleur constatée, pas la livraison du board. Elle est vide, pas atteinte.
2. **[P0] Le rapport de sprint (ADR-0044) mergé il y a 5 jours a produit ZÉRO rapport et n'est câblé dans aucun skill.** Preuve : `docs/sprints/` n'existe pas ; `git log -- docs/sprints` vide ; `sprint:report` n'apparaît que dans `products/mega-city/package.json:36`, aucun `SKILL.md` ne l'appelle ; #191 mergée le 2026-08-30 (`c8f0c45`, `33924c5`). Conséquence : « règle au catalogue ≠ règle déployée » — le domaine existe, la mesure n'a jamais tourné. Empiler un objet sprint dessus, c'est construire le 2ᵉ étage d'une maison sans rez-de-chaussée.
3. **[P0] `in-progress` est déjà l'état orphelin : aucune commande ne l'écrit, 4 fiches le portent à la main depuis 9 à 52 jours ; `todo`-engagé et l'objet sprint n'ont pas plus de closer.** Preuve : grep sur skills/agents/bin/rules → seuls des lecteurs (`ezk-sprint/scripts/check.sh:101`, `regen-backlog.sh:100`, `portfolio.sh`) ; ezk-sprint étape 0 (`SKILL.md:124`) crée une branche, jamais un statut. 0030 in-progress depuis 2026-07-14, 0164 depuis 2026-07-30, 357 et 652 depuis 2026-08-26 (`44f1d9d`, `2d2fa3a` : « merge local, non poussé »). Le seul closer existant est `ship` (`ezk-backlog/SKILL.md:410`) et il a fallu inventer `reconcile` (ADR-0018) parce que même lui dérive. `ezk-product-build --mode auto` tient un checkpoint (`SKILL.md:97-101`), il ne clôt aucun objet. Conséquence : un sprint « ouvert » à vie et des `todo` engagés fantômes — la dérive d'ADR-0018, rejouée sur deux nouveaux champs.
4. **[P1] « Pas deux plannings en même temps » ne repose sur rien : le verrou (0090 tâche 2) n'est pas livré, ADR-0042 D1 l'a écarté par doctrine, et la cérémonie touche par construction tous les fichiers chauds.** Preuve : `features/done/0090-coherence-de-sprint.md:33-38` (« Hors scope de ce sprint ») ; ADR-0042:32-38 ; 5 worktrees mesurés. La cérémonie écrirait N fiches + 1 fichier sprint + `BACKLOG.md` + 3 vues (board 137 Ko, plan-view, plan-delta — tests d'invariant `avancement-board.test.ts`, `plan-view-board.test.ts`, `plan-delta-board.test.ts`) sur `main`. `isHotFile` = tout `features/*.md` (`sessions-data.ts:85-87`). Piège « 2 PR qui regen board.html conflictent » déjà documenté (PR #169/#170). Conséquence : la cérémonie est le pire client possible du détecteur d'intersection ; chaque planning garantit une collision avec toute PR ouverte.
5. **[P1] Le coût, chiffré : ~318 occurrences, 15 fichiers de test et 4 doctrines pour renommer un mot (`shipped`→`done`) dont l'information est déjà portée par le dossier `done/`.** Preuve : `shipped` littéral = 70 src + 13 bin + 73 skills + 146 fiches + 16 docs ; `ready` lu dans `fiches.ts:71`, `plan-head.ts:54-58`, `plan-view-data.ts:83`, `avancement-data.ts:124` + `regen-backlog.sh:42,170`, `portfolio.sh`, `avancement.ts` ; 10 tests vitest + 5 suites bash référencent les statuts ; `deriveEpicStatus` retourne la chaîne `'shipped'` (`avancement-data.ts:107`). Le loader porte déjà `done: boolean` depuis le dossier (`fiches.ts:25`), et le board s'appuie sur `done/` justement pour être « robuste à un statut merged/split » (`avancement-data.ts:97-98`). Conséquence : `done` n'ajoute aucune information ; `doing` renomme un orphelin sans lui donner de writer. Seule la colonne `ready` de 652 a une douleur documentée (confusion PO du 23/08 + cas réel `0102` blocked+ready).
6. **[P1] Le « lot » et le « but » existent déjà trois fois, et deux `idea` décrivent déjà l'objet sprint — dérivé à la clôture, jamais saisi.** Preuve : `epic:` posé sur 35 fiches actives (ADR-0017), `--delivery=per-epic` livré (`ezk-product-build/SKILL.md:242-256`, done/0065) ; `PLAN.md:3-9` Product Goal + `:20-50` NOW ; ADR-0016:110-116 « but de sprint en une ligne journalisé ». Fiches `20260826121429274` (frontmatter par sprint émis par ezk-archive) → `20260826072532452:52-53` : « [pas d']objet sprint saisi à la main — la donnée naît là où le sprint se clôt ». Conséquence : la proposition doublonne 2 fiches existantes et 3 mécanismes livrés ; `ezk-backlog add` l'aurait attrapé.
7. **[P1] « Engagé vs livré » est calculable sans objet : livré-par-fenêtre existe, et « engagé » a un proxy git/gh gratuit.** Preuve : `sprint-metrics/domain/kpi.ts:9-18` (`summarizeShippedFeatures`, fenêtre sur `mergedAt`) ; `repoSource.ts:59` lit déjà `gh pr list --json number,headRefName,mergedAt` — ajouter `createdAt` = 1 champ ; l'id est dans `headRefName` (ADR-0018). Débit dérivé de git en une commande : fiches entrées dans `done/` par semaine = W32 2 · W33 6 · W34 5 · W35 25 · W36 2. Conséquence : le burndown en nombre de fiches = « PR ouvertes dans la fenêtre » vs « `done/` dans la fenêtre », zéro émetteur neuf — conforme à ADR-0044 et à ADR-0016 §5.
8. **[P1] Le cadavre est encore tiède : `SprintEndReportService` (cop1) est l'objet sprint v3, jamais appelé, écarté en août ; la proposition reconstruit son voisin.** Preuve : `products/cop1/packages/sprint-core/src/features/sprint-end-report/application/SprintEndReportService.ts` — seules références : `index.ts` (export) + son propre test ; `SprintDashboardService`, `WSJFService`, `CheckpointService` idem (12 « features » de sprint, 0 appelant vivant). `features/done/20260826082120062:71-77` l'écarte ; ADR-0013:14-15 et ADR-0016:54-55 : « trois systèmes scrum parallèles abandonnés ». Clause ADR-0013 §4 / ADR-0016:146-147. Conséquence : 4ᵉ objet sprint de l'historique, le 3ᵉ encore dans le repo — le gate s'applique littéralement.
9. **[P2] La fiche 652 exclut l'objet sprint et n'est pas finie : bâtir un chantier sprint sur une fondation statut à moitié livrée inverse l'ordre et paie deux migrations.** Preuve : `652:57` ; `652:15-21` restent ouverts ; `PLAN.md:27-30` « arrêtés au budget — ne pas reprendre sans coordination » ; 3 seuls `ready:` actifs sur 57 todo. Conséquence : deux migrations de front-matter sur 291 fiches au lieu d'une.
10. **[P2] `doing` = réservation sans commit + branche : c'est déjà l'état de fait ; il manque seulement que le cockpit lise l'id de fiche dans la branche.** Preuve : `ezk-sprint/SKILL.md:124` impose `feat/<id>-<slug>` ; `sessions-data.ts:15,89-92` (`deriveSubject`) dérive le type du préfixe, pas l'id ; ADR-0042 D2 : le fichier chaud = la fiche. Conséquence : la seule brique neuve utile de la proposition tient en ~20 lignes dans `deriveSubject` — pas un statut, pas un objet.

**SÉQUENCE MINIMALE :**
1. **Faire tourner ce qui est livré** : `pnpm sprint:report` sur les 5 derniers checkpoints réels, committer les 5 rapports dans `docs/sprints/`, câbler l'appel en 1 ligne (ezk-sprint étape 9 ou ezk-archive). *On apprend :* ce que le rapport existant répond déjà à « engagé vs livré », et la donnée qui manque VRAIMENT — à écrire, datée, dans la section « manques » du board.
2. **Finir 652 en mince** : `ready` devient une colonne, `blocked` un flag orthogonal, migration scriptée des 3 `ready:` actifs + 132 `done/` ; aucun rename `shipped`/`in-progress`. *On apprend :* le validateur bloquant tient-il (0 faux positif) ? la confusion PO disparaît-elle avec une colonne, sans objet sprint ?
3. **Cockpit : id de fiche dérivé de la branche, croisé avec `status`** (`todo` + branche active = doing de facto ; `in-progress` sans branche depuis > N jours = orphelin à rétrograder). *On apprend :* `in-progress` a-t-il encore une raison d'exister comme statut saisi ?
4. **Après 5 rapports lus** : ajouter `createdAt` au `RepoSource` + KPI « PR ouvertes vs fiches livrées dans la fenêtre » (extension de contrat sprint-metrics, session `retrospectives-sprint-metrics`). *On apprend :* le taux de complétion en nombre de fiches — le chiffre promis — sans objet ni cérémonie. S'il manque « l'intention » (le but), instruire les 2 `idea` existantes (…274 → …452), pas une 3ᵉ fiche.

**VERDICT C : NO-GO — condition principale : aucune pièce d'usage datée ne prouve le manque (le board le dit lui-même, `board.html:240-243`) et l'outil de mesure livré le 30/08 n'a encore produit aucun rapport ; re-proposable seulement après 5 rapports `docs/sprints/` lus et une ligne de manque datée dans « Ce que le board ne sait PAS montrer ».**
