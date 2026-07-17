# Contrat d'améliorabilité v0.1 — note de concept (synthèse post-panel, révisée post-réfutation)

> 📍 **Ceci est le dossier dense du Sujet B** (la méthode s'auto-améliore sur des chiffres).
> Pour la vue d'ensemble lisible et le Sujet A (rétro déclenchée par l'humain), lire
> d'abord **[la carte](2026-07-16-carte-auto-amelioration.md)**. Ce document-ci est
> l'archive de référence — pas une lecture obligatoire.

> Synthèse de l'architecte à partir des 3 concepts en compétition et des verdicts des juges
> (2 juges sur 3 donnent le concept 3 gagnant, 1 donne le concept 1 ; les directives de
> synthèse convergent), **révisée après la passe de réfutation** (3 réfutateurs, findings
> confirmés appliqués). **Rien ici n'est décidé** : la liste des arbitrages PO est en fin
> de dossier, et le contrat ne sera gelé qu'après panel adverse + validation PO.

## 1. Nom du paradigme

**Contrat d'améliorabilité** — le jumeau du contrat de supervisabilité.

Le lexique métaphorique « Jurisprudence » (greffier, instructeur, huissier) est **écarté**
(directive unanime des juges 2 et 3 : zéro capacité ajoutée, coût lexical réel). On garde
des rôles fonctionnels : **le mesureur tiers**, **l'émetteur**, **le validateur**, **le PO**.

**Numérotation propre** (correction de réfutation) : les décisions du contrat portent leur
propre numérotation (**A1, A2…**). Les décisions gelées du jumeau (D8, D9, D12…) sont
citées comme **précédents d'inspiration, jamais comme autorités étendues** — D9, en
particulier, porte spécifiquement sur le budget/télémétrie de consommation, pas sur toute
mesure ; le principe « la méthode ne tient jamais le thermomètre » est ici une décision de
première main (**A-mesure**), inspirée de D9.

## 2. Thèse en 3 lignes

La supervisabilité rend un run **observable** ; l'améliorabilité rend la méthode
**apprenante**. C'est un contrat à part, versionné au catalogue et méthode-agnostique, que
toute méthode peut implémenter (greffe MVP sur ezk-archive, pilote natif 0038 demain ;
greffer le BMAD résiduel avant E4 est un choix de scope remonté au PO — voir §5) :
consommer des outcomes **métier** mesurés par un tiers, produire **au plus une**
amélioration vérifiable par cycle, l'appliquer par canaux déterministes sous approbation
**humaine** journalisée **et prouvée** (référence externe non-forgeable), puis **la faire
prouver ou retirer sur verdict rendu par le mesureur tiers** — jamais par elle-même. La
méthode ne promet pas de s'améliorer : elle promet d'être améliorable et de rendre des
comptes en outcomes — et **la frontière humaine est une clause du contrat, pas une
convention orale** (clause 1).

Ancrage sur les trois douleurs vécues du PO : retoucher les PRs d'agents à la main,
ré-expliquer les mêmes leçons à chaque session, voir les rule candidates de rétro mourir
en markdown.

*Antécédent à raccrocher au dossier* : la fiche **0053 du repo mega-city standalone**
(« article seed AI — contrat d'auto-amélioration », untracked dans un repo déclaré gelé
qui a par ailleurs reçu un commit post-gel) est directement liée à ce chantier ; son
rapatriement vers le subtree et le statut de la fuite du gel sont des arbitrages PO.

## 3. LE CONTRAT

### 3.1 Artefacts

