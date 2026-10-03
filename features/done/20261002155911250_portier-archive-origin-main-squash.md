---
id: "20261002155911250"
title: "Le portier d'ezk-archive compare à origin/main et reconnaît un squash-merge"
type: bug
priority: P1
product: mega-city
milestone:
version: V0.5
labels: [archive]
status: shipped
pr: "#345"
evidence: none # script de clôture, pas d'écran
created: 2026-10-02
---

# 20261002155911250 — Le portier d'ezk-archive compare à origin/main et reconnaît un squash-merge

**En clair.** À la clôture d'une session, le portier d'`ezk-archive` classe « à récupérer » des
branches dont tout le contenu est déjà sur `main`. Depuis le 2026-10-01, il sait reconnaître un
squash-merge, mais à la clôture il compare encore au `main` local, souvent en retard sur
`origin/main`. On le fait comparer à `origin/main`, comme le fait déjà le ménage : une clôture ne
crie plus au loup.

**Si tu arrives frais.** Le *portier* est `skills/ezk-archive/scripts/check.sh` : il dit si une
session peut être archivée sans rien perdre. Un *squash-merge* écrase les commits d'une branche en un
seul commit sur `main` : la branche n'est plus un ancêtre de `main`, même si tout son contenu y est.

## Contexte / Problème

Trois occurrences, dans le projet muti :

- 2026-09-29 : une branche identique à `origin/main` (`git rev-list --count origin/main..HEAD` = 0)
  classée « REAL / unproven ». Note de carnet muti
  `20260929191041932-gate-archive-compare-a-main-local-perime`.
- 2026-10-01 : à la clôture, les branches des PR muti #266 et #267, déjà mergées en squash, classées
  « REAL ».
