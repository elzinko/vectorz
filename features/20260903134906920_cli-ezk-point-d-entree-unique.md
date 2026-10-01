---
id: "20260903134906920"
title: "Une seule commande `ezk` pour tout lancer"
type: feature
priority: P1
product: mega-city
version: V0.3
epic:
labels: [installation]
status: idea
pr:
evidence: none # outil de terminal, aucun écran
created: 2026-09-03
---

# 20260903134906920 — CLI `ezk` : un point d'entrée unique

**En clair.** Les commandes de la méthode se lancent aujourd'hui de trois façons, avec quatre
styles de noms. Personne ne peut deviner `pnpm lawgiver bind-global global --link`, ni savoir
qu'il faut trois commandes pour régénérer un board. Cette fiche donne à la méthode une seule
commande de terminal, `ezk`. Elle lit un manifeste et lance le script existant, sans en
déplacer la logique. Ce lot livre le routeur, `ezk help`, `ezk board regen`, `ezk law status`
et le nouveau nom du tableau de bord : `ezk dashboard` (ancien `ezk:map`).

**Si tu arrives frais.** `products/mega-city/bin/` = les scripts déterministes de la méthode
(compilation du graphe, régénération des vues, moteur de la LOI). Un « script pnpm » = un alias
déclaré dans `package.json`. Les « commandes de chat » = les skills `/ezk-…` que Claude Code
charge depuis `~/.claude`.

## Contexte / Problème

Mesure du 2026-09-03 : `bin/` compte 49 scripts. 27 sont exposés en scripts pnpm, avec quatre
styles de noms (`lawgiver`, `ezk:map`, `graph:compile`, `plan-view:regen`). Les scripts bash
s'appellent par chemin complet. Depuis la racine, tout demande le préfixe
`pnpm --dir products/mega-city`. Les commandes de chat ont un index généré (`ezk-help`) ; les
commandes de terminal n'en ont aucun.

Symptômes vécus pendant le sprint [[20260902224608715]] : le board porte trois blocs générés,
régénérés par trois commandes (en oublier une a mis la CI en rouge) ; `bind-global` déploie
skills et agents mais pas la loi, et le PO ne pouvait pas le deviner.

Analogie : une cuisine où chaque appareil a sa propre prise. Tout marche, mais chaque geste
demande de retrouver le bon adaptateur.

## Proposition

Option B de l'ADR-0046 : un CLI mince sur manifeste. Zéro logique métier dans le routeur : le
moteur reste « plan pur + coquille I/O » (ADR-0003), le CLI n'est qu'un bord de plus.

```
terminal ─ ezk law bind-global … ─┐
                                   ├─ bin/ezk.ts (routeur) lit ezk-manifest.yml ─► bin/lawgiver.ts, bin/regen-*.ts …
chat ─ /ezk-sprint, /ezk-backlog ──┘   ezk help liste les deux familles
```

Décisions prises au grooming (étape Archi) :

- **Manifeste en YAML**, `products/mega-city/ezk-manifest.yml` : le PO le lit sans lire du code, et
  l'option C pourra le reprendre. Chaque entrée : domaine, verbe, script cible (ou liste d'étapes),
  une ligne de description, et une règle de racine.
- **Racine.** Options du routeur placées avant la commande : `--root <dépôt>` et `--dry-run`.
  Une commande « fixe » (qui lit ou écrit les fichiers du dépôt de la méthode) refuse de tourner
  depuis un autre dépôt, avec un message qui dit quoi faire. Les scripts ne savent pas encore
  viser un autre projet : c'est la fiche [[20260826173221323]], qui retournera ces entrées en
  « racine passée au script ».
