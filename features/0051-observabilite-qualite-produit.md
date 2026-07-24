---
id: 0051
title: Observabilité qualité produit — mesurer, historiser et analyser la qualité des logiciels fabriqués (par PR) (épic)
type: epic
priority: P1
epic:
status: todo
ready:
pr:
created: 2026-07-22
---

# 0051 — Observabilité qualité produit (épic)

> **Épic non-buildable** — ne pas tirer cette fiche à l'intake : tirer ses filles
> ([0052](0052-socle-metrique-port-adaptateur-silo.md) en tête,
> puis [0053](0053-gate-dod-metrique.md), [0054](0054-catalogue-adaptateurs-outils.md),
> [0055](0055-kpi-agreges-commit-pr-sprint-version.md), [0056](0056-viz-qualite-mission-control.md),
> [0057](0057-agent-analyse-methode.md)).
> **Priorités proposées** (alignées sur 0044=P1, 0022=P2) — à arbitrer PO.

## Contexte / Problème

Besoin PO (brainstorm 2026-07-22) : brancher de **vrais outils d'analyse de code**
(couverture, sécu, complexité, duplication…) sur les **produits que la méthode fabrique**,
**garder** ces mesures dans le temps, en tirer des **KPI par commit / PR / sprint / version**,
les **visualiser**, et à terme laisser un **agent spécialisé** les analyser pour améliorer la
méthode. **Ce n'est PAS** la comparaison de LLM (écartée le 2026-07-22) : on mesure
l'**exécution logicielle**, pas l'exécution de modèle.

