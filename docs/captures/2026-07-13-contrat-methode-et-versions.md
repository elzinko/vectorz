# Capture 2026-07-13 — Contrat de méthode pilotable & cycle de vie des versions

Statut : 🚧 **capture vivante** d'une session `/architecture` + `/product-brainstorming` (2026-07-13).
**Pré-ADR** : ce doc fixe les points d'accord et les questions ouvertes ; les ADRs se découperont
depuis ici. Schémas à générer plus tard (ezk-diagram) depuis la prose des §1 et §4.
Voir : ADR-021 (couture), ADR-022 (ontologie, WIP), ADR-023 (packaging), fiche 0024,
mega-city fiches 0016 / 0033.

## 1. Les trois plans à ne plus confondre

Le sujet « dépendance cop1 ↔ mega-city » mélange en réalité trois plans, avec des réponses
différentes :

| Plan | Question | État |
|---|---|---|
| **DEV** | faire évoluer cop1 et mega-city en parallèle (sessions, worktrees, skew) | ✅ traité par ADR-023 : monorepo vendoré, un seul arbre, tuple `(cop1@sha, mega-city@vX)` par construction |
| **LIVRAISON** | mettre à jour les produits *installés* chez l'utilisateur | ⚠️ principe posé (ADR-023 §5 : MAJ = migration + rollback proposé) ; mécanique mince — aujourd'hui une install = un checkout git donc `git revert` suffit ; le jour où cop1 est distribué packagé, il faudra une vraie machinerie release/rollback |
| **RUN** | un run de supervision en cours pendant qu'une version bouge | 🆕 c'est le plan neuf — décisions §2 |

## 2. Décisions de la session (à ADR-iser)

- **D1 — Pas de migration à chaud, jamais.** Mettre à jour cop1 (ou mega-city) pendant que cop1
  tourne est un **choix explicite de l'utilisateur**, jamais automatique, et implique un
  **redémarrage de cop1**. (Feature future, hors scope : cop1 *propose* le meilleur moment —
  comme le prompt de MAJ de Claude Code qui prévient que des process tournent.)
- **D2 — L'adoption de version se fait aux frontières de gate/story, jamais en vol** — et elle est
  **affichée visiblement à l'utilisateur au moment de l'adoption** (« ce run passe de
  mega-city v1.3 → v1.4 »).
- **D3 — Contrat d'étape fail-safe.** Par défaut la méthode **s'arrête** au gate ; c'est cop1 qui
  dit explicitement « continue ». Jamais l'inverse (un défaut « continue » + interface en panne
  = boucle infinie silencieuse ; un défaut « stop » + interface en panne = run bloqué visible).
- **D4 — cop1 ne connaît JAMAIS la méthode.** L'escalade *métier* (manager / scrum master / PM)
  vit **dans la méthode**. Ne remonte à cop1 que l'escalade *control-plane* (budget, blocage,
  besoin d'autorité humaine), sous forme d'**événements typés** — cop1 sait « la méthode demande
  un humain », jamais « pourquoi » au sens métier. Frontière exacte à vérifier (§5 Q1).
  ⚠️ *budget* retiré le soir même (D9, §7) : seule l'escalade `blocked | authority` traverse ;
  le budget est mesuré et freiné côté superviseur, la méthode ne le connaît pas.
- **D5 — cop1 ne tourne pas sans méthode.** Reformulation d'ADR-021 : « mega-city absent ⇒ cop1
  tourne » devient « **cop1 exige *une* méthode valide implémentant le contrat** ; mega-city en
  est la *première implémentation*, pas une dépendance ». Config de méthode invalide ⇒
  **fail-fast au démarrage**, jamais un run dégradé sans méthode. (L'anti-couplage d'ADR-021
  reste intact : cop1 ne dépend pas de *mega-city* ; il dépend du *contrat*.)
