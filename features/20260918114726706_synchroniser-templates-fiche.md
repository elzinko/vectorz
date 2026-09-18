---
id: "20260918114726706"
title: "Synchroniser les templates de fiche (une seule source de vérité) + supprimer l'orphelin"
type: chore # feature | bug | refactor | chore | epic
priority: P2 # P0 | P1 | P2 | P3
product: mega-city # obligatoire dans ce monorepo — vectorz | mega-city | …
epic: # optionnel — id de la fiche épic parente (type: epic)
labels: [méthode, template, dette]
status: idea # idea | ready | in-progress | blocked | shipped
ready: # YYYY-MM-DD — posé par le gate `ready <id>` (DoR complète) ; vide = non groomée
pr:
evidence: none # templates markdown, pas d'écran
created: 2026-09-18
---

# 20260918114726706 — Synchroniser les templates de fiche

## En clair

Il existe **trois** copies du template de fiche, et elles ne sont pas d'accord entre elles. Un
nouveau projet initialisé aujourd'hui hériterait d'un template périmé. On veut **une seule
source de vérité** et un moyen simple de propager ses évolutions, plus supprimer la copie morte.

## Contexte / Problème

Découvert en corrigeant le template ([[20260918113211648]], retour Codex sur PR #254). Les trois
copies divergent :

- `products/mega-city/skills/ezk-backlog/templates/feature-template.md` — la **référence** (celle
  qu'`init` copie dans un nouveau projet). Corps à jour, mais front-matter encore `epic:`
  **périmé** (les épics ont été retirés, A16 → `milestone:`).
- `features/feature-template.md` — le template **local de vectorz** (celui d'où naissent les
  fiches d'ici). Front-matter à jour (`milestone:`), corps rafraîchi partiellement en #254 (il
  manque encore « En clair » et « Glossaire »).
- `products/mega-city/feature-template.md` — **orphelin** : mega-city n'a plus de `features/`
  (tombstoné), et rien ne le référence. Du code mort.

`init.sh` **préserve** un template local existant (ne le réécrit pas), et `add` crée les fiches
depuis le template local — donc les évolutions de la référence n'atteignent jamais les projets
déjà initialisés. C'est la dette « rafraîchir le template local », déjà notée dans le SKILL
`ezk-backlog` (réponse Codex PR #152).

## Proposition

1. **Aligner la référence sur le modèle courant** : front-matter `epic:` → `milestone:` (A16),
   id quoté, `superseded` dans les statuts — pour qu'un nouveau projet naisse à jour.
2. **Rafraîchir le template local de vectorz** : lui ajouter « En clair » et « Glossaire » (le
   reste du corps ADR-0029), front-matter conservé.
3. **Supprimer l'orphelin** `products/mega-city/feature-template.md` (dead code).
4. **Décider d'un mécanisme de synchro** (au choix, à groomer) : `init` propose une resync quand
   le template local est plus vieux que la référence, OU un pointeur vers la référence unique,
   OU un test qui signale la dérive. À trancher au grooming.

## Critères d'acceptation

- [ ] Un nouveau projet initialisé naît avec un template à jour (front-matter `milestone`, corps ADR-0029).
- [ ] Le template local de vectorz porte les mêmes sections que la référence.
- [ ] Plus de copie orpheline du template.
- [ ] La dérive future entre référence et local est détectable (mécanisme choisi au grooming).

## Comment vérifier

À préciser au grooming (fiche `idea`). Pistes de procédure :

```bash
# les templates ne divergent plus sur les sections structurantes
diff <(grep '^## ' features/feature-template.md) \
     <(grep '^## ' products/mega-city/skills/ezk-backlog/templates/feature-template.md)
# l'orphelin n'existe plus
test ! -e products/mega-city/feature-template.md
```

## Notes / décisions

- **Origine** : retour Codex sur PR #254 (« propagate the distinction to installed project
  templates ») + décision PO (Thomas, 2026-09-18) de ficher la dette.
- Rattaché à la dette connue « rafraîchir le template local » (SKILL `ezk-backlog`, réponse
  Codex PR #152).
