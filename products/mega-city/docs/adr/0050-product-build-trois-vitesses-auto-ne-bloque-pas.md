# ADR 0050 — Product-build : trois vitesses (`manuel|auto|yolo`), `--check-ready` = filtre, `auto`/`yolo` ne bloquent jamais

**Statut :** Proposé — **NO-GO convertible** (panel adverse 2026-09-05), à RÉÉCRIRE sur 5 points avant ratification
**Date :** 2026-09-05
**Deciders :** PO (Thomas) — à ratifier après réécriture

> **⚠️ Verdict du panel adverse (2026-09-05) — [capture](../../../../docs/captures/2026-09-05-panel-adverse-adr-0050.md).**
> L'idée porteuse tient, mais l'ADR **ne peut pas être ratifié en l'état**. Cinq réécritures P0
> avant de graver quoi que ce soit dans le SKILL.md :
> 1. « secret / entrée manquante » → geste **(c) skip**, jamais (b) report.
> 2. geste (b) : **traitement d'échec du push** (rejeté / remote absent → (c) + journal, jamais « poussée » faussement).
> 3. **traiter l'arrêt #2 (budget)** — aujourd'hui passé sous silence.
> 4. **portée de la révision d'ADR-0011 §3** : jour seul, ou aussi cop1/nuit — le dire.
> 5. tampon `ready` : **second regard réellement distinct** de l'agent qui a validé le plan (sinon l'invariant 2 d'ADR-0028 est vidé).
> Plus : distinguer « merge différé (ADR-037) » de « merge reporté car dangereux » ; rendre au
> git son délégataire (ADR-0001) ; renforcer la trace avant de la déclarer seul filet. La liste
> complète et les décisions réservées au PO sont dans la capture.
**Révise :** [ADR-0011](0011-perimetres-jour-nuit-catalogue-first-decideur-agent.md) §3 · [ADR-0028](0028-product-builder-auto-groom-ready.md)
**Compose (sans rouvrir) :** [ADR-038](../../../../docs/adr/ADR-038-pack-review-markdown-first-reporting-vs-monitoring.md) (rapport ≠ monitoring) · [ADR-035](../../../../docs/adr/ADR-035-abandon-siege-run-orphelin.md) (ne pas bloquer indéfiniment) · [ADR-0016](0016-rituels-scrum-cycle-de-vie-backlog.md) (planning = sous-commandes d'`ezk-backlog`)

## En clair

`ezk-product-build --mode auto` a un but simple : **avancer quand l'humain n'est pas là**.
Le design actuel le trahit deux fois. Un flag (`--check-ready`) encode « qui tamponne
`ready` » alors que son nom promet un filtre. Et les « 4 arrêts humains » d'ADR-0011 **figent
le run** dès qu'ils sont touchés — l'inverse du but.

Cet ADR remet les axes d'équerre et pose **un principe** : en autonomie, **on ne bloque
jamais**. On fait le geste sûr, on le journalise, on continue. L'humain tranche **au rapport**,
pas pendant le run. L'interdit d'**exécuter** une action dangereuse (deploy, merge, `push
--force`, suppression) **demeure** — on la **reporte**, on ne la joue pas.

## Contexte

**1. Un flag qui ment.** ADR-0028 a donné à `--check-ready` le sens « qui pose le tampon
`ready` après auto-grooming — l'humain (`true`) ou `ezk-pm` (`false`) ». Le nom suggère un
**filtre de fiches** ; il livre une **autorité de validation**. Et il est **couplé au mode** :
`auto --check-ready true` (le défaut) s'arrête pour l'humain — donc `auto` seul ne tourne pas
seul.

**2. Des arrêts qui bloquent.** ADR-0011 §3 a gravé « 4 arrêts irréductiblement humains,
jamais automatisables ». En pratique, en `auto`, un arrêt = **le run se fige et attend** une
réponse humaine absente. Il ne produit rien jusqu'au retour de l'opérateur.

**3. Le reframe qui débloque.** Il faut distinguer **exécuter** une action dangereuse
(interdit, à raison) de **s'arrêter pour en demander la permission** (inutile quand personne
n'écoute). ADR-0011 a confondu les deux. On garde l'interdit d'exécution ; on supprime
l'attente.

**4. Le planning n'est pas un skill neuf.** La question « faut-il un skill `ezk-planning`
dédié ? » a été **tranchée le 2026-07-17** (fiche
[0100](../../../../features/0100-sprint-intake-sante-backlog-metriques.md), note) : **non**,
le planning vit dans les **sous-commandes d'`ezk-backlog`** (`plan`, `next`, `review`), qu'`ezk-product-build`
**compose** (ADR-0016 option B). Le présent ADR **respecte** cette décision : la « passe de
planning » du mode `auto` **compose** l'existant, elle n'introduit aucun skill.

## Décision

### A. Trois vitesses — le mode absorbe le planning

`--mode` devient une boîte à **trois rapports**. Une seule question les distingue : **à combien
de points l'humain a-t-il son mot à dire ?**

| Mode | Planning | Intervention humaine | Qui tranche le reste | Tampon `ready` |
|---|---|---|---|---|
| `manuel` (alias `ask`) | oui, l'humain le valide | à **chaque** checkpoint | l'humain | l'humain |
| `auto` (défaut) | oui, composé via `ezk-backlog`+`ezk-pm` | **à l'entrée seulement** (le plan), **non bloquant** | `ezk-pm` | `ezk-pm` |
| `yolo` | **non** | **aucune** | `ezk-pm` / intake glouton | `ezk-pm` |

- **La passe de planning en `auto` est un rendez-vous d'entrée, jamais un blocage.** Si
  l'humain est présent, il ajuste le plan. Absent, `ezk-pm` valide le plan, le **journalise**
  (`SPRINT.md`), et **ça roule** — aucune attente ensuite. `auto` invite **une fois, au
  départ**, jamais en cours de route.
- **`yolo`** = `auto` **sans** la passe de planning : intake glouton, zéro touchpoint.
  Techniquement « `auto --planning false` » — l'implémenteur peut garder `--planning` en
  **override caché**, mais l'opérateur ne manipule qu'**un seul levier**.
- **`--planning` disparaît de la surface** (il était un axe séparé dans les brouillons) :
  il est **absorbé** par le cran de mode.

### B. `--check-ready` redevient un pur filtre d'intake

- **`true`** — ne tirer que les fiches **déjà `ready:`** ; laisser les autres (pas de
  grooming dans la boucle).
- **`false`** — tirer la tête **même non-`ready`** et **l'auto-groomer** (boucle ADR-0028).

Le **tampon `ready` n'est plus porté par `--check-ready`** : il **découle du mode** (§A).
`auto`/`yolo` → `ezk-pm` concourt et tamponne (jamais un auto-tampon solo, invariant ADR-0028
préservé). `manuel` → l'humain tamponne.

### C. Le principe porteur — en `auto`/`yolo`, aucun checkpoint n'attend l'humain

Hors la passe de planning d'entrée (§A), **tout** point d'arrêt se résout par l'un de ces
gestes, **jamais par une attente** :

| Geste | Quand | Ce qui se passe |
|---|---|---|
| **(a) l'agent décide + journalise** | arbitrage délégable | `ezk-pm` prend l'option recommandée, écrit dans `SPRINT.md` |
| **(b) reporter l'action + journaliser** | action dangereuse (merge, deploy, `push --force`, secret) | on met la feature **en sécurité** — branche poussée (jamais `--force`), PR ouverte si GitHub — on **ne joue pas** l'action, on la marque « à valider par l'humain », on passe à la suivante |
| **(c) skipper la feature + journaliser** | contradiction, conflit stratégique, DoR non atteignable | on **ne construit pas à l'aveugle**, on note pourquoi, on passe à la suivante |
| **(d) finir le run + rapporter** | plus rien de constructible (backlog vide, tout skippé) | le run **se termine** et produit son rapport — il ne se fige pas en attente |

**L'invariant de sûreté survit intact** : aucune action irréversible/sortante n'est
**exécutée** en autonomie. Elle est **reportée** (b), pas jouée. Ce qui change vs ADR-0011 :
toucher un tel point **ne fige plus la boucle**.

### D. Où va la trace (rapport ≠ monitoring)

Adossé à **ADR-038**, qui a déjà séparé les deux artefacts. Les gestes (b)/(c)/(d) écrivent :

- **Journal de décision** → `SPRINT.md` (`## Notes / décisions`) — le post-hoc humain.
- **Rapport final** → le pack `REVIEW.md` (ADR-038) **agrège par référence** une section
  « Reporté / skippé / à trancher ».
- **Monitoring live** (`events.jsonl`, `supervision/`) reste **séparé** — vivacité du run, pas
  arbitrages produit.

### E. Backlog vide — inchangé maintenant, idéation plus tard

En `auto`/`yolo`, backlog vide = geste **(d)** : le run finit et rapporte « rien à
construire ». Pas d'invention de direction produit aujourd'hui. **Volet futur** (hors cet
ADR) : une **phase d'idéation** qui enchaîne idée → cadrage → dev, une par une.

## Options considérées

Le point réellement contesté : **comment `auto`/`yolo` traitent les arrêts d'ADR-0011.**

### Option A — Garder les 4 arrêts durs (statu quo ADR-0011 §3)
| Dimension | Éval |
|---|---|
| Sûreté | Maximale |
| Autonomie réelle | **Faible** — le run se fige au 1er point chaud |

**Pour :** zéro risque. **Contre :** trahit le but de `auto` ; un run nocturne cale et n'a rien
produit au réveil.

### Option B — Tout continuer, y compris exécuter (auto plein)
**Pour :** autonomie totale. **Contre :** exécute des actions irréversibles sans humain.
**Rejeté** — ligne rouge non négociable.

### Option C — Reporter + journaliser + continuer, jamais exécuter (RETENUE)
| Dimension | Éval |
|---|---|
| Sûreté | Préservée (aucune exécution dangereuse) |
| Autonomie réelle | **Élevée** — le run avance et produit un rapport |
| Contrôle humain | **Déplacé au rapport** (keep/discard) + planning d'entrée en `auto` |

**Pour :** réconcilie sûreté et autonomie ; s'appuie sur ADR-038 (trace) et ADR-035 (ne pas
bloquer). **Contre :** dépend du jugement d'`ezk-pm` et de la qualité du journal ; un skip mal
motivé passe inaperçu jusqu'au rapport.

