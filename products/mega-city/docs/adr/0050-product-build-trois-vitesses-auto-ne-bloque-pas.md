# ADR 0050 — Product-build : trois vitesses (`manuel|auto|yolo`), `--check-ready` = filtre, `auto`/`yolo` ne bloquent jamais

**Statut :** Proposé — **v3, amendements du re-panel appliqués (2026-09-06)**, prêt pour ratification PO
**Date :** 2026-09-05 (v1) · 2026-09-06 (v2 puis v3)
**Deciders :** PO (Thomas)
**Révise :** [ADR-0011](0011-perimetres-jour-nuit-catalogue-first-decideur-agent.md) §3 · [ADR-0028](0028-product-builder-auto-groom-ready.md)
**Compose (sans rouvrir) :** [ADR-038](../../../../docs/adr/ADR-038-pack-review-markdown-first-reporting-vs-monitoring.md) (rapport ≠ monitoring) · [ADR-037](../../../../docs/adr/ADR-037-grain-merge-separable-du-grain-revue.md) (grain de merge) · [ADR-0016](0016-rituels-scrum-cycle-de-vie-backlog.md) (planning = sous-commandes d'`ezk-backlog`) · [ADR-0001](0001-monorepo-composable-coeur-deterministe.md) (frontière git)

> **Historique.** v1 : **panel adverse NO-GO convertible** (2026-09-05,
> [capture](../../../../docs/captures/2026-09-05-panel-adverse-adr-0050.md)). v2 : réécriture des
> 5 P0. **v3 (re-panel ciblé 2026-09-06) : NO-GO levé — archi + sûreté rendent GO-avec-amendements.**
> Cette v3 applique leurs résidus : **F1** (qui est le second regard du tampon `ready` — c'est
> l'humain), **F2** (trace qui tombe en cours de run), **F3** (rouge hérité de `main` escaladé
> tôt), **prérequis cop1** (l'escalade nocturne est terminale tant que la reprise asynchrone n'est
> pas câblée). Décisions réservées au PO listées en fin d'ADR.

## En clair

`ezk-product-build --mode auto` doit **avancer quand l'humain n'est pas là**. Le principe :
en autonomie, **on ne fait jamais attendre l'humain**. On fait le geste sûr, on le journalise,
on continue. L'humain tranche **au rapport**.

Ce qui reste **interdit en autonomie**, c'est d'**exécuter une action irréversible et sortante**
(deploy, `push --force`, suppression). On la **reporte**, on ne la joue pas. Le **merge, lui,
n'est pas dans cette catégorie** : il est réversible (revert), il se fait normalement — après un
gate de revue vert.

## Contexte

Deux défauts de la v1, plus trois trous que le panel a percés :

1. **Un flag qui ment** — `--check-ready` encodait « qui tamponne `ready` », pas un filtre.
2. **Des arrêts qui figent** — les 4 arrêts d'ADR-0011 §3 suspendent le run en attente d'un
   humain absent.
3. **Trous de sûreté (panel)** — « secret manquant » n'est pas une action à reporter mais une
   entrée absente ; le geste de report n'avait pas de traitement d'échec ; le même `ezk-pm`
   validait le plan ET tamponnait `ready` (pas de second regard) ; le budget n'était pas traité ;
   la portée cop1 n'était pas dite.

## Décision

### A. Trois vitesses — le mode absorbe le planning

| Mode | Planning d'entrée | Intervention humaine | Tampon `ready` |
|---|---|---|---|
| `manuel` (alias `ask`) | oui, l'humain valide | à **chaque** checkpoint | **humain** |
| `auto` (défaut) | oui, **rendez-vous d'entrée non bloquant** | à l'entrée seulement | `ezk-pm`, sous condition (§B) |
| `yolo` | **non** | **aucune** | `ezk-pm`, sous condition (§B) |

- **Rendez-vous d'entrée non bloquant** (`auto`) : présent, tu ajustes le plan ; absent, `ezk-pm`
  le valide + **journalise**, et ça roule — aucune attente ensuite. **(F5)** L'absence se
  **constate sans attendre** : pas de réponse dans le tour d'interaction courant, ou run headless,
  ⇒ `ezk-pm` procède. Jamais de timeout bloquant à l'entrée.
- **`yolo`** = `auto` sans planning. **`--max-sprints` y est OBLIGATOIRE** et le lancement
  demande **une confirmation explicite** (garde-fou d'intake : `yolo` sans borne = refus de
  lancer). `--planning` survit en override caché ; l'opérateur ne manipule qu'un levier visible.
- **God-flag assumé (P1)** : `--mode` porte volontairement planning + autorité + qui tamponne.
  Conséquence **dite explicitement** : la combinaison prudente d'ADR-0028 — *la machine groome,
  l'**humain** tamponne* — devient le mode **`manuel`**, pas un défaut. Ce n'est pas un nettoyage
  de nom, c'est un déplacement de posture, choisi.
- **Pas de skill `ezk-planning`** (tranché 2026-07-17, fiche 0100, ADR-0016) : le planning compose
  `ezk-backlog` (`plan`/`next`/`review`) + `ezk-pm`.

### B. `--check-ready` = filtre d'intake ; le tampon `ready` exige DEUX regards distincts

- **`true`** — ne tirer que les fiches **déjà `ready:`** (pas de grooming en boucle).
- **`false`** — tirer la tête non-`ready` et **l'auto-groomer** (ADR-0028).

**Tampon `ready` (ferme le Goodhart, P0-5 + F1).** Poser `ready` sur une fiche non-`ready` exige
**deux regards portés par deux acteurs de nature distincte** :
- **(a) « ça vaut le coup »** — décision **humaine**, jamais un agent. C'est **le second regard
  distinct**, tranché par l'humain en **pré-autorisant le lot** (fiches nommées au lancement).
- **(b) « la DoR est atteinte »** — mécanique. L'orchestrateur groome, **`ezk-pm` concourt** (deux
  regards sur la DoR, hérité d'ADR-0028). `ezk-pm` **ne porte que (b)**, jamais (a).

> **F1 — pourquoi c'est distinct par construction.** Le second regard sur « ça vaut le coup »
> est **l'humain** (le nommage du lot), pas un deuxième `ezk-pm` : on ne fabrique jamais un
> « `ezk-pm` bis » pour se cocher la case à soi-même. Si un co-tampon agent est un jour voulu sur
> (b), ce sera un rôle **tiers** en lecture seule (ex. `ezk-architect`, déjà juge de faisabilité
> dans ADR-0028), jamais un clone du décideur.

**Sans pré-autorisation humaine du lot (pur `yolo`, personne à l'entrée)** : on **ne tamponne
pas** de fiche non-`ready`. `yolo` **construit uniquement les fiches déjà `ready`**, groome les
autres en **« recommandé ready »** (sans tampon), à valider au réveil.

### C. Le principe porteur — en `auto`/`yolo`, aucun checkpoint n'attend l'humain

Hors le rendez-vous d'entrée (§A), **tout** point d'arrêt se résout par un de ces gestes,
**jamais par une attente** :

| Geste | Quand | Ce qui se passe |
|---|---|---|
| **(a) décider + journaliser** | arbitrage délégable | `ezk-pm` prend l'option recommandée, écrit dans `SPRINT.md` |
| **(b) reporter une ÉTAPE SORTANTE irréversible** | la feature est **bâtie**, mais son étape finale est deploy / `push --force` / suppression | on **ne joue pas** l'étape ; `ezk-sprint`/`ezk-pr` **préservent** la feature (branche poussée **dont on vérifie le succès**, PR ouverte) ; l'orchestrateur la **marque** « étape sortante en attente humaine » et continue |
| **(c) skipper une feature NON-CONSTRUCTIBLE** | entrée absente (secret/dépendance inaccessible), contradiction, DoR inatteignable, **ou un report (b) dont le push a échoué** | on **ne construit pas / ne joue pas à l'aveugle**, on **ne mocke jamais** une entrée manquante pour verdir, on journalise, on continue |
| **(d) finir le run + rapporter** | plus rien de constructible (backlog vide, tout skippé) **ou plafond de budget atteint** | le run **se termine** et produit son rapport — il ne se fige pas, il ne brûle pas sans fin |

**Corrections P0 gravées dans ce tableau :**
- **P0-1 : « secret / entrée manquante » est en (c) skip**, jamais (b). Une entrée absente rend la
  feature non-constructible ; ce n'est pas une action à reporter.
  *(Évolution prévue, hors cette session : une recette `ezk-secret` pourra, **avant** de skipper,
  tenter de **récupérer** le secret manquant depuis le client `ezk-secret`. Tant qu'elle n'est pas
  livrée, entrée absente = skip sec. Le geste (c) est donc le **plancher**, pas le mot de la fin.)*
- **P0-2 : (b) vérifie son propre succès.** Push rejeté (branche divergente), remote absent,
  réseau : la feature **n'est PAS « en sécurité »** → bascule en **(c)** + journal de l'état
  **réel**. Jamais un journal « poussée » sur un push échoué. C'est l'**exécutant**
  (`ezk-sprint`/`ezk-pr`) qui **constate** le rejet et le remonte ; l'orchestrateur **lit** et
  bascule le marquage en (c) (frontière ADR-0001 tenue jusque dans le cas d'échec).
- **P0-3 : le budget (#2 d'ADR-0011) est traité** → geste **(d)**. Au plafond `cap`, en `auto`/
  `yolo` (humain absent), « augmenter le budget » est une décision humaine impossible à prendre :
  on **finit le run + rapport**, jamais un burn silencieux, jamais une attente.
- **P0-7 : le git reste aux composées.** En (b)/(c), l'orchestrateur **décide et marque** ;
  `ezk-sprint`/`ezk-pr` **exécutent** le push/PR (frontière ADR-0001).

**Le merge n'est PAS un geste de sûreté (P0-6).** Il est **réversible** (ADR-037), il n'est pas
dans les 4 arrêts d'ADR-0011. Il se fait **normalement**, selon `--delivery` :
- `per-feature` (défaut) : `ezk-sprint` squash-merge **après un gate de revue VERT** (Codex /
  `ezk-reviewer`). Un gate **rouge** — y compris une **dette de CI héritée** — **retient**
  légitimement le merge : c'est le gate qui fait son travail, **pas** un geste (b). La boucle
  continue les autres features et **rapporte** le merge retenu et pourquoi.
- `per-epic` : merge **coordonné** par `ezk-pr` (train de merge, ADR-037).

À ne pas confondre, donc : **« merge différé par stratégie de livraison »** (ADR-037, `per-epic`)
et **« étape sortante reportée car dangereuse »** (geste b — deploy, `push --force`, suppression).
Le merge n'est ni l'un ni l'autre : il est le cours normal. Corollaire honnête : en `auto` +
`per-feature`, tant que les gates sont verts, **les PR sont livrées** ; si un gate est rouge, la
PR **reste ouverte en attente** — le rapport le dit, ce n'est pas « livré ».

> **F3 — rouge HÉRITÉ de `main` détecté tôt, pas au rapport.** Distinguer un gate rouge **causé
> par la feature** d'un rouge **déjà présent sur `main`** (dette héritée — cas réel de ce repo).
> Si `main` est **déjà rouge à l'intake**, l'`auto` risque de construire N features, ouvrir N PR
> et n'en merger **aucune** — un budget entier brûlé pour zéro livraison, révélé seulement au
> rapport final (ça frôle le burn que P0-3 interdit). Donc : **détecter un rouge pré-existant sur
> `main` à l'intake** et l'**escalader tôt** (geste a/d) — « le socle est rouge, rien ne mergera,
> je m'arrête/te préviens » — au lieu d'enchaîner N merges retenus en silence.

### D. Portée de la révision d'ADR-0011 §3 — runtime-agnostique (P0-4)

ADR-0011 §1 est **catalogue-first** : la capacité vit dans le skill, pas dans un runtime. Donc
cette révision **vaut pour les deux runtimes** — session interactive (jour) **et** cop1 (nuit) :

- Le **« jamais d'attente »** tient partout. Ce qui change, c'est **où part l'escalade** d'une
  décision humaine : au **rapport + humain** (jour), ou au **superviseur / API blocages de cop1**
  (nuit, mécanisme existant d'ADR-0011 §2). Les 4 escalades humaines **partent** (`escalate`),
  elles ne **figent** plus la boucle.
- Le **rendez-vous d'entrée** est une affordance **humaine** : sans humain (cop1/nuit), il
  **se replie** proprement sur « `ezk-pm` planifie + journalise » (comme `auto` sans personne), ou
  sur « pas de planning » (`yolo`). Aucune sémantique n'attend un humain qui n'existe pas la nuit.

> **⚠️ Prérequis cop1 (résidu P1 archi + réserve sûreté).** ADR-0011 (points 1 et 4) décrit la
> tuyauterie de blocages cop1 comme **codée mais NON câblée** : l'escalade nocturne est
> **terminale** (la story passe `blocked`), il n'y a **pas encore** de reprise asynchrone. Donc,
> à ce jour, en cop1 : une escalade **suspend la feature jusqu'au réveil** (rien n'est détruit —
> tout est en branche/PR), la boucle **continue** les autres features, mais **la reprise
> automatique n'existe pas**. Promettre une autonomie nocturne *avec reprise* est donc conditionné
> à **câbler cette reprise** — c'est un **prérequis d'activation**, pas un acquis. Sans lui, la
> nuit tourne en « suspends-et-continue, l'humain reprend au réveil ».

### E. La trace est REQUISE en autonomie, pas best-effort (P0-8)

Le principe C mise sa sûreté sur la trace : l'humain rattrape au rapport. Donc, en `auto`/`yolo` :

- **Deux traces, ne pas les confondre (F2).** Le **filet de sûreté** est **sur DISQUE** :
  `SPRINT.md` (journal de décision) + `REVIEW.md` (rapport, ADR-038). Il ne dépend d'aucun MCP,
  il survit à une chute réseau, il est **toujours écrit** — c'est lui qui garantit que « l'humain
  rattrape au rapport ». Le **monitoring live** (émission MCP de supervisabilité) est un canal
  **séparé et best-effort** (ADR-038). Donc : si le MCP **tombe en cours de run**, la boucle
  **continue** (le filet disque tient) ; si **l'écriture disque elle-même** échoue (le vrai filet
  est perdu), c'est **halt-and-report**, jamais continuer en aveugle. Absence du MCP **au
  lancement** : le skill **le signale**, il ne tourne pas en boîte noire.
- Chaque checkpoint résolu écrit un **signal positif de continuation** (geste a/b/c/d + motif),
  pas seulement l'absence d'un STOP — condition pour que QA puisse écrire des tests assertables.
- **Motif structuré (P1)** : chaque report/skip journalise **artefact** (branche/PR), **raison**,
  **geste de rollback**. Un skip **non motivé** bloque l'archivage de session (pas une mention).
  **(F4)** L'archivage est une cérémonie **jour** (`ezk-archive`) : en cop1/nuit, l'équivalent est
  que **le rapport final du run refuse de se clore « propre »** tant qu'un skip reste non motivé —
  le filet ne dépend pas d'un humain présent.
- La **fenêtre de contexte** sur run long reste le garde-fou de durée
  ([fiche 20260830094601309](../../../../features/20260830094601309_product-build-auto-fenetre-contexte.md)) :
  la trace vit sur disque, elle survit à un re-seed.

## Options considérées

Inchangées vs v1 : **A** garder les arrêts durs (autonomie faible), **B** tout exécuter (ligne
rouge), **C** reporter/skipper/finir + journaliser, jamais exécuter (**RETENUE**). La v2 ne change
pas l'option, elle **répare la spécification** de C sur les 5 trous du panel.

## Trade-off

Le risque se déplace de « le run bloque » vers « le run a avancé sur une base que je désavoue au
rapport ». Les digues : le **plancher outcome-testable** (ADR-0028), le **double regard** sur le
tampon `ready` (§B), la **vérification de succès** du geste (b), et une **trace requise** (§E). On
ne perd jamais de travail : tout est en branche/PR git, réversible.

## Conséquences

- ✅ `auto`/`yolo` **avancent et rapportent**, ne figent plus.
- ✅ Le **merge redevient normal** (réversible, après gate vert) ; un gate rouge le retient sans
  que ce soit un geste de sûreté.
- ✅ Le **Goodhart est fermé** : pas de tampon `ready` sans **pré-autorisation humaine du lot**
  (c'est ça, le second regard distinct) ; `ezk-pm` ne porte que la DoR mécanique ; `yolo` pur ne
  construit que du déjà-`ready`.
- ✅ Portée **dite** (jour + cop1) ; **budget** traité ; **échec de push** traité ; **secret** en
  skip.
- ⚠️ **Révise ADR-0011 §3** : l'interdit d'**exécution** (deploy/force-push/suppression) demeure ;
  l'**attente** disparaît, l'escalade route selon le runtime. À amender par bannière datée **après**
  ratification.
- ⚠️ **Révise ADR-0028** : le tampon `ready` passe de `--check-ready` à `--mode` + double regard.

## Décisions réservées au PO (Thomas) — le panel ne les tranche pas

1. **Prérequis cop1** : câbler la reprise d'escalade asynchrone **avant** de compter sur une
   autonomie nocturne *avec reprise*, **ou** assumer « la nuit = suspends-et-continue, reprise au
   réveil » (cf. § D). Ratifier l'un des deux.
2. **Appétit au risque de nuit** : tolérer le merge autonome sur `main` sans humain (réversible,
   gaté par la permission d'environnement) ; tolérer « 0 merge si `main` déjà rouge » — mitigé par
   F3 mais reste une posture.
3. **Défauts CLI** : `--mode auto` · `--check-ready false` · `--delivery per-feature` · l'existence
   même du cran `yolo`.

## Action Items

1. [ ] **Ratification PO** de cette v3 (re-panel 2026-09-06 : GO-avec-amendements, amendements appliqués).
2. [ ] Écriture dans `ezk-product-build/SKILL.md` **seulement après** ratification.
3. [ ] Amender ADR-0011 §3 et ADR-0028 (bannières datées) après ratification.
4. [ ] Fiche [20260905184644566](../../../../features/20260905184644566_product-build-trois-vitesses-auto-ne-bloque-pas.md) : critères d'acceptation sur les gestes (b)/(c)/(d), le tampon `ready`, **F2/F3**, + le harnais de simulation demandé par QA.
5. [ ] Vérifier la **permission d'environnement** (merge/commit gatés sur vectorz) avant de promettre un merge autonome — leçon du run 2026-09-05.
