# En clair : le vocabulaire du backlog et de la méthode

> **Glossaire** (fiche 0091) — chaque terme interne traduit en mots simples, avec un
> **verdict** : **garder** (terme utile, à définir une fois) · **traduire** (garder
> l'idée, dire autrement à l'ouverture) · **supprimer** (brouillage, à éviter face au PO).
> Règle source : [`human-facing-lisibility`](../products/mega-city/rules/documentation-guidelines/human-facing-lisibility.md)
> (fiche 0079).

Ce document couvre le jargon du commentaire [PR #37](https://github.com/elzinko/vectorz/pull/37#issuecomment)
(« verrous », « borne anti-veto », « panel ») et des captures récentes (`2026-07-18-retro`,
`2026-07-16-carte-auto-amelioration`, `2026-07-19-topologie`).

---

## Backlog et plan

| Terme | En clair | Verdict |
|---|---|---|
| **Backlog** | La liste ordonnée des choses à construire (les « fiches »). | **garder** |
| **Fiche** | Un sujet = un fichier markdown (`features/NNNN-slug.md`) avec statut, priorité, critères. | **garder** |
| **Prête (ready)** | Assez précise pour construire : problème, valeur et critères posés ; tampon `ready: AAAA-MM-JJ` posé par le gate. | **traduire** — dire « prête à construire », pas « ready » seul |
| **DoR** | *Definition of Ready* — la check-list « prête à construire » (problème, valeur, critères). | **traduire** — « check-list prêt à construire » en ouverture |
| **DoD** | *Definition of Done* — la check-list « vraiment terminée » (tests, revue, merge…). | **traduire** — « check-list terminée » |
| **Gate** | Point de contrôle bloquant (ex. : le tampon « prête », les tests avant fusion). | **traduire** — « point de contrôle » ou « étape bloquante » |
| **Groomer** | Affiner une fiche avant construction (problème, valeur, critères) — sans encore la marquer prête. | **traduire** — « affiner la fiche » |
| **Ship / livrer** | Marquer une fiche terminée, la déplacer dans `done/`, régénérer l'index. | **traduire** — « marquer livrée » |
| **Regen** | Régénérer `BACKLOG.md` depuis le front-matter — jamais éditer l'index à la main. | **traduire** — « régénérer l'index » |
| **Reconcile** | Croiser fiches actives et PR mergées pour proposer les livraisons oubliées — ne change rien seul. | **traduire** — « rattraper les fiches mergées oubliées » |
| **PLAN / NOW / NEXT** | Fichier curé de la **séquence** décidée ; NOW = prochaines cartes courtes, pas tout le stock. | **garder** — avec traduction : « ordre de travail » |
| **Priorité P0→P3** | Bucket d'**importance**, pas l'ordre de travail (l'ordre = PLAN). | **garder** |
| **Épic** | Fiche regroupante — jamais construite directement ; on tire ses enfants. | **traduire** — « chantier regroupant plusieurs fiches » |
| **Idée (`idea`)** | Direction capturée mais pas encore affinée — hors flux actionnable P0→P3. | **traduire** — « idée non affinée » |
| **Skema** | Migrations de layout du dossier `features/` — proposées, jamais auto-appliquées. | **garder** (interne outillage) |

---

## PR, revue, décisions PO

| Terme | En clair | Verdict |
|---|---|---|
| **PR (pull request)** | Proposition de fusion de code, relue et testée avant d'entrer dans `main`. | **garder** |
| **Squash-merge** | Fusionner une PR en un seul commit propre sur `main`. | **traduire** — « fusion en un commit » |
| **Verrou** | Condition explicite du PO avant de merger ou publier (ex. PR #37 : vocabulaire ou topologie du guide). | **traduire** — « condition du PO avant merge » — **jamais** seul en ouverture |
| **Borne anti-veto** | Délai après lequel une rétention prolongée est **resoumise** au PO comme décision à prendre — pas un veto automatique. | **traduire** — « rappel au PO après X jours » |
| **Panel (contradictoire)** | Plusieurs personas (merge / tenir / scinder) débattent, puis un juge tranche — format de revue structurée. | **traduire** — « revue à plusieurs voix » |
| **PR rétrécie / scinder** | Retirer du diff ce qui est déjà mergé ou controversé ; garder une PR focalisée. | **traduire** — décrire ce qui reste dans le diff |
| **MUST / SHOULD** | Niveau d'une règle : obligatoire / recommandé (contournable en le justifiant). | **traduire** — « obligatoire » / « recommandé » |

---

## Méthode ezk et supervision

| Terme | En clair | Verdict |
|---|---|---|
| **LA LOI (`rules/`)** | Règles versionnées qui guident sprint, revue, docs — contrôlées par `ezk-steward`. | **traduire** — « les rules du repo » |
| **Lentille** | Agent qui regarde le même sujet avec un angle imposé (architecture, qualité, dev, produit). | **traduire** — « relecteur spécialisé » |
| **Juge de cohérence** | Vérifie qu'une proposition ne contredit pas une règle existante (`ezk-steward`, chief-judge). | **traduire** — « vérifieur de cohérence » |
| **Rétro — Sujet A** | Amélioration **déclenchée par toi** (cérémonie `ezk-retro`). | **traduire** — « amélioration manuelle de la méthode » |
| **Rétro — Sujet B** | Amélioration **déclenchée par un chiffre** (mesureur tiers) — contrat d'améliorabilité, plus tard. | **traduire** — « améioration pilotée par métrique » |
| **Worktree** | Copie de travail git isolée (souvent une branche dans un dossier à part). | **garder** — terme git standard |
| **Moniteur** | Application qui lit le journal de supervision et affiche les runs — aveugle à la méthode. | **garder** |
| **Carte (Moniteur)** | Bloc UI par run : état, gate en cours, projet, durée. | **traduire** — « fiche de run » — ne pas confondre avec *carte backlog* |
| **Carte (backlog / doc)** | Vue d'ensemble courte (ce fichier [`backlog-carte.md`](backlog-carte.md), captures `docs/captures/`). | **traduire** — « vue d'ensemble » |
| **Carte d'émission** | Adaptateur qui traduit une surface observable → événements du contrat (ADR-032). | **garder** — sens technique distinct |
| **Kit émetteur** | Outils MCP qui écrivent le journal (`run_start`, `gate_reached`, …) — passage obligatoire. | **traduire** — « outils d'émission du journal » |
| **Sidecar** | Couche qui **installe** l'émission dans une méthode qu'on ne possède pas (ex. BMAD). | **traduire** — « couche d'installation de l'émission » |
| **Run orphelin** | Run jamais clôturé — bloque toute nouvelle émission jusqu'à abandon explicite (0168). | **traduire** — « run non terminé qui bloque » |
| **Topologie (supervision)** | Où vivent superviseur, journal et config : par projet, mutualisé, ou lecture seule (capture 2026-07-19). | **traduire** — « où tourne quoi » |
| **Digest** | Résumé matinal automatique (contrat améliorabilité FR59) — **pas encore construit** ; la carte backlog en est le dogfood manuel. | **supprimer** en ouverture tant que non livré |
| **Intake** | Début de sprint : reconcile + choix de la prochaine fiche prête. | **traduire** — « ouverture de sprint » |
| **Claim / heartbeat** | Verrou d'écriture de sprint côté LLM (0090 tâche 2) — empêche deux agents sur la même fiche. | **traduire** — « verrou de sprint » (contexte technique seulement) |

---

## Codes et sigles à éviter en ouverture

| Terme | En clair | Verdict |
|---|---|---|
| **R1 / R2 / …** | Codes internes de round-table / rétro — **illisibles sans légende**. | **supprimer** en ouverture |
| **DoR / DoD seuls** | Sigles anglais — OK en annexe, pas en tête de restitution. | **supprimer** en ouverture |
| **Verrou / borne anti-veto seuls** | Portent un sens juridique interne — toujours expliquer la condition concrète. | **supprimer** seuls |
| **Panel seul** | Ambigu (UI ? revue ?) — préciser « revue à plusieurs voix ». | **supprimer** seul |
| **Gate seul** | Dire « étape bloquante » ou nommer l'étape (tests, revue, merge). | **supprimer** seul |
| **Ship seul** | Dire « marquer livrée » ou « fusionner et archiver la fiche ». | **supprimer** seul |

---

## Vocabulaire install / guide (PR #37)

Termes du débat sur le guide d'installation — **décision PO suspendue** au moment de la PR.

| Terme | En clair | Verdict |
|---|---|---|
| **« La boîte noire de tes agents autonomes »** | Accroche marketing du guide — comparaison aviation écartée par le PO. | **traduire** — accroche à retrancher ou reformuler |
| **Supervision → …** | Renommage proposé dans le guide (alerte→blocage, reprise→feu vert…) — **non condition** au merge #37. | **traduire** — lister le renommage concret, pas le plan de rename |
| **Projet supervisé / inscrit** | Où le MCP sait quel dossier suivre — lié à 0082 (registre) et 0087 (plugin). | **traduire** — « projet enregistré pour supervision » |
| **Usine** | Métaphore « usine à agents » dans d'anciens docs — source de confusion. | **supprimer** — préférer « méthode » ou « flux de travail » |

---

## Comment utiliser ce glossaire

1. **Restitutions au PO** — ouvrir par « En clair », renvoyer ici pour le détail technique.
2. **Nouvelle fiche ou PR** — si un terme de ce tableau apparaît en titre ou en ouverture,
   appliquer le verdict (traduire ou supprimer).
3. **Mise à jour** — lors d'une revue backlog (`ezk-backlog review`) ou d'une rétro qui
   invente un nouveau sigle : ajouter une ligne avec verdict.