## Trade-off

Le risque se déplace de **« le run bloque »** vers **« le run a avancé sur une base que je
désavoue au rapport »**. La digue : le **plancher outcome-testable** (déjà dans ADR-0028) et la
**qualité du journal**. Un skip/report non motivé est un défaut de **trace**, pas de sûreté. On
ne perd jamais de travail — tout est en branche/PR git, réversible.

## Conséquences

- ✅ `auto` tient enfin sa promesse : il **avance et rapporte**, il n'attend pas.
- ✅ `--check-ready` redevient lisible (un filtre) ; `--mode` porte l'autorité **et** le
  planning ; l'opérateur manipule **un seul levier** d'autonomie.
- ✅ Aucun skill `ezk-planning` créé — décision de 2026 respectée (fiche 0100, ADR-0016).
- ⚠️ **Révise ADR-0011 §3** : l'interdit d'**exécution** demeure ; l'**attente** disparaît en
  `auto`/`yolo`. À amender par bannière datée, pas réécrire.
- ⚠️ **Révise ADR-0028** : le tampon `ready` passe de `--check-ready` à `--mode`.
  `--check-ready` change de sémantique (filtre).
- ⚠️ **Rétro-compat CLI** : `--planning` quitte la surface (override caché) ; le mapping
  hérité `--checkpoints ask|auto` doit accueillir le 3ᵉ cran (`yolo` neuf, sans hérité).
