---
id: "20261001133500750"
title: Le lint ne vérifie pas le code de mega-city
type: chore
priority: P2
product: mega-city
milestone:
version:
labels: [dette]
status: idea
pr:
evidence: none # pas d'écran
created: 2026-10-01
---

# 20261001133500750 — Le lint ne vérifie pas le code de mega-city

**En clair.** Le lint du dépôt saute tout le code de mega-city. Biome exclut le dossier en
entier, et mega-city n'a pas de lint à elle. Ce code n'est donc jamais vérifié pour le style ni
pour les erreurs simples qu'un lint attrape. On veut que le lint couvre mega-city, comme le reste
du dépôt.

**Si tu arrives frais.** Biome est l'outil de lint et de formatage du dépôt. `pnpm lint` le lance à
la racine, et la CI le lance aussi.

## Contexte / Problème

Constaté le 2026-10-01 :

- `biome.json`, dans `files.ignore`, contient `"products/mega-city"` ;
- `products/mega-city/package.json` n'a pas de script `lint` ;
- le dossier n'a pas de configuration biome à lui.

Ni `pnpm lint` ni la CI ne vérifient donc ce code.

## Proposition

POC : retirer mega-city de la liste d'exclusion et compter les alertes. Puis choisir :

- tout corriger d'un coup si le volume est petit ;
- sinon tolérer les alertes existantes, refuser les nouvelles, et résorber par lots.

Les fichiers générés (`*.data.js`) restent exclus.

## Critères d'acceptation

- [ ] `pnpm lint` à la racine vérifie aussi les fichiers de `products/mega-city`.
- [ ] La CI échoue si une nouvelle alerte de lint apparaît dans mega-city.
- [ ] Les fichiers générés restent exclus.

## Comment vérifier

Ajouter une alerte volontaire dans un fichier de mega-city : la commande doit échouer. Retirer
l'alerte : elle doit repasser.

```bash
pnpm lint
```

## Notes / décisions

- Voir aussi la fiche livrée [Résorber les warnings biome](done/0005-resorber-warnings-biome.md) (0005).
