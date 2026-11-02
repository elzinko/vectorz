---
id: "20261102100505955"
title: "Changer le statut d'une proposition de règle répond « OK » sans rien faire"
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

# Changer le statut d'une proposition de règle répond « OK » sans rien faire

**En clair.** La route `PATCH /api/rules/proposals/<id>` du daemon répond 200, avec un corps vide,
pour n'importe quel identifiant. Aucune source de propositions n'est branchée, et aucune page n'appelle
cette route. Un client croit avoir réussi alors que rien n'a changé.

**Si tu arrives frais.** Le daemon de mission control expose une API HTTP locale. Cette route devait
permettre d'accepter ou de refuser une proposition de règle.

## Contexte / Problème

Gravité : **mineure**. Aucun écran n'utilise la route, mais elle ment à qui l'appelle.

Reproduction :

1. Lancer le daemon de mission control.
2. `curl -s -i -X PATCH -d '{"status":"approved"}' http://127.0.0.1:<port>/api/rules/proposals/inexistante`
   répond 200 avec un corps vide.
3. Même résultat avec `{"status":"rejected"}` sur un autre identifiant.

Attendu : 404 « proposition inconnue », 503 « non branché », ou la route retirée. Obtenu : 200 vide.

## Proposition

À trancher au groom : retirer la route tant qu'aucune source n'est branchée (pas de code mort), ou la
faire répondre honnêtement.

## Critères d'acceptation

- [ ] Un appel sur un identifiant inconnu ne répond plus 200.

## Comment vérifier

Rejouer la reproduction ci-dessus.

## Notes / décisions

- Trouvé par ezk-scout, rapport `/private/tmp/claude-501/-Users-elzinko-git-bacasable-vectorz/50a740fe-2443-4e7f-bcb3-17d581e154ae/scratchpad/ezk-scout/cop1-2026-11-02/report.md` (brouillon B4), le 2026-11-02.
- Indice de localisation, non garanti :
  `products/cop1/packages/app/src/features/daemon/infrastructure/HttpServer.ts:338`.