- 🔁 Défauts retenus (PO) : `--mode auto`, `--check-ready false`, `--tokens lean`,
  `--delivery per-feature`.

## Action Items

1. [ ] **Panel adverse** sur l'Option C (surtout la révision d'ADR-0011 §3) **avant**
   ratification et **avant** toute écriture dans `ezk-product-build/SKILL.md`.
2. [ ] Fiche P1 : redesign des axes (`manuel|auto|yolo`, `--check-ready` filtre, tampon suit le
   mode) + principe « `auto`/`yolo` ne bloquent jamais » (defer/skip/end + log).
3. [ ] Brancher la **passe de planning** au **volet ouvert de la fiche 0100** (santé backlog,
   seuil de lot, garde d'intake) — **pas** un skill neuf.
4. [ ] Amender ADR-0011 §3 et ADR-0028 (bannières datées) une fois l'Option C ratifiée.
5. [ ] Section « Reporté / skippé / à trancher » du pack `REVIEW.md` (compose ADR-038).
6. [ ] Volet futur (P2) : phase d'idéation qui enchaîne idée → dev.
7. [ ] Rappel : fenêtre de contexte sur run long — fiche
   [20260830094601309](../../../../features/20260830094601309_product-build-auto-fenetre-contexte.md) (P2, déjà actée).
