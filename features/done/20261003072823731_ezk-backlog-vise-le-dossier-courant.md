---
id: "20261003072823731"
title: "Sans --root, ezk backlog vise le dépôt du dossier où on tape la commande"
type: feature
priority: P2
product: mega-city
milestone:
version: v0.5.0
labels: [cross-repo]
status: shipped
pr: "#344"
evidence: none # commande en ligne de commande, aucun écran
created: 2026-10-03
---

# 20261003072823731 — Sans --root, ezk backlog vise le dépôt du dossier où on tape la commande

**En clair.** Pour ranger à la main une fiche de muti, il faudra taper `ezk --root . backlog ship …`.
On veut taper seulement `ezk backlog ship …`. Sans `--root`, la commande vise le dépôt git du dossier
où on la tape. Elle affiche toujours ce dépôt, pour qu'on voie où elle écrit.

**Si tu arrives frais.** `ezk` est le raccourci de la méthode, installé sur le poste. L'option
`--root` lui dit quel projet viser. Aujourd'hui, sans `--root`, il vise toujours vectorz.

## Contexte / Problème

- Le 2026-10-03, après la livraison de `ship:fiche --root` (elzinko/vectorz#336), le PO a jugé la
  commande de ship trop complexe depuis muti.
- La fiche
  [Les skills ezk retrouvent le catalogue mega-city depuis un projet hôte](20261002155911257_skills-trouvent-mega-city-depuis-projet-hote.md)
  fait de `backlog ship` et `backlog regen` des commandes qui acceptent `--root`. Les skills
  passeront `--root` eux-mêmes : en passant par Claude, on ne tape rien. Elle garde exprès le défaut
  actuel (« Hors périmètre »).
- Il reste le geste tapé à la main : il demandera `--root .`. Le PO veut s'en passer.
- La règle actuelle vient de la fiche
  [Racine paramétrable des vues](20260826173221323_racine-parametrable-des-vues.md). Elle a
  exclu la détection du dossier courant pour garder « sans argument ni variable, rien ne change ».
  C'était une précaution contre un changement de comportement, pas une règle de sécurité.

**Valeur.** Une commande courte, la même dans vectorz, dans muti et dans un worktree. On n'a plus à
dire à l'outil où l'on est.

## Proposition

- Sans `--root`, `ezk backlog ship` et `ezk backlog regen` visent le dépôt git du dossier où on tape
  la commande (`git rev-parse --show-toplevel`). Dans un worktree, c'est ce worktree.
- La commande affiche toujours le dépôt visé.
- Hors d'un dépôt git, ou dans un dépôt sans `features/`, elle refuse sans rien écrire et dit quoi
  faire.
- `--root` reste prioritaire. Les skills et les scripts continuent de le passer : eux ne devinent
  rien.
- Une variable `EZK_ROOT` restée dans le shell ne redirige jamais une écriture.
- Les autres commandes gardent leur défaut actuel.

Exemple, depuis le dossier de muti :

```bash
# avec la fiche mère seule
ezk --root . backlog ship --pr '#275' features/<fiche>.md
# avec cette fiche
ezk backlog ship --pr '#275' features/<fiche>.md
```

## Critères d'acceptation

- [x] Depuis le dossier de muti, `ezk backlog ship --pr '#<n>' features/<fiche>.md` livre la fiche de
  muti : statut, `done/`, liens et index. Rien ne bouge dans vectorz.
- [x] Depuis le dossier de muti, `ezk backlog regen` régénère l'index de muti, avec son titre.
  L'index de vectorz ne bouge pas.
- [x] Depuis un sous-dossier du dépôt, ou depuis un worktree, la commande vise ce dépôt ou ce
  worktree.
- [x] La commande affiche toujours le dépôt visé.
- [x] Hors d'un dépôt git, ou dans un dépôt sans `features/`, elle refuse sans rien écrire, avec un
  message qui dit quoi faire.
- [x] Une variable `EZK_ROOT` restée dans le shell ne redirige jamais une écriture.
- [x] Avec `--root`, le comportement est celui de la fiche mère.
- [x] Les tests automatiques lancent la vraie commande **sans** `--root`, depuis un dépôt jetable, un
  de ses sous-dossiers et un de ses worktrees.

## Mesure de suivi

- [ ] Sur le poste, après le merge et la mise à jour du dossier principal de vectorz, le premier ship
  de muti tapé à la main se fait avec la commande courte.

## Comment vérifier

**1. Les tests automatiques**, depuis vectorz. Ils lancent la vraie commande sur un dépôt jetable,
sans `--root` : depuis sa racine, un sous-dossier et un worktree, plus les refus.

```bash
pnpm --dir products/mega-city test
pnpm --dir products/mega-city test:scripts
```

**2. Sur une copie jetable de muti**, jamais sur le vrai dépôt. Remplacer `<fiche>` par une fiche
`ready` de muti.

```bash
git clone -q --local /Users/elzinko/git/bacasable/muti /tmp/muti-essai
cd /tmp/muti-essai
git -C /Users/elzinko/git/bacasable/vectorz status --short > /tmp/vectorz-avant.txt
ezk backlog ship --dry-run --pr '#999' features/<fiche>.md   # affiche le dépôt visé /tmp/muti-essai, n'écrit rien
ezk backlog ship --pr '#999' features/<fiche>.md             # la fiche part dans features/done/, status: shipped
ezk backlog regen && head -1 features/BACKLOG.md             # « # Backlog features & bugs — MUTI »
cd apps && ezk backlog regen                                 # depuis un sous-dossier : vise toujours /tmp/muti-essai
git -C /Users/elzinko/git/bacasable/vectorz status --short | diff /tmp/vectorz-avant.txt -   # aucune différence : vectorz n'a pas bougé
cd /tmp && ezk backlog ship --pr '#1' features/x.md; echo $?  # hors dépôt git : refus, code 2, message clair
```

**3. Sur le terrain**, après le merge et `git pull` dans le dossier principal de vectorz : le prochain
ship muti tapé à la main se fait avec la commande courte.

## Dépendances externes

- **dépendance muti — accès constaté le 2026-10-03.** Dépôt local
  `/Users/elzinko/git/bacasable/muti`, remote `elzinko/muti`, backlog au layout 5, titre de l'index
  déclaré par `backlog_title:` (elzinko/muti#275).
- **dépendance lien global `ezk` — accès constaté le 2026-10-03.** `~/.local/bin/ezk` pointe vers
  `vectorz/products/mega-city/bin/ezk.mjs`. Il s'exécute depuis muti ; ce jour-là, il y refusait
  `ezk backlog ship`. Installation documentée : `pnpm link --global` depuis `products/mega-city`
  (`products/mega-city/bin/README.md`).
- **dépendance dossier principal de vectorz à jour — constaté le 2026-10-03.** Le lien `ezk` exécute
  le code du dossier principal de vectorz, pas celui d'un worktree. Après le merge, il faut y faire
  `git pull` pour que muti voie le nouveau code.

## Notes / décisions

- **Décision PO du 2026-10-03** : « la commande, sans passer `--root` ; il prend le répertoire local
  par défaut, ou le worktree ». Elle complète la fiche mère sans la rouvrir : celle-ci est prête et
  garde le défaut actuel.
- **Dépend de la fiche mère** : elle fait de `backlog ship` et `backlog regen` des commandes qui
  acceptent `--root`. À construire après elle, ou dans le même sprint.
- **Point de conception pour le build** : aujourd'hui, le routeur `ezk` lance ces commandes depuis le
  dossier de vectorz. Il doit transmettre le dossier où la commande a été tapée, sans passer par
  `EZK_ROOT`.
- Reprend le grooming de la branche `docs/groom-20261002155911257` du 2026-10-03. Cette branche est
  abandonnée : la fiche mère garde la version de `main`.
- **Prête le 2026-10-03** (porte « prête » passée : décision PO datée, valeur dite, 9 critères
  prouvables, 3 dépendances constatées). Rangée en V0.5, juste après la fiche mère, pour partir avec
  elle.
- **Construite le 2026-10-03** (run V0.5, sprint 2). Une troisième règle de racine dans le manifeste
  d'`ezk` : `root: cwd`. Sans `--root`, la commande vise le dépôt git du dossier courant (le plus
  proche ancêtre qui porte `.git`, donc aussi un worktree). Seules `backlog ship` et `backlog regen`
  la portent. Le routeur dit toujours « dépôt visé » ; `ship:fiche` ne répète plus son propre
  bandeau. Un refus sort en code 2, comme toute erreur du routeur.
- Le critère « premier ship muti tapé à la main » ne se prouve qu'après le merge : il passe en
  « Mesure de suivi » (règle `development/acceptance-criteria-before-merge`).
- Preuve du 2026-10-03 sur une copie jetable de muti, sans `--root` : ship à blanc puis réel (fiche
  passée `shipped` dans `done/` de muti), `regen` (titre « MUTI »), depuis un sous-dossier, refus hors
  dépôt git (code 2). Le dossier principal de vectorz n'a pas bougé.
