---
# id : horodatage AAAAMMDDHHMMSSmmm QUOTÉ (17 chiffres > MAX_SAFE_INTEGER) posé par `add` (scripts/mint-id.sh) — nom <id>_<slug>.md
id: "0000"
title: <titre court et parlant>
type: feature # feature | bug | refactor | chore | epic
priority: P2 # P0 | P1 | P2 | P3
product: # obligatoire dans un monorepo — sinon omettre
epic: # optionnel — id de la fiche épic parente (type: epic)
status: idea # idea | ready | in-progress | blocked | shipped
ready: # YYYY-MM-DD — posée par le gate `ready <id>` ; vide = non groomée
pr: # ex. "#123" quand une PR existe
evidence: # before-after | auto | none — preuve d'écran avant/après en PR (règle development/pr-before-after-media) ; vide = auto
created: <YYYY-MM-DD>
---

# <id> — <titre>

**En clair.** <L'essentiel en ≤ 3 phrases, AVANT le détail : symptôme vécu → proposition en
mots simples → effet concret pour le lecteur. Sans jargon interne. Règle
`human-facing-lisibility` — cette fiche EST le document ; le corps de PR en sera le **rendu**
(ADR-0029), donc écris-la pour être lue telle quelle.>

**Si tu arrives frais.** <1–2 lignes : le vocabulaire projet minimal pour lire cette fiche sans
contexte — ce qu'est le composant/produit concerné et le(s) terme(s)-clé(s). Retire cette ligne si
la fiche n'introduit aucun terme spécifique.>

## Contexte / Problème

<Ce qui ne va pas ou ce qu'on veut, et pourquoi ça compte. Pour un bug : symptôme
observé + reproduction.>

## Proposition

<L'approche envisagée. POC d'abord, polish ensuite.>

## Critères d'acceptation

- [ ] <comportement observable et vérifiable>
- [ ] <…>

## Comment vérifier

<Comment un tiers constate que c'est fait : commandes littérales rejouables depuis un clone
frais, OU preuves agent (screenshots / before-after) pointant vers des scripts npm / BDD
**existants**. C'est ce que la PR affichera **tel quel** (rendu de la fiche + matrice
Validation) — ne pas le réécrire côté PR. Ne pas recopier le Gherkin : orienter et lier.>

```bash
# ex. pnpm --dir <pkg> test -- <chemin pertinent>
```

## Glossaire

<CONDITIONNEL : obligatoire si la fiche emploie du jargon interne, un sigle ou un terme inventé
(règle `human-facing-lisibility` : le jargon ne porte jamais le sens hors glossaire). Retire toute
la section si la fiche n'emploie aucun jargon. Une entrée par terme, définie une fois.>

- `<terme>` — <définition en clair, une phrase>

## Notes / décisions

<Hypothèses, risques, liens (ADR, PR, issues).>