| Artefact | Où | Rôle |
|---|---|---|
| `docs/contrats/ameliorabilite-v0.1.md` | catalogue (vectorz/products/mega-city) | Le texte : ≤8 clauses courtes, URI de contrat, v0.x additif, breaking ⇒ nouvelle URI, classes de conformité A (hooks/scripts) / B (consignes) — même grammaire que la supervisabilité, **décisions numérotées A1, A2…**. **Nouveau foyer canonique des textes de contrat, à acter par l'ADR** (correction des juges : `docs/contrats/` n'existe pas aujourd'hui ; la spec supervisabilité vit en capture cop1 §7 — le foyer y pointera). |
| `docs/contrats/registre-surfaces.yml` | catalogue | Allowlist **default-deny** des surfaces auto-modifiables (skills, prompts, `interactions[]` d'agents via `capture --for`, mémoire épisodique — *sous approbation*) vs **surfaces gelées** : mesureur, ledger, **script d'append** (ajout de réfutation — il était omis), banc cobaye, définitions des métriques, LA LOI, les 4 STOP, le contrat lui-même. **Le registre définit précisément « LA LOI »** (correction de réfutation — indispensable quel que soit l'arbitrage de périmètre). Toute tentative de la boucle sur une surface gelée = **incident bloquant** (leçon reward-tampering DGM). **Honnêteté sur la détection** : voir §3.4, invariant 2 — classe B au jour 1, détecteur = miroir. |
| Kit émetteur (~15 lignes, classe B) | catalogue, **fichier séparé du texte** | Consignes d'émission d'une méthode. **Canal de greffe UNIQUE tranché** (incohérence SKILL.md vs YAML corrigée) : une **rule de profil** (pattern 0045) référencée par les profils — **jamais un collage dans un SKILL.md** —, donc retirable par pure composition YAML. **Le texte du contrat ne nomme aucun point d'insertion** : les greffes concrètes (ezk-archive, vz-product-builder, pilote 0038) vivent dans le kit et les fiches d'implémentation, jamais dans les clauses. Le kit n'embarque que la **convention d'appel** du script d'append (le script vit côté vectorz, fiche MVP A). |
| `.improvement/outcomes.jsonl` + `.improvement/lifecycle.jsonl` | vectorz (runtime) | **Deux fichiers append-only sous un même dossier, un writer par fichier** (correction de réfutation : le ledger unique fusionnait deux écrivains logiques en violation de la grammaire revendiquée) : `outcomes.jsonl` écrit par le **mesureur tiers** uniquement ; `lifecycle.jsonl` écrit par le **script d'émission** uniquement. Alternative (ledger unique + mécanisme d'authentification d'origine) instruite dans le **même arbitrage PO+panel** que le transport. Les deux fichiers sont **mirrorés** (hash/copie append-only tenus par le mesureur **hors de l'arbre projet** — divergence = incident à chaque MESURER), reprise du pattern miroir du jumeau supervisabilité. |
| Fiches `features/*.md` `type: amelioration` | vectorz/products/mega-city (subtree), **id ≥0061** | Véhicule de toute proposition (une proposition qui n'est pas une fiche n'existe pas). Front-matter contractuel : `signal_source`, `surface`, `boucle: single|double`, `critere_verification` (chiffré), `echeance_peremption`. **Le type et ses 5 champs n'existent pas dans la convention ezk-backlog : l'extension (type + champs + regen) est un livrable explicite de la fiche MVP B, sur le modèle du précédent 0048** ; « repo de la méthode » est désambiguïsé — le foyer est le subtree (les numérotations subtree/standalone ont forké). |
| `products/mega-city/journal/learnings.md` | catalogue (existant) | La mémoire du flywheel, alimentée **uniquement** via `lawgiver capture`. **Requalifié** (correction de réfutation) : une ligne étant produite mécaniquement par chaque capture, c'est une métrique d'activité — la classe que l'invariant 8 interdit. Il devient un **indicateur diagnostique** (« le flywheel est-il branché ? »), **plus un témoin de succès du MVP** (retrait du critère de sortie = arbitrage PO). |

### 3.2 Schéma des événements (deux fichiers, un writer chacun)

- **`outcomes.jsonl` (writer = mesureur tiers)** : `outcome.measured` · `incident.detected`
  · `improvement.verified|retired` (le **verdict est rendu par le mesureur**, voir §3.3) ·
  `improvement.overdue` · `proposal.expired` (chien de garde calendaire, voir §3.3).
- **`lifecycle.jsonl` (writer = script d'émission)** : `proposal.submitted` ·
  `proposal.approved {approbateur, preuve_externe} | rejected` ·
  `improvement.applied {approval_ref}` · `improvement.reviewed|skipped {reason}`.

Chaque transition référence commit, preuve et approbateur. Replayable.

**Transport (décision A-transport, à ratifier PO + panel)** : dossier dédié
`.improvement/`, qui **lit** `.supervision/runs/*/events.jsonl` en lecture seule et
**n'y écrit jamais**. Clause explicite de **non-réouverture du gel supervisabilité v0.1**.
Ce n'est **plus présenté comme une « dérogation à D12 »** (on n'étend ni ne déroge à une
décision gelée d'un autre contrat) : c'est une **décision nouvelle de ce contrat**,
inspirée du précédent D12, motivée par la sémantique — le journal de supervision est
**par run** et gelé, les données d'améliorabilité sont **cross-run**. Le placement C3
(`outcomes.jsonl` sous `.supervision/`) est **corrigé** en conséquence.

### 3.3 Cycle de vie d'une amélioration (6 temps)

Définition **méthode-agnostique et non-circulaire du « cycle »** (correction de
réfutation : l'horloge n'appartient plus à l'auditée) : une **émission** est un
**événement observable** — au MVP la clôture ezk-archive journalisée, en pilote
`run.finished` — et **chaque obligation indexée en émissions est doublée d'une borne
calendaire** : *N émissions OU M jours, premier atteint*, tenue par le **mesureur tiers**
qui émet `improvement.overdue` / `proposal.expired`. Le silence total est donc détectable
(reprise du chien de garde anti-surplace du jumeau). Les seuils calendaires (M jours) sont
des seuils à valider PO.

1. **MESURER** — le mesureur tiers (script zéro-LLM, vectorz) calcule les outcomes depuis
   git/gh, le front-matter des fiches, le banc 0041 et les données mission-control 0022
   (`.supervision` en lecture seule, **source optionnelle** — voir §5), et appende
   `outcome.measured`. **Jamais auto-déclaré (décision A-mesure, inspirée de D9).** Il
   rend aussi, mécaniquement, les **verdicts** `improvement.verified|retired`
   (comparaison `critere_verification` vs outcomes du ledger), vérifie le **miroir**
   (divergence = incident) et tient le **chien de garde calendaire**. Les incidents SRE
   prédéfinis (PR retouchée, **reprise post-merge sans casse CI** — ajout de réfutation —,
   AC raté, CI cassée post-merge, budget dépassé) émettent `incident.detected` et rendent
   l'analyse obligatoire.
2. **ÉMETTRE** — à chaque émission, la méthode **ouvre par le follow-through** : elle
   **LIT le verdict rendu par le mesureur** et le commente dans `improvement.reviewed` —
   **elle ne rend jamais le verdict elle-même** (correction de réfutation : l'auto-évaluation
   bannie en entrée ne revient pas en sortie) ; écart méthode/mesureur = incident. À
   défaut : `improvement.skipped {reason}` — le silence est une violation (et il est
   désormais détectable par la borne calendaire). Puis, **si et seulement si** des
   outcomes frais existent (« pas de chiffres → pas de proposition »), elle croise
   frictions consignées × chiffres et produit **au plus UNE** fiche `type: amelioration`.
3. **ROUTER** — v0.1 = **deny-all intégral** : 100 % des propositions au PO (≈2 min/fiche),
   formulé **comme clause du contrat**, pas comme policy YAML à fabriquer (directive
   juge 3). Double-loop (outcome cible, invariant, règle de LA LOI, le contrat) → question
   **ouverte** au PO + panel adverse : la boucle ne modifie jamais une governing variable.
   **Rejeté de C2** : aucune délégation d'approbation à ezk-pm — un agent peut router et
   refuser les 4 STOP, **jamais approuver**.
4. **PROUVER** — l'amélioration approuvée s'essaie par le circuit git standard
   (branche → PR → banc cobaye 0041 quand disponible → squash), pattern SICA. Jamais
   d'amélioration en place : l'archive git conserve chaque variante.
5. **ADOPTER / RETIRER** — **couture PROUVER/ADOPTER tranchée** (correction de
   réfutation : les deux canaux se marchaient dessus pour un artefact catalogue) :
   l'essai en branche **modifie l'artefact**, le **squash-merge VAUT adoption** ;
   `lawgiver capture` n'ajoute alors **que la ligne de journal + le re-bind** (un mode
   journal-only de capture est un ajout backlog remonté au PO). Pour l'outillage : PR
   standard. `improvement.applied {approval_ref}` appendu par script. Échec ou
   péremption = `improvement.retired` (verdict mesureur) + `git revert` motivé.
6. **RENDRE DES COMPTES** — invariant unproven-bloquant (reprise C2) : toute
   `improvement.applied` sans verdict `verified|retired` sous **N émissions (défaut 2) OU
   M jours, premier atteint**, est marquée **unproven** et **doit être soldée avant toute
   nouvelle proposition**.

### 3.4 Invariants (9, testables par replay)

1. Toute application référence une approbation journalisée antérieure (`approval_ref`),
   **elle-même adossée à une preuve externe non-productible par un agent** (voir §3.6).
2. Aucune écriture hors du registre de surfaces (default-deny) ; surface gelée touchée =
   incident bloquant. **Honnêteté v0.1 (correction de réfutation)** : cet invariant est
   **requalifié classe B (honor-system) au jour 1** — le script d'append ne voit que les
   écritures qui passent par lui, et le catalogue (subtree du même monorepo) reste
   accessible en Write/Bash aux agents. Le **détecteur** est le **miroir/hash du ledger et
   des surfaces gelées, tenu par le mesureur hors de l'arbre projet** : divergence =
   incident à chaque MESURER. L'option « garde CI de chemins gelés dès le MVP » (véhicule :
   fiche 0040) est un choix de scope remonté en arbitrage PO.
3. Au plus 1 amélioration en essai par méthode et par cycle (kaizen, réversible).
4. Pas de signal mesuré en entrée → pas de proposition ; toute proposition porte un
   critère chiffré et une échéance de péremption.
5. Aucune métrique déclencheuse auto-déclarée par la méthode (décision A-mesure) — mesure
   tierce uniquement.
6. Toute émission ouvre par `improvement.reviewed` ou `improvement.skipped{reason}` ; le
   **mesureur** double chaque obligation d'une **borne calendaire** (`improvement.overdue`).
7. `improvement.applied` sans verdict sous N émissions OU M jours = unproven, bloquant.
8. **Interdiction de toute métrique de rituel** (cérémonies tenues, checklists cochées,
   vélocité, **lignes de learnings.md**) comme cible — outcomes métier uniquement.
9. Le verdict `verified|retired` est **rendu par le mesureur tiers** (comparaison
   mécanique) et appendu par script ; la méthode le lit, ne le rend jamais.

**Vérification** : le script d'append (**livré par la fiche MVP A, côté vectorz** —
contradiction de placement corrigée ; il est **lui-même surface gelée**) **refuse** toute
écriture violant les invariants 1-3 dès le jour 1 — c'est le **validateur noyau au fil de
l'eau** ; le **miroir du mesureur** est le détecteur des contournements. Le validateur
replay complet (jumeau de `journal-validator`, précédent done/0027) est **différé au
parking**, élargi sur du vécu après 3 cycles, et son branchement CI est la **condition de
passage v0.2** (reprise C2).

