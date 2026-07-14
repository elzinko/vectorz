# Capture 2026-07-14 — Revue de groupe « deux sièges ? » & chemin vers l'usage Desktop

Statut : ✅ **rapport de revue** (panel 6 lentilles + 3 contradicteurs, synthèse tranchée).
Amont : [capture 2026-07-13](./2026-07-13-contrat-methode-et-versions.md) (§7 : D8–D13,
squelette v0.1) et [article contrat de supervisabilité](../articles/contrat-de-supervisabilite-v1.md) (§6).
**Gelé, jamais re-litigé ici** : D8–D13, squelette v0.1, MCP émetteur = chemin nominal Desktop,
politique de siège hors contrat. Ce rapport propose des décisions (§7).
**DP1–DP8 actées intégralement par le PO le 2026-07-14** (« acter tout + lancer le MVP ») —
exécution backlog : fiches **0030** (MVP démo) + **0031** (lecteur journal) ouvertes en P1,
**0027** re-priorisée P1 (scope réduit gravé), **0028** différée P3 (allowlist default-deny
gravée), **0029** dé-parquée du MCP émetteur (typage `authority` ajouté à ses différés v0.2).

## 1. La question posée (vision PO, reformulée)

Le PO (2026-07-14) veut **aller vite à l'usage réel** : un « manager » (ezk-product-builder)
tourne dans Claude Desktop et émet des événements ; cop1 (control plane) les monitore ; un
affichage plus fin côté méthode viendrait ensuite ; et le « siège » (continuer/arrêter) doit être
prenable par cop1 ou par lui. Son intuition : il y aurait **deux sièges** —

