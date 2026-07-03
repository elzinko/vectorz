# Skill brief — `ezk-design-system`

> Ce fichier est la source de vérité du design. Le `SKILL.md` dans ce même
> dossier est le skill exécutable par Claude Code.

---

## 1. Objectif

Installer **et faire respecter** un design system **minimal mais pro** dans un
projet web : tokens → atomes canoniques → styleguide vivant servi sur `/design`.
Objectif startup : **itérer vite sans diverger visuellement**, sans usine à gaz
(3 fichiers + 1 page, zéro build).

### Pourquoi

- La dérive visuelle vient de valeurs en dur copiées-collées : un design system
  **token-only** + des atomes canoniques tuent cette dérive à la racine.
- **Enforcement, pas juste bootstrap** : à chaque modif d'UI, une checklist
  garantit qu'on compose avec l'existant plutôt que d'ajouter du CSS ad hoc.

## 2. Deux modes

- **Bootstrap** (une fois) : extraire les `:root` vers `tokens.css`, canoniser les
  patterns en atomes dans `components.css`, servir `/design`, documenter ≤6 règles.
- **Enforcement** (à chaque tâche UI) : lire `docs/design-system.md`, tokens only,
  composer avant de créer, montrer tout ajout sur `/design`, migrer par **bridge**
  (jamais de big-bang), pas de `z-index: 9999`.

Réf d'implémentation : le projet **samplerz** (FastAPI + vanilla JS, zéro build).

## 3. Intégration

- **ezk-sprint** : étape « Archi » → vérifier la présence du design system ;
  étape « Revue » → dérouler la checklist d'enforcement.
- **ezk-preview** : `/design` est une page idéale à montrer dans une démo de PR.

## 4. Definition of Done (du skill)

`/design` répond 200 et liste atomes + tokens · `tokens.css` servi et non dupliqué
inline · `docs/design-system.md` existe avec les règles · migration par bridge qui
rétrécit.

## 5. Évolutions prévues (follow-up)

- Mode « dette » : un score/rapport des vues non encore migrées (taille du bridge).
- Adaptateurs pour stacks à build (Tailwind/React) au-delà du vanilla CSS/JS.
