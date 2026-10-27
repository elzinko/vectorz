---
id: "20261027180541168"
title: "Les raisons de blocked: sont un seul mot anglais, le contexte va dans les Notes"
type: refactor
priority: P2
product: mega-city
milestone: preparation
version:
labels: [methode, dor, blocked, refactor, lisibilite]
depends:
status: ready
pr:
evidence: none # vocabulaire de méthode, pas d'écran ; preuve = tests + grep
created: 2026-10-27
---

# 20261027180541168 — Les raisons de `blocked:` : un mot anglais, le reste dans les Notes

## En clair

Le champ `blocked:` d'une fiche porte une **raison typée**. Aujourd'hui ces raisons sont en français,
en mots composés (`attend-panel`, `sous-revue`…), souvent avec un détail collé derrière un tiret
(`attend-panel — change le modèle…`). Le PO veut plus simple : **un seul mot anglais** par raison, et
**le détail descend dans les Notes** de la fiche, pas dans la valeur. On ne touche pas au mécanisme
(liste fermée, lue par l'intake) — seulement au vocabulaire et au format.

## Si tu arrives frais

`blocked:` est un drapeau lu par l'intake (`plan:head`, `plan:lot`) et par le run autonome
(`run-eligibility`) pour écarter une fiche **sans délibérer**. Sa raison appartient à une **liste
fermée** (`src/backlog/blocked-reasons.ts`). C'est du vocabulaire de pilotage : il doit être court et
universel.

## Contexte / Problème

- Les 9 raisons actuelles cumulent trois défauts de lisibilité : **français**, **kebab composé**, et une
  convention qui autorise un **détail libre** après ` — ` (`<type> — <contexte>`).
- Ce vocabulaire est lu par l'humain **et** par la machine. Un mot long, composé, en français, mêlé à du
  texte libre, se scanne mal et s'écrit faux plus facilement.
- Le détail dans la valeur fait doublon avec les Notes de la fiche, où le « pourquoi / quand débloquer »
  a sa vraie place.

## Proposition

**Renommer la liste fermée en mots anglais d'un seul tenant, et sortir le contexte de la valeur.**

| Avant (fr) | Après (en) |
|---|---|
| `différée-PO` | `deferred` |
| `attend-panel` | `panel` |
| `attend-maquette` | `design` |
| `attend-GitHub` | `github` |
| `attend-dépendance` | `dependency` |
| `sous-revue` | `review` |
| `auto-édition-risquée` | `risky` |
| `à-découper` | `oversized` |
| `hérité` | `legacy` |

- **Un mot, pas de composé.** `blocked: panel`, pas `blocked: attend-panel`.
- **Le contexte descend dans les Notes.** Le « pourquoi / quand débloquer » vit dans le corps de la
  fiche. On garde l'info (la règle de sortie, le cas vécu) sans surcharger le champ.
- **Le mécanisme ne bouge pas** : liste fermée, typée, lue par l'intake et le run. Seuls les noms et le
  format changent.

## Critères d'acceptation

- [ ] `BLOCKED_REASONS` (`src/backlog/blocked-reasons.ts`) ne contient que les 9 mots anglais de la
      table ; plus aucune raison française dans le code, et le commentaire de format n'évoque plus le
      détail ` — <contexte>`.
- [ ] La carte d'escalade exhaustive du run (`ESCALATION_BY_REASON`, `run-eligibility.ts`) et les tests
      sont alignés : `pnpm test` + `pnpm test:scripts` verts.
- [ ] Les **24 fiches actives** bloquées sont migrées : `blocked: <mot anglais>` seul, le contexte
      déplacé dans leurs Notes. Vérif : `grep -rE "^blocked: .+ — " features/*.md` rend 0.
- [ ] Plus aucune raison française dans une fiche active. Vérif :
      `grep -rE "^blocked: (attend-|différée-|sous-revue|auto-édition|à-découper|hérité)" features/*.md` rend 0.
- [ ] Le modèle de fiche, le `SKILL.md` d'ezk-backlog et toute doc citant ces raisons listent les mots
      anglais. Les fiches `done/` (historique) sont laissées telles quelles.

## Comment vérifier

```bash
cd /Users/elzinko/git/bacasable/vectorz
# 1. Plus de raison française, ni de détail collé après un tiret, dans les fiches actives
grep -rE "^blocked: .+ — " features/*.md                                                         # → 0
grep -rE "^blocked: (attend-|différée-|sous-revue|auto-édition|à-découper|hérité)" features/*.md # → 0
# 2. L'enum est en anglais
grep -nE "deferred|panel|design|github|dependency|review|risky|oversized|legacy" \
  products/mega-city/src/backlog/blocked-reasons.ts
# 3. La gate passe
cd products/mega-city && pnpm test && pnpm test:scripts
```

## Notes / décisions

- **Décision PO, 2026-10-27.** Les raisons en français « c'est bof » ; un mot unique et simple est
  toujours mieux ; le détail collé après un tiret n'a rien à faire dans la valeur. Renommage confié à
  cette fiche dédiée (pas en direct).
- **Sœur de** [« prête » force un caveat dans un `blocked:` typé](20261015213921103_dor-verifie-premisse-dans-le-code.md) :
  les deux touchent `blocked-reasons.ts`. Celle qui se construit en second rebase sur la première.
- Le mécanisme (liste fermée typée, lue par l'intake + le run) a été posé par
  [raisons typées pour blocked](done/20261013131632484_raisons-typees-pour-blocked.md) — on garde le
  mécanisme, on change le vocabulaire.
- Mots les plus discutables au build : `risky` (ex-`auto-édition-risquée`), `oversized` (ex-`à-découper`),
  `dependency` (ex-`attend-dépendance`) — ajustables si un meilleur mot émerge, tant qu'ils restent un
  seul mot anglais.
