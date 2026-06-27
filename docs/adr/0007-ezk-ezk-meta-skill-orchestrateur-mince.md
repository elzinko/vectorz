# ADR 0007 — `ezk-ezk` : méta-skill orchestrateur mince, rangement déterministe

- Statut : **proposé**
- Date : 2026-06-27

## Contexte

Fiche 0021 : productiser le déroulé manuel « brainstorm → archi → skill → déploiement ».
Risque principal : réimplémenter ce que `skill-creator` (anthropic-skills) fait déjà
(rédaction/validation/packaging du SKILL.md), et faire « ranger » le LLM — l'anti-pattern
banni par ADR-0001 §2 (« le LLM ne range jamais »). Destination déjà tranchée par ADR-0006
(mega-city `skills/` = seul write-target). Reste à fixer **la structure** et **la frontière
script/LLM** du skill.

## Décision

1. **Un seul dossier `skills/ezk-ezk/`** = `SKILL.md` (playbook, `description`-déclencheur) +
   `scripts/deploy.sh`. Pas de BRIEF.md ni README racine (conventions du repo *claude-skills*,
   gelé par ADR-0006) — on suit la convention mega-city : un skill = `SKILL.md` + `scripts/`
   optionnels (cf. `skills/README.md`, précédent `ezk-archive`).
2. **Orchestrateur mince, pas de cathédrale.** `ezk-ezk` **compose**, ne réimplémente rien :
   il appelle `product-management:product-brainstorming`, `engineering:architecture`, puis
   **délègue la fabrication/validation du SKILL.md à `skill-creator`** (idiome `ezk-archive`
   → `ezk-backlog` : « l'appelle, ne réimplémente pas »). Sous-commandes :
   `help | harvest | create | deploy`.
3. **Flux encodé en prose dans le playbook** (LLM, jugement) : (a) récolte ≤ 3 sujets du
   **contexte de session courant** + champ libre ; 1 seul → confirmation ; (b) résumé +
   questions, boucle valider/refuser/compléter **avant toute génération** ; (c) compose les
   sous-skills pour produire le contenu ; (d) destination demandée, **défaut mega-city**
   (ADR-0006). Garde-fou : « n'invente jamais un sujet absent de la conversation ».
4. **Frontière déterministe/LLM (ADR-0001 §2), non négociable.** Le LLM **rédige/juge/oriente**
   (via les sous-skills) ; **`scripts/deploy.sh` fait SEUL le rangement mécanique** : crée
   `skills/<name>/`, écrit le SKILL.md fourni, symlink non-destructif vers `~/.claude/skills/<name>`
   (ne retire que son propre symlink ou un skill homonyme déjà déployé ; **refuse** un vrai fichier
   utilisateur et un `<name>` contenant `/`/`..` — anti-traversal ; idempotent — cf. install.sh),
   pré-condition stricte « source contient un SKILL.md sinon skip ». Read-only sauf ses propres
   artefacts. Aucune décision de contenu dans le script.
5. **Reload : verdict honnête encodé.** Un skill fraîchement symlinké n'est **pas** visible
   dans la session en cours (énumération cachée au démarrage). `deploy` émet
   systématiquement le fallback : « lance `/reload-skills` pour l'activer sans quitter la
   session ; sinon il sera pris au prochain démarrage ». Pas de nouvelle session requise.

## Conséquences

**Plus facile** — un seul fichier de logique métier (le playbook) + un script trivial testable ;
zéro dérive vis-à-vis de `skill-creator` (mis à jour en amont) ; rangement déterministe donc
reproductible et non destructif.

**À surveiller** — `/reload-skills` peut varier selon la version de Claude Code / l'hôte (d'où
« si possible » dans 0021) ; ne pas hardcoder le chemin de `skill-creator` (cache versionné) —
le résoudre par capacité. Le script reste mince : s'il grossit (multi-hôtes), le porter vers
le `bind`/`cap` du cœur plutôt que d'épaissir le skill.

## Alternatives écartées

- **Réimplémenter rédaction/validation/packaging dans `ezk-ezk`** — duplique `skill-creator`,
  dérive en amont. Rejeté (compose, ne réinvente pas).
- **BRIEF.md + ligne README (convention claude-skills)** — repo gelé par ADR-0006, validation
  inapplicable à mega-city. Rejeté (YAGNI).
- **Laisser le LLM créer le dossier + symlink lui-même** — viole ADR-0001 §2 (« le LLM ne range
  jamais »), non reproductible. Rejeté.
