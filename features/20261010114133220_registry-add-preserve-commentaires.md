---
id: "20261010114133220"
title: "registry-add préserve les commentaires d'en-tête du registre de supervision"
type: bug
priority: P2
product: mega-city
milestone:
version: v0.15.0
labels: [supervision, registre]
status: ready
pr:
evidence: none # CLI, pas d'écran
created: 2026-10-10
---

# 20261010114133220 — registry-add préserve les commentaires d'en-tête du registre

**En clair.** Ajouter un projet au suivi (`ezk supervision registry-add <projet>`) réécrit le fichier
de suivi et **efface les 12 lignes de mode d'emploi en haut du fichier** — celles qui expliquent à quoi
il sert et comment le remplir. On veut que ce mode d'emploi survive à l'ajout d'un projet.

**Si tu arrives frais.** Le *registre de supervision* (`supervision.registry.yaml`) est le fichier qui
liste les projets dont la méthode suit les runs. Ses premières lignes sont des commentaires : un mode
d'emploi écrit à la main. Une commande qui ajoute un projet ne devrait pas effacer ce mode d'emploi.

## Contexte / Problème

- Carnet 2026-10-05 : `registry-add samplerz` puis `… muti`, lancés dans le principal de vectorz, ont
  réécrit le registre et effacé son en-tête documenté (`appendRegistryProject`).
- Même famille que « une commande qui mute détruit ce qu'elle n'a pas produit » (règle de rétro du
  2026-10-10). Waiver POC explicite posé à l'époque.
- Issu de la rétro du 2026-10-10 (capture
  [2026-10-10-retro-vue-process-worktree-silences](../docs/captures/2026-10-10-retro-vue-process-worktree-silences.md)),
  proposition 9.

## Proposition

`appendRegistryProject` **préserve** le bloc de commentaires d'en-tête (le lit, le réémet) en ajoutant
une entrée de projet. Un générateur ne détruit pas le non-généré.

## Critères d'acceptation

- [ ] Après un `registry-add`, les lignes de commentaires d'en-tête du registre sont **intactes**.
- [ ] Un test de non-régression pose un registre commenté, ajoute un projet, et vérifie l'en-tête.

## Comment vérifier

```bash
pnpm --dir products/mega-city test   # le test de non-régression sur l'en-tête du registre
```

## Notes

Mesure (retrait) : l'en-tête survit à `registry-add` dans le test, sur les prochaines éditions.
