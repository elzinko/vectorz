# ADR 0011 — périmètres jour/nuit : catalogue-first, le décideur est un agent

- Statut : **proposé**
- Date : 2026-07-06

## Contexte

ezk-product-build/ezk-sprint (session interactive) et cop1 (orchestrateur nocturne headless)
font fonctionnellement le même travail — piloter des features en boucle — avec deux cerveaux
distincts. Analyse du 2026-07-06 :

- cop1 possède **déjà** un « débloqueur » : le Supervisor tier 2 (cascade regex → LLM →
  escalade) répond aux questions à la place de l'humain, derrière un port
  (`SupervisorLLMPort`). Son escalade est en revanche **terminale** (story `blocked`, pas de
  boucle de résolution) alors que toute la tuyauterie blocages est codée mais non câblée.
- cop1 ADR-022 (WIP) définit le cœur comme control plane **aveugle au métier** (budget,
  cadence, concurrence, frontière d'autonomie) avec 3 ports (exécuteur, méthode, règles).
- Claude Code v2.1.172+ : agents imbriqués possibles (5 niveaux) ; Claude Desktop charge
  skills et agents custom comme le CLI.
- Inventaire des points d'arrêt du builder+sprint : 12 arrêts — 5 auto-recommandables,
  3 délégables à un agent, 4 irréductiblement humains.

Risque : implémenter le « mode autonome » dans cop1 le rendrait indisponible en session
interactive, et dupliquerait la logique de décision.

## Décision

1. **Catalogue-first.** Toute capacité fonctionnelle d'orchestration ou de décision vit dans
   le **catalogue** mega-city (skills, agents, rules) — jamais dans un runtime. Un runtime
   (session Claude Code/Desktop **ou** cop1) ne fait qu'**activer des options** du catalogue,
   comme un prompt le ferait. Corollaire : toute feature envisagée « dans cop1 » doit d'abord
   être formulée comme skill/agent/rule ; cop1 n'en garde que le déclencheur.
2. **Répartition des rôles** :
   - *skills orchestratrices* (ezk-product-build, ezk-sprint) : la boucle fonctionnelle,
     en contexte principal d'une session interactive (jour) ;
   - *agents feuilles* (ezk-architect, ezk-dev — aujourd'hui ezk-tdd, renommage fiche
     0045 —, ezk-qa, ezk-reviewer) : l'exécution, partagés jour/nuit (cop1 les voit via
     `settingSources:['project']`). Ce pass-through **amende ADR-0005 §3 pour l'équipe** :
     cop1 la consomme via la matérialisation du cap claude-code ; le cap cop1 (fiche 0016)
     reste le canal des règles, sa Phase 2 est re-scopée en conséquence ;
   - **`ezk-pm` (nouveau, agent)** : le décideur product-owner. Il répond aux checkpoints
     auto-recommandables et délégables, journalise chaque décision, et **refuse** les 4
     décisions humaines. Consommé côté jour par le mode auto du builder (fiche 0040), côté
     nuit comme cerveau de déblocage de cop1 (impl du `SupervisorLLMPort` ou client de l'API
     blocages — fiche cop1 0021) ;
   - *cop1* : control plane opérationnel uniquement — planification nocturne, budget
     kill-switch inter-sessions, concurrence/worktrees, survie daemon, observabilité,
     routage d'escalade. **Aucune logique de méthode ni de produit.**
3. **Les 4 arrêts irréductiblement humains** — jamais automatisables, quel que soit le mode
   ou le runtime : action irréversible/sortante (deploy, push --force, suppression, secret
   manquant) ; **augmentation** d'un budget tokens ; invention d'une idée produit (backlog
   vide) ; exigences contradictoires.
4. **EscalationPort cop1 : différé explicitement** (pattern ADR-0002). Les deux coutures
   existantes suffisent (`SupervisorLLMPort` pour le déblocage in-session ; l'API/EventBus
   blocages pour la résolution asynchrone). Promotion en 4e port seulement si une
   consultation synchrone dans la boucle du superviseur devient nécessaire.

## Conséquences

**Plus facile** — ezk-product-build reste une skill, utilisable telle quelle dans Claude
Desktop ; le mode auto fonctionne sans cop1 ; cop1 garde une valeur nette que la session ne
peut pas offrir (nuit, budget transverse, parallélisme, monitoring, survie) ; un seul cerveau
de décision gouverné par mega-city.

**À surveiller** — la tentation de coder du métier dans cop1 (sa dérive pré-pivot
ceremony-engine/quality-intelligence est à résorber, fiche cop1 0024) ; le double checkpoint
builder/sprint à absorber (fiche 0040) ; ezk-pm ne doit jamais hériter d'un pouvoir
d'augmentation de budget.

## Alternatives écartées

- **Le mode autonome comme feature cop1** — indisponible en interactif, duplique la décision,
  viole ADR-022 (cœur aveugle au métier). Rejeté.
- **ezk-product-build devenu agent** (techniquement possible depuis v2.1.172) — perd la
  visibilité interactive (checkpoints, mutation à chaud) qui est sa raison d'être de jour.
  Rejeté : on extrait le *décideur* (ezk-pm), pas l'orchestrateur.
- **Un EscalationPort immédiat côté cop1** — YAGNI, les coutures existent. Différé.
