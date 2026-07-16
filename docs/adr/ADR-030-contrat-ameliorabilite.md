# ADR-030 — Contrat d'améliorabilité v0.1 (jumeau du contrat de supervisabilité)

**Statut :** **PROPOSÉ** — ne sera gravé (Accepté) qu'après **panel adverse**
(**manuel en v0.1** : procédure éprouvée des panels 2026-07-13/15 — la fiche 0057
ezk-challenge est au statut idea et l'outillage n'existe pas encore) **puis arbitrage
PO**, comme le contrat de supervisabilité. Idéalement après la **première boucle fermée
vécue** (fiches MVP A/B), pour figer sur du vécu plutôt que sur du papier.
**Déciders :** elzinko (PO). Synthèse issue d'un concours de 3 concepts + 3 juges,
**révisée après passe de réfutation (3 réfutateurs, findings confirmés appliqués)**
(2026-07-16) ; ce texte est la proposition de l'architecte-synthétiseur.
**Prépare (sans les revendiquer) :** [ADR-021](ADR-021-megacity-integration-boundary.md)
Phase 3 (« rétrospectives cop1 → capture → re-bind », qui vise l'auto-modification des
**règles** — FR60) et la question ouverte 6 d'[ADR-022](ADR-022-control-plane-ontology.md)
(mécanique d'ajout de **règles** en cours de projet). Constat de réfutation : l'allowlist
v0.1 **exclut les rules** et LA LOI est surface gelée — les claims « formalise / remplit »
sont donc dégradés en « prépare / route vers le PO ». L'alternative (étendre l'allowlist à
« ajout de rules via `capture kind=rule` sous approbation PO ») est un **arbitrage de
périmètre produit** (voir liste). Dans tous les cas, le registre **définit « LA LOI »**.
**Compose sans rouvrir :** le contrat de supervisabilité v0.1 (gelé) — lecture seule de
`.supervision`, aucun ajout à son schéma, et **numérotation de décisions propre (A1,
A2…)** : les décisions gelées D8/D9/D12 sont citées comme précédents d'inspiration,
jamais comme autorités étendues.
**Ne révise PAS :** ADR-029 (s'y adosse : la fiche moisson d'époque 1 suit sa Décision 2),
la fenêtre DP8, la policy de siège 0028 (gated), la démo 0030 (in-progress).

## Contexte

Demande PO (2026-07-16, quasi-verbatim) : « un moyen (contrat, paradigme…) auquel une
méthode adhère et qui permet de l'auto-améliorer — les agents, les skills, etc. Orienté
métier et pas methodology-tight : c'est carrément un contrat à part, dans la méthode. »

