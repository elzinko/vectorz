# La commande `ezk` depuis un projet hôte

**En clair.** Les skills ezk appellent leurs outils par la commande `ezk`, installée sur le poste.
Elle sait où vit le catalogue mega-city. Un skill marche donc depuis vectorz comme depuis un projet
qui utilise la méthode, comme muti. Le projet visé est toujours nommé avec `--root`.

**Si tu arrives frais.** *mega-city* est le catalogue d'outils de la méthode. Il vit dans
`vectorz/products/mega-city`. Un *projet hôte* utilise la méthode depuis son propre dépôt git.

## Les trois cas

```
ezk lancé depuis…                 ce qui se passe
vectorz (dossier principal)       les scripts et les fichiers de vectorz
un worktree de vectorz            ezk passe la main au ezk de ce worktree : ses scripts, ses fichiers
un projet hôte (muti…)            les commandes « projet » visent le dépôt donné par --root
```

## Une commande « projet » reçoit toujours `--root`

Une commande qui lit ou écrit les fiches d'un projet reçoit la racine git du dossier où tourne le
skill :

```bash
ezk --root "$(git rev-parse --show-toplevel)" backlog ship --pr '#12' features/<id>_<slug>.md
ezk --root "$(git rev-parse --show-toplevel)" backlog regen
ezk --root "$(git rev-parse --show-toplevel)" config show
```

Les options du routeur se placent **avant** la commande. `ezk help` liste les commandes ; celles qui
acceptent un autre projet le disent dans leur résumé (`--root <projet>`).

- **Elle n'écrit que dans le projet visé.** Un ship depuis muti ne touche que `features/` de muti.
- **Une variable `EZK_ROOT` restée dans le shell ne redirige jamais une écriture.** Seule l'option
  `--root` désigne le projet d'une commande qui écrit (`backlog ship`, `regen`, `version`, `config`).
- **Sans `--root`, cinq commandes visent le dépôt git du dossier où tu tapes la commande** :
  `backlog ship`, `backlog regen`, `config`, `pr emit-local` et `review emit`. Ce dépôt peut être
  vectorz, un de ses worktrees, ou muti. Elles disent toujours quel dépôt elles visent, et refusent
  sans rien écrire hors d'un dépôt git ou dans un dépôt sans `features/`. À la main, depuis muti :
  `ezk backlog ship --pr '#275' features/<fiche>.md`. C'est ce qui permet un sprint en mode local
  (`github: false`) dans un projet hôte, avec les commandes que prescrit `ezk-sprint`.
- **Les autres commandes de projet, sans `--root`**, visent vectorz quand tu es dans vectorz. Depuis
  un projet hôte, elles refusent et te demandent `--root <dossier du projet>` : elles ne te
  conseillent jamais de viser vectorz à la place.

Les commandes de la méthode elle-même (`run context`, `views regen`…) travaillent dans vectorz.
Depuis un projet hôte, `ezk` refuse avec la marche à suivre, au lieu d'un `ENOENT` brut.

## `ezk` introuvable

`command not found: ezk` veut dire que la commande n'est pas installée sur ce poste. La méthode n'est
pas absente pour autant. Installe la commande une fois, depuis le dépôt vectorz :

```bash
cd <chemin-de-vectorz>/products/mega-city && pnpm link --global
```

Dans un worktree neuf de vectorz, installe aussi ses dépendances (`pnpm install`). Sans elles, `ezk`
le dit et continue avec les scripts du dossier principal.

Origine : fiche
[Les skills ezk retrouvent le catalogue mega-city depuis un projet hôte](../../../features/done/20261002155911257_skills-trouvent-mega-city-depuis-projet-hote.md).
