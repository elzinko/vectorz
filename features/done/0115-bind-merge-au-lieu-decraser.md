---
id: 0115
title: bind — fusion non-destructive (intention + bloc managé) au lieu d'écraser
type: feature
priority: P0
product: mega-city
status: shipped
pr: local (squash-merge)
created: 2026-06-26
---

## Contexte / Problème
Le `bind` actuel **écrase** un `CLAUDE.md` et un hook `.git/hooks/commit-msg`
existants (`src/caps/claude-code.ts` + `src/io/apply.ts`), sans backup ni
avertissement. C'est une violation de la **2ᵉ contrainte dure d'ADR-0001
(« ne rien casser »)** et une **régression** vs l'outil prédécesseur `iamthelaw`,
qui gère déjà ce cas proprement.

**Gate d'usage** (→ repriorisé P0) : tant que ce n'est pas fait, `bind` ne doit
servir que sur des **projets jouets**. À faire avant toute utilisation réelle.

## Oracle — ce que fait iamthelaw (à porter, en mieux)
`iamthelaw/src/commands/setup.ts:83-100` : il n'écrit **jamais** le contenu dans
`CLAUDE.md` ; il y injecte un **pointeur d'une ligne** vers `ENTRY.md` (le seul
fichier qu'il possède). Logique à 4 branches :
1. fichier absent → créer depuis template ;
2. déjà référencé → **ne rien faire** (idempotent, détecté par `includes()`) ;
3. existant sans ref → **append** la ligne de référence (préserve tout le contenu) ;
4. `--force` → remplacer.
Commands/agents : **skip-if-exists** sauf `--force`.
**Limite d'iamthelaw à dépasser** : détection par sous-chaîne, **pas de bloc
délimité** → il sait *ajouter une fois* mais ni **mettre à jour** ni **retirer**
son injection. Ici : marqueurs de bloc pour gagner update + remove.

## Proposition (réconcilie la critique avec ADR-0003)
On garde le split plan-pur / coquille-I/O. Le merge exige de **lire l'état du
projet** — donc on déplace cette lecture dans la coquille, pas dans le plan :
- **Le plan déclare une INTENTION par fichier** (`FileWrite.mode`) :
  - `replace` : fichier que le cap **possède** (`.iamthelaw/ENTRY.md`, `.claude/agents/*`) ;
  - `managed-block` : fichier **partagé avec l'humain** (`CLAUDE.md`) → (ré)écrire
    UNIQUEMENT entre marqueurs `<!-- iamthelaw:start --> … <!-- iamthelaw:end -->`,
    le reste préservé ;
  - `skip-if-exists` : hooks → ne pas écraser un existant qui diffère sans `--force`
    (sinon backup `<stage>.bak` ou refus explicite avec message).
- **La coquille I/O lit l'état du projet et fusionne** selon l'intention. Idempotent.
- **`--force`** : escape hatch explicite, idéalement **par-cible** (pas seulement global).
- **Déterminisme préservé** : le plan (intention + contenu) reste **pur, testable
  sans disque** ; la fusion vit dans la coquille, **testée en temp dir** avec des
  fichiers préexistants.

## Critères d'acceptation
- [ ] `FileWrite` porte un `mode` (`replace` | `managed-block` | `skip-if-exists`) ; calcul du plan pur, testé sans FS
- [ ] un `CLAUDE.md` existant conserve 100 % de son contenu hors bloc ; seul le bloc managé est (ré)écrit
- [ ] idempotent : deux `bind` successifs ne dupliquent pas le bloc ; un changement du contenu du bloc est ré-rendu
- [ ] un hook `commit-msg` perso n'est jamais écrasé silencieusement (backup ou refus ; `--force` pour forcer)
- [ ] la lecture de l'état projet + la fusion vivent **uniquement** dans la coquille I/O
- [ ] test bout-en-bout : `bind` sur un projet jouet **avec** `CLAUDE.md` + hook préexistants → rien de perdu

## Notes
- Distinct de F1 (déjà corrigé) : ici la cible est *dans* le projet, dégât borné mais réel.
- Le marqueur de bloc (`iamthelaw:start/end`) doit être un identifiant **stable, réutilisable par tous les caps**.
- Candidate **dogfooding (0007)** : règle « un cap ne détruit jamais un fichier existant du projet hôte ».
- Repriorisé P1 → **P0** le 2026-06-27 (gate d'usage, cf. critique de la régression vs iamthelaw).