- **Nom du tableau de bord : `ezk dashboard`.** Écartés : `monitor` (se confond avec
  `ezk supervision` et le Moniteur d'events), `board` (déjà le domaine des régénérations du
  kanban), `city` et `hq` (images que seul l'initié comprend). `ezk map` et `pnpm ezk:map`
  continuent de marcher, avec un avertissement.
- **Lanceur `bin/ezk.mjs`** derrière le champ `bin` : il trouve `tsx` dans les dépendances de
  mega-city, donc `ezk` ne demande pas de `tsx` installé sur le poste.

## Critères d'acceptation

- [x] `pnpm ezk help` ouvre sur « En clair », liste chaque commande du manifeste (une ligne) et
      chaque skill de chat (une ligne, lue dans les `skills/*/SKILL.md` par la fonction qui
      alimente déjà `ezk-help`). `pnpm ezk help <domaine|skill>` donne le détail. `pnpm ezk` est
      un script créé par ce lot (à la racine et dans mega-city), comme le champ `bin`.
      _Preuve_ : `ezk-cli.test.ts` (aide, une ligne par commande) et `ezk-launcher.test.ts`.
- [x] Un test échoue quand un script de `bin/` exposé en script pnpm n'a ni entrée dans le
      manifeste ni mention dans `internal` (avec raison). Il échoue aussi si une cible du
      manifeste n'existe pas, ou si deux entrées ont le même domaine et verbe.
      _Preuve_ : `ezk-manifest.test.ts` (le vrai manifeste) et `uncoveredScripts` dans
      `ezk-cli.test.ts` (le cas du script oublié).
- [x] `ezk board regen` lance les trois blocs du board (avancement, plan-delta, plan-view) dans
      cet ordre et s'arrête au premier échec. Un test échoue si un script `regen-*` qui écrit
      `board.html` manque à cette liste. `ezk board check` lance `check-planning-views`.
      _Preuve_ : run réel, les trois étapes répondent « déjà à jour » et `git status` ne bouge
      pas ; `ezk board check` rend « Vues de planning à jour » ; tests `runInOrder` et
      `ezk-manifest.test.ts` (aucun écrivain de `board.html` oublié).
- [x] `ezk law status <profil> [--target <dossier>]` dit, pour chaque skill et agent du profil,
      s'il est en lien, en copie, absent ou en lien mort. Lecture seule, prouvé sur dossier jetable.
      _Preuve_ : `deploy-state.test.ts` (dossier jetable, dossier laissé vide). Sur le poste, en
      lecture seule : 26 éléments en lien, 1 absent (`ezk-scout`, déclaré dans `global`, jamais lié).
- [x] Le tableau de bord s'appelle `ezk dashboard`. `ezk map` et `pnpm ezk:map` marchent encore
      et préviennent. README racine, `docs/GETTING_STARTED.md`, `commands/ezk-help.md` et
      `bin/README.md` disent le nouveau nom.
      _Preuve_ : `pnpm ezk dashboard --list` ; `pnpm ezk:map --list` affiche l'avertissement puis
      la liste ; `ezk-launcher.test.ts` (même script visé, avertissement seulement sur l'ancien).
- [x] Hors du dépôt de la méthode, une commande fixe est refusée avec un message clair ; avec
      `--root <dépôt>` elle passe ; `help` et `law` marchent partout. Le lanceur `bin/ezk.mjs`
      est testé depuis un dossier jetable, sans `tsx` dans le PATH.
      _Preuve_ : `ezk-launcher.test.ts` (PATH réduit à `/usr/bin:/bin`, dossier jetable).
- [x] Gate locale verte : typecheck, `pnpm --dir products/mega-city test`, `test:scripts`,
      `pnpm lint`, `check-links.sh`.
      _Preuve_ : typecheck propre ; 997 tests verts ; `test:scripts` 28 suites vertes ; lint
      propre ; 0 lien cassé (2 racines).

## Comment vérifier

```bash
pnpm install --frozen-lockfile
pnpm ezk help                                   # les deux index, une ligne par commande
pnpm ezk --dry-run board regen                  # montre les trois étapes sans rien écrire
pnpm ezk law status global --target "$(mktemp -d)"   # dossier vide : tout « absent »
pnpm ezk dashboard --list                       # le tableau de bord ; `pnpm ezk:map` aussi, avec avertissement
pnpm --dir products/mega-city test              # dont la couverture du manifeste
```

## Suite (hors de ce lot)

- Faire appeler le routeur par les anciens scripts pnpm (`lawgiver`, `graph:compile`,
  `plan-view:regen`…) : aujourd'hui ils restent tels quels et marchent. Migrer les citations de
  commandes dans les `SKILL.md` vers `ezk …`.
- Finir le renommage : fichier `bin/ezk-map.ts`, variable `EZK_MAP_PORT`, texte de marque de la
  page d'accueil, références historiques, puis retrait de l'alias `ezk map`.
- Racine réellement passée aux scripts : fiche [[20260826173221323]].
- `pnpm link --global` sur le poste : à faire par le PO (le test couvre le lanceur sans toucher
  au poste).
- Un `ezk views regen` qui enchaîne backlog, portfolio, board et pilotage : fiche
  [[20260830194601233]].
- Option C (CLI complet publié) : fiche [[20260903134908019]], plus tard.

## Glossaire

- `manifeste` — un fichier de données qui liste les commandes : domaine, verbe, script cible,
  description. Le routeur ne connaît rien d'autre.
- `routeur mince` — un programme qui choisit le script à lancer et lui passe les arguments,
  sans rien calculer lui-même.
- `alias` — un ancien nom de commande gardé, qui renvoie vers le nouveau.

## Notes / décisions

- Origine : question du PO le 2026-09-03 (« la commande n'est pas intuitive… ne devrais-je pas
  avoir un CLI ? »), instruite par `/architecture` → ADR-0046 (nom `ezk` acté, option B
  d'abord, option C différée).
- Nom : `ezk` plutôt que `vcz`. Il désigne la méthode, pas le dépôt ; il fait écho aux
  commandes de chat `/ezk-…` ; il reste vrai chez samplerz et muti.
- Fiches voisines, distinctes : [[20260903134908019]] (CLI complet publié, option C, P2) ;
  [[20260826173221323]] (racine paramétrable) ; [[20260816151112162]] (lawgiver déploie aussi
  les slash-commands) ; [[0120]] (couverture CLI de `lawgiver capture`) ; [[0087]] (distribution
  en plugin : hors périmètre, « ne pas publier ») ; [[20260903134909124]] (la loi n'est compilée
  nulle part chez l'agent : `ezk law status` la rend visible, cette fiche-là la règle).
- Absorbe [`20260826173005368`](done/20260826173005368_renommer-ezk-map.md) (renommer `ezk:map`,
  tri du 2026-09-30) : le nom est tranché ci-dessus ; l'affichage de l'état d'installation dans
  le site reste séparable et dépend du registre de bind.
- Priorité P1 provisoire : direction actée par le PO ; rang dans PLAN.md à confirmer.
