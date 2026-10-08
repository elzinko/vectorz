---
id: 0171
title: "Recopier sur GitHub ce que la méthode écrit en local : issues, PR, labels, versions"
type: feature
product: mega-city
labels: [github-optionnel, plugin]
milestone:
version: v0.7.0
priority: P1
epic:
depends: [0170]
status: idea
pr:
evidence: none # pas d'écran produit : la preuve est l'état de l'issue et de la PR sur GitHub (gh … --json)
created: 2026-07-30
---

# 0171 — Recopier sur GitHub ce que la méthode écrit en local

**En clair.** La méthode écrit toujours deux choses en local : la fiche de la story, puis le
document de PR quand la story est livrée. Quand le plugin GitHub est branché, elle doit en plus
les recopier sur GitHub. La fiche prête devient une issue. Le document de PR devient la PR qui
ferme cette issue, avec les bons labels et le bon milestone. À la fin d'une version, une release
s'y ajoute. Le local reste l'original ; GitHub n'en est que la copie.

**Si tu arrives frais.** Une *fiche* est un fichier markdown de `features/` qui décrit une user
story. Le *document de PR local* est `features/pr-local/<id>_<slug>.md` : le texte qu'aurait une
PR, écrit même sans GitHub. Le *plugin `github`* est un jeu d'interrupteurs dans
`.vectorz/config.yml` (`pr`, `ci`, `codex-review`), piloté par `ezk config github …`.

## Contexte / Problème

Constat du 2026-10-03, posé par le PO : « je me suis un peu trompé de philosophie ».

- Sur GitHub, vectorz n'utilise que les PR. Le dépôt a 2 vieilles issues, 0 milestone, 0 release
  et les labels par défaut. Les étiquettes git v0.1 à v0.4 existent, mais aucune release ne les
  montre.
- Un lecteur du dépôt GitHub ne voit donc ni le backlog, ni les versions, ni la story que livre
  une PR.
- Le plugin `github` n'a aucun interrupteur pour les issues.
- En mode GitHub, le corps de PR part directement sur GitHub. Le document de PR local n'est écrit
  qu'en mode sans GitHub. Le local n'est donc pas complet quand GitHub est branché.

Cette fiche existait depuis le 2026-07-30 sous la forme « export en lecture seule », parkée en P2.
Le PO la réveille le 2026-10-03 : recopier sur GitHub devient le fonctionnement normal du plugin,
pas une option de vitrine.

## Décisions du PO (2026-10-03)

1. **Le local commande.** On écrit dans la fiche et dans le document de PR local. GitHub reçoit
   une copie, jamais l'inverse. C'est la règle de l'ADR-0039, qui ne change pas.
2. **Le local est complet sans GitHub.** Fiche, document de PR, revue, merge et rangement se font
   tous en local, et sont committés. Brancher GitHub ne retire rien au local : ça ajoute la copie.
3. **L'issue naît au passage en `ready`.** Les idées et les fiches parkées restent seulement dans
   le markdown.
4. **On rend d'abord le cycle local propre.** Le mode local existe déjà, mais il n'a jamais tourné
   sur vectorz : il n'y a aucun dossier `features/pr-local/`. On le fait tourner d'abord sur une
   fiche factice. Cette fiche-ci se construit après.
5. **On réveille cette fiche** plutôt que d'en créer une neuve : c'est le même sujet.

## Proposition

Deux objets locaux, deux copies sur GitHub :

```
TOUJOURS EN LOCAL (committé)                       SI LE PLUGIN GITHUB EST BRANCHÉ
features/<id>_<slug>.md           ── ready ──────▶  issue #N (labels, milestone)
features/pr-local/<id>_<slug>.md  ── livraison ──▶  PR (corps = ce document + « Closes #N »)
étiquette git vX.Y                ── version ────▶  release vX.Y
```

Le cycle, étape par étape :

1. `ezk-backlog ready <id>` crée l'issue et écrit son numéro dans la fiche (`issue: "#N"`).
2. À la livraison, `ezk pr emit-local` écrit le document de PR local, **dans tous les modes**.
3. Si `pr` est actif, la PR GitHub prend ce document comme corps, avec `Closes #N`.
4. Au merge, GitHub ferme l'issue tout seul.
5. Une fiche close sans merge (`superseded`, `merged`, `split`) ferme son issue avec un
   commentaire qui dit pourquoi.
6. `ezk-backlog version close X` propose aussi la release GitHub, à côté de l'étiquette. Le PO la
   crée, comme il pousse l'étiquette.

Correspondance des champs, de la fiche vers l'issue :

| Fiche | GitHub | Pourquoi |
|---|---|---|
| `title`, « En clair », lien vers la fiche | titre et corps de l'issue | le corps renvoie à la fiche ; il ne la recopie pas en entier |
| `type` | label `type:feature`, `type:bug`… | les « types d'issue » GitHub sont réservés aux organisations ; vectorz est sous un compte perso (`issueTypes: null`) |
| `priority` | label `P0` à `P3` | |
| `labels:` | label `theme:<nom>` | |
| `product:` | label `product:<nom>` | |
| `version:` | milestone `V0.7` | **pas** le champ `milestone:` de la fiche |
| `milestone:` | label `jalon:<nom>` | dans la fiche, `milestone:` est un jalon thématique (`cockpit`) ; sur GitHub, milestone = version |
| sprint | rien pour commencer | GitHub n'a pas d'objet sprint, hors Projects |