- **D6 — Monorepo confirmé dans son principe, mais ⚠️ révisé le soir même** : le vrai besoin
  n'est pas l'option A d'ADR-023 (copie vendorée, source de vérité restant le repo standalone —
  ce qui **garde** les 2 repos / 2 backlogs / 2 sessions, la douleur de dev). C'est un
  **co-développement dans un seul repo** (option E, cf. Q6) : paquets indépendants, backlog
  partagé, séparables plus tard (sortie = option D). Les garde-fous d'ADR-023 §6 restent
  (zéro import croisé, mega-city buildable/releasable seul).
- **D7 — Deux modes de consommation de cop1 : pilote et moniteur.** En mode *pilote*
  (l'existant), cop1 lance les sessions via le SDK et tient le siège du « continue ». En mode
  *moniteur*, la méthode tourne dans une session interactive de l'utilisateur (Claude
  Desktop/Code — ex. ezk-product-builder lancé à la main) : **l'humain tient le siège** (les
  interruptions/gates s'affichent dans *sa* session), cop1 ne fait que consommer le flux
  d'événements et suivre l'avancement du projet, indépendamment. **Le contrat est identique
  dans les deux modes ; seul le détenteur du siège d'autorité change** — c'est le « siège
  échangeable » de mega-city fiche 0033. Nuance : en mode moniteur, l'invariant fail-safe
  devient de la *détection* (« gate franchi sans continue » signalé/audité), pas de
  l'*enforcement*. Canal d'émission naturel, cohérent ADR-021 (fichiers, pas d'API) : un
  journal d'événements append-only dans le projet, que cop1 taile (précédent : l'event stream
  d'OpenHands) ; un émetteur MCP reste possible plus tard.

## 3. Le repositionnement de mega-city (révision d'ADR-021 à venir)

mega-city n'est plus *seulement* « fournisseur de config » : c'est **l'implémentation de
référence d'un contrat de méthode pilotable**. Le contrat — candidat de nom : **« contrat de
supervisabilité » / Supervisability Contract** (alternatives dans le
[prior art](./2026-07-13-prior-art-contrat-supervisabilite.md) §4) — définit ce que **toute**
méthode multi-agent doit exposer pour être supervisable par un control plane aveugle au métier :

1. **déclaration d'étapes/gates** — la méthode déclare la fin d'une étape en remontant un
   rapport structuré (l'idée « ezk-product-builder déclare la fin d'étape ») ;
2. **arrêt par défaut au gate** (D3), reprise sur ordre explicite du superviseur ;
3. **escalade typée** control-plane uniquement (D4) ;
4. **schéma d'événements versionné** — c'est l'interface « qui elle est versionnée » ;
5. **adoption de version aux gates uniquement** (D2).

Ceci **étend ADR-021 sans le contredire** : la couture reste des *fichiers + événements*,
jamais une API/lib partagée. Et c'est la **brique 3 d'ADR-022 (Method port) rendue dynamique** :
le port statique (`sprint-status.yaml`) et le port vivant (agent méthode qui déclare ses étapes)
deviennent deux adaptateurs du même contrat.

Le véhicule naturel du contrat est l'**event-stream seam** déjà identifié comme commit n°1 du
positionnement control-plane : un flux d'événements typés (`step.declared`, `step.report`,
`escalation.raised`, `run.continue` / `run.stop`) émis/consommés à la couture — n'importe quelle
méthode qui parle ce flux est pilotable, l'UI ne fait que le rendre, et l'agent-indépendance
est prouvée par construction. *(Note 2026-07-13 soir : ce vocabulaire d'esquisse est remplacé
par celui du §7 — en particulier `run.continue`/`run.stop` deviennent les commandes journalisées
`continue`/`hold`/`abort` de `commands.jsonl`.)*

## 4. Dettes / incohérences repérées dans le code actuel

- **`BmadCycle.ts` (sprint-core) = du savoir de méthode dans le cœur.** Le cycle canonique servi
  en fallback quand le playbook n'énumère pas les commandes de phase contredit « superviseur
  aveugle à la méthode ». À extraire derrière le Method port quand le contrat existera.
