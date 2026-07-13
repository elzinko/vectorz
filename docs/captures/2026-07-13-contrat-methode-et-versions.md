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
est prouvée par construction.

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
   dynamique + event-stream seam). Prior art balayé (Q2 ✅) : partir du **squelette v0**
   (prior-art §5) et des emprunts identifiés (lifecycle A2A, error/incident BPMN,
   Pinned/Signals Temporal). Prérequis avant rédaction : lire de première main les 3-4
   sources les plus proches (Rel(AI)Build, Agent Protocol, A2A v1.0, Faramesh).
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
