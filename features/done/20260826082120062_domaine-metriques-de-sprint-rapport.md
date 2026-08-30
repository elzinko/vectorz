---
id: "20260826082120062"
title: Domaine « métriques de sprint » — durée, tokens & KPI scrum par sprint → rapport de sprint versionné + validateur
type: feature
priority: P1
product: mega-city
epic:
status: shipped
ready: 2026-08-30
pr: "#191"
created: 2026-08-26
---

# 20260826082120062 — Domaine « métriques de sprint » → rapport de sprint

## En clair

Aujourd'hui, à la fin d'un sprint, on ne mesure rien. On veut un **rapport de sprint**
qui note tout seul le **temps passé**, les **tokens consommés** et les **KPI scrum**
(fiches livrées, blocages, retouches, tours de revue). Un **validateur** garantit que
le rapport est complet et cohérent. On produit et on range — **rien ne se déclenche
tout seul** (le déclenchement par la métrique, c'est un autre sujet, l'ADR-030).

## ▶️ Groomé 2026-08-30 (DoR levée par ezk-architect) — le MVP

Le verrou de conception (« les tokens ne savent pas à quel sprint ils appartiennent »)
**se dissout côté lecture**. On n'instrumente rien de neuf :

- Le journal de supervision écrit un `ts` ISO par événement et **un** gate
  `sprint-<slug>-checkpoint` par sprint. Les **frontières de sprint sont déjà là**, horodatées.
- Les transcripts Claude Code (`~/.claude/projects/…/*.jsonl`) portent les **tokens par
  message** (`message.usage`), horodatés. `supervision/analyze.ts` lit **déjà** journal +
  transcripts en une timeline fusionnée.
- Rattacher durée/tokens à un sprint = **une jointure par fenêtre de temps** entre ces deux
  sources. Un lecteur pur, déterministe. Zéro modification des émetteurs.

**Ce qu'on construit maintenant (MVP, aucune donnée manquante) :**

1. Un domaine `products/mega-city/src/sprint-metrics/` (domain pur / ports / adapters /
   validator) qui **réutilise** `supervision/journal.ts` + `supervision/analyze.ts`.
2. **Durée au grain sprint** (solide, horodatages du journal).
3. **Tokens au grain sprint best-effort** (fenêtrage des `message.usage` du transcript entre
   les frontières), **étiqueté comme tel** ; **repli honnête au grain session** si le
   fenêtrage est bancal — jamais de granularité silencieusement fausse.
4. **KPI solides** : fiches livrées (ids), retouches PR (réutilise `tools/outcomes`),
   blocages (événements `escalate{blocked}` du journal fenêtrés).
5. **Rapport versionné** `docs/sprints/<AAAA-MM-JJ>-sprint-<slug>.{md,json}` (répertoire
   **tracké**, pas `.improvement/` gitignoré). Le `.md` ouvre par « En clair », rendu depuis
   le `.json` (source de vérité).
6. **Validateur** `validateSprintReport(json)` calqué sur `journal-validator` : refuse un
   rapport tronqué/incohérent (champ manquant, `somme(étapes) ≠ total`, count ≠ len(ids)).

**Différé (best-effort ou hors coût MVP) :** ventilation par étape (le journal n'a qu'un
gate par sprint, pas un par étape → total + mention) ; tours de revue (seulement si l'adaptateur
`gh` est trivial) ; câblage du domaine budget cop1 (orphelin, inutile ici) ; tout seuil (Sujet B).

### ⚖️ 2 arbitrages produit à confirmer au tampon (l'architecte ne les a pas inventés)

- **`product:`** — reco **`mega-city`** (le domaine ne peut pas vivre sans les lecteurs
  journal+transcript qui y sont ; ancrer à la racine forcerait un import racine→intérieur d'un
  produit). La fiche proposait `vectorz`. *Front-matter passé à `mega-city` sous réserve de ton OK.*
- **Vélocité** — le modèle de fiche **n'a aucun point d'estimation**. Reco : **retirer la
  vélocité-points du MVP**, garder « fiches livrées ». (Introduire des points = chantier produit séparé.)

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

   **Ventilation par étape (best-effort)** : idéalement, répartir **durée et tokens par
   étape du sprint** (BDD, archi, TDD, gate, revue, PR) pour voir **où va le coût** et
   repérer ce qui est (in)efficient — la revue, par exemple, domine souvent. **Si** ce
   rattachement fin est trop coûteux à instrumenter, se rabattre sur le total du sprint et
   le **dire** dans le rapport (jamais de granularité silencieusement fausse). *NB : la
   ventilation par étape hérite du prérequis P1 ci-dessous, en plus exigeant encore (il
   faut un id d'étape, pas seulement un id de sprint).*
2. **Écrit** un **rapport de sprint versionné et commité**, dans un **répertoire tracké**
   (ex. `docs/sprints/`) — **pas** `.improvement/`, gitignoré à la racine (données runtime
   régénérables, non versionnées). Emplacement exact à trancher au groom. Ouvre par « En clair ».
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
- [ ] **Si faisable à coût raisonnable**, le rapport **ventile durée/tokens par étape**
      (BDD / archi / TDD / gate / revue / PR) ; sinon il donne le total du sprint et
      **signale** l'absence de ventilation.
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
- **⚠️ Prérequis de conception (P1, relevé par Codex sur #176)** : les deux sources de
  tokens envisagées **ne savent pas rattacher les tokens à un sprint**. La supervision
  ouvre **un seul run par session** de product-build, pas un par sprint
  (`products/mega-city/skills/ezk-product-build/SKILL.md:280-287`, `:307-314`) ; et les
  événements `TokenConsumption` du domaine budget sont keyés par **date**, sans id de
  sprint (`products/cop1/packages/sprint-core/src/features/budget/domain/ports/BudgetStorePort.ts`,
  `TokenConsumption.ts`). Deux sprints dans une même session (ou le même jour) verraient
  donc leurs tokens **confondus**. À résoudre AVANT d'accepter la métrique tokens :
  persister des **frontières de sprint**, ou poser un **id de sprint** sur les événements
  de tokens.
- **Voisins** : épic 0051 (qualité produit), 0055 (KPI agrégés commit→PR→sprint→version),
  0100 (sprint intake — santé du backlog à l'entrée).
- **DoR levée le 2026-08-30** (ezk-architect, voir section « ▶️ Groomé » en tête) :
  emplacement = `docs/sprints/` (tracké) ; source tokens = **transcripts Claude Code**
  fenêtrés par les gates `sprint-<slug>` (le domaine budget cop1 est orphelin, écarté) ;
  KPI MVP = fiches livrées + retouches PR + blocages. Restent 2 confirmations produit au
  tampon : `product:` (→ `mega-city`) et le sort de la vélocité (→ retirée du MVP).