- **Le pin par story existe *de facto*, pas *par intention*.** Chaque story tourne dans un
  worktree figé (ADR-018) donc un bump en vol ne touche pas la story en cours — mais : aucune
  règle écrite ne le garantit, aucun test ne protège « les règles se chargent depuis le worktree »
  (à vérifier : `loadRules(projectRoot)` dans `DefaultBMADCommandRunner` — worktree ou arbre
  principal ?), rien ne **logge** le tuple `(cop1@sha, mega-city@vX)` sous lequel une story a
  tourné, et l'UI ne montre rien. Rendre intentionnel = règle (ADR) + log (Track-2/session log)
  + test + affichage UI (D2).
- **Isolation `~/.claude` : déjà largement colmatée dans le code — correction de la v1 de cette
  capture.** Les sessions d'exécution passent déjà `settingSources: ['project']`
  (`AgentSdkSessionAdapter.ts:298`) et l'AuthChecker charge zéro settings (`settingSources: []`) :
  la config globale de l'utilisateur ne fuit PAS dans les runs SDK. Reste : (a) auditer
  `AgentSdkSupervisorAdapter` (pas de `settingSources` explicite repéré — la session du
  superviseur LLM pourrait charger plus que prévu), (b) un test qui verrouille la garantie,
  (c) noter qu'en mode moniteur (D7) la session est PAR DESIGN celle de l'utilisateur — là,
  l'héritage de `~/.claude` est le comportement voulu, pas une fuite.

## 5. Questions ouvertes

- **Q1** — Frontière exacte escalade *métier* vs *control-plane* (D4 « à vérifier ») : où passe
  la ligne quand le manager de la méthode est lui-même à court d'autorité ?
- **Q2** — ✅ **répondu le 2026-07-13** : balayage prior art fait (10 angles, 11 agents) →
  [2026-07-13-prior-art-contrat-supervisabilite.md](./2026-07-13-prior-art-contrat-supervisabilite.md).
  Verdict : **le contrat complet n'existe nulle part** ; le trou unanime = la polarité fail-safe
  (stop-par-défaut comme exigence vérifiable) ; voisins les plus proches : LangGraph/Agent
  Protocol (6/10), Rel(AI)Build (papier, 5/10), BPMN external tasks (5/10) ; **créneau d'article
  libre** (angle : « les control planes gardent les actions, personne ne garde les méthodes »),
  fenêtre qui se referme (2026). Squelette v0 du contrat inclus (§5 du doc prior-art).
- **Q3** — Multi-projets : une UI unique + N moteurs (cop1/mega-city) par projet, versions par
  moteur. **Explicitement hors scope maintenant** — next step après « une instance, un projet ».
- **Q4** — « cop1 choisit/propose le meilleur moment pour la MAJ » — feature future (cf. D1),
  fiche à créer le moment venu.
- **Q5 — Qui détient la config outils/plugins/droits ?** Réponse déjà à moitié dans le code :
  le **catalogue** (quels agents/skills/plugins existent dans le projet) appartient à la
  **méthode** — mega-city le matérialise en settings projet (cap claude-code, pass-through),
  et la session SDK le consomme via `settingSources: ['project']`. La **policy d'exécution**
  (allowedTools/disallowedTools, `canUseTool`, permission mode, budget, model-tiering)
  appartient à **cop1** (`AgentSdkSessionAdapter`, `orchestrator.ts`). La couture = les
  settings projet. **Cap architectural** (indépendance LLM *et* méthode) : la policy est
  aujourd'hui exprimée en noms d'outils Claude (`['Skill','Read','Write','Edit','Bash',…]`)
  → à abstraire en capacités neutres (« éditer des fichiers », « exécuter du shell ») dans le
  port AgentSession (fiche 0020), chaque adaptateur (Claude SDK, LM Studio, Docker models…)
  traduisant vers ses noms natifs.
