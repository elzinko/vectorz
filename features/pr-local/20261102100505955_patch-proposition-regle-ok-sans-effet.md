> 🗎 Rendu de la fiche [features/20261102100505955_patch-proposition-regle-ok-sans-effet.md](../done/20261102100505955_patch-proposition-regle-ok-sans-effet.md)

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

Décision du groom : **retirer**. La loi `clean-code/no-dead-code` tranche. Aucune source ne branche
les propositions : `setRuleProposalProvider` n'est appelé que par les tests. Aucune page n'appelle les
routes. Le daemon répond donc 200 sur un magasin qui n'existe pas.

On retire :

- les routes `GET` et `PATCH /api/rules/proposals` du daemon ;
- l'interface `RuleProposalProvider` et son setter ;
- le service `RuleProposalService` de sprint-core, ses types et ses tests, qu'aucun code de production
  n'utilise.

Le jour où mission control montrera les propositions de rétro, il les lira par la méthode
(ADR-086), pas dans la mémoire du daemon.

## Critères d'acceptation

- [ ] `PATCH /api/rules/proposals/<id>` répond 404 `not_found`, quel que soit l'identifiant.
- [ ] `GET /api/rules/proposals` répond 404 aussi : la route n'existe plus.
- [ ] Plus aucun fichier de cop1 ne cite `RuleProposalService`, `RuleProposalProvider` ni la route,
      hors le test qui vérifie le 404.
- [ ] Le test du garde-fou contre les écritures d'un autre site vise une route qui existe encore.

## Comment vérifier

1. `grep -rnE 'RuleProposal(Service|Provider)|rules/proposals' products/cop1/packages --include='*.ts'`
   ne rend que le test du 404, hors `node_modules` et `dist`.
2. Les tests du daemon passent : `pnpm --dir products/cop1 exec vitest run packages/app/src/features/daemon`.
3. Mission control lancé, la reproduction de la fiche répond 404, avec l'en-tête
   `-H 'Content-Type: application/json'`. Sans lui, le garde-fou répond 415 avant la route.

## Notes / décisions

- Trouvé par ezk-scout, rapport `/private/tmp/claude-501/-Users-elzinko-git-bacasable-vectorz/50a740fe-2443-4e7f-bcb3-17d581e154ae/scratchpad/ezk-scout/cop1-2026-11-02/report.md` (brouillon B4), le 2026-11-02.
- Indice de localisation, non garanti :
  `products/cop1/packages/app/src/features/daemon/infrastructure/HttpServer.ts:338`.
- **Groomée le 2026-11-03** (run autonome) : retirer plutôt que répondre honnêtement.
  Une route qui répond 404 « non branché » resterait du code sans usage. Aucun écran ne change.
- **Vu au build le 2026-11-03** : le module `rule-application` de cop1 (`RuleApplicationService`) n'est
  appelé par aucun code de production non plus, seulement par son test. Il sort du périmètre de cette
  fiche : il est signalé à la rétro du sprint, pas retiré ici.


## Validation

| Modalité | Statut |
|---|---|
| Gate locale | ✅ 2313 tests |
| Tests mission control | ✅ 772 tests (les tests du service retiré en moins) |
| Typecheck et lint | ✅ |
| Rejeu sur un vrai daemon | ✅ 404 sur PATCH et GET |
| Revue ezk-reviewer | ✅ GO |
| Before / after (UI) | N.A. — route d'API sans écran |
