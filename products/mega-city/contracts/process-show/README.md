# Le contrat de `ezk process show --json`

## En clair

`ezk process show --json` sort les étapes fines de chaque skill de la méthode, dans l'ordre. Pour
chaque étape, il dit qui la réalise et quel réglage du projet la gouverne, avec sa valeur. Il donne
aussi les liens entre skills. Mission control dessine le schéma Process avec, sans recopier de liste.

**Si tu arrives frais.** Les étapes sont déclarées dans `method/etapes.yml`. Le compilateur de la
méthode refuse une référence inventée, une étape qu'on ne retrouve plus dans son skill, ou un réglage
que `ezk config show` ne connaît pas. La décision qui fait de la méthode le seul lecteur de ses
fichiers est l'[ADR-086](../../../../docs/adr/ADR-086-la-methode-seul-lecteur-des-fiches-contrat-json.md).

## Ce qu'il y a ici

- `v1/schema.json` : le schéma JSON du format, version 1.
- `v1/example.json` : la sortie de la commande sur un faux projet. Les étapes sont les vraies ; la
  config du faux projet ouvre les PR et intègre en `push-ff`.

Les deux fichiers sont **générés**. Ne les modifie pas à la main :

```bash
pnpm --dir products/mega-city board:contract --write
```

Une étape ajoutée à `method/etapes.yml` change l'exemple : régénère-le. Le test
`src/__tests__/process-show.test.ts` échoue s'il n'est plus à jour.
