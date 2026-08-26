---
id: "20260826072532537"
title: Vue « rétrospectives » dans ezk:map — chaque rétro et ses actions mesurables, extraites des captures
type: feature
priority: P2
product: mega-city
version:
epic:
status: idea
ready:
pr:
created: 2026-08-26
---

# Vue « rétrospectives » dans `ezk:map`

## En clair

Une sous-page de `ezk:map` pour **revoir les rétros passées** : pour chacune, sa **liste
d'actions mesurables** (ce qui a été décidé, où ça a atterri, adopté ou rejeté). Le
format cible existe déjà dans l'unique rétro capturée — un **tableau « Décisions du PO »**.
Mais deux réalités à connaître : il n'y a **qu'une seule rétro capturée** aujourd'hui, et
la standardisation de ces captures **n'est pas encore faite** (c'est la fiche [[0080]]).

> **Groomé le 2026-08-26.** L'intention (afficher la liste d'actions) est claire ; le
> vrai sujet est la **matière** : rare et pas encore normée. Statut laissé en `idea` —
> le gate `ready` promeut, pas le grooming.

## Contexte / Problème

Les rétros produisent de la valeur, mais **on ne peut pas la revoir d'un coup d'œil** :

- **Une seule** capture formelle : `docs/captures/2026-07-18-retro-cinq-sprints.md`. Elle
  a la bonne structure — sections (symptômes · lentilles · convergence · juge · propositions
  · **Décisions du PO** · glossaire) et surtout un **tableau d'actions** :

      | Proposition | Décision | Date |
      | 1 · Vérifier avant de citer | ✅ Adoptée → règle proven-outbound-references | 2026-07-18 |
      | 5 · Réserve de fiches en clôture | ❌ Rejetée — … | 2026-07-18 |

- Les **autres** rétros sont **dispersées** : en prose dans les sections « Rétrospective »
  des comptes-rendus de `docs/sessions/`, ou devenues des règles/DoD (cérémonie [[0167]])
  sans page qui les rassemble.
- Le dossier `docs/captures/` mélange les genres (panels adverses, notes de lecture,
  fermetures backlog) — les rétros n'y sont pas isolées ni régulières.

**Conséquence** : sans un format de capture **normé et systématique**, la vue n'a qu'une
seule rétro fiable à lire, et rien ne garantit les suivantes.

## Valeur

Voir la **suite des rétros** et, pour chacune, ses **actions mesurables** avec leur statut
(✅ adoptée / ❌ rejetée / ⏳ en attente) et **où** elles ont atterri (règle, slot du gate,
étape de skill). C'est la condition pour **mesurer si les règles adoptées servent** — et
les retirer sinon (la valeur même de [[0080]]).

## Proposition (groomée — extraction structurée)

Même logique que la vue sprints [[20260826072532452]] : **une source normée, puis une vue
qui la lit**.

**La source (prérequis).** Les rétros sont capturées au **format standard** de [[0080]]
dans `docs/captures/*-retro-*.md`, avec leur tableau **« Décisions du PO »**. C'est
[[0080]] qui garantit le format et la systématicité — cette vue **s'appuie dessus**, elle
ne le crée pas.

**La vue.** Un onglet `pnpm ezk:map retros`, sur le **patron d'onglet existant** (cœur pur
`src/core/…-data.ts` + chargeur + `bin/regen-retros-data.ts` + test d'invariant
« régénéré ≡ disque », comme `avancement`). Elle affiche :

- la **liste des rétros** (date · thème), de la plus récente à la plus ancienne ;
- au clic, pour chaque rétro, sa **liste d'actions** = les lignes du tableau « Décisions du
  PO » (proposition · décision/où elle a atterri · statut ✅/❌/⏳ · date) ;
- un lien vers la **capture source**.

## Périmètre

**Dans le lot (visé ready)** : lire les captures `*-retro-*.md` au format [[0080]],
afficher la liste des rétros + le tableau d'actions de chacune, le test d'invariant.

**Hors lot (gated — décision après usage)** :
- **Agréger** les sections « Rétrospective » en prose des comptes-rendus de `docs/sessions/`
  (fragile — même piège que les récits de sprint non normés).
- **Suivre le devenir** d'une action (« la règle X sert-elle encore ? ») — c'est une
  analyse, pas de l'affichage ; à instruire plus tard.

## Décisions laissées à l'étape Archi (avec recommandation)

1. **Source canonique** : `docs/captures/*-retro-*.md` au format [[0080]] **(recommandé)**
   — pas d'agrégation de la prose des comptes-rendus dans ce lot.
2. **Forme extraite** : le tableau « Décisions du PO » **(recommandé)** comme liste
   d'actions ; le reste de la capture (débats, juge) reste lisible au clic, non structuré.
3. **Anciennes/absentes** : si une rétro n'a pas le tableau normé, l'afficher en **dégradé**
   (date + titre + lien), sans casser la vue.

## Dépendances

- **Interne, dure** : [[0080]] (standardise la capture de rétro + son tableau d'actions).
  Sans elle, la vue n'a **qu'une** rétro à lire et aucun format garanti. Dans le monorepo
  (skill `ezk-retro`) — **pas** une dépendance externe (le slot DoR « dépendance externe
  constatée » ne s'applique pas).
- **S'appuie sur** [[0167]] (la cérémonie qui produit les actions).
- **Symétrie** avec la vue sprints [[20260826072532452]] : vue structurée ← format normé
  (sprints ↔ `docs/sessions/` via `ezk-archive` ; rétros ↔ `docs/captures/` via [[0080]]).
- **Voisine** : fiche pouce [[20260826072532622]].

## Critères d'acceptation

- [ ] `pnpm ezk:map retros` liste les rétros capturées (date · thème), plus récente d'abord.
- [ ] Chaque rétro affiche sa **liste d'actions** = les lignes du tableau « Décisions du PO »
      (proposition · décision/atterrissage · statut ✅/❌/⏳ · date).
- [ ] Chaque entrée pointe vers sa **capture source** (`docs/captures/`).
- [ ] Les données sortent d'un **script** (`bin/regen-retros-data.ts`) ; un **test
      d'invariant** rougit si une capture change sans regen.
- [ ] Une rétro **sans** tableau normé s'affiche en **mode dégradé** sans casser la vue.
- [ ] **Zéro** donnée saisie à la main ; la vue ne fait que **lire** les captures.
- [ ] Gate locale verte + liens markdown OK.

## Comment vérifier

```bash
pnpm ezk:map retros
```

La page liste les rétros ; ouvrir `2026-07-18` → ses actions apparaissent avec leur statut,
et le lien ouvre la capture. Ajouter une capture au format [[0080]] → elle apparaît après
regen ; la modifier sans regen → le test d'invariant rougit.

## Notes

- **Séquencement (à connaître)** : cette vue **n'aura presque rien à montrer** tant que
  (a) [[0080]] n'a pas normé la capture et (b) des rétros ne sont pas tenues régulièrement.
  Sa valeur est **différée** — c'est un argument pour tirer [[0080]] **avant** elle.
- **Choix implicite** : extraction structurée (liste d'actions), conforme à la demande PO
  du 2026-08-26 (« chacune de leur liste d'actions mesurables »).
- **Briques réutilisables** (patron `avancement`) : `bin/ezk-map.ts`, `bin/regen-avancement.ts`
  + son cœur `src/core/…-data.ts`, un chargeur `src/loaders/…`.
- **Product `mega-city`**.
