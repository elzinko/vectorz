---
id: "20260904080827072"
title: "Un seul tableau de bord pour tous tes projets — choisir le projet, voir sa config"
type: feature
priority: P1
product: mega-city
milestone: cockpit
version: V0.6
labels: [ezk-map, supervision]
status: ready
pr:
evidence: before-after
created: 2026-09-04
---

# 20260904080827072 — Un seul tableau de bord pour tous tes projets

**En clair.** Aujourd'hui, le tableau de bord ne lit qu'un projet à la fois : pour en changer, il
faut le relancer. Cette fiche en fait une seule page web pour tous tes projets. Tu choisis le
projet dans un menu, puis tu vois ses fiches et sa config. Un serveur, un port, un registre de
projets.

**Si tu arrives frais.** Le *tableau de bord* est la page web locale de la méthode
(`ezk dashboard`) : board des fiches, pilotage, runs, carte. Le *Moniteur* est une autre page web
locale : celle de la supervision des runs.

## Contexte / Problème

Le PO pilote plusieurs projets avec la méthode : vectorz, samplerz, muti… Le 2026-10-02, il
demande « une vision claire d'où en est chaque projet » : choisir un projet, voir sa config, voir
ses fiches.

Les morceaux existent, mais en deux moitiés qui ne se parlent pas.

- **Le tableau de bord sait lire un autre projet, mais un seul par lancement.**
  `ezk --root <projet> dashboard` fixe le projet au démarrage
  ([pouvoir pointer les vues sur un autre projet](done/20260826173221323_racine-parametrable-des-vues.md)).
  Il n'a pas de menu de projets.
- **Le Moniteur liste déjà les projets**, une ligne chacun. Il lit le registre
  `supervision.registry.yaml`
  ([onglet « Projets » dans le Moniteur](done/0062-onglet-projets-moniteur.md),
  [registre de supervision](done/0082-registre-supervision-cote-vectorz.md)).
  Mais il ne montre ni les fiches ni la config. Seul vectorz y est inscrit.
- **La config d'un projet ne se lit que dans le terminal** : `ezk config` (PR, CI, revue Codex),
  `ezk rules show`, `ezk dor show`. Et `ezk config` ne sait pas viser un autre projet. Elle n'est
  pas déclarée « commande projet » dans le manifeste, contrairement aux deux autres (constaté le
  2026-10-02).
- **Tous les projets ne rangent pas leurs fiches au même format** (constaté le 2026-10-03). vectorz
  et muti sont au format actuel. Quatre projets sont restés à un format ancien. Samplerz range les
  siennes en fichiers Gherkin `.feature`, que le tableau de bord ne sait pas lire.

**Valeur.** Aujourd'hui, savoir où en est un projet oblige à relancer le tableau de bord ou à lire le
terminal. Avec le cockpit, un coup d'œil suffit, tous projets confondus. C'est aussi la page où la
fiche des modèles affichera et modifiera les réglages d'agents de chaque projet.

## Proposition

**Déjà tranché par le PO le 2026-10-02 : global, pas une app par projet.** Une app par projet
multiplierait les ports et n'offrirait aucune vue d'ensemble. C'était la question d'origine de
cette fiche.

**Tranché au grooming le 2026-10-03 : le tableau de bord devient le cockpit.**

```
registre des projets (celui de la supervision, lu à chaque requête)
        │  vectorz · samplerz · muti…
        ▼
tableau de bord ── menu : choisir un projet (par son identifiant, jamais par un chemin)
        │
        ├─ pages : les mêmes pour tous (elles viennent de la méthode)
        └─ données : fiches, config, pouces → celles du projet choisi
Moniteur ── reste la page des runs (inchangé)
```

Pourquoi le tableau de bord :

- **Il est déjà construit pour ça.** `bin/ezk-map.ts` sert ses pages depuis la méthode. Il calcule
  ses données à chaque requête, pour un projet passé en argument (`dataView.build(racine)`). Le seul
  verrou : ce projet est choisi une fois, au lancement. Il suffit de le choisir à chaque requête.

Les deux options écartées :

| Option | Raison de l'écart |
|---|---|
| B — le Moniteur | Il vit dans un autre produit, cop1 (une application React et un service en arrière-plan). L'ADR-0039 le range dans le branchement « observabilité » : un plugin optionnel, hors de la méthode. Y mettre les fiches et la config ferait dépendre la méthode d'un plugin. |
| C — fusionner les deux | Deux techniques différentes à marier, pour un coût élevé et aucun gain pour ce besoin. |

**Un seul registre de projets** : celui de la supervision, `supervision.registry.yaml`. Le tableau
de bord le lit, sans jamais l'écrire. Il le relit à chaque requête : un projet inscrit apparaît sans
relancer le serveur.

Dans le tableau de bord :

