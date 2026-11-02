# Le contrat de `ezk board maps --json`

## En clair

`ezk board maps --json` liste les documents de la méthode : la carte de la méthode, le schéma du
domaine, les schémas de qualité, le benchmark. Mission control les montre dans sa vue « Cartes ». Le
contenu d'un document sort par `ezk board maps --file <id> <nom>` : mission control ne lit jamais ces
fichiers lui-même. Ce dossier range la description de ce format et un exemple de sortie.

**Si tu arrives frais.** Un *document* est un dossier de `diagrams/` qui porte une page `.html` ou un
schéma `.svg`. Certaines pages chargent un *fichier de données* généré, que git ignore : la méthode le
calcule à la demande. La décision qui fait de mission control le seul écran est
l'[ADR-086](../../../../docs/adr/ADR-086-la-methode-seul-lecteur-des-fiches-contrat-json.md).

## Ce qu'il y a ici

- `v1/schema.json` : le schéma JSON du format, version 1.
- `v1/example.json` : la sortie de la commande sur le faux projet de `board-show`. Il contient une
  page qui charge des données et un schéma SVG ; une page portée par une autre vue en est écartée.

Les deux fichiers sont **générés**. Ne les modifie pas à la main :

```bash
pnpm --dir products/mega-city board:contract --write
```

## Les règles

- Les documents sont ceux de la méthode : `--root` ne les change pas.
- Les pages qui ont leur propre vue dans mission control (avancement, pilotage, runs, process, la loi)
  ne sont pas des documents.
- `--file <id> <nom>` ne rend que deux noms : le `fichier` du document, et ses `donnees`. Tout autre
  nom sort en code 1, sans rien écrire.
- Un champ ajouté ne change pas `schema_version`. Un champ retiré ou changé de sens la fait passer à 2.
