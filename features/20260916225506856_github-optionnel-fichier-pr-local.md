---
id: "20260916225506856"
title: "GitHub optionnel par config — le fichier PR local (fiche rendue) devient le défaut"
type: feature # feature | bug | refactor | chore | epic
priority: P0 # P0 | P1 | P2 | P3
product: mega-city # obligatoire dans ce monorepo — vectorz | mega-city | …
epic: # optionnel — id de la fiche épic parente (type: epic)
labels: [github-optionnel, plugin]
status: idea # idea | ready | in-progress | blocked | shipped
ready: # YYYY-MM-DD — posé par le gate `ready <id>` (DoR complète) ; vide = non groomée
pr:
evidence: none # config + skills, flux CLI, pas d'écran
created: 2026-09-17
---

# 20260916225506856 — GitHub optionnel : le fichier local remplace la PR par défaut

## En clair

Aujourd'hui la méthode suppose GitHub sur le chemin normal : une PR par feature, la CI
cloud, la revue Codex. Sans remote, elle bascule en local — mais c'est une dégradation
**subie**, pas un choix, et le « corps de PR » n'est écrit nulle part de fiable.

On veut l'inverse, comme option assumée. Un réglage de config décide, **capacité par
capacité**, ce que GitHub fait ici : on peut garder la PR mais couper les revues Codex, ou
tout éteindre. GitHub coupé, chaque feature écrit alors **systématiquement** son corps de PR
dans un fichier local (la fiche rendue), sans ouvrir de PR. On travaille plus vite, 100 % en
local, et on retrouve le lendemain un fichier par feature à consulter et à tester.

## Contexte / Problème

`ezk-sprint` (étape 8 « PR », étape 10 « squash-merge ») et les modules `ezk-pr` /
`ezk-ci` / `ezk-codex` parlent GitHub. Il n'existe **aucun interrupteur** : ces skills sont
installés d'office (profil `global`). Le mode « sans GitHub » existe déjà, mais seulement
par accident — en l'absence de remote, la chaîne saute la PR et fait un merge local.

Deux manques concrets :

- pas de réglage qui dise « GitHub off » de façon **explicite, pilotée et granulaire** ;
- le fichier local « titre + corps » n'est **pas produit à chaque feature**. Le pack de
  revue (`REVIEW.md`) existe mais se lance à la main et s'écrase.

Résultat : on ne peut ni assumer proprement « je bosse en local », ni retrouver au réveil
un fichier par feature, comme une liste de PR locale.

## Proposition

**Compose, ne réimplémente pas.** Cette fiche est le cran buildable de **l'axe 2**
(activation + options) du modèle plugin de la fiche chapeau [[20260916225506858]], appliqué
au plugin `github`. Trois briques, toutes adossées à de l'existant :

1. **Un interrupteur de config projet, granulaire.** Un réglage (porté par la config
   `.vectorz/` de la fiche chapeau) décide **capacité par capacité** ce que le plugin
   `github` fait ici : `pr`, `ci`, `codex-review` s'activent **indépendamment**. Exemple :
   `github.pr: on` mais `github.codex-review: off`. Toute capacité coupée → `ezk-sprint` et
   le module concerné **sautent proprement** l'étape sortante (pas de PR, ou pas de CI cloud,
   ou pas d'attente Codex). GitHub entièrement coupé → la revue adverse passe par
   `ezk-reviewer` (local), la gate par `act` / native.
2. **Le fichier PR local, systématique.** À la clôture de chaque feature, le corps de PR —
   qui n'est **que le rendu de la fiche** (ADR-0029) — est écrit dans un fichier local, même
   sans PR. Réutilise l'émetteur `markdown-file` du pack de revue (`src/review/`, déjà
   toujours actif) ; chemin **stable par feature**, pas d'écrasement d'une feature par une
   autre.
3. **Le merge en local.** `git merge --squash` local, déjà couvert par
   [[20260911213014783]] (ADR-0052) — cette fiche ne le refait pas, elle s'y branche.

**Frontière avec les voisines (anti-doublon) :**

- [[20260916225506858]] — la fiche chapeau (modèle plugin : installer / activer + options).
  Cette fiche-ci est son cran buildable pour l'axe 2, cas `github`.
- [[20260911213014783]] *(P0 ready)* — le geste de merge local-first. Réutilisé, pas redécrit.
- [[0183]] *(shippée)* — le pack de revue markdown-first. On le rend **systématique** en fin de sprint.
- [[0171]] *(idea)* — l'adaptateur GitHub Issues config-gated. Même patron « off par défaut, activé par config ».
- ADR de fond : ADR-0029 (corps de PR = rendu de la fiche), ADR-0039 (`ezk-pr` = module GitHub, revue possible sans PR).

## Critères d'acceptation

- [ ] Un réglage de config projet active/désactive **chaque capacité GitHub indépendamment**
      (`pr` / `ci` / `codex-review`) — ex. `pr` on, `codex-review` off ; un projet **sans**
      config garde le comportement actuel (aucune régression).
- [ ] `github` entièrement off → un sprint complet tourne **sans aucun appel `gh`**, sans
      attente CI/Codex ; revue = `ezk-reviewer` local, gate = `act` / native.
- [ ] À la clôture de chaque feature, un fichier local (fiche rendue : « En clair » +
      sections + « Comment vérifier ») est écrit **sans PR**, à un chemin stable, **non
      écrasé** par une autre feature.
- [ ] La liste des features de la session est retrouvable le lendemain (fichiers locaux +
      `git log` + board).
- [ ] `github` tout allumé (repo avec remote) → PR + CI + Codex **inchangés** (non-régression).
- [ ] Gate locale verte (`pnpm build` + `pnpm test` + `pnpm test:scripts` + lint) ; DoD
      script pour tout outillage bash ajouté.

## Comment vérifier

- [ ] Repo **sans remote**, `github` off : `ezk-sprint run` sur une fiche → zéro `gh`,
      branche `feat/…` créée, fichier local écrit, merge squash local.
- [ ] Repo **avec remote**, `github.pr: on` + `github.codex-review: off` : la PR est ouverte,
      mais **aucune** revue Codex n'est déclenchée ni attendue.
- [ ] `git log --oneline` montre le commit de feature ; le fichier local est lisible seul
      (titre + corps).
- [ ] Deux features de suite → **deux** fichiers locaux distincts (pas d'écrasement).

## Notes / décisions

- **Idée du PO** (Thomas, 2026-09-17) : rendre la PR GitHub non systématique ; un fichier
  local titre + corps suffit ; « en P0, déconnecter GitHub, on travaillerait beaucoup plus
  vite ». Activation **granulaire** demandée : ex. activer `github` mais couper les revues
  Codex.
- **Périmètre = l'axe « activation + options »** du modèle plugin (fiche chapeau
  [[20260916225506858]], axe 2). L'*installation* du plugin par projet (axe 1) se rattache à
  [[0087]] / [[0170]].
- **Priorité P0 posée par le PO.** Née `idea` (à groomer + gate `ready` avant tirage).
- **Dépend d'une décision d'archi** portée par la fiche chapeau : rendre la PR elle-même
  optionnelle touche l'invariant ADR-037 (« 1 feature = 1 PR »). Cran mince possible d'abord :
  rendre explicite et systématiser le mode local **déjà** dégradé, sans casser le mode GitHub
  ON.
- **Compose** [[20260911213014783]], [[0183]], [[0171]] ; ne les refait pas.
- Contrainte connue : la revue locale retrouve ~la moitié des défauts de Codex (mesure
  [[20260905134937885]]) — compromis vitesse/filet assumé quand `codex-review` est off.
