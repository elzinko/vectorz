# Le contrat de `ezk config show --json`

## En clair

`ezk config show --json` sort la config d'un projet telle que la méthode la résout. Il dit quel
fichier il a lu, ou qu'il n'y en a pas. Il donne les réglages effectifs : GitHub, intégration,
gate de release, modèle de chaque agent. Un autre programme l'affiche tel quel, sans relire le YAML
ni rejouer les défauts. Ce dossier range la description de ce format et un exemple de sortie.

**Si tu arrives frais.** La config d'un projet vit dans `.vectorz/config.yml`. Elle est facultative :
sans elle, la méthode applique ses défauts. *Mission control* est le tableau de bord du produit
cop1. La décision qui fait de la méthode le seul lecteur de ces fichiers est
l'[ADR-086](../../../../docs/adr/ADR-086-la-methode-seul-lecteur-des-fiches-contrat-json.md).

## Ce qu'il y a ici

- `v1/schema.json` : le schéma JSON du format, version 1.
- `v1/example.json` : la sortie de la commande sur un faux projet. Sa config règle GitHub à la
  carte, l'intégration `push-ff`, la gate coupée, un tier de projet et un modèle d'agent. Elle
  contient aussi un tier mal saisi, qui sort en erreur sur son agent.

Les deux fichiers sont **générés**. Ne les modifie pas à la main :

```bash
pnpm --dir products/mega-city board:contract --write
```

Sans `--write`, la commande vérifie qu'ils sont à jour. Le test de contrat
(`src/__tests__/board-contract.test.ts`) échoue s'ils ne le sont plus.

## Les règles du format

1. **Le numéro de version.** `schema_version` vaut `1`. Il monte quand un champ disparaît, change
   de nom ou change de sens. Un champ ajouté ne le change pas.
2. **Un consommateur lit `schema_version` d'abord.** Une autre valeur que celle qu'il connaît : il
   le dit à l'écran et n'affiche rien de faux.
3. **Un consommateur ignore les champs qu'il ne connaît pas.** Le schéma publié accepte donc un
   champ en plus.
4. **`file` vaut `null` quand le projet n'a pas de config.** Les autres champs portent alors les
   défauts de la méthode. Ce n'est pas une erreur : un consommateur affiche « réglages par défaut ».
5. **Un agent mal configuré sort avec `error`.** Il n'a alors ni `tier` ni `model`. Les autres
   agents restent lisibles.
6. **Un YAML malformé fait échouer la commande.** Elle sort en code 1 et nomme le fichier sur la
   sortie d'erreur. Elle ne sort jamais les défauts à la place.

## Où vit le format

Le format se décrit une seule fois, en zod, dans `src/core/config-contract.ts`. Le schéma JSON en
est tiré. Pour changer le format : modifie ce fichier, régénère, et suis la règle 1.
