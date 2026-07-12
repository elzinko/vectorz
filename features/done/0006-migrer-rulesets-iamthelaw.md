---
id: 0006
title: migrer les rulesets iamthelaw vers rules/ + bundles/ (périmètre complet)
type: chore
priority: P1
status: shipped
pr: local (squash-merge)
created: 2026-06-26
---

## Contexte / Problème
Le repo `iamthelaw` détient encore l'essentiel de LA LOI : **10 rulesets, 53 règles,
11 enforcements typés** (7 agent-check, 3 hook, 1 prompt — rafale du 2026-06-11 :
enforcer.ts, ruleset token-economy) et les
**3 seuls hooks exécutables** du portefeuille (commit-msg, pre-commit typecheck, pre-push
CI-locale). mega-city n'a repris que 2 règles — et `rules/conventional-commits.md` déclare un
`hooks/commit-msg.sh` qui n'existe nulle part dans ce repo. Périmètre acté par ADR-0010.

## Proposition
Atomiser les 10 rulesets (architecture 9, development 7, typescript-2026 6, ci-cd 6,
clean-code 5, hexagonal 5, token-economy 5, testing 4, documentation-guidelines 4,
conventional-commits 2) :
- 1 règle = 1 fichier `rules/` (markdown + frontmatter `kind/level/enforcements`) ;
  conversion mécanique `content → corps`, `level → level`, enforcement typé → enforcement
  typé (porter `title`/`tags` en frontmatter si utiles) ;
- 1 ruleset = 1 bundle `bundles/` ;
- les 3 hooks rapatriés comme assets d'enforcement dans le catalogue (chemin déclaré par
  `enforcement.hook.script` — couplé à la fiche 0011) ;
- réconcilier les 2 règles déjà réécrites (clean-code/no-dead-code, conventional-commits).

**Ne migrent PAS** (ADR-0010 §3) : CLI/installeur, générateur ENTRY.md, module
import/export, target Cursor (abandonné), layout `.iamthelaw/`.

## Critères d'acceptation
- [ ] les 53 règles existent dans `rules/` avec frontmatter valide (id, kind, level, enforcements)
- [ ] 10 bundles dans `bundles/`, chargés par `expand` sans erreur
- [ ] les 3 hooks exécutables vivent dans le catalogue et `rules/conventional-commits.md` ne pointe plus dans le vide
- [ ] le hook émis au bind pour chaque stage déclaré provient du script migré — fiche 0011 REQUISE pour tout bundle portant des hooks pre-commit/pre-push (sans elle, `collectHooks` émettrait le script commit-msg à ces stages : contenu activement faux)
- [ ] `bind` d'un profil tirant ces bundles est déterministe (byte-for-byte)
- [ ] `iamthelaw` d'origine intact (le gel/archivage = fiche 0035)

## Notes
ADR-0010. Bloque : 0035 (archivage) et 0016 (cap cop1). **Bloquée partiellement par 0011**
(dériver le hook d'`enforcement.hook.script`) : les bundles typescript-2026 et ci-cd ne
peuvent pas être bindés avec leurs hooks avant. Les modes TDD/testing alimentent aussi la
fiche 0045 (ezk-dev, méthode en rules par profil).