1. un siège **supervision** (monitorer, surveiller les tokens, voir les events) ;
2. un siège **management** (décider ce qu'on fait : idéation, dev, qa, archi…).

Quatre questions en découlent :

| # | Question |
|---|---|
| Q1 | 1 ou 2 sièges ? Où vit chacun (contrat vs méthode) ? |
| Q2 | Le « control plane méthode » (affichage fin) : produit séparé ou projection ? Qui le possède ? |
| Q3 | Le chemin le plus court vers l'usage Desktop réel (étapes, efforts, MVP de démo) |
| Q4 | Vectorz (ADR-027) et executor-seam (ADR-026) : bloquants, parallèles ou différables ? |

## 2. Verdict Q1 — un seul siège contractuel, deux autorités (option c, unanime)

### 2.1 Décompte

| Lentille | Verdict | Nuance propre |
|---|---|---|
| architecte-ontologie | (c) | le « siège management » mappe sur les briques (3)+(6) d'ADR-022, pas (1) |
| pm-produit | (c) | coût = un paragraphe de doc ; re-poser Q1 seulement après 3 runs réels |
| operateur-ux | (c) | « deux vues à l'écran, un seul levier contractuel » |
| red-team-risques | (c) | (b) = split-brain + double-writer sur `commands.jsonl` |
| prior-art | (c) | partage Tour/OCC de l'aviation ; « l'OCC ne parle jamais sur la fréquence Tour » |
| implementabilite-llm | (c) | un 2ᵉ siège contractuel n'est pas typable ; le siège management existe déjà (checkpoints ask/auto) |

**6/6 pour (c).** Aucune lentille ne défend (a) « il n'y a qu'un siège, point » ni (b)
« deux sièges dans `commands.jsonl` » ni (d).

### 2.2 Formulation finale du modèle d'autorité

L'intuition du PO est **ontologiquement juste** (il y a bien deux autorités) mais elles ne
vivent pas sur la même brique — et une des deux « chaises » qu'il décrit n'est pas un siège :

1. **Le moniteur** (surveiller tokens, voir les events) **n'est pas un siège** : c'est le rôle
   moniteur de D13, toujours actif, sans autorité. Regarder ne requiert aucun droit.
2. **Le siège de clairance** (régalien) : seul siège **au contrat**. Trois commandes typées
   `continue / hold / abort` dans `commands.jsonl`, un seul writer. Occupé par **l'humain ou
   cop1** (policy 0028), interchangeable — c'est le « siège échangeable » de D7/fiche 0033.
   Aveugle au métier (D4/D8) : il ne lit que les champs typés, jamais le contenu des artefacts.
3. **Le point de décision méthode** (le « siège management » du PO) : décider idéation/dev/qa/archi
   est du métier, donc **interne à la méthode, hors contrat** (D4). Il **existe déjà, implémenté** :
   les checkpoints `ask|auto` d'ezk-product-builder — tenus aujourd'hui par le PO dans sa session,
   délégables demain à un agent PM en passant `ask → auto`, sans toucher une ligne du contrat.
4. **Le pont entre les deux autorités est déjà gelé** : quand la méthode est à court d'autorité,
   elle pose un `gate` (D10 : « s'il faut attendre une décision, la méthode émet un jalon ») ou
   émet `escalation {authority}`. La question voyage dans le rapport (rendu inerte, D8) ; la
   réponse revient **par le canal de la méthode** (la session Desktop), jamais par `commands.jsonl`.

**Qui gagne en conflit — et pourquoi la précédence n'a pas besoin d'être écrite** (argument
red-team, adopté) : le canal d'avancement est unique et fail-safe (D3 : absence de `continue`
= attends). La méthode peut *proposer*, s'arrêter, escalader ; **seul le régalien fait avancer**.
Un `hold` budget bloque donc toujours une décision management « on continue », par construction,
sans règle de précédence à inventer. C'est plus strict que l'aviation (le pilote peut violer une
clairance en urgence ; ici la méthode peut s'arrêter librement mais jamais avancer sans clairance)
— et c'est une force.

### 2.3 Attaques retenues / rejetées

| Attaque | Sort | Justification |
|---|---|---|
| avocat-1 A1 (mapping gate→phase dans le panneau méthode cop1 = connaissance méthode en douce) | ✅ **retenue** | violerait D4/ADR-021 ; scope E2 verrouillé §3 |
| avocat-1 A2 (`commands.jsonl` dans le MVP = machinerie de siège avant le 1er run) | ✅ **retenue** | le gelé dit : en moniteur, le siège est l'humain dans SA session, `gate.resumed` self-reported suffit ; 5 lentilles sur 6 diffèrent l'étape — operateur-ux minoritaire (§6) |
| avocat-1 A3/A4 (nommage « Dispatch »/« directeur de méthode » + ADR maintenant = objets en germe) | ✅ **retenue** | zéro substantif nouveau dans les docs cop1 ; une ligne en capture suffit (§7 DP1) ; lexique ATC + révision ADR-022 → fenêtre post-démo (§5) |
| avocat-2 A1 (le journal ne dit pas « qui a décidé de passer en QA ») | ⚠️ **partiellement retenue** | la moitié « origine de la reprise » est déjà dans le schéma : `gate.resumed {command_ref?}` — présent = clairance via commandes, absent = self-reported en session ; la mission-control DOIT afficher cette origine (risque 2 operateur-ux, adopté). La moitié « quelle décision métier » appartient aux artefacts de la méthode (rapports), pas au journal de supervision : le journal n'a pas vocation à auditer le métier (D4). |
| avocat-2 A2 (sans typage d'autorité, la policy 0028 auto-continuera des gates-direction) | ✅ **retenue dans son inquiétude, rejetée dans son remède** | vrai problème, mais le remède (champ `authority` obligatoire dans `gate.reached`) rouvre le squelette v0.1 gelé < 48 h. Le remède compatible-gel : la policy 0028 est **hors contrat** (gelé) — elle portera une **allowlist de `gate_id` auto-continuables, default deny**. cop1 ne comprend pas les gates ; il obéit à une liste. Testable par 0027 côté policy. |
| avocat-2 A3 (délégation ask→auto invisible) | ⚠️ **consignée** | vrai, mais c'est de la config méthode, hors contrat par gel. Recommandation non-normative : la skill déclare son mode checkpoints dans le payload de `run.started` (le payload est à la méthode). À re-poser en v0.2 (§6). |
| avocat-2 A4 (l'économie du gel plaide pour typer maintenant) | ❌ **rejetée** | l'argument coupe dans les deux sens : le multi-repo-bump qu'il craint est précisément ce que déclencherait une modif du schéma aujourd'hui, avant tout émetteur. La question `authority` est mise à l'agenda de la révision v0.2, après 3 runs réels (§6). |
| avocat-2 concessions (pas de bus management dans `commands.jsonl` ; la démo vit sans canal management) | ✅ actées | — |
| réalité-op A1–A5 (racine projet MCP, popups Desktop, daemon/watch-roots, worktree, orphelins) | ✅ **toutes retenues** | intégrées au chemin Q3 (§4) — ce sont des trous d'exécution, pas des désaccords de modèle |

## 3. Verdict Q2 — le viewer méthode : projection, jamais un plane séparé (unanime)

**Position** : le « control plane pour la méthode » du PO n'est **pas un produit n°3** — c'est
une **projection au-dessus du MÊME journal** (`.supervision/runs/<id>/` : events + `report_ref`).
D12 : un seul transport ; un deuxième plane exigerait un deuxième canal. « Rendre ≠ interpréter »
(D8) contraint le *superviseur et le siège*, pas tout lecteur : un viewer peut interpréter des
phases tant qu'il est **read-only et jamais une entrée du siège** (garde red-team, non négociable).

**Propriété** :

| Quoi | Propriétaire | Contenu |
|---|---|---|
| Coquille / surface | **cop1** (mission-control) | tail des runs, états, bandeau régalien, badge classe A/B, violations, rendu **inerte** (échappé, refs confinées) |
| Sémantique | **la méthode** (mega-city) | sens des gates, phases, burndown — livrés dans SES rapports/artefacts, versionnés, adoptés aux gates (D2/D11) |

**Séquence de valeur** (pm-produit, adoptée) : **v0 = gratuit** — le rendu inerte des
`report_ref` EST le method viewer : la méthode met son burndown/phases dans ses rapports
markdown, cop1 les affiche tels quels. **v1 = plus tard, sur douleur**, quand un journal réel
et un second consommateur existent — module de rendu fourni par mega-city, hébergé par cop1.

**Verrous adoptés** (attaques avocat-1 A1/A5 + risque 3 operateur-ux) :
- **interdiction de tout mapping gate→phase côté cop1** — la phase courante n'est pas déduite
  par cop1, elle est lue dans les rapports de la méthode ;
- panneau méthode **strictement read-only** : aucune décision métier ne se prend depuis la
  mission-control — elle se prend dans la session de la méthode ;
- la clause « viewer v1 » n'entre dans **aucune fiche** aujourd'hui.

## 4. Verdict Q3 — le chemin le plus court vers l'usage Desktop

Le mode moniteur (D7/D13) exige **zéro executor, zéro siège cop1** — c'est le chemin court,
unanime. Les cinq séquences du panel convergent ; la synthèse intègre les trois amendements de
réalité-opérationnelle (étape 0, résolution de racine, dimensionnement honnête du lecteur).

### 4.1 Séquence consolidée

| # | Étape | Effort | Contenu & points durs |
|---|---|---|---|
| 0 | **Setup Desktop (checklist explicite)** | S | config MCP par projet (`project_root` fixé à l'**init du serveur** via env/config — jamais paramètre d'outil, sinon le LLM contrôle où l'on écrit), allowlist « toujours autoriser » des 5 outils (sinon 15-20 popups tuent la classe B), lancement du daemon cop1, config **watch-roots** (quels projets tailer), **règle worktree** : `.supervision/` vit dans l'**arbre principal** du projet supervisé, gitignoré d'office |
| 1 | **MCP émetteur minimal** (lib d'append + serveur) | S/M | mega-city 0050 + **dé-parquer la fiche 0029** (D12 en fait le chemin nominal, elle était parquée v0.2). **5 outils étroits** — `run_start`, `gate_reached(gate_id, outcome, report_markdown?)`, `gate_resumed`, `escalate(type, detail)`, `run_finished(status)` — jamais d'`emit_event` générique (mode d'échec « collapse » connu). Enveloppe `{event_id, run_id, seq, ts, contract, type}` **calculée par le serveur, jamais par le LLM** (même principe que `upgrade_ok` mécanique, D11) ; le serveur écrit le rapport et renvoie le `report_ref` ; compteur `seq` relu au démarrage ; **refus d'un 2ᵉ `run_start` sur un run ouvert** ; relance après `run.finished` = **nouveau `run_id` obligatoire** ; le résultat d'outil de `gate_reached` dit « STOP et attends » |
| 2 | **Consignes d'émission dans ezk-product-builder** | S | ~15 lignes : `run.started` au lancement, `gate.reached` à **chaque checkpoint existant** (zéro nouveau rituel), `run.finished` ; vocabulaire distinct checkpoint ≠ gate dans la skill (risque prior-art n°3) |
| 3 | **Validateur 0027, scope réduit** (parallèle aux étapes 1-2) | S/M | enveloppe + invariant + seq (hash-chain différée) ; **enum fermée de commandes** (tue la dérive `continue{next_phase}`) ; règle « événement après `run.finished` = violation » ; fixtures synthétiques. Parallèle, **jamais bloquant l'émetteur** — mais son vert fait partie du script de démo |
| 4 | **Lecteur `.supervision/runs/` dans la mission-control** (nouvelle fiche, ne pas étirer la 0022) | M/L | `JournalWatcherAdapter` (fs.watch + offset) → `EventBus.emit` → SSE `/events` existant (`HttpServer.setEventBus` diffuse déjà tout). Mais vue nouvelle : replay machine à états, badge **classe B en gros**, « dernier événement il y a Xs », formulations « aux dernières nouvelles », **origine de chaque reprise affichée** (`command_ref` vs self-reported), timeout d'orphelin `stalled → presumed_dead` après N min. Le « M » du panel est optimiste : chiffrer M/L |
| 5 | **Différé après 3 runs réels** : `commands.jsonl` côté cop1 + policy 0028 | M | policy 0028 avec **allowlist de `gate_id` auto-continuables (default deny)** + plafond de `continue`/heure (anti spam-de-gates, red-team) ; il faut des `outcome` vécus pour écrire une policy sensée |

### 4.2 MVP de démo (déroulé concret)

Exigence actée (réalité-op) : la fiche MVP contient le **déroulé minute-par-minute**, du
double-clic Desktop au badge vert — toute étape non écrite est réputée manquante. Le squelette :

1. Le soir : le PO lance ezk-product-builder dans Claude Desktop sur un vrai sujet ;
   la session appelle `run_start` → `events.jsonl` naît dans `<projet>/.supervision/runs/<id>/`.
2. La mission-control (daemon déjà lancé, étape 0) affiche le run **live** :
   `launched → running → at_gate`, badge « classe B — best-effort », tokens
   « mesurés | absents-et-dits-absents », âge du dernier événement.
3. Au checkpoint, la skill émet `gate_reached` ; le rapport est rendu **inerte** dans la
   mission-control ; le run est garé 🟡.
4. Le matin : le PO **continue dans SA session Desktop** (mode moniteur — aucun bouton cop1) ;
   la skill émet `gate.resumed` (self-reported) ; la mission-control l'affiche avec son origine.
5. `run_finished` ; le **validateur 0027 passe au vert** sur le dossier du run — et si un event
   manque, **la perte détectée fait partie du script** (« c'est ça le produit », pm-produit).

**Aucun siège cop1, aucune commande** — et tout le contrat est prouvé : émission Desktop,
moniteur toujours actif, invariant exécutable. C'est le premier run réel qu'exige l'article
(§ final) — le moment « l'avion apparaît à l'écran » (prior-art).

### 4.3 Mapping fiches

| Étape | Fiche |
|---|---|
| 0 | checklist dans la fiche MVP (nouvelle, cop1) |
| 1 | mega-city **0050** (kit émetteur) + **dé-parquer 0029** (MCP) |
| 2 | mega-city 0050, item consignes skill |
| 3 | cop1 **0027** (validateur), scope réduit |
| 4 | **nouvelle fiche cop1** « lecteur journal mission-control » (ne pas étirer 0022) |
| 5 | cop1 **0028** (policy), différée — y graver l'allowlist default-deny |

## 5. Verdict Q4 — Vectorz & executor-seam : différables tous les deux (unanime)

| Chantier | Verdict | Pourquoi |
|---|---|---|
| **Vectorz (ADR-027)** | **différable — et à ne PAS paralléliser** | déplacement mécanique de dossiers ; le journal vit dans le *projet supervisé* (`.supervision/runs/`), pas dans le repo cop1 → zéro impact sur la couture Q3. Migrer *pendant* le câblage du watcher/CI = churn de chemins en plein vol. Fenêtre bornée **après la démo**, relecture humaine exigée par l'ADR lui-même |
| **Executor-seam (ADR-026/0020)** | **différable (parallèle si quelqu'un d'autre le fait)** | machinerie du mode *pilote* (AgentSessionPort) ; la démo est du pur mode *moniteur*. Mieux : le journal au format du contrat EST l'event-stream seam — la démo prouve l'agent-indépendance par un chemin plus court que le StubExecutor. Redevient chemin critique quand le siège passe à cop1 (après 0028) |

**Groupés dans la même fenêtre post-démo** (amendement avocat-1 n°5, adopté contre le « vite »
de l'architecte) : la **matérialisation de la révision d'ADR-022** (brique 1 = « octroie des
clairances », le loop « tire & dispatche » est caduc) et l'éventuel **lexique ATC** — avec ses
cassures d'analogie documentées (pas de plan de vol : D8 a choisi le chien de garde temporel,
pas topologique ; moniteur = alarme, pas sas ; asymétrie avancer/s'arrêter).

## 6. Divergences NON résolues (minoritaires consignés)

1. **Typage de l'autorité dans le schéma (avocat-2-sièges, seul contre tous).** Position :
   `gate.reached.authority: "clearance"|"direction"`, `gate.resumed.resumed_by{…}`,
   `seat.changed`, dès v0.1 — « un enum aujourd'hui : ~zéro ; après 3 runs : une migration ».
   Rejeté (gel v0.1) mais l'inquiétude A2 est traitée hors schéma (allowlist policy 0028) et la
   question est **à l'agenda de la révision v0.2, après 3 runs réels** — avec sa jumelle A3
   (journaliser la délégation ask→auto du point de décision méthode).
2. **Validateur d'abord vs jamais bloquant.** Red-team et architecte veulent 0027 *avant* toute
   démo (« sans juge, on applaudit du théâtre ») ; avocat-1 et pm-produit le veulent parallèle,
   jamais bloquant. Tranché : **parallèle, mais son vert fait partie du script de démo** — le
   désaccord sur « que faire si 0027 n'est pas prêt le jour J » reste ouvert.
3. **`commands.jsonl` dans le MVP (operateur-ux, minoritaire).** Sa boucle fermée
   (bouton Continue + `check_clearance`) est rejetée du MVP (attaque avocat-1 A2) mais reste la
   **première étape post-démo** ; son exigence d'afficher l'origine des reprises est adoptée dès
   l'étape 4.
4. **Dimensionnement.** implementabilite-llm chiffre le MVP à ~1 journée de dev ;
   réalité-opérationnelle le qualifie de fiction (étape 0 non chiffrée, lecteur M→L). Tranché en
   faveur du chiffrage prudent (étape 0 = S à part, lecteur = M/L), mais l'écart est consigné :
   si l'étape 1 dépasse 2 jours, re-scoper.

## 7. Décisions proposées à l'humain (oui/non)

- **DP1 — Acter l'option (c)** : un seul siège contractuel (clairance : `continue/hold/abort`,
  `commands.jsonl`, occupable par humain ou cop1) ; le « siège management » = les checkpoints
  ask/auto d'ezk-product-builder, hors contrat, reliés par `gate` + `escalation{authority}`.
  Coût : **une ligne en capture, zéro substantif nouveau, zéro ADR maintenant**. Q1 ne se
  re-pose qu'après 3 runs réels sous v0.1.
- **DP2 — Verrouiller le scope viewer** : mission-control = bandeau régalien + rendu inerte des
  `report_ref` ; interdiction de tout mapping gate→phase côté cop1 ; panneau méthode read-only ;
  aucune fiche « viewer v1 » aujourd'hui.
- **DP3 — Dé-parquer la 0029 et ouvrir mega-city 0050** : MCP émetteur 5 outils étroits,
  enveloppe calculée serveur, `project_root` à l'init (jamais paramètre d'outil), single-writer,
  nouveau `run_id` à toute relance.
- **DP4 — Ouvrir la fiche cop1 « lecteur journal mission-control »** (M/L, séparée de la 0022) :
  watcher + replay + badge classe B + origine des reprises + timeout `presumed_dead`.
- **DP5 — Livrer 0027 en parallèle** (scope réduit : enveloppe/invariant/seq, enum fermée,
  violation post-`run.finished`) ; son vert fait partie du script de démo.
- **DP6 — Acter l'étape 0** : checklist setup Desktop chiffrée S à part (config par projet,
  allowlist, daemon, watch-roots) + **règle worktree** : `.supervision/` dans l'arbre principal,
  gitignoré, décidé avant le premier run de dogfooding sur cop1.
- **DP7 — Différer `commands.jsonl` + policy 0028 après 3 runs réels**, en gravant dès
  maintenant dans la fiche 0028 : allowlist de `gate_id` auto-continuables **default deny** +
  plafond de `continue`/heure — et mettre la question `authority` (typage v0.2) à l'agenda de la
  révision qui suivra.
- **DP8 — Grouper post-démo, fenêtre bornée** : migration Vectorz (ADR-027), matérialisation de
  la révision ADR-022, éventuel lexique ATC (avec cassures d'analogie documentées).

## 8. Candidats fiches / ADRs à découper

| Artefact | Repo | Contenu | Quand |
|---|---|---|---|
| Fiche 0050 (existe, à armer) | mega-city | kit émetteur : lib append + MCP 5 outils + consignes skill ezk-product-builder | maintenant (DP3) |
| Fiche 0029 (à dé-parquer) | mega-city | MCP émetteur — n'est plus v0.2 : D12 en fait le chemin nominal | maintenant (DP3) |
| Fiche nouvelle « lecteur journal mission-control » | cop1 | watcher `.supervision/runs/` → EventBus → SSE, vue run, badge B, presumed_dead | maintenant (DP4) |
| Fiche 0027 (existe, scope réduit) | cop1 | validateur : enveloppe + invariant + seq + enum commandes + règle post-finished | maintenant (DP5) |
| Fiche MVP démo | cop1 | étape 0 (checklist) + déroulé minute-par-minute + règle worktree | maintenant (DP6) |
| Fiche 0028 (existe, différée) | cop1 | policy : allowlist gate_id default-deny, plafond continue/h | post-3-runs (DP7) |
| Révision ADR-022 | cop1 | brique 1 = « octroie des clairances » ; le loop « tire & dispatche » est caduc | post-démo (DP8) |
| ADR-027 exécution | cop1 | migration Vectorz, fenêtre bornée, relecture humaine | post-démo (DP8) |
| ~~ADR nommage ATC~~ | — | rejeté maintenant ; au mieux annexe de la révision ADR-022 | post-démo, si utile |

— Rapport de synthèse, revue de groupe du 2026-07-14. Minoritaires consignés §6 ;
rien de gelé n'a été rouvert.
