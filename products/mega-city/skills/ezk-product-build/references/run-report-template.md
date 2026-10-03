# Gabarit du contexte de run et du RUN-REPORT — SOURCE UNIQUE

Ce gabarit est lu par `ezk-product-build` (et par `ezk-sprint` quand on le lance seul). Il fixe le
**format** des deux blocs qui encadrent un run autonome. Il ne doit exister **qu'ici**.

La règle de clarté [`human-facing-lisibility`](../../../rules/documentation-guidelines/human-facing-lisibility.md)
garantit le **texte** dans ce format : « En clair » d'abord, phrases courtes, jargon en annexe. Le
gabarit seul ne rend rien lisible.

**En clair :** un run autonome doit dire ce qu'il va faire seul avant de partir, puis ce qu'il a fait
quand il a fini. Deux commandes sortent les faits : `ezk run context` à l'ouverture, `ezk run report` à la
clôture. Tu ne recopies aucun chiffre à la main.

---

## À l'ouverture : le contexte de run

```bash
ezk run context --mode <auto|manuel> --delivery <per-feature|per-epic> --tokens <lean|cap|full> [--fiche <id>] [--max-sprints N]
```

Passe les réglages **réels** du run : le contrat en trois lignes en sort. Affiche le bloc tel quel,
sans attendre de validation (c'est un affichage, pas un checkpoint).

| Ligne | Ce qu'elle dit |
|---|---|
| Réglages | `--mode`, `--tokens`, `--delivery`, `--review`, `--max-sprints`, la fiche visée |
| Base | `origin/main` après `git fetch`, le retard de HEAD, et ce qu'on en fait |
| Worktree | principal ou secondaire, la branche, le chemin |
| Écriture | inline en worktree secondaire (un sous-agent écrirait chez lui), sous-agent possible sinon |
| Contrat 1 | auto + `per-feature` : je merge les fiches vertes. `per-epic` : les PR du lot restent ouvertes. `manuel` : rien sans toi |
| Contrat 2 | les 4 cas où je m'arrête : action irréversible ou sortante, hausse de budget, idée produit, exigences contradictoires |
| Contrat 3 | le plafond de jetons : le réglage `lean`, `cap` ou `full`, dit en clair |

Un retard sur `origin/main` ne bloque rien : le bloc propose le réalignement quand il est sans risque
(arbre propre, fast-forward strict) et avertit seulement sinon. Sans remote joignable, il avertit.

## À la clôture : le RUN-REPORT

Pour tout run auto qui a construit **plus d'un sprint**.

```bash
ezk run report \
  --fiche "<id>|<état>|<PR>|<gate>|<revue>|<validation>|<raison>" [--fiche …] \
  [--tokens-used N] [--tokens-cap N] [--tokens-setting lean|cap|full] [--no-github]
```

| Champ | Valeurs |
|---|---|
| `id` | l'id de la fiche |
| `état` | `mergée`, `PR-ouverte`, `bloquée` ou `sautée` |
| `PR` | `#<numéro>` (obligatoire pour `mergée` et `PR-ouverte`), sinon `-` |
| `gate` | `verte`, `rouge`, `en cours`, `non lancée` |
| `revue` | `GO`, `NO-GO`, `absente` |
| `validation` | `faite`, `à faire`, `N.A.` |
| `raison` | obligatoire hors `mergée` : pourquoi la fiche n'est pas mergée |

`-` dit « sans objet ». Un champ **vide** est refusé : un trou ne passe jamais pour un « rien à signaler ».

Le script compare ce que tu déclares à GitHub : une PR déclarée mergée mais ouverte, une gate déclarée
verte contre une CI rouge, une revue GO sans aucune trace sur la PR. Un écart sort en code 1.

Le rapport rendu a toujours cette forme :

1. `RUN-REPORT`, puis **En clair** : le compte par état.
2. Une ligne par fiche, avec les six champs.
3. HEAD contre `origin/main`, les jetons contre le plafond, la position de GitHub.
4. Les écarts, s'il y en a.
5. **Ce que ça veut dire pour toi** : les PR à merger, les fiches à trancher.

Tu **restitues** ce rapport au PO tel que le script le rend, sans le réécrire. Tu peux ajouter une
phrase d'explication **après**, jamais à la place.
