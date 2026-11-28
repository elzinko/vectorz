---
date: 2026-11-02
session: "main / vectorz"
type: friction
---

# ezk-scout : isoler HOME ne protège pas node_modules

Le 2026-11-02, une passe ezk-scout sur mission control a pointé HOME et XDG_* vers un dossier temporaire, comme le demande l'étape 2 du skill (products/mega-city/skills/ezk-scout/SKILL.md). Effet de bord : corepack n'a plus trouvé son cache, a téléchargé pnpm 12, et ce pnpm a réinstallé le node_modules du dépôt de travail avant de lancer le script. La garde find-only ne l'a pas vu, car node_modules est ignoré par git.
Corrigé à la source pour vectorz par l'épingle packageManager (commit 38de13e9). Reste pour la méthode : la table d'isolation d'ezk-scout ne cite ni les dépendances installées ni le gestionnaire de paquets. Piste : ajouter une ligne « dépendances (node_modules, magasin pnpm) » et recommander de sonder depuis une copie du dépôt quand l'app s'installe au lancement.
