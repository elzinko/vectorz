---
id: "20260910152227744"
title: "Des règles propres à un projet (ex. « samplerz en hexagonal »)"
type: feature # feature | bug | refactor | chore | epic
priority: P2
product: vectorz # obligatoire dans ce monorepo — vectorz | mega-city | …
version: V0.4
labels: [installation]
epic:
status: shipped
pr: "#303"
evidence: none # mécanisme / CLI, pas d'écran
created: 2026-09-10
---

# 20260910152227744 — Couche de règles PROJET-LOCAL (`.vectorz/`)

## En clair

Aujourd'hui les règles de la méthode sont globales : elles valent pour tous les projets. On veut
qu'un projet (samplerz) ait ses propres règles, qui ne débordent pas chez les autres, et qu'on sache
dire honnêtement lesquelles sont **garanties** (un contrôle automatique les vérifie) et lesquelles ne
sont que des **conseils**. Le POC livre l'outil qui lit ces règles, les compose avec les bundles
choisis, refuse les incohérences et écrit le résultat là où Claude Code le charge. Il ne fait pas
tourner les contrôles et ne compte pas encore les violations : c'est la suite.

Décision d'architecture : [ADR-0050](../../products/mega-city/docs/adr/0050-couche-regles-projet-local.md).

## Où on en est (relu contre le code du 2026-10-01)

- `.vectorz/config.yml` existe déjà (modules GitHub, `src/loaders/project-config.ts`) : le dossier
  `.vectorz/` est donc déjà « le contrat du projet ». Les règles n'y étaient pas.
- Le mécanisme global `rules/` + `bundles/` existe (76 règles, 43 `MUST`). Ses `enforcements[]` sont
  `prompt`, `agent-check` ou `hook`. **23 `MUST` globaux n'ont aucune garde** : c'est la dette que le
  finding Codex P1 de la PR #219 demandait de ne pas casser d'un coup.
- Claude Code charge `<projet>/.claude/rules/*.md` pour les agents qui tournent dans ce projet, sous-agents
  compris (même mécanisme que `~/.claude/rules/iamthelaw.md`, ADR-0056). C'est le véhicule de la
  composition : pas de runtime à écrire.

## Décisions du POC

- **Disposition** : `.vectorz/rules.yml` (bundles globaux choisis + un binding par règle) et
  `.vectorz/rules/<id>.md` (règle locale, même front-matter que les règles globales).
