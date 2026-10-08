---
id: "20260826173221323"
title: "Pouvoir pointer les vues sur un autre projet (muti, samplerz)"
type: refactor
priority: P2
product: mega-city
labels: [installation]
version: v0.4.0
epic:
status: shipped
pr: "#299"
created: 2026-08-26
---

# 20260826173221323 — Racine de données paramétrable dans les vues

## En clair

Le tableau de bord et les vues de la méthode ne lisent que les fiches de vectorz. On les rend
capables de lire celles d'un autre projet (muti, samplerz). Il suffit de désigner le projet :
`--root <dossier>` ou la variable `EZK_ROOT`. Sans rien, rien ne change. C'est le premier
déblocage pour installer la méthode ailleurs.

## Où on en est (relu contre le code du 2026-10-01)

La première version de cette fiche citait `regen-avancement.ts` et `regen-plan-view.ts`. Ils
n'existent plus. Depuis l'[ADR-0055](../../products/mega-city/docs/adr/0055-artefacts-generes-hors-versionnage.md),
`ezk dashboard` calcule les données du board à chaque requête (`src/io/derived-views.ts`), et
`views:regen` les écrit sur disque.

Le cœur est déjà propre : `loadFiches(rootDir)` et chaque `DATA_VIEWS[].build(root)` reçoivent la
racine en paramètre. Ce qui la fige, ce sont les points d'entrée : ils la tirent de `import.meta.url`
(`bin/ezk-map.ts`, `bin/avancement.ts`, `bin/plan-head.ts`). `bin/check-fiches.ts` accepte déjà
`--root`, mais pas la variable d'environnement.

Il y a **deux racines**, à ne pas confondre :

- **la méthode** (le dépôt vectorz) : les pages (`diagrams/`) et les outils. Elle ne change jamais ;
- **le projet** : ses fiches (`features/`), son `PLAN.md`, ses récits (`docs/sessions/`), ses pouces
  (`features/reviews/verdicts/`). C'est elle qu'on rend paramétrable. Par défaut : la méthode.

## Décisions

- **Ordre** : `--root` (argument) > `EZK_ROOT` (variable) > défaut = le dépôt de la méthode. Un chemin
  relatif se lit depuis `INIT_CWD`, sinon le dossier courant : c'est la règle de `resolveProjectPath`
  (supervision), réutilisée.
- **Pas de détection automatique** depuis le dossier courant. « Sans argument ni variable, rien ne
  change » reste ainsi vrai à la lettre.
- **Quatre commandes** lisent le projet désigné : `ezk dashboard`, `ezk board show`,
  `ezk backlog check`, `ezk backlog plan-head`. Le manifeste gagne une marque `project: true` ; pour ces
  commandes, `ezk --root <projet> …` n'est plus refusé et passe `EZK_ROOT` au script.
- **Garde anti-traversée** : les fichiers servis restent ceux de `diagrams/` (la méthode), avec la même
  garde. Le projet n'est lu que par les vues de données (calculées, sans chemin venu de la requête)
  et par la route du pouce haut/bas (id validé), qui écrit dans `features/reviews/verdicts/` du projet.
- **Refus assumés** : `views regen` écrit dans la méthode, donc refuse un autre projet avec un message
  clair. `views map-data` décrit la méthode (catalogue), pas un projet : hors sujet.

## Critères d'acceptation

- [x] `ezk backlog check` accepte déjà `--root <dossier>` (preuve : `bin/check-fiches.ts`, test
      `bin/test-check-fiches.sh`). Reste : la variable `EZK_ROOT` et le passage par le routeur.
- [x] Un résolveur unique (pur, testé) applique l'ordre argument > variable > défaut ; un dossier absent
      ou qui n'est pas un dossier est refusé avec un message clair (pas de page vide trompeuse).
      Preuve : `src/core/project-root.ts`, `src/io/project-root.ts`, `src/__tests__/project-root.test.ts`.
- [x] Les quatre commandes ci-dessus suivent cette règle, y compris via `ezk --root <projet> <commande>`
      et via `EZK_ROOT=<projet> ezk <commande>`. Preuve : marque `project: true` au manifeste, tests
      `ezk-cli`, `ezk-launcher`, et `ezk-manifest` (chaque commande marquée lance un script qui lit la racine).
- [x] Sur un projet jetable, le tableau de bord (données du board) et `ezk board show` montrent les
      fiches DE ce projet, pas celles de vectorz. Preuve : `src/__tests__/project-root-bins.test.ts`.
- [x] Sans argument ni variable, la sortie est identique à celle d'aujourd'hui (test : défaut ==
      `--root <dépôt de la méthode>`). Preuve : même fichier.
- [x] La route du pouce écrit dans le projet désigné ; la garde de traversée du serveur est inchangée.
      Preuve : même fichier (le pouce tombe dans le projet jetable, jamais dans vectorz).
- [x] `ezk --root <autre> <commande qui écrit dans la méthode>` reste refusé, avec un message à jour.
      Preuve : `ezk-cli.test.ts` et `ezk-launcher.test.ts`.
- [x] Gate locale verte (typecheck, tests, lint, liens). Constat : l'essai de bout en bout lance des
      processus ; sa première version faisait expirer, sous charge, un test voisin (délai de 5 s). Il est
      allégé (un serveur partagé, scripts lancés sans le routeur quand il n'est pas l'objet du test).

## Comment vérifier

```bash
# les fiches d'un AUTRE projet (dossier jetable : on ne touche pas à muti)
EZK_ROOT=/chemin/vers/projet pnpm ezk board show
pnpm ezk --root /chemin/vers/projet dashboard
# sans rien : comportement d'avant (fiches de vectorz)
pnpm ezk board show
```

Attendu : avec `--root` ou `EZK_ROOT`, on voit les fiches du projet désigné ; sans, celles de vectorz,
à l'identique d'aujourd'hui. Les tests le prouvent sur un projet jetable (`src/__tests__/project-root*.test.ts`).

## Suite (hors de ce POC)

- `views regen` pour un autre projet (il écrit des fichiers : décision à part) ;
- `ezk board check` (il lit `PORTFOLIO.md`, généré hors git, absent d'un projet neuf) ;
- `backlog regen`, `backlog portfolio`, `docs check-links` : leur `{root}` du manifeste vise toujours la méthode ;
- accrocher le projet hôte à la méthode (dossier `.vectorz/`, fiche voisine sur les règles projet).

## Notes

- **Fille de l'épic** [20260813124026215](20260813124026215_deploiement-methode-llm-native.md) :
  le déblocage n°1 de la session d'architecture du 2026-08-26. Faible regret : vraie quelle que soit
  l'option d'ancrage retenue.
- **Adjacente, distincte** de `20260823121712844` (durcir `regen-backlog` contre une racine par défaut
  nichée) : ici on ouvre une racine désignée aux vues, là on verrouille un défaut dangereux.
- Le message du routeur qui disait « le chantier racine paramétrable n'est pas fait » disparaît avec
  cette fiche.
