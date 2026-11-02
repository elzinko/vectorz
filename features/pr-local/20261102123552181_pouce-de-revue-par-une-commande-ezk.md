> 🗎 Rendu de la fiche [features/20261102123552181_pouce-de-revue-par-une-commande-ezk.md](../done/20261102123552181_pouce-de-revue-par-une-commande-ezk.md)

## En clair

Le pouce de revue (👍 ou 👎 sur une fiche) ne se pose aujourd'hui que dans la page web de la méthode.
Cette page doit disparaître : mission control devient le seul écran. Cette fiche ajoute la commande
`ezk review verdict`, qui pose le pouce depuis un terminal ou par un agent. Une fiche sœur branchera
ensuite le bouton de mission control sur cette commande.

## Contexte / Problème

- L'[amendement du 2026-11-02 de l'ADR-086](../../docs/adr/ADR-086-la-methode-seul-lecteur-des-fiches-contrat-json.md)
  fait de mission control le seul écran. La page web de la méthode (`ezk board open`) sera retirée.
- Le pouce est la seule chose que cette page écrit
  ([ADR-0057](../../products/mega-city/docs/adr/0057-le-tableau-de-bord-ecrit-un-seul-dossier.md)) : une
  requête `POST /api/verdict` écrit `features/reviews/verdicts/<id>.json`, avec la valeur `up` ou
  `down`. Aucune commande `ezk` ne sait le faire.
- La règle de l'ADR-086 tient : seules les commandes `ezk` écrivent dans un projet. Mission control ne
  peut donc pas écrire ce fichier lui-même : il lui faut cette commande.
- Le 2026-11-02, aucun pouce n'a encore été posé dans vectorz : le dossier `verdicts/` n'existe pas.

## Valeur

- Le pouce survit au retrait de la page de la méthode.
- Il se pose aussi depuis un terminal ou par un agent, sans écran.

Coût de ne rien faire, mesuré le 2026-11-02 :

- **Usage réel : nul.** Le pouce existe depuis le 2026-08-26. Aucun pouce n'a été posé depuis : le
  dossier `features/reviews/verdicts/` n'existe pas.
- **Lecteurs : aucun.** Aucun skill, aucun agent, aucune rétro ne lit les pouces. Seuls la page web
  de la méthode et `ezk board show --json` les relaient.
- **Le besoin est en partie couvert.** La revue passe par l'agent de revue, qui dit GO ou NO-GO et
  écrit son compte rendu dans `features/reviews/`. L'accord du PO est demandé avant chaque fusion.
- **Le coût de l'abandon** : perdre une fonction jamais utilisée. **Le coût du portage** : une
  commande, un contrat, un bouton et leurs tests.

**Décision du PO du 2026-11-02 : on garde le pouce**, malgré son usage nul. Il est porté dans
mission control.

## Proposition

**Une commande pose le pouce.** `ezk review verdict <id> up|down` écrit le même fichier que la page
web, avec les mêmes contrôles : fiche connue, valeur permise, un seul dossier écrit, jamais de commit.
Elle réutilise le cœur existant (`src/core/verdicts.ts`, `src/io/verdicts.ts`). Elle dit en clair ce
qu'elle a écrit, et sort en erreur sur un refus.

## Décisions de conception

Avis d'architecte du 2026-11-02, gardé par le PO.

- **Le nom : `ezk review verdict <id> up|down`.** `review` porte déjà `ezk review emit`, le compte
  rendu de revue d'une fiche. Le pouce est un jugement de revue : il va à côté.
- **Écartés** : `ezk board verdict`, car le board affiche et n'écrit pas ; `ezk backlog verdict`, car
  le backlog écrit les fiches, et le pouce n'y touche jamais (ADR-0057).
- **La lecture ne change pas** : `ezk board show --json` porte déjà les pouces.

## Critères d'acceptation

- [x] **La commande écrit le pouce.** `ezk review verdict <id> up` écrit
      `features/reviews/verdicts/<id>.json`, octet pour octet comme la page web le fait aujourd'hui.
- [x] **Refus sans écriture.** Une fiche inconnue ou une valeur autre que `up`, `down` ou `none` est
      refusée, avec un code d'erreur et aucun fichier écrit.
- [x] **Rien d'autre n'est écrit.** La commande ne touche ni le front-matter de la fiche ni un autre
      dossier, et ne fait aucun commit.

## Comment vérifier

```bash
ezk review verdict <id> up
cat features/reviews/verdicts/<id>.json
ezk board show --json | jq '.verdicts'
git status --short
```

Signal observable : le fichier du pouce existe, `ezk board show --json` le montre, et `git status` ne
montre que ce fichier.

## Suite

- **Le bouton de mission control** : la route du daemon, ses gardes et l'affichage du pouce. C'est la
  fiche sœur [mission control pose le pouce de revue](../done/20261102151630248_mission-control-pose-le-pouce-de-revue.md),
  coupée d'ici au grooming du 2026-11-02 : la fiche touchait trois surfaces, et la commande seule
  sert déjà dans un terminal.

## Notes

- Une des fiches du chantier « un seul écran », liées par `milestone: board` et le label
  `un-seul-ecran`, sans fiche chapeau. Le retrait vient en dernier :
  [retirer la page web de la méthode](../20261102123552185_retirer-la-page-web-de-la-methode.md).
- Aucun pouce posé à ce jour. Le PO a tranché le 2026-11-02, au grooming : on garde le pouce (voir
  « Valeur »). Ne pas rouvrir la question sans nouveau fait.
- Le nom de la commande est à confirmer au build, avec la fiche
  [un seul vocabulaire pour les boards](../20261031160441559_un-seul-vocabulaire-boards.md).
- Priorité P2, fixée par le PO le 2026-11-02 pour tout le chantier.
- Décision du build (2026-11-02, run autonome) : la commande accepte aussi `none`, qui retire le pouce.
  La page web le permettait ; sans `none`, son retrait aurait perdu ce geste.


## Validation

| Modalité | Statut |
|---|---|
| Gate de la méthode : typecheck + tests + 47 suites de scripts | ✅ |
| Commande au manifeste ezk | ✅ review verdict déclarée |
| Octets identiques à la route web | ✅ test jumeau |
| Revue adverse ezk-reviewer | ✅ GO (2 remarques non bloquantes écartées) |
| Before / after (UI) | N.A. — commande de terminal sans écran |