Constat « déjà là ? » : le package `products/cop1/packages/quality-intelligence`
(`SonarQubeAdapter`, `CoverageGate`, `StaticAnalysisGate`, `ArchDriftDetector`,
`ImprovementKPIService`) prouve la faisabilité **mais** est câblé en **portes jetables**
(`CoverageResult { passed, coverage, threshold }` — la valeur ouvre/ferme le gate du sprint
puis est **jetée** ; rien n'est historisé ni collé à un commit) et il est **promis à
résorption** (relicat pré-pivot BMAD, fiche [0024](0024-resorber-peripherie-pre-pivot.md)).
Doctrine : on **moissonne sa liste de capteurs** (la carte de ce qui vaut la peine d'être
mesuré), **pas son code**. Il manque la **mémoire** : un journal qui garde chaque mesure,
indexée par PR, d'où sortent des courbes.

## Proposition

### Colonne vertébrale ([ADR-033](../docs/adr/ADR-033-port-metrique-qualite-produit.md), Proposé — panel adverse à venir)

**Trois choses distinctes — réponse aux questions PO « c'est des rules ? l'install fait
partie des rules ? »** :

1. **La RÈGLE** (la loi qualité : « couverture ≥ seuil ») → vit dans la **MÉTHODE**
   (`products/mega-city/rules/`, **LA LOI d'époque 2** — ex. catégorie `testing/` ou une
   nouvelle `quality/` ; **pas** l'ancien `rules/iamthelaw`, disparu). **Language-agnostic**
   car elle parle d'une **métrique abstraite**, jamais d'un outil.
2. **La CAPACITÉ** (l'outil qui **produit** le chiffre : Codecov, SonarCloud, CodeQL…) → **trois
   gestes** (formulation PO) : **installer** l'outil, le **configurer pour le projet**, et un
   **ADAPTATEUR derrière un PORT** qui récupère la valeur **de façon automatisée** (hook / trigger).
   **Installer = un PRÉALABLE** (provisioning), **pas** une règle et **pas** l'ajout d'une règle.
3. **La CONFIG** (le **seuil**) → de la **donnée**, réglée par les rétros. *(« Chemins exclus » =
   **arbitrage ouvert** : peut-être surface gelée, car exclure un chemin baisse la barre — voir
   [ADR-033](../docs/adr/ADR-033-port-metrique-qualite-produit.md).)*

**Qui exécute, qui écrit, qui lit — c'est DÉJÀ la loi (ADR-032, Accepté)** : « l'émetteur
canonique reste dans la **méthode** ; le superviseur n'écrit **jamais** les événements ». Donc
(rôles précisés par le panel adverse du 2026-07-22) :
- **la MÉTHODE exécute l'outil** et **garantit** qu'il est installé et **lancé** (couverture au
  build, artefact `lcov`/`cobertura`) — architecture orientée événement, demande PO ;
- **le MESUREUR TIERS écrit la mesure** (`quality.measured`) en lisant l'artefact — **la méthode
  auditée n'écrit jamais son propre chiffre** (ADR-031/0044, « l'horloge n'appartient pas à
  l'auditée ») ;
- **le MONITEUR lit** ce journal en lecture seule et **agrège** pour présenter (ADR-028, mode
  moniteur). Le moniteur ne mesure pas, il projette.

Le **PORT de métrique** est **language/outil-agnostic** ; les **adaptateurs** peuvent être
spécifiques ; **le silo et la règle ne le sont jamais**. (Culture hexagonale déjà en place :
ADR-021 frontière, ADR-026 seam exécuteur, ADR-032 émission adaptateur séparable.)

- **Déclenchement** — le port cache le mode : **PUSH** (la CI émet la métrique au **build de
  PR**, ex. GitHub Actions — le cas nominal) **OU PULL** (un adaptateur interroge l'API à la
  demande). Les deux atterrissent dans le **même silo**.
- **Silo = le MAGASIN, pas le visualiseur** (précision PO) — c'est le **journal append-only des
  mesures** : la *mémoire* qui garde chaque `quality.measured` collé à un commit/PR, d'où l'on
  *sort* les KPI. Ce n'est **pas** l'écran (ça, c'est mission-control). **Écrit par le mesureur tiers** (qui
  lit l'artefact de l'outil), lu par le moniteur. **Foyer du journal = Q2, différé** (silo 0044
  étendu vs `.quality/` frère — [ADR-033](../docs/adr/ADR-033-port-metrique-qualite-produit.md)) ;
  0052 écrit derrière une interface (`MetricSink`) en attendant. **Grain =
  commit / PR** ; **sprint / version = rollups** — une **vue** calculée à la demande (colonne
  type DuckDB) *au-dessus* du journal, **pas** un 2ᵉ magasin. « Base colonne ou base temps ? »
  = arbitrage de 0055.
- **Enforcement** — au **gate de complétion (DoD, ADR-020)**, **pas DoR**. *Correction douce :
  DoR = « prête à démarrer » (avant le travail) ; bloquer une PR sur une métrique = **DoD**
  (après le travail).*
- **Boucle rétro → config** (3ᵉ demande PO) : une rétro peut « ajouter un outil » (provisionner
  un adaptateur + éventuelle règle), « poser une config par défaut » (semer la config),
  « modifier un seuil » (changer la config — le moins cher). Composé par **ezk-retro** (qui
  route déjà les règles validées vers `rules/` sous gate PO) + le contrat d'améliorabilité
  (ADR-030, FR60 auto-modif des règles). On **ne réinvente pas** ezk-retro.

### Le chemin (filles) — construire → prouver → retirer

| # | Brique | Prouve |
|---|--------|--------|
| [0052](0052-socle-metrique-port-adaptateur-silo.md) | Port + 1ᵉʳ adaptateur (couverture **locale**) + remontée build PR + silo | capter→garder→lire de bout en bout, 1 métrique réelle |
| [0058](0058-rapport-qualite-pr.md) | Rapport qualité de PR (commentaire : métriques + testé + captures) | les métriques se **voient** dans chaque PR — avant tout gate |
| [0053](0053-gate-dod-metrique.md) | Gate DoD adossé à une métrique (PR bloquée si seuil non tenu) | règle (méthode) ↔ port ↔ adaptateur (produit) |
| [0054](0054-catalogue-adaptateurs-outils.md) | Catalogue d'adaptateurs (ajouter un outil sans réinventer) | sécu + qualité branchés sans toucher silo/règle |
| [0055](0055-kpi-agreges-commit-pr-sprint-version.md) | KPI agrégés commit→PR→sprint→version | rollups reproductibles depuis le silo |
| [0056](0056-viz-qualite-mission-control.md) | Onglet « qualité par PR » (mission-control) | les KPI se voient |
| [0057](0057-agent-analyse-methode.md) | Agent d'analyse de la méthode (gate PO) — **nord/parking** | boucle d'auto-amélioration |

## Critères d'acceptation (épic)

- [ ] [ADR-033](../docs/adr/ADR-033-port-metrique-qualite-produit.md) (port de métrique +
      trichotomie règle/capacité/config) passe le **panel adverse manuel** + arbitrage PO → Accepté.
- [ ] 0052 livrée : une métrique réelle traverse capter→garder→lire sur une vraie PR.
- [ ] Au moins un **outil tiers language-agnostic** (Codecov) branché sans réécrire la chaîne.
- [ ] Les KPI se lisent aux 4 échelles (commit/PR/sprint/version) et se voient dans mission-control.

## Notes / décisions

**Fiches / ADR impactés (arbitrage PO — non modifiés unilatéralement)** :

- **[0044](0044-mesureur-outcomes-script-append-mvp-a.md)** — le silo `.improvement/` est le
  **foyer** de ces mesures. Mais ajouter des **métriques produit** (couverture, Sonar…) est un
  **nouveau type d'événement / une nouvelle source** → touche « **métriques = surface gelée** »
  → **PO + panel** avant gel. *Décision à trancher : même silo (nouvel event `quality.measured`)
  vs silo frère `.quality/`.*
- **[0024](0024-resorber-peripherie-pre-pivot.md)** — **moissonner la liste des capteurs** du
  relicat (Sonar/couverture/statique/arch-drift) **avant** suppression ; ajouter le cross-ref
  vers cet épic.
- **[0022](0022-observabilite-mission-control-donnees-deja-collectees.md)** — l'onglet qualité
  (0056) **compose sa coquille web** mais est une **nouvelle collecte** (0022 dit « aucune
  nouvelle collecte ») → feature **séparée**, pas une extension de 0022.
- **[0046](0046-differes-contrat-ameliorabilite-parking.md)** — l'agent d'analyse (0057)
  rejoint les items parking gated.
- **[ADR-031](../docs/adr/ADR-031-deux-axes-de-validation.md)** — **distinguer** : l'Axe 2 =
  qualité de la **méthode** via **golden tasks synthétiques** ; **CECI** = qualité du **produit**
  sur **PRs réelles**. Les métriques réelles **nourrissent** l'Axe 2 (une méthode qui livre des
  PRs mieux couvertes est une meilleure méthode) — elles ne le **remplacent** pas.
- **[ADR-030](../docs/adr/ADR-030-contrat-ameliorabilite.md)** — l'agent d'analyse + la mutation
  de règles par rétro **composent** le contrat d'améliorabilité (mesure tierce, deny-all, gate PO).

**Doctrine d'adoption des capacités (PO, 2026-07-24)** : dans l'ordre — (1) **dépendance projet
/ binaire local** (zéro compte : vitest-coverage/lcov, jscpd, osv-scanner), (2) **docker local**,
(3) **SaaS** — chaque provisioning SaaS = une **proposition approuvée par le PO** (c'est lui qui
crée les comptes), via le circuit d'approbation d'ADR-030.

**Pistes évoquées, volontairement NON fichées (PO, 2026-07-24)** : spike « plateformes
d'agrégation » (Apache DevLake & co — à rouvrir si les vues 0055 s'avèrent insuffisantes ou à
partir de 3 adaptateurs) ; « introspection de la méthode » (flux cliquable : gates, rules, outils
installés, décisions de rétro — 1ᵉʳ pas quasi gratuit via ezk-diagram le jour venu). Schéma
détaillé des composants : [diagrams/qualite-composants-detail](../diagrams/qualite-composants-detail/README.md).

**Non-buts** : comparer des LLM (écarté) ; ressusciter `@cop1/quality-intelligence` tel quel ;
un nouveau runtime / service / 2ᵉ entrepôt ; l'optimisation permanente en tâche de fond
(déclenchement sur faiblesse mesurée uniquement).
