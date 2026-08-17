---
id: 0044
title: Mesureur d'outcomes métier + script d'append — l'évaluateur d'abord (contrat d'améliorabilité, MVP A)
type: chore
priority: P1
product: vectorz
status: shipped
ready: 2026-07-17
pr: "#145"
created: 2026-07-16
---

# 0044 — Mesureur d'outcomes métier + script d'append (MVP A du contrat d'améliorabilité)

> **Scope recadré le 2026-08-13 (décision PO « MVP mesureur nu »).** Ce sprint livre le
> **mesureur nu, sans dépendance de décision** : inventaire des données disponibles +
> baseline rétroactive `.improvement/outcomes.jsonl` (métriques `temps_de_cycle` et
> `pr_sans_retouche`). Les **surfaces gelées** (validateur noyau, miroir tamper-évident,
> chien de garde calendaire, mécanisme de preuve externe, verdicts mécaniques, second
> fichier `lifecycle.jsonl`) sont **déportées** dans
> [`20260813131259846`](../20260813131259846_ameliorabilite-surfaces-gelees-gated-adr030.md),
> **bloquée tant qu'ADR-030 n'est pas ratifié** (transport A2 + preuve externe = panel + PO).
> Les descriptions ci-dessous restent le cahier des charges d'ensemble ; seul le périmètre
> des **Critères d'acceptation** ci-dessous fait foi pour CE sprint.

## Contexte / Problème

Toute boucle d'auto-amélioration sans évaluateur digne de confiance produit du Goodhart,
pas du progrès (leçon AlphaEvolve : l'évaluateur AVANT la boucle). Aujourd'hui, aucun
outcome métier n'est mesuré : on ne sait dire ni combien de PRs d'agents sont mergées
sans retouche humaine, ni le temps de cycle fiche→merge. Le contrat d'améliorabilité
(ADR-030 proposé) exige que ces mesures ET les verdicts soient rendus par un TIERS,
jamais auto-déclarés par la méthode qui s'améliore (décision A-mesure, inspirée du
précédent D9 du contrat de supervisabilité).

## Proposition

Un script déterministe **zéro-LLM** côté vectorz, PLUS le **script d'append** (validateur
noyau — placement corrigé par la passe de réfutation : il vit côté vectorz, hors de
portée de la boucle qui modifie le catalogue via capture, et il est LUI-MÊME surface
gelée du contrat).

**Transport (ADR-030 Décision A2, à ratifier PO + panel)** : DEUX fichiers append-only
sous `.improvement/`, **un writer par fichier** :

- `outcomes.jsonl` — writer = le mesureur : `outcome.measured`, `incident.detected`,
  `improvement.verified|retired`, `improvement.overdue`, `proposal.expired` ;
- `lifecycle.jsonl` — writer = le script d'émission : `proposal.submitted`,
  `proposal.approved {approbateur, preuve_externe}|rejected`,
  `improvement.applied {approval_ref}`, `improvement.reviewed|skipped`.

