> 🗎 Rendu de la fiche [features/20261102151630248_mission-control-pose-le-pouce-de-revue.md](../done/20261102151630248_mission-control-pose-le-pouce-de-revue.md)

## En clair

La méthode aura une commande pour poser le pouce de revue (👍 ou 👎 sur une fiche). Cette fiche le
montre dans la fenêtre d'une fiche de mission control, avec deux boutons pour le poser. Mission
control n'écrit rien lui-même : son daemon lance la commande de la méthode, après avoir vérifié que la
demande vient bien de sa propre page.

## Contexte / Problème

- L'[amendement du 2026-11-02 de l'ADR-086](../../docs/adr/ADR-086-la-methode-seul-lecteur-des-fiches-contrat-json.md)
  fait de mission control le seul écran. Le pouce, posé aujourd'hui dans la page web de la méthode,
  doit pouvoir se poser dans mission control avant le retrait de cette page.
- La fiche sœur [le pouce de revue se pose par une commande ezk](../done/20261102123552181_pouce-de-revue-par-une-commande-ezk.md)
  fournit la commande `ezk review verdict <id> up|down`. Seules les commandes `ezk` écrivent dans un
  projet (ADR-086, décision 1.4).
- `ezk board show --json` publie déjà les pouces : mission control n'a qu'à les afficher.
- Ce serait la première écriture de mission control dans un projet. L'ADR-0057 exigeait des gardes
  pour la route du pouce : méthode, Host, Origin, type, taille, id et valeur.

## Valeur

- Le pouce survit au retrait de la page de la méthode, dans le seul écran du PO.
- La décision du PO du 2026-11-02 de garder le pouce prend effet là où il regarde.

## Proposition

1. **La fenêtre d'une fiche montre son pouce**, lu dans `ezk board show --json`.
2. **Deux boutons le posent.** Le daemon lance la commande de la méthode et rend son résultat ; la
   fenêtre montre le nouveau pouce.

## Décisions de conception

Avis d'architecte du 2026-11-02, gardé par le PO.

- **La route** : `POST /api/verdict`, avec un corps `{ projet, id, pouce }`.
- **Le projet vient du registre.** Le daemon trouve le dossier du projet dans son registre, par son
  nom. Il ne prend jamais un chemin dans la requête.
- **La commande, sans shell.** Il lance `ezk --root <dossier> review verdict <id> <pouce>` avec une
  liste d'arguments.
- **Les gardes de l'ADR-0057.** Il refuse avant de lancer quoi que ce soit : une autre méthode que
  POST, un Host ou une Origin d'un autre site, un type autre que JSON, un corps trop gros, un projet
  inconnu, un id mal formé, une valeur autre que `up` ou `down`. La commande revérifie ensuite que la
  fiche existe : la méthode garde le dernier mot.
- **La page suit.** Après une écriture réussie, le daemon relit le plan tout de suite, et la page
  voit le nouveau pouce.
- **Écartés** : mission control écrit le fichier lui-même, ce qu'interdit l'ADR-086 ; une route qui
  lance n'importe quelle commande `ezk`, qui ouvrirait l'exécution de commandes arbitraires.

## Critères d'acceptation

- [x] **Mission control montre le pouce.** La fenêtre d'une fiche montre le pouce que publie
      `ezk board show --json` ; une fiche sans pouce n'affiche rien de plus.
- [x] **Mission control pose le pouce par la commande.** Un clic lance `ezk review verdict` ; le daemon
      n'écrit jamais le fichier lui-même. La fenêtre montre le nouveau pouce à la relecture suivante.
- [x] **Une autre origine est refusée.** Une requête venue d'un autre site, ou d'un autre type que
      JSON, est refusée sans lancer la commande.
- [x] **Avant / après.** Capture de la fenêtre d'une fiche avant (sans pouce) et après (pouce posé).

## Comment vérifier

```bash
pnpm cop1:dev
curl -s -X POST -H 'Origin: https://exemple.test' -H 'Content-Type: application/json' \
  -d '{"projet":"vectorz","id":"<id>","pouce":"up"}' http://127.0.0.1:4343/api/verdict
```

Dans mission control, ouvrir une fiche et cliquer 👍 : le fichier `features/reviews/verdicts/<id>.json`
apparaît, et la fenêtre montre le pouce. Signal observable du `curl` : un refus, et aucun fichier
écrit.

## Notes

- Une des fiches du chantier « un seul écran », liées par `milestone: board` et le label
  `un-seul-ecran`, sans fiche chapeau. Coupée de la fiche de la commande au grooming du 2026-11-02.
  Le retrait vient en dernier :
  [retirer la page web de la méthode](../20261102123552185_retirer-la-page-web-de-la-methode.md).
- **Constat hors de cette fiche (2026-11-02).** Les quatre routes d'écriture actuelles du daemon ne
  vérifient ni l'origine ni le type de la requête : abandon d'un run, ancrage d'un projet, proposition
  de règle, levée d'un blocage. Une page d'un autre site, ouverte dans le navigateur, pourrait donc
  les appeler. Fiche dédiée, en P1 : [le daemon refuse les écritures venues d'un autre site](../done/20261102165708468_daemon-refuse-ecritures-autre-site.md). Cette route réutilisera sa garde.
- Priorité P2, fixée par le PO le 2026-11-02 pour tout le chantier.


## Validation

| Modalité | Statut |
|---|---|
| Tests mission control (753) | ✅ |
| Tests de la page web (124) + typecheck | ✅ |
| Lint des fichiers touchés | ✅ |
| Essai réel | ✅ un clic sur 👍 a écrit le pouce par ezk review verdict puis la fenêtre l'a montré |
| Revue adverse ezk-reviewer | ✅ GO (captures jointes ; 3 remarques non bloquantes écartées) |
| Before / after (UI) | [avant](../../docs/pr-evidence/20261102151630248/fenetre-fiche-before.png) · [après](../../docs/pr-evidence/20261102151630248/fenetre-fiche-after.png) |
