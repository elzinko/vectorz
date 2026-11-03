---
id: "20261008182705779"
title: Mesurer le coût tokens des sprints/features comme une métrique du lot observabilité
type: feature
priority: P1
product: vectorz
milestone:
labels: [observabilite]
status: idea
pr:
evidence: none # plomberie de mesure ; l'écran est la fiche 0056
created: 2026-10-08
---

# 20261008182705779 — Coût tokens : un adaptateur de plus sur le port de métrique

**En clair.** Tu veux voir ce que coûtent en tokens tes sprints et tes features, et donner ce
chiffre aux agents de rétro et au dashboard. Réponse directe à ta question : **aujourd'hui, non** —
la fiche socle des métriques exclut le coût tokens exprès. Mais tout le cadre pour l'y brancher est
déjà conçu, et parké. Cette fiche, c'est brancher le coût tokens comme **une métrique de plus** dans
ce cadre.

**Si tu arrives frais.** Le lot « observabilité » (fiches labellisées `observabilite`, épic 0051,
ADR-033) construit un cadre pour mesurer des métriques de qualité par commit / PR / sprint /
version. *Port de métrique* = une interface « donne-moi la valeur de la métrique M », branchable sur
plusieurs outils par des *adaptateurs*.

## Contexte / Problème

Déclencheur daté : **2026-10-08**, demande PO. Le coût tokens n'est capté **nulle part** dans la
méthode. La fiche [Socle vertical — port de métrique](0052-socle-metrique-port-adaptateur-silo.md)
l'exclut noir sur blanc : « ni au coût tokens (hors sujet ici) ». À côté, il n'existe que des
**leviers budgétaires** (modes lean/cap/full d'ezk-product-build) et le suivi des **minutes GitHub
Actions** — pas le coût LLM par sprint/feature.

Le cadre pour le mesurer, lui, existe déjà (tout parké) :
- le **port de métrique** et le silo — [0052](0052-socle-metrique-port-adaptateur-silo.md) ;
- le **catalogue d'adaptateurs** — [0054](0054-catalogue-adaptateurs-outils.md) ;
- les **rollups** commit → PR → sprint → version — [0055](0055-kpi-agreges-commit-pr-sprint-version.md) ;
- l'**agent d'analyse** qui lit les KPI et nourrit la rétro — [0057](0057-agent-analyse-methode.md) ;
- le **dashboard** mission-control — [0056](0056-viz-qualite-mission-control.md).

**Valeur — le coût de ne rien faire.** Sans cette mesure, impossible de dire quel sprint ou quelle
fiche a brûlé le budget. Impossible de savoir si un réglage (mode lean/cap/full, modèle d'un agent) a
payé. Aujourd'hui on n'a que des ordres de grandeur anecdotiques — un appel d'agent ~85k jetons, un
sprint qui n'édite qu'un skill ~330k, une clôture d'archive ~78k — jamais rattachés à une fiche ni
agrégés. La rétro, dont le métier est d'améliorer la méthode, n'a aucun chiffre de conso à analyser.
Les arbitrages de coût restent au doigt mouillé. Le besoin touche le PO et les agents de rétro, et il
mord **dès maintenant** : chaque sprint consomme. « Rien de grave » est donc faux — le P1 tient.

## Proposition

**Décision d'archi (ezk-architect, 2026-10-08) : une tranche verticale sur la doctrine métrique.**
On branche le **joint d'écriture** déjà prévu — porte unique `MetricSink` vers le cahier committé
`.quality/`, écrit par un **tiers** (jamais la méthode qui note son propre chiffre, doctrine 0052) —
mais au **périmètre minimal** : une seule métrique `token_cost`, une commande de rollup, deux lecteurs
minces. On **n'active pas** tout le lot observabilité parké.

Trois coutures, dépendances tournées vers le domaine :
- **Capter** — un écrivain tiers pousse `token_cost` dans `.quality/` via `MetricSink`, à la fermeture
  d'un run.
- **Agréger** — une commande `ezk` déterministe roule `token_cost` en coût **par fiche** et **par
  sprint** (aucun LLM dans ce calcul, ADR-0001).
- **Restituer** — la rétro lit la sortie de la commande et **juge** ; le dashboard lit la **même** vue.
  Un seul chiffre, deux fenêtres.

Pourquoi pas les deux voies posées plus haut. La « voie légère » reposait sur un faux présupposé : le
journal de supervision `.supervision/runs/` **ne contient aucun chiffre de tokens** aujourd'hui, et il
est gitignoré + ancré au checkout principal (**invisible depuis un worktree**). Il faut de toute façon
**capter** le coût — autant l'écrire d'emblée dans le bon cahier (`.quality/`, committé, indexé
commit+PR). La « voie complète » sur-construit : elle traîne l'activation de tout le lot pour une seule
question P1.

Différé en **fiches séparées** (liées par même `milestone:` + `version:`, sans fiche-chapeau) :
catalogue d'adaptateurs [0054](0054-catalogue-adaptateurs-outils.md), rollups généralisés
[0055](0055-kpi-agreges-commit-pr-sprint-version.md), agent d'analyse
[0057](0057-agent-analyse-methode.md), viz [0056](0056-viz-qualite-mission-control.md).

## Critères d'acceptation

- [ ] **Capter** — à la fermeture d'un run, un enregistrement `token_cost` est écrit dans `.quality/`
      par un **tiers** via `MetricSink`, indexé par run + id(s) de sprint/fiche.
- [ ] **Garde de la capture** — **aucune** écriture de `token_cost` hors du `MetricSink` (la méthode
      n'écrit jamais son propre chiffre, doctrine 0052). Sans ce critère, on coche « un chiffre existe »
      alors que la méthode s'est auto-notée.
- [ ] **Agréger** — une commande `ezk` déterministe relit `.quality/` et sort le coût tokens **par
      sprint** (et **par fiche** selon la règle d'attribution retenue). Aucun LLM dans le calcul.
- [ ] **Garde de l'agrégat** — relancer la commande sur un `.quality/` figé rend le **même** chiffre.
      Sans ce critère, on coche « ça sort un nombre » avec une valeur inventée à chaque appel.
- [ ] **Restituer** — la rétro lit la sortie de la commande et le dashboard affiche la **même** vue :
      un seul chiffre, deux fenêtres (pas deux calculs qui divergent).

## Comment vérifier

À rejouer une fois construit (noms de commande à figer au build) :
- **Capter** — fermer un run, puis vérifier qu'une entrée `token_cost` existe dans `.quality/` pour ce
  run (indexée sprint/fiche) ; vérifier qu'aucun chemin autre que `MetricSink` n'a écrit (test « aucune
  écriture hors du sink », repris de [0052](0052-socle-metrique-port-adaptateur-silo.md)).
- **Agréger** — lancer la commande de rollup sur un `.quality/` figé → un coût par sprint (et par
  fiche) ; relancer → chiffre identique (déterminisme).
- **Restituer** — ouvrir la vue rétro et le dashboard sur le **même** sprint → le même chiffre des deux
  côtés.

## Notes / décisions

- **Dé-parkée le 2026-10-08** (PO : « c'est vraiment important, cette histoire de consommation »).
  Priorité **P1**. Foyer de version probable = **v0.8.0** (« amélioration mesurée »), à confirmer
  quand le scope de v0.8.0 est tranché (métriques vs système de règles) — d'où **pas encore au PLAN**.
- **ADR à ouvrir au build** (pas maintenant, fiche encore `idea`) : « Le coût tokens est une métrique,
  pas de la télémétrie de supervision » — destination `.quality/` via `MetricSink`, jamais
  `.supervision/` (gitignoré, grain run/gate, invisible en worktree).
- **À trancher au grooming** :
  - *source du chiffre* — reco archi : primaire = l'usage de session/run Claude Code à la fermeture du
    run, converti par une table de prix par modèle ; l'API d'usage du provider = réconciliation
    ultérieure (non attribuable par fiche) ; l'estimation = repli ;
  - *clé d'attribution* — étiqueter chaque run avec les ids de lot/sprint + fiche (`ezk-sprint start
    --lot` les connaît déjà) ; décider le partage du coût d'un run multi-fiches ;
  - *table tokens → prix* — où elle vit, par modèle, adjacente à [modèle & effort par agent](done/20261002205205417_modele-effort-agents-par-projet.md).
- Leviers de coût existants mais **distincts** : [modèle & effort par agent](done/20261002205205417_modele-effort-agents-par-projet.md)
  (règle la conso) et les modes lean/cap/full d'ezk-product-build (plafonnent). Ici on **mesure et
  restitue** — on ne plafonne pas.
- **Taille (gate `ready`)** : la fiche touche plusieurs surfaces (capture, commande, rétro,
  dashboard) mais **reste entière** — c'est une **tranche verticale minimale** voulue par l'archi (une
  métrique, une commande, deux lecteurs minces). La découper créerait des bouts qui ne prouvent rien
  seuls (capter sans lire, lire sans capter). Si elle déborde au build, découper capture / agrégat /
  restitution par même `milestone:`.
- Capturée en `idea` sur demande PO (2026-10-08), groomée (archi + critères + valeur) le 2026-10-09.
- Rapatriée le 2026-11-03 de la branche `claude/ezk-grooming-sessions-dd9b52` (grooming du 2026-10-09, plan v0.11
  périmé) : repassée en idée, à regroomer contre le code d'aujourd'hui.
