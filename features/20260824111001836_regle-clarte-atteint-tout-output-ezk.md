---
id: "20260824111001836"
title: La règle de clarté doit atteindre TOUT ce qui sort de la méthode (base + sorties de chat), pas rester orpheline
type: refactor
priority: P1
product: mega-city
version:
epic:
status: idea
ready:
pr:
created: 2026-08-24
---

## En clair

La règle « tout ce qu'un humain lit doit être clair » **existe déjà**
(`documentation-guidelines/human-facing-lisibility`, niveau MUST). Mais elle est dans un
bundle que **AUCUN profil n'inclut** — donc elle ne s'applique à personne. Résultat : rien
ne garantit qu'un agent ou un skill ezk restitue clairement. Cette fiche demande de la
**câbler dans `base`** (héritée par tous) et d'**étendre sa portée aux sorties de chat**
(explication de fin de tour, résumé de session), pas seulement aux artefacts écrits.

> Anti-doublon : ce n'est PAS une nouvelle règle. C'est **corriger le câblage** de la
> règle existante + élargir son scope. Priorité **P1 proposée** (enjeu churn — la clarté
> est le critère n°1 du PO), à confirmer.

## Contexte / problème (constaté le 2026-08-24)

Demande PO : « ajouter une règle à la base de chaque agent et/ou skill afin que tout ce
qui sort de la méthode scrum mega-city (ezk) soit très clair — features, explication en
retour de chaque LLM, retour de la session en cours… ».

État réel vérifié :

- La règle `documentation-guidelines/human-facing-lisibility` existe (MUST, enforcement
  `agent-check` → `ezk-reviewer`).
- Elle vit dans `bundles/documentation-guidelines.yml`.
- **`grep -l documentation-guidelines profiles/*.yml` → aucun.** Le bundle n'est cité
  par aucun profil. La règle est **orpheline** : jamais matérialisée chez un hôte.
- `bundles/base.yml` (le socle hérité par tous) ne porte que `clean-code/no-dead-code`
  et `conventional-commits/format`. Pas la clarté.
- Le `Scope:` actuel de la règle dit explicitement « **every artefact a human reads** »
  et exclut le chat. Or le PO veut aussi couvrir « l'explication en retour de chaque
  LLM » (le fil de conversation) et « le retour de session ».

Deux problèmes distincts, donc : **(A) câblage** (la règle n'atteint personne) et
**(B) portée** (elle ne couvre pas les sorties conversationnelles).

## Proposition

1. **Câbler la clarté dans `base`** (geste A, XS) : ajouter
   `documentation-guidelines/human-facing-lisibility` au bundle `base` — de sorte que
   TOUT profil (donc tout agent/skill matérialisé) l'hérite. Vérifier l'impact sur
   `expand.test.ts` (le compte de règles change) et sur les caps.
2. **Étendre la portée aux sorties de chat** (geste B, à groomer) : amender le `Scope:`
   de la règle pour inclure « toute restitution à l'humain en fin de tour » et « le
   résumé de session ». Attention : une règle est une *disposition lue par le LLM*
   (niveau prompt/agent-check), pas un verrou déterministe — l'enforcement reste
   `agent-check` (le reviewer juge), doublé du garde-fou hôte réel qui existe déjà :
   l'**output-style « Explication claire »** (`~/.claude/output-styles/`) et les
   `CLAUDE.md`. La fiche doit trancher : la règle *renvoie-t-elle* à l'output-style
   comme mécanisme d'application côté chat ?
3. **Ne pas créer de doublon** : un seul texte de règle, enrichi — pas une « règle de
   clarté agent » distincte de la « règle de clarté artefact ».

### Cas concret ajouté — la clause « titre + lien » (demande PO 2026-08-26)

Un **enrichissement de contenu** à porter en même temps que le câblage : la règle doit
exiger que **toute citation d'une fiche (ou entité à id) se fasse par son titre + un lien
cliquable, jamais par l'id nu**. Un id (`0080`, `20260826072532537`, `#175`) est un code
interne : illisible et non navigable pour le lecteur. C'est déjà interdit *en creux*
(« pas de code interne comme porteur de sens ») — on le rend **explicite et vérifiable**.
Format : `[titre court](chemin/vers/la/fiche.md)` ; l'id peut suivre le titre, jamais le
remplacer.

**Décision PO du 2026-08-26** : inscrire cette clause **aux deux endroits** — le texte de la
règle (le moteur) **et** `CLAUDE.md` (pour le chat) — au titre des gestes A (câblage) et B
(portée chat) ci-dessus.

## Critères d'acceptation

- [ ] `human-facing-lisibility` est dans `base` ; `pnpm --dir products/mega-city graph:check`
      vert et `expand` résout la règle pour tout profil (test mis à jour).
- [ ] Le `Scope:` de la règle nomme explicitement les sorties de chat et le résumé de session.
- [ ] La règle référence le mécanisme d'application côté chat (output-style / CLAUDE.md) —
      pas juste une injonction sans levier.
- [ ] La règle porte la clause explicite « fiche = titre + lien, jamais l'id nu » ;
      `CLAUDE.md` la reprend pour le chat.
- [ ] Zéro nouvelle règle créée (enrichissement de l'existante uniquement).

## Comment vérifier

```bash
grep -l human-facing-lisibility products/mega-city/bundles/base.yml   # doit matcher
pnpm --dir products/mega-city test        # expand.test à jour
pnpm --dir products/mega-city graph:check # 0 lien cassé
```

## Notes

Fiche née du `/ezk-backlog add` du 2026-08-24, en pleine session de refonte de la méthode.
Lignée : règle `human-facing-lisibility` (ADR-0029 « la fiche est le document »),
output-style « Explication claire », épic dérive-communication-lisibilité (0079, shippée).
