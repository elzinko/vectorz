---
description: >-
  Create and ENFORCE a lightweight design system (tokens + canonical
  components + living styleguide) in any web project, and keep every UI
  change coherent with it. Use when the user mentions "design system",
  "cohérence visuelle", "system design" (UI sense), "atomes", "librairie de
  composants", "styleguide", "storybook", asks why the UI looks inconsistent,
  or whenever ANY task adds/modifies UI (buttons, colors, spacing, CSS) in a
  project that has a docs/design-system.md — read it FIRST and apply its
  rules. MVP-grade by design: three files, no build system, no heavy
  tooling — works for vanilla JS/CSS apps served by any backend (Python,
  Node…). Nomme et rend CONSULTABLE/REQUÊTABLE le vocabulaire complet — Token,
  Variant, Slot, Pattern, Breakpoint — sur une page /design vivante.
---

# ezk-design-system

Tu installes et fais respecter un **design system minimal mais pro** :
tokens → atomes → styleguide vivant. Objectif startup : itérer vite SANS
diverger visuellement. Pas d'usine à gaz : trois fichiers + une page.

## Vocabulaire — les 5 notions (nomme-les explicitement)

Un design system se raisonne avec 5 notions. **Nomme-les** dans la doc et le styleguide :

| Notion | Ce que c'est | Où ça vit |
|---|---|---|
| **Token** | variable de design réutilisable (couleur, espacement, typo, rayon, z-index) | `tokens.css` (`--color-primary`, `--sp-4`) |
| **Variant** | déclinaison d'un composant par intention/état/taille (primaire/danger, S/M/L) | `components.css` (`.btn--primary`, `.btn--sm`) |
| **Slot** | zone d'un composant qui accueille du contenu variable (icône, label custom) | convention de markup documentée (`.card > [data-slot="header"]`) |
| **Pattern** | solution récurrente à un problème UI de + haut niveau (pagination, form multi-étapes, menu déroulant) | `patterns/` documenté + montré sur `/design` |
| **Breakpoint** | seuil de largeur où la mise en page change (responsive) | tokens `--bp-sm/md/lg` + media queries centralisées |

**Token → Variant → Slot** = l'échelle du composant ; **Pattern** assemble des composants (au-dessus) ; **Breakpoint** = la dimension responsive, transverse. Tout ajout dans l'une de ces 5 familles est **documenté + montré sur `/design`**, jamais en dur dans une vue.

> **Agnostique techno** : ces 5 notions sont **universelles**. Leur *implémentation* (CSS vanilla, Tailwind, styled-components, tokens JSON…) dépend de la **stack** — le choix des outils est **délégué** au domaine « stack → toolchain » (fiche 0020), pas hardcodé ici.

## Détection — le projet en a-t-il déjà un ?

Cherche dans cet ordre : `docs/design-system.md`, un fichier
`tokens.css`/`design-tokens.*`, un dossier `design/` dans les statics.

