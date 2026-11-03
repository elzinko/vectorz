---
id: "20261103161632129"
title: "Les messages affichés par le code de cop1 et de la méthode disent « mission control »"
type: chore
priority: P2
product: cop1
milestone: board
version:
labels: [board, vocabulaire]
status: ready
pr:
evidence: none # messages de terminal et de journal ; aucun écran ne change
created: 2026-11-03
split_from: "20261102234112839"
---

# 20261103161632129 — Les messages affichés par le code disent « mission control »

## En clair

Le code de cop1 et quelques commandes de la méthode affichent encore « Moniteur », « cockpit » ou
« dashboard », des noms retirés de l'écran de supervision. Cette fiche corrige les messages qu'un
humain lit. Les identifiants internes restent : les renommer casserait des contrats sans rien montrer
de plus.

**Si tu arrives frais.** Mission control est l'écran de cop1. Le glossaire
(`docs/glossaire-jargon-ezk.md`) liste les mots retirés et ceux qui les remplacent.

## Contexte / Problème

Née du découpage de
[Réécrire les guides de l'ancien écran de supervision](done/20261102234112839_reecrire-guides-ancien-ecran-supervision.md),
le 2026-11-03 : la fiche mère tenait trop pour un sprint. Les anciens mots apparaissent dans
`products/cop1/packages/*/src` et `products/mega-city/bin` (environ 15 occurrences, hors tests). Les
scripts qui accompagnent les guides vont avec les guides, dans la fiche sœur.

## Valeur

Un message de commande ou de journal nomme l'écran que l'utilisateur voit.

## Proposition

Triée au grooming du 2026-11-03 (run autonome). Neuf messages affichés disent un ancien mot ; on les
corrige. Les commentaires, les identifiants (`SprintDashboardService`, `mode moniteur`) et les données
d'exemple des tests restent : aucun humain ne les lit à l'écran.

| Message | Où | Lu par |
|---|---|---|
| « cop1 start + Moniteur » | `products/cop1/packages/app/src/cli/epoch2-method.ts:5` | terminal |
| « use mega-city + Moniteur » | `products/cop1/packages/app/src/cli/index.ts:72` | aide de la CLI |
| « Pages de l'ancien dashboard » | `products/cop1/packages/web/src/board/Board.tsx:379` | infobulle de mission control |
| « le cockpit et le daemon cop1 » | `products/mega-city/bin/supervision-registry-add.ts:76` | terminal |
| « la voir dans le Moniteur » | `products/mega-city/bin/supervision-link.ts:132` | terminal |
| « silence prolongé Moniteur » (deux) | `products/mega-city/src/supervision/analyze.ts:340,345` | rapport d'analyse |
| « timer … du Moniteur » | `products/mega-city/src/supervision/mcp-server.ts:144` | description d'outil, lue par l'agent |
| « abandonne ce run au Moniteur (bouton …) » | `products/mega-city/src/supervision/runtime.ts:266` | erreur montrée à l'agent |

Le dernier message renvoie vers un bouton qui n'existe plus : mission control n'a pas repris
« Abandonner ce run ». Le message dit donc ce qui existe : `run_finished` avec `status: "abandoned"`
depuis la session du run, ou la route du daemon `POST /api/supervision/runs/abandon`.

## Critères d'acceptation

- [ ] Aucun des neuf messages ne dit « Moniteur », « cockpit » ou « dashboard » ; chacun nomme ce que
      l'utilisateur voit vraiment.
- [ ] Le message d'un run bloquant ne renvoie plus vers un bouton absent : il donne `run_finished` et
      la route du daemon.
- [ ] Les tests qui lisent ces messages suivent, et la gate reste verte.

## Comment vérifier

```bash
grep -rniwE "moniteur|cockpit|dashboard" products/cop1/packages/*/src products/mega-city/bin
```

## Notes

- Fiche mère : [Réécrire les guides de l'ancien écran](done/20261102234112839_reecrire-guides-ancien-ecran-supervision.md).
- **Trou trouvé au grooming (2026-11-03)** : mission control n'a pas repris le bouton « Abandonner ce
  run » de l'ancien écran (ADR-035, décision 4). La route du daemon existe encore, mais aucun écran ne
  l'appelle. À trancher par le PO : reprendre ce geste dans mission control, ou l'assumer retiré.
- Prête le 2026-11-03 : porte « prête » passée en run autonome (ezk-pm GO). Conditions : vérifier dans le
  code que `run_finished` (status abandoned) et la route d'abandon existent avant de les citer ; prouver
  le critère (a) par un grep des trois mots sur les neuf messages.