Trois douleurs vécues motivent le chantier : les PRs d'agents retouchées à la main, les
leçons ré-expliquées à chaque session, les rule candidates de rétro qui meurent en
markdown. Trois faits d'état des lieux : `products/mega-city/journal/learnings.md` ne
contient aucune ligne réelle depuis le 2026-06-25 (le flywheel capture, livré en
done/0002, n'est pas nourri) ; le pipeline d'amélioration d'époque 1 dort dans
**sprint-core** (improvement-persistence, rule-auto-apply, improvement-review),
ceremony-engine et quality-intelligence — rattachement PRD corrigé : **Epics 9 + 12**
(FR56-62 côté Rules Engine ; FR102-108, FR46, FR60 côté Improvement Review) — dont
**seule** la part ceremony-engine/quality-intelligence/`_bmad-output` est promise à la
résorption L5/E4 ; le retrait de BMAD est acté (ADR-029, fiches 0038/0039) — tout
mécanisme logé dans la méthode mourra avec elle.

Garde-fous non négociables du PO : décisions produit et irréversibles humaines
(frontière explicite) ; construire→prouver→retirer, jamais de big-bang ; panel adverse
avant toute gravure structurante. Les 4 STOP sont portés par ADR-0011, **actuellement au
statut « proposé »** — la consolidation de cette chaîne normative (statuer ADR-0011 avant
gel, ou recopier les 4 STOP en texte normatif de première main daté) est un arbitrage PO.

## Décision (proposée)

### Décision A1 — Un contrat à part, au catalogue, avec son foyer canonique

Créer le **contrat d'améliorabilité v0.1** : artefact versionné (URI dédiée, v0.x
additif, breaking ⇒ nouvelle URI, classes de conformité A/B — la grammaire du contrat de
supervisabilité ; **décisions numérotées A1, A2…**), composé de : un texte de **≤8
clauses testables par replay**, un **registre de surfaces** `registre-surfaces.yml`
(allowlist default-deny ; surfaces gelées : mesureur, ledger, **script d'append**, banc,
définitions des métriques, LA LOI — **définie précisément dans le registre** —, 4 STOP,
le contrat), un **kit émetteur** ~15 lignes (classe B, fichier séparé, n'embarquant que
la **convention d'appel** du script d'append), le format de fiche `type: amelioration`
(front-matter : `signal_source`, `surface`, `boucle`, `critere_verification`,
`echeance_peremption`) — **type et champs à ajouter à la convention ezk-backlog par
extension explicite (modèle du précédent 0048)**, foyer des fiches = subtree
vectorz/products/mega-city, id ≥0061 (les numérotations subtree/standalone ont forké).

**Le texte du contrat ne nomme aucun point d'insertion ni aucune méthode** — les greffes
(ezk-archive au MVP, vz-product-builder, pilote 0038) vivent dans le kit et des fiches
d'implémentation, via **un canal de greffe unique : une rule de profil (pattern 0045)
référencée par les profils, jamais un collage dans un SKILL.md** (incohérence corrigée —
c'est ce qui rend le retrait par composition YAML effectif). Preuve d'agnosticité : test
double-émetteur (deux méthodes distinctes émettent les mêmes événements), ajouté comme
critère de sortie à la fiche 0038 au moment de son tirage. Le « test n°1 » (le retrait de
BMAD ne touche ni contrat ni ledger) est reconnu **trivialement vide** tant que le BMAD
résiduel n'implémente pas le contrat : le reformuler en non-régression, ou greffer
réellement le kit dans la rétro du BMAD résiduel avant E4, est un **choix de scope PO**.

Cet ADR **acte la création du foyer canonique** `products/mega-city/docs/contrats/`
pour les textes de contrat (constat : il n'existe pas aujourd'hui ; la spec normative de
supervisabilité vit dans une capture cop1 §7 — le foyer y référence, sans déplacer le
texte gelé). Sans ce foyer, deux textes de contrat auraient deux maisons concurrentes.

### Décision A2 — Transport : dossier dédié cross-run, deux fichiers, un writer chacun

Les événements d'améliorabilité vivent sous **`.improvement/`** (côté vectorz), en
**DEUX fichiers append-only à writer unique** — correction de réfutation : un ledger
unique fusionnait deux écrivains logiques (mesureur tiers + méthode émettrice) en
violation de la grammaire « un writer par fichier » que ce dossier revendique :

- `outcomes.jsonl` — writer : **le mesureur tiers** (`outcome.measured`,
  `incident.detected`, `improvement.verified|retired`, `improvement.overdue`,
  `proposal.expired`) ;
- `lifecycle.jsonl` — writer : **le script d'émission** (`proposal.submitted`,
  `proposal.approved {approbateur, preuve_externe}|rejected`,
  `improvement.applied {approval_ref}`, `improvement.reviewed|skipped`).

L'alternative (ledger unique + mécanisme d'authentification d'origine vérifié par le
script) est **instruite dans le même arbitrage PO+panel**. Les deux fichiers sont
**mirrorés** (hash/copie append-only tenus par le mesureur **hors de l'arbre projet**,
divergence = incident à chaque MESURER — reprise du pattern miroir du jumeau).

