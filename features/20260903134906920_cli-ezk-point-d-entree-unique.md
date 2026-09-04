---
id: "20260903134906920"
title: CLI `ezk` — un point d'entrée unique et mince pour les commandes de la méthode (manifeste + routage, zéro logique)
type: feature
priority: P1 # provisoire — direction actée par le PO le 2026-09-03 (nom `ezk`, option B de l'ADR-0046) ; rang à confirmer
product: mega-city
version:
epic:
status: idea
ready:
pr:
evidence: none # outil de terminal, aucun écran
created: 2026-09-03
---

# 20260903134906920 — CLI `ezk` : un point d'entrée unique

**En clair.** Les commandes de la méthode se lancent aujourd'hui de trois façons, avec quatre
styles de noms. Personne ne peut deviner `pnpm lawgiver bind-global global --link`, ni savoir
qu'il faut trois commandes pour régénérer un board. Cette fiche donne à la méthode une seule
commande de terminal, `ezk`, qui route vers les scripts existants sans en déplacer la logique.

**Si tu arrives frais.** `products/mega-city/bin/` = les scripts déterministes de la méthode
(compilation du graphe, régénération des vues, moteur de la LOI). Un « script pnpm » = un alias
déclaré dans `package.json`. Les « commandes de chat » = les skills `/ezk-…` que Claude Code
charge depuis `~/.claude`.

## Contexte / Problème

Mesure du 2026-09-03 : `bin/` compte 49 scripts. 27 sont exposés en scripts pnpm, avec quatre
styles de noms (`lawgiver`, `ezk:map`, `graph:compile`, `plan-view:regen`). Les scripts bash
s'appellent par chemin complet (`bash products/mega-city/bin/check-links.sh`). Depuis la
racine, tout demande le préfixe `pnpm --dir products/mega-city`, sauf `ezk:map`, ré-exposé à
la main. Les commandes de chat ont un index généré (`ezk-help`) ; les commandes de terminal
n'en ont aucun.

Symptômes vécus le jour même, pendant le sprint [[20260902224608715]] :

- le board porte trois blocs générés, régénérés par trois commandes différentes ; en oublier
  une a mis la CI en rouge ;
- `pnpm lawgiver bind-global global --link` : le PO ne pouvait pas deviner ce qu'elle déploie
  (skills et agents seulement, pas la loi) ; question posée en séance ;
- le nouveau script du sprint s'appelle par chemin, `bash products/mega-city/bin/pr-evidence.sh …`,
  comme les autres.

Analogie : une cuisine où chaque appareil a sa propre prise. Tout marche, mais chaque geste
demande de retrouver le bon adaptateur.

**Valeur.** Une commande apprise vaut pour toutes. Le PO lance et découvre les gestes de la
méthode sans lire `package.json`. Le même vocabulaire dans le terminal (`ezk law …`) et dans
le chat (`/ezk-…`).

## Proposition

Option B de l'ADR-0046 : un CLI mince sur manifeste.

- `products/mega-city/bin/ezk.ts` : un routeur `ezk <domaine> <verbe> [args]` qui lit un
  manifeste (domaine, verbe, script cible, une ligne de description) et lance le script
  existant avec les arguments tels quels. Zéro logique métier dans le routeur : le moteur
  reste « plan pur + coquille I/O » (ADR-0003), le CLI n'est qu'un bord de plus.
- Exposé par le champ `bin` du paquet mega-city (`ezk`) : `pnpm ezk …` à la racine, et
  `pnpm link --global` sur un poste.
- Premiers domaines : `law` (bind, bind-global, status = déployé vs catalogue), `board`
  (regen = les trois blocs d'un coup), `backlog` (check, regen, plan-head), `graph` (compile,
  check, query), `evidence` (capture, render, decide), `pr` (check-body), `ci` (conso), `map`,
  `sessions`, `help`.
- `ezk help` fusionne les deux index : commandes de terminal (manifeste) et commandes de chat
  (`ezk-help`, lu des SKILL.md).
- Les scripts pnpm actuels restent en alias pendant une transition et appellent le routeur.
  Précédent : refonte du CLI d'ezk-product-build (PR #193), chaque ancien flag gardé en alias.
- La racine paramétrable ([[20260826173221323]]) devient l'option `--root` du routeur, ou la
  détection du dépôt courant : c'est ce qui débloque l'installation par projet.

```
terminal ─ ezk law bind-global --link ─┐
                                        ├─ bin/ezk.ts (routeur, lit le manifeste) ─► bin/lawgiver.ts, bin/regen-*.ts …
chat ─ /ezk-sprint, /ezk-backlog ───────┘   ezk help liste les deux familles
```

## Critères d'acceptation

- [ ] `pnpm ezk help` liste toutes les commandes de terminal (manifeste) et toutes les
      commandes de chat (SKILL.md), une ligne par entrée, ouverture « En clair ».
- [ ] Un test échoue quand un script de `bin/` exposé en script pnpm n'a pas d'entrée dans le
      manifeste et n'est pas listé comme interne.
- [ ] `ezk board regen` régénère les trois blocs du board ; le filet `check-planning-views`
      reste vert ; `plan-view-board.test.ts` ne peut plus rougir par oubli d'un bloc.
- [ ] `ezk law status <profil>` dit ce qui est déployé sur le poste (lien, copie, absent) par
      rapport au catalogue.
- [ ] Les anciens scripts pnpm continuent de marcher (alias) ; `bin/README.md`, `ezk-help` et
      les SKILL qui citent des commandes sont mis à jour.
- [ ] Depuis un autre dépôt lié (`pnpm link --global`), `ezk` marche avec `--root`, ou dit
      clairement qu'il lui manque la racine.
- [ ] Gate locale verte : `pnpm build`, `pnpm test`, `pnpm --filter mega-city test:scripts`,
      `bash products/mega-city/bin/test-links-repo.sh`.

## Comment vérifier

```bash
pnpm install --frozen-lockfile
pnpm ezk help                                        # les deux index, une ligne par commande
pnpm ezk board regen && pnpm --dir products/mega-city exec tsx bin/check-planning-views.ts
pnpm ezk law status global                           # déployé vs catalogue
pnpm --dir products/mega-city ezk:map                # l'ancien alias marche toujours
pnpm --filter mega-city test                         # dont le test de couverture du manifeste
```

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
- Fiches voisines, distinctes : [[20260903134908019]] (CLI complet publié, option C, P2, plus tard) ;
  [[20260826173221323]] (racine paramétrable : devient `--root`) ; [[20260816151112162]]
  (lawgiver déploie aussi les slash-commands : un verbe `ezk law …` de plus) ; [[0120]]
  (couverture CLI de `lawgiver capture`) ; [[0087]] (distribution en plugin : hors périmètre,
  « ne pas publier ») ; [[20260903134909124]] (la loi n'est compilée nulle part chez l'agent : `ezk law status`
  l'affichera, il ne le règle pas).
- À trancher à l'étape Archi : format du manifeste (YAML ou table TypeScript) et détection de
  la racine.
- Priorité P1 provisoire : direction actée par le PO ; rang dans PLAN.md à confirmer.
