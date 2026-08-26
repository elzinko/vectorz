---
id: "20260826082120062"
title: Domaine « métriques de sprint » — durée, tokens & KPI scrum par sprint → rapport de sprint versionné + validateur
type: feature
priority: P1
product: vectorz
epic:
status: idea
ready:
pr:
created: 2026-08-26
---

# 20260826082120062 — Domaine « métriques de sprint » → rapport de sprint

## En clair

Aujourd'hui, à la fin d'un sprint, on ne mesure rien. On veut un **rapport de sprint**
qui note tout seul le **temps passé**, les **tokens consommés** et les **KPI scrum**
(fiches livrées, blocages, retouches, tours de revue). Un **validateur** garantit que
le rapport est complet et cohérent. On produit et on range — **rien ne se déclenche
tout seul** (le déclenchement par la métrique, c'est un autre sujet, l'ADR-030).

## Contexte / Problème

`ezk-sprint` ne calcule ni ne stocke aucune métrique. Son `SPRINT.md` est un brouillon
éphémère, non commité. À la clôture, on a un résumé rédigé à la main plus une télémétrie
« best-effort » envoyée à un moniteur. Aucun chiffre gardé.

Du code mort existe déjà, mais rien n'est branché :

- `SprintEndReportService` (cop1) écrirait `.cop1/sprint-reports/<sprint>.md` avec
  vélocité / points / blocages / quality-gate — **jamais appelé**, et sans tokens ni durée.
- le domaine « budget tokens » (`TokenConsumption`, `BudgetStorePort`) existe, **orphelin**.
- le seul mesureur vivant, `tools/outcomes` (fiche done/0044), travaille au **grain PR**
  (temps de cycle, PR-sans-retouche), pas au grain sprint, et **sans tokens ni durée**.

Ce chantier est un **axe distinct** de l'épic 0051 (observabilité qualité **produit**).
0051 mesure le **logiciel fabriqué** (couverture, sécu). Ici on mesure **l'usage réel de
la méthode** — la performance du sprint tel qu'il s'est déroulé.

C'est de la **télémétrie d'usage réel** (self-hosting), du même registre que le mesureur
d'outcomes (`tools/outcomes`, famille du contrat d'améliorabilité — ADR-030), **mais sans
le déclenchement sur seuils** (ça, c'est le Sujet B, hors périmètre — voir plus bas).
**Ce n'est PAS** l'un des deux axes de test de l'ADR-031 : ceux-ci évaluent une
*configuration* de méthode sur des **tâches golden** synthétiques (oracle objectif,
baseline gelée, runs répétés, variance), pas l'usage réel d'un sprint.

## Proposition

Un **domaine dédié « métriques de sprint »** (au sens module/bounded context) qui, à la
clôture d'un sprint :

1. **Collecte** trois familles de mesures, par un composant **déterministe** (pas de
   rédaction à la main) :
   - **durée** — du début à la fin du sprint ;
   - **tokens consommés** — via la télémétrie de supervision / le domaine budget ;
   - **KPI scrum** — fiches livrées, vélocité, blocages, retouches de PR, nombre de
     tours de revue.
2. **Écrit** un **rapport de sprint versionné et commité** (emplacement à trancher au
   groom : `docs/sprints/` ou `.improvement/`), ouvrant par « En clair ».
3. **Valide** le rapport avec un **validateur** (sur le modèle de `journal-validator`) :
   un rapport incomplet ou incohérent est refusé.

**Réutiliser, pas réécrire** : étendre le mesureur tiers `tools/outcomes` (append-only,
déterministe, déjà livré) au grain sprint ; brancher le domaine budget pour les tokens ;
se servir de `SprintEndReportService` (mort) comme **croquis** des KPI scrum.

**Hors périmètre** : aucun déclenchement automatique sur seuil. Produire + stocker +
valider. Le déclenchement « sur preuve chiffrée » est le Sujet B (ADR-030), séparé exprès.

## Critères d'acceptation

- [ ] À la clôture d'un sprint, un **rapport de sprint** est produit et commité, contenant
      **durée + tokens + KPI scrum**.
- [ ] Les chiffres sont calculés par un **composant déterministe** (rejouable), jamais
      rédigés à la main.
- [ ] Le **validateur** refuse un rapport incomplet/incohérent (champ manquant, total
      impossible) et accepte un rapport complet.
- [ ] Le rapport est **relisible seul** (ouvre par « En clair »).
- [ ] Le chantier reste **distinct de l'épic 0051** : il ne mesure pas la qualité du
      produit, mais l'usage du sprint.
- [ ] Gate locale verte (typecheck/lint/tests).

## Comment vérifier

- Dérouler un sprint (ou **rejouer un sprint passé**), puis vérifier qu'un fichier de
  rapport existe avec les **trois familles** de métriques.
- Lancer le validateur sur un rapport **tronqué** → il échoue ; sur un rapport **complet**
  → il passe.
- Rejouer la collecte deux fois sur le même sprint → chiffres **identiques** (déterminisme).

## Notes / décisions

- **Origine** : demande PO du 2026-08-26 (session « retrospectives-sprint-metrics »).
- **`product: vectorz` proposé** — cousin de l'épic 0051 et ancré sur `tools/outcomes`
  (racine). *À confirmer* (alternative : `mega-city`, côté skill `ezk-sprint`).
- **`priority: P1` proposée** — *à confirmer par le PO*.
- **Ancrages** : étend `tools/outcomes` (done/0044) ; réutilise le domaine budget tokens ;
  croquis `SprintEndReportService` (mort).
- **Frontière** : PAS l'auto-amélioration déclenchée par métrique (Sujet B / ADR-030).
- **Voisins** : épic 0051 (qualité produit), 0055 (KPI agrégés commit→PR→sprint→version),
  0100 (sprint intake — santé du backlog à l'entrée).
- **À groomer (DoR) au tirage** : emplacement exact du rapport, liste finale des KPI,
  source précise des tokens (supervision vs budget).