- **Q6 — « Vrai » monorepo de développement (révision d'ADR-023 à écrire).** Constat : l'option
  A retenue par ADR-023 (copie vendorée, source de vérité = repo mega-city standalone) ne résout
  PAS la douleur réelle — 2 repos liés, 2 backlogs, 2 sessions Claude Desktop — elle l'aggrave
  même (deux « homes »). Besoin exprimé = **option E : co-développement dans un seul repo**,
  paquets indépendants, **backlog partagé**, séparables plus tard. À noter : E est *meilleure*
  que A sur toutes les forces d'ADR-023 (tuple = SHA natif, migration atomique native, zéro
  drift/sync) ; la seule force de A était l'identité standalone de mega-city — c'est le prix
  accepté. L'argument qui avait disqualifié C (« tue l'host-agnosticité ») ne tient pas contre
  E : l'host-agnosticité se perd par les *imports et la direction des dépendances*, pas par la
  *co-localisation* — gardes-fous CI à l'appui. À trancher dans l'ADR de révision :
  (i) racine (repo cop1 — pragmatique, déjà un monorepo pnpm outillé — vs umbrella neutre à la
  `muti` — plus propre, migration ×2) ; (ii) fusion des backlogs (numérotations en collision :
  cop1 est à 0025, mega-city à 0047 — proposer : nouvelles fiches dans la séquence racine avec
  champ `product: cop1|mega-city|transverse`, fiches mega-city ouvertes re-numérotées avec table
  de correspondance, `done/` archivés sur place) ; (iii) ADRs : les deux séquences existantes
  restent en place (immuables), une seule séquence racine pour la suite (déjà de facto le cas —
  ADR-021/022/023 y vivent) ; (iv) consommateurs de mega-city (symlinks `~/.claude`, deploy.sh)
  re-pointés par un simple re-`bind` (mega-city ADR-0006).
  **Arbitrages utilisateur (2026-07-13 soir)** : (i) acté — racine = repo cop1, **versionnement
  d'ensemble pour le moment** (releases du monorepo), avec les garde-fous de séparabilité
  (mega-city garde son `package.json`/version, build `--filter` autonome, zéro import croisé)
  pour que la séparation et le versionnement indépendant restent possibles le jour venu ;
  (ii) le champ `product` n'existe pas encore dans la skill ezk-backlog → **fiche mega-city
  0048 créée** (`features/0048-champ-product-ezk-backlog.md`) : champ optionnel, demandé par
  `add` en repo multi-produits, adoption progressive aux prochaines utilisations, propagation
  via la fiche 0029 (propagation des MAJ de skills).

## 6. Candidats fiches / ADRs à découper depuis cette capture

1. **ADR « contrat de supervisabilité »** — le §3 (extension ADR-021 + brique 3 ADR-022
   dynamique + event-stream seam). Prior art balayé (Q2 ✅), sources lues de première main
   (fiche 0025 ✅) : partir du **squelette v0.1 du §7** (qui révise le v0 du prior-art §5)
   et des emprunts identifiés (lifecycle A2A, escalation non-interruptive BPMN,
   Pinned/Signals Temporal).
2. **ADR « sémantique de version d'un run »** — D1 + D2 + pin par story intentionnel.
3. **Fiche** : log + affichage UI du tuple de versions par story/run.
4. **Fiche** : verrouiller l'isolation settings des runs — l'essentiel est déjà en place
   (cf. §4) ; reste audit `AgentSdkSupervisorAdapter` + test de non-régression.
5. **Fiche** : MAJ produit guidée (vignette « des runs tournent, attendez la fin ») ; plus tard,
   cop1 propose le moment (Q4).
6. **Fiche mega-city** : acter que mega-city implémente le contrat (miroir du §3) + extraction
   de `BmadCycle` côté cop1.