1. **Un menu de projets**, lu dans le registre. Choisir un projet recharge les pages sur ses
   données, sans relancer le serveur. Le registre accepte d'autres méthodes que mega-city
   (`method: bmad`, par exemple). Le cockpit ne sait pas lire leurs fichiers : un tel projet reste
   dans la liste, avec l'état « méthode non prise en charge », sans fiches ni config inventées.
   Deux autres états, lus dans les fichiers du projet :
   - **« format de fiches non pris en charge »** : le projet n'a pas de fiches au format de la
     méthode (cas de samplerz). Sa page « config » marche ; aucune fiche n'est inventée.
   - **« format en retard »** : ses fiches sont dans une version ancienne du format. La page le dit,
     avec la version, au lieu d'afficher des statuts qui n'existent plus.
2. **Une page « config »** du projet choisi, faite de sections : les interrupteurs GitHub (PR, CI,
   revue Codex), ses règles propres, ses critères de « prête ». Ici, toutes ces sections sont en
   lecture seule.
3. **`ezk config` devient une commande projet** : `ezk --root <projet> config` lit la config de
   n'importe quel projet, comme `ezk rules show` le fait déjà.

**Deux règles de sûreté**, dans la ligne de l'ADR-0057 :

- **Un projet se choisit par son identifiant dans le registre.** Jamais par un chemin venu du
  navigateur. Un identifiant inconnu est refusé, sans rien lire.
- **Un pouce 👍/👎 s'écrit dans le projet choisi.** Un pouce posé sur une fiche de samplerz s'écrit
  dans samplerz, jamais dans vectorz.

**Hors périmètre.** Un lien depuis chaque ligne de projet du Moniteur vers le tableau de bord. Utile
plus tard, pas nécessaire au besoin.

## Critères d'acceptation

- [ ] Un ADR consigne la décision : global, le tableau de bord comme cockpit, le registre de la
      supervision comme registre unique. Il dit pourquoi le Moniteur et la fusion sont écartés.
- [ ] La page liste les projets du registre. Choisir un projet affiche **ses** fiches, sans
      relancer le serveur.
- [ ] Sans choix de projet, le tableau de bord se comporte comme aujourd'hui : `--root`, puis
      `EZK_ROOT`, puis la méthode elle-même.
- [ ] Un identifiant de projet inconnu est refusé. Le serveur ne lit rien en dehors des projets du
      registre.
- [ ] Un projet du registre introuvable sur le disque s'affiche comme tel. La page ne tombe pas.
- [ ] Un projet du registre dont la méthode n'est pas mega-city apparaît avec l'état « méthode non
      prise en charge ». Le cockpit n'affiche pour lui ni fiches ni config.
- [ ] Un projet sans fiches au format de la méthode apparaît avec l'état « format de fiches non pris
      en charge ». Sa page « config » s'affiche ; aucune fiche n'est inventée.
- [ ] Un projet dont les fiches sont dans une version ancienne du format affiche « format en
      retard » et cette version, au lieu de statuts faux.
- [ ] La page « config » montre, pour le projet choisi, les mêmes valeurs que `ezk config`,
      `ezk rules show` et `ezk dor show`. Elle n'écrit rien.
- [ ] Un pouce posé sur une fiche du projet choisi s'écrit dans ce projet, et seulement là.
- [ ] `ezk --root <projet> config` affiche la config d'un autre projet.
- [ ] Inscrire un projet avec `ezk supervision registry-add` suffit pour qu'il apparaisse, y
      compris quand la commande est lancée depuis un worktree.
- [ ] Le serveur n'écoute que sur la boucle locale (127.0.0.1).

## Comment vérifier

```bash
# 1. non-régression : la gate mega-city reste verte
cd products/mega-city && pnpm typecheck && pnpm test && pnpm test:scripts

# 2. inscrire deux projets dans le registre, depuis le dossier principal de vectorz
#    (pas depuis un worktree : voir la note « Piège du registre »)
ezk supervision registry-add muti <chemin-de-muti>           # fiches au format actuel
ezk supervision registry-add samplerz <chemin-de-samplerz>   # fiches en Gherkin

# 3. ouvrir le cockpit
ezk dashboard
# → le menu liste vectorz, muti et samplerz
# → choisir muti : ses fiches s'affichent ; ouvrir « config », puis comparer avec le terminal :
ezk --root <chemin-de-muti> config
ezk --root <chemin-de-muti> rules show
ezk --root <chemin-de-muti> dor show
# → choisir samplerz : état « format de fiches non pris en charge », et sa page « config » s'affiche

# 4. poser un pouce sur une fiche de muti : le fichier apparaît dans muti, pas dans vectorz
ls <chemin-de-muti>/features/reviews/verdicts/
git status --porcelain features/reviews/verdicts/   # depuis vectorz → rien
```

5. Demander un projet inconnu au serveur : il refuse, sans rien lire. La forme exacte de la
   requête dépend du mécanisme retenu au build (lien ou cookie).

## Glossaire

- `registre` — le fichier `supervision.registry.yaml` : la liste des projets suivis (id, chemin,
  méthode).
- `commande projet` — une commande `ezk` marquée `project: true` dans
  `products/mega-city/ezk-manifest.yml`. Elle sait viser un autre projet avec `--root`.
