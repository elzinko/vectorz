---
id: "20261002205428200"
title: "La garde de ship lit la vraie branche de la PR, pas l'argument --branch"
type: bug
priority: P2
product: mega-city
milestone:
version:
labels: [sprint]
status: idea
pr:
evidence: none # script de merge, aucun écran
created: 2026-10-02
---

# 20261002205428200 — La garde de ship lit la vraie branche de la PR, pas l'argument --branch

**En clair.** Avant de merger une story, `ship-merge.sh` vérifie que la PR porte bien le commit qui
range sa fiche dans `done/`. Pour savoir de quelle fiche il s'agit, il lit l'argument `--branch`,
tapé à la main, au lieu de lire la branche de la PR elle-même. Une erreur de branche suffit pour que
la garde se taise et laisse passer un merge sans ship. On veut qu'elle lise la vraie branche de la
PR, et qu'elle refuse quand l'argument ne correspond pas.

**Si tu arrives frais.** `ship-merge.sh` est le script de merge du skill `ezk-pr`. Le « ship » est
le commit qui passe une fiche en `shipped` et la range dans `features/done/` ; depuis l'ADR-0049, il
entre **dans** la PR, avant le merge. La « garde » est le contrôle qui refuse de merger une story
sans ce commit.

## Contexte / Problème

La garde vit dans [`ship-merge.sh`](../products/mega-city/skills/ezk-pr/scripts/ship-merge.sh),
fonction `ship_guard` (l. 135). Elle tire l'id de la fiche du texte de `--branch` (l. 137), avec le
motif `feat|fix/<id>-<slug>`. Sans id, elle écrit `SHIP-GUARD: skip` et laisse merger (l. 138).

En mode distant, la PR est désignée par `--pr`, et `--branch` est un second argument, saisi à part.
Rien ne vérifie que les deux parlent de la même PR. Le scénario :

1. On lance `ship-merge.sh --remote --pr 412 --branch docs/rangement`, alors que la PR 412 porte la
   branche `feat/<id>-…`.
2. `docs/rangement` ne contient pas d'id de fiche : la garde répond `skip`.
3. La story est mergée sans son ship. Sa fiche reste « à faire » sur main, exactement ce que
   l'ADR-0049 voulait empêcher.

Codex a signalé ce trou (P1) sur la PR #333. La session de build l'a décliné : la garde protège
contre l'**oubli**, pas contre un contournement voulu, qu'un merge depuis l'UI permet de toute
façon. L'argument tient pour un contournement voulu. Mais une mauvaise branche passée **par
erreur** est un oubli, justement le cas que la garde doit attraper.

## Proposition

POC dans `ship_guard`, en mode distant seulement :

- Lire la branche et le commit de tête de la PR sur GitHub
  (`gh pr view <pr> --json headRefName,headRefOid`).
- Tirer l'id de fiche de **cette** branche, pas de `--branch`.
- Si `--branch` est fourni et diffère de la branche de la PR, refuser le merge, avec un message qui
  nomme les deux branches.
- En mode local (sans PR, `pr: false`), rien ne change : la branche locale fait foi.

## Critères d'acceptation

- [ ] Avec `--pr` désignant une PR `feat/<id>-…` sans ship, un `--branch` erroné ne fait plus passer
      le merge : il est refusé, et le message nomme la branche passée et celle de la PR.
- [ ] Avec `--pr` et un `--branch` cohérent, le comportement est inchangé : ship présent, le merge
      passe ; ship absent, il est refusé (code 3).
- [ ] Sans PR (mode local), rien ne change.
- [ ] Un test rejoue le scénario de Codex et échoue sur le code actuel.

## Comment vérifier

```bash
bash products/mega-city/skills/ezk-pr/scripts/test-ship-merge.sh
pnpm --dir products/mega-city test:scripts
```

Le premier lance les cas de la garde, dont le nouveau cas « mauvaise branche ». Le second rejoue
toutes les suites bash.

## Notes / décisions

- **Origine (2026-10-02)** : le fil Codex « Bind the ship guard to the PR's actual branch » sur la
  PR #333, décliné par la session de build. Le PO a validé cette fiche de suite.
- **Priorité** : Codex l'a classée P1. Elle est proposée en P2, pour deux raisons. Le cas suppose un
  appel manuel de `ship-merge.sh` avec une mauvaise branche. Et un merge depuis l'UI contourne la
  garde de toute façon : l'ADR-0049 assume ce filet partiel. Priorité et version restent à trancher
  au grooming ; la V0.5 en serait la suite naturelle.
- **Voisines** : [« En cours » se déduit des branches](20261002130235353_en-cours-deduit-des-branches.md)
  fait le même rapprochement branche ↔ PR, mais pour l'affichage.
  [La story livrée par #333](done/20261002114435782_done-par-story-a-la-validation.md) a construit la
  garde. Décision de fond :
  [ADR-0049](../products/mega-city/docs/adr/0049-ship-fiche-dans-la-pr-vues-post-merge.md).
