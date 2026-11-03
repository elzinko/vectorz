> 🗎 Rendu de la fiche [features/20261102100506119_resolve-blocage-corps-invalide-404.md](../done/20261102100506119_resolve-blocage-corps-invalide-404.md)

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

Le gestionnaire lit le corps à part, avant de chercher le blocage.

- Corps absent, JSON cassé, ou JSON qui n'est pas un objet : 400 `invalid JSON body`, en anglais
  comme les autres erreurs du daemon.
- Champ `response` manquant : 400, comme aujourd'hui.
- Blocage inconnu : 404, comme aujourd'hui.
- Toute autre erreur pendant la résolution : 500, avec son message. Elle ne se déguise plus en 404.

## Critères d'acceptation

- [ ] Un corps absent ou mal formé reçoit 400, avec le message `invalid JSON body`.
- [ ] Un corps JSON qui n'est pas un objet (`null`, `[]`, `"x"`) reçoit 400 aussi.
- [ ] Un blocage inconnu, avec un corps valide, reçoit toujours 404.
- [ ] Une autre erreur pendant la résolution reçoit 500, jamais 404.

## Comment vérifier

1. Les tests du gestionnaire passent :
   `pnpm --dir products/cop1 exec vitest run packages/app/src/features/blocage-api`.
2. Mission control lancé, les deux appels de la reproduction répondent 400, avec l'en-tête
   `-H 'Content-Type: application/json'`. Sans cet en-tête, le garde-fou contre les écritures d'un
   autre site répond 415 avant d'atteindre la route. Le même appel avec `{"response":"ok"}` sur un
   identifiant inconnu répond 404.

## Notes / décisions

- Trouvé par ezk-scout, rapport `/private/tmp/claude-501/-Users-elzinko-git-bacasable-vectorz/50a740fe-2443-4e7f-bcb3-17d581e154ae/scratchpad/ezk-scout/cop1-2026-11-02/report.md` (brouillon B5), le 2026-11-02.
- Indice de localisation, non garanti :
  `products/cop1/packages/app/src/features/blocage-api/application/BlocageApiHandler.ts:53`.
- Voisine livrée : [câbler la boucle de blocage](../done/0021-cabler-boucle-blocage.md).
- **Groomée le 2026-11-03** (run autonome) : la cause est un seul `catch` pour la
  lecture du corps et la résolution (`BlocageApiHandler.ts`). Aucun écran ne change.


## Validation

| Modalité | Statut |
|---|---|
| Gate locale | ✅ 2313 tests |
| Tests mission control | ✅ 797 tests |
| Typecheck et lint | ✅ |
| Rejeu sur un vrai daemon | ✅ 400 400 puis 404 |
| Revue ezk-reviewer | ✅ GO |
| Before / after (UI) | N.A. — route d'API sans écran |
