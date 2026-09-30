# Migration 005 — retrait du champ date `ready:` (layout v4 → v5)

**Cible :** `layout_version: 5`
**Type :** BREAKING côté fiche — le champ `ready:` disparaît du front-matter, le validateur le rejette.
**Décision :** fiche `20260823121712652` (groom et concurrence `ezk-pm` du 2026-09-30), amendement de l'ADR-0016.

## En clair

`ready` est une colonne : `status: ready`. Ce n'est plus un champ date. Le tirage lit déjà le statut
depuis la migration 003. Le vieux champ `ready: 2026-08-21` ne servait plus qu'à créer de la confusion.
Cette migration le retire de toutes les fiches. La date n'est pas perdue : quand une fiche en portait
une, elle est recopiée dans une ligne de note au bas de la fiche, avant que la ligne soit supprimée.

## Ce que ça change

- Le front-matter d'une fiche ne porte plus `ready:`. Le statut dit tout : `idea` (pas prête) ou
  `ready` (groomée, tirable).
- `blocked` n'est plus un statut : c'est un drapeau `blocked:` (+ la raison) posé par-dessus la colonne.
  Une fiche encore en `status: blocked` est convertie (voir le tableau plus bas).
- Le gate `ready <id>` passe la fiche en `status: ready`. Il ne pose plus de date.
- Le validateur (`fiches:check --strict`) signale `ready:` comme **champ retiré**. Un gabarit périmé
  ou une fiche copiée d'un vieux dépôt ne peut donc pas le faire revenir en silence.
- Les gabarits (`feature-template.md`, `init.sh`) ne créent plus la ligne.
- `regen-backlog.sh`, `portfolio.sh`, le board, `plan:head` ne lisent plus le champ.

## Migration

```bash
bash <skill>/scripts/apply-005-retrait-champ-ready.sh [racine-projet]            # DRY-RUN : liste, n'écrit rien
bash <skill>/scripts/apply-005-retrait-champ-ready.sh --apply [racine-projet]    # réécrit les fiches
```

Pour chaque fiche de `features/` et de `features/done/` qui porte un `ready:` dans son front-matter :

| Le champ valait | Le script |
|---|---|
| une date (`ready: 2026-08-21`) | ajoute au bas de la fiche une note datée, puis supprime la ligne |
| rien (`ready:`) | supprime la ligne, sans note |
| `status: blocked` (layout v4) | `status: idea` et ajoute le drapeau `blocked: "ancien statut blocked (migration 005) — raison à préciser"` (un `blocked:` déjà présent est conservé) ; si la fiche portait une date `ready:`, elle reste en note |

Le dernier cas ferme un trou du schéma : `blocked` n'est plus une colonne mais un **drapeau** posé par-dessus
la colonne. Le validateur v5 rejette `status: blocked`. Sans cette conversion, un dossier serait déclaré
layout 5 alors qu'il ne passe pas la validation stricte.

**Pourquoi `idea` et jamais `ready`.** La file tirable (`plan:head`, `next --ready-only`) lit le statut seul
et ignore encore le drapeau. Une fiche bloquée promue en `ready` deviendrait donc tirable, alors qu'elle ne
l'était pas avant. Elle repasse en `idea` (non tirable, comme avant), avec son drapeau. Sa date de DoR n'est
pas perdue (note datée). Une fois débloquée, un nouveau `ready <id>` la remet dans la file.

La note a toujours cette forme (le commentaire d'origine n'est recopié que s'il porte une information ;
le texte-type du gabarit est écarté) :

```text
> **Historique** — DoR (`ready`) passée le 2026-08-21 · ancien champ front-matter `ready:`, retiré en migration 005.
```

**La date n'est jamais dérivée de git.** Un squash-merge ment : une fiche livrée le 22 a pu être
`ready` le 21. Retirer le champ sans recopier la date aurait fait mentir l'historique.

Le script ne touche que le front-matter : un `ready:` cité dans le corps (un bloc de code, par
exemple) reste intact. Il est **idempotent** : une fois les lignes parties, une 2e exécution répond
« rien à migrer ». Avec `--apply`, il passe aussi `features/README.md` à `layout_version: 5`, retire
la ligne `ready:` du gabarit déployé `features/feature-template.md` et y met à jour le commentaire de
`status:` (les statuts du layout 5 : plus de `blocked`, désormais un drapeau ; `merged` et `split` ajoutés).
Ces réécritures restent dans le front-matter : un exemple du corps du gabarit ou du README n'est jamais touché.

**Gardes de version.** La migration 003 lit le champ `ready:` pour scinder `todo` en `ready` ou `idea`.
Sur un dossier plus ancien que le layout v4, `--apply` refuse et nomme la migration à passer d'abord.
Sur un dossier déjà en layout 6 ou plus, le script ne fait rien (jamais de rétrogradation). Sur un
dossier déjà en layout 5, `--apply` reste permis : c'est le rejeu voulu après un `merge` qui ramène
une fiche portant encore `ready:`.

Filet : les fiches sont versionnées. `git diff` montre chaque changement, `git checkout` l'annule.
Après l'`--apply`, régénère les vues (`regen-backlog.sh`, `portfolio.sh`, `avancement:regen`, …).
