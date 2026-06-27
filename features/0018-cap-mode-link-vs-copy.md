---
id: 0018
title: coquille I/O — mode link vs copy (porter le symlink live-update de claude-skills)
type: feature
priority: P1
status: todo
pr:
created: 2026-06-27
---

## Contexte / Problème
ADR-0006. La coquille I/O de mega-city (`src/io/apply.ts`) ne fait que **copier** des
fichiers. `claude-skills` symlink par défaut → un `git pull` met à jour **partout**
instantanément (capacité que l'utilisateur apprécie). `--copy` y fige un snapshot. Pour
remplacer `install.sh` sans régression, mega-city doit offrir les **deux modes**.

## Proposition
Ajouter un mode de matérialisation `link | copy` à la coquille I/O (option du cap ou champ
de plan). `link` = symlink vers la source du catalogue (live) ; `copy` = écriture figée
(actuel). Non-destructif dans les deux cas : remplace uniquement sa propre entrée (mirror de
`link_or_copy` de claude-skills). Défaut : `copy` par-projet, `link` pour le global (0017).

## Critères d'acceptation
- [ ] mode `link` → symlink vers la source ; mode `copy` → fichier figé
- [ ] choix explicite (option), pas de magie ; documenté
- [ ] non-destructif : ne remplace que sa propre entrée, jamais un vrai fichier tiers
- [ ] testé en temp dir pour les deux modes

## Notes
S'articule avec 0010 (intention par fichier) et 0017 (global). Couplage live assumé pour le
global (cf. « à revisiter » ADR-0006).
