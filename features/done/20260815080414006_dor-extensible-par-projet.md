---
id: "20260815080414006"
title: "Critères de « prête » (DoR) adaptables par projet"
type: feature
priority: P3
product: mega-city
version: v0.4.0
milestone: rationalisation
labels: [backlog]
status: shipped
pr: "#307"
created: 2026-08-15
---

# DoR extensible par projet

## En clair

La « prête » (DoR, Definition of Ready) est la même dans tous les dépôts. Elle compte trois critères (problème, valeur, critères d'acceptation) et un conditionnel (dépendances externes). Elle est écrite en dur dans le skill. Un projet ne peut pas y ajouter un critère sans l'imposer à tous les autres.

On ajoute un petit fichier par projet : `.vectorz/dor.yml`. Il déclare les critères en plus. Le premier : « surfaces impactées » (doc, site, notes de version). `groom` fait remplir ces critères. `ready` refuse la fiche s'ils sont vides. Sans ce fichier, rien ne change.

Le même fichier fixe un seuil de lot (`min-ready`) : quand il y a trop peu de fiches prêtes, l'ouverture d'un sprint dit « groomez d'abord ».

Pour toi : tu déclares une fois ce qui compte pour ton projet. Chaque fiche est ensuite interrogée dessus, sans toucher au skill global.

## Contexte / Problème

Le « prêt » varie selon le projet. Un produit à vitrine veut un slot « surfaces impactées ». Une librairie veut un « contrat d'API publique + note de migration ». Un produit data veut une « disponibilité des données constatée ».

Aujourd'hui, ajouter un critère veut dire éditer le skill **global**. Il vaut alors pour tous les dépôts, ou pour aucun. Pas de milieu.

Symptôme vécu (samplerz, 2026-08-10) : des fonctions livrées sans que personne demande « et le site ? et la doc ? ». Le site vitrine a dérivé du produit. Un audit d'écarts a dû être lancé après coup.

## Proposition (arbitrages du grooming)

On compose l'existant : [ADR-0001] le script range, le LLM juge ; [ADR-0013] pas de couche neuve ; [ADR-0050] `.vectorz/` est la couche projet.

1. **Où.** `.vectorz/dor.yml`, à côté de `config.yml` et `rules.yml`, commité sur `main`. Un exemple documenté : `.vectorz/dor.example.yml`.
2. **Forme, sans mini-langage.** Une liste `slots`. Chaque slot a un `id`, un `heading` (le titre de section attendu dans la fiche), une `ask` (la question à trancher) et, au choix, des `items` (la liste à balayer, par exemple les surfaces). Un bloc `health.min-ready` optionnel porte le seuil de lot.
3. **Qui fait quoi.** Le script `ezk dor check <id>` vérifie le **mécanique** : la section existe, elle n'est pas vide, elle mentionne chaque item. Le LLM de `groom` et `ready` juge le **fond** : la réponse tient-elle ? Le script ne note jamais la qualité.
4. **Opt-in franc.** Un slot déclaré **bloque** `ready` s'il est vide. Un slot non déclaré est absent : zéro bruit. Le socle 3+1 reste inchangé dans le skill.
5. **Santé du lot** (reprend [`0100`](0100-sprint-intake-sante-backlog-metriques.md)). `ezk dor health` compte les fiches prêtes et pas prêtes (statut `idea`, hors épics). Avec `health.min-ready`, sous le seuil : code 1 et « groomez d'abord ». `next --ready-only` rappelle ce seuil.
6. **Slot réel : « Surfaces impactées »** (reprend [`20260812104022231`](20260812104022231_dor-balayage-surfaces-produit.md)). Un balayage à 30 secondes : pour chaque surface listée, oui, non, ou comment. Ce n'est pas une étude d'impact, sinon il sera sauté.
7. **Décision d'archi.** Un amendement court à [ADR-0016](../../products/mega-city/docs/adr/0016-rituels-scrum-cycle-de-vie-backlog.md) (le gate DoR est son objet), pas un ADR neuf. La liste des statuts reste dans le schéma typé : seuls les slots de DoR deviennent propres au projet.

## Critères d'acceptation

Reste réel :

- [x] Un projet déclare ≥ 1 slot dans `.vectorz/dor.yml`. Un fichier mal formé est refusé avec un message qui nomme le champ fautif. Preuve : `dor-manifest.test.ts`, « nomme le champ fautif ».
- [x] `ezk dor check <id>` rend le code 1 et nomme les slots vides ou incomplets (section absente, vide, ou item non mentionné). Il rend 0 quand tous les slots déclarés sont remplis. Preuve : `dor-command.test.ts`, groupe `ezk dor check`.
- [x] Sans `dor.yml` : code 0 et « socle 3+1 seul ». Aucune régression.
- [x] `ezk dor show` liste les slots déclarés (id, titre attendu, question) et le seuil.
- [x] `ezk dor health` donne prêtes / pas prêtes. Avec `health.min-ready`, il rend 1 sous le seuil.
- [x] `ezk-backlog groom` remplit les slots déclarés. `ready` appelle `ezk dor check` et **refuse avec motif** s'il rend 1 (texte du skill). Preuve : texte du skill, sections « La DoR du projet », `groom`, `ready`.
- [x] Le slot « Surfaces impactées » existe en exemple (`.vectorz/dor.example.yml`) avec une liste de surfaces.
- [x] Amendement ajouté à ADR-0016.
- [x] Tests : cœur pur (lecture, vide / incomplet / ok, santé), commande en mémoire, entrées du manifeste `ezk`. 42 tests.

Déjà livré (absorbé, avec preuve) :

- [x] Réconciliation fiches ↔ PR mergées à l'intake : sous-commande `reconcile` d'`ezk-backlog` (ADR-0018).
- [x] Garde « aucune fiche ready » : checkpoint d'`ezk-product-build` (SKILL.md, étape de tirage).

## Comment vérifier

1. Dans un dossier d'essai, copier `.vectorz/dor.example.yml` en `.vectorz/dor.yml`. Lancer `ezk dor show` : le slot « Surfaces impactées » apparaît.
2. Sur une fiche sans section « Surfaces impactées » : `ezk dor check <id>` rend 1 et dit quoi remplir. Ajouter la section avec une ligne par surface : il rend 0.
3. **Sabotage.** Retirer `dor.yml` : `ezk dor check <id>` rend 0 sans rien exiger.
4. Avec `health.min-ready: 3` et une seule fiche prête : `ezk dor health` rend 1.
5. Tests : `pnpm --dir products/mega-city exec vitest run src/core/__tests__/dor-manifest.test.ts src/__tests__/dor-command.test.ts`.

## Suite (hors POC)

- Slots « indépendance / concurrence » et « estimation » : parqués, à construire quand un projet les réclame.
- Appairage DoR → DoD : le slot rempli alimente la checklist de clôture d'`ezk-sprint` (étapes 9 et 10).
- Émission `backlog.health` vers la supervision (moitié monitoring de `0100`) : parkée.
- `regen` qui affiche « slots définis / remplis » : dépend des vues hors git (ADR-0055).
- Règle `rules/` pour rendre la loi opposable hors `ezk-backlog`.

## Notes / décisions

- Reprend l'ancienne « épine de l'épic » [[20260815080413884]] ; `20260812104022231` en est le premier slot concret.
- Compose : `ezk-backlog` (groom / ready / next), la couche `.vectorz/`, `ezk-retro` (la DoR reste évolutive par rétro).
- Anti-sur-outillage : si le manifeste vire au mini-langage, c'est le signal de s'arrêter ([ADR-0013] §4). On commence par un slot réel, pas par un framework de slots.
- Origine : session 2026-08-15 (audit méthode), décision PO « DoR de base extensible par projet ».

## ⤓ Absorbe (tri du 2026-09-30)

Cette fiche reprend le périmètre de :

- [`0100`](0100-sprint-intake-sante-backlog-metriques.md) — santé du backlog à l'ouverture d'un sprint. Intégré : le seuil de lot et le décompte prêtes / pas prêtes. Le volet « réconcilier » était déjà livré. L'émission vers la supervision reste parkée.
- [`20260812104022231`](20260812104022231_dor-balayage-surfaces-produit.md) — balayage des surfaces impactées. Intégré : premier slot réel.