`.improvement/` **lit** `.supervision/runs/*/events.jsonl` en lecture seule et **n'y
écrit jamais** — clause de **non-réouverture du gel supervisabilité v0.1**. Ce choix
n'est **pas une dérogation à D12** (on n'étend pas une décision gelée d'un autre
contrat) : c'est une **décision nouvelle de ce contrat, inspirée du précédent D12**,
motivée par la sémantique — journal de supervision par-run et gelé, améliorabilité
cross-run. Pas de triple store ; `learnings.md` (existant) reste la mémoire catalogue,
alimentée par capture uniquement, **requalifiée en indicateur diagnostique** (une ligne
mécanique par capture = métrique d'activité, la classe interdite par l'invariant 8).

### Décision A3 — Frontière humaine : clause 1, deny-all intégral, approbation prouvée

« **La frontière humaine est une clause du contrat, pas une convention orale.** »
Single-loop / double-loop = frontière auto/PO, mais en v0.1 l'allowlist d'auto-application
est **vide** : 100 % des propositions sont approuvées explicitement par le PO. **Chaque
`proposal.approved` doit référencer une preuve externe non-productible par un agent**
(approbation GitHub du compte humain vérifiable via gh API, ou commit signé PO — le
script refuse toute approbation sans cette référence ; mécanisme exact à trancher au
panel de gel) : sans cela, la clause 1 serait contournable par un simple write dans un
environnement où les agents ont Write/Bash sur l'arbre. Les 4 STOP d'ADR-0011 §3 sont
**cités, jamais redéfinis**, et leurs REFUS priment sur toute clause (chaîne normative à
consolider — arbitrage PO, voir Contexte). Aucun agent (ezk-pm inclus) ne peut
approuver : un agent route et refuse, c'est tout. Toute question double-loop (outcome
cible, invariant, règle de LA LOI, le contrat) est **ouverte** au PO + panel adverse,
jamais tranchée par la boucle. FR59 (auto-approbation 48 h avec veto) et la policy
d'autonomie par types sont des **options parking**, gated « après 3 cycles verified »,
activables par décision PO après panel — hors du texte v0.1 ; leur examen est conditionné
aux **signaux de santé de la porte humaine** (taux de rejet PO, latence
submitted→approved — ajout au mesureur soumis à arbitrage, surface gelée).

### Décision A4 — Cycle observable, verdict tiers, invariants, vérification progressive

