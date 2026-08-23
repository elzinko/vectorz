---
id: "20260823121712844"
title: "Durcir regen-backlog — refuser une racine par défaut nichée sous un autre backlog (fin du piège products/mega-city)"
type: bug
priority: P2
product: mega-city
status: todo
ready:
pr:
created: 2026-08-23
---

# Durcir regen-backlog — que le défaut de racine ne puisse plus créer un backlog fantôme

## En clair

`regen-backlog.sh` lancé **sans argument** depuis `bin/` vise `products/mega-city` par défaut — un
**reliquat** d'avant la « liste unique » (fiche 0064). C'est ce qui a créé un dossier
`products/mega-city/features/` **fantôme** (constaté le 2026-08-23). Le dossier est supprimé et le
garde-fou actuel bloque la récidive **par regen**, mais le **défaut latent** subsiste : on veut le
neutraliser **à la source**.

## Contexte / Problème

- Lignes 18-19 du script : sans argument et lancé depuis `bin/`, `ROOT = parent du bin = products/mega-city`.
  Depuis 0064, ce dossier **n'est plus une racine de backlog** (liste unique à la racine vectorz).
- Le garde-fou existant (`[ -d features ] || exit 1`) protège **seulement** si le dossier n'existe pas.
  Une fois un `features/` fantôme présent (recréé par un autre moyen), le piège **se réarme** et un
  `regen` sans-argument le re-remplit d'un index vide.
- Chronologie de la panne : le 13/08 le tombstone existait encore → un `regen` mal-cwd a écrit un
  `BACKLOG.md` vide dedans → PR #147 a retiré le tombstone du git, mais le fichier est resté sur disque.

## Proposition

- Le script **refuse** une racine **résolue par défaut** (sans argument) qui est **nichée** sous un autre
  backlog : si un **ancêtre** de `ROOT` contient déjà `features/`, erreur claire (« racine nichée —
  passe la vraie racine explicitement »).
- Appliquer aux **deux copies** (`bin/` + vendored `skills/ezk-backlog/scripts/`) en gardant le **corps
  identique** (le test `test-regen-backlog.sh:21` vérifie `diff -q`).
- Le défaut « bin → parent du bin » **reste valide** pour un projet autonome (le fixture de test est dans
  un tmpdir sans ancêtre `features/`) — on ne casse pas ce cas.

## Critères d'acceptation (à groomer)

- [ ] `regen` sans-argument depuis `products/mega-city` **échoue** avec un message explicite (racine nichée),
      **sans rien écrire**.
- [ ] Le cas légitime (projet autonome, bin à la racine) **fonctionne toujours** (test existant vert).
- [ ] Les deux copies restent **identiques**.
- [ ] **Nouveau test** couvrant le refus de racine nichée.

## Comment vérifier

Recréer `products/mega-city/features/`, lancer `regen` sans-argument → refus explicite, aucune écriture.
Le suite `test-regen-backlog.sh` reste verte.

## Notes / voisins

- Suite de [[20260813170548417]] (suppression du tombstone, shipped #147) : celle-ci **empêche la
  récidive** que la simple suppression ne garantit pas.
- **Non ready** — petit chantier ciblé (2 copies + 1 test), à groomer/tirer.
