---
id: "20261013013553179"
title: "Le grooming applique la règle de taille : découper une fiche > 2 surfaces avant ready"
type: chore
priority: P3
product: mega-city
milestone:
version: v0.22.0
labels: [backlog, dette]
status: idea
pr:
evidence: none # convention de grooming, pas d'écran
created: 2026-10-13
---

# 20261013013553179 — Le grooming applique la règle de taille des fiches

**En clair.** La règle `token-economy/fiche-tient-dans-un-sprint` dit qu'une fiche de plus de six
critères, ou qui touche plus de deux surfaces (commande, serveur, écran, ADR, skill…), se découpe
avant de passer `ready`. Mais rien ne la fait respecter au grooming. Pendant le run v0.11, la fiche
`ezk release` (20260922175954296) touchait **8 surfaces** (CLI, cœur, loader, config, version-close,
skill, enregistrement graphe/profil/README, tests) et est quand même passée `ready` entière : un
seul sprint très lourd là où un découpage aurait aidé.

**Si tu arrives frais.** Le *grooming* fait mûrir une fiche jusqu'à « prête » (`ready`). Une
*surface* est un endroit distinct du code touché par la fiche.

## Contexte / Problème

Run autonome v0.11 (2026-10-13). La fiche P0 « ezk release » était un keystone légitime, mais son
périmètre réel (skill + CLI + config + intégration version-close + enregistrement dans 4 registres +
tests) dépassait largement « 2 surfaces ». Elle a dominé le run. Ses propres notes disaient déjà
« à passer en panel pour la forme » — signe qu'elle méritait un découpage au grooming.

Symétrique : les fiches 5 (gate attrape forme/confinement) et 8 (lint mega-city) ont dû être
**sorties de v0.11 en cours de run** faute d'être découpées/cadrées (critère 3 = spike ; 396 erreurs
lint). Un contrôle de taille au grooming les aurait signalées plus tôt.

## Proposition

- Au `ready`, compter les **surfaces** et les **critères** de la fiche ; au-delà du seuil, **refuser**
  (ou avertir fort) et proposer un découpage, en citant la règle `fiche-tient-dans-un-sprint`.
- La part mécanisable (compter les critères `- [ ]`, détecter les surfaces nommées) peut vivre dans
  `ezk dor check` ; le jugement « ça tient dans un sprint » reste au groomeur.

## Critères d'acceptation

- [ ] `ezk dor check <id>` (ou le gate `ready`) signale une fiche de plus de 6 critères ou touchant
      plus de 2 surfaces, en citant la règle.
- [ ] Le message propose le découpage, sans l'imposer (soupape PO journalisée).

## Comment vérifier

```bash
ezk dor check <id-d-une-fiche-trop-grosse>   # doit avertir sur la taille
```

## Notes

- Sortie de la rétro du run autonome v0.11 (2026-10-13). Priorité P3 : garde-fou de process, pas un
  blocage de livraison.