- `cockpit` — la page unique d'où l'on suit tous ses projets. Ici : le tableau de bord, avec son
  menu de projets.
- `branchement` — une pièce hors de la méthode, qu'on active ou non (ADR-0039). La supervision en
  est un : la méthode tourne sans elle.

## Notes / décisions

- **Prête le 2026-10-03** (porte de « prête » passée : problème, valeur, 13 critères prouvables,
  dépendances muti et samplerz constatées, preuve d'écran avant/après). Passe avant la fiche des
  modèles, sur décision du PO du même jour.
- **Groomée le 2026-10-03 : le tableau de bord devient le cockpit** (option A, choix du PO sur
  recommandation). Faits lus avant de trancher :
  - `bin/ezk-map.ts` calcule ses données par requête pour une racine passée en argument ; seule la
    racine est fixée au lancement (`projectRootOrExit`).
  - Le Moniteur vit dans `products/cop1/packages/web` (React) et lit le registre par son service
    (`/api/supervision/projects`). L'ADR-0039 range la supervision dans les branchements.
  - L'[ADR-0057](../products/mega-city/docs/adr/0057-le-tableau-de-bord-ecrit-un-seul-dossier.md)
    limite le tableau de bord à une seule écriture, les pouces, et désigne tout fichier par un
    identifiant validé. Cette fiche en garde les deux règles.
- **Dépendances.**
  - Dépendance muti — accès constaté le 2026-10-03. Dépôt git dans `~/git/bacasable/muti`, sur
    `main`, fiches au format actuel (version 5).
  - Dépendance samplerz — accès constaté le 2026-10-03. Dépôt git dans `~/git/samplerz`, sur
    `main`. Ses 136 fiches sont des fichiers Gherkin `.feature`, sans `features/README.md` de format.
  - Formats relevés le 2026-10-03 : version 5 pour vectorz et muti ; version 4 pour whatsapp-mcp ;
    version 2 pour city-guided, claude-proxy, google-mcp-multi-account et whatsapp-group-mcp.
- **Grooming parallèle écarté** (décision du PO du 2026-10-03). Une autre session avait groomé
  cette fiche le même jour, sur la branche `claude/ezk-backlog-grooming-cf040d`, sans la pousser.
  Même choix du tableau de bord ; elle sortait la page « config » dans une fiche à part. Le PO garde
  cette version-ci, déjà prête. De l'autre, on reprend le piège du registre ci-dessous.
- **Piège du registre** (constaté le 2026-10-03, `bin/supervision-registry-add.ts`). `registry-add`
  cherche `supervision.registry.yaml` en remontant depuis le projet, puis depuis le dossier où on le
  lance. Lancé depuis un worktree, il écrit dans la copie du registre propre à ce worktree. Le
  cockpit, lancé depuis le dossier principal, ne la voit pas. Au build : le cockpit et `registry-add`
  doivent viser le même registre, ou `registry-add` doit dire lequel il a écrit.
- **Fiches de samplerz : décision du PO du 2026-10-03.** Le cockpit les signale « format non pris
  en charge », sans rien de plus. Deux suites possibles, à cadrer après le cockpit, et qui
  s'excluent : migrer samplerz au format de la méthode, ou apprendre au cockpit à lire son Gherkin.
  Point dur pour la migration : chez samplerz, un `.feature` est à la fois la fiche et, parfois, un
  test qui tourne (6 fichiers de tests l'exécutent avec pytest-bdd).
- **Fiche sœur qui écrit dans la page « config ».**
  [Régler le modèle et l'effort de chaque agent, projet par projet](20261002205205417_modele-effort-agents-par-projet.md)
  y ajoute une section « Agents » modifiable. Ici, la page reste en lecture seule. L'écriture de la
  config demandera d'amender l'ADR-0057, qui n'autorise qu'une écriture : c'est à la fiche sœur de
  le faire.
- **Jalon `cockpit`, version V0.6** (décision PO du 2026-10-02 ; la V0.5 est « le sprint au lot »). Les fiches du cockpit se lient par
  ce jalon, pas par une fiche chapeau. Fiche sœur :
  [voir les fiches posées sur le schéma du process, avec leur session](20261002115451315_fiches-sur-le-process-avec-session.md).
  Idée liée, sans version :
  [une page d'accueil, une ligne par projet](20261002115451451_page-une-ligne-par-projet.md).
- **Historique.** Créée le 2026-09-04 comme question d'archi ouverte, « admin ezk : partagé
  multi-projets vs une app par projet — ports, isolation » (type chore, P3). Née du chantier
  [ezk multi-client](20260901173549334_ezk-multi-client-cursor-modeles-par-hote.md). Parkée par le
  PO le 2026-09-04. Réveillée le 2026-10-02 : la question est tranchée (global), la fiche devient
  une feature en P1.
- **Prior art** : la chaîne de supervision (daemon + web + registre) gère déjà du multi-projet.
  Voir le [contrat de supervisabilité](0029-contrat-supervisabilite-v02-differes.md).