### 3.5 Garde-fous

- **Les 4 STOP humains (mega-city ADR-0011 §3), cités tels quels, jamais redéfinis** :
  action irréversible/sortante, augmentation de budget, invention d'idée produit,
  exigences contradictoires — les REFUS priment sur toute clause du contrat.
  **Chaîne normative à consolider** (correction de réfutation : ADR-0011 est au statut
  « proposé », donc révisable) : statuer ADR-0011 avant le gel du contrat, ou recopier
  les 4 STOP comme texte normatif de première main daté — arbitrage PO.
- **Panel adverse avant toute gravure structurante** — **manuel en v0.1** (correction de
  réfutation : la fiche 0057 ezk-challenge est au statut idea et aucun skill n'existe) :
  procédure éprouvée des panels 2026-07-13/15, outillée plus tard par 0057. Concerne :
  gel d'une version du contrat, modification du registre de surfaces ou d'une métrique,
  ouverture d'un type à l'auto-application. Avis minoritaires consignés.
- **Budget méta en unités OBSERVABLES** (correction de réfutation : « ≤10 % des tokens du
  cycle » est invérifiable au MVP — l'émetteur unique tourne en session interactive où la
  télémétrie est absente-et-dite-absente, et la source 0022 est todo) : v0.1 = **≤1
  proposition/cycle** (déjà invariant, refusable par le script d'append), **taille de
  fiche bornée**, **time-box**. Le seuil **≤10 % tokens est requalifié en critère du mode
  pilote**, câblé au tirage de 0038 (stream SDK). Déclenchement sur faiblesse mesurée,
  jamais en tâche de fond. *Seuils proposés, à valider PO.*
- **Approbation non-forgeable** (correction de réfutation : sans cela, la clause 1 est
  contournable par un simple write) : `proposal.approved` doit référencer une **preuve
  externe non-productible par un agent** — approbation GitHub du compte humain vérifiable
  via gh API, ou commit signé PO ; le script refuse toute approbation sans cette
  référence, et le **miroir** rend la falsification a posteriori détectable. Le mécanisme
  exact est à trancher au panel de gel.
- **« Le LLM ne range jamais »** (ADR-0004) : le LLM rédige et juge (consultatif,
  veto-only — peut forcer un signal à false, jamais à true) ; le script appende, applique,
  committe.
- **Hygiène mémoire** : toute écriture = diff git relu ; leçon non re-confirmée à
  échéance = périmée ; consolidation périodique auditée.
- **Clause de retrait du contrat lui-même** (socle C3), **complétée** (correction de
  réfutation : la réversibilité était partielle) : la clause de moisson est une **rule de
  profil** (pattern 0045), retirable par composition YAML si après 3 cycles aucune
  amélioration n'a payé — et la clause de retrait embarque le **plan de démantèlement
  complet** (kit dé-référencé des profils, type de fiche gelé, `.improvement/` archivé,
  registre marqué caduc). **Le mesureur reste** — doctrine proposée : mesurer les outcomes
  se paie seul, boucle ou pas ; lui donner ou non son propre critère falsifiable de
  maintien est une position produit remontée au PO. Construire→prouver→retirer s'applique
  **au contrat lui-même**.
- **Clause de non-réouverture** du gel supervisabilité v0.1 : le contrat la **compose**
  (lit `.supervision`), ne l'étend ni ne la modifie — et ne cite ses décisions D* que
  comme précédents.

### 3.6 Frontière humaine (clause 1 du contrat)

Single-loop / double-loop (Argyris & Schön) = frontière auto / PO — mais en v0.1 même le
single-loop est **100 % sous approbation PO explicite** (allowlist vide à la naissance,
héritage FR61), et chaque approbation est **prouvée** (référence externe vérifiable,
voir §3.5). L'auto-approbation à échéance (FR59, 48 h avec veto signalé au digest) et la
policy d'autonomie par types (jumelle de la 0028) sont des **options parking**, gated
« après 3 cycles verified », activables uniquement par décision PO après panel — **hors du
texte v0.1** (incohérence de C2 corrigée). La **santé de la porte humaine** elle-même
(risque symétrique : complaisance approbative du PO solo — la pression qui a
historiquement produit FR59) est surveillée par deux signaux proposés au mesureur — taux
de rejet PO, latence submitted→approved, hors cible d'optimisation — dont l'ajout touche
le choix des métriques (surface gelée) : arbitrage PO.

## 4. Placement mega-city vs vectorz (justifié)

**Les deux, avec une couture fichiers + événements, jamais d'API partagée (ADR-021).**

- **Catalogue (vectorz/products/mega-city)** : texte du contrat, registre de surfaces,
  kit émetteur, format de fiche amelioration. Catalogue-first (ADR-0011 : toute capacité
  de gouvernance vit au catalogue, jamais dans un runtime) ; c'est ce qui fait survivre le
  contrat au retrait de BMAD (0038/0039) et le rend opposable à toute méthode propagée
  par bind. Le repo mega-city étant gelé, tout se code dans le subtree.
- **vectorz (runtime/siège)** : le mesureur d'outcomes, les deux fichiers du ledger, le
  **script d'append**, le miroir, le validateur — parce que **celui qui s'améliore ne
  tient jamais le thermomètre** (décision A-mesure) et que le harnais doit être
  physiquement hors de portée de la boucle qui s'optimise (le miroir hors de l'arbre en
  est la garantie effective, pas une déclaration).

C'est la réplique de la répartition du contrat de supervisabilité (émission côté méthode,
mesure et lecture côté siège). **Claims recalibrés** (correction de réfutation : ADR-021
Phase 3 et la question ouverte 6 d'ADR-022 portent sur l'ajout/auto-modification de
**règles**, or l'allowlist v0.1 exclut les rules et LA LOI est surface gelée) : le contrat
**prépare** ADR-021 Phase 3 et **route vers le PO** la question 6 d'ADR-022 — il ne les
« formalise/remplit » pas tant que l'allowlist exclut les rules. L'alternative (étendre
l'allowlist à « ajout de rules via `capture kind=rule` sous approbation PO », en gelant
les governing rules existantes) est un **arbitrage de périmètre produit** remonté au PO.

## 5. Boucle MVP (2 fiches, zéro nouveau runtime, deny-all)

- **Fiche A — mesureur d'outcomes + script d'append** (vectorz) : script zéro-LLM,
  4 métriques, deux fichiers `.improvement/`, miroir, chien de garde, verdicts, **et le
  script d'append/validateur noyau** (placement corrigé : il vit côté vectorz, pas au
  catalogue). **Baseline rétroactive REDÉFINIE sur ce qui existe** (correction de
  réfutation : aucun `.supervision/` n'existe dans aucun repo, zéro run journalisé, et le
  schéma gelé n'a pas d'événement de handoff) : **premier AC = inventaire des données
  réellement disponibles** ; puis baseline sur les **N dernières PRs d'agents mergées**
  (gh/git) + front-matter `created` des fiches done/ ; **définition opérationnelle du
  point de handoff** (ex. passage ready-for-review, dernier commit d'auteur agent) testée
  sur PRs réelles ; `.supervision/runs/*` relégué en **source optionnelle** conditionnée à
  l'existence de runs conformes. Définition **durcie** de « PR sans retouche »
  (exclusions : rebase, formatage, commits de merge) **+ signal « reprise post-merge »**
  (PR/commit correctif sur mêmes fichiers ou même fiche sous X jours ⇒ requalification ou
  `incident.detected` — fenêtre X = seuil PO).
- **Fiche B — contrat v0.1 + première boucle fermée** (mega-city) : texte (≤8 clauses) +
  registre de surfaces + kit émetteur (convention d'appel uniquement) + **extension
  ezk-backlog du type amelioration** (modèle 0048) ; greffe dans **UN SEUL point
  d'émission** (ezk-archive — via une **rule de profil**, jamais les clauses ni un collage
  SKILL.md) ; puis fermer UNE boucle réelle manuellement : signal chiffré → fiche →
  approbation PO prouvée → essai en branche/PR → squash (= adoption) → capture
  (journal + re-bind) → **verdict rendu par le mesureur** à l'émission suivante. Le gel
  par **panel adverse manuel** et l'ADR Accepté viennent **après** la première boucle
  vécue (scission demandée par le juge 3).

**Critère de sortie du MVP, double** : (a) la baseline rétroactive (redéfinie ci-dessus)
est publiée ; (b) sous 3 cycles, **≥1 amélioration adoptée atteint son critère chiffré au
ledger, verdict rendu par le mesureur** (critère MÉTIER, pas machinerie) **OU** la clause
de moisson est retirée avec leçon consignée — **les deux issues sont des succès du
protocole**. Témoin binaire : un cycle complet `submitted→applied→verified|retired` au
ledger. `learnings.md` n'est **plus un témoin de succès** (métrique d'activité —
invariant 8) : indicateur diagnostique seulement ; le retrait formel du critère est un
arbitrage PO.

