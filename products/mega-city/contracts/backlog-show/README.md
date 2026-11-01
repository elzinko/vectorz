# Le contrat de `ezk backlog show --json`

## En clair

`ezk backlog show --json` sort le détail des fiches d'un projet : leur identité et leurs sections
(« en clair », contexte, critères avec leur case, comment vérifier). Un autre programme l'affiche
tel quel, sans réécrire un découpeur de markdown. Ce dossier range la description de ce format et
des exemples de sortie.

**Si tu arrives frais.** Une *fiche* est un fichier markdown du backlog. *Mission control* est le
tableau de bord du produit cop1 : c'est lui qui ouvre une fenêtre de détail quand on clique une
fiche. La décision qui fait de la méthode le seul lecteur des fiches est
l'[ADR-086](../../../../docs/adr/ADR-086-la-methode-seul-lecteur-des-fiches-contrat-json.md).

## Deux usages, deux formes

| Commande | Ce qui sort | Schéma | Exemple |
|---|---|---|---|
| `ezk backlog show --json` | toutes les fiches de `features/`, hors `done/`, triées par id, en un appel | `v1/schema.json` | `v1/example.json` |
| `ezk backlog show <id> --json` | une fiche, de `features/` ou de `done/` | `v1/fiche.schema.json` | `v1/fiche.example.json` |

Un consommateur qui affiche tout le backlog prend la première : un seul appel, au lieu d'un par fiche.
Un id inconnu donne le code de sortie 1 et un message qui le nomme, jamais un JSON vide.

Les fichiers sont **générés**, comme ceux du board. Ne les modifie pas à la main :

```bash
pnpm --dir products/mega-city board:contract --write
```

## Les règles du format

Ce sont celles du contrat du board : lis-les dans [`../board-show/README.md`](../board-show/README.md).
En bref : `schema_version` d'abord, un champ inconnu s'ignore, les tests d'un consommateur lisent les
exemples, jamais un vrai `ezk`.

Deux précisions propres au détail :

- `status` est le statut **écrit**. « En cours » se lit dans `enCours` (une branche est ouverte).
- Une section absente sort vide (`""` ou `[]`), jamais omise.

## Où vit le format

Il se décrit en zod dans `src/core/fiche-detail.ts`. Le découpage en sections vit dans
`src/core/fiche-sections.ts`, partagé avec le contrôle de prêt de la méthode.
