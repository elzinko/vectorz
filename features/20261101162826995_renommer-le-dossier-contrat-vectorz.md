---
id: "20261101162826995"
title: "Le dossier de contrat d'un projet porte le nom de la méthode, pas celui de vectorz"
type: refactor
priority: P2
product: mega-city
milestone: qualite
version:
labels: [config, nommage, migration]
status: idea
blocked: deferred
pr:
evidence: none # chemins de fichiers et code, sans écran
created: 2026-11-01
---

## En clair

Chaque projet qui utilise la méthode a un dossier `.vectorz/` : sa config, sa définition de « prête »,
ses règles propres. Ce nom trompe : le dossier est le contrat du projet avec la méthode, pas avec le
dépôt vectorz. Cette fiche renomme le dossier d'après la méthode, sans casser les projets qui ont
déjà l'ancien nom.

## Contexte

Le 2026-11-01, en rangeant une règle de rétro dans `.vectorz/rules/`, le PO a relevé que ce chemin
« concerne plus mega-city que vectorz ». Le constat :

- Quatre projets ont un dossier `.vectorz/` : vectorz, muti, samplerz, cop1-cobaye.
- Le dossier porte jusqu'à cinq entrées : `config.yml`, `dor.yml`, `rules.yml` et `rules/`,
  `release/` avec `release-passes.yml`.
- Le code de la méthode cite ces chemins une centaine de fois, dans 46 fichiers de `src/`, `bin/`
  et `skills/`.
- Neuf ADR fixent le nom, dont
  [Couche de règles projet-local](../products/mega-city/docs/adr/0050-couche-regles-projet-local.md)
  et [Chemins de process configurables](../products/mega-city/docs/adr/0066-chemins-process-configurables-scrum.md).
- Le fichier écrit par `ezk rules apply` porte le même biais : `.claude/rules/vectorz-project.md`.

## Proposition

À instruire au grooming. Trois questions, dans cet ordre :

1. **Le nom.** Il est au PO. Une piste : `.ezk/`, le nom de la commande que le projet utilise déjà.
2. **La transition.** La méthode lit le nouveau chemin d'abord, puis l'ancien. Un projet qui n'a
   que `.vectorz/` continue de marcher, et la méthode lui dit comment migrer.
3. **La migration.** Un geste par projet, réversible : déplacer le dossier, relancer
   `ezk rules apply`, committer. Pas de renommage silencieux d'un projet hôte.

## Critères d'acceptation

- [ ] Le nouveau nom est tranché par le PO et journalisé dans un ADR qui amende les neuf ADR.
- [ ] Un projet qui n'a que `.vectorz/` garde le même comportement, et reçoit un avertissement qui
      nomme le geste de migration.
- [ ] Un projet qui a les deux dossiers reçoit une erreur claire, pas un mélange silencieux.
- [ ] Les quatre projets connus sont migrés, chacun par un commit à lui.
- [ ] Le fichier écrit par `ezk rules apply` ne porte plus le nom de vectorz.

## Comment vérifier

```bash
ezk --root <projet> config show
ezk --root <projet> rules check
```

Signal observable : les deux commandes rendent le même résultat avant et après la migration d'un projet.

## Notes

- Origine : question du PO pendant la livraison de
  [Une règle de rétro peut rester dans le projet où elle est née](done/20261101154419684_retro-cible-projet.md).
- Priorité P2 donnée par le PO le 2026-11-01.
- Voisin à lire au grooming : le foyer multi-client `.vectorz/mega-city/` de
  [Contenu mono-source, modèle en surcouche](../products/mega-city/docs/adr/0048-contenu-mono-source-modele-en-surcouche.md).
- **Mise en attente le 2026-11-03** (run autonome) : le nouveau nom du dossier est une décision du PO
  (critère 1). Marquée `blocked: deferred` jusqu'à ce nom ; le reste se groome ensuite.
