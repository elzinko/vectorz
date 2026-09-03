# ADR-0046 — CLI `ezk` : un point d'entrée mince sur manifeste, avant tout framework

- Statut : **Proposé** (2026-09-03). Nom `ezk` acté par le PO ; option B retenue d'abord ; option C différée (P2).
- Fiches : B `../../../../features/20260903134906920_cli-ezk-point-d-entree-unique.md` · C `../../../../features/20260903134908019_cli-ezk-complet-publie.md`
- Origine : question du PO après `pnpm lawgiver bind-global global --link` (« la commande n'est pas intuitive… un CLI ? »)

## En clair

Les commandes de la méthode se lancent de trois façons, avec quatre styles de noms, et
personne ne peut deviner ce qu'une commande déploie. On décide un seul point d'entrée de
terminal, `ezk`, mince : il route vers les scripts existants d'après un manifeste, sans
déplacer une ligne de logique. Un framework complet, publié, attendra qu'un besoin se montre.

## Contexte

`products/mega-city/bin/` compte 49 scripts ; 27 sont exposés en scripts pnpm sous quatre
styles (`lawgiver`, `ezk:map`, `graph:compile`, `plan-view:regen`) ; les scripts bash
s'appellent par chemin ; depuis la racine il faut `pnpm --dir products/mega-city`. Les
commandes de chat ont un index (`ezk-help`), pas celles du terminal. Le sprint 20260902224608715
en a payé le prix : trois blocs du board régénérés par trois commandes (une oubliée, CI rouge),
et un `bind-global` dont le périmètre réel (skills + agents, pas la loi) a surpris le PO.

## Options

| Option | Complexité | Coût | Découvrabilité | Hors vectorz | Risque |
|---|---|---|---|---|---|
| A. Statu quo (scripts pnpm + chemins) | nulle | nul | faible | mauvaise, chemins figés | dette qui grandit |
| B. `ezk` mince sur manifeste | faible | 1 sprint | bonne, un seul `help` | bonne, une commande à lier | deux entrées le temps de la transition |
| C. Framework complet (commander/oclif), publié | forte | plusieurs sprints | très bonne | très bonne | prématuré ; contredit « ne pas publier » (fiche 0087) |

## Décision

**B, maintenant.** Un routeur `bin/ezk.ts` qui lit un manifeste (domaine, verbe, script cible,
description) et lance le script existant avec ses arguments. Exposé par le champ `bin` du
paquet (`pnpm ezk …`, `pnpm link --global`). Premiers domaines : `law`, `board`, `backlog`,
`graph`, `evidence`, `pr`, `ci`, `map`, `sessions`, `help`. `ezk help` fusionne l'index du
manifeste et celui des SKILL.md. Les scripts pnpm restent en alias pendant la transition.

**Le nom `ezk`, pas `vcz`.** Il désigne la méthode, pas le dépôt ; il fait écho aux commandes
de chat `/ezk-…` (la même chose dans deux bouches) ; il reste vrai chez samplerz et muti.

**C, plus tard.** Reprendre le manifeste de B comme source ; publier avec la distribution en
plugin (fiche 0087), jamais avant ; tirer la fiche seulement sur un besoin constaté.

## Conséquences

- Une commande apprise vaut pour toutes ; un seul `help` ; le vocabulaire du terminal et du
  chat coïncident.
- Le manifeste devient testable : tout script exposé sans entrée est un oubli détecté.
- Le moteur reste « plan pur + coquille I/O » (ADR-0003) : le CLI est un bord, pas un étage.
- La racine paramétrable (fiche 20260826173221323) devient `--root` : débloque l'installation
  par projet.
- Deux façons d'appeler coexistent un temps ; la question « la loi n'est compilée nulle part en
  global » reste à trancher séparément (fiche 20260903134909124) ; `ezk law status` la rendra visible.

## Réversibilité

Le routeur et son manifeste se retirent sans toucher aux scripts ; les alias pnpm reprennent
leur rôle. Rien n'est publié tant que C n'est pas décidée.