Cycle en 6 temps : mesurer (tiers — décision **A-mesure**, inspirée de D9) → émettre
(follow-through d'abord ; pas de chiffres → pas de proposition ; ≤1 fiche/cycle) → router
(deny-all) → prouver (branche/PR/banc 0041) → adopter/retirer (**le squash-merge vaut
adoption ; capture n'ajoute que la ligne de journal + le re-bind** — couture
PROUVER/ADOPTER tranchée ; revert natif) → rendre des comptes.

**L'horloge n'appartient pas à l'auditée** (correction de réfutation) : une « émission »
est un **événement observable** (clôture ezk-archive journalisée au MVP ; `run.finished`
en pilote), et chaque obligation indexée en émissions est doublée d'une **borne
calendaire** — *N émissions OU M jours, premier atteint* — tenue par le **mesureur
tiers**, qui émet `improvement.overdue`/`proposal.expired` (reprise du chien de garde
anti-surplace du jumeau). `improvement.applied` sans verdict sous N=2 émissions OU M
jours = **unproven, bloquant**.

**Le verdict `verified|retired` est rendu par le mesureur tiers** (comparaison mécanique
`critere_verification` vs ledger) et appendu par script ; la méthode le **lit** et le
commente dans `improvement.reviewed`, ne le rend jamais ; écart méthode/mesureur =
incident (correction de réfutation : l'auto-évaluation bannie en entrée ne revient pas en
sortie).

Budget méta en **unités observables** (correction de réfutation : « ≤10 % des tokens » est
invérifiable au MVP — session interactive, télémétrie absente-et-dite-absente, source
0022 todo) : **≤1 proposition/cycle** (refusable par le script d'append), taille de fiche
bornée, time-box ; le **≤10 % tokens est requalifié en critère du mode pilote**, câblé au
tirage de 0038. Interdiction des métriques de rituel comme cible (lignes de learnings.md
incluses).

Vérification en trois marches : (1) jour 1, le **script d'append** (livré par la fiche
MVP A, **côté vectorz** — contradiction de placement corrigée ; lui-même **surface
gelée**) refuse toute écriture violant les invariants noyau (approbation prouvée
référencée, surface ∈ registre, ≤1 en essai), et le **miroir du mesureur** détecte les
contournements ; **honnêteté v0.1** : l'invariant « aucune écriture hors registre » est
**requalifié classe B (honor-system)** tant que seuls le script et le miroir le couvrent
— l'option garde CI de chemins gelés dès le MVP (fiche 0040) est un arbitrage de scope
PO ; (2) après 3 cycles vécus, **validateur replay complet** (jumeau de
journal-validator, précédent done/0027) ; (3) son branchement **CI = condition de
passage v0.2**.

### Décision A5 — Le contrat est lui-même construit→prouvé→retirable

La clause de moisson est une **rule de profil** (pattern 0045), retirable par composition
YAML si, après 3 cycles, aucune amélioration n'a payé en outcome — leçon consignée. La
clause de retrait embarque le **plan de démantèlement complet** (kit dé-référencé des
profils, type de fiche gelé, `.improvement/` archivé, registre caduc) — correction de
réfutation : la réversibilité ne se limite plus à la seule clause de moisson. Le mesureur
d'outcomes **reste** dans tous les cas (doctrine proposée : la mesure se paie seule) ;
lui donner ou non son propre critère falsifiable de maintien est une position produit
remontée au PO. Critère de sortie du MVP double : baseline rétroactive (redéfinie sur les
PRs réelles existantes) publiée, ET (≥1 amélioration adoptée atteint son critère chiffré
sous 3 cycles — verdict mesureur — OU retrait consigné) — les deux issues sont des succès
du protocole. `learnings.md` n'est plus un témoin de succès (indicateur diagnostique
seulement ; modification du critère à valider PO).

## Options considérées (transport — Décision A2)

### Option A — Rider `.supervision/` (position du concept 3)
| Dimension | Évaluation |
|---|---|
| Un seul transport (lettre du précédent D12) | ✅ |
| Gel supervisabilité v0.1 | ❌ écrit dans le namespace d'un contrat gelé — couplage caché |
| Sémantique | ❌ données cross-run dans un journal par-run |

### Option B — Dossier dédié `.improvement/`, deux fichiers à writer unique (retenue, à ratifier)
| Dimension | Évaluation |
|---|---|
| Gel supervisabilité | ✅ lecture seule, clause de non-réouverture |
| Sémantique cross-run | ✅ native |
| Grammaire « un writer par fichier » | ✅ respectée (mesureur / script d'émission séparés) |
| Précédent D12 | ✅ décision nouvelle A-transport inspirée de D12, pas une dérogation |
| Nombre de stores nouveaux | ⚠️ deux fichiers sous un dossier unique (+ miroir hors arbre) |

### Option B′ — Ledger unique + authentification d'origine
Instruite dans le **même arbitrage** : un seul fichier, mais chaque événement porte une
preuve d'origine que le script vérifie. Moins de fichiers, mécanisme d'authentification à
spécifier — le choix B vs B′ modifie la Décision A2, déjà soumise à ratification PO+panel.

### Option C — Trois stores (outcomes.jsonl + improvements.jsonl + learnings.md, concept 1)
Écartée : prolifération sans décision, validateur aveugle sur des demi-canaux.

## Analyse des trade-offs

Le cœur du compromis inter-concepts : **frugalité prouvable d'abord** (socle concept 3 —
2 fiches, deny-all, baseline rétroactive, clause de retrait du contrat lui-même) armée
des **pièces opposables** des concepts 1 et 2 (registre de surfaces, aucun émetteur nommé
dans les clauses, test double-émetteur, unproven-bloquant, validateur-CI en v0.2), **et
durcie par la passe de réfutation** (writers séparés, miroir tamper-évident, approbation
prouvée, verdict tiers, chien de garde calendaire, invariant 2 requalifié honnêtement).
Le coût accepté : la conformité replay complète n'existe pas au jour 1 (le script
d'append n'attrape que les violations à l'écriture ; le miroir n'attrape les
contournements qu'au MESURER suivant) — accepté parce que figer 9 invariants sur du
papier est le méta-travail que la démarche sanctionne, et que le témoin honnête du MVP
(une amélioration qui paie, verdict rendu par le mesureur) ne se game pas par la
machinerie.

