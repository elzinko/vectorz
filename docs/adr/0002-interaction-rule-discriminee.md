# ADR-0002 — Interaction = `Rule` discriminée, pas une entité (et comment ça évolue sans casser)

**Status :** Proposed
**Date :** 2026-06-25
**Deciders :** elzinko

## Context

Le domaine (cf. ADR-0001, `docs/domain.ts`) distingue deux choses :
- des **dispositions** : contraintes sur un **artefact** (code, commit, PR) — « pas de code mort » ;
- des **interactions** : protocoles de **collaboration entre agents** — « le reviewer valide avant merge ».

Question : `Interaction` doit-elle être une **entité de première classe**, ou une **`Rule` taguée** ?

Contrainte **dominante et explicite** : le modèle doit pouvoir **évoluer sans tout casser** ; le
domaine n'est pas encore figé. Question secondaire tranchée au passage : `Skill` vs `competence`.

## Decision

1. **`Interaction` = `Rule` discriminée** par `kind: 'disposition' | 'interaction'`, plus un champ
   **`participants?: string[]` optionnel**. Pas de seconde entité aujourd'hui.
2. **`Skill` reste l'entité** ; `competence` = l'**association** `agent → skill` (liste d'ids). Pas d'entité `Competence`.
3. Invariant de domaine posé : **`Agent` capitalise** (`competences` + `interactions`, là où `capture` écrit) ;
   **`Profile` compose** (`bundles` + `agents` + `skills` + `interactions`).

## Options Considered

### Option A — `Rule` discriminée (`kind`) + `participants?` optionnel  _(recommandée)_
| Dimension | Évaluation |
|-----------|------------|
| Complexité | **Faible** (une entité, un champ discriminant) |
| Coût | Faible |
| Évolutivité | **Élevée** (le tag = la couture de promotion ; référence par id intacte) |
| Expressivité | Moyenne (la prose porte le sens, `participants` latent) |

**Pour :** partage `level` + `content` + `enforcements` avec `Rule` (4 champs sur 5) ; rétro-compatible
(`kind` par défaut = `disposition`) ; le tag suffit à distinguer/filtrer/promouvoir plus tard.
**Contre :** un coût de **discipline** (poser `kind` ; ne pas éparpiller les `if kind === …`).

### Option B — `Interaction` entité de première classe **maintenant**
| Dimension | Évaluation |
|-----------|------------|
| Complexité | **Élevée** (2ᵉ catalogue `interactions/`, resolver, validation, migration) |
| Évolutivité | **Faible** _(paradoxalement)_ |
| Expressivité | Élevée (`participants` / `trigger` / `protocol` structurés) |

**Pour :** structure riche, validation possible immédiatement.
**Contre :** **fige une structure non validée** → tu la casseras à mesure que tu apprends = l'**inverse**
de « évoluer sans casser ». Sur-ingénierie sur un domaine non figé.

### Option C — `Rule` en prose, **sans** `kind` ni `participants`
| Dimension | Évaluation |
|-----------|------------|
| Complexité | **Minimale** |
| Évolutivité | **Faible** |

**Pour :** minimalisme absolu.
**Contre :** **détruit la couture** — impossible de distinguer/filtrer/promouvoir une interaction sans
**relire la prose** (LLM, non déterministe). On économise un champ et on perd tout le chemin d'évolution.

## Trade-off Analysis

Le critère décisif est l'**évolutivité**. Résultat contre-intuitif : **B, l'entité « propre », est la
MOINS évolutive** — parce qu'elle s'engage tôt sur une forme (`participants`/`trigger`/`protocol`)
non validée, que chaque apprentissage casse. **A** ajoute le **strict minimum** (un tag) pour garder la
porte ouverte et **diffère** la structure coûteuse jusqu'à preuve d'usage. A = « évoluer sans casser », littéralement.

**Ce qui rend A non-breaking tient à 2 invariants — à tenir, sinon la garantie tombe :**

1. **Référencer par `id`, jamais par embarquement.** `agent.interactions` et `profile.interactions`
   tiennent des **ids**. Promouvoir `Interaction` en entité = changer **où** l'id se résout
   (`rules/` → `interactions/`), pas les détenteurs. **L'identité est le contrat stable ; la structure
   est libre d'évoluer derrière l'id.**
2. **Centraliser la discrimination `kind` en UN endroit** (le resolver). Si `if kind === 'interaction'`
   s'éparpille dans le code, la promotion devient une chasse multi-site. Un seul point de vérité sur
   « où vit chaque `kind` ».

Le jour de la promotion, la **migration est déterministe et bornée** : déplacer les rules `kind:interaction`
vers `interactions/`, rendre `participants` requis ; le `journal/` garde l'historique. Scriptable, testable.

## Consequences

- **Plus facile** : ajouter une interaction (une `Rule` `kind:interaction`) ; lister/filtrer les
  protocoles d'équipe (grâce au tag) ; promouvoir en entité plus tard (grâce à la couture par id).
- **Plus dur** : quasi rien ; un coût de **discipline** (poser `kind`, défaut rétro-compatible,
  discrimination centralisée).
- **À revisiter quand** UN de ces 3 comportements devient réel → alors promotion en entité `Interaction` :
  (a) **valider** que `participants` ⊂ agents du profil ; (b) **dériver le graphe** de collaboration ;
  (c) **enforcer un handoff** (hook/agent-check qui vérifie le passage de relais).

## Action Items

1. [ ] `domain.ts` : ajouter `RuleKind`, le champ `kind`, le champ optionnel `participants?`.
2. [ ] Loader : défaut `kind = 'disposition'` si absent (rétro-compat des règles existantes).
3. [ ] Taguer les seeds (`clean-code` = `disposition`).
4. [ ] Inscrire les **2 invariants** (référence-par-id, discrimination centralisée) comme contraintes
       du repo — candidates à devenir des règles `iamthelaw` (dogfooding).
5. [ ] `capture --interaction` écrira `kind: interaction`.
