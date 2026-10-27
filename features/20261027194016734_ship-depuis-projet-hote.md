---
id: "20261027194016734"
title: "Ship depuis un projet hôte : `ship-in-pr.sh add` et `ezk backlog ship` refusent, le ship se fait à la main"
type: bug
priority: P1
product: mega-city
milestone:
version:
labels: [methode, ship, projet-hote]
depends:
status: idea
pr:
evidence: none # scripts et messages d'erreur, pas d'écran ; preuve = commandes rejouées depuis un clone hôte
created: 2026-10-27
---

# 20261027194016734 — Ship depuis un projet hôte : les deux commandes de ship refusent

## En clair

Dans un projet qui n'est pas vectorz, les deux commandes de ship que la méthode prescrit refusent de
travailler. `ship-in-pr.sh add` cherche le catalogue dans `<projet>/products/mega-city`, un dossier qui
n'existe que dans vectorz. `ezk backlog ship` refuse toute fiche dont le nom de fichier commence par
moins de quatre chiffres, ce qui est le cas des fiches historiques d'un hôte (`049-…`). Au run
autonome livestreamz du 2026-10-27, le ship des quatre PR a été fait à la main. On corrige les deux
scripts et on prouve le ship depuis un clone hôte.

## Si tu arrives frais

- **Ship** : ranger la fiche d'une story en `features/done/`, avec `status: shipped` et son numéro de
  PR, par un commit dans la branche de la PR
  ([ADR-0049](../products/mega-city/docs/adr/0049-ship-fiche-dans-la-pr-vues-post-merge.md)).
- **Projet hôte** : un dépôt qui utilise la méthode ezk sans contenir vectorz (livestreamz, muti,
  samplerz). Voir [ezk depuis un projet hôte](../products/mega-city/docs/ezk-depuis-un-projet-hote.md).
- **Catalogue** : `products/mega-city`, le dossier de vectorz qui porte les scripts de la méthode.

## Contexte / Problème

Vécu au run autonome `ezk-product-build` sur livestreamz, le 2026-10-27 (PR #86, #87, #88, #90 ;
journal `SPRINT.md` du run, entrée de 14:07). Deux pannes distinctes, une par commande.

**Panne 1 — `ship-in-pr.sh add` cherche le catalogue au mauvais endroit.** Dans
[ship-in-pr.sh](../products/mega-city/skills/ezk-pr/scripts/ship-in-pr.sh), `do_add` fixe en dur :

```bash
local mc="$repo/products/mega-city"
[[ -f "$mc/package.json" ]] \
  || die 2 "ship:fiche introuvable dans ce dépôt ($mc) — fais le ship à la main (ezk-backlog ship), puis committe"
pnpm --dir "$mc" ship:fiche -- --pr "#$pr" "${fiches[0]}"
```

Depuis livestreamz, `$repo/products/mega-city` n'existe pas : le script meurt avec
« ship:fiche introuvable dans ce dépôt (/…/livestreamz/products/mega-city) — fais le ship à la main ».
Pourtant le même script sait déjà trouver le catalogue : `loader_root()` (variable `MEGA_CITY_ROOT`,
sinon le chemin physique du script) sert à `check` et `undo`. Et `ship:fiche` accepte `--root <dépôt>`
pour viser un autre projet (en-tête de `bin/ship-fiche.ts`). `add` n'utilise ni l'un ni l'autre.

**Panne 2 — `ezk backlog ship` refuse les noms de fichier à trois chiffres.** Dans
[ship-fiche.ts](../products/mega-city/src/backlog/ship-fiche.ts), `FICHE_NAME = /^\d{4,}[-_].+\.md$/`
exige au moins quatre chiffres en tête du nom. Les fiches historiques de livestreamz s'appellent
`049-repo-github-private.md` (avec `id: "0049"` dans l'en-tête). `backlog check` et `backlog regen`
les acceptent ; `ship` les refuse, avec un message qui ment sur la cause :

```bash
ezk --root ~/git/bacasable/livestreamz backlog ship --dry-run --pr '#999' features/049-repo-github-private.md
# ✗ ship refusé — rien n'a été écrit :
#   features/049-repo-github-private.md : doit être une fiche directement sous features/ (pas déjà dans done/)
# code de sortie 1 — alors que le chemin EST directement sous features/
```

**Effet.** Au run, quatre ships faits à la main (statut et `pr` dans l'en-tête, `git mv` vers `done/`,
commit), donc sans la transaction du script : liens relatifs non recalés, index non régénéré, entrée de
`PLAN.md` non barrée. Et le skill `ezk-sprint` (étape 8) prescrit `ship-in-pr.sh add` comme la voie
normale : une commande citée qui ne résout pas, l'angle mort n° 3 d'`ezk-reviewer`.

Schéma, avant :

```
branche de story (hôte) ─▶ ship-in-pr.sh add ─▶ cherche <hôte>/products/mega-city ─▶ ✗ introuvable
                        ─▶ ezk backlog ship  ─▶ nom « 049-… » < 4 chiffres          ─▶ ✗ refusé
                        ─▶ ship à la main (sans transaction)
```

Après :

```
branche de story (hôte) ─▶ ship-in-pr.sh add ─▶ loader_root() trouve le catalogue ─▶ ship:fiche --root <hôte> ─▶ ✓ done/ + commit
```

## Proposition

1. **`ship-in-pr.sh add`** : `mc="$(loader_root)"`, puis
   `pnpm --dir "$mc" ship:fiche -- --root "$repo" --pr "#$pr" "${fiches[0]}"`. Le message d'échec
   restant nomme `MEGA_CITY_ROOT` comme remède, pas « fais le ship à la main ». Test dans
   `test-ship-in-pr.sh` : un dépôt hôte jetable sans `products/mega-city`.
2. **`ship-fiche.ts`** : une seule règle « nom de fiche », partagée avec ce que `check-fiches` et le
   loader acceptent, à la place du regex local à quatre chiffres. Deux messages distincts : « pas
   directement sous features/ » et « nom de fichier non reconnu (attendu `<id>-slug.md` ou
   `<id>_slug.md`) ». Le test existant `directement sous features` tient toujours.
3. **Doc et skill** : [ezk depuis un projet hôte](../products/mega-city/docs/ezk-depuis-un-projet-hote.md)
   et `ezk-sprint` étape 8 montrent la commande telle qu'elle se tape depuis un hôte, rejouée une fois.

Décision à trancher au groom : tolérer les noms à trois chiffres partout (`aggregate-apply.ts`,
`plan-order.ts`, `planning-views.ts` portent le même `\d{4,}` ou `\d{4}|\d{17}`), ou renommer les
fiches d'un hôte au format `0049-…` lors de sa migration. Recommandation : tolérer dans `ship` (c'est
la panne vécue) et traiter le reste dans une fiche à part si un hôte le rencontre.

