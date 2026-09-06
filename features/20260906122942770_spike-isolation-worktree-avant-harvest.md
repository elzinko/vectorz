---
id: "20260906122942770"
title: SPIKE — pourquoi l'isolation worktree, avant de figer la moisson
type: chore
priority: P2
product: mega-city
version:
epic:
depends: []
labels: [methode, retro-2026-09-05, spike, worktree]
status: idea
ready:
pr:
created: 2026-09-06
---

# 20260906122942770 — SPIKE isolation worktree

## En clair

On sait qu'un sous-agent en worktree écrit chez lui, pas chez le pilote. On ne sait pas encore
**pourquoi** : est-ce structurel, une garantie de sécurité, ou juste un `cwd` non partagé ? Ce spike
répond avant qu'on grave l'étape de moisson dans la méthode.

## Contexte / Problème

Symptôme 5 de la rétro du 2026-09-05 : l'isolation des worktrees d'agents est confirmée, mais sa
cause ne l'est pas. Figer une règle de moisson (R5,
[development/worktree-secondary-inline-harvest](../products/mega-city/rules/development/worktree-secondary-inline-harvest.md))
sans comprendre l'isolation, c'est risquer de coder autour d'un symptôme.

## Proposition

Mener un spike qui tranche la nature de l'isolation worktree :

- structurelle (git worktree isole par conception) ?
- garantie de sécurité (bac à sable voulu) ?
- simple `cwd` non partagé (accident réparable) ?

## Critères d'acceptation

- [ ] Rapport d'1 page : nature de l'isolation + conséquence pour la méthode.
- [ ] Test de reproduction de l'isolation.
- [ ] Reco : garder l'inline forcé, ou automatiser la moisson, ou autre.

## Comment vérifier

Le livrable existe (rapport + test repro) et la reco est actionnable pour confirmer ou amender R5.

## Notes

Origine : rétrospective du 2026-09-05 (symptôme 5). Ce spike **conditionne** la règle R5 : R5 tient
comme discipline dès aujourd'hui, mais son durcissement attend cette réponse.
