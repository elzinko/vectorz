---
id: "20261104095412223"
title: Deux tests qui lancent des sous-process dépassent leur délai de 5 s sous la charge de la gate
type: bug
priority: P3
product: mega-city
milestone: qualite
version:
labels: [retro, gate]
status: idea
pr:
evidence: none # test, pas d'écran
created: 2026-11-04
---

# 20261104095412223 — Deux tests à sous-process dépassent leur délai sous charge

**En clair.** Deux gates de suite ont échoué sur un test trop lent : plus de 5 secondes, sous la charge
de la gate complète. Rejoués seuls, les deux passent : c'est une lenteur, pas un défaut. Ils lancent de
vrais sous-process (git, la commande `ezk`), ce qui coûte plus que le délai par défaut quand toute la
gate tourne. On leur donne un délai à leur mesure.

## Contexte / Problème

- `products/mega-city/src/__tests__/apply.test.ts`, test « pose le hook depuis un WORKTREE (.git est un
fichier) … » : « Test timed out in 5000ms » le 2026-11-04 à 10 h 36, pendant `pnpm gate` ; rejoué seul,
8 sur 8.
- `products/mega-city/src/__tests__/ezk-config-cli.test.ts`, test « show dit le menu de groom … » : même
  erreur le 2026-11-04 vers 10 h 54, pendant la gate du sprint 29 ; rejoué seul, 12 sur 12. D'autres
fichiers de la gate fixent déjà un délai large pour leurs sous-process git (`backlog-show.test.ts` :
60 s).

## Proposition

Donner à ces tests, ou à leurs fichiers, un délai explicite à la mesure des sous-process qu'ils lancent,
comme le fait déjà `backlog-show.test.ts`.

## Critères d'acceptation

- [ ] Les deux tests portent un délai explicite, justifié en commentaire par leurs sous-process.
- [ ] La gate complète passe sans dépassement de délai de ces tests.

## Comment vérifier

```bash
pnpm --dir products/mega-city gate
```

**Mesure de suivi** — sur les 5 prochaines gates complètes, 0 dépassement de délai de ces tests.

## Notes / décisions

- Issue de la rétro légère des sprints 27-28, proposition P3, retenue par `ezk-pm` en mode auto.
