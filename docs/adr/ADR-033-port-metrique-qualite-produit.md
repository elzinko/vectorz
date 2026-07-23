# ADR-033 — Port de métrique de qualité produit : la méthode exécute l'outil, un tiers mesure, le moniteur agrège (règle / capacité / config)

**Statut :** **PROPOSÉ** — arbitrage PO avant gravure (comme
[ADR-030](ADR-030-contrat-ameliorabilite.md)/[031](ADR-031-deux-axes-de-validation.md)),
idéalement **après la 1ʳᵉ mesure réelle vécue** (fiche [0052](../../features/0052-socle-metrique-port-adaptateur-silo.md)),
pour figer sur du vécu plutôt que sur du papier.
**Révisé 2026-07-22** après **panel adverse** (4 lentilles — architecte, QA, TDD, PM — + juge de
cohérence) : findings confirmés **appliqués** (writer = tiers ; fail-closed ; F4 scindé Q1-tranché /
Q2-différé ; port lu par le moniteur). Les points qui restent au PO sont regroupés en fin de texte
(**Arbitrages réservés au PO**).
**Date :** 2026-07-22
**Déciders :** elzinko (PO)
**Origine :** `/architecture` demandé par le PO (brainstorm 2026-07-22, épic
[0051](../../features/0051-observabilite-qualite-produit.md)).
**Compose (sans les rouvrir) :**
- **[ADR-032](ADR-032-emission-adaptateur-separable.md)** (Accepté) — l'**émetteur canonique reste
  dans la méthode** : c'est la méthode qui **exécute l'outil** en CI et journalise qu'elle l'a fait ;
  le superviseur n'écrit **jamais** ces événements. *La **valeur** mesurée, elle, est appendée par le
  **mesureur tiers** (F3 + ADR-031/0044), pas par la méthode auditée.*
- **[ADR-028](ADR-028-lecteur-journal-mode-moniteur.md)** (Proposé, mode nominal) — le moniteur
  **lit** le journal en lecture seule et **projette** ; il ne mesure pas.
- **[ADR-020](ADR-020-dod-completion-gate.md)** (Accepté, central — Rules port) — l'enforcement
  d'un seuil se branche au **gate de complétion (DoD)**.
- Les règles hexagonales de mega-city (`rules/hexagonal/` : `adapter-location`,
  `dependency-inversion`, `wiring-at-edge`), [ADR-021](ADR-021-megacity-integration-boundary.md)
  (frontière), [ADR-026](ADR-026-agent-executor-seam.md) (seam).
- Le **mesureur [0044](../../features/0044-mesureur-outcomes-script-append-mvp-a.md)** +
  [ADR-031](ADR-031-deux-axes-de-validation.md) — le silo de mesures est le **foyer** ; les
  métriques produit **nourrissent** l'Axe 2 (qualité de méthode), elles ne le remplacent pas.
**Ne révise pas :** le gel supervisabilité v0.1 ; ADR-030 (composé, non rouvert).
**Décisions numérotées F1…F6** — propres à cet ADR ; les décisions gelées **D8/D12/D13** citées
comme **précédents d'inspiration, jamais comme autorités étendues** (norme ADR-030:19-22).

## Contexte

Le PO veut brancher de **vrais outils d'analyse de code** (couverture, sécu, complexité,
duplication…) sur les **produits que la méthode fabrique**, **garder** ces mesures dans le
temps, en tirer des **KPI par commit / PR / sprint / version**, les **visualiser**, et à terme
laisser un **agent** les analyser pour améliorer la méthode. **Ce n'est pas** la comparaison de
LLM (écartée) : on mesure l'**exécution logicielle**.

Trois questions du PO à trancher : (1) *les outils, c'est des règles ?* ; (2) *l'installation
d'un outil fait-elle partie des règles ou des préalables ?* ; (3) *où vit l'outil, et comment
garantir que les mesures sont bien prises, en événementiel ?*

