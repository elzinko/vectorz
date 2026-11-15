---
id: "20261114131616085"
title: "`ezk release passes list|add|remove` : les contrôles de la gate se règlent par commande"
type: feature
priority: P2
product: mega-city
milestone: board
version:
labels: [release, contrat]
status: shipped
blocked:
pr: "local-squash 7f62ec4a"
evidence: none # des commandes de la méthode ; l'écran Configuration suit via la fiche 8
created: 2026-11-14
---

# 20261114131616085 — `ezk release passes list|add|remove` : les contrôles de la gate se règlent par commande

**En clair.** Pour ajouter un contrôle avant une version, il faut aujourd'hui écrire un fichier à la
main, et ce fichier efface les contrôles par défaut au lieu de s'y ajouter. On propose trois commandes
pour lister, ajouter et retirer un contrôle, et une règle écrite une fois : le projet complète les
contrôles par défaut, sauf s'il demande à les remplacer. C'est le geste derrière le bouton « Ajouter
un contrôle » de la maquette.

**Si tu arrives frais.** La *gate de release* (`ezk release <v>`) enchaîne des *passes*, des
contrôles GO / NO-GO, avant l'étiquette d'une version. Le *socle* est la liste des passes par défaut
de la méthode. Un projet déclare les siennes dans `.vectorz/release-passes.yml`. Un *paquet de
règles* est une liste de règles de la loi, comme la DoD.

## Contexte / Problème

Ce que l'écran attend. La page Configuration de la maquette liste les contrôles de la gate avec leur
origine, et offre un bouton « Ajouter un contrôle » avec trois types : une commande, une revue par
un agent, un paquet de règles.

Ce que le code fait aujourd'hui.

- Les passes se déclarent à la main dans `.vectorz/release-passes.yml`.
  `products/mega-city/src/loaders/release-passes.ts:18` (les noms du fichier) et `:36-58` (le loader).
- Une passe est `{ id, title, command }` : une commande shell, rien d'autre.
  `products/mega-city/src/core/release-gate.ts:14-19`. Les types « revue par un agent » et « paquet
  de règles » n'existent pas.
- Le fichier projet REMPLACE le socle (`release-passes.ts:58` ; le commentaire de
  `release-gate.ts:43-46` le dit). Ajouter une passe oblige à recopier les deux du socle. Un oubli
  les fait disparaître en silence.
- `ezk release` n'a qu'un verbe : il prend une version (`products/mega-city/bin/ezk-release.ts:27-32`,
  manifeste `products/mega-city/ezk-manifest.yml:287-292`). Aucun `passes`.
- Une troisième passe prête à l'emploi existe en donnée : `ezk design check <v>`
  (`ezk-manifest.yml:293-299`), proposée en commentaire dans la compétence `ezk-release`
  (`products/mega-city/skills/ezk-release/SKILL.md:52-55`).
- Sur vectorz, aucun `.vectorz/release-passes.yml` : les deux passes du socle s'appliquent.
- Un patron d'écriture YAML qui préserve les clés voisines existe : `writeGithubConfig`
  (`products/mega-city/src/loaders/project-config.ts:184-203`).
- Le type « paquet de règles » a déjà son objet : la DoD est une liste de règles,
  `products/mega-city/bundles/dod.yml`, livrée par
  [DoD et DoR — des listes de règles](20261008154804532_dod-dor-contrat-partage.md).
  `ezk law show skill:<id>` sert les règles d'une compétence (`ezk-manifest.yml:55-59`), pas celles
  d'un paquet.

## Proposition

Trois commandes et une règle, POC d'abord.

1. **`ezk release passes list`** affiche les passes effectives, chacune avec sa source : `defaut`
   ou `projet`. Même mot que le contrat publié par
   [Contrat `config-show` v2](../20261114131613503_contrat-config-show-v2-passes-tests-niveaux.md) ;
   le JSON passe par ce contrat, pas par un second canal.
2. **La règle de composition, écrite ici une fois.** Le fichier projet COMPLÈTE le socle. Un
   drapeau explicite en tête du fichier, `replace: true` (nom proposé), le remplace. La règle est testée et écrite
   dans `skills/ezk-release/SKILL.md`. Les fiches
   [La gate de release joue les tests du projet](20261114131613314_gate-de-release-joue-les-tests.md)
   et [`ezk release verdict`](20261114131615903_ezk-release-verdict-par-commande.md) s'y réfèrent
   sans la redire.
3. **`ezk release passes add <id> --title "…" --command "…"`** écrit la passe dans
   `.vectorz/release-passes.yml` par une édition de document YAML, sans détruire les clés voisines
   ni les commentaires. Un id déjà pris, du socle ou du projet, est refusé avant écriture.
   **`passes remove <id>`** retire une passe du projet ; une passe du socle ne se retire pas par ce
   verbe, elle se remplace par `replace: true`.
