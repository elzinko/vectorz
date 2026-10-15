---
id: "20261010114133345"
title: "Le cockpit liste le projet de lancement une seule fois (aujourd'hui deux fois)"
type: bug
priority: P2
product: mega-city
milestone:
version: v0.16.0
labels: [ezk-map, cockpit]
status: shipped
pr: "local c26c36b6"
evidence: auto
created: 2026-10-10
---

# 20261010114133345 — Le cockpit liste le projet de lancement une seule fois

**En clair.** Dans la barre « Projet » du tableau de bord, le projet de lancement apparaît **deux
fois**. On veut qu'il n'apparaisse qu'une fois.

**Si tu arrives frais.** Le *cockpit* est la barre qui laisse choisir quel projet le tableau de bord
regarde (`ezk dashboard`, ADR-0062).

## Contexte / Problème

- Carnet 2026-10-05 : « le cockpit liste deux fois le projet du lancement ». Bug d'affichage : le
  projet de lancement, déjà présent dans le registre, est ajouté une seconde fois comme « défaut ».
- Issu de la rétro du 2026-10-10 (capture
  [2026-10-10-retro-vue-process-worktree-silences](../../docs/captures/2026-10-10-retro-vue-process-worktree-silences.md)),
  proposition 10 (bug UI, pas une règle de méthode).

## Proposition

Dé-doublonner la liste des projets de la barre : si le projet de lancement est déjà au registre, ne
pas l'ajouter une seconde fois (le dédoublonnage vit dans la couche pure du cockpit, `renderProjectBar`
/ `loadCockpitProjects`).

## Critères d'acceptation

- [ ] Le projet de lancement apparaît **une seule fois** dans la barre « Projet », qu'il soit ou non
      déjà au registre.
- [ ] Un test de rendu (couche pure) le prouve.

## Comment vérifier

```bash
pnpm --dir products/mega-city test   # le test de rendu de la barre projets
# puis à l'œil : pnpm --dir products/mega-city ezk:map → la barre « Projet » (une occurrence du lancement)
```

## Notes

Mesure (retrait) : le projet de lancement apparaît 1 fois dans le test de rendu.