L'interrupteur : une 4ᵉ capacité `issues` dans le plugin `github`, **coupée par défaut**. Un projet
qui a déjà `github` actif, comme muti ou samplerz, ne se met pas à créer des issues sans qu'on le
demande. L'ADR-0039 l'exige : l'activation est explicite.

Un geste de rattrapage : une commande idempotente recalcule l'issue depuis la fiche (titre, labels,
milestone). Elle sert quand la fiche bouge après `ready`, et ne crée jamais de doublon. C'est un
script qui pose les labels, pas le LLM à la main (ADR-0001).

## Critères d'acceptation

- [ ] Le cycle local a tourné une fois en entier sur vectorz avec une fiche factice : fiche,
      document de PR local, revue, merge local, rangement. Les frictions sont notées dans cette
      fiche.
- [ ] Avec GitHub branché, le document de PR local est quand même écrit et committé, et la PR
      GitHub porte exactement ce texte.
- [ ] Sans la capacité `issues`, rien ne change : aucune issue créée, aucun appel `gh issue`.
- [ ] Avec `issues` actif, `ready <id>` crée une issue dont le titre, les labels et le milestone
      suivent la table ; la fiche porte `issue: "#N"`.
- [ ] Relancer le geste de rattrapage sur une fiche qui a son issue met l'issue à jour sans en
      créer une seconde ; les labels et milestones manquants sont créés une seule fois.
- [ ] Après le merge de la PR, l'issue est fermée et liée à la PR.
- [ ] Une fiche close sans merge ferme son issue avec un commentaire qui dit pourquoi.
- [ ] `version close X` propose la release `vX.Y` sans la créer seule.
- [ ] Le cœur d'ezk-backlog (`add`, `ready`, `ship`, `regen`) tourne sans `gh` : si `gh` manque,
      il le dit et continue.

## Comment vérifier

Le cycle local, sur la fiche factice, avant tout code :

```bash
ezk config github off                       # vectorz passe en mode local
ls features/pr-local/                       # le document de PR de la fiche factice existe
git log --oneline -3 -- features/pr-local   # et il est committé
```

La copie GitHub, après le merge de la PR de test :

```bash
gh issue view <N> --json state,labels,milestone,closedByPullRequestsReferences
gh pr view <PR> --json body,closingIssuesReferences
```

Le calcul fiche → issue (labels, milestone) est une fonction pure, testée sans réseau. Son fichier
de test se nomme au grooming.

## Gênes relevées au test du cycle local

Banc : `cop1-cobaye` (mini-site jetable, sans remote), décidé par le PO le 2026-10-03. Son
outillage BMAD a été retiré avant le test ; l'état de départ porte l'étiquette `banc-vierge`.
Story testée : le bouton de mode sombre du banc. Sa revue a rendu GO.

**Résultat : le cycle local complet a tourné une fois, le 2026-10-03.** Fiche, code et vrai test,
revue GO, document de PR local, squash local (`47c5f65`), rangement (`68d0797`), sprint scellé.
Il a fallu cinq contournements, listés ci-dessous.

**Bloquant pour un projet hôte : le skill de sprint prescrit des commandes qui refusent.**

1. **`ezk pr emit-local` et `ezk review emit` refusent de viser un projet hôte.** Ce sont les
   deux commandes que `ezk-sprint` prescrit en mode local. Avec `--root <projet>`, elles
   répondent « cette commande écrit dans le dépôt de la méthode ». Les scripts sous-jacents
   savent pourtant écrire dans le dossier d'où on les lance. Contournement :
   `pnpm --dir <vectorz>/products/mega-city pr:emit-local …` (idem `review:emit`), lancé depuis
   le projet.
2. **Le message d'erreur envoie vers le mauvais projet.** Sans `--root`, `ezk config`,
   `ezk run context`, `ezk backlog plan-head`, `ezk pr emit-local` et `ezk review emit`
   conseillent d'ajouter `--root …/vectorz`. Pour `ezk config github off`, suivre ce conseil
   coupe GitHub dans vectorz, pas dans le projet visé. `ezk backlog ship` et `regen` visent
   pourtant le dossier courant depuis la PR #344. Contournement pour la config :
   `ezk --root <projet> config github off`.
3. **Le document de PR local a ses liens cassés.** Il recopie la fiche telle quelle un dossier
   plus bas (`features/pr-local/`). Les liens relatifs de la fiche, ici les trois images de la
   preuve avant / après, n'y mènent plus nulle part. L'émetteur doit recaler les liens. Sa
   ligne de provenance reste aussi sur `features/<fiche>` après le rangement dans `done/`.
4. **`SPRINT.md` bloque le merge local.** `init` ne déclare pas ce fichier à git dans le projet
   hôte, alors que vectorz l'ignore dans son propre `.gitignore`. Le fichier reste « non
   suivi », et `ship-merge.sh --local` refuse un dépôt qu'il juge sale. Contournement : ajouter
   `SPRINT.md` à `.git/info/exclude`.

**Gênant.**

5. **`ezk run context` ne sait pas viser un projet hôte.** Le skill de sprint le lance pourtant
   à l'ouverture.
6. **La preuve avant / après suppose GitHub et Playwright dans le projet.**
   `pr-evidence.sh render` exige un remote GitHub pour fabriquer ses liens : il échoue en mode
   local. `capture` lance par défaut le Playwright du projet, absent d'un site sans dépendance.
   Le Playwright de vectorz attend une version de navigateur absente du poste. Contournement :
   `PR_EVIDENCE_SHOT_CMD` vers un Playwright déjà installé.
7. **`capture` ne photographie qu'une adresse.** Un état obtenu par un clic, ici le thème
   sombre, se capture à la main. `render` ne montre que les paires avant / après.
8. **`ship` met en index le déplacement, pas le contenu.** Après `ezk backlog ship`, la fiche
   déplacée dans `done/` porte `status: shipped`, mais seul le déplacement est en index. Un
   commit qui liste ses fichiers un par un, comme le veut la méthode, embarque la fiche encore
   `ready`. Rattrapé ici par un `--amend`.
9. **`ezk backlog plan-head` plante sans `PLAN.md`** (code 2) au lieu de se rabattre sur la
   priorité, comme le skill le promet.

**Mineur.**

10. **Le message parle d'une variable qu'on n'a pas tapée.** Avec `--root`, `ezk` affiche
    « Projet visé : … (variable EZK_ROOT) ». C'est voulu par un test, mais ça déroute.
11. **Le `README.md` créé par `init` pointe vers un `PLAN.md` que `init` ne crée pas.** C'est le
    seul lien cassé laissé par la méthode hors document de PR.
12. **`ship-merge.sh --local` ne dit rien quand il réussit.** Il faut lire `git log` pour savoir
    que le merge a eu lieu.
13. **`check-links.sh .` suppose l'arbre de vectorz** : il cherche `docs/adr` et s'arrête dans un
    projet qui n'en a pas.
14. **`review emit` demande neuf options**, dont la version de la méthode (le paquet dit `0.0.0`,
    on a passé le SHA).
15. **Un projet sans dépendance n'a pas de lanceur Gherkin.** Les scénarios sont portés par les
    noms des tests `node:test`.
16. **Le banc avait une fausse gate.** `npm test` affichait « ok » sans rien tester. Le sprint
    l'a remplacé par un vrai test ; `npm run lint` reste factice. C'est un défaut du banc, pas
    de la méthode.

Vérifié sans défaut : `init` crée un `features/done/` vide que git ne garde pas, mais le premier
`ship` le recrée sans erreur.

## Glossaire

- `ready` — statut d'une fiche prête à être développée.
- `ship` — commande qui range une fiche livrée dans `features/done/`.
- `reconcile` — commande qui relit les PR mergées sur GitHub et propose de ranger les fiches
  livrées.
- `Closes #N` — mot-clé GitHub : écrit dans une PR, il ferme l'issue n°N au merge.
- idempotente — se dit d'une commande qu'on peut relancer autant de fois qu'on veut : le résultat
  est le même.

## Notes / décisions

- Doctrine : [ADR-0039](../products/mega-city/docs/adr/0039-trois-etages-moteur-methode-branchements-plugin.md),
  sens local → GitHub. Le corps de PR reste le rendu de la fiche
  ([ADR-0029](../products/mega-city/docs/adr/0029-fiche-est-le-document-pr-en-est-le-rendu.md)) ;
  on y ajoute seulement `Closes #N`.
- Le blocage d'origine est levé : le modèle de plugin est livré
  ([0170](done/0170-modele-extension-plugin-mega-city.md)).
- Le mode local sur lequel on s'appuie est livré, mais n'a jamais tourné sur vectorz :
  [le fichier PR local](done/20260916225506856_github-optionnel-fichier-pr-local.md),
  [son émetteur](done/20260917214300145_emetteur-corps-pr-local.md),
  [l'interrupteur `ezk config github`](done/20260920111652514_piloter-plugin-github-config.md).
- Correction de l'ancienne table : elle associait « sprint → milestone ». Le milestone GitHub suit
  la version.
- Version V0.7 choisie par le PO (« pas encore trop urgent »). Le train de `PLAN.md` décrit
  aujourd'hui V0.7 comme « amélioration mesurée, parkée » : à recaler au prochain `plan set`.
- Frontières : [l'intake des issues venues des apps](0174-ezk-issues-intake-github.md) va dans
  l'autre sens (issue → fiche) et doit ignorer les issues créées ici.
  [Le backlog à stockage interchangeable](0093-backlogstore-port-agnostique.md) n'est pas concerné :
  le local reste maître.
- Statuts `merged` / `split`
  ([rationalisation du backlog](done/20260812104022240_backlog-rationalisation-tags-script-llm.md)) :
  projetés par l'étape 5 du cycle.
- Renommage « feature ↔ user story » : hors de cette fiche.