7. **ADR de révision du packaging (option E, Q6)** — ✅ **écrit le 2026-07-13** :
   [ADR-025](../adr/ADR-025-monorepo-codev-cop1-megacity.md) (co-développement monorepo racine
   cop1, versionnement d'ensemble, backlog partagé, garde-fous CI de séparabilité ; révise la
   Décision §1 d'ADR-023, conserve la couture ADR-021 et la sortie D).
8. **Fiche 0025 — créée le 2026-07-13** : article « contrat de supervisabilité »
   ([features/0025](../../features/0025-article-contrat-supervisabilite.md)) — lecture de
   première main des 4 sources + article publié dans `docs/articles/` (base interne citable,
   antichambre de l'ADR du §6.1).
9. **Fiche** : mode moniteur (D7) — canal d'émission d'événements depuis une session
   interactive (journal append-only tailé par cop1) + UI de suivi sans pilotage.

## 7. Décisions du 2026-07-13 (soir, post-article) — D8–D13, actées en v0.1

Issues du challenge utilisateur sur l'article (fiche 0025, PR #57) puis de deux passes de
discussion. **Actées le 2026-07-13**, puis **passées au panel design** (5 lentilles :
protocole distribué, red-team, implémentabilité LLM, cohérence corpus, opérateur) — verdict
unanime « corriger puis geler » ; les corrections du panel sont intégrées ci-dessous
(squelette v0.1 révisé + amendements marqués 🛠) ; compte rendu en fin de section.

- **D8 — Le superviseur ne connaît pas le plan de la méthode.** Pas de manifeste topologique
  obligatoire : la méthode **se signale à ses jalons** au fil de l'eau (`gate.reached` +
  rapport) et le journal fait foi de sa vitalité (silence prolongé *en cours de travail* ⇒
  alerte — le chien de garde est temporel, pas topologique, et il est **désarmé à l'arrêt au
  jalon**, où le silence est le comportement exigé 🛠). Le manifeste se réduit à l'identité
  (contrat versionné + méthode@version) et devient **le premier événement obligatoire du
  journal** (`run.started` 🛠 — donne au fail-fast de D5 quelque chose de concret à
  vérifier). La topologie reste déclarable en option (observabilité seulement). Corollaire
  affichage : **rendre ≠ interpréter** — le superviseur affiche le flux régalien et rend
  TELS QUELS les artefacts référencés (rapports md, liens PR/démo) sans les comprendre ;
  🛠 durcissement panel : un siège *automatique* ne décide que sur les **champs typés** du
  flux (jamais sur le contenu des artefacts — sinon la méthode peut piloter son superviseur
  par injection), et le rendu est inerte (échappé), refs confinées à la racine du projet.
  Les métriques métier riches (burndown…) restent des artefacts produits par la méthode ;
  un « method viewer » dédié reste possible plus tard (D13).
- **D9 — Le budget sort de l'escalade.** La méthode ne connaît pas le budget (régalien) et
  🛠 **n'auto-déclare pas non plus sa consommation** (un LLM ne connaît pas ses tokens ; une
  mesure auto-déclarée ne doit jamais être l'entrée d'un frein) : la télémétrie d'usage est
  **mesurée côté runtime/siège** (stream SDK en pilote ; absente-et-dite-absente en desktop).
  Le superviseur mesure et **freine** — `hold` explicite et journalisé 🛠, ou
  `abort {reason: budget}`. L'enum d'escalade méthode→superviseur se réduit à
  `blocked | authority`. 🛠 Limite écrite : en mode moniteur, le frein budget se dégrade en
  **alerte** (cop1 ne possède pas la session).
- **D10 — Une escalade est un signal, jamais un frein.** Elle alerte (selon la config
  utilisateur) et se trace ; elle n'arrête rien implicitement. Seuls le jalon
  (stop-par-défaut, D3) et l'`abort` arrêtent. 🛠 Précisions panel : les escalades portent un
  `escalation_id` et un cycle de vie (`escalation.resolved`) pour éviter les alertes
  zombies ; **s'il faut *attendre* une décision, la méthode émet un jalon** — le gate est
  l'unique point d'attente du contrat (l'escalade `authority` n'est pas un canal de
  décision) ; le superviseur peut coalescer/limiter le rendu (anti-spam). La méthode a
  toujours le droit de s'arrêter seule (`run.finished`, jamais une violation) : **le contrat
  ne contraint que l'avancement, jamais l'arrêt** — 🛠 et la relance après `run.finished`
  est une décision du siège, jamais un automatisme (sinon « finir » devient une façon
  d'avancer sans clairance).
- **D11 — L'éligibilité de mise à jour appartient à la méthode.** Un jalon n'est pas
  forcément un point stable ; la méthode déclare dans son rapport de jalon si l'état est
  migrable. 🛠 Durcissements panel : `upgrade_ok` est **calculé mécaniquement par le kit
  émetteur** (git propre, zéro worktree/sous-run en vol) — le LLM ne peut que le forcer à
  `false` (veto), jamais à `true` ; la sémantique est la **quiescence** (la compatibilité
  de la paire de versions relève des métadonnées de release de la méthode — fiche 0026) ;
  l'adoption effective est confirmée par un événement `version.adopted {from, to}` (ce qui
  logge enfin le tuple de versions par segment, dette §4) ; un échec d'adoption laisse le
  run `at_gate` sous l'ancienne version + `escalation blocked`. Avis minoritaire (lentille
  opérateur) consigné : l'adoption *en cours de run* est rare (un run ≈ une nuit) — la
  clause est conservée mais son coût est borné au kit.
