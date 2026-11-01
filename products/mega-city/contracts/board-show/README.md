# Le contrat de `ezk board show --json`

## En clair

`ezk board show --json` sort tout ce que la méthode sait du plan d'un projet : ses fiches, leurs
comptes, ses versions, ses pouces de revue. Un autre programme l'affiche tel quel, sans relire les
fiches ni recalculer une règle. Ce dossier range la description de ce format et un exemple de sortie.

**Si tu arrives frais.** Une *fiche* est un fichier markdown du backlog. *Mission control* est le
tableau de bord du produit cop1. La décision qui fait de la méthode le seul lecteur des fiches est
l'[ADR-086](../../../../docs/adr/ADR-086-la-methode-seul-lecteur-des-fiches-contrat-json.md).

## Ce qu'il y a ici

- `v1/schema.json` : le schéma JSON du format, version 1.
- `v1/example.json` : la sortie de la commande sur un faux projet de huit fiches. Il contient une
  fiche en cours, une bloquée, une fiche dont le titre porte « : », une remplacée, une version mal
  écrite, une livrée, une parkée et une fiche sans version.

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
3. **Un consommateur ignore les champs qu'il ne connaît pas.** Le format peut en gagner. Le schéma
   publié accepte donc un champ en plus : le valider ne casse pas à un ajout.
4. **Les comptes sont déjà interprétés.** `comptes` applique les règles de la méthode : une fiche
   avec une branche ouverte est « en cours », une idée de la milestone `parked` est « parkée ».
   Les colonnes de `idees` à `autres` se partagent les fiches : leur somme vaut `total`. `bloquees`
   et `sansVersion` sont des drapeaux qui les recoupent ; ils ne comptent que les fiches à faire.
   Le champ `counts`, hérité, compte les statuts écrits, bruts : pour afficher, lis `comptes`.
5. **Un consommateur teste sur l'exemple.** Ses tests lisent `v1/example.json`, jamais un vrai
   `ezk` : ils restent rapides et ne dépendent pas du poste.

## Où vit le format

Le format se décrit une seule fois, en zod, dans `src/core/board-contract.ts`. Le schéma JSON en
est tiré. Pour changer le format : modifie ce fichier, régénère, et suis la règle 1.
