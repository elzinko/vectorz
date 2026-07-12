---
id: 0035
title: geler puis archiver le repo iamthelaw (post-migration)
type: chore
priority: P2
status: shipped
pr: local (squash-merge)
created: 2026-07-06
---

## Contexte / Problème
Une fois la fiche 0006 livrée, le repo `iamthelaw` n'a plus de raison d'être (ADR-0010) :
jamais publié ni poussé, dialecte incompatible avec ce que cop1 lit, et ses deux
consommateurs pnpm (city-guided, umbillical) ont été **coupés le 2026-07-06** : commité
côté city-guided (260b347) ; côté umbillical le lien n'a jamais été tracké (modification
locale, lockfile régénéré non commité). L'opérateur veut archiver « pour ne jamais y
revenir ».

## Proposition
1. Bandeau README : « absorbé par mega-city (ADR-0010) — voir rules/ + bundles/ ».
2. Pousser le repo sur GitHub (il n'a AUCUN remote aujourd'hui) puis `gh repo archive`
   — archive lecture seule, conforme ADR-0010 §1 et §5.
3. Vérifier qu'aucun autre projet ne référence `link:../iamthelaw` (grep bacasable).

## Critères d'acceptation
- [ ] fiche 0006 shippée (pré-condition dure)
- [ ] README d'iamthelaw pointe vers mega-city
- [ ] repo poussé puis archivé sur GitHub (read-only)
- [ ] `grep -r 'link:.*iamthelaw' ~/git/bacasable/*/package.json` = 0 hors iamthelaw lui-même
- [ ] `pnpm install` de city-guided et umbillical toujours verts

## Notes
ADR-0010 §5. Précédent : lifefindsaway archivé sur GitHub le 2026-07-06. Les liens
`@bacasable/lifefindsaway` ont aussi été coupés des deux projets le même jour.
