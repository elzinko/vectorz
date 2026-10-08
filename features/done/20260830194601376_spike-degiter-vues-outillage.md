---
id: "20260830194601376"
title: "Décider quelles vues générées ne plus committer (fin des conflits)"
type: chore
priority: P1
product: mega-city
labels: [backlog]
version: v0.3.0
epic:
depends: []
status: shipped
pr: "#279"
created: 2026-08-30
---

## En clair

Quand deux sessions régénèrent la même vue, git ne sait pas fusionner. Vécu : la PR #196 est
passée `CONFLICTING` sur `board.html`. On tranche par un ADR (0055). Seules les vues qu'on
**lit sur GitHub** restent dans git : `BACKLOG.md` et `PLAN.md`. Les autres sortent de git :
`PORTFOLIO.md` et les données du board, du pilotage et des runs. Elles se construisent à la
demande, avec `pnpm --dir products/mega-city views:regen` ou en lançant `pnpm ezk:map`.

## Symptôme (rétro 2026-08-30, revécu pendant le run V0.1 → V0.4)

Session concurrente → conflit sur une vue générée pendant un sprint. Récurrent en mémoire projet :
« sessions parallèles = PR re-conflictée sur les vues générées ». Pendant le run, chaque PR qui
régénérait `board.html`, `pilotage.html`, `PORTFOLIO.md` ou `BACKLOG.md` entrait en conflit avec
sa voisine.

## Décision (groom du 2026-10-01)

| Vue | Lue où | Verdict |
|---|---|---|
| `features/BACKLOG.md` (index généré) | GitHub | reste committée |
| `features/PLAN.md` (curé à la main) | GitHub | reste committée |
| bloc `composes` de `skills/README.md` | GitHub (bloc dans un README écrit à la main) | reste committée |
| `PORTFOLIO.md` | en local | **dégitée** |
| données de `board.html`, `pilotage.html`, `runs.html` | `ezk:map` | **dégitées** |
| données de `carte-interactive.html` (catalogue) | `ezk:map` + lien du README | reste committée dans ce lot (voir Suite) |

**Schéma « coque + données ».** Une page HTML est écrite à moitié à la main (la coque : mise en
page et script de rendu) et générée à moitié (le bloc de données). Dégiter la page entière ferait
perdre la coque. On sort donc le bloc de données dans un fichier voisin (`board.data.js`,
`pilotage.data.js`, `runs.data.js`), ignoré par git. La coque le charge par `<script src>`. Elle
reste committée : ses liens ne cassent pas, et elle ne change que si l'interface change.

**Qui construit.** `ezk:map` calcule ces données à chaque requête, donc elles ne sont jamais
périmées. `views:regen` les écrit sur disque (lecture hors serveur) et régénère `PORTFOLIO.md`.

## Critères d'acceptation

- [x] ADR-0055 court : frontière GitHub / outillage, schéma coque + données, coût accepté.
      Preuve : `products/mega-city/docs/adr/0055-artefacts-generes-hors-versionnage.md`.
- [x] `PORTFOLIO.md` et les trois fichiers `*.data.js` sont dans `.gitignore` et absents de
      `git ls-files` ; un test le garantit. Preuve : `untracked-views.test.ts`, bloc « frontière ».
- [x] Les trois pages HTML restent committées, sans aucune donnée en ligne : elles chargent leur
      fichier de données par `<script src>` ; un test le garantit. Preuve : même fichier de test.
- [x] `views:regen` reconstruit les quatre vues ; un second passage laisse tout identique (les
      trois fichiers de données ne sont même pas réécrits). Preuve : test `writeDataViews` et
      commande lancée à la main.
- [x] `ezk:map` sert ces données calculées à la requête, sans étape manuelle. Preuve : serveur réel,
      fichiers de données supprimés du disque, `GET` renvoie 200 et les données ; la page se rend
      (36 fiches actives, 6 couloirs de plan).
- [x] Les tests qui comparaient une vue committée au disque deviennent des tests de fidélité sur la
      construction (le board contient les fiches actives du loader et aucune livrée ou terminale).
      De plus, les cinq anciens blocs en ligne sont identiques, octet pour octet, aux nouveaux
      fichiers de données : l'interface ne change pas.
- [x] `check-planning-views` ne plante pas quand `PORTFOLIO.md` est absent (vue construite à la
      demande) ; il garde son contrôle quand le fichier existe. Preuve : exécuté sans le fichier,
      sortie 0.
- [x] Gate locale verte (typecheck, test 946/946, test:scripts 28 suites, lint, check-links 0
      cassé).

## Comment vérifier

```bash
git ls-files PORTFOLIO.md 'diagrams/*/*.data.js'        # vide
git check-ignore -v PORTFOLIO.md diagrams/avancement/board.data.js
pnpm --dir products/mega-city views:regen && git status --short   # rien de suivi ne bouge
pnpm --dir products/mega-city exec vitest run src/__tests__/untracked-views.test.ts
EZK_MAP_NO_OPEN=1 pnpm ezk:map   # puis GET /diagrams/avancement/board.data.js → les données
```

## Suite (hors de ce lot)

- Mesurer le critère d'origine, « 0 conflit sur une vue générée entre 2 sessions parallèles par
  mois », en novembre 2026. Il ne se prouve pas dans une PR.
- `carte-interactive.html` : même schéma si un conflit réel y apparaît (elle ne bouge que quand le
  catalogue bouge).
  **Fait le 2026-10-01 (PR #297)** : le conflit est venu (#286, #288, #293…). Les données de la carte
  sortent de git comme celles du board : coque committée, `carte-interactive.data.js` ignoré,
  `ezk:map` le calcule à chaque requête, `views:regen` l'écrit. Voir ADR-0055 (note du 2026-10-01).
- `views:check` et le ship qui régénère les vues restées committées : fiche `20260830194601233`.

## Notes

- Rétro 2026-08-30 (lentille archi). Se combine avec [`20260830194601233`](20260830194601233_ship-transactionnel-liens-vues.md)
  (F1) : pour les vues qui **restent** committées, la régénération déterministe suffit à éviter
  les conflits sémantiques ; le spike ne concerne que les vues **outillage**.
- Précédent : `.ezk/graph.compiled.json` est déjà dégité et reconstruit par `pnpm test`.
- Effet de bord à connaître : une PR en vol qui a régénéré ces vues aura un conflit une seule fois,
  au premier merge de `main`. On prend la version de `main` pour la coque et on supprime la donnée.
