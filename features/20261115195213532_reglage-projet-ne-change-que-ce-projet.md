---
# id : horodatage AAAAMMDDHHMMSSmmm QUOTÉ (17 chiffres > MAX_SAFE_INTEGER) posé par `add` (scripts/mint-id.sh) — nom <id>_<slug>.md
id: "20261115195213532"
title: Régler un projet ne change que ce projet, et le réglage est enregistré
type: bug
priority: P2
product: cop1
milestone:
version:
labels: [scout, mission-control, config]
status: idea
pr:
evidence: before-after
created: 2026-11-15
---

# 20261115195213532 — Régler un projet ne change que ce projet, et le réglage est enregistré

**En clair.** Dans mission control, deux pages portent la même icône ⚙. L'une règle le projet, l'autre
règle l'outil pour tous les projets. On les confond, et on croit régler un projet alors qu'on touche
tous les autres. En plus, aucune des deux n'enregistre rien : un rechargement efface le changement.
La fiche sépare clairement les deux pages et fait enregistrer le réglage d'un projet dans ce projet
seul.

**Si tu arrives frais.** Mission control est l'écran de pilotage de la méthode (produit cop1). Une
config a deux étages, fixés par l'ADR-074 :

```
Projet  (.vectorz/config.yml, voyage avec le dépôt)
  « le reviewer travaille en tier high »          ← propre à chaque projet
        │
        ▼  traduit par
Outil   (le poste, commun à tous les projets)
  « high = tel modèle, dans tel IDE »             ← valeur par défaut commune
```

Le projet parle en **tiers** : high, middle ou low. L'outil traduit chaque tier en modèle concret.
Analogie : le projet dit « couleur principale », le thème de la machine dit quelle couleur exacte.

## Contexte / Problème

La passe du scout du 2026-11-04 a relevé « réglages ⚙ : écriture d'une config partagée par tous les
projets ». Relecture du code le 2026-11-15 :

1. **Deux entrées, une seule icône.** L'onglet « Configuration » d'un projet porte ⚙. Le bouton de la
   barre du haut porte aussi ⚙, et il ouvre la config de l'outil, commune à tous les projets. Depuis
   un projet, rien ne les distingue au premier coup d'œil.
   - `products/cop1/packages/web/src/board/Board.tsx`, ligne 53 : l'onglet projet.
   - Même fichier, ligne 328 : le bouton de la barre, « Configuration de l'outil (global) ».
2. **Rien n'est enregistré.** Le tier par rôle d'un projet et la table de l'outil vivent dans la
   mémoire de la page. Un rechargement les perd. Aucune commande de la méthode n'écrit la config :
   `ezk config` sait lire, pas écrire un tier.
   - `Board.tsx`, lignes 186 et 189 : deux états en mémoire, sans écriture.

Le besoin du PO, le 2026-11-15 : « si on modifie pour un projet, ça ne doit pas changer pour tous les
autres ». Le modèle de l'ADR-074 le permet déjà. C'est l'écran qui le trahit.

## Proposition

1. **Séparer les deux entrées.** Le bouton de la barre change d'icône et de nom : « Modèles de
   l'outil, pour tous les projets ». L'onglet du projet garde ⚙ et nomme son projet en titre.
2. **Enregistrer le réglage d'un projet dans son dépôt.** Une commande de la méthode écrit le tier
   d'un rôle dans `.vectorz/config.yml` du projet visé. Mission control l'appelle par le daemon, sans
   écrire le fichier lui-même. La méthode reste le seul auteur de ses fichiers (ADR-086).
3. **Montrer d'où vient chaque valeur.** Sur la page du projet, chaque rôle dit « réglé ici » ou
   « défaut ».

Écarté pour l'instant :
- Un projet qui surcharge la table de l'outil. L'ADR-074 la garde en réserve.
- L'enregistrement de la table de l'outil sur le poste. Si le besoin se confirme, il aura sa fiche.

## Critères d'acceptation

- [ ] Depuis un projet, les deux entrées se distinguent à l'icône et au nom.
- [ ] Changer le tier d'un rôle dans le projet A n'affiche aucun changement dans le projet B.
- [ ] Après un rechargement, le tier changé dans le projet A est toujours là.
- [ ] Le changement apparaît dans `.vectorz/config.yml` du projet A, et seulement là.
- [ ] Chaque rôle affiche si sa valeur est réglée dans le projet ou vient du défaut.

## Comment vérifier

À préciser au grooming, une fois la commande d'écriture nommée. Piste : régler un rôle dans un
projet de test, recharger, ouvrir un second projet, puis comparer les deux fichiers de config.

```bash
cd products/cop1/packages/web && pnpm exec vitest run
git -C <projet-A> diff .vectorz/config.yml
```

## Glossaire

- `tier` — un niveau abstrait de modèle (high, middle, low), traduit en modèle concret par l'outil.
- `daemon` — le petit serveur local qui sert les données de la méthode à mission control.

## Notes / décisions

- Source : session du 2026-11-04, `docs/sessions/2026-11-04-run-autonome-sprints-7-26.md`, ligne 33.
- Recadrée le 2026-11-15 par un brainstorm, sur la remarque du PO : chaque projet a sa config.
- Priorité P3 donnée par le PO le 2026-11-15, puis montée en P2 le même jour : l'absence
  d'enregistrement pèse plus que la confusion d'icône (le PO a laissé le choix entre P3 et P2).
- Découpe possible au grooming : séparer les entrées (petit), puis la commande d'écriture (plus gros).
- Décisions liées : ADR-074 (deux étages de config), ADR-086 (mission control lit, la méthode écrit).