## Critères d'acceptation

- [ ] Depuis un clone hôte sans `products/mega-city`, sur une branche de story propre,
      `ship-in-pr.sh add --repo . --fiche-id <id> --pr <N>` range la fiche en `features/done/`
      (`status: shipped`, `pr: "#<N>"`) et committe `docs(features): ship <id> #<N>`.
- [ ] `ezk --root <hôte> backlog ship --dry-run --pr '#999' features/049-repo-github-private.md`
      accepte la fiche (code 0) ; `check` et `ship` acceptent les mêmes noms de fichier.
- [ ] Un chemin réellement mauvais (`features/done/x.md`, `features/BACKLOG.md`) reste refusé, avec
      un message qui nomme la vraie raison.
- [ ] Les tests du catalogue couvrent les deux cas (nom à trois chiffres ; dépôt hôte sans catalogue)
      et passent.
- [ ] Le skill `ezk-sprint` (étape 8) et la doc hôte montrent une commande qui marche depuis un hôte.

**Mesure de suivi** — sur le prochain run autonome dans un projet hôte, 0 ship fait à la main
(journal `SPRINT.md` du run).

## Comment vérifier

```bash
# tests du catalogue
cd products/mega-city
pnpm test -- ship-fiche
bash skills/ezk-pr/scripts/test-ship-in-pr.sh

# reproduction lecture seule, depuis un hôte avec des fiches « NNN-slug.md »
ezk --root ~/git/bacasable/livestreamz backlog ship --dry-run --pr '#999' features/049-repo-github-private.md
echo "exit=$?"   # avant correction : 1 ; attendu après : 0 (dry-run, rien écrit)

# ship réel depuis un hôte, sur une branche de story jetable (le commit reste local)
cd ~/git/bacasable/livestreamz && git switch -c test/ship-hote
bash ~/.claude/skills/ezk-pr/scripts/ship-in-pr.sh add --repo . --fiche-id 049 --pr 999
git log -1 --stat   # attendu : docs(features): ship 049 #999, fiche sous features/done/
git switch main && git branch -D test/ship-hote
```

## Glossaire

- `loader_root()` — fonction de `ship-in-pr.sh` qui retrouve le catalogue : `MEGA_CITY_ROOT` si
  exporté, sinon le dossier physique du script.
- `ship:fiche` — la transaction de ship du catalogue (`bin/ship-fiche.ts`) : statut, `git mv`,
  liens, index, plan ; `--root` désigne le dépôt visé.

## Notes / décisions

- Priorité **P1 proposée** par le run, à confirmer : la méthode prescrit une commande qui refuse dans
  tout projet hôte, et le ship à la main saute la transaction.
- Au run, le premier appel de `ezk backlog ship` était aussi mal formé (id et `#PR` passés comme
  chemins, sans `--pr`). La reproduction ci-dessus, avec la bonne syntaxe, refuse quand même : la
  panne 2 est réelle.
- Constat lié, hors périmètre : `sprint.sh start --lot` résout les stories par le préfixe du nom de
  fichier (`004`), pas par l'`id` de l'en-tête (`0004`). Même racine (nom de fichier ≠ id sur un hôte
  migré) ; fiche à part si ça se reproduit.
- Fiches voisines : [Uniformiser --root](20261013143324404_root-uniforme-avant-apres-verbe.md)
  (lecture depuis un hôte) ; [Recopier sur GitHub ce que la méthode écrit en local](0171-adapter-github-issues-push-only.md)
  § « Bloquant pour un projet hôte » (`pr emit-local`, `review emit`, `run context` refusent un hôte).
  Celle-ci ne couvre que le ship.
