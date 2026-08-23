---
id: 0172
title: Convention SoT backlog — fiches md = maître ; GitHub = export (hygiène process)
type: chore
product: mega-city
priority: P2
epic:
depends: []
status: idea
ready:
pr:
created: 2026-07-30
---

# 0172 — Convention SoT (process, pas code)

## Contexte / Problème

Sans règle écrite, les agents et les humains basculent intuitivement la « vérité » vers
GitHub Issues (critères, statut, grooming). Ça casse l'agnosticisme de la méthode et
contredit ADR-0016 / ADR-0017.

## Proposition

Documenter (ADR court **ou** section `ezk-backlog` / `docs/`) la convention :

1. **Création** : `ezk-backlog add` (fiche locale) **d'abord** ; issue GH ensuite (au
   `ready` / `in-progress`), jamais l'inverse comme SoT
2. **Critères d'acceptation** : toujours dans le markdown de la fiche
3. **Champ lien** optionnel (`github:` / Notes) — référence, pas maître
4. En cas de conflit statut/critères : **la fiche gagne** ; on met à jour GH (via 0171
   quand disponible) ou on ignore jusqu'au push adaptateur

Peut vivre comme amendement doc de 0170/0171 ou ADR process dédié — à trancher au grooming
(éviter trois documents qui se répètent).

## Critères d'acceptation

- [ ] Règle SoT publiée (ADR ou section skill) et référencée depuis ezk-backlog
- [ ] Exemple « anti-pattern » (critères seulement dans l'issue) + correctif attendu
- [ ] Lien croisé vers [0170](done/0170-modele-extension-plugin-mega-city.md) et
      [0171](0171-adapter-github-issues-push-only.md)

## Notes / décisions

- Pas de dépendance dure à 0170/0171 : la convention vaut **même sans** adaptateur (lien
  manuel suffit en solo).
- `product: mega-city` — liste unique livrée (0064 / #66).