- **Bindings** : `gate: "<commande ou job CI>"` (le projet l'exécute) · `review: "<agent ou point de
  revue>"` (revue a posteriori liée) · `advisory` (conseil). Les deux premiers sont des
  « enforcements résolvables » ; le troisième plafonne la règle à `SHOULD`/`MAY`.
- **Trois commandes**, domaine `ezk rules` : `check` (le méta-lint, code 1 s'il y a une erreur), `show`
  (imprime le jeu EFFECTIF : chemin du projet, SHA du commit, empreinte, étiquette de garantie par
  règle), `apply` (écrit `.claude/rules/vectorz-project.md`, fichier à marqueur : jamais d'écrasement
  d'un fichier sans marqueur, ni à travers un lien). Racine du projet : `--root` > `EZK_ROOT` >
  racine git du dossier courant. Elle réutilise le résolveur de la fiche 20260826173221323, qui reçoit
  son **défaut en paramètre** : la méthode pour les vues, la racine git du dossier courant ici (le
  dossier courant lui-même hors dépôt git).
- **SHA du commit** : valeur vide explicite (`aucun`, `null` en JSON) quand le projet n'est pas un dépôt
  git ou n'a aucun commit. Ce n'est pas une erreur.
- **Hors POC** (ADR-0050, action 5) : pas de runtime de plugins par agent, et vectorz n'exécute aucun
  gate. « Exécuter » reste au projet.

## Critères d'acceptation

- [x] Manifeste `.vectorz/rules.yml` et règles locales `.vectorz/rules/<id>.md` chargés et validés
      (YAML malformé ou champ inconnu : erreur qui cite le fichier). Preuve : `src/loaders/project-rules.ts`,
      `src/core/project-rules.ts` (`parseRulesManifest`), tests `project-rules*.test.ts`.
- [x] Le chargeur émet le chemin résolu du projet, le SHA du commit et l'empreinte du jeu EFFECTIF
      composé (pas du déclaré). Preuve : `ezk rules show` (test « A, en texte » et « A » en JSON) ; hors
      git, le SHA vaut `null` (test « C »).
- [x] **Scope étanche** : un projet sans manifeste ne compose rien ; la règle locale d'un projet
      n'apparaît jamais dans un autre (test sur deux projets jetables). Preuve : tests « B, sans contrat »
      et « les règles locales d'un projet ne sortent que de SES entrées ».
- [x] **Méta-gate** : un `MUST` local sans `gate:` ni `review:` est refusé au chargement (erreur) ;
      `advisory` sur un `MUST` est refusé ; aucune dégradation silencieuse. Les deux types d'enforcement
      comptent : un gate exécutable, ou une revue a posteriori liée. Preuve : `composeProjectRules` ; test du
      script (code 1, message sur stderr, rien d'écrit).
- [x] **Précédence** : le local peut ajouter ou durcir ; desserrer un `MUST` global est une erreur.
      Preuve : tests « la précédence » (cœur et chargement).
- [x] **Étiquette honnête** : la sortie dit pour chaque règle « gate déclaré (exécuté par le projet, non
      vérifié ici) », « revue a posteriori déclarée » ou « conseil, non garanti » ; une règle advisory n'est
      jamais présentée comme garantie. Le mot « déclaré » est voulu (retour de la revue adverse) : vectorz lit
      la déclaration du projet, il ne vérifie pas que le contrôle existe. Preuve : test `guaranteeLabel` et
      test « A » (deux natures, deux étiquettes).
- [x] **Rien ne devient inchargeable** (finding Codex P1, PR #219) : le méta-gate de ce POC ne juge que les
      règles LOCALES. Les 23 `MUST` globaux sans garde restent chargés tels quels ; la sortie les étiquette
      « MUST sans garde (héritage global, non vérifié) » au lieu de les taire. La migration elle-même est en
      « Suite » : elle précède toute activation du méta-gate sur le corpus global. Preuve : test « les MUST
      globaux sans garde restent chargeables ».
- [x] `ezk rules apply` écrit `.claude/rules/vectorz-project.md` dans le projet visé seulement. Preuve :
      test « apply écrit le jeu dans A seulement » ; refus d'écraser un fichier sans marqueur, d'écrire à
      travers un lien, ou dans un `.claude` qui sort du projet.
- [x] Preuves sur projets jetables, jamais sur un vrai projet. Gate locale verte (typecheck, 1433 tests,
      29 suites bash, liens). Le test s'est allégé : la commande tourne en mémoire, deux vrais processus
      seulement, pour ne pas faire expirer un test voisin (délai de 5 s) sous charge.

## Comment vérifier

Le test vise la couche déterministe (règle injectée, gate déclaré), jamais l'obéissance du LLM.

```bash
# deux projets jetables : A a une règle-gate et un conseil, B n'a rien
pnpm ezk rules check --root /tmp/projet-a     # code 0
pnpm ezk rules show  --root /tmp/projet-a     # les 2 règles, étiquetées différemment
pnpm ezk rules show  --root /tmp/projet-b     # aucune règle projet : rien ne fuit
pnpm --dir products/mega-city exec vitest run project-rules
```

## Suite (hors de ce POC)

- **Migration des `MUST` globaux sans garde** (finding Codex P1, PR #219) : une base « héritage » datée des
  23 ids, un avertissement chiffré, un test qui échoue sur le corpus réel quand un NOUVEAU `MUST` sans
  garde apparaît, puis un mode strict global une fois la base vide. Elle touche le corpus global, pas le
  mécanisme projet : chantier à part.
- **Exécuter** les gates déclarés et tenir les compteurs d'audit (chargé / violé / passé), base du
  retrait mesuré : demande un projet consommateur réel.
- **Banc d'essai samplerz** (contrainte PO) : une règle-gate (`hexagonal-imports`) et une règle conseil,
  rouge sans chargeur, vert avec. À jouer avec le PO.
- Plafond de règles composées par agent (dilution « lost in the middle »).
- Résoudre un `gate:` (le script existe-t-il ?) ; aujourd'hui seule sa forme est contrôlée.
- Passer l'ADR-0050 de « Proposé » à « Accepté » quand le banc d'essai est passé.

## Notes

- Dépend du mécanisme `rules/` + `bundles/` existant : le local l'étend, il ne le duplique pas.
- Né de la rétro samplerz du 2026-09-06 : certaines règles proposées valaient pour la méthode, d'autres
  pour un seul projet.
- Alternatives rejetées (ADR-0050) : B (mémoires et `CLAUDE.md` seuls : ni garantie, ni audit) ; C
  (registre mince et gates CI seuls : jette le guidage génératif).
