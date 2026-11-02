---
id: "20261102100506119"
title: "Résoudre un blocage avec un corps de requête invalide répond « introuvable »"
type: bug
priority: P3
product: cop1
milestone:
version:
labels: [scout, mission-control, api]
status: idea
pr:
evidence: none # route HTTP du daemon ; pas d'écran
created: 2026-11-02
---

# Résoudre un blocage avec un corps invalide répond « introuvable »

**En clair.** `POST /api/blocages/<id>/resolve` sans corps, ou avec un JSON cassé, répond 404. Le
client croit que le blocage n'existe pas, alors que c'est sa requête qui est mal formée. La bonne
réponse est 400, avec un message qui dit que le corps est invalide.

**Si tu arrives frais.** Un blocage est un point où un run attend une décision humaine. Mission control
peut le résoudre par cette route.

## Contexte / Problème

Gravité : **mineure**. Le message trompe la personne qui débogue un client.

Reproduction :

1. Lancer le daemon de mission control.
2. `curl -s -w ' [HTTP %{http_code}]\n' -X POST http://127.0.0.1:<port>/api/blocages/BLK-x/resolve`
   donne `Unexpected end of JSON input [HTTP 404]`.
3. `curl -s -w ' [HTTP %{http_code}]\n' -X POST -d '{pas du json' http://127.0.0.1:<port>/api/blocages/BLK-y/resolve`
   donne aussi 404.

Attendu : 400 « corps JSON invalide ». Obtenu : 404, avec le message brut du parseur.

## Proposition

Distinguer l'erreur de lecture du corps (400) du blocage inconnu (404).

## Critères d'acceptation

- [ ] Un corps absent ou mal formé reçoit 400, avec un message clair.
- [ ] Un blocage inconnu, avec un corps valide, reçoit toujours 404.

## Comment vérifier

Rejouer la reproduction ci-dessus, puis le même appel avec un corps valide sur un identifiant inconnu.

## Notes / décisions

- Trouvé par ezk-scout, rapport `/private/tmp/claude-501/-Users-elzinko-git-bacasable-vectorz/50a740fe-2443-4e7f-bcb3-17d581e154ae/scratchpad/ezk-scout/cop1-2026-11-02/report.md` (brouillon B5), le 2026-11-02.
- Indice de localisation, non garanti :
  `products/cop1/packages/app/src/features/blocage-api/application/BlocageApiHandler.ts:53`.
- Voisine livrée : [câbler la boucle de blocage](done/0021-cabler-boucle-blocage.md).
