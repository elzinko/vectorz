---
id: "20261031160441267"
title: "Le détail d'une fiche calculé par la méthode (`ezk backlog show <id> --json`)"
type: feature
priority: P2
product: mega-city
milestone: board
version:
labels: [board, contrat, json]
status: idea
pr:
evidence: none # contrat en ligne de commande, sans écran ; preuve = tests de contrat
created: 2026-10-31
---

## En clair

Quand on clique une fiche dans mission control, une fenêtre montre son « en clair », son contexte, ses
critères et la façon de la vérifier. Aujourd'hui, seul cop1 sait découper une fiche en ces sections.
La méthode, elle, sert la fiche brute. Cette fiche déplace ce découpage dans la méthode, et le publie
par `ezk backlog show <id> --json`.

## Contexte / Problème

Le découpage vit dans `products/cop1/packages/app/src/features/board/ficheDetail.ts`. Le board de la
méthode sert la fiche telle quelle, en texte (`products/mega-city/bin/ezk-map.ts:310`). C'est la seule
règle de lecture qui n'existe que chez cop1 : il faut la **déplacer**, pas seulement l'exposer.

Décision : [ADR-086](../docs/adr/ADR-086-la-methode-seul-lecteur-des-fiches-contrat-json.md).
Enquête : [les deux boards](../docs/captures/2026-10-30-enquete-boards/README.md), constat 1.

## Valeur

Mission control peut supprimer sa copie. Tout autre consommateur obtient le détail d'une fiche sans
réécrire un découpeur de markdown.

## Proposition

À préciser au grooming. Piste : un cœur pur dans mega-city qui découpe une fiche en sections, repris
de `ficheDetail.ts` et de ses tests ; une commande `ezk backlog show <id> --json`, au même format
versionné que [le contrat JSON de la méthode](done/20261029112813308_contrat-json-methode-board-show.md).

## Critères d'acceptation

- [ ] `ezk backlog show <id> --json` sort les sections d'une fiche : en clair, contexte, critères
      avec leur état coché, comment vérifier.
- [ ] Les cas déjà testés chez cop1 (`ficheDetail.test.ts`) passent côté méthode.
- [ ] La sortie porte `schema_version` et respecte un schéma rangé dans le dépôt.

## Comment vérifier

```bash
ezk backlog show 20261029112813308 --json
```

## Notes

- Fiche sœur du milestone `board`, découpée le 2026-10-31 (ADR-086, section « Le découpage »).
- Débloque [mission control lit le board de la méthode par `ezk`](20261031160441412_mission-control-consomme-ezk.md).