## Conséquences

- **Plus facile :** les leçons de session ont un chemin unique et outillé vers le
  catalogue ; l'ajout de règles en cours de projet a désormais une **rampe préparée**
  (le périmètre exact — rules dans l'allowlist ou routage PO — reste un arbitrage) ; le
  backlog gagne un type `amelioration` traçable de bout en bout (extension ezk-backlog
  livrée avec la fiche B).
- **Plus difficile :** discipline d'émission (follow-through, deny-all = du temps PO,
  ~2 min/fiche + ≤5 min de verdict AC par cycle, chiffré) ; deux fichiers + un miroir à
  gouverner sous `.improvement/` ; le mesureur devient chemin critique — s'il mesure
  faux, la boucle optimise du bruit ; l'approbation prouvée ajoute un geste PO (approbation
  gh ou commit signé).
- **À revisiter :** seuils (N=2 émissions, bornes calendaires M jours, fenêtre X jours
  reprise post-merge, time-box/taille de fiche, 48 h veto) après 3 cycles vécus ;
  élargissement des invariants du validateur sur du vécu ; passage v0.2 (validateur CI,
  policy d'autonomie, double émission active, métrologie tokens ≤10 % au pilote).

## Non-buts

- Rouvrir le gel du contrat de supervisabilité v0.1 (composition, lecture seule) — ni
  étendre ses décisions D* (numérotation propre A*).
- Toute auto-application en v0.1 (allowlist vide ; FR59 = parking).
- Nommer une méthode ou un rituel dans les clauses du contrat.
- Un nouveau runtime, une API partagée catalogue↔runtime (ADR-021), un service.
- Optimisation permanente en tâche de fond (déclenchement sur faiblesse mesurée uniquement).
- Trancher le renommage cop1 ou quoi que ce soit de la fenêtre DP8.

## Action items (si Accepté)

1. [ ] Panel adverse **manuel** sur ce texte (procédure des panels 2026-07-13/15 ;
       outillage 0057 ultérieur), avis minoritaires consignés.
2. [ ] Arbitrages PO de la liste jointe (périmètre rules, transport B vs B′, scope du
       gel des surfaces, mécanisme d'approbation prouvée, seuils, priorités, foyer
       canonique).
3. [ ] Tirer la fiche « moisson époque 1 » — **recalibrée** : antériorité au lot L5
       souhaitable pour la part quality-intelligence/ceremony-engine/`_bmad-output`
       (les seules menacées par L5/E4) ; la part sprint-core n'est sur aucune liste de
       résorption — rang final = arbitrage PO.
4. [ ] Tirer les fiches MVP A (mesureur + script d'append, vectorz) puis B (contrat
       v0.1 + première boucle fermée, mega-city).
5. [ ] Mettre à jour `docs/adr/README.md` (registre) dans la même PR que le statut Accepté.
6. [ ] Au tirage de 0038 : ajouter les critères de sortie « le pilote natif émet les
       artefacts du contrat d'améliorabilité » (test double-émetteur) et « métrologie
       tokens du budget méta (≤10 %) via stream SDK ».