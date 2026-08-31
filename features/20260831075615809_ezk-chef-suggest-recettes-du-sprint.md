---
id: "20260831075615809"
title: ezk-chef suggest — détecter les recettes possibles sur le sprint qui vient de finir
type: feature
priority: P0
product: mega-city
epic:
status: todo
ready: 2026-08-31
pr:
created: 2026-08-31
---

# 20260831075615809 — ezk-chef suggest : détecter les recettes possibles du sprint

## En clair

À la fin d'un sprint, on veut savoir s'il y a un **savoir-faire à capitaliser en recette**.
Cette fiche ajoute une sous-commande **`ezk-chef suggest`** : elle lit le sprint qui vient de
finir (fiches livrées + galères notées) et répond « recette possible sur la fiche X ». Elle ne
crée rien — elle **informe**. C'est la **rétro** qui l'invoque, et qui décide ensuite (fiche
voisine [20260831075615969](20260831075615969_ezk-retro-invoque-chef-propose-fiche-recette.md)).

## Contexte / Problème

Les briques du « pont de capitalisation » de fin de sprint existent, mais rien ne repère les
candidats-recettes :

- le **rapport de sprint** (`products/mega-city/src/sprint-metrics/`, schéma
  `sprint-report@0.1`) expose les ids des fiches livrées, les retouches, les blocages ;
- le **labo de cuisine** range les galères (`docs/sessions/`, section « Galères & gestes »,
  retrouvables par `grep -rl <id> docs/sessions/`) ;
- `ezk-chef extract` sait fabriquer un brouillon de recette **depuis une fiche connue** — encore
  faut-il **savoir quelle fiche** mérite une recette.

Manque le maillon « détection » : lire le sprint et proposer des candidats. Aujourd'hui personne
ne le fait ; la matière dort.

Frontière avec le cousin [0147](0147-ezk-recipy-mvp.md) (`ezk-recipy` / `scan`) : lui sonde des
**repos froids** (externes, dormants). `suggest` regarde le sprint **chaud** qui vient de finir.
Entrées et moment différents — ne pas les confondre.

## Proposition

Ajouter à `ezk-chef` une sous-commande **`suggest <sprint>`** (lecture seule, aucun effet de bord) :

1. **Entrée = un sprint désigné explicitement.** La rétro passe l'identifiant du sprint courant
   (slug ou chemin du rapport `docs/sprints/<date>-sprint-<slug>.json`) — jamais « le dernier »
   deviné. `suggest` lit alors ce rapport (`sprint-report@0.1` : ids des fiches livrées,
   retouches, blocages) **et** les récits de session correspondants (galères, via
   `docs/sessions/`). Plusieurs rapports coexistent (replay, historique) : **sans identifiant
   explicite, `suggest` refuse plutôt que de deviner**.
   **Prérequis de fraîcheur (séquencement, option A) :** au checkpoint de fin de sprint, les
   galères vivent encore dans le `SPRINT.md` non commité et le rapport n'est pas encore généré.
   C'est la **rétro qui produit ces artefacts juste avant** d'appeler `suggest` (voir la fiche
   voisine [20260831075615969](20260831075615969_ezk-retro-invoque-chef-propose-fiche-recette.md)).
   `suggest` lit donc des artefacts **frais et stables** — jamais le `SPRINT.md` live, et jamais
   « du vide » parce que la clôture n'a pas encore eu lieu.
2. **Attribution galère → feature (déterministe, sinon pas de candidat).**
   - Session **mono-feature** (`fiches:` porte un seul id) → ses galères sont attribuées à cette
     feature.
   - Session **multi-feature** (`fiches:` porte plusieurs ids) → une galère n'est attribuée que si
     l'entrée le précise explicitement ; **sinon le candidat est marqué « ambigu » et n'est PAS
     auto-retenu** (jamais de faux positif « les deux features »). L'attribution par entrée dans
     le labo est l'**option B** en réserve (fiche labo `20260829123707100`), à construire si le
     multi-feature devient fréquent.
