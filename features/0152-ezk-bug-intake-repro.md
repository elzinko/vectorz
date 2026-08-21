---
id: 0152
title: ezk-bug — skill d'intake/cadrage d'un bug signalé : repro (Playwright MCP partagé) → fiche backlog
type: feature
priority: P2
product: mega-city
status: todo
ready: 2026-08-21
pr:
created: 2026-07-12
---

## Contexte / Problème
Aujourd'hui un bug n'entre dans le backlog que si **un humain** écrit une fiche `type: bug` à la
main. Aucun outil ne prend un **rapport brut** (« c'est cassé ») et le transforme en fiche
**reproductible et exploitable** (procédure, attendu/obtenu, preuve). L'organigramme ([[0028]]) le
confirme : la chaîne de valeur PO→Archi→Dev→QA→Reviewer n'a **aucun nœud d'intake de bug**. Le muscle
technique existe pourtant : [[ezk-qa]] pilote l'app qui tourne via le **Playwright MCP**
(`navigate/click/fill/snapshot/screenshot`, chargé via `ToolSearch`) et produit un **screenshot comme
preuve** — mais pour valider une PR *en avant* contre une DoD, pas pour confirmer *en arrière* un
symptôme signalé.

**Valeur** : sans nœud d'intake, un bug signalé « à la voix » se perd s'il n'est pas
transcrit à la main en fiche exploitable — et une fiche sans repro ni preuve coûte au
dev un aller-retour de clarification. `ezk-bug` capitalise la repro (procédure,
attendu/obtenu, screenshot-preuve) au moment du signalement : le backlog reçoit des bugs
**actionnables du premier coup**, et rien ne se perd entre les sessions.

## Décision (grooming + vérif adverse 2026-07-12) — rôle vs capacité, tranché
**`ezk-bug` est un skill d'intake/cadrage mince, pas un agent/rôle, et ne gonfle ni `ezk-qa` ni
`ezk-backlog`.** Le domaine mega-city (`docs/domain.ts`) modélise un **Agent = rôle** porteur de
`competences[]` / `interactions[]` (ses **capacités**), et les **skills = glue qui compose**.

- **Reproduire** un bug est une **capacité**. Mais attention à la formulation : le primitif réellement
  réutilisable est le **Playwright MCP partagé** — un outil que `ezk-qa` **charge** lui aussi (via
  `ToolSearch`), qu'il ne **possède pas**. `ezk-qa` est un **rôle soudé à la validation *en avant* d'une
  PR** (rédige une DoD Gherkin + émet un verdict vert/rouge par scénario) : il n'expose **aucune unité
  « repro d'un symptôme *en arrière* »** à emprunter. Donc `ezk-bug` **charge le même MCP directement** —
  ni nouveau rôle, ni **mode repro ajouté à QA** (qui bloaterait le rôle), ni pilotage d'app ré-encodé.
- **Nouvel agent** `ezk-bug`/`ezk-triage` → **rejeté** (rôle fantôme qui duplique le drive d'app).
- **Filer** = déjà la responsabilité de [[ezk-backlog]] (`add`, avec anti-doublon + cadrage). `ezk-bug`
  **délègue** le filing à `add` → `ezk-backlog` reste mince.
- **`capture` (0013)** = mécanisme de *câblage* d'une capacité sur un agent — **pas la bonne
  granularité** ici (voir Notes : la bascule vers skill tient au **placement cross-étape**, pas au
  nombre d'étapes).

**Analogie qui verrouille la place :** `ezk-backlog add` **délègue déjà** le cadrage d'une *feature*
vague à `product-brainstorming` ([[0022]]) — un helper du **front PO/BA**. Symétriquement, `add` d'un
***bug* vague/non confirmé** délègue à **`ezk-bug`** (repro + description), qui **rappelle `add`** avec
une fiche nette. `ezk-bug` est **le jumeau côté bug de product-brainstorming**, au **même front d'intake
PO/BA**.

## Proposition / Design
Un skill `ezk-bug` (glue) qui **COMPOSE**, ne réimplémente rien :
1. **Repro** — charge le **même Playwright MCP partagé** que [[ezk-qa]] (driver l'app locale +
   screenshot-preuve), **borné par un timeout / un nombre max de tentatives**, **sans** ajouter de mode
   repro à `ezk-qa`.
2. **Décrit** — description structurée : étapes de repro, **attendu vs obtenu**, environnement, preuve
   (chemin du screenshot), statut **`reproduit`** (cf. section non-repro).
3. **File** — appelle `ezk-backlog add` (`type: bug`), qui applique **anti-doublon + cadrage**.

**Placement organigramme ([[0028]])** : helper d'**intake/cadrage du front PO/BA**, en amont du
backlog, **délégué par `ezk-backlog add`** exactement comme `product-brainstorming` l'est pour une
feature vague. **Ce n'est PAS** une couche management orthogonale : `ezk-pr` (stock de PRs) et
`ezk-archive` (clôture de session) sont des **gestionnaires de stock/cycle de vie** — un **type de nœud
différent** d'un helper de cadrage par-invocation déclenché par `add`.

## Chemin « non reproductible » (non bloquant — mécanisme + testable)
Beaucoup de bugs ne sont **pas** reproductibles en autonomie. L'échec **ne bloque jamais**, et c'est
**outillé** :
- **Terminaison garantie** : la tentative de repro est **bornée** (timeout / max-tentatives). Un harnais
  qui **timeout** ou **ne démarre pas** (dev server down, app qui ne boote pas, MCP muet, pas d'env
  local) **produit quand même une fiche**.
- **Deux échecs distincts, pas un** — le statut `reproduit` ne surcharge pas un seul « non » :
  - `oui` / `partiel` — repro (totale/partielle) obtenue.
  - `non` — repro **tentée**, symptôme **absent**.
  - `hors-portée` — repro **non tentable** en autonomie : env/app/Playwright indisponible, **ou** classe
    **device / réseau / service externe** hors de portée d'un driver local.
- **`raison` obligatoire** dès que `reproduit ≠ oui` (ce qui a été tenté, environnement, hypothèses).

## Frontière avec [[ezk-qa]] (pas de double-emploi)
| | `ezk-qa` (rôle QA) | `ezk-bug` (skill intake) |
|---|---|---|
| Sens | *en avant* : valide une PR contre la DoD | *en arrière* : confirme un symptôme signalé |
| Moment | **dans** la boucle `ezk-sprint` (étapes 3/6), build in-sprint | **en amont** du backlog, cadrage hors-sprint |
| Sortie | verdict vert/rouge par scénario + DoD Gherkin | **fiche `bug`** dans le backlog |
| Outil | charge le **Playwright MCP** (via ToolSearch) | charge le **même Playwright MCP partagé** (via ToolSearch) — **pas emprunté au rôle QA** |

Même **outil MCP**, **rôles et moments différents**. La description de `ezk-bug` **disclaim
explicitement** toute validation de PR / rédaction Gherkin, pour que son trigger ne chevauche **jamais**
le « VALIDE une PR … dans la boucle ezk-sprint » de `ezk-qa`.

## Critères d'acceptation
- [ ] À partir d'un rapport brut, `ezk-bug` produit une fiche `type: bug` **via `ezk-backlog add`**
      (anti-doublon + cadrage hérités), jamais en écrivant le backlog en direct.
- [ ] La repro **utilise le même Playwright MCP partagé que `ezk-qa`** (pas de pilotage d'app ré-encodé
      dans `ezk-bug`, **pas de mode repro ajouté à `ezk-qa`**) ; la DoD vérifie que le drive/screenshot
      passe par ce MCP, pas par du code de pilotage dupliqué.
- [ ] La fiche porte `reproduit: oui | partiel | non | hors-portée` + **`raison` obligatoire si
      `≠ oui`** + la **preuve** (chemin screenshot) quand elle existe + attendu/obtenu + environnement.
- [ ] La tentative de repro est **bornée** (timeout / max-tentatives) ; un harnais indisponible ou en
      timeout **produit quand même une fiche** (statut `hors-portée`).
- [ ] **Tests d'acceptation** couvrant les 4 cas, pas seulement le symptôme-absent :
      (a) symptôme volontairement absent → `reproduit: non` ;
      (b) harnais/env indisponible → fiche + `hors-portée` ;
      (c) repro `partiel` ;
      (d) **terminaison** de la tentative (le timeout coupe et produit une fiche).
- [ ] `ezk-backlog add` d'un **bug vague** **propose/délègue** à `ezk-bug` (miroir de la délégation
      feature→`product-brainstorming`, [[0022]]) ; un bug déjà net n'a pas besoin de l'intake.
- [ ] Frontière avec `ezk-qa` explicitée dans le SKILL ; `ezk-bug` **disclaim** validation PR/Gherkin et
      reste **glue mince** (ne gonfle ni `ezk-qa` ni `ezk-backlog`).
- [ ] Skill authoré/déployé selon la convention du repo (dossier `skills/ezk-bug/`, SKILL.md, deploy).

## Comment vérifier

Les critères ci-dessus sont des **tests d'acceptation**. Recette à l'intake du sprint :

1. Donner à `ezk-bug` un rapport brut (« c'est cassé, le bouton X ne fait rien ») ; vérifier qu'il
   produit une fiche `type: bug` **via `ezk-backlog add`** (pas d'écriture directe du backlog).
2. Rejouer les **4 cas** de la DoD : (a) symptôme volontairement absent → `reproduit: non` ;
   (b) harnais/env indisponible → fiche + `hors-portée` ; (c) repro `partiel` ; (d) le timeout coupe
   et produit quand même une fiche.
3. Vérifier que la repro passe par le **Playwright MCP partagé** (chargé via `ToolSearch`), pas par du
   pilotage d'app dupliqué, et **sans** mode repro ajouté à `ezk-qa`.
4. Vérifier qu'`ezk-backlog add` d'un **bug vague** propose/délègue à `ezk-bug` (miroir feature→brainstorming).
5. Gate locale verte (tests du skill + lint) selon la convention du repo.

## Dépendances / articulation
- **[[0028]]** (carte des rôles) : ajoute `ezk-bug` **au front d'intake PO/BA, à côté de
  `product-brainstorming`** (cadrage côté bug) — **pas** une couche orthogonale type pr-pilot/archive.
  Décision du présent grooming à **remonter dans 0028**.
- **[[0022]]** (add → brainstorm pour feature vague) : `ezk-bug` en est le **jumeau côté bug**.
- **[[0013]]** (`capture`) : mécanisme de *câblage* d'une capacité sur un agent — **hors périmètre** ici
  (l'orchestration est skill-shaped).
- **[[ezk-qa]]** : **partage** le même Playwright MCP (chargé indépendamment, pas emprunté au rôle).
  **[[ezk-backlog]]** : `add`. **Playwright MCP** : l'outillage réellement partagé.

## Notes / décisions
- **Runner-up écarté** : « capacité/mode de `ezk-qa` » (attacher la repro à QA). Rejeté sur **(a)** ça
  **pollue le trigger** de QA, et **(b)** la **frontière intake/build** : attacher la repro à QA via
  `capture` ferait **déclencher un rôle de build in-sprint par une préoccupation d'intake en amont,
  hors-sprint** — brouille la frontière cadrage/validation de 0028. *(On abandonne l'argument « le
  filing n'est pas le job de QA » : il ne discrimine pas — les deux designs délèguent le filing à
  `add`.)* NB : **reproduire seul EST une capacité** ; ce qui bascule en **skill**, c'est le **placement
  cross-étape** (intake PO/BA, hors-sprint) **+** la **glue multi-étapes** (rapport → repro → repli →
  `add`), pas le nombre d'étapes.
- **Mécanisme laissé au build (n'empêche pas la DoR)** : *comment* `ezk-bug` mobilise le MCP — spawn du
  sous-agent `ezk-qa` **ou** chargement direct du Playwright MCP. **Défaut = chargement direct** ;
  spawner `ezk-qa` est **défavorisé** (QA rédige toujours une DoD Gherkin + émet un verdict PR
  vert/rouge, hors-sujet pour un intake **sans PR**). **Contrat de composition = comportemental** (repro
  pilotée par le Playwright MCP partagé), **indépendant du mécanisme** — à trancher par `ezk-architect`
  à l'intake du sprint.
- **ADR** : dans mega-city l'ADR est un **artefact de build** (`ezk-sprint` étape 2 → `ezk-architect`,
  `docs/adr/`). **Pas d'ADR au grooming** ; la décision rôle-vs-capacité ci-dessus est consignée ici et
  **alimente 0028**.
- Issu du brainstorm + grooming + **vérification adverse** (panel 7 lentilles + adjudicateur) de session
  2026-07-12.
- **Groom 2026-07-18** : DoR revérifiée complète (problème, valeur désormais explicite,
  8 critères observables déjà présents) en vue du gate `ready` — candidate au run de
  recette vz-product-builder (fiche 0164), build self-contained (skill authoring + tests,
  aucun humain requis en cours de build). Statut/`ready:` inchangés (le gate reste au PO).
- **Trigger réel 2026-08-13 (évidence terrain, non-breaking pour la DoR)** : bug MUTI
  `sweetModular` « le changement de canal MIDI est ignoré » (repo **muti**,
  `features/0026-midi-channel-switch-ignored.md`). Intake fait **à la main** — repro
  reconstruite, cause racine tracée (`useTracking.js:842` lit un ref jamais rafraîchi car Vue
  déballe le ref passé en prop), **test de non-régression exigé après coup** : exactement le
  geste que cette fiche doit rendre systématique. Deux précisions à intégrer **au build** (pas
  un nouveau design) : (a) le besoin « un front-matter pour dire *bug* vs *feature* » est **déjà
  couvert par `type:`** — `ezk-bug` n'ajoute **pas un champ**, il ajoute un **gabarit de corps**
  (repro + attendu/obtenu + preuve, déjà dans les critères) ; **où** ranger ce gabarit est
  contraint par le mode d'install : en **copy-mode global** (lawgiver par défaut / cap Claude
  Desktop), `skillFolderFiles()` ne matérialise que `<skill>/SKILL.md` — un
  `ezk-backlog/templates/bug-template.md` **auxiliaire serait absent au runtime** (limite déjà
  documentée dans `ezk-article/SKILL.md`, et raison pour laquelle `ezk-backlog` porte sa frappe
  d'id **inline** dans son SKILL.md). Donc : soit **embarquer le gabarit inline** dans le SKILL
  (portable partout, défaut recommandé), soit le garder en fichier auxiliaire **si** la
  matérialisation est étendue pour le déployer — à trancher au build ; dans les deux cas
  `ezk-backlog` reste propriétaire du format, `ezk-bug` le sélectionne ; (b) trancher
  **sévérité vs priorité** — un axe (priorité seule + ligne
  « sévérité » dans le corps, **défaut proposé**) ou deux (champ `severity:`) ? À décider par
  `ezk-architect` à l'intake (l'ADR reste un **artefact de build**, cf. §Notes ci-dessus).
  Voisin : [[0186]] (un gabarit qui *impose* une structure gagne à s'appuyer sur un **validateur
  de conformité** — cf. la note 2026-08-13 de 0186).
- **Groom 2026-08-21** : DoR re-vérifiée **complète** (problème, valeur, 8 critères observables, décision
  rôle-vs-capacité tranchée) ; ajout d'une section « Comment vérifier » explicite. Deux points restent
  **au build** (gabarit inline vs fichier ; sévérité vs priorité) et n'empêchent pas la DoR. Aucune
  dépendance externe. Candidate au gate `ready` (tampon au PO). Build self-contained (skill + tests).
