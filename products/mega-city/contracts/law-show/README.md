# Le contrat de `ezk law show --json`

## En clair

`ezk law show --json` sort, pour chaque règle de la méthode, où elle est rangée, quel skill ou
quel agent l'applique, et si elle est vraiment installée sur le poste. Un autre programme l'affiche
tel quel, sans relire les fichiers de la méthode. Ce dossier range la description du format et un
exemple de sortie.

**Si tu arrives frais.** Une *règle* est un fichier markdown du catalogue de la méthode. Un *bundle*
est un paquet de règles. Un *profil* choisit des bundles, des skills et des agents. La décision qui
fait de la méthode le seul lecteur de ses fichiers est l'[ADR-086](../../../../docs/adr/ADR-086-la-methode-seul-lecteur-des-fiches-contrat-json.md).

## Ce qu'il y a ici

- `v1/schema.json` : le schéma JSON du format, version 1. Il joue le rôle d'une DTD : il déclare
  chaque type d'objet (`skill`, `agent`, `bundle`, `profile`) et son champ `regles`.
- `v1/example.json` : la sortie de la commande sur un petit catalogue factice, avec une règle par
  portée.
- `../law-object/v1/` : le schéma et l'exemple de `ezk law show skill:<id> --json` (ou `agent:<id>`),
  les règles d'un seul objet. Une règle déjà installée porte `installee` et un `texte` à `null` ; les
  autres portent leur texte complet. Décision : [ADR-0087](../../docs/adr/0087-regles-lues-au-demarrage-du-skill.md).

Les deux fichiers sont **générés**. Ne les modifie pas à la main :

```bash
pnpm --dir products/mega-city law:contract --write
```

Sans `--write`, la commande vérifie qu'ils sont à jour. Le test de contrat
(`src/__tests__/law-show.test.ts`) échoue s'ils ne le sont plus.

## Les règles du format

1. **Le numéro de version.** `schema_version` vaut `1`. Il monte quand un champ disparaît, change
   de nom ou change de sens. Un champ ajouté ne le change pas.
2. **Un consommateur lit `schema_version` d'abord.** Une autre valeur que celle qu'il connaît : il
   le dit à l'écran et n'affiche rien de faux.
3. **Un consommateur ignore les champs qu'il ne connaît pas.** Le schéma publié accepte un champ en
   plus.
4. **Une portée par règle, dans cet ordre.** `partout` : le titre de la règle est dans la loi
   globale installée. `projet` : il est dans la loi du projet, pas dans la globale. `demarrage` :
   aucune loi ne l'installe, mais un skill ou un agent qui la cite ouvre son texte par
   `ezk law show <objet>` et la lit en démarrant. `citee` : un skill ou un agent l'applique, en
   direct ou par un bundle, aucune loi ne l'installe et aucun objet qui la cite ne la demande.
   `rangee` : elle est dans un bundle, ni installée ni citée. `orpheline` : elle est dans aucun
   bundle et personne ne la cite. Les six comptes de `comptes` somment à `total`. La portée
   `demarrage` s'est ajoutée le 2026-11-03 sans changer `schema_version` : un champ ajouté.
5. **`citee` ne veut pas dire « lue par personne ».** Le graphe voit l'id cité, pas le texte : un
   skill peut recopier le texte de la règle dans son corps. `litSesRegles` dit, pour chaque objet,
   s'il ouvre par la commande qui lui sert ses règles.
6. **Un fichier de loi absent est dit.** `lois.<globale|projet>.installee` vaut `false`. Les comptes
   `partout` et `projet` valent alors zéro parce que rien n'est lu, et non parce qu'aucune règle
   n'est installée.
7. **`via`.** `direct` : l'objet cite la règle lui-même. `bundle:<id>` : un bundle la lui apporte.
