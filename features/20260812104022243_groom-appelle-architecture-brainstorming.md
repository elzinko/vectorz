---
id: "20260812104022243"
title: "groom appelle aussi engineering:architecture (+ product-brainstorming) — par défaut, ou forcé par paramètre"
type: feature
priority: P2 # choisie par le PO (session 2026-08-12)
product: mega-city
epic:
status: idea
ready:
pr:
created: 2026-08-12
---

# Le grooming peut appeler l'architecte et le brainstorming

## Contexte / Problème

Besoin PO (session 2026-08-12) : au grooming d'une fiche, on doit pouvoir **appeler
`/engineering:architecture` et `/product-management:product-brainstorming`** — soit **sur
décision du LLM**, soit **forcé par un paramètre**. Par défaut, le PO estime bon d'avoir
ces appels **dans la liste des tâches de grooming**.

**État de la méthode.** Le `groom <id>` d'`ezk-backlog` **compose déjà**
`product-management:product-brainstorming` (moteur de raffinement DoR), mais **jamais
`engineering:architecture`**. Or beaucoup de fiches portent une **décision de conception**
qui mérite l'architecte **au grooming** (pas seulement au sprint) — dont plusieurs fiches
de cette même session ([[20260812104022237]], [[20260812104022240]],
[[20260812104022246]]) qui portent explicitement « à groomer avec l'architecte ».

## Proposition

**À groomer — pistes** :

- Étendre `ezk-backlog groom <id>` : ajouter `engineering:architecture` à la boucle de
  raffinement, aux côtés de `product-brainstorming` ;
  - **par défaut proposé** dans les tâches de grooming quand la fiche porte une décision
    de structure ;
  - **forçable** par paramètre (ex. `groom <id> --archi` / `--no-archi`) ;
  - **appelable sur jugement LLM** sinon.
- Cadrage à trancher : l'archi est-elle **par défaut** (toute fiche ? seulement
  `feature`/`refactor` ? sur heuristique de complexité ?) vs **opt-in**.
- **Lien fort avec la composition comportementale** [[20260812104022246]] : « forcer
  l'appel d'une commande au grooming » **est** une directive comportementale composable.
  Cette fiche-ci est l'**instance concrète et proche** ; [[20260812104022246]] est le
  **mécanisme général** (ne pas attendre le mécanisme pour livrer cette instance).

## Critères d'acceptation

- [ ] (à définir au grooming — DoR)

## Notes / décisions

- Voisins : `groom` (déjà `product-brainstorming`), [[20260812104022231]] (DoR — balayage
  des surfaces, autre extension du grooming), `0188` (main : « ADR lisibles comme des
  articles », consommateur de l'archi-grooming). Mécanisme général = [[20260812104022246]].
- Petit et concret : capturé ici, à builder en sprint. Méta-cohérent : cette fiche
  elle-même se groomera avec les deux commandes.
- Origine : session 2026-08-12.
