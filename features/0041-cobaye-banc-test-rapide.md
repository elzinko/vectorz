---
id: 0041
title: Cobaye — banc de test rapide (manuel + e2e Pareto) pour sécuriser les devs
type: chore
priority: P1
status: todo
pr:
created: 2026-07-16
---

# 0041 — Cobaye : banc de test rapide (manuel + e2e Pareto)

## Contexte / Problème

Ressuscite le concept **cobaye** de l'ère cop1 (le nom est conservé) : un petit projet
blanc reproductible que cop1/vectorz exerce, pour **sécuriser les devs** sans monter une
suite E2E lourde. Le besoin réel (clarifié 2026-07-16) est un **feedback rapide**, pas
l'exhaustivité :

1. **tester vite soi-même** en lançant l'app et en cliquant (validation visuelle), et/ou
2. **un e2e automatique simple et rapide, façon Pareto** — les ~20 % de parcours
   utilisateur qui attrapent ~80 % des régressions — jouable en local et en CI.

Héritage cop1 à épouser (BMAD-era, à porter en natif) : le banc `cop1-cobaye` (état
vierge en git + rituel de reset), l'« empirical shakedown » (`real-run-report`, épic
jouet `EX1` Say-Hello/Add-Goodbye), les fixtures `orchestrator-e2e.test.ts` +
`fixtures/test-story.md` + `fake-claude.mjs`, et `docs/e2e/`.

**Ce n'est pas** : la fiche [0038](0038-e3-pilote-natif.md) (E3) qui construit le *moteur*
pilote natif — 0041 est le **banc qui l'exerce** (sa preuve de sortie) ; ni la fiche
[0017](0017-e2e-darkmode-cobaye.md) qui est *un scénario* dark-mode (candidat à devenir le
premier scénario du banc, cf. Notes).

## Proposition (principe Pareto — léger d'abord)

Deux voies d'alimentation du banc, **découplées** pour ne pas dépendre du gros chantier :

- **Voie rapide (indépendante de 0038, dispo tôt → justifie P1)** : un cobaye **pré-seedé**
  (fixtures versionnées) + un smoke Playwright **court** sur les parcours critiques
  (ex. l'app démarre, le parcours nominal rend, un toggle/persistance marche). Cible :
  quelques secondes, vert/rouge net, jouable en CI **et** en un `pnpm …` local. Sert de
  filet de régression sur chaque PR UI.
- **Voie « cop1 construit la feature » (gated par 0038)** : le pilote natif seed lui-même
  la feature dans le cobaye (dogfood), puis on rejoue le smoke — c'est là que le banc
  devient la **preuve de sortie d'E3**.

Transverse :
- **Banc reproductible** : cobaye vierge commité, rituel de reset documenté
  (`git checkout -- . && git clean -fdq … && rm -rf .cop1`, adapté au natif).
- **Test manuel documenté** : une commande pour lancer l'app + la check-list de clic
  (dans `docs/e2e/`, format « E2E manuel reproductible » déjà en place pour l'auth).

## Critères d'acceptation

- [ ] Le cobaye pré-seedé existe (état vierge + fixtures) avec son rituel de reset documenté
- [ ] Un smoke e2e **Pareto** (parcours critiques seulement) tourne **vert en < N s**,
      en local (une commande) et en CI
- [ ] Un dev qui casse un parcours critique voit la CI rougir (test de sabotage → revert)
- [ ] Voie manuelle : `docs/e2e/` décrit comment lancer l'app et valider visuellement en < 2 min
- [ ] Gate locale verte ; aucune dépendance à BMAD (`_bmad/`, `_bmad-output/` non requis)

## Notes / décisions

- **Priorité P1** (PO, 2026-07-16) : filet de sécurité dev jugé structurant à avoir tôt —
  la *voie rapide* est réalisable **avant** le pilote natif complet (0038), d'où P1 malgré
  l'articulation avec un chantier P2.
- **Articulation 0017** : gardée **séparée** pour l'instant (décision de fold reportée) ;
  le scénario dark-mode de 0017 est le **candidat naturel comme premier parcours** du banc.
  À trancher quand 0041 est tirée : fondre 0017 dedans, ou la laisser comme scénario client.
- **Articulation 0038** : la voie « cop1 construit la feature » est la preuve de sortie
  d'E3 — coordonner à l'ouverture de 0038 pour ne pas dupliquer les fixtures natives.
- Portée « Pareto » assumée : on ne vise **pas** l'exhaustivité ; couvrir peu, vite, et
  élargir seulement si un trou de régression le réclame.
