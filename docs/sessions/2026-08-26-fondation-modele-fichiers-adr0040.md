# Sprint — Graphe compilé (fiche 357), étape 1 de l'ADR-0040

Périmètre: POC borné — compiler les frontmatter **existants** → **instance de graphe typée**
(d'après `domain.ts`) ; la webapp/carte lit l'objet. **Aucun rename**, **pas** de validateur ni
de Skema.   Statut: en cours

## Portier d'ouverture (2026-08-26)

`VERDICT ALERT points=2,3` → **override PO journalisé** (goal explicite « lance le sprint sur 357 »).
Sûreté : les points signalés sont **sans rapport avec 357**.
- P2 worktrees (4) : `main`, ezk-backlog-aggregate, features-sprint-display, retrospectives-sprint-metrics — aucun sur le graphe/357.
- P3 in-progress : `0030` (démo desktop), `0088` (ezk-archive coût), `0164` (vz-product-builder) — aucun = 357.
Aucune collision ni reconstruction de travail en cours. Intake autorisé.

## Backlog (1 ligne = 1 feature = 1 PR)

- [x] feat: graphe compilé de la méthode (357) — POC livré, revue GO, merge local `a4858f2` (non poussé)

## Livré (2026-08-26)

- `pnpm graph:compile` → instance typée (artefact non-versionné `.ezk/graph.compiled.json`) ; id inconnu → échec.
- `pnpm graph:query` → 1er consommateur (lit l'objet, zéro recalcul).
- Gate locale verte (556/556). Revue adverse `ezk-reviewer` = GO ; P1 (garde artefact corrompu) corrigé.
- `357` passée `in-progress` (POC = 1 morceau ; reste : webapp, vocab-alias D1, refs→id).
- **Non poussé** : merge local seulement ; le push `main` → origin est réservé au PO.

## Definition of Done

- Un `pnpm` (mega-city) émet le graphe de la méthode en **objet typé** (pas un Mermaid), depuis les frontmatter **existants**.
- **Aucune clé de frontmatter renommée** (l'unification = plus tard, en alias — D1 de l'ADR-0040).
- La webapp/carte lit **cet objet** (≥ 1 consommateur) — plus d'arête peinte à la main sur ce périmètre.
- Le graphe est un **artefact de build non-versionné** (gitignoré), régénéré à la demande (D5).
- Références par **id**, avec **vérification d'existence** (un id pendouillant échoue) — au moins pour les liens déjà structurés.
- Gate locale verte (build/test/lint mega-city ; `act` dryrun). Pas de validateur ni de Skema (hors périmètre).

## Notes / décisions

- Archi = **ADR-0040** (accepté 2026-08-26). Cadre le POC. Ne pas rouvrir 0001/0039.

## ezk-product-build — boucle autonome (auto · tokens cap · check-ready false)

- **Intake 2026-08-26** : tête foundation = fiche **652** (P1, « statut validé par schéma ») →
  = **étape 2 de l'ADR-0040** (validateur, mode *warning* d'abord, schéma dérivé de `domain.ts`,
  check d'id pendouillant en réutilisant le graphe compilé de 357). 357 in-progress (ne pas refaire) ;
  P1 `20260813131259846` **blocked** (sautée, gate ADR-030) ; recettes gatées (P0 > P2).
- **Décision (journalisée) — checkpoint token-cap** : après 357 (panel + dev + reviewer + merge),
  la conso cumulée atteint le plafond de vigilance. En `--tokens cap`, on **s'arrête net** au plafond.
  652 est **identifiée et cadrée**, prête à lancer. Reprise = un mot du PO.
- **Réservé PO** (non automatisable) : push `main` → origin (357 est en local seulement).
