# Méthode ezk — vue globale SIMPLE

Date : 2026-07-30 (v3 — archive = capacité)

## Intention

Une vue **lisible en 5 secondes** : trois bandes seulement.
Pas toutes les flèches — juste « qui enchaîne », « qui fait la feature »,
« quels outils ».

## Les 3 bandes

1. **Orchestrateurs** — enchaînent plusieurs steps / PRs / sessions
   (`product-builder` → `sprint` → `pr`). **Pas** la clôture.
2. **Rôles (agents)** — la chaîne d'UNE feature, de gauche à droite.
3. **Capacités (briques)** — outils (`ezk-caps-*` / alias courts), utilisés
   par les rôles **et** par les orchestrateurs — jamais des « personnes ».
   Inclut **`archive`** (hygiène de clôture), **`backlog`**, **`sandbox`**, …

## Noms (préférences 2026-07-30)

- `ezk-pr-pilot` → **`ezk-pr`** (drop `-pilot`) : consomme un **stock de PRs**.
- Convention Validation : **aujourd'hui** `ezk-pr-pilot init` ; **à terme**
  `ezk-backlog init` (scaffold repo). `ezk-pr` garde `plan|run|report|ship`.
- Boot d'env isolé : **`ezk-sandbox`** (alias de `ezk-caps-sandbox`), pas un rôle.
- Préfixe capacités : **`ezk-caps-…`** pour ne plus confondre avec les rôles.
- **`ezk-archive`** = capacité de clôture, **pas** un 4ᵉ orchestrateur.

## Intersection backlog ↔ pr (pas redondants)

| | `ezk-backlog` | `ezk-pr` |
|---|---|---|
| Objet | fiches features/bugs | PRs ouvertes |
| Question | *quoi* construire / prioriser | *comment* valider & merger le stock |
| Cycle | idea → ready → ship fiche | plan → run → report → ship PR |
| Intersection | les deux touchent « done » via `ship` / `reconcile` | même verbe, objets différents |

Voir ADR-0022.
