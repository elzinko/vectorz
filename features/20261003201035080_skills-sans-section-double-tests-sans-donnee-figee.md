---
id: "20261003201035080"
title: "Un contrôle refuse une section en double dans un skill, et les tests ne figent plus l'état du backlog"
type: feature
priority: P2
product: mega-city
milestone:
version:
labels: [qualite, tests]
status: idea
pr:
evidence: none # outillage, pas d'écran
created: 2026-10-03
---

# 20261003201035080 — Un contrôle refuse une section en double dans un skill, et les tests ne figent plus l'état du backlog

**En clair.** Deux défauts silencieux. Un texte de skill peut garder une section en double après une
fusion, sans que rien ne le voie. Et des tests figent une donnée du vrai backlog qu'un geste normal
change : ils cassent pour une raison sans rapport. On ajoute un contrôle, et on fait tester des règles
plutôt que des valeurs.

## Contexte / Problème

- 2026-10-03 : `ezk-backlog/SKILL.md` portait toute la section « next --lot N » en double, reste des
  PR #324 et #325. Trouvée par hasard ; retirée par la PR #343.
- 2026-10-01 : deux tests ont cassé sur des gestes normaux (PR #314 : une fiche écrite en dur partie
  dans `done/` ; PR #315 : un statut d'ADR figé). Note de carnet
  `20261002230220220-tests-figent-etat-reel-backlog`.

## Proposition

1. Un test parcourt les `SKILL.md` du catalogue et refuse deux titres de section identiques.
2. Les tests qui lisent le vrai dépôt vérifient une règle (« une fiche active existe », « l'ADR a un
   statut valide ») au lieu d'une valeur précise.

## Critères d'acceptation

- [ ] Le contrôle échoue sur un `SKILL.md` de test qui porte une section en double, et passe sur le
      catalogue actuel.
- [ ] Aucun test ne cite en dur l'id d'une fiche active ni le statut précis d'un ADR (recherche
      outillée à 0).

## Comment vérifier

```bash
pnpm --dir products/mega-city test
```

## Mesure de suivi

- [ ] Sur les 5 prochaines PR de ship ou de ratification, 0 test cassé par ce geste.

## Notes / décisions

- Née de la rétro de l'itération V0.5 (capture `docs/captures/2026-10-03-retro-iteration-v0-5.md`), proposée par l'architecture, la qualité et le
  dev. Retenue par choix délégué du PO à l'agent, P2. Traite la note de carnet sur les tests figés.
