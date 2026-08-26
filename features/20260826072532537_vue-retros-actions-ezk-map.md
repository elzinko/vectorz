---
id: "20260826072532537"
title: Vue « rétrospectives » dans ezk:map — chaque rétro et ses actions mesurables, relues depuis les captures
type: feature
priority: P2
product: mega-city
version:
epic:
status: idea
ready:
pr:
created: 2026-08-26
---

# Vue « rétrospectives » dans `ezk:map`

## En clair

Une sous-page de `ezk:map` pour **revoir les rétros passées**. Pour chacune : quand
elle a eu lieu, ce qui a été décidé, et surtout **la liste des actions mesurables**
qu'elle a adoptées. La vue lit les comptes-rendus de rétro là où ils sont rangés.

## Contexte / Problème

Les rétros produisent déjà de la matière. La cérémonie `ezk-retro` (fiche livrée
[[0167]]) fait tourner un round-robin d'agents et en sort des **règles mesurables**.
La fiche [[0080]] (pas encore faite) doit **standardiser leur capture** dans
`docs/captures/AAAA-MM-JJ-retro-<slug>.md`.

Mais **rien ne les affiche**. Pour retrouver « les actions décidées à la rétro de
juillet », il faut ouvrir les fichiers un par un. On ne voit nulle part, d'un coup
d'œil, la suite des rétros et ce que chacune a engagé.

## Proposition (esquisse — à groomer)

Une carte `retros` servie par `pnpm ezk:map retros`, sur le **patron d'onglet
existant** (comme `avancement` / `sprints`).

- **Un script compile** depuis `docs/captures/*-retro-*.md` : la liste des rétros
  (date, thème), et pour chacune **ses actions mesurables** extraites de la section
  « décisions du PO » du compte-rendu standard.
- **Détail au clic** : le débat, les verdicts, le lien vers la capture source.
- **Optionnel (à trancher)** : marquer si une action a été *tenue* / *mesurée* — mais
  ça peut vite déborder ; à cadrer au grooming.

## Dépendance à lever au grooming

Cette vue lit **le format de [[0080]]**. Deux chemins :

- **(a)** attendre que [[0080]] standardise les captures, puis lire ce format ;
- **(b)** lire en *best-effort* les captures existantes (format non encore uniforme),
  quitte à rater des champs.

À trancher quand on tire la fiche — ne pas coder la vue sur un format instable sans le
savoir.

## Critères d'acceptation (esquisse — non ready)

- [ ] `pnpm ezk:map retros` liste les rétros passées (date · thème).
- [ ] Chaque rétro affiche **sa liste d'actions mesurables**.
- [ ] Chaque entrée pointe vers sa **capture source** (`docs/captures/`).
- [ ] Données **compilées** depuis les captures (invariant « disque ≡ régénéré »).

## Comment vérifier

```bash
pnpm ezk:map retros
```

La page liste les rétros ; ouvrir une rétro → ses actions mesurables ; recouper avec le
fichier `docs/captures/` correspondant.

## Notes

- **Dépend du format** de [[0080]] (capture standard des rétros) et **s'appuie sur**
  [[0167]] (la cérémonie qui produit les actions).
- **Voisine** de la vue sprints [[20260826072532452]] — même famille « relire ce qui
  s'est passé ».
- **Product `mega-city`**.
