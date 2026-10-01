---
id: "20260830194601233"
title: "Livrer une fiche sans casser les liens ni les vues (ship sûr)"
type: refactor
priority: P0
product: mega-city
version: V0.3
epic:
labels: [backlog]
depends: []
status: shipped
pr: "#282"
created: 2026-08-30
---

## En clair

Marquer une fiche livrée (`ship`) doit être **un seul geste qui ne laisse rien de cassé**.
Aujourd'hui, c'est un `git mv` nu. Les liens relatifs `../` cassent (17 d'un coup sur `main`) et
personne ne le voit, car le ship part sans gate. On industrialise l'outil de preuve (`ship_move.py`,
hors dépôt) en une commande du dépôt : `pnpm --dir products/mega-city ship:fiche`. Elle fait tout,
dans l'ordre, **ou rien** : si un contrôle est rouge, elle n'écrit rien et sort en erreur.

Depuis la fiche `20260830194601376` (PR #279), `board`, `pilotage`, `runs` et `PORTFOLIO` ne sont
plus dans git. Au ship, il ne reste donc à tenir à jour que `BACKLOG.md` (régénéré) et `PLAN.md`
(curé).

## Symptôme (rétro 2026-08-30 — RÉCURRENT, vécu à chaque sprint de la session)

- **Liens** : shipper les fiches bundles (#190) puis recette (#192) a laissé **17 liens cassés
  sur `main`**, non détectés car `test-links-repo` (la gate) ne tourne pas sur un ship.
- **Vues** : après chaque tampon `ready`/`ship`, les tests de fidélité rougissaient tant qu'on
  n'avait pas lancé les `regen` à la main (réglé pour board/pilotage/portfolio par la fiche
  `20260830194601376` : ces vues ne sont plus committées).

## Ce que fait la commande (POC borné)

`ship:fiche [--status shipped] --pr '#N' [--dry-run] features/<id>_slug.md [...]`

1. **Vérifie avant d'écrire** : chaque fiche est sous `features/` (pas déjà dans `done/`), sa
   destination est libre, le statut est admis.
2. **Calcule en mémoire** : `status` et `pr` du front-matter ; recalage de **tous** les liens
   relatifs du markdown (sortants de la fiche, entrants, entre fiches d'un même lot) ; barrage de
   l'entrée de `PLAN.md` (`~~…~~ — shipped #N`).
3. **Refuse, sans rien écrire** (exit 1), si le nombre de liens cassés augmente ou si une entrée de
   `PLAN.md` ne peut pas être barrée proprement.
4. **Applique** : écritures, un seul `git mv` groupé, puis `regen-backlog.sh`. Si une étape échoue,
   tout revient à l'état initial (exit 2).

La commande ne committe ni ne pousse : elle prépare un état propre et vérifié. Le commit reste
celui du `ship` (`ezk-commits`). Les liens sont lus **comme `check-links.sh` les lit**, pour que le
ship recale exactement ce que la gate vérifie.

Règle d'archi : **le chemin d'écriture possède ses invariants** (liens résolus, vues à jour),
jamais la vigilance humaine.

## Critères d'acceptation (reste réel)

- [x] `ship:fiche` livre 1 à n fiches en un geste : `status` et `pr` posés, `git mv` groupé vers
      `done/`, liens recalés (sortants, entrants, entre fiches du lot), `BACKLOG.md` régénéré,
      entrée de `PLAN.md` barrée. Preuve : `ship-fiche.test.ts` (lot de 2 fiches, puis dépôt git
      jetable) et un `--dry-run` sur la vraie fiche `20260830194601376` (3 liens recalés, 1 entrée
      de `PLAN.md` barrée).
- [x] Les liens sont lus comme `check-links.sh` : liens en ligne, définitions `[x]: cible`,
      `<cible>`, blocs de code ignorés, schémas / ancres / chemins absolus laissés tels quels.
      Preuve : tests `recalLinks` et `findBroken`.
- [x] **Refus avant toute écriture** (exit 1, dépôt intact) : fiche hors `features/` ou déjà dans
      `done/`, fiche pas suivie par git, destination existante, statut non admis, lien nouvellement
      cassé (on compare les liens, pas seulement leur nombre), entrée de `PLAN.md` non barrable
      (pour les quatre statuts terminaux). Preuve : tests `planShip`, et `--no-bar-plan` refusé sur
      la vraie fiche.
- [x] Un échec pendant l'application (git, régénération) remet le dépôt à l'état initial (exit 2).
      Preuve : test sur dépôt jetable, `git status` vide et fiche identique à l'octet.
- [x] Sur un dépôt jetable : ship d'une fiche riche en liens `../` ⇒ delta de liens cassés = 0 pour
      la vraie gate `check-links.sh` ; le même ship avec un recaleur saboté est refusé, avec les
      liens fautifs listés.
- [x] `ezk-backlog ship` (SKILL.md) appelle la commande et ne liste plus les générateurs un par un.
      La recette de conflit sur `BACKLOG.md` y est écrite (merger `main`, puis régénérer).
- [x] Gate locale verte (typecheck, test 974/974, test:scripts 28 suites, lint, check-links 0
      cassé).

## Comment vérifier

```bash
pnpm --dir products/mega-city exec vitest run src/backlog/__tests__/ship-fiche.test.ts
# à blanc sur une vraie fiche : rapport des liens recalés, aucune écriture
pnpm --dir products/mega-city ship:fiche --dry-run --pr '#999' features/<id>_slug.md
```

## Suite (hors POC)

- `views:check` (régénère + `git diff --exit-code`) dans la gate locale pour les vues restées
  committées (`BACKLOG.md`, bloc `composes`, carte) : notes N1 et N2 ci-dessous.
- Helper de conflit entre deux ships parallèles : après la fiche `20260830194601376`, seul
  `BACKLOG.md` peut encore entrer en conflit. La recette écrite dans le SKILL suffit. Un helper
  viendra si un second cas apparaît.
- `reconcile` et le merge partiel (1 fiche = N PR, symptôme SR2) : choisir entre (a) section
  « tranches », (b) tous les critères cochés, (c) jugement humain. Pas tranché ici.
- Tampon `ready` qui touche le front-matter : plus aucune vue committée à rafraîchir hors
  `BACKLOG.md` ; rien à ajouter tant que ce point reste vrai.

## Notes

- Rétro 2026-08-30 (consensus archi/dev/pm — les deux P0 récurrents de la session). Symptômes
  1 et 2 : même racine (« le ship ne finit pas son travail ») → un seul durcissement.
- Piège déjà noté en mémoire projet (« un ship casse les liens ../ »).
- Frontière ADR-0001 : le rangement reste déterministe (script), le LLM ne range pas.
- **MAJ 2026-09-20 (rétro auto-amélioration, note N1)** — le besoin **déborde le `ship`** :
  éditer `composes:` d'un skill casse aussi plusieurs vues (`map:data`, board, graphe
  `skills/README`), vécu 2× (sprints `20260831075615969` et `20260911224102584` ; board périmé
  flaggé Codex #227). Piste convergente : **une commande unique `views:regen`** régénère **toutes**
  les vues dérivées d'un coup (backlog, portfolio, board `avancement`/`plan-delta`/`plan-view`,
  `composes:graph`, `map:data`), + un **garde-fou de dérive** en CI. Critère : `views:regen` puis
  `git diff` **vide** sur les fichiers générés ; la CI **échoue** si une vue diffère de sa source.
  Même racine que cette fiche (« le chemin d'écriture possède ses invariants »), élargie du `ship`
  à **tout edit qui dérive une vue**.
- **MAJ 2026-09-24 (rétro « versions + config github », note N2) — 3ᵉ récurrence → montée P1→P0.**
  Le trou a mordu **3 fois dans la même session**, rattrapé TARD par 3 filets DIFFÉRENTS : Codex
  (revue PR #257) sur `PORTFOLIO.md`+board périmés, `check-planning-views` sur `PLAN.md` non curé +
  PORTFOLIO, puis `pnpm test` (égalité stricte) sur **`pilotage.html`** — une vue non listée dans la
  note N1, **à ajouter au catalogue `views:regen`** (backlog · portfolio · board avancement/plan-delta/
  plan-view · pilotage · `composes:graph` · `map:data`). **Sharpening reviewer (anti-Goodhart)** : le
  garde-fou ne doit PAS rester « en CI » (tardif, et rouge pour des raisons sans rapport) ni être une
  case DoD (se coche sans être tenue) — c'est un **`views:check` = régénère + `git diff --exit-code`**
  branché dans la **gate LOCALE** (`pnpm test` / `test:scripts`) ; constat vérifié : `check-planning-views.ts`
  **n'est câblé nulle part** aujourd'hui. **Frontière archi (règle qui découlera du build)** : une vue
  dérivée n'existe **qu'à travers `views:regen`** — aucune procédure/skill ne liste les générateurs un par
  un (le `ship` du SKILL `ezk-backlog` ne cite que backlog+portfolio, pas board/pilotage). Juge de
  cohérence : **mieux en fiche qu'en règle-texte** (une règle sans check = Goodhart) → construire ceci
  d'abord, la règle deviendra un enregistrement fidèle ensuite. **Sortir cette fiche de la boucle
  « re-noter » et la CONSTRUIRE.**

## ⤓ Absorbe (tri du 2026-09-30)

Cette fiche reprend le périmètre de :

- [`20260823121712781`](20260823121712781_reconcile-systematique-merges-hors-flux.md) — Ship atomique dans la PR — filet reconcile + re-regen au conflit de merge  
  _Pourquoi_ : Même chantier que le ship sûr.

Critères repris : ship complet dans la PR (ADR-0049, **dans le POC**), régénération sans liste de
commandes à tenir (**dans le POC** : une seule commande), résolution de conflit par « merger `main`
puis régénérer » (**recette écrite**, helper en Suite), `reconcile` qui propose sans basculer
(**déjà livré**, ADR-0018). Reste en Suite : le merge partiel (SR2).