- 2026-10-02 : clôture de la même session muti. La branche de la rétro, fusionnée en squash (PR muti
  #270), classée « REAL ». Les points 3 et 4 du portier ont le même défaut : une fiche livrée dite
  « non livrée », un ADR dit « non fusionné », car ils lisent le worktree en retard plutôt
  qu'`origin/main`. À trancher au grooming : les traiter ici ou dans une fiche voisine.

Coût : à chaque clôture, le pilote doit prouver à la main que rien n'est perdu. Pire, un faux
« REAL » peut cacher une vraie branche non mergée au milieu du bruit.

**Ce qui est déjà fait** (lu dans le code le 2026-10-03, PR #311 du 2026-10-01) :

- **Le squash est reconnu.** `classify_ref` vérifie que le contenu de chaque fichier de la branche
  est arrivé sur la base. C'est robuste au squash, et ça marche sans GitHub.
- **Le ménage compare à `origin/main`.** En mode `--cleanup`, le portier prouve contre
  `origin/<base>` et sa jumelle locale (`PROOF_BASES`).
- **Le portier mesure son retard.** Le contrôle `MAINSYNC` calcule l'écart entre `main` et
  `origin/main`, et l'affiche.

**Ce qui reste cassé.** À la clôture, le mode par défaut, le portier classe les branches contre le
`main` **local** (`git branch --no-merged "$BASE"`, puis `classify_ref "$BASE"`). Si ce `main` est en
retard, une branche déjà fusionnée en squash sur `origin/main` est classée « REAL ». Le portier
connaît pourtant ce retard : il ne s'en sert pas pour classer.

## Proposition

1. **À la clôture, le portier prouve chaque branche contre `origin/<base>`**, plus sa jumelle
   locale, quand la ref distante existe. C'est ce que fait déjà le ménage : on réutilise
   `classify_ref` et `PROOF_BASES`, sans algorithme nouveau.
2. **Le skill `ezk-archive` fait le `git fetch`, juste avant d'appeler le portier.** Le script reste
   strictement en lecture : le test G7 (`test-check-gate.sh`) interdit qu'il fasse un `fetch`. C'est
   l'outil qui se corrige, pas une règle de discipline (« pense à fetch »). Sans réseau, la clôture
   continue, et le portier signale une ref `origin` qui peut être ancienne.
3. **On abandonne `gh pr list --state merged --head`.** La preuve par contenu suffit, et elle marche
   hors GitHub.

## Critères d'acceptation

- [x] À la clôture, une branche fusionnée en squash sur `origin/main`, mais pas encore sur le `main`
      local, est classée absorbée.
- [x] Une branche réellement non fusionnée reste classée « REAL ».
- [x] Le portier ne fait toujours aucun `fetch` : le test G7 reste vert.
- [x] Le skill `ezk-archive` rafraîchit les refs avant d'appeler le portier. Sans réseau, la clôture
      continue et le dit.
- [x] La suite shell couvre le cas « squash sur `origin/main`, `main` local en retard » à la
      clôture.
- [x] En mode `--cleanup`, la commande proposée réussit depuis le worktree courant. Sans upstream,
      `git branch -d` compare à HEAD : depuis un worktree en retard, il refuse (« not fully merged »,
      constaté le 2026-10-03 dans muti). Quand la preuve contre `origin/main` est faite, proposer
      `git branch -D` et citer la preuve. (Ajout de la rétro muti du 2026-10-03.)

## Comment vérifier

```bash
# la suite shell d'ezk-archive, dont le nouveau cas et le test G7
pnpm --dir products/mega-city test:scripts
bash products/mega-city/skills/ezk-archive/scripts/test-check-branches.sh
bash products/mega-city/skills/ezk-archive/scripts/test-check-gate.sh
```

Le nouveau cas, à rejouer dans un dépôt jetable : une branche fusionnée en squash sur un `origin`
local, un `main` local laissé en arrière, puis `check.sh --gate`. Avant la correction : « REAL ».
Après : absorbée.

Sur le terrain : 0 faux « REAL » sur les 5 prochaines clôtures d'un projet consommateur (muti).

## Notes / décisions

- Origine : rétro muti du 2026-10-02 (capture muti
  `docs/captures/2026-10-02-retro-frictions-outillage-cross-repo.md`). Décision PO ✅, P1, unanime
  dans les quatre lentilles.
- Version V0.5 proposée par le pilote (P1 → release en cours) ; à confirmer au planning.
- **Prête le 2026-10-03** (porte de « prête » passée : deux incidents datés, coût dit, 5 critères
  prouvables, dépendance muti constatée).
- **Groomée le 2026-10-03 : fiche resserrée.** La reconnaissance du squash est livrée par la PR #311
  (2026-10-01). Reste la base de comparaison à la clôture. Le `git fetch` proposé à l'origine passe
  dans le skill, pas dans le script, à cause du test G7. La piste `gh pr list --head` est abandonnée.
- Dépendance muti — accès constaté le 2026-10-03. Dépôt git dans `~/git/bacasable/muti`, sur `main`.
  Il sert à la vérification sur le terrain.
- 2026-10-03 : rétro muti `docs/captures/2026-10-03-retro-cloture-et-menage.md` (décision PO ✅) :
  3e occurrence ajoutée (clôture du 2026-10-02, points 3 et 4 compris) et critère `-d` / `-D` du
  ménage.
- **Construite le 2026-10-03** (run V0.5, sprint 3).
  - **Clôture** : chaque branche se prouve contre `origin/<base>` puis la base locale (`PROOF_BASES`,
    calculé une fois pour les deux modes). Absorbée dès qu'une base contient son contenu. Test G9 de
    `test-check-gate.sh` (fixture : squash sur `origin/main`, `main` local en retard d'un commit).
  - **Skill** : `git fetch --prune origin` juste avant le portier ; sans réseau, la clôture continue
    et le dit. Le portier ne fetch toujours pas (G7 vert).
  - **Ménage** : `git branch -d` compare à l'upstream, sinon au HEAD du worktree. Le ménage ne le
    propose que s'il réussira d'ici ; sinon `-D`, avec sa preuve (`proof=merged:origin/main` ou
    `proof=content:<base>`). Test K8 de `test-cleanup.sh` : `-d` échoue, la commande proposée réussit.
  - **Points 3 et 4 du portier** (fiche livrée dite « non livrée », ADR dit « non fusionné ») : hors
    de cette fiche, qui ne les porte pas en critère. À reprendre dans une fiche voisine.
