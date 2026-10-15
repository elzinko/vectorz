# ADR 0077 — `in-progress` est un état CALCULÉ, non écrivable en front-matter

**Statut :** Accepté (build autonome v0.16, 2026-10-14)
**Date :** 2026-10-14
**Deciders :** pilote du run v0.16 (décision bornée, deux options claires, panel adverse facultatif — la fiche le notait) ; revue adverse de release (`ezk-reviewer`, ADR-0059)
**Fiche :** [`20261013131853182`](../../../../features/done/20261013131853182_sort-valeur-in-progress-schema.md) (« Trancher le sort de la valeur in-progress du schéma »), sœur de [`20261013131852984`](../../../../features/done/20261013131852984_en-cours-deduit-des-branches-portier-vue.md)
**Compose :** [`src/core/fiche-schema.ts`](../../src/core/fiche-schema.ts) (`STATUT_DEFS.writable`, `STATUTS_ECRITS`, `STATUTS_CALCULES`) · [`src/backlog/fiche-validator.ts`](../../src/backlog/fiche-validator.ts) · s'appuie sur [ADR-0055](0055-board-fonction-pure-des-fichiers.md) (le board ne lit que le committé)

## En clair

Depuis la fiche sœur, « en cours » se **déduit des branches** (une branche `feat/<id>-…` non absorbée),
jamais d'un champ `status:` écrit. Du coup, la valeur `in-progress` du schéma n'est plus écrite par
personne — et ne l'a jamais été (0 fiche sur 330). Il fallait trancher son sort.

**Décision : on la GARDE comme état calculé, mais on la rend NON ÉCRIVABLE.** Le validateur refuse
désormais `status: in-progress` dans le front-matter d'une fiche. La valeur reste dans le schéma pour
ce que les vues en affichent (la colonne « en cours » du portfolio, le libellé de progression d'un
jalon) — mais le *chemin d'écriture* mort est fermé.

Analogie : « en cours » cesse d'être une case qu'on coche à la main. C'est une lampe qui s'allume toute
seule quand une branche de travail existe. On enlève l'interrupteur manuel (personne ne s'en servait),
on garde la lampe.

## Options pesées

- **Garder calculé (RETENUE).** Documenter `in-progress` comme état affiché par les vues, jamais écrit ;
  le validateur l'interdit en `status:` écrit. Petit geste, aucun retrait de l'habillage des vues.
- **Retirer du schéma (écartée).** Ôter `in-progress` de la table des statuts. Rejetée ici parce que
  le rayon d'impact est large et piégeux : la chaîne `'in-progress'` sert AUSSI de **libellé de
  progression d'un jalon** dans `avancement-data` (un jalon est « in-progress » s'il a des fiches
  engagées/livrées), un sens distinct du statut d'une fiche. Retirer le statut sans toucher au libellé
  de jalon mélangerait deux concepts et multiplierait les retouches (shell d'habillage, gabarits, test
  de contrat du schéma). La version « non écrivable » ferme le chemin mort sans ce risque.

## Décision

1. **`in-progress` reste dans `STATUT_DEFS`** (affichable par les vues), mais porte `writable: false`.
2. **Deux dérivés typés** depuis la table : `STATUTS_ECRITS` (les statuts qu'une fiche peut porter) et
   `STATUTS_CALCULES` (les états affichés, jamais écrits). Pas de liste parallèle (ADR-0040 D2).
3. **Le validateur refuse un `status:` calculé.** Écrire `status: in-progress` lève une anomalie au
   message clair : l'état est déduit des branches (fiche sœur), à retirer du front-matter.
4. **Nettoyage du code mort.** La vue process ne lit plus le statut `in-progress` (le cran de repli
   `if (status === 'in-progress')` disparaît) : « en cours » vient des branches, point.

## Conséquences

- `grep -l 'status: in-progress' features/*.md` reste vide : rien à migrer (invariant préservé).
- Une fiche copiée d'un vieux dépôt avec `status: in-progress` est **signalée**, plus acceptée en silence.
- Réversible : passer `writable: false` à `true` rouvrirait le champ ; la décision ne détruit rien.