**Preuve de méthode-agnosticité** : test d'acceptation double-émetteur (deux méthodes
distinctes émettent les mêmes événements), câblé comme **critère de sortie ajouté à la
fiche 0038 au moment où elle sera tirée** — pas comme dépendance dure du MVP. **Le
« test n°1 » (le retrait de BMAD ne touche rien) est reconnu trivialement vide** tant que
le BMAD résiduel n'implémente pas le contrat (correction de réfutation — au MVP la seule
greffe est ezk-archive) : le reformuler en simple non-régression, ou greffer réellement le
kit dans la rétro du BMAD résiduel avant E4 pour en faire un vrai test, est un choix de
scope remonté au PO.

## 6. Métriques métier

| Métrique | Source (tierce) | Note |
|---|---|---|
| `pr_sans_retouche` (bool) | gh : commits humains post-handoff, arbre agent vs arbre mergé | Métrique-phare. Exclusions listées : rebase, formatage, merge commits. **Complétée du signal « reprise post-merge »** (correctif sans casse CI sous X jours ⇒ requalification/incident). Le **point de handoff** est défini opérationnellement dans la fiche A. |
| `temps_de_cycle` | front-matter `created` → squash-merge (git) | Fenêtres longues, tendances, pas de bruit. |
| `fidelite_ac` | checklist des Critères d'acceptation, **jugée hors de la boucle par le PO** | Budget PO chiffré dans la fiche : **≤5 min/cycle** (à valider). |
| `cout_tokens` | données mission-control (0022) | **Pilote uniquement** (correction de réfutation : en desktop la télémétrie est absente-et-dite-absente ; 0022 est todo). Câblée au tirage de 0038. |
| `improvementScore` (méta) | ledger : part des adoptées qui ont payé à échéance | Refondée sur outcomes (moisson Epics 9+12) ; **jamais une cible**, un thermomètre de la boucle. |
| *(proposés — arbitrage PO)* `taux_rejet_po`, `latence_submitted→approved` | ledger | Santé de la porte humaine (anti-complaisance approbative) ; hors cible d'optimisation ; condition d'examen avant activation FR59/policy. L'ajout touche une surface gelée. |

