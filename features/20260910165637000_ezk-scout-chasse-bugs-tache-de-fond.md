---
id: "20260910165637000"
title: "ezk-scout — chasse aux bugs en tâche de fond : trouver et ficher, jamais corriger"
type: feature
priority: P2
product: mega-city
epic:
depends: ["20260906135450000", "20260812104022228"]
labels: [ezk-method, qa, bug-hunting, testbed, scout]
status: ready
ready: 2026-09-10
pr:
evidence: none # capacité de méthode (skill) ; preuve = ses propres tests + un run de démonstration
created: 2026-09-10
---

# ezk-scout — chasse aux bugs en tâche de fond (trouver et ficher, pas corriger)

## En clair

On veut un outil qu'un agent lance pour **chercher des bugs tout seul, en tâche de
fond**, dans une app qui tourne. Il **trouve** et **fiche** — il ne corrige
jamais. Chaque trouvaille devient une fiche de bug complète : description claire,
reproduction, gravité, et en option une **capture d'écran** (bug de rendu) et une
**localisation** dans le code (`fichier:ligne`). Quelqu'un d'autre décide ensuite
quoi corriger.

L'idée vient d'un run samplerz (2026-09-10) : le prompt « ezk-product-build …
fais-en le maximum, si bloqué teste via la webapp/l'émulateur, crée des fiches
`suggest` » a trouvé **3 vrais bugs** et les a fichés. Ça a bien marché. On veut
en faire un **outil de première classe**, pas un prompt bricolé.

## Contexte / Problème

Aujourd'hui, trouver des bugs est **artisanal** : on l'improvise dans un prompt.
Rien dans la méthode ezk ne dit à un agent « va chasser des bugs et fiche-les ».
Deux manques :

