---
date: 2026-09-12
session: run ezk-product-build « boucle auto-amélioration »
type: friction
---

# Codex attrape des P1 réels que la revue locale (architect + reviewer) laisse passer

**Symptôme.** 5 findings Codex sur les 3 PR du run, plusieurs **P1**, après un `ezk-reviewer`
qui avait déjà rendu **GO** :
- #228 — invocation `sprint:report` fausse (script inexistant à la racine, slug/`--out` manquants) ;
- #229 — reprise de boucle manquante après une rétro `every:N` mid-run ; **double-`add`**
  (ezk-retro range déjà ses sorties) ;
- #230 — dossier `traitees/` inexistant au 1er `git mv` ; point 9 absent du **contrat de l'agent** ezk-archive.

Deux classes récurrentes : **une commande citée n'existe pas / a une mauvaise signature**, et
**un contrat inter-skills** (qui range/écrit quoi, sans doublon).

**Leçon.** Garder Codex dans la boucle (il lit le diff autrement) ET renforcer `ezk-reviewer`
local sur ces 2 classes : vérifier que chaque invocation **résout vraiment** (script + args) et
que les **contrats inter-skills** ne se doublonnent pas.

**Piste.** Enrichir la fiche `20260905134937885` (revue locale vs Codex — benchmark) avec ces mesures.
