# Migration 003 — retrait du statut `todo` (layout v2 → v3)

**Cible :** `layout_version: 3`
**Helper :** [`scripts/apply-003-statuts-colonnes.sh`](../scripts/apply-003-statuts-colonnes.sh)
**Décision :** panel adverse du 2026-09-04 (`docs/captures/2026-09-04-panel-adverse-objet-sprint.md`).

## En clair

Le statut `todo` disparaît. Il était ambigu : il servait à la fois pour « pas encore prête »
et pour « prête à tirer ». On le remplace par deux états clairs. Une fiche est soit une **idée**
pas encore prête, soit **prête** (`ready`). Plus rien au milieu.

## Ce que la migration fait

Elle ne touche **que** les fiches `status: todo`. Elle les scinde selon le champ `ready:` :

| Avant | Champ `ready:` | Après |
|---|---|---|
| `todo` | daté (non vide) | `ready` (groomée, DoR passée, tirable) |
| `todo` | vide / absent | `idea` (pas encore prête, à groomer) |

`idea`, `in-progress`, `blocked`, `shipped` sont **laissés intacts**. Les `REVIEW.md`
(`features/reviews/`) sont hors périmètre — ce ne sont pas des fiches de backlog.

Le champ `ready:` (la date) **est conservé** : il reste la trace du passage DoR. Ce qui change,
c'est que le tirage lit désormais `status: ready`, plus le couple `todo` + `ready:`.

## Appliquer

```bash
# DRY-RUN d'abord (n'écrit rien) :
bash skills/ezk-backlog/scripts/apply-003-statuts-colonnes.sh <racine-projet>
# puis, si le résumé est correct :
bash skills/ezk-backlog/scripts/apply-003-statuts-colonnes.sh <racine-projet> --apply
```

Ensuite : régénérer les vues (`regen-backlog.sh` + board d'avancement) et bumper
`layout_version: 3` dans `features/README.md`.

Filet : les fiches sont versionnées. `git diff` montre chaque changement, `git checkout` annule.

## Contrat de code associé

Cette migration de **données** va de pair avec le changement de **code** livré dans la même PR :
enum `STATUTS` (`src/core/avancement-data.ts`), tirage (`src/backlog/plan-head.ts`), vues
(`bin/regen-backlog.sh`, `bin/portfolio.sh`), template et défaut de création (`init.sh`,
`feature-template.md` : une fiche naît désormais `idea`). Appliquer l'un sans l'autre laisse le
backlog incohérent — d'où le passage par Skema, qui rattrape chaque projet à sa prochaine commande.