1. **Pas d'outil dédié.** Le run samplerz du 2026-09-10 l'a fait à la main via
   `ezk-product-build ... --mode auto ... « fais en le maximum ... teste via la
   webapp ou l'émulateur ... crée des fiches suggest »`. Résultat : bornes de crop
   non validées (samplerz #403), et deux `500` sur l'export direct — dossier non
   inscriptible **et** BPM cible ≤ 0 (samplerz #404). Trouvés ET fichés dans la
   foulée. Ça a marché parce que : **état isolé**, **sondage systématique**
   (API + UI), et surtout **capturer sans corriger**.
2. **La séparation trouver / corriger n'est pas outillée.** Corriger en tâche de
   fond serait dangereux (changements de code non supervisés) et illisible. Un
   agent qui **cherche** doit pouvoir tourner en fond ; **corriger** reste une
   décision revue (humain, ou `ezk-sprint`). C'est cette frontière que l'outil
   matérialise.

**Quand ça sert le plus** : quand le backlog est **bloqué** (têtes sur gestes
humains — boutique, device, terrain), un agent devrait chasser des bugs
proactivement au lieu de s'arrêter. C'est exactement le repli « si tu es bloqué,
teste » du run samplerz.

## Proposition

Une nouvelle **capacité de méthode ezk** (skill), nom proposé **`ezk-scout`**
(l'éclaireur : il explore et rapporte, il n'engage pas le combat). POC d'abord,
polish ensuite.

Ce qu'elle fait :

- **Sonde bornée, en tâche de fond**, une app qui tourne : soit la **webapp** via
  un serveur de dev **isolé**, soit un **émulateur Android** (compose la recette
  émulateur, fiche `20260906135450000`).
- **Isole l'état** de l'app avant de piloter (répertoire d'état en tmp :
  prefs / session / credential / cache), pour ne jamais toucher l'état réel de
  l'utilisateur. C'est la première leçon du run samplerz.
- **Cherche des classes d'anomalies** : robustesse (un `5xx` sur entrée cassée),
  **trous de validation d'entrée** (bornes absurdes, valeurs ≤ 0…), **bugs de
  rendu** (visuels → capture), écarts **UX / accessibilité**.
- **FIND-ONLY — invariant dur** : ne modifie **jamais** le code produit. La sortie
  est faite de fiches, pas de diffs.
- **Fiche chaque trouvaille** via `ezk-backlog add` (compose, ne réimplémente pas
  le backlog). Une fiche riche :
  - description « En clair » + **reproduction** exacte (requête / étapes) ;
  - **gravité** + type/priorité suggérés ;
  - **capture d'écran optionnelle** — pour un bug de rendu (compose le mécanisme
    de captures, fiche `20260812104022228`, plutôt que de le réinventer) ;
  - **localisation optionnelle** — un pointeur `fichier:ligne` où le bug vit
    probablement (assistance par recherche de code, **opt-in**, best-effort : un
    indice, pas une garantie).
- **Rapporte un résumé** : N trouvées, M fichées, K écartées (avec raison).
- **Se compose** : invocable seule, **ou** appelée par `ezk-product-build` quand
  le backlog est bloqué (le chemin « si bloqué, teste » du run samplerz).

## Critères d'acceptation

- [ ] Une capacité ezk dédiée (skill) existe ; un agent l'invoque pour lancer une
      passe de chasse aux bugs, en tâche de fond, sur une app qui tourne.
- [ ] Elle ne modifie **jamais** le code produit (find-only, vérifiable — p. ex.
      `git diff` du code produit reste vide après une passe).
- [ ] Elle isole l'état de l'app avant de piloter (compose la recette d'isolation).
- [ ] Chaque trouvaille devient une fiche `ezk-backlog` portant : description +
      reproduction + gravité + capture optionnelle (bug de rendu) + localisation
      optionnelle (`fichier:ligne`).
- [ ] La passe est **bornée** (budget/temps) et rend un **résumé** en fin.
- [ ] Elle **compose** `ezk-backlog`, la recette émulateur et le mécanisme de
      captures — sans les réimplémenter.
- [ ] La **frontière** est documentée vs `ezk-qa` (valide une PR précise),
      `ezk-reviewer` (relit un diff), `ezk-sprint` (construit), `ezk-product-build`
      (décide/construit) : `ezk-scout` explore une app qui tourne et fiche des bugs,
      puis **nourrit** les autres.
- [ ] Gate locale verte (typecheck / lint / tests du skill) puis démonstration
      d'un run réel (au moins un bug fiché de bout en bout).

## Notes / décisions

- **Prototype validé** : le run samplerz 2026-09-10 (crop #403, export #404) via le
  prompt ad hoc. Cette fiche **productise** ce prompt en outil de première classe.
- **Statut des bugs trouvés** : samplerz a introduit `# status: suggest` (trouvaille
  de test à confirmer). vectorz utilise `idea / ready`. À trancher au build : les
  bugs fichés naissent-ils `idea`, ou introduit-on un marqueur « scouté / à
  confirmer » ? (Ne pas les tirer directement sans revue — c'est le sens du
  find-only.)
- **Capture d'écran** : réutiliser le mécanisme de la fiche `20260812104022228`
  (captures produit → doc/site) plutôt que d'en écrire un second.
- **Émulateur / device** : réutiliser la recette `20260906135450000` (démarrer
  l'émulateur Android / tester sur device).
- **Localisation `fichier:ligne`** : opt-in et best-effort (une recherche de code
  qui pointe un candidat). Ne pas la vendre comme certaine.
- **Distinct de `20260812104022231`** (« DoR — balayer les surfaces produit au
  grooming ») : celle-là inventorie les surfaces AU GROOMING (avant de construire) ;
  `ezk-scout` chasse des bugs APRÈS coup, sur une app qui tourne.
- **Coût tokens** : une passe multi-sondes peut être lourde. Borner la passe (esprit
  `--tokens lean` d'`ezk-product-build`) et prévenir avant tout fan-out coûteux.
- **Émission de supervisabilité** : une passe en tâche de fond est un bon client du
  heartbeat / run (fiche 0103) pour rester visible au Moniteur.