(L'alternative ledger unique + authentification d'origine est instruite dans le même
arbitrage ; cette fiche s'aligne sur le verdict.)

**Miroir tamper-évident** (reprise du pattern du jumeau supervisabilité) : le mesureur
tient un miroir/hash append-only des deux fichiers ET des surfaces gelées **hors de
l'arbre projet** ; toute divergence = `incident.detected` à chaque MESURER. C'est le
détecteur de l'invariant « surfaces gelées » (requalifié classe B tant qu'aucune garde
CI n'existe — option fiche 0040, arbitrage PO).

**Verdicts rendus par le mesureur** : `improvement.verified|retired` est calculé
mécaniquement (comparaison `critere_verification` de la fiche vs outcomes du ledger) et
appendu par script — la méthode le lit, ne le rend jamais ; écart méthode/mesureur =
incident.

**Chien de garde calendaire** : chaque obligation indexée en émissions est doublée d'une
borne calendaire (N émissions OU M jours, premier atteint — seuils PO) ; dépassement ⇒
`improvement.overdue` / `proposal.expired`. L'horloge n'appartient pas à l'auditée.

**Script d'append (validateur noyau)** : refuse toute écriture (1) d'application sans
approbation référencée **portant une preuve externe non-productible par un agent**
(approbation GitHub du compte humain vérifiable via gh API, ou commit signé PO —
mécanisme exact tranché au panel de gel), (2) hors du registre de surfaces, (3) de 2e
essai simultané.

**Métriques** (`outcome.measured`) :

- `pr_sans_retouche` (bool) : commits humains post-handoff via gh + comparaison arbre
  final agent vs arbre mergé. **Définition durcie dès cette fiche** : exclusions listées
  — rebase, formatage, commits de merge. **Point de handoff défini opérationnellement**
  (ex. passage ready-for-review, dernier commit d'auteur agent) et testé sur PRs réelles.
  **Signal « reprise post-merge »** (anti-gaming par déport) : PR/commit correctif sur
  mêmes fichiers ou même fiche sous X jours ⇒ requalification ou `incident.detected`
  (fenêtre X = seuil PO).
- `temps_de_cycle` : front-matter `created` des fiches → squash-merge (git).
- `fidelite_ac` : checklist des Critères d'acceptation de la fiche, **jugée hors de la
  boucle par le PO** (budget ≤5 min/cycle, à valider).
- `cout_tokens` : **pilote uniquement** — en session desktop la télémétrie est
  absente-et-dite-absente et la source 0022 est todo ; câblée au tirage de 0038.

Déclencheurs `incident.detected` façon postmortem SRE : PR retouchée, reprise post-merge,
AC raté, CI cassée post-merge, budget dépassé, divergence miroir.

**Baseline rétroactive REDÉFINIE sur ce qui existe** (correction de réfutation : aucun
`.supervision/` n'existe dans aucun repo, zéro run journalisé, pas d'événement de handoff
au schéma gelé) : **premier AC = inventaire des données réellement disponibles** ; puis
baseline sur les **N dernières PRs d'agents mergées** (gh/git) + front-matter `created`
des fiches done/. `.supervision/runs/*` est une **source optionnelle**, conditionnée à
l'existence de runs conformes, toujours en LECTURE SEULE (gel v0.1 non rouvert).
Le mesureur se paie seul, boucle ou pas : il survivrait au retrait de la clause de
moisson (critère de maintien éventuel = arbitrage PO).

## Critères d'acceptation (périmètre de CE sprint — MVP mesureur nu)

- [ ] Inventaire publié des données réellement disponibles pour la baseline (PRs d'agents mergées, fiches done/, runs .supervision conformes s'il en existe)
- [ ] Baseline rétroactive publiée sur les N dernières PRs d'agents mergées + fiches done/ (`.improvement/outcomes.jsonl` produit)
- [ ] Le point de handoff est défini opérationnellement et testé sur PRs réelles ; la définition de « PR sans retouche » exclut explicitement rebase/formatage/merge commits (testée sur cas réels)
- [ ] Le signal « reprise post-merge » requalifie un cas reproduit (correctif sans casse CI sous X jours)
- [ ] `outcomes.jsonl` est append-only, à **writer unique** (le mesureur) ; **aucune écriture** dans `.supervision/` (lecture seule vérifiable) ; append par script uniquement
- [ ] Mesureur **déterministe zéro-LLM** ; réexécution idempotente (pas de doublons d'événements)
- [ ] Gate locale verte (typecheck/lint/tests)

> **Déportés dans [`20260813131259846`](../20260813131259846_ameliorabilite-surfaces-gelees-gated-adr030.md)** (gated ADR-030) : script d'append validateur noyau (3 violations), miroir tamper-évident hors arbre, chien de garde calendaire, verdicts `verified|retired` mécaniques, second fichier `lifecycle.jsonl`.

## Notes / décisions

- Prérequis absolu de la fiche « contrat v0.1 » (MVP B) — invariant « pas de chiffres, pas de proposition ».
- Le transport (deux fichiers vs ledger unique authentifié ; dossier dédié vs rider `.supervision/`) est proposé par ADR-030 mais reste un **arbitrage PO + panel** ; cette fiche s'aligne sur le verdict.
- S'appuie sur les capteurs recensés par 0022 (mission-control) et 0041 (banc cobaye) sans les dupliquer ; `cout_tokens` reste inactif tant que le mode pilote (0038) n'existe pas.
- Le mesureur, le ledger, le miroir, **le script d'append lui-même** et les définitions de métriques sont **surface gelée** du contrat : toute modification ultérieure = PO après panel.
- Signaux « santé de la porte humaine » (taux de rejet PO, latence submitted→approved) : proposés, hors cible d'optimisation — leur ajout touche le choix des métriques (surface gelée), donc soumis à arbitrage PO avant implémentation.