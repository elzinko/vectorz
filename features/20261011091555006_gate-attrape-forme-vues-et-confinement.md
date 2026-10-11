---
id: "20261011091555006"
title: La gate attrape les défauts que la revue a dû rattraper (forme des vues, confinement)
type: feature
priority: P2
product: mega-city
milestone:
version: v0.11.0
labels: [backlog]
status: ready
pr:
evidence: none # pas d'écran
created: 2026-10-11
---

# 20261011091555006 — La gate attrape les défauts que la revue a dû rattraper

**En clair.** Pendant le run v0.7, la gate automatisée est passée au vert alors que deux vrais défauts
étaient là : un titre de vue corrompu, et une protection de chemin ajoutée sans test. C'est la revue
adverse qui les a bloqués, pas la gate. On veut que la gate attrape ces deux familles elle-même, pour ne
pas dépendre d'un relecteur humain à chaque fois.

**Si tu arrives frais.** La « gate », c'est la batterie de contrôles automatiques (tests, typage,
`test:scripts`) qui doit passer avant un merge. La « revue adverse », c'est l'agent `ezk-reviewer` qui
relit le patch et dit GO / NO-GO. Une « protection de confinement », c'est le bout de code qui empêche
d'écrire un fichier hors du dossier autorisé.

## Contexte / Problème

Constaté le 2026-10-11 sur le run v0.7. Deux défauts sont passés sous la gate verte :
- la forme d'une vue générée était cassée (un titre dérivé d'un drapeau, pas du vrai titre) ;
- une garde de confinement de chemin avait été ajoutée au point d'entrée sans test qui la couvre.
La règle `testing/confinement-contract-at-boundary` existe déjà, mais rien ne vérifiait qu'elle était
appliquée. Une gate verte a donné une fausse assurance.

## Proposition

Deux contrôles ajoutés à la gate, indépendants :
- **Forme des vues générées** : un test vérifie que le titre d'une vue dérive du vrai titre, jamais d'un
  drapeau ; aucun drapeau ne fuit dans la sortie ; un drapeau inconnu échoue.
- **Confinement testé** : un contrôle détecte « garde de confinement au point d'entrée sans test associé »
  et fait échouer la gate, câblé dans `test:scripts`.

## Critères d'acceptation

- [ ] Un test de forme échoue si une vue générée dérive son titre d'autre chose que le vrai titre.
- [ ] Un test de contrat CLI échoue si un drapeau fuit dans la sortie, ou si un drapeau inconnu est avalé.
- [ ] Un contrôle en gate échoue si une garde de confinement au point d'entrée n'a pas de test.

## Comment vérifier

```bash
pnpm --dir products/mega-city test
pnpm --dir products/mega-city test:scripts
```

## Notes / décisions

- Sort de la rétro du run autonome v0.7 (capture `docs/captures/2026-10-11-retro-run-v07-autonome.md`, S4).
- Durcit la règle existante `testing/confinement-contract-at-boundary` (il manquait la détection en gate).
- Le défaut de forme est le même bug que [[20261011091552583]] ; ici c'est le filet de gate qui l'aurait vu.
