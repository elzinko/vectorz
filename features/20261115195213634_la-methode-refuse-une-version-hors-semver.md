---
# id : horodatage AAAAMMDDHHMMSSmmm QUOTÉ (17 chiffres > MAX_SAFE_INTEGER) posé par `add` (scripts/mint-id.sh) — nom <id>_<slug>.md
id: "20261115195213634"
title: Les versions « V1.0 » de samplerz apparaissent dans mission control
type: bug
priority: P2
product: cop1
milestone:
version:
labels: [scout, mission-control]
status: idea
pr:
evidence: before-after
created: 2026-11-15
---

# 20261115195213634 — Les versions « V1.0 » de samplerz apparaissent dans mission control

**En clair.** Les fiches de samplerz portent des versions écrites « V1.0 » ou « V1.1 ». La méthode,
elle, attend « v1.0.0 ». Résultat : mission control ne montre pas ces versions, et 20 fiches de
samplerz sortent de la vue par version. Il faut choisir : accepter les deux écritures, ou convertir
les fiches de samplerz.

**Si tu arrives frais.** samplerz est un projet piloté par la méthode, dans un dépôt à part.
Mission control est l'écran de pilotage (produit cop1). Le champ `version:` d'une fiche dit dans
quelle version elle doit sortir.

## Contexte / Problème

La passe du scout du 2026-11-04 a relevé ce symptôme. Elle n'a pas fiché le bug.

Constat du 2026-11-15 dans `/Users/elzinko/git/samplerz/features` : 14 fiches en `V1.0`, 6 en
`V1.1`, 1 en `V0.9`.

La méthode fixe un format strict depuis le 2026-10-08 : `vX.Y.Z`, en minuscule, à trois nombres. La
règle vit dans `products/mega-city/src/backlog/versions.ts`, ligne 18. L'écran de cop1 est plus
tolérant (`products/cop1/packages/web/src/board/helpers.ts`, ligne 22). La perte vient donc
probablement des données que la méthode publie. Ce point est à confirmer au grooming.

## Proposition

Deux voies, à trancher par le PO :

1. **Lecture tolérante.** La méthode lit `V1.0` comme `v1.0.0`. Les fiches de samplerz ne bougent pas.
2. **Conversion.** Une commande réécrit les fiches de samplerz au format strict. La règle ne change pas.

Dans les deux cas, une version mal écrite doit se voir. Elle ne doit plus disparaître en silence.

## Critères d'acceptation

- [ ] Les 21 fiches versionnées de samplerz apparaissent sous leur version dans mission control.
- [ ] Une version au format inconnu est signalée à l'écran, au lieu d'être ignorée.
- [ ] La voie choisie est notée dans cette fiche, avec la décision du PO.

## Comment vérifier

À préciser au grooming. Piste : lancer la vue par version de la méthode sur samplerz, avant et
après.

```bash
ezk backlog version --root /Users/elzinko/git/samplerz
```

## Notes / décisions

- Source : session du 2026-11-04, `docs/sessions/2026-11-04-run-autonome-sprints-7-26.md`, ligne 33.
- Priorité P2 donnée par le PO le 2026-11-15.
- Décision liée : format semver strict du 2026-10-08, rappelé dans `versions.ts`.
