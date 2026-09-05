---
id: "20260905184644566"
title: "ezk-product-build : 3 vitesses (manuel|auto|yolo), --check-ready = filtre, auto/yolo ne bloquent jamais"
type: feature
priority: P1
product: mega-city
version:
epic:
status: idea
ready:
pr:
created: 2026-09-05
---

# 20260905184644566 — Redesign des axes d'autonomie d'ezk-product-build

## En clair

Aujourd'hui, `ezk-product-build --mode auto` **s'arrête et attend** l'humain dès qu'il touche
un point chaud. C'est l'inverse du but : `auto`, c'est pour **avancer quand tu n'es pas là**.

Cette fiche remet deux choses d'équerre. Le mode devient une **boîte à trois vitesses**
(`manuel | auto | yolo`). Et `--check-ready` redevient un **simple filtre** (« ne prendre que
les fiches prêtes ? »), au lieu d'encoder « qui tamponne `ready` ».

Le principe qui tient tout : **en `auto`/`yolo`, on ne bloque jamais** — on fait le geste sûr,
on le journalise, on continue ; **tu tranches au rapport**.

Décision de fond : [ADR-0050](../products/mega-city/docs/adr/0050-product-build-trois-vitesses-auto-ne-bloque-pas.md).

## Contexte / Problème

Deux défauts de conception, remontés en session de design le 2026-09-05 :

1. **`--check-ready` ment.** Son nom promet un filtre ; il livre une autorité de validation
   (« humain vs `ezk-pm` tamponne `ready` », ADR-0028). Et il est couplé au mode : `auto
   --check-ready true` (défaut) s'arrête pour l'humain → `auto` seul ne tourne pas seul.
2. **Les arrêts figent le run.** ADR-0011 §3 (« 4 arrêts humains, jamais automatisables ») se
   traduit, en `auto`, par un run **suspendu** en attente d'une réponse absente. Il ne produit
   rien jusqu'au retour de l'opérateur.

Reframe : **exécuter** une action dangereuse (interdit) ≠ **s'arrêter pour en demander la
permission** (inutile quand personne n'écoute). On garde l'interdit d'exécution, on supprime
l'attente.

## Proposition (compose l'existant, ne réimplémente rien)

### 1. Trois vitesses — le mode absorbe le planning

| Mode | Planning | Intervention | Tranche | Tampon `ready` |
|---|---|---|---|---|
| `manuel` (alias `ask`) | oui, validé par l'humain | chaque checkpoint | humain | humain |
| `auto` (défaut) | oui, composé `ezk-backlog`+`ezk-pm` | **entrée seule, non bloquant** | `ezk-pm` | `ezk-pm` |
| `yolo` | non | aucune | `ezk-pm`/intake glouton | `ezk-pm` |

- La passe de planning en `auto` est un **rendez-vous d'entrée non bloquant** : présent, tu
  ajustes ; absent, `ezk-pm` valide + journalise et ça roule. Jamais d'attente après l'entrée.
- `yolo` = `auto` sans planning (`--planning` survit en override caché ; un seul levier visible).
- **Pas de skill `ezk-planning`** : tranché le 2026-07-16/17 (fiche 0100, ADR-0016 option B).
  Le planning compose `ezk-backlog` (`plan`/`next`/`review`) + `ezk-pm`.

### 2. `--check-ready` = pur filtre d'intake

- `true` : ne tirer que les fiches déjà `ready:`.
- `false` : tirer la tête non-`ready` et **l'auto-groomer** (ADR-0028).
- Le tampon `ready` **suit le mode**, plus `--check-ready` (invariant « jamais un auto-tampon
  solo » d'ADR-0028 préservé via concurrence `ezk-pm`).

### 3. Principe « on ne bloque jamais » (hors planning d'entrée)

Tout arrêt → l'un de : **(a)** l'agent décide + journalise ; **(b)** reporter l'action
dangereuse (branche poussée sans `--force`, PR ouverte si GitHub) + journaliser ; **(c)**
skipper la feature + journaliser ; **(d)** finir le run + rapporter. Jamais une attente.
Aucune action irréversible **exécutée** en autonomie — reportée, pas jouée.

### 4. Trace (compose ADR-038)

Gestes (b)/(c)/(d) → `SPRINT.md` (journal décision) + section « Reporté/skippé/à trancher » du
pack `REVIEW.md`. Monitoring live (`events.jsonl`) reste séparé.

## Critères d'acceptation (à groomer avant `ready`)

- [ ] `--mode` accepte `manuel|auto|yolo` ; `auto` = défaut ; `ask` alias de `manuel`.
- [ ] `--check-ready` documenté et implémenté comme **filtre** ; le tampon `ready` découle du
      mode (démontré : `auto --check-ready false` groome et tamponne via `ezk-pm`, sans STOP).
- [ ] En `auto`/`yolo`, un point « action dangereuse » **reporte + journalise + continue**
      (branche poussée sans `--force`, PR ouverte si GitHub) au lieu de bloquer — démontré.
- [ ] En `auto`/`yolo`, contradiction / DoR non atteignable = **skip + journal**, backlog
      épuisé = **fin de run + rapport**, jamais d'attente.
- [ ] La section « Reporté/skippé/à trancher » apparaît dans le pack `REVIEW.md`.
- [ ] Rétro-compat : `--checkpoints ask|auto` mappe encore ; `--planning` survit en override.
- [ ] ADR-0011 §3 et ADR-0028 amendés (bannières datées) après ratification.

## Comment vérifier

Dérouler un `ezk-product-build run --mode auto --check-ready false` sur un backlog mêlant
fiches prêtes et non prêtes, dont une qui touche un point « action dangereuse » simulé :
observer grooming + tampon `ezk-pm` sans STOP, report de l'action dangereuse (branche/PR), et
la trace dans `SPRINT.md` + `REVIEW.md`. Relancer en `yolo` : vérifier l'absence de passe de
planning.

## Provenance

Session de design 2026-09-05 (via `/engineering:architecture`). Anti-doublon fait à la main
contre les fiches `check-ready`/`planning`/`mode auto` existantes (aucune ne couvre ce
redesign ; la fiche `done/20260813200137369` a livré le comportement **actuel** = ADR-0028).
Décision : [ADR-0050](../products/mega-city/docs/adr/0050-product-build-trois-vitesses-auto-ne-bloque-pas.md).
Voisines : [0100](0100-sprint-intake-sante-backlog-metriques.md) (planning = volet ouvert),
[20260830094601309](20260830094601309_product-build-auto-fenetre-contexte.md) (fenêtre de contexte, P2).

## Notes / décisions

- 2026-09-05 — **Statut `idea` à dessein** : Option C d'ADR-0050 doit passer un **panel
  adverse** (elle révise ADR-0011 §3) avant grooming `ready` et avant toute écriture dans le
  SKILL.md. Ne pas construire tant que le panel n'a pas statué.
- 2026-09-05 — **Panel adverse rendu : NO-GO convertible** ([capture](../docs/captures/2026-09-05-panel-adverse-adr-0050.md)).
  L'idée tient mais l'ADR doit être **réécrit sur 5 points P0 AVANT** que cette fiche puisse
  aller `ready` : (1) secret/entrée manquante = skip pas report ; (2) traitement d'échec du
  geste (b) ; (3) traiter l'arrêt budget ; (4) portée de la révision §3 (jour/cop1) ; (5) tampon
  `ready` avec second regard distinct. **NE PAS construire** cette fiche : elle attend la
  réécriture d'ADR-0050 + la ratification PO. Reste `idea`.
