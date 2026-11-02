> 🗎 Rendu de la fiche [features/20261102123552184_mission-control-montre-les-cartes-de-la-methode.md](../done/20261102123552184_mission-control-montre-les-cartes-de-la-methode.md)

## En clair

La méthode range sept documents dans `diagrams/` : la carte de la méthode, le schéma du domaine,
quatre schémas de qualité et un benchmark. Aujourd'hui, seule la page web de la méthode les montre.
Cette fiche les montre dans mission control, dans une vue « Cartes ». La méthode dit quels documents
existent ; mission control les affiche tels quels.

## Contexte / Problème

- L'[amendement du 2026-11-02 de l'ADR-086](../../docs/adr/ADR-086-la-methode-seul-lecteur-des-fiches-contrat-json.md)
  fait de mission control le seul écran. Les documents servis par `ezk board open` doivent y trouver
  leur place avant le retrait de la page web.
- `ezk board open --list` liste douze cartes. Cinq sont des pages interactives, portées par d'autres
  fiches : avancement, pilotage, runs, process et la loi. Les sept autres sont des documents :
  - `methode-mega-city` (carte interactive en HTML) ;
  - `domaine-mega-city` (SVG) ;
  - `qualite-composants`, `qualite-composants-detail`, `qualite-deploiement`,
    `qualite-flux-emission-agregation` (SVG) ;
  - `benchmark-bmad-ezk` (HTML).
- Ouvert en double-clic (`file://`), un document HTML s'affiche dégradé : c'est pourquoi la méthode
  les sert par un petit serveur.

## Valeur

- Le PO garde l'accès à la carte de la méthode et aux schémas, dans le seul écran qu'il ouvre.
- Un nouveau document rangé dans `diagrams/` apparaît sans changer mission control.

## Proposition

1. **La méthode publie la liste.** `ezk board maps --json` rend les documents de `diagrams/` qui ne
   sont pas des pages portées par une autre fiche : identifiant, titre (lu dans `meta.yaml`), type
   (HTML ou SVG), fichier, et le fichier de données que la page charge, s'il y en a un. Un contrat
   versionné `board-maps` la décrit. Les documents sont ceux de la méthode, quel que soit `--root`.
2. **La méthode calcule les données à la demande.** La carte de la méthode charge
   `carte-interactive.data.js`, un fichier généré que git ignore : absent d'un clone neuf, périmé
   ailleurs. `ezk board maps --file <id> <données>` l'écrit sur la sortie, calculé à l'instant, comme le fait
   `ezk board open`.
3. **Mission control les montre.** Une vue « Cartes », dans la partie « Méthode », liste les documents
   et en affiche un au clic, dans un cadre isolé (`sandbox`, sans accès à mission control). Le daemon
   sert le fichier que la méthode désigne, et les données par la commande ; rien d'autre.

## Critères d'acceptation

- [x] **La liste de la méthode.** La vue « Cartes » liste les mêmes documents que la commande, avec
      leur titre ; les sept sont là pour vectorz.
- [x] **Un document s'affiche bien.** La carte interactive de la méthode et un schéma SVG s'affichent
      dans mission control comme dans la page web de la méthode.
- [x] **Rien d'autre n'est servi.** Le daemon ne sert que les fichiers désignés par la méthode ; un
      chemin hors de cette liste est refusé.
- [x] **Des données fraîches.** La carte de la méthode s'affiche avec ses données même quand
      `carte-interactive.data.js` est absent du disque.
- [x] **Un cadre isolé.** Le document s'ouvre dans un cadre `sandbox` sans `allow-same-origin` : ses
      scripts tournent, mais ne lisent rien de mission control.
- [x] **Jamais de liste inventée.** Sans `ezk`, la vue dit « cartes indisponibles : <raison> ».
- [x] **Avant / après.** Capture de la carte de la méthode dans la page web (avant) et dans mission
      control (après).

## Comment vérifier

```bash
ezk board maps --json | jq '.documents[] | {id, titre, type}'
ezk board maps --file methode-mega-city carte-interactive.data.js | head -c 200
pnpm cop1:dev
```

Ouvrir http://localhost:5273, « Méthode » puis « Cartes ». Signal observable : les sept documents sont
listés, et la carte de la méthode s'ouvre au clic.

## Notes

- Une des fiches du chantier « un seul écran », liées par `milestone: board` et le label
  `un-seul-ecran`, sans fiche chapeau. Le retrait vient en dernier :
  [retirer la page web de la méthode](../20261102123552185_retirer-la-page-web-de-la-methode.md).
- Les documents restent des fichiers de la méthode : seul l'écran qui les montre change.
- Priorité P2, fixée par le PO le 2026-11-02 pour tout le chantier.
- Groom du 2026-11-02 (run autonome) : sources vérifiées. `ezk board open --list` liste bien douze
  cartes, dont sept documents. `carte-interactive.html` charge `carte-interactive.data.js`, ignoré par
  git (`.gitignore`, ADR-0055) : d'où `--file` sur le fichier de données. `benchmark.html` pointe vers des fiches
  par `../../features/…` : ces liens ne s'ouvriront pas dans mission control, c'est accepté.
- Prête le 2026-11-02 : porte « prête » passée en run autonome (ezk-pm GO, taille limite). Coupe si le
  build déborde : la méthode seule (`maps --json`, `maps --file`, contrat), puis le daemon et la vue.


## Validation

| Modalité | Statut |
|---|---|
| Gate de la méthode : 2420 tests + 47 suites de scripts | ✅ (relance seule ; 1er passage : 2 dépassements de 5 s sous charge) |
| Tests mission control (780) + page web (141) + typecheck | ✅ |
| Lint des fichiers touchés | ✅ |
| Contrat board-maps v1 | ✅ nouveau ; exemple tiré d'un faux dossier diagrams/ de la fixture |
| Rien d'autre n'est servi | ✅ liste blanche côté méthode et côté daemon ; ..%2F..%2Fpackage.json → 404 en vrai |
| Données fraîches | ✅ la carte s'affiche sans carte-interactive.data.js sur le disque |
| Cadre isolé | ✅ iframe sandbox + CSP sandbox sur HTML et SVG |
| Revue adverse ezk-reviewer | ✅ GO (3 remarques appliquées) |
| Before / after (UI) | [avant](../../docs/pr-evidence/20261102123552184/carte-before.png) · [après](../../docs/pr-evidence/20261102123552184/carte-after.png) |