- **D12 — Un seul transport : le journal du projet.** Le transport canonique, identique
  dans tous les contextes, est un **journal JSONL append-only par run** dans le projet.
  🛠 Reformulation panel (l'absolu « le superviseur ne fait que lire » était invérifiable
  et contredit par le §3) : le superviseur **n'écrit jamais dans le journal de la méthode**
  (`events.jsonl`) ; le **siège écrit ses décisions dans un journal jumeau**
  (`commands.jsonl`) — les deux moitiés du protocole sont dans le transport, l'audit est
  auto-suffisant. L'**émetteur canonique est fourni par la méthode** (consignes de skill +
  script + hooks livrés par mega-city) ; 🛠 un **shim d'émission côté superviseur est admis
  comme adaptateur de transition** (marqué legacy — c'est le statut du pont BMAD actuel,
  voué à disparaître avec l'extraction de `BmadCycle`, §4). Les hooks du harness et le
  stream SDK sont des **renforts de garantie** ; 🛠 le MCP émetteur n'est pas une option
  cosmétique : c'est le **chemin nominal pour Claude Desktop** (pas de hooks ni de shell à
  date — le trio « skill+script+hooks » n'y existe pas). Le superviseur affiche la **classe
  de conformité** de l'émission (A : renforcée/vérifiée — pilote SDK, hooks Claude Code ;
  B : best-effort LLM — desktop). Anti-fragilité inchangée : le contrat est le
  **vocabulaire** (stable) ; l'émission est un **adaptateur** (jetable).
