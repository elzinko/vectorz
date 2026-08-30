---
id: "20260830110131228"
title: Schéma d'étapes de skill — étapes configurables/réordonnables par composition (extension ADR-0040)
type: feature
priority: P3
product: mega-city
version:
epic:
status: idea
ready:
pr:
created: 2026-08-30
---

# 20260830110131228 — Schéma d'étapes de skill : étapes configurables

## En clair

Aujourd'hui la **boucle** d'un skill est écrite en **prose** (ex. les étapes 0→9 d'`ezk-sprint`).
On ne peut donc ni **activer/désactiver** une étape, ni **changer son ordre** de façon
déclarative. L'idée : donner aux **étapes** un **schéma** (comme on l'a déjà fait pour les
fiches et le graphe de liens), pour les rendre configurables par composition.

## Contexte / Problème

Le repo a déjà une vraie fondation « format » — mais elle porte sur les **fichiers** et les
**liens**, pas sur les **étapes** :

- **ADR-0040** — modèle de fichiers ezk : schéma typé (`domain.ts`), graphe de liens compilé
  (`graph:compile`), validateur (`fiches:check`). Couvre skills, agents, règles, fiches.
- **ADR-0039** — trois étages (moteur / méthode / plugins) rangés dans un fichier de données
  validé ; modèle d'extension plugin **livré** (fiche 0170).
- **ADR-0012 / 0025** — composition inter-skills via le champ `composes:` (compilé au graphe).
- **Skema** (Skill Schema Migrations) — `layout_version` + migrations, mais **une seule skill**
  couverte pour l'instant.
- **ADR-0029** — la fiche est le document, la PR en est le rendu.

**Le trou.** Rien ne modélise la **séquence d'étapes** d'un skill comme de la donnée. Donc
« configurer les étapes, changer l'ordre, en sauter une » n'est pas possible proprement — c'est
un jugement en prose à chaque fois (cf. le flag `--review` de la fiche sœur, qui est un cas
particulier codé à la main faute de ce schéma).

## Proposition (direction, à cadrer)

Étendre le modèle compilé d'ADR-0040 aux **étapes d'un skill** : une étape = un objet typé
(nom, rôle délégué, obligatoire/optionnel, position). La boucle devient de la donnée validée,
que la composition peut **reconfigurer** (activer/sauter/réordonner) sans réécrire la prose.
Le **format est la première marche** ; la reconfiguration vient après.

## Critères d'acceptation

- [ ] À définir au grooming — **confrontation obligatoire au backlog existant via un panel
      `ezk-architect` + `ezk-pm`** (demande PO du 2026-08-30). Vérifier le recouvrement avec
      ADR-0040, ADR-0039, Skema et l'épic `dor-agent-native-extensible-observable`.

## Notes / décisions

- **Statut `idea`** : direction non mûre, à confronter avant tout build. Se pose **sur**
  ADR-0040, ne le refait pas.
- Cas particulier déjà demandé : `--review adverse|skip` (fiche 20260830110131158) — le schéma
  le généraliserait.
- Origine : revue de conception `ezk-product-build` (session 2026-08-30).