4. **Les types.** `--type agent <nom>` crée une passe dont la commande lit le verdict posé par
   `ezk release verdict <id> <v>` ; `<nom>` est l'agent attendu, écrit dans le titre.
   `--type rules <paquet>` crée une passe qui vérifie un paquet de règles par `ezk law show` ; ce
   type attend [`ezk law show` sert chaque objet de la loi](../20261114131615350_ezk-law-show-regle-paquet-profil.md)
   et reste différé tant que cette fiche n'est pas livrée. La commande le dit quand on le demande.
5. **`ezk release <v>` joue la passe ajoutée** sans autre geste : le loader compose socle et projet
   selon la règle.

Hors périmètre : la passe `tests` et l'état `skip`, la forme du verdict, la publication pour
l'écran. Chacun vit dans la fiche liée ci-dessus.

## Critères d'acceptation

- [ ] `ezk release passes list` affiche les passes effectives, chacune avec sa source `defaut` ou
      `projet`, dans l'ordre où `ezk release <v>` les joue.
- [ ] Le fichier projet complète le socle ; `replace: true` en tête du fichier le remplace. La règle
      est testée et écrite dans `skills/ezk-release/SKILL.md`.
- [ ] `ezk release passes add <id> --title "…" --command "…"` écrit la passe dans
      `.vectorz/release-passes.yml` sans détruire les clés voisines ni les commentaires ; un id déjà
      pris est refusé avant écriture.
- [ ] `ezk release passes remove <id>` retire une passe du projet ; une passe du socle est refusée
      avec un message qui nomme `replace: true`.
- [ ] `--type agent <nom>` crée une passe dont la commande lit le verdict de `ezk release verdict` ;
      `--type rules <paquet>` est refusé avec un message qui nomme la fiche attendue, tant qu'elle
      n'est pas livrée.
- [ ] `ezk release <v>` joue une passe ajoutée par `add` sans autre geste ; après `remove`, elle
      disparaît du verdict.

## Comment vérifier

```bash
ROOT="$(git rev-parse --show-toplevel)"
ezk --root "$ROOT" release passes list                    # dod-mecanique, chasse-aux-bugs (+ tests après la fiche dépendante) : source defaut
ezk --root "$ROOT" release passes add deps-sante --title "Santé des dépendances" \
  --command "pnpm audit --audit-level=high"
ezk --root "$ROOT" release passes list                    # + deps-sante : source projet
cat "$ROOT/.vectorz/release-passes.yml"                   # la passe, les voisins intacts
ezk --root "$ROOT" release passes add dod-mecanique --title x --command x ; echo "EXIT=$?"   # refusé
ezk --root "$ROOT" release v0.24.0                        # deps-sante jouée
ezk --root "$ROOT" release passes remove deps-sante
ezk --root "$ROOT" config show --json | jq '.releaseGate.passes'   # la vue publiée par le contrat v2
```

Tests à lancer :

```bash
pnpm --dir products/mega-city test -- src/__tests__/release-gate.test.ts
```

Aucune preuve d'écran : l'écran Configuration suit par le contrat `config-show` v2.

## Glossaire

- `passe` — un contrôle de la gate de release : un id, un titre, une commande ; GO si la commande
  rend le code 0.
- `socle` — les passes par défaut de la méthode, jouées quand le projet n'en déclare pas.
- `paquet de règles` — une liste de règles de la loi, comme la DoD (`bundles/dod.yml`).
- `verdict` — le fichier qui enregistre le jugement d'une passe sous `.vectorz/release/`.

## Notes / décisions

- Origine : [la carte des écarts du 14 novembre](../../docs/maquettes/2026-11-14-carte-des-ecarts-maquette-code-backlog.md),
  écart E3 (page Configuration).
- Dépendances, dans l'ordre :
  [La gate de release joue les tests du projet](20261114131613314_gate-de-release-joue-les-tests.md)
  (la forme d'une passe du socle et l'état `skip`),
  [`ezk release verdict`](20261114131615903_ezk-release-verdict-par-commande.md) (le type « revue
  par un agent »),
  [Contrat `config-show` v2](../20261114131613503_contrat-config-show-v2-passes-tests-niveaux.md)
  (la publication). Le type « paquet de règles » attend
  [`ezk law show` sert chaque objet de la loi](../20261114131615350_ezk-law-show-regle-paquet-profil.md).
- Fiches livrées dont le code bouge :
  [Release gate — passe qualité avant versionnement](20260922175954296_release-gate-passe-qualite-versionnement.md)
  (le loader et sa règle « remplace ») et
  [Revue design-system : un step composable](20261011153019643_revue-design-system-step-composable-release.md) (la passe prête à ajouter).
- Cas d'usage réel d'une passe à ajouter :
  [Santé des dépendances](../20260816194833618_deps-sante-audit-local-par-profil.md), parkée.
- Décision à prendre au build : `replace: true` change le sens d'un fichier `release-passes.yml`
  existant. Aucun projet connu n'en a ; si un projet en avait un, ses passes s'ajouteraient
  désormais au socle au lieu de le remplacer. La compétence le dit.
- Risque : trois types de passes font trois formes de commande à maintenir. Le POC ne livre que
  `--command` et `--type agent` ; `--type rules` attend son lecteur.