- **D13 — Trois rôles du superviseur : lanceur, moniteur, siège.** Le **moniteur** (lire
  les journaux, afficher) est TOUJOURS actif. Mode pilote = les trois rôles (« cop1 appelle
  le point d'entrée de la méthode, puis ne fait plus que lire le journal et tenir le
  siège ») ; mode moniteur = rôle 2 seul, l'humain a le siège (D7). 🛠 Correction panel sur
  le mot « sas » : **le sas n'est un enforcement que là où le lanceur possède un levier
  d'exécution** (veto d'outil `canUseTool`/hooks, session-par-segment-de-gate, kill de
  session) — écrire une ligne JSONL n'arrête aucun process ; en pilote sans levier actif,
  l'invariant est une alarme, comme en moniteur. 🛠 La **politique du siège est hors
  contrat** (quand continuer seul vs demander à l'humain) ; le contrat garantit seulement
  les signaux typés qui la rendent implémentable : `outcome` des jalons, escalades
  ouvertes, télémétrie régalienne. (Fiche à venir : policy de siège cop1 — ex.
  auto-continue si `outcome=ok` ∧ budget < seuil ∧ zéro escalade `authority` ouverte.)

### Squelette v0.1 (post-panel — révise et remplace le v0 du prior-art §5)

```
LAYOUT (un run = un dossier ; un writer par fichier)
  <projet>/.supervision/runs/<run_id>/
    events.jsonl      # écrit par la MÉTHODE (émetteur) — jamais par le superviseur
    commands.jsonl    # écrit par le SIÈGE (cop1 en pilote ; en moniteur : écho, cf. plus bas)
  Le superviseur garde un MIROIR append-only de tout ce qu'il a lu, hors de portée
  d'écriture de la méthode (précédent interne : Track-2) ; divergence = violation.
  Un run = un flux séquentiel : AU PLUS UN gate ouvert par run ; le parallélisme se
  modélise en N runs (cohérent ADR-018 : une story = un worktree = un run). Multi-piste
  intra-run : réservé v0.2.

ENVELOPPE (chaque ligne, dans les deux fichiers)
  {event_id, run_id, seq, ts, contract, type, payload}
  # L'ordre du fichier fait foi (ts informatif) ; seq strictement croissant par fichier
  #   ⇒ un trou de seq = perte détectable. 1 événement = 1 ligne = 1 write() O_APPEND.
  # Lecteur tolérant : champ/type inconnu ignoré+signalé, jamais fatal (v0.x additif ;
  #   breaking ⇒ nouvelle URI de contrat). Dernière ligne sans \n : ignorée (ré-émise ou
  #   perdue-détectée par seq). Ligne invalide ⇒ synthétisée en contract.violation,
  #   JAMAIS jetée en silence. Payloads lourds toujours par *_ref, jamais inline.

ÉVÉNEMENTS méthode → superviseur (events.jsonl)
  run.started  {method: {name, version, files_hash?}, seat: pilot|human,
                heartbeat_interval_s?, gates_topology?}
      # LE manifeste, premier événement obligatoire. Fail-fast D5 : pas de run.started
      #   conforme sous T secondes ⇒ échec de lancement (et pas un démarrage lent).
  gate.reached {gate_id, outcome: ok|attention|failed, report_ref, upgrade_ok}
      # OBLIGATOIRE ; la méthode s'arrête ici (D3). outcome = feu tricolore auto-déclaré
      #   par la méthode (aucune interprétation superviseur — analogie error/incident
      #   BPMN) : c'est la base typée des politiques de siège. report_ref : realpath
      #   confiné SOUS la racine projet (sinon violation), chemin relatif projet (pas
      #   worktree), rendu inerte. upgrade_ok : quiescence calculée par le kit (cf. D11).
  gate.resumed {gate_event_id, command_ref?}
      # Accusé de reprise OBLIGATOIRE avant toute activité post-gate. En pilote il fait
      #   écho à la commande (command_ref) ; en moniteur il est self-reported (l'humain a
      #   dit « continue » dans SA session) — assumé : c'est la matérialisation de
      #   « alarme, pas sas ».
  version.adopted {from, to}
      # Émis APRÈS bascule effective (l'affichage D2 se branche ici, pas sur la
      #   commande). Échec d'adoption ⇒ reste at_gate sous l'ancienne version
      #   + escalation blocked.
  escalation   {escalation_id, type: blocked|authority, detail}
      # Signal, jamais un frein (D10). S'il faut ATTENDRE une décision : émettre un gate.
  escalation.resolved {escalation_id}
  heartbeat    {note?}
      # Liveness pure — TOUT append vaut battement ; consigne d'émetteur : « au moins un
      #   événement par transition/lot d'actions » (un rythme horaire n'est pas exprimable
      #   pour un LLM). Les tokens ne sont JAMAIS auto-déclarés (D9) : mesure runtime côté
      #   siège, provenance affichée (mesuré | absent).
  run.finished {status: success|failure|abandoned, final_report_ref}
      # L'arrêt est toujours libre, jamais une violation ; un run fini sur un gate sans
      #   réponse est étiqueté finished_at_gate. Relance = décision du siège (D10).

COMMANDES siège → méthode (commands.jsonl — écrites AVANT l'acte qu'elles autorisent)
  continue {gate_event_id, adopt_version?}
      # Référence l'OCCURRENCE (gate_event_id), jamais le gate_id seul (les méthodes
      #   itératives réutilisent leurs gates). Idempotence : re-continue d'un gate déjà
      #   continué = no-op ; event_id inconnu = erreur de commande.
      #   adopt_version : uniquement si upgrade_ok au jalon (D11).
  hold     {gate_event_id, reason: budget|policy|user}
      # La rétention devient un acte EXPLICITE et auditable (« pourquoi ce run est-il
      #   garé ? » a une réponse dans le journal).
  abort    {reason: budget|user|policy|stalled|contract_violation}
      # Pilote : exécuté par le lanceur (kill de session) — ne dépend pas de la
      #   coopération de la méthode ; celle-ci émet si possible run.finished en best
      #   effort. Moniteur : n'existe pas — se réduit à une notification au siège humain.

ÉTATS DU RUN (possédés par le superviseur, dérivés par REPLAY des deux journaux)
  launched → running ⇄ at_gate(gate_event_id) → finished(status) | aborted(reason)
  stalled : état d'observation dérivé (silence > k × heartbeat_interval EN running ;
    jamais armé en at_gate) — réversible. aborted/finished : terminaux (pas de continue
    après abort). Relaunch après crash ≠ continue : ne franchit jamais un gate
    non-continué. Le journal est LA source de vérité : tout redémarrage (méthode ou
    superviseur) reconstruit l'état par replay.

INVARIANT (reformulé pour être vérifiable depuis les journaux seuls)
  Tout événement de seq postérieur à un gate.reached G sans gate.resumed corrélé à G
  (même run) = violation — synthétisée en contract.violation, affichée, comptée.

LIMITES PAR MODE (écrites, pas implicites)
  pilote   : sas = enforcement SI levier d'exécution actif (canUseTool/hooks/kill/
             session-par-segment) ; budget = frein (mesure runtime) ; abort = kill.
  moniteur : détection best-effort adossée à l'émetteur (honor-system sans hooks — c'est
             exactement le « honor-system component » que Rel(AI)Build avoue) ; budget =
             alerte ; abort = notification ; pin de méthode = déclaratif (files_hash
             ré-émissible pour rendre la dérive détectable).
  anti-surplace (une méthode qui bat du cœur sans jamais atteindre de jalon) : garde-fou
             régalien mesuré côté superviseur — durée/budget max entre deux gates ⇒
             escalade au siège puis abort {policy}.
```

### Compte rendu du panel design (2026-07-13)

5 reviewers indépendants (protocole distribué, red-team, implémentabilité LLM 2026,
cohérence corpus, opérateur), verdict **unanime : « corriger puis geler »** — architecture
D8–D13 saine (aucun des cinq ne demande de revoir une décision), squelette initial trop
abstrait pour être gelé. Corrections intégrées ci-dessus, les plus structurantes :

1. **La boucle de commande est fermée** (les 5 lentilles, indépendamment) : commandes
   journalisées par le siège + accusé `gate.resumed` par la méthode — sans quoi l'invariant
   était un slogan invérifiable et l'alarme du mode moniteur sonnait sur chaque reprise
   légitime.
2. **Le transport est normé** : enveloppe {event_id, run_id, seq, ts}, un run = un fichier,
   `run.started` = manifeste, machine à états réintroduite (elle existait au v0 et avait
   été perdue), corrélation par occurrence.
3. **Le réalisme d'émission est écrit** : usage jamais auto-déclaré, liveness = tout
   append + watchdog conscient de l'état, exigences d'hôte + classes de conformité A/B,
   MCP émetteur = chemin nominal Desktop, sas conditionné au levier d'exécution.
4. **La partie surveillée ne porte plus la preuve seule** : miroir d'audit hors de sa
   portée, lignes invalides synthétisées en violation, refs confinées au projet, siège
   automatique aveugle au contenu des artefacts (anti-injection).

Reste pour v0.2 / fiches à créer : multi-piste intra-run (scope/track), kit émetteur de
référence (~85 lignes : script append + consignes skill + hooks) **et validateur de journal**
(replay + vérif invariant/seq — l'invariant devient exécutable, meilleur argument de
l'article), policy de siège cop1, hash-chain optionnel du journal, `max_gate_interval`
déclarable. Révisions d'ADR annoncées (déjà au §6) à matérialiser : ADR-021 décisions 2-3
(la 2e couture = le journal au format du contrat ; « cop1 exige une méthode ») et ADR-022
(le loop cible « tire & dispatche » est caduc en mode contrat : la méthode s'auto-orchestre,
le superviseur octroie des clairances) ; l'emprunt BPMN de la clause (d) se ré-ancre sur
l'**escalation non-interruptive** (pas l'incident, qui gèle — nous ne gelons pas).
