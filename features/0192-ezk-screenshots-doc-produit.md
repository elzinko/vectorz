---
id: 0192
title: Capturer des screenshots du produit et les injecter dans la doc/le site quand l'UI change
type: feature
priority: P2 # provisoire — posée à la capture (PO à confirmer au grooming)
product: mega-city
epic:
status: idea
ready:
pr:
created: 2026-08-10
---

# 0192 — ezk-screenshots : captures du produit → doc/site à jour

## Contexte / Problème

Capturé pendant le grooming `website_showcase` de samplerz (2026-08-10) : le site
vitrine manque de **screenshots du produit** pour qu'un visiteur comprenne
(« il manque des screenshots pour comprendre »), et plus généralement **la doc
dérive de l'UI réelle** — personne ne régénère les captures quand l'interface
change.

Le besoin exprimé : « un skill qui permet d'extraire des screenshots du produit
**sur la branche courante** et les inclure dans la doc quand il y a une
modification d'UI et que c'est demandé de mettre à jour ».

Briques déjà existantes à COMPOSER (pas réimplémenter) : `ezk-qa` pilote déjà
l'app via Playwright MCP (screenshots de preuve E2E), `run`/`ezk-preview`
savent lancer l'app, la règle `development/pr-before-after-media` exige déjà
du avant/après en PR. Ce qui manque : le geste **reproductible** « lance
l'app depuis la branche → capture un JEU NOMMÉ de vues (viewport stable,
état de démo seedé) → dépose les fichiers aux emplacements convenus
(docs/, website/public/…) → signale le diff visuel ».

## Proposition

(à groomer — pistes)
- Un skill `ezk-screenshots` (ou une extension d'`ezk-qa`) avec un manifeste
  par repo (`screenshots.yaml` : liste vue → URL/état → fichier cible) ;
  Playwright headless, viewport fixe, données de démo déterministes.
- Déclenchement : à la demande (« mets à jour les screenshots ») et/ou proposé
  quand une PR touche l'UI.
- Cross-repo : samplerz (site vitrine + docs) = premier consommateur ; muti
  ensuite.

## Critères d'acceptation

- [ ] (à définir au grooming — DoR)
- [ ] Gate locale verte (typecheck/lint/tests) puis E2E si UI.

## Notes / décisions

- Origine : session samplerz 2026-08-10 (grooming website_showcase, Tranche 1
  pitch home). Le site venait d'être déployé (samplerz.vercel.app) et la review
  utilisateur a pointé l'absence de captures produit.
- Doctrine « faire une fois à la main d'abord, puis harvester en skill »
  (cf. fiche samplerz `website_showcase`) : la tranche « screenshots » du site
  samplerz peut se faire à la main via ezk-qa/Playwright, et CE skill est le
  harvest de ce geste.
