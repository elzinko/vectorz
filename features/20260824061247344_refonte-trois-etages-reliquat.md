---
id: "20260824061247344"
title: Refonte « trois étages » — le reliquat exécutable (lot 4b + retouches + options PO)
type: refactor
priority: P1
product: mega-city
version:
epic:
status: todo
ready: 2026-08-24
pr:
created: 2026-08-24
---

## En clair

La refonte de la méthode (plan « trois étages », approuvé le 2026-08-23) a livré ses
lots 0-3 et deux paquets de nettoyage sur la PR #162. Cette fiche est **la mémoire
commitée du reliquat** : le plan de session vivait hors du dépôt (`~/.claude/plans/`),
une prochaine session ne l'aurait pas vu. Tout ce qui reste à faire est ICI, ordonné.

## Contexte

Livré (PR #162) : graphe compilé + validateur (187→186 liens, 0 cassé) · carte fidèle
par construction (invariants testés) · carte TOTALE des cérémonies (ceremonies.yml
validé) · ADR-0039 (étages **modules**/méthode/librairie, « overlay », profils
généralisables) · taxonomie.yml (complétude forcée) · binder durci (renames.yml,
retrait gardé) · splits/absorptions (ezk-product-build, ezk-sprint:check/run,
ezk-ezk audit) · règle LOI `development/adversarial-review-before-merge` (enforced
ezk-reviewer) · backlog 131→114 actives (2 paquets, registres dans docs/captures/).

## Le reliquat, dans l'ordre

1. **Supprimer les 2 bundles orphelins** (`documentation-guidelines`, `hexagonal`) —
   étape approuvée du plan, jamais exécutée. Seul geste bundles autorisé par le panel
   (fiche `20260823124042708` porte le reste, en attente de douleur). XS.
2. **Retouche vocabulaire restante** : dans `ezk-sprint/SKILL.md`, séparer « DoD »
   (la gate uniforme : locale verte + E2E + revue GO) des « critères d'acceptation »
   (le Gherkin par fiche) — verdict panel B-4, pas encore appliqué. XS.
3. **Lot 4b — requalifier par étage** les fiches « périmées » restantes de
   l'inventaire du 2026-08-23 (~10 après les paquets 1-2) : `0087` (chiffres faux +
   frontière plugin-CC actée par ADR-0039 → réécrire), `20260813131737962` (reste le
   volet table README/statuts), `20260813124026215` (épic déploiement → réécrire sur
   ADR-0039), `0121`, `0163`/`0075` (renvois), `0053`/`0058` (vs 0100), `0177`/`0186`
   (Skema/packs). Process : par paquets, arbitrage PO, notes datées. S-M.
4. **Déclarer les compétences des agents** (`competences:` en frontmatter) — le trou
   est AFFICHÉ sur la carte (« aucune déclarée — trou connu ») ; les remplir rend le
   dossier de chaque rôle honnête. S.
5. **La vue d'avancement, lot 0** (fiche `20260823124042842`) — le board compilé
   depuis le frontmatter existant : c'est LE prochain chantier de visualisation
   (le flux, après la structure). M.

## Options ouvertes (PO décide quand il veut — désormais SÛRES grâce au binder)

- ~~Renommer l'agent `ezk-pm`~~ — **tranché le 2026-08-24 : on GARDE `ezk-pm`.** En scrum le
  rôle s'appelle Product OWNER — « product-builder » n'est pas plus fidèle ; « pm » se lit
  owner/manager sans mentir. Pas d'alias non plus : aucun mécanisme d'alias d'agent n'existe,
  et la table des cérémonies fait déjà le mapping PO → agent:ezk-pm (le besoin est couvert).
- Un Daily minimal — seulement si une douleur se documente (panel).
- Formaliser les overlays (dossier + règle du jeu) — au DEUXIÈME overlay (ADR-0039 §4).
- Le mini-chantier « profil d'agent » (généralisation §5) — quand un cas réel le tire.

## Comment vérifier

```bash
pnpm --dir products/mega-city graph:check && pnpm --dir products/mega-city test
pnpm ezk:map   # la carte suit chaque geste (invariants map-data/ceremonies/taxonomie)
```

## Notes

Sources durables : ADR-0039 (+ amendements 2026-08-24) · captures
`2026-08-23-panel-adverse-refonte-taxonomie.md`, `2026-08-23-fermetures-backlog-paquet1.md`,
`2026-08-24-fermetures-backlog-paquet2.md` · inventaire backlog du 2026-08-23 (exploration,
résumé dans les registres). `ready:` posé d'office : chaque point porte son critère et sa
taille — c'est une fiche d'exécution, pas une idée.