Trois faits d'état des lieux : `products/cop1/packages/quality-intelligence` **prouve la
faisabilité** (`SonarQubeAdapter`, `CoverageGate`, `StaticAnalysisGate`, `ArchDriftDetector`)
**mais** câble les mesures en **portes jetables** (la valeur ouvre/ferme le gate du sprint puis
est **jetée** — rien n'est historisé ni collé à un commit) et il est **promis à résorption**
(relicat pré-pivot, [0024](../../features/0024-resorber-peripherie-pre-pivot.md)) — on moissonne
sa **liste de capteurs**, pas son code. **LA LOI vit dans `products/mega-city/rules/`** (époque 2,
ADR-029). Le **moniteur** = cop1 `observability` + `web` (mission-control, ADR-028). Et **ADR-032
a déjà tranché** que l'exécution/l'émission appartient à la méthode.

Garde-fous PO non négociables : **mesure tierce** (ADR-031/0044 — jamais auto-déclarée par la
méthode qui s'améliore) ; **construire→prouver→retirer** ; **language-agnostic obligatoire**
(« sinon on ne s'en sort pas ») ; **panel avant gravure**.

## Décision (proposée)

### F1 — Un PORT de métrique, language- et outil-agnostic

Un port abstrait `MetricPort` (« donne la valeur de la métrique M pour ce commit/PR ») dans le
domaine, **indépendant de tout outil et de tout langage**. Les outils (Codecov, SonarCloud,
CodeQL) sont des **adaptateurs** derrière ce port (`rules/hexagonal/adapter-location` +
`dependency-inversion` + `wiring-at-edge`). **Le port est la seule chose que la règle et le silo
connaissent** — un adaptateur peut être spécifique à un outil/langage, jamais le port.

**Qui lit le port ?** Le **mesureur tiers** (pour obtenir la valeur depuis l'artefact de l'outil)
et le **moniteur** (pour agréger, ADR-028). La **règle DoD** (F5), elle, **consulte la valeur
déjà mesurée** dans le journal — elle **ne pilote pas** l'adaptateur produit en direct.

> **En clair :** le gate de la méthode lit un chiffre **déjà écrit** ; il ne va pas lancer Sonar
> lui-même au moment de juger. Sinon la méthode dépendrait du produit à l'exécution — ce que la
> frontière ADR-021 interdit.

### F2 — Trichotomie règle / capacité / config (réponse directe aux questions PO)

| | Quoi | Où | Cycle de vie |
|---|---|---|---|
| **Règle** (la loi) | « couverture ≥ seuil » | `products/mega-city/rules/` (ex. `testing/` ou une catégorie `quality/`) | ajoutée/retirée par rétro sous gate PO |
| **Capacité** (l'outil) | Codecov, Sonar… = **installer + configurer + adaptateur** | adaptateur côté **produit** (vectorz) ; provisioning = **préalable** | provisionnée quand une règle la requiert |
| **Config** (le réglage) | le **seuil** (ex. 80 %) | fichier de config | réglé par rétro (le moins cher) |

**Réponses :** les outils **ne sont pas** des règles (une règle *référence* une capacité via le
port) ; **installer = un préalable**, distinct de la règle **et** de l'ajout de règle. Les
confondre est la faute à éviter.

> ⚠️ **« Chemins exclus » n'est PAS rangé en config ici.** Exclure un chemin **change la
> définition** de la métrique (on baisse sa propre barre) — c'est donc **peut-être une surface
> gelée** (modif = PO + panel), pas un réglage pas-cher de rétro. **Arbitrage ouvert** (voir fin).

### F3 — Qui exécute, qui écrit la mesure (compose ADR-032 + ADR-031 + ADR-028)

La mesure est un **événement** `quality.measured { metric, value, tool, commit, pr, ts }`. Le
partage des rôles :

- **La méthode exécute l'outil** en CI, au build de PR (hook — **architecture orientée
  événement**, demande PO), **garantit** qu'il est installé et lancé, et produit un **artefact
  déterministe** (ex. `lcov` / `cobertura` / rapport Sonar). C'est le sens de « l'émission
  appartient à la méthode » (ADR-032).
- **Le mesureur tiers écrit la mesure** : il **lit** cet artefact et **appende**
  `quality.measured` au journal (ADR-031/0044 — « l'horloge n'appartient pas à l'auditée »).
  **La méthode auditée n'écrit jamais son propre chiffre.**
- **Le moniteur lit** le journal en lecture seule et **agrège** pour présenter (ADR-028).

> **En clair : lancer l'outil ≠ écrire le chiffre.** La méthode fait tourner la couverture (elle
> seule peut, pendant le build) ; mais c'est un **tiers neutre** qui note le résultat — sinon
> l'élève corrige sa propre copie. Pour une **méthode non possédée**, l'installateur (sidecar,
> ADR-032 A′) pose l'exécution.

### F4 — Deux questions, pas une : QUI écrit (tranché) / OÙ stocker (différé)

Le **silo** est le **magasin** : le **journal append-only des mesures** (grain = commit / PR).
Les KPI **sprint / version** sont des **projections** (vues à la demande, type DuckDB) calculées
*au-dessus* — **pas un 2ᵉ magasin**. Le silo n'est **pas** l'écran (ça, c'est mission-control).

Le panel a montré que « F4 » mélangeait **deux** décisions distinctes :

- **Q1 — QUI écrit `quality.measured` ? → TRANCHÉ : le mesureur tiers** (cf. F3). C'est une règle
  de **confiance**, pas un pari technique : elle découle de 0044. *(Corrige la rédaction
  initiale qui laissait la méthode écrire — ce qui cassait F6.)*
- **Q2 — OÙ vit le journal ? → DIFFÉRÉ.** Étendre le silo 0044 (Option A) ou créer un journal
  frère `.quality/` (Option B) ? On **ne tranche pas** : le silo 0044 n'est **pas encore
  construit**, donc choisir maintenant = graver une forme avant le 1ᵉʳ événement réel. On décidera
  **après la 1ʳᵉ mesure vécue** — 0052 écrit derrière une **interface** (`MetricSink`), sans se
  lier au silo 0044 tout de suite. **Arbitrage ouvert.**

> **En clair :** on sait désormais **qui tient le stylo** (un tiers) ; on décidera **dans quel
> cahier** il écrit une fois qu'on aura vu passer une vraie mesure.

### F5 — Enforcement au gate DoD (compose ADR-020), pas DoR

Un seuil qui bloque une PR est une **règle DoD** branchée sur le **Rules port (ADR-020)** : elle
**consulte la valeur déjà mesurée** (pas l'adaptateur en direct — cf. F1) et **échoue sous le
seuil**. Règle **language-agnostic** ; seuil = **config**.

**Fail-closed (défaut sûr) :** **pas de mesure valide ⇒ le gate refuse.** On ne distingue pas
« PR sans code testable », « outil non lancé » et « mesure fabriquée » : les trois donnent le
**même refus** tant qu'un artefact déterministe n'est pas présent.

> **En clair :** en l'absence de preuve, **on bloque**. Une absence de chiffre ne vaut **jamais**
> « c'est bon » — sinon il suffirait de ne pas lancer l'outil pour passer.

*(DoR = prête à démarrer ; **DoD** = mergeable — le PO parlait bien de DoD.)*

### F6 — Mesure objective et tierce (compose ADR-031/0044)

La valeur vient d'un **outil déterministe**, pas de l'auto-évaluation d'un agent — c'est ce qui
la rend admissible comme signal de qualité (« l'évaluateur d'abord », leçon AlphaEvolve). Le
**verdict** « l'amélioration a payé » reste rendu par le **mesureur tiers** (ADR-031), jamais par
l'agent qui a produit le code. *(F3/Q1 est ce qui rend F6 vrai : si la méthode écrivait son
chiffre, « objectif » serait un vœu.)*

## Options considérées (OÙ vit le silo — Q2 de F4, **différé**)

> Q1 (qui écrit) est tranché : **mesureur tiers**. Il ne reste que le **foyer** du journal.

### Option A — Silo 0044 étendu (nouvel event `quality.measured`)
| Dimension | Évaluation |
|---|---|
| Réutilise le magasin + le miroir tamper-évident de 0044 | ✅ |
| Un seul journal à gouverner, une seule chaîne de preuve à auditer | ✅ |
| Writer = **mesureur tiers** (Q1 tranché — writer=méthode **rejeté** par le panel) | ✅ |
| Touche « métriques = surface gelée » de 0044 | ⚠️ PO + panel avant gel |

### Option B — Silo frère `.quality/` dédié aux métriques produit
| Dimension | Évaluation |
|---|---|
| N'ouvre pas la surface gelée de 0044 ; livrable tout de suite | ✅ |
| Sépare outcomes métier / métriques produit | ✅ |
| 2ᵉ magasin + 2ᵉ miroir à gouverner | ⚠️ |
| Risque de divergence des définitions | ⚠️ |

### Option C — Le moniteur mesure lui-même (pull only, superviseur écrit)
**Écartée** : viole ADR-032 (le superviseur n'écrit jamais) **et** ADR-031 (mesure tierce, non
auto-produite par l'observateur). **Rejetée.**

> **On ne choisit A ni B maintenant.** 0052 écrit derrière `MetricSink` (interface) → le choix se
> fait sur du vécu, réversible. Coût de différer ≈ nul.

## Analyse des trade-offs

Le cœur du compromis : **respecter trois lois déjà gravées sans les rouvrir** — exécution/émission
méthode (ADR-032), lecture moniteur (ADR-028), **mesure objective et tierce** (ADR-031). Le
**port** rend le tout **language-agnostic** (la vraie contrainte PO) et **retirable** (un
adaptateur se débranche par composition). Le coût accepté : la méthode porte la responsabilité du
**provisioning** (garantir install + exécution de l'outil) — plus lourd que « le moniteur va
chercher », mais c'est le prix de la cohérence avec ADR-032 **et** d'une mesure **non-gameable**
(la méthode auditée n'écrit pas son propre chiffre — F3/Q1 —, et le moniteur ne fabrique rien).

## Conséquences

- **Plus facile :** ajouter un outil = un adaptateur derrière le port ([0054](../../features/0054-catalogue-adaptateurs-outils.md)),
  sans toucher règle ni silo ; un seuil = de la config réglée en rétro ; les KPI tombent en
  projection ([0055](../../features/0055-kpi-agreges-commit-pr-sprint-version.md)).
- **Plus difficile :** la méthode doit **garantir** provisioning + exécution (hooks CI) ; il faut
  un **mesureur tiers** (même minimal) pour écrire la mesure ; concevoir des adaptateurs réellement
  language-agnostic.
- **À revisiter :** **Q2 — où vit le silo** (A vs B), **différé** à la 1ʳᵉ mesure (0052 écrit
  derrière une interface, sans se lier à 0044) ; le grain d'événement ; le branchement CI comme
  **condition de passage** (jumeau du validateur replay, 0046 item 1).

## Risques

| Risque | Parade |
|---|---|
| **Goodhart** (couverture haute, tests vides) | métriques governing **gelées PO** (ADR-031) ; **mutation testing** **en critère d'acceptation** de [0053](../../features/0053-gate-dod-metrique.md) (pas juste une intention) |
| **Mesure gamée par la méthode** | **la méthode auditée n'écrit pas son chiffre** (F3/Q1, writer=tiers) ; valeur produite par **outil déterministe** ; miroir tamper-évident *quand le silo sera choisi* (hors POC) |
| **Absence de mesure lue comme « OK »** | **fail-closed** (F5) : pas d'artefact ⇒ refus |
| **Outil non language-agnostic** | prioriser Codecov / Sonar / CodeQL (formats standard) ; l'adaptateur spécifique reste **derrière** le port |
| **Rouvrir une surface gelée sans le vouloir** | Q2 + « chemins exclus » explicitement **ouverts** → PO + panel |

## Arbitrages réservés au PO (OUVERTS — le panel refuse de les trancher)

1. **Q2 — où vit le journal** : silo 0044 étendu (Option A) **ou** frère `.quality/` (Option B).
   *Différé* jusqu'à la 1ʳᵉ mesure vécue. **En clair : dans quel cahier le tiers écrit.**
2. **« Chemins exclus »** : simple config pas-chère **ou** surface gelée (dé-gel de 0044) ? Le
   panel penche **surface gelée** (exclure un chemin = baisser la barre). **Ta décision.**
3. **Auteur ≠ approbateur** : empêcher que l'agent qui a écrit le code propose lui-même de
   **baisser le seuil** dans la même rétro. La seule digue est **ton gate PO** — le confirmer
   **non délégable** à un agent ?
4. **Séquencement** : 0044 (mesureur) et 0041 (banc) sont `todo`, **non construits**. Faut-il
   acter formellement l'épic 0051 **derrière** eux ? **En clair : on finit le socle d'abord.**
5. **0057 (agent d'analyse)** : le graver comme **finalité** (risque de sur-dimensionner le MVP
   « pour l'agent ») ou le laisser **parqué** jusqu'à ce qu'une courbe existe ?

## Non-buts

- Comparer des LLM (écarté 2026-07-22).
- Ressusciter `@cop1/quality-intelligence` tel quel (on moissonne ses capteurs).
- Un nouveau runtime / service / 2ᵉ magasin ; le moniteur qui mesure.
- Toute auto-application d'améliorations (deny-all, ADR-030).

## Action items

1. [x] **Panel adverse** (2026-07-22, 4 lentilles + juge) — findings confirmés appliqués.
2. [ ] **Arbitrages PO** de la liste ci-dessus (Q2, chemins exclus, auteur≠approbateur,
       séquencement, 0057).
3. [ ] Groom + `ready` [0052](../../features/0052-socle-metrique-port-adaptateur-silo.md) (socle) —
       **ne dépend PAS de Q2** (0052 écrit derrière `MetricSink`).
4. [ ] Mettre à jour `docs/adr/README.md` (registre) — ligne 033 tenue à jour.
5. [ ] Moissonner la liste de capteurs de `quality-intelligence`
       ([0024](../../features/0024-resorber-peripherie-pre-pivot.md)) avant résorption.
