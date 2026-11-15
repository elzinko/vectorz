# Compte rendu de sprint — « La gate se règle et s'enregistre » (2026-11-15, nuit)

## En clair

Deuxième sprint de la nuit sur la gate de release, construit par la session pilote pendant que `q`
était à l'arrêt. Deux stories cohérentes, livrées et **marquées shipped** dans main local (rien
poussé). Avec elles, **le thème de la gate de release est complet** : les trois fiches sont livrées.

## Le lot livré (main local, rien poussé)

| Fiche | Story | Commit | Fiche |
|---|---|---|---|
| [20261114131615903](../../features/done/20261114131615903_ezk-release-verdict-par-commande.md) | La gate enregistre ses verdicts par commande | `3c57c185` | **shipped** (`1c6d63cd`) |
| [20261114131616085](../../features/done/20261114131616085_ezk-release-passes-list-add-remove.md) | Les passes de la gate se règlent par commande | `89f7f9de` + `7f62ec4a` | **shipped** (`487096dc`) |

## Ce qui est dans le code

- **`ezk release verdict <passe> <v> go|no-go "<motif>"`** écrit un verdict `{ motif, auteur, head }`.
  La passe `chasse-aux-bugs` le relit (`verdict-check`) avec **péremption** : NO-GO si le verdict a
  été posé sur un autre commit que HEAD. L'ancien fichier `.bughunt-go` a disparu. Le compte rendu de
  la gate nomme le motif d'un NO-GO.
- **`ezk release passes add <id> --title --command`** ajoute une passe projet (id déjà pris refusé) ;
  **`--type agent <nom>`** crée une passe qui lit le verdict d'un agent ; **`--type rules`** attend son
  lecteur de loi (fiche `…615350`) et est refusé. **`remove <id>`** retire une passe projet ; une passe
  du socle se remplace par `replace: true`. L'écriture YAML préserve voisins et commentaires.

## Qualité

- Suite entière verte : **2360 tests**, 201 fichiers, à chaque étape.
- Revue adverse par `/code-review` (le persona `ezk-reviewer` n'est pas bindable en desktop — revue
  par l'outil, nommée) : un vrai crash trouvé plus tôt dans le thème, des points mineurs ici, tous
  traités ou reportés en conscience.
- **Piège confirmé** : sous forte charge, `pnpm gate` fait TIMEOUTER (5000 ms) des tests lents
  (supervision, capture…) — faux positifs. On rejoue en isolation ou avec `--testTimeout=60000` :
  tout vert. Et un `cmd | tail` masque le code de sortie — on capture `; echo EXIT=$?`.

## Le thème de la gate, complet

Trois fiches livrées et shipped : [joue les tests](../../features/done/20261114131613314_gate-de-release-joue-les-tests.md),
[enregistre ses verdicts](../../features/done/20261114131615903_ezk-release-verdict-par-commande.md),
[se règle par commande](../../features/done/20261114131616085_ezk-release-passes-list-add-remove.md).

## Rétro

- **Marché.** Un thème mené de bout en bout : chaque story a durci ou débloqué la précédente (compose
  → verdict → passes réglables). La composition et la décision vivent dans des fonctions pures testées.
- **Attrapé.** Le faux « échec » de gate (timeouts sous charge), su grâce au code de sortie capturé,
  pas masqué.
- **À faire par q / supervisé.** Le reste du plan des 8 sprints (board, objectifs/versions — qui
  dépendent des 4 oui du PO —, loi, recettes, écran). Et le `--type rules` de la gate, qui attend le
  lecteur de loi (fiche `…615350`).

## Comment vérifier

```bash
ROOT="$(git rev-parse --show-toplevel)"
ezk --root "$ROOT" release passes list
ezk --root "$ROOT" release passes add deps --title "Deps" --command "pnpm audit --audit-level=high"
ezk --root "$ROOT" release passes remove deps
pnpm --dir products/mega-city test -- src/__tests__/release-gate.test.ts
```