3. **Sortie** : la source des candidats, ce sont **les galères** (via leur attribution à une fiche),
   **pas la liste « fiches livrées » du rapport** — au checkpoint la fiche du sprint courant n'est
   pas encore mergée, donc elle n'y figure pas. Pour chaque **galère « résolue + validée + utile »
   (Symptôme / Geste / Pourquoi) attribuée sans ambiguïté** à une fiche, un candidat
   `{ ficheId, motif, pointeurs }`. Le rapport (retouches, blocages) sert aux **signaux de
   méthode**, pas à filtrer les recettes. Zéro candidat si rien ne ressort — pas de bruit.
4. **Inerte** (ADR-0013) : `suggest` **propose**, ne crée aucune fiche, ne recopie aucun code.
   La décision et la création appartiennent à la rétro.
5. **Invoquée par la rétro**, jamais en autonomie : un service que la cérémonie demande à
   l'outil, comme elle invoque déjà `ezk-backlog add`.

Le cœur de détection est une **fonction pure** (rapport + récits → candidats), testable sur
fixtures ; des adaptateurs lisent les fichiers. Réutilisable plus tard par le contrat
d'améliorabilité (Sujet B / ADR-030) : un seul moteur, plusieurs appelants.

## Critères d'acceptation

- [ ] `ezk-chef suggest <sprint>` lit le rapport + les récits **en lecture seule** et n'écrit rien.
- [ ] Le **sprint est explicite** : sans identifiant (ou avec plusieurs rapports ambigus),
      `suggest` **refuse** plutôt que de deviner lequel analyser.
- [ ] `suggest` lit des **artefacts produits en amont par la rétro** (rapport + galères figées),
      pas le `SPRINT.md` live : lancé sur un sprint dont les artefacts sont prêts, il trouve les
      galères ; il ne dépend pas d'une clôture ultérieure.
- [ ] Une fiche livrée portant ≥1 galère « résolue + validée + utile » **attribuée sans
      ambiguïté** ressort comme **candidat-recette** (`ficheId` + motif + pointeurs).
- [ ] Une galère d'une session **multi-feature** non attribuée explicitement ne produit **pas**
      de candidat (pas de faux positif « les deux features »).
- [ ] Un sprint sans galère exploitable → **zéro candidat** (pas de faux positif).
- [ ] La détection est une **fonction pure** testée sur fixtures, zéro I/O dans le cœur.
- [ ] `suggest` ne crée **aucune** fiche et ne recopie **aucun** code (ADR-0013).
- [ ] La frontière avec `recipy` / `scan` (repos froids) est documentée dans le SKILL.
- [ ] Gate locale verte (typecheck / lint / tests), avec un test façon `bin/test-labo-cuisine.sh`.

## Comment vérifier

- Fixture « sprint avec galère » (une fiche livrée + un récit portant une galère validée) →
  `suggest` sort 1 candidat sur la bonne fiche.
- Fixture « sprint calme » (aucune galère) → 0 candidat.
- Relire la sortie : elle **nomme** les fiches et **ne crée rien**.

## Notes / décisions

- **Origine** : conception du « pont de capitalisation de fin de sprint », session de
  brainstorming du 2026-08-31 (panel ezk-architect / pm / reviewer / dev, 2 tours).
- **P0** demandée par le PO.
- **Voisine** :
  [20260831075615969](20260831075615969_ezk-retro-invoque-chef-propose-fiche-recette.md) — la
  rétro invoque `suggest` et décide. Membre du **cluster recette** (voir
  [20260829123707200](20260829123707200_reunifier-tagger-cluster-recette.md)).
- **Compose** : le rapport de sprint (fiche `20260826082120062`, shippée), le labo
  ([20260829123707100](done/20260829123707100_labo-de-cuisine-journal-difficultes.md), shippée),
  `ezk-chef extract` (livré). **Dépendances déjà satisfaites.**
- **Frontière** : ne déclenche pas la rétro (réglage séparé) ; ne construit pas la recette
  (sprint N+1) ; pas de scan de repos froids ([0147](0147-ezk-recipy-mvp.md)).
- Doctrine : ADR-0013 (une recette propose, ne fabrique pas de code seule).
