---
date: 2026-10-05
session: "main / vectorz"
type: friction
---

# registry-add efface les commentaires du registre

Le 2026-10-05, `ezk supervision registry-add samplerz …` puis `… muti …`, lancés dans le dossier
principal de vectorz, ont réécrit `supervision.registry.yaml` et effacé ses 12 lignes de commentaires
d'en-tête (celles qui expliquent le registre et son invariant « aucun chemin de journal »). Le code
l'annonce (`appendRegistryProject`, « commentaires du fichier perdus, acceptable pour le POC »). Les
commentaires ont été remis à la main avant le commit (5bf06faf).

Piste : ajouter l'entrée sans réécrire le fichier (parseDocument de `yaml` garde les commentaires).
