# PLAN — séquence de travail (vectorz)

## 🎯 Product Goal — brouillon du 2026-08-23, à valider/réécrire par le PO

> **Une méthode LLM-native digne de confiance pour voir et piloter ses produits** :
> la carte dit vrai (compilée des fichiers), le backlog dit l'état réel, et chaque
> cérémonie a un responsable clair — humain ou agent.
> *(Premier Product Goal du dépôt — posé par le lot 1 du plan « trois étages » ;
> le Scrum Guide en fait l'engagement du Product Backlog.)*

> Décidé le **2026-07-26** (roadmap PO) ; **mis à jour 2026-07-30** (fiche 0064 —
> liste unique, ids nus, champ `product:`). Ceci est l'**ORDRE**, pas la priorité
> (la priorité `P0→P3` reste le *bucket d'importance* dans chaque fiche ; ici c'est
> *quoi d'abord*, vu les dépendances et la valeur visible).
> **NOW** = les prochaines N cartes (horizon court) — pas une encyclopédie du stock.
> Source de vérité du **statut** = le front-matter des fiches ; ce fichier est **curé**,
> jamais régénéré. Une seule liste : `features/` (produit = champ `product:`).
> Index généré : [`BACKLOG.md`](BACKLOG.md) · guide : [`README.md`](README.md).

## 🚂 TRAIN DE VERSIONS — décidé le 2026-09-23 (PO Thomas)

> **Nouveau cran au-dessus du jalon : la release.** Le **jalon** (`milestone:`) porte le *sujet*
> (le lot). La **version** (`version:`) porte la *release testable* : un ou plusieurs jalons qu'on
> livre et qu'on éprouve d'un bloc. Le champ `version:` se remplit **au moment de tirer la version**
> (pas 166 fiches d'un coup — ça éviterait des conflits inter-sessions). Composition fiche-à-fiche :
> carte des itérations de la session 2026-09-23. Ordre ci-dessous = *quoi d'abord* ; `P0→P3` reste le
> bucket d'importance.

| Version | Nom | Jalons | Statut |
|---|---|---|---|
| **V0.1** | Le socle dit vrai | Fondation | tête — à groomer (fiches taguées `version: V0.1`) |
| **V0.2** | On teste vite, en local | Local-first + Testbed | 🔵 4 fiches déjà `ready` — carburant product-build |
| **V0.3** | Le backlog dit vrai + on range | Outil-itération + Rationalisation | gated par le verrou `status` de V0.1 |
| **V0.4** | La méthode se tient | Méthode avancée | later |
| **V0.5** | Améliorabilité mesurée | Contrat + observabilité | ⏸️ gated ADR-030 |
| **V1.0** | Ouvrable aux autres | Multi-client + Distribution + Articles | ⏸️ NE PAS PUBLIER (PO) |

> _Détail humain (non parsé — la séquence tirable vit dans « Itération courante » ci-dessous ;
> l'intégration machine du niveau version viendra avec son outillage, fiche `20260824204751403`)._
>
> **V0.1 — Le socle dit vrai** (jalon Fondation) : le graphe compilé, le verrou `status` validé par
> schéma, le chapeau, la carte qui cite ses sources. C'est lui qui débloque l'`apply` de la
> rationalisation (V0.3).
>
> **V0.2 — On teste vite** (Local-first + Testbed) : merge local-first (`20260911213014783`),
> config github (`20260920111652514`), ezk-testbed (`0102`), ezk-scout (`20260910165637000`) —
> **déjà `ready`**, tirées en autonomie par product-build pendant qu'on groome V0.1.

## 🔁 ITÉRATION COURANTE — décidée le 2026-09-12 (PO Thomas)

> Le lot **multi-sprint** à tirer maintenant. Une itération = plusieurs sprints ; **la rétro
> se joue à SA fin**, pas à chaque sprint (sinon trop peu de métriques accumulées — décision PO
> 2026-09-12). Ordre = *quoi d'abord* ; les `in-progress` en tête (déjà commencées → à finir).
> ⚠️ **Prérequis avant tirage** : la plupart des fiches sont `idea`/`in-progress`, pas `ready` —
> **groomer→ready d'abord** (seule `20260910165637000` est `ready`). Reprise des `in-progress` :
> tout leur code livré est **sur `origin/main`**, rien de bloqué en branche (constat 2026-09-12)
> → repartir d'un `origin/main` frais. Ids en clair — voir l'index [`BACKLOG.md`](BACKLOG.md).

**Fondation méthode compilée (= Jalon ①)** — le socle, en tête
- `20260821204737357` — le graphe compilé · **in-progress** (reste-à-faire non entamé) · `build`
- `20260823121712652` — statut validé par schéma (LE VERROU) · **in-progress** · `build`
- `20260826122532943` — chapeau P0 qui cadre les deux ci-dessus · `groom`→`build`

**Preuve en attente**
- `0164` — vz-product-builder : skill déjà mergé, reste la **preuve vécue MCP** ·
  `audit` — planifier une session outillée MCP (décision PO 2026-09-12)

**P0 indépendants**
- `20260911213014783` — merge local-first : main local à jour + propagation GitHub · `groom`→`build`
- `20260920111652514` — ezk config github on/off : plugin github piloté par la config · `build`
- ~~`20260831075615969` — la rétro invoque `ezk-chef suggest` et propose une fiche-recette~~ — **shipped #228**

**Boucle d'auto-amélioration** (capturer → rétro → ranger)
- ~~`20260911224102584` — rétro systématique en **fin d'itération multi-sprint** (top 2-3 appliquées, reste en tampon)~~ — **shipped #229**
- ~~`0081` — carnet de prépa de rétro : chaque session note ses frictions~~ — **shipped #230**

**Déjà tirable**
- `20260910165637000` — ezk-scout : chasse aux bugs en tâche de fond · `ready` · `build`

### ↪️ Sprint SUIVANT — pas dans cette itération (pour ne pas la casser)
- `20260824204751403` — lotir les features en versions & cohérence de lot (outiller le
  niveau « itération » lui-même) · `groom`. À traiter **après** l'itération courante
  (décision PO 2026-09-12).

---

## 🎯 JALONS — feuille de route (consolidation du 2026-09-11)

> Posé après la grande passe de consolidation (bloc A livré #225). **C'est la feuille de route
> courante** ; les sections « NOW / NEXT / LATER » plus bas sont conservées pour l'HISTORIQUE.
> Ordre = *quoi d'abord*. La fiche-verrou `20260823121712652` (statuts `merged`/`split`) est en
> tête : elle débloque l'`apply` de la rationalisation. Ids en clair (pas des liens) — voir l'index.

> **Milestones × thèmes — décidé le 2026-09-15 (ADR-0017 amendement A16).** L'épic est retiré : le
> **milestone** (ce jalon) porte l'**ordre**, le **thème** (`labels:`) porte le **sujet**. Champ retenu :
> **`milestone:`** (posé en phase code ; `version:` réservé aux releases). Placement des thèmes
> (provisoire, réajustable au planning) :
> - **① Fondation** → `carte`, `cli`
> - **② Rationalisation** → `ship`, `recette`, `rationalisation`, `dor`, `revue`
> - **③ Environnement de test** → `testbed`
> - **④ Contrat** → `contrat`
> - **⑤ Capacité UX** → *(ezk-ux)*
> - **⑥ Articles / promo** → `article`, `marketing`
> - **⏸️ Parké** → `observabilite`

**① Fondation méthode compilée** — P0, en cours
- `20260826122532943` (chapeau P0) · `20260821204737357` (le graphe, in-progress) ·
  **`20260823121712652`** (statut validé par schéma + `merged`/`split` — LE VERROU) · `0186` (Skema).
- Fusion à appliquer (quand le verrou est là) : absorber `20260826112620281` (validateur déclaratif).

**② Rationalisation du backlog** — outil « propose » livré (#223), reste l'`apply`
- `20260910231201744` — aggregate : appliquer `merged`/`split` + moteur `llm` (gated sur ①).
- `20260829123707200` — ranger le cluster recette / chef / extraction.
- `20260830194601233` / `20260823121712781` — ship transactionnel + reconcile systématique.

**③ Environnement de test** — débloque un P1 ancien
- Regroupement (milestone ③, thème `testbed`) depuis `20260824163426298` : cœur `0102` (débloquer) + adaptateurs `ezk-preview` / `ezk-device`. *(Plus d'épic — A16.)*

**④ Contrat d'améliorabilité** — GATED ADR-030 (non ratifié)
- Fusionner `0165` + `20260813131259846` (+ `0046` en annexe). Programmer ADR-030 d'abord, sinon rester parké.

**⑤ Capacité UX** — petit, bas
- Créer l'agent `ezk-ux` (ADR-0026) puis brancher `20260829140259165` (règle `no-layout-shift`, déjà livrée #187).

**⑥ Articles / promo** — opportuniste
- Regrouper les articles orphelins par thème `article` + milestone ⑥ *(ex-épics `20260824060737115` / `0163`, à re-router — A16)*.

**⏸️ PARKÉ** : `0051` (observabilité qualité) — réveil = ADR-033 accepté + besoin réel.

**Bloc A consolidation — FAIT (2026-09-11, #225)** : `superseded` 0020 / 0040 / 0028 / 0007 / 0034
(reliquat pilote cop1) ; `0024` détaché en chore autonome ; `0051` parké. (Les 4 premières —
0030 / 0038 / 0017 / 0018 — closes via #221.)

---

## ▶️ NOW — post-ADR-0040 (réaligné le 2026-08-26)

> Réalignement PO du **2026-08-26** : l'ancienne tête « vue d'avancement »
> (`20260823124042842`) est **livrée** → retirée. **ADR-0040** (modèle de fichiers
> compilé + validé) est acté comme la **fondation** du moment. Tête décidée : la
> **carte-loi** (prête, et elle consomme le graphe compilé).

**🔩 Fondation — en cours (session « moteur »), à finir / coordonner :**
- **20260821204737357** — câbler la méthode par un modèle compilé (le graphe) · in-progress
- **20260823121712652** — statut validé par schéma (le validateur) · in-progress
  *(items d'ADR-0040, arrêtés au budget — ne pas les reprendre sans coordination)*

> **Réalignement PO du 2026-09-03** : la carte-loi et le cockpit de sessions sont **livrés**
> → barrés. Nouvelle tête : **la preuve avant/après dans les PR** (fiche `ready`, P1) — la
> règle `pr-before-after-media` existe depuis juillet mais 0 PR sur 90 la respecte (mesure du
> 2026-09-03, fiche 20260902224608715).

**Séquence à tirer :**
1. **20260824061247344** — reliquat de la refonte « trois étages » (lot 4b · vocab DoD ·
   compétences agents) · `groom` → `build`.
- ~~**20260902224608715** — preuve avant/après dans les PR : outiller la règle existante
  (champ `evidence:` sur la fiche, script `pr-evidence.sh` main ↔ branche, étape 8
  d'ezk-sprint, lentille ezk-reviewer + check-pr-body) · **P1**~~ — shipped #207
  (2026-09-03, sprint 1 : revue GO, dogfood réel sur la carte méthode).
- ~~**20260821172716537** — carte-loi : ouvrir LA LOI (règles / bundles / profils + « qui
  active quoi ») en lisant le graphe compilé · `build`~~ — shipped #179.
- ~~**20260825141012293** — ezk-sessions : cockpit de pilotage des sessions (onglet
  `ezk:map sessions` ; colonne supprimable) · **P1**~~ — shipped #188.

⚠️ **En cours ailleurs — ne pas doublonner** : **20260812104022240** (ezk-backlog
aggregate, readyé via #177) — probablement pris par une autre session.

### ↪️ NEXT — après la séquence NOW

- **0067 + 0066** — gate de structure à la génération : `ezk-ezk` ne sort pas un objet du
  domaine hors **DoR/DoD de skill** (option A actée PO 2026-08-25) · `groom` → `build`
- **20260812104022246** — composition comportementale des skills (directive `ezk-archive`
  session-only + idée map « règles composées par skill ») · `groom` (archi)
- **20260825182327490** — pattern « livrable lisible » : template + extracteur + rendu · `groom`
- **20260824163426298** — consolider preview/device/testbed, épic (surface unifiée +
  compétences composables d'agents) · `groom` (archi)

## 🧹 Hygiène préalable (rapide)

- ~~**P0** `build` **0181** — méthode ezk : Opus 4.8 (+ spare sonnet) + restitutions
  « En clair »~~ — shipped #92.
- ~~**P0** `build` **0176** — interdit `git config --global user.*` pour l’identité
  agent ; commits cop1 = local / one-shot only ([#86](https://github.com/elzinko/vectorz/issues/86))~~ — shipped #89.
- ~~`ship` **0059** · **0061** (vectorz)~~ — fait (vérifié au `reconcile` du 2026-07-26).
- ~~`ship` **0094** · **0095** (mega-city)~~ — fait au `reconcile` 2026-07-30 (#54, #55).
- ~~`audit` **0030** (MVP démo Desktop)~~ — **clôturée `superseded`** (2026-09-10) : livrée par
  0027/0031/0094, dépassée par les vues Moniteur / Projets / Sessions.
- ~~**0182** — E4 bis : docs vivants post-BMAD (hygiène P3, complément 0039) · `ship`~~ — shipped #101

## ▶️ NOW — voir et gérer ses projets

0. ~~**0064** — une seule liste de features (champ `product:`)~~ — shipped #66 / #68
1. ~~**0094** — brancher l'émetteur sur vectorz~~ — shipped #54
2. ~~**0095** — faire émettre `ezk-product-build`~~ — shipped #55
3. ~~**0082** — registre {projet · méthode}~~ — shipped #70
4. ~~**0168** — run orphelin = verrou sans clé (bouton abandon siège + erreur actionnable)~~ — shipped #76
5. ~~**0181** — Opus 4.8 + restitutions lisibles~~ — shipped #92
6. ~~**0062** — onglet « Projets » : liste par projet, cliquable → activité · `ship`~~ — shipped #95
7. ~~**0063** — « ajouter un projet » depuis le Moniteur (dossier + install, 2 modes) · `ship`~~ — shipped #97

## ⏭️ NEXT — la méthode se tient + confort

8. ~~**0090** — cohérence de sprint : garde-fou d'ouverture `ezk-sprint:check` (ex-ezk-start) (tâche 1 POC) · `ship`~~ — shipped #99
9. ~~**0079** — graver « tout artefact lu par un humain est lisible »~~ — shipped #74
10. ~~**0091** — mise à plat + glossaire du jargon du backlog · `ship`~~ — shipped #103
11. ~~**0022** — Moniteur : afficher heure/durée/historique déjà collectés · `ship`~~ — shipped #105
12. ~~**0060** — réparer les deux docs d'install périmés (checklist + guide web UI) · `ship`~~ — shipped #107
13. ~~0041~~ — cobaye : banc de test rapide pour sécuriser les devs · ship #113
14. ~~**0089** — finir l'ordonnancement (brancher PLAN sur l'intake)~~ — shipped #52 (constat réconciliation 2026-08-24 : la ligne n'avait jamais été rayée)
15. ~~**0149** — `composes:` : rendre la composition inter-skills mécanique~~ — shipped #121
    *(suite : tier optionnel `delegates:` = fiche 0190)*
16. **0102** — `ezk-testbed` : brique « démarrer un env de test » (PR · branche · local)
    + ADR-0020 · `build` *(attend le dogfood samplerz `make preview-pr`, son repo)*
17. ~~**0183** — pack de review markdown-first~~ — shipped (main c45102b, sprint 0044)
18. ~~**0184** — webapp reporting de run (lot 1)~~ — shipped (main 51d8bf0 ; lot 2 boutons gated 0102)
19. ~~0185~~ — ezk-archive croise branches RÉELLES ↔ PRs ouvertes · ship #117
    *(P1 mega-city — filet anti « ouvrir une PR déjà ouverte », cas #116)*

## ⏳ LATER — pas maintenant

> **Note 2026-09-16 (ADR-0017 A16)** : « épic » ci-dessous = **vocabulaire historique**, retiré le
> 2026-09-15. Le regroupement passe au **thème** (`labels:`) + **milestone** (voir la section JALONS
> plus haut) ; les ex-épics (`0051` / `20260813131737959` / `0163` / `0034` …) sont `superseded`
> (rangés dans `done/`), leurs filles restées indépendantes.

- ⚠️ **Distribution / publication** — 0087 · 0050 · 0078 · 0096 · 0186.
  **NE PAS PUBLIER : pas prêt (décision PO 2026-07-26).** L'ADR de versionnage et la
  question « méthode dans le projet, façon BMAD » s'instruiront quand *le PO* décidera
  d'ouvrir à d'autres.
- ~~**Observabilité qualité** (ex-épic `0051`)~~ — 🗑️ `superseded` (A16) ; thème `observabilite` **parké** (voir JALONS), filles `0052`→`0058` indépendantes. Réveil = ADR-033 accepté.
- ~~**Rationalisation & cohérence de la méthode** (ex-épic `20260813131737959`) — audit 2026-08-13~~
  🗑️ `superseded` (A16) : audit livré (#144), filles `0066`/`0101`/`0161`/`0113` désormais indépendantes (thème `rationalisation`). *(vz-product-builder = `0164`, overlay déjà décidé — hors ex-épic.)*
- **Articles & promo** — 0043/0049 · 0156/0053/0069/0073/0074/0062 · ~~ex-épic `0163`~~ (🗑️ `superseded`, A16 — articles re-routés en JALONS ⑥).
- **Méthode avancée** — 0065→0068 / 0077 / 0080 / 0088 / 0092 / 0100 (dont le seuil de lot ready, voir ci-dessous).
- **2ᵉ méthode / BMAD** — 0162.
- **Archi historique** — ~~ex-épic `0034`~~ (🗑️ `superseded`) · `0024` (périphérie P3, réserve) ; ~~0038~~ **`superseded`** (pilote retiré, 0039 #81) ; **0039 E4 shippé** (#81). *(0017 · 0018 aussi `superseded` le 2026-09-10.)*

## 🚦 Note — lancement autonome (autre session)

Pour qu'`ezk-product-build` / `ezk-sprint` **tire** une fiche, elle doit être **`ready`**
(gate DoR). **Tête NOW (2026-08-24)** : **20260824061247344** (reliquat refonte, ready) puis **20260823124042842** (board lot 0, ready). ~~0022~~ shipped #105 ; tâche 2 (claim/heartbeat) de 0090 reste dans sa fiche pour une passe ultérieure.

Comportement attendu au lancement (déjà en place — checkpoint « aucune fiche ready »,
0100 point 5) : le builder **s'arrête et propose un grooming** au lieu de démarrer à
vide. Le raffinement demandé par le PO le 2026-07-26 — s'arrêter tant que le nombre de
fiches ready est **sous un seuil de lot** (pas seulement zéro) — est capturé dans **0100**
(ex-mc-0064, renumérotée le 2026-07-26 puis migrée dans la liste unique).
