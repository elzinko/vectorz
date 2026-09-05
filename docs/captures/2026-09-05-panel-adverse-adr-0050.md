# Panel adverse — ADR-0050 (product-build : 3 vitesses, `auto` ne bloque jamais)

- **Date :** 2026-09-05
- **Objet jugé :** [ADR-0050](../../products/mega-city/docs/adr/0050-product-build-trois-vitesses-auto-ne-bloque-pas.md) (statut Proposé) + fiche [20260905184644566](../../features/20260905184644566_product-build-trois-vitesses-auto-ne-bloque-pas.md)
- **Sièges :** ezk-architect · ezk-reviewer (sûreté) · ezk-pm (PO) · ezk-qa · **juge de cohérence** ezk-steward
- **Verdict final : NO-GO convertible.** L'idée porteuse tient ; l'ADR doit être **réécrit sur 5 points** avant ratification, pas amendé en marge.

## En clair

Distinguer « exécuter une action dangereuse » (interdit) de « attendre une permission que
personne ne donnera » (inutile) est **juste**. Mais l'ADR généralise ce principe à des arrêts
qui ne sont **pas** des actions à reporter — le budget, la contradiction, le secret manquant —
et il mise toute la sûreté sur une **trace** best-effort. Trois trous touchent la sûreté qu'il
prétend préserver. À réécrire avant de graver.

## Verdicts de siège

| Siège | Verdict | Coup le plus dur |
|---|---|---|
| Architecture | GO-avec-amendements | Statut du *merge* contradictoire ; révise un invariant **partagé avec cop1** depuis la seule vue de jour ; le reframe ne couvre que 1 des 4 arrêts |
| Reviewer sûreté | **NO-GO** | « secret manquant » = entrée absente, pas à reporter ; geste (b) sans traitement d'échec = travail perdu + journal qui ment ; trace best-effort = filet en papier |
| Product-owner | GO-avec-amendements | Planning « non bloquant » rend au robot la sélection du lot (Goodhart d'ADR-0028 rouvert) ; « contrôle au rapport » = inventaire post-mortem |
| QA / BA | GO-avec-amendements | Négatifs (« ne bloque jamais ») non prouvables sans harnais ni signal positif de continuation |

Le NO-GO est **de fond, pas de sévérité** : les 3 GO-amend discutent la forme (God-flag,
frontière git, citation ADR-035) ; la Sûreté montre que **le mécanisme de sûreté lui-même a
des trous** que l'ADR ne voit pas.

## Amendements consolidés (juge)

### P0 — bloquants pour la ratification
1. **Secret / entrée manquante → geste (c) skip**, jamais (b) report (sinon on mocke la clé pour verdir → build sur du faux).
2. **Traitement d'échec du geste (b)** : push rejeté / remote absent / branche divergente → bascule en (c) + journal explicite, **jamais** « poussée » faussement.
3. **Traiter l'arrêt #2 (budget)** dans le tableau des gestes — aujourd'hui absent (silence entre « on ne bloque jamais » et « augmenter = décision humaine »).
4. **Portée de la révision d'ADR-0011 §3** : dire noir sur blanc jour seul (`ezk-product-build`) **ou** aussi cop1/nuit — l'invariant est explicitement runtime-agnostic.
5. **Tampon `ready` avec un second regard réellement distinct** de l'agent qui a validé le plan d'entrée — sinon l'invariant 2 d'ADR-0028 (« auto-tampon jamais solo ») est vidé de sens.
6. **Distinguer dans §C** « merge différé par stratégie de livraison » (ADR-037, hors sujet) de « merge reporté parce que dangereux » (geste b) ; et dire que `auto`+`per-feature` **empile des PR en attente de merge humain**, ce n'est pas « livré ».
7. **Frontière git (ADR-0001)** : le push/PR du geste (b) est exécuté par `ezk-sprint`/`ezk-pr`, **pas** l'orchestrateur.
8. **Renforcer la trace AVANT** de la déclarer seul filet : écriture garantie (plus best-effort) sur run long + signal positif de continuation testable.

### P1
- `--mode` God-flag : assumer que la combinaison prudente d'ADR-0028 (machine groome / **humain** tamponne) devient l'exception (`manuel`), pas la noyer dans « le tampon découle du mode ».
- `yolo` : `--max-sprints` **obligatoire** + confirmation explicite au lancement.
- Retirer/reformuler la citation d'ADR-035 (elle tranche une autorité d'écriture, pas « ne pas bloquer »).
- Pack `REVIEW.md` : motif structuré par report/skip (artefact branche/PR + raison + geste de rollback).

### P2
- Skip non motivé = bloquant pour l'archivage de session.
- Garder le lien vers la fiche fenêtre-de-contexte ([20260830094601309](../../features/20260830094601309_product-build-auto-fenetre-contexte.md)).

## Décisions réservées à Thomas (le panel ne tranche pas)

- Ratifier ou non la révision d'ADR-0011 §3, et sa **portée** (jour seul, ou jour+nuit/cop1).
- Les **défauts CLI** — surtout si `--check-ready false` reste le défaut vu le trou P0 sur le tampon `ready`.
- L'**existence même du cran `yolo`** (appétit au risque).
- La **tolérance au Goodhart résiduel** une fois les P0 faits (`ezk-pm` reste décideur de « ça vaut le coup » en `auto`/`yolo`).
- Le **calendrier** : amender ADR-0011/0028 par bannière datée **après** la nouvelle version d'ADR-0050, jamais avant.