Choix et seuils = **surface gelée PO** (la fonction d'utilité est la governing variable
par excellence).

## 7. Risques et parades

| Risque | Parade contractuelle |
|---|---|
| Goodhart / gaming (précédent DGM : suppression des marqueurs de log) | Harnais et métriques gelés hors surface ; **miroir/hash hors de l'arbre, divergence = incident** ; triangulation multi-métriques ; `fidelite_ac` et retouche jugées hors boucle ; **signal reprise post-merge** contre le déport du gaming après le merge ; échantillonnage humain ; contournement = incident bloquant. |
| Forge de l'approbation humaine (clause 1 contournée par un write) | **Preuve externe non-productible par un agent** exigée sur chaque `proposal.approved` (gh API / commit signé — mécanisme au panel de gel) + miroir tamper-évident. |
| Complaisance générative (version agentique des 70-80 % d'action items de rétro morts) | Pas de chiffres → pas de proposition ; ≤1/cycle ; critère chiffré + péremption ; follow-through obligatoire en ouverture ; **verdict rendu par le mesureur, jamais par la méthode**. |
| **Complaisance APPROBATIVE du PO solo** (la pression qui a historiquement produit FR59) | Signaux proposés au mesureur : taux de rejet PO, latence submitted→approved (hors cible) — condition d'examen avant toute activation FR59/policy ; ajout = surface gelée, arbitrage PO. |
| Silence / surplace (obligations éludées en n'émettant plus) | **Borne calendaire tenue par le mesureur** (N émissions OU M jours) ; `improvement.overdue` / `proposal.expired` — l'horloge n'appartient pas à l'auditée. |
| Méta-travail qui cannibalise le produit (solo-dev) | Budget méta en **unités observables** (≤1 proposition/cycle enforcée, time-box, taille bornée ; ≤10 % tokens différé au pilote 0038) ; unproven bloque la suivante ; **clause de retrait avec plan de démantèlement complet**. |
| n=1 statistique | Baseline rétroactive **sur les PRs réelles existantes** (inventaire préalable) ; signaux binaires robustes ; verdict ambigu (delta plat, N insuffisant) **remonte au PO, ne s'auto-résout jamais en faveur de l'amélioration**. |
| Memory poisoning / experience-following | Écriture = diff git relu ; péremption ; consolidation auditée ; taille bornée. |
| Re-methodology-tightening rampant | Aucun point d'insertion dans les clauses ; kit séparé, greffe = rule de profil ; test double-émetteur à chaque révision ; relecture panel. |
| Process theater au carré | Témoin de succès = **critère chiffré au ledger uniquement** (learnings.md dégradé en diagnostic — c'était une métrique d'activité) ; validateur replay en CI = condition v0.2. |
| Mort de la sémantique d'époque 1 avant moisson | Fiche moisson **recalibrée** (correction de réfutation) : seuls RetroQualityMetricsService/improvementScore (quality-intelligence), ImprovementReviewSession (ceremony-engine) et `_bmad-output` sont menacés par L5/E4 ; la part **sprint-core** (ImprovementPersistenceService, RuleAutoApplyService, improvement-review) n'est sur aucune liste de résorption — antériorité à L5 **souhaitable**, pas un sauvetage in extremis ; rang = PO. |
| Collision avec la file de gravure | L'ADR se positionne explicitement : gel supervisabilité non rouvert, fenêtre DP8 respectée, policy 0028 gated, démo 0030 in-progress. |

## 8. Ce que le concept N'EST PAS

- **Pas une méthode ni un rituel** : le contrat n'exige que des événements et des
  artefacts ; il ne nomme aucune cérémonie, aucun point d'insertion. La rétrospective
  n'est qu'un émetteur possible.
- **Pas un chapitre de skill** : artefact à part, versionné, au catalogue — greffé par
  rule de profil, jamais collé dans un SKILL.md ; il survit au retrait de BMAD par
  construction.
- **Pas de l'auto-application** : v0.1 est deny-all intégral, à approbation **prouvée** ;
  l'autonomie est une délégation PO future, type par type, après preuve.
- **Pas une réouverture du gel supervisabilité v0.1** : il le lit, il écrit dans SES
  fichiers — et il ne s'approprie pas ses décisions D* (numérotation propre A*).
- **Pas un nouveau runtime ni un nouveau canal** : fiches ezk-backlog, capture, git,
  deux fichiers JSONL et leur miroir — tout le reste existe.
- **Pas un optimiseur permanent** : la boucle se déclenche sur faiblesse mesurée, plafonnée,
  et se retire elle-même (démantèlement complet spécifié) si elle ne paie pas.

## Arbitrages PO en attente (27)

1. Adoption du paradigme lui-même : valider (ou amender) la proposition de synthèse « contrat d'améliorabilité v0.1 » (révisée post-réfutation) et autoriser le passage de l'ADR-030 au panel adverse — rien n'est gravé à ce stade, l'ADR est PROPOSÉ.
2. Transport (ADR-030 Décision A2, décision structurante PO + panel, gravée dans l'ADR) : ratifier le dossier dédié `.improvement/` (vs rider `.supervision/`), ET — la violation confirmée de « un writer par fichier » l'impose — choisir entre DEUX fichiers à writer unique (outcomes.jsonl = mesureur / lifecycle.jsonl = script d'émission, proposition de la synthèse révisée) et un ledger unique doté d'un mécanisme d'authentification d'origine vérifié par le script. La « dérogation à D12 » est requalifiée en décision nouvelle A-transport inspirée de D12 — jamais une extension d'une décision gelée.
3. La création du foyer canonique `products/mega-city/docs/contrats/` pour les textes de contrat (et le rapatriement d'une référence vers la spec supervisabilité qui vit en capture cop1 §7).
4. Périmètre de l'auto-améliorable vs claims de l'ADR-030 (finding majeur confirmé) : soit étendre l'allowlist du registre à « ajout de rules via lawgiver capture kind=rule sous approbation PO » (en gelant seulement les governing rules existantes), soit maintenir les claims dégradés en « prépare ADR-021 Phase 3 / route vers le PO la question 6 d'ADR-022 » (formulation retenue par la synthèse révisée en attendant). Dans tous les cas, définir « LA LOI » dans le registre.
5. Le choix et les seuils des métriques North-Star initiales (pr_sans_retouche, temps_de_cycle, fidelite_ac, cout_tokens — cette dernière requalifiée « pilote uniquement »), la définition durcie de « PR sans retouche » (liste d'exclusions, définition opérationnelle du point de handoff, signal « reprise post-merge ») et toute modification ultérieure du harnais de mesure — surface gelée : c'est la governing variable par excellence, PO après panel.
6. Qui rend le verdict fidelite_ac et le budget humain associé : proposé = le PO, ≤5 min/cycle — à valider ou réassigner.
7. Le lot des seuils : budget méta requalifié en unités observables (≤1 proposition/cycle enforcée par le script d'append, time-box, taille de fiche bornée) avec le ≤10 % tokens différé au mode pilote 0038 — confirmer cette requalification (les trois réfutateurs convergent sur l'immesurabilité au MVP, mais le remplacement d'un seuil annoncé par un autre régime reste un arbitrage) ; le nombre N d'émissions avant statut unproven (proposé N=2) ; la borne calendaire M jours du chien de garde anti-silence (invariants 6-7, improvement.overdue/proposal.expired) ; la fenêtre X jours du signal « reprise post-merge ».
8. Scope MVP du gel des surfaces : câbler dès le MVP un garde CI de chemins gelés (véhicule : fiche 0040) ou requalifier honnêtement l'invariant 2 en classe B (honor-system) avec le miroir du mesureur comme seul détecteur et différer la garde — décision de scope/budget MVP, les deux réfutateurs ayant tranché en sens opposés ; la synthèse révisée retient la classe B honnête + miroir, la garde CI restant l'option ouverte.
9. Mécanisme d'authentification de l'approbation PO (finding majeur confirmé — sans lui la clause 1 est contournable par un simple write) : approbation GitHub du compte humain vérifiable via gh API, commit signé par la clé du PO, et/ou miroir append-only hors de l'arbre — le principe (preuve externe non-productible par un agent, refus du script sans référence) est requis, le mécanisme exact est à trancher au panel de gel puis PO.
10. L'approbation explicite de CHAQUE amélioration en v0.1 (allowlist vide, deny-all intégral — héritage FR61), désormais prouvée : confirmer que ce coût (~2 min/fiche + le geste de preuve) est acceptable ; aucun agent (ezk-pm inclus) ne peut approuver, il route et refuse seulement.
11. Toute extension future de l'allowlist d'auto-application (policy d'autonomie, item parking) : chaque type auto-applicable est une délégation explicite du PO, après panel adverse, révocable — jamais avant 3 cycles verified au ledger.
12. L'activation éventuelle de FR59 (auto-approbation à échéance 48 h avec veto signalé au digest) : consignée comme option parking, jamais active sans décision PO explicite après panel — et conditionnée à l'examen préalable des signaux de santé de la porte humaine.
13. Les 4 STOP d'ADR-0011 §3 : le contrat les cite tels quels et ne peut ni les redéfinir ni les déléguer ; toute évolution de leur périmètre reste une décision PO hors du contrat. ET consolidation de la chaîne normative (ADR-0011 est au statut « proposé », donc révisable — fragile pour le garde-fou n°1) : statuer ADR-0011 avant le gel du contrat, ou recopier les 4 STOP comme texte normatif de première main daté dans le contrat.
14. Toute question double-loop routée par le contrat (remise en cause d'un outcome cible, d'un invariant, d'une règle de LA LOI, ou du contrat lui-même) : tranchée par le PO après panel adverse, avis minoritaires consignés.
15. Tout verdict ambigu (delta plat, N statistiquement insuffisant, mesure non concluante) : remonte au PO et ne s'auto-résout JAMAIS en faveur de l'amélioration.
16. L'adoption ou le retrait d'une amélioration structurante (règle enforced, modification du comportement d'un agent, changement de schéma propagé par migration 0029) : panel adverse puis PO, registre docs/adr/README.md mis à jour dans la même PR.
17. La réintroduction d'une amélioration précédemment retirée (l'archive git la conserve ; seul le PO la ressuscite).
18. Le gel du contrat v0.1 lui-même (et de chaque version suivante) : panel adverse MANUEL (procédure éprouvée des panels 2026-07-13/15 — la fiche 0057 ezk-challenge est au statut idea, l'outillage viendra plus tard), lentilles fraîches + contre-lecture à froid, puis validation PO — idéalement APRÈS la première boucle fermée vécue.
19. Le verdict à 3 cycles sur la clause de moisson : retrait par composition YAML (avec leçon consignée et exécution du plan de démantèlement complet) ou reconduction — les deux issues sont des succès du protocole, mais le choix est PO.
20. Doctrine « le mesureur reste » : lui donner ou non son propre critère falsifiable de maintien (ex. chiffres référencés dans ≥1 décision PO par période de 3 cycles) — le réfutateur 3 conteste le cliquet posé d'office ; position produit à trancher par le PO.
21. Critère de sortie du MVP : entériner le retrait de learnings.md du statut de témoin de succès (métrique d'activité contredisant l'invariant 8, finding confirmé — la synthèse révisée le dégrade en indicateur diagnostique) et ne garder que le critère chiffré au ledger — modification du critère proposé, à valider PO.
22. Santé de la porte humaine (risque symétrique confirmé : complaisance approbative du PO solo, la pression qui a historiquement produit FR59) : ajouter ou non au mesureur les signaux taux-de-rejet-PO et latence submitted→approved (hors cible d'optimisation) comme condition d'examen avant toute activation des options parking FR59/policy — le choix des métriques est déclaré surface gelée PO par le dossier lui-même.
23. Test d'agnosticité : retirer/reformuler le « test n°1 » (retrait BMAD — reconnu trivialement vide tant que le BMAD résiduel n'implémente pas le contrat) de l'ADR-030 en simple non-régression, ou greffer réellement le kit dans le point de rétro du BMAD résiduel avant E4 pour en faire un vrai test — choix de scope PO.
24. Le positionnement dans la file de séquencement : priorités des fiches MVP A/B et de la moisson d'époque 1 — celle-ci RE-PRIORISÉE après correction des sources (sprint-core n'est ni dans L5 ni dans E4 ; seuls quality-intelligence, ceremony-engine et _bmad-output sont sur les listes) : antériorité à L5 souhaitable pour la part menacée, pas un sauvetage in extremis ; rang face à la démo 0030 in-progress, échéance éventuelle pour la part sprint-core, et confirmation que la fenêtre DP8 et la policy 0028 ne sont pas impactées.
25. L'ajout, au moment du tirage de la fiche 0038 (pilote natif), des critères de sortie « émet les artefacts du contrat d'améliorabilité » (test double-émetteur) et « métrologie tokens du budget méta (≤10 %) via stream SDK » — modification d'une fiche gated, donc arbitrage PO à ce moment-là.
26. Repo mega-city standalone : rapatrier ou non la fiche 0053 (article seed AI — contrat d'auto-amélioration, untracked, directement liée à ce chantier et désormais référencée par la note de concept) vers le subtree, et statuer sur la fuite du gel (commit post-gel 1e879a1 constaté) — décisions sur un repo que le PO a déclaré gelé.
27. Ajout backlog : mode journal-only de lawgiver capture (petite fiche mega-city) pour rendre pleinement déterministe la couture PROUVER (PR/squash = adoption) / ADOPTER (capture = ligne de journal + re-bind) sur les artefacts catalogue — création de fiche à valider PO.