- **Présent** → lis la doc et applique ses règles à TOUTE modification UI
  (c'est le mode « enforcement », voir plus bas). Ne crée rien de neuf.
- **Absent** et la tâche touche l'UI de façon récurrente → propose le
  bootstrap (ci-dessous). Implémentation de référence : le projet
  `samplerz` (FastAPI + vanilla JS, zéro build).

## Bootstrap (une fois) — la structure en 3 fichiers + 1 page

```
static/design/tokens.css       # SOURCE DE VÉRITÉ : couleurs, typo,
                               # espacement (échelle 4px), rayons,
                               # z-index NOMMÉS. Tout commenté.
static/design/components.css   # atomes/molécules canoniques :
                               # .btn (intentions × tailles), .input,
                               # .label, .badge, .card, .list-item
                               # + BRIDGE (cf. migration)
static/design/design.html      # styleguide VIVANT servi sur /design :
                               # swatches lus en RUNTIME depuis les
                               # tokens (la page ne peut pas mentir),
                               # composants avec snippets copiables
docs/design-system.md          # les règles (court !) + état de la dette
```

Étapes :
1. **Extraire** les variables CSS existantes (`:root`) vers `tokens.css`
   — ne PAS dupliquer : l'inline disparaît, un `<link>` le remplace.
   Compléter avec les échelles manquantes (espacement 4px `--sp-1..6`,
   z-index nommés `--z-…`) en reprenant les valeurs RÉELLES du projet.
2. **Écrire les atomes** dans `components.css` à partir des patterns déjà
   présents (ne pas inventer un style : canoniser l'existant). Boutons =
   4 intentions max : `--primary` (1 par zone), `--secondary`, `--ghost`,
   `--danger` (+ tailles `--sm`, `--icon`).
3. **Servir `/design`** (une route statique suffit) et y montrer chaque
   token + chaque composant. Les couleurs se lisent via
   `getComputedStyle` → zéro copie.
4. **Documenter 6 règles max** dans `docs/design-system.md` (modèle :
   celui de samplerz) et l'état de la dette (vues non migrées).

## Migration — par BRIDGE, jamais en big-bang

En bas de `components.css`, une section *bridge* applique les métriques
des atomes (hauteur/rayon/typo) aux **classes historiques** listées
explicitement. Cohérence immédiate sans toucher au markup. Ensuite :
chaque vue retouchée migre vers les classes canoniques et retire sa
ligne du bridge. Le bridge qui rétrécit = la migration qui avance.

## Mode enforcement — à chaque modification d'UI

Checklist OBLIGATOIRE quand une tâche ajoute/modifie de l'UI dans un
projet équipé :

1. **Lire** `docs/design-system.md` avant d'écrire le moindre CSS.
2. **Tokens only** : aucune couleur/taille/z-index en dur — `var(--…)`.
   Une valeur manquante = un token AJOUTÉ et documenté, pas un littéral.
3. **Composer avant de créer** : besoin d'un bouton/badge/carte → classes
   canoniques. **Variant** manquant → l'ajouter dans `components.css` ; contenu
   variable → **Slot** documenté (pas un sur-composant) ; besoin récurrent
   (pagination, form multi-étapes…) → **Pattern** dans `patterns/`, pas du copier-coller.
4. **Tout ajout est montré sur `/design`** dans le même commit.
5. **Pas de `z-index: 9999`** : ajuster l'échelle nommée. **Responsive** via
   **Breakpoints** nommés (`--bp-*`), jamais une largeur magique en dur.
6. En touchant une vue : **migrer son markup** vers les atomes et
   alléger le bridge (règle du boy-scout).

Si l'utilisateur demande explicitement de déroger (prototype jetable),
acte la dérogation dans la PR — sinon ces règles priment.

## Consultable & requêtable

Le design system doit être interrogeable, **par l'agent ET par un humain** :

- **Par l'agent (enforcement)** : `docs/design-system.md` est lu avant toute UI — c'est déjà le cas ci-dessus.
- **Par un humain (browsable)** : `/design` liste **chaque** token, variant, slot, pattern et breakpoint (lus en runtime → « la page ne peut pas mentir »). Une section par famille des 5 notions.
- **Requêtable** : on peut demander « **liste les patterns** dispo », « **les variants** du bouton », « **les breakpoints** » → la réponse se lit dans `tokens.css` / `components.css` / `patterns/` (source de vérité), jamais devinée. Un `patterns/INDEX.md` (une ligne par pattern) rend l'inventaire trivial à interroger.

## Tests recommandés (anti-régression du système)

- `/design` répond 200 et contient les atomes.
- `tokens.css` servi ET non dupliqué inline (`"--bg-0: #…" not in html`).
- La doc existe et contient les règles.

## Intégration

- **ezk-sprint** : au moment « Archi » d'une feature UI, vérifier la
  présence du design system ; au moment « Revue », dérouler la checklist
  d'enforcement.
- Voisin de **ezk-preview** : `/design` est une excellente page à montrer
  dans une démo de PR design.
