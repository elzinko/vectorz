---
id: "20261101131505997"
title: "La gate ne dépend ni de l'index généré ni du retard sur GitHub"
type: bug
priority: P2
product: mega-city
milestone: qualite
version:
labels: [gate, tests, worktree]
status: ready
pr:
evidence: none # outillage et documents, sans écran
created: 2026-11-01
---

## En clair

Dans un worktree neuf, la gate est rouge alors que le code est juste. Deux fichiers de tests lisent
l'index `features/BACKLOG.md`, que git ne suit plus. Deux autres échouent quand la branche a du retard
sur GitHub. Cette fiche rend la gate indépendante de ces deux états du poste.

## Contexte / Problème

Constaté au run du 2026-11-01, sprints 2 et 3 :

- `src/__tests__/ezk-cwd-root.test.ts` et `src/__tests__/project-root-bins.test.ts` lisent
  `features/BACKLOG.md` du dépôt. Ce fichier n'est plus versionné (ADR-0075) : un worktree neuf ne l'a
  pas, et ces tests échouent sur `ENOENT`. Contournement actuel : lancer `bin/regen-backlog.sh` avant
  la gate.
- `src/__tests__/ezk-launcher.test.ts` et `src/__tests__/ezk-local-host-project.test.ts` comparent le
  stderr du lanceur. Quand la branche a du retard sur `origin/main`, le lanceur y ajoute « le code
  d'ezk a N commits de retard », et les deux tests échouent.

Revu le 2026-11-02, à l'intégration du carnet de tests : dans un worktree neuf, la gate a rendu
5 échecs sur 2385 tests (4 dans `ezk-cwd-root.test.ts`, 1 dans `project-root-bins.test.ts`), tous sur
`ENOENT … features/BACKLOG.md`. Après un `regen-backlog.sh` à la main, les 33 tests de ces deux
fichiers passent. Le piège coûte une gate rouge à chaque story construite dans un worktree neuf.

## Valeur

Pour le dev qui construit dans un worktree neuf : une gate rouge doit vouloir dire « le code est
faux », jamais « le poste n'est pas préparé ». Moins de faux rouges, moins de temps perdu à chercher.

## Proposition

Précisée au grooming du 2026-11-03 (run autonome), d'après le code.

1. **L'index absent reste absent.** Les deux fichiers de tests lisent l'index du vrai dépôt pour
   vérifier qu'une commande ne l'a pas touché (`ezk-cwd-root.test.ts:68` et
   `project-root-bins.test.ts:145`). Ils prennent une photo qui accepte l'absence : le contenu du
   fichier, ou « absent ». Après la commande, la photo doit être la même. Un index absent qui
   apparaît fait donc échouer le test, comme un index modifié.
2. **Le retard se coupe par une variable.** Le lanceur `bin/ezk.ts` lit `EZK_NO_LAG_WARNING=1` et
   n'écrit alors pas l'avertissement de retard. Les helpers des deux tests du lanceur posent cette
   variable. Sans elle, l'avertissement reste écrit comme avant.

```
aujourd'hui   worktree neuf → pas d'index → readFileSync → ENOENT → gate rouge
après         worktree neuf → photo « absent » → commande → photo « absent » → vert
```

## Critères d'acceptation

- [ ] Dans un worktree neuf, sans `regen-backlog.sh`, `pnpm test` est vert.
- [ ] Avec une branche en retard sur `origin/main`, `pnpm test` est vert.
- [ ] Aucun test ne lit `features/BACKLOG.md` du vrai dépôt sans le créer lui-même.
- [ ] Sans `EZK_NO_LAG_WARNING`, un checkout en retard écrit toujours l'avertissement : un test le
      garde.

## Comment vérifier

```bash
git worktree add /tmp/wt-gate -b essai-gate main && cd /tmp/wt-gate && pnpm install --frozen-lockfile && cd products/mega-city && pnpm test
```

## Notes

- Née de la rétro légère du 2026-11-01 (P3 de la rétro), acceptée par le PO le même jour :
  [rétro du run des contrats JSON](../docs/captures/2026-11-01-retro-run-contrats-json-light.md).
- Priorité P2 par défaut, comme les fiches de la rétro précédente : à ajuster au grooming.
- Groomée le 2026-11-03 (run autonome) : proposition précisée d'après le code ; taille d'une
  petite story (deux helpers de test, une variable lue par le lanceur).
- Prête le 2026-11-03 : porte « prête » passée en run autonome (ezk-pm GO). Conditions : le test qui
  garde l'avertissement sans `EZK_NO_LAG_WARNING` est dans la livraison ; le critère « worktree neuf »
  se prouve dans un vrai worktree neuf, sans `regen-backlog.sh`. À construire avant la fiche des
  règles lues au démarrage, qui ajoute un test de gate.
