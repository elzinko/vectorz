---
id: "20260821172716540"
title: Recette « site produit » — un skill + des règles activables (cas samplerz)
type: feature
priority: P2 # posée par défaut — PO à confirmer (P1 si construction dès la prochaine session)
product: mega-city
version:
epic:
status: idea
ready:
pr:
created: 2026-08-21
---

# Fabriquer un site produit par recette — sans inventer de nouveau concept

## En clair

Le besoin : une façon répétable de créer le site d'un produit — page d'attente publique
(façon byhere.fr) tant que le produit n'est pas prêt, vrai site sur le domaine de
staging, et des règles ajoutables comme « toute image du produit est une capture de
l'application démarrée ». La question posée : faut-il un nouveau concept « recette » ?
**Réponse de l'analyse : non — tout existe déjà dans la méthode ; recette = un skill
+ un bundle de règles. Ce qui manque est un petit maillon : les skills ne déclarent
pas les règles qu'ils appliquent.**

## Contexte / Problème

Demande PO du 2026-08-21, cas concret **samplerz** :

- le domaine public sert une **page d'attente** tant que le produit n'est pas lancé ;
- le **vrai site** vit sur `dev.samplerz.fr` (staging, non indexé) ;
- règle souhaitée : si le site montre le produit, les images sont des **captures de
  l'app démarrée** — jamais des maquettes ;
- c'est **récurrent** : chaque produit voudra sa déclinaison, avec des options
  activables différentes.

Et une gêne : « ce sujet a déjà été traité en partie mais je ne retrouve pas le
concept dans la carte ». Exact — voir la fiche sœur
[la carte ne montre pas LA LOI](20260821172716537_carte-ne-montre-pas-la-loi.md).

## Ce qui existe déjà (anti-doublon — rien de tout ça n'est à réinventer)

| Le besoin exprimé | La pièce existante |
|---|---|
| « des règles que je peux ajouter » | `rules/` — une règle = un fichier markdown + frontmatter (`id`, `level` MAY/SHOULD/MUST) |
| « des options activables » | `bundles/` (groupes de règles nommés) + `profiles/` (qui active quoi, par projet) |
| « le projet ajoute SES règles » | doctrine « le projet déclare, la méthode lit » — [ADR-0020 §4](../products/mega-city/docs/adr/0020-capacite-partagee-brique-autonome.md) |
| le patron complet « moteur de règles par domaine, profils composables, moisson » | [ADR-0026](../products/mega-city/docs/adr/0026-capacite-ux-agent-plus-skill-mince.md) — dessiné pour l'UX, **jamais construit** : ce cas-ci peut être sa première application |
| « captures de l'app démarrée » | fiche [screenshots produit](20260812104022228_ezk-screenshots-doc-produit.md) — capturée pendant le grooming du site **samplerz** — + la règle [pr-before-after-media](../products/mega-city/rules/development/pr-before-after-media.md), + `ezk-qa`/`run`/`ezk-preview` |

⚠️ **Piège de nommage** : « recette » est déjà pris. `ezk-recipy`
([ADR-0013](../products/mega-city/docs/adr/0013-ezk-recipy-entonnoir-de-sourcing-jamais-fabrique.md))
désigne un *entonnoir qui propose des skills*, tout autre chose. Le skill de ce chantier
devra s'appeler autrement (`ezk-site` ? `ezk-vitrine` ?) — nommage au PO.

## L'analyse d'architecture (format ADR — l'ADR sera gravé à la construction)

> Pourquoi pas un ADR numéroté aujourd'hui : l'audit du 2026-08-20 a montré 19 décisions
> sur 29 restées « proposé », jamais appliquées. On ne grave la décision qu'en
> construisant (numéro via `bash products/mega-city/bin/check-adr-ids.sh . --next`).

**Contexte / forces** : besoin récurrent multi-produits · risque n°1 documenté du repo =
la surproduction de méta-outillage (ADR-0013) · règle d'or : le LLM applique et juge,
le script sélectionne et compose · doctrine des déclarations : l'inconditionnel
seulement (leçon des 3 sur-déclarations du 2026-08-20).

### Option A — Un nouveau concept « recette » (objet à part entière)

Un type de document « recette » qui contient des règles ; les skills utilisent des recettes.

| Dimension | Évaluation |
|---|---|
| Complexité | Haute — nouveau type, nouveau loader, nouveau rendu carte |
| Redondance | **Totale** : un bundle EST un groupe de règles nommé ; un profil EST une activation |
| Risque | Le vice documenté du repo : du vocabulaire déclaré que rien n'exécute |

**Contre** : troisième vocabulaire pour la même chose ; la carte devrait apprendre un
nouveau type de nœud ; contredit la leçon « déclaré ≠ appliqué ».

### Option B — Recette = un skill + un bundle de règles (+ le maillon manquant) ✅ recommandée

La « recette » n'est **pas un objet** : c'est un **skill** (le *comment* : construire le
site depuis un template) qui applique un **bundle** (les *choix* : les règles site/*).
L'activation reste au **projet** (profil / déclaration locale). Le seul ajout au modèle :
un champ frontmatter sur Skill — proposition : réutiliser **`interactions:`**, le mot
déjà employé par les agents pour « les règles que je respecte » — avec son vérificateur
miroir (même patron que `composes:`/`roles:`, câblés le 2026-08-20/21).

| Dimension | Évaluation |
|---|---|
| Complexité | Basse — 1 champ + 1 checker (~patron checkRoles existant) + des fichiers de données |
| Concepts neufs | **Zéro** |
| Carte | L'arête skill→règles devient déclarée, donc affichable avec provenance |

**Pour** : samplerz exprimable sans rien inventer ; ADR-0026 trouve enfin sa première
application ; la gêne « invisible sur la carte » se corrige à la racine.
**Contre** : discipline à tenir — `interactions:` déclare ce que le skill *sait
appliquer* (inconditionnel à son niveau), pas ce qui est actif (ça, c'est le profil).

### Option C — Statu quo : tout en prose dans le skill

**Contre** : invisible sur la carte (la gêne exacte du PO), invérifiable, et re-création
du problème tout juste corrigé pour `composes:`/`roles:`.

### Les deux moments — à ne pas confondre (le cœur du design)

| Moment | Qui décide | Nature |
|---|---|---|
| **Activation** — la règle compte-t-elle pour CE projet ? | le profil / la déclaration projet | déterministe (le script) |
| **Application** — s'applique-t-elle ICI ? | la condition écrite DANS la règle | jugement (le LLM) |

Exemple : `site/screenshots-live` est **toujours chargée** par le bundle site (activation),
mais ne **s'applique** que si le site montre le produit (sa condition, dans son corps).

### Conséquences

- **Plus facile** : le cas samplerz s'écrit en fichiers de données ; la carte peut montrer
  qui applique quoi, prouvé ; le patron se rejoue pour d'autres domaines (UX, doc…).
- **Plus dur** : un champ de plus à discipliner ; le nommage du skill à trancher.
- **À revisiter** : la moisson de règles (`extract`, ADR-0026 §1ter) ; où vit la
  déclaration projet-locale côté samplerz.

## L'exemple samplerz, complet (fichiers cibles — à créer AVEC le skill, jamais avant)

```markdown
# rules/site/holding-page.md
---
id: site/holding-page
kind: disposition
level: MAY
title: Page d'attente tant que le produit n'est pas lancé
---
Le domaine public sert une page d'attente : promesse en une phrase, capture
d'email optionnelle, zéro lien mort. Le vrai site vit sur le staging, non indexé.
```

```markdown
# rules/site/screenshots-live.md
---
id: site/screenshots-live
kind: disposition
level: MUST
title: Les images du produit sont des captures de l'app démarrée
---
S'applique quand le site montre le produit : toute image de l'application est une
capture de l'application DÉMARRÉE (run/preview), jamais une maquette redessinée.
(Compose la fiche « screenshots produit » — ne la réimplémente pas.)
```

```yaml
# bundles/site.yml
id: site
rules:
  - site/holding-page
  - site/screenshots-live
  - site/staging-first
```

```yaml
# côté samplerz — le projet déclare ce qu'il active
bundles: [site]
skills: [ezk-site]        # nom à trancher
```

```yaml
# extrait du frontmatter du skill (le maillon nouveau)
name: ezk-site
composes: [ezk-preview]
interactions: [site/holding-page, site/screenshots-live, site/staging-first]
```

## Critères d'acceptation

- [ ] Le PO a tranché : nom du skill, et option B confirmée (ou renvoyée).
- [ ] Le champ skill→règles existe, est lu, vérifié (checker miroir) et testé.
- [ ] Le bundle `site` et ses règles n'entrent au repo **qu'avec** le skill consommateur
      (jamais de stock déclaré-non-appliqué).
- [ ] samplerz : page d'attente réelle activée par la recette ; la règle screenshots
      s'applique quand le site montre le produit.
- [ ] La carte affiche l'arête skill→règles avec provenance (fiche sœur carte-LOI).

## Comment vérifier

Aujourd'hui (analyse) : relire l'exemple ci-dessus et vérifier qu'aucune pièce n'exige
un concept nouveau. Puis `pnpm ezk:map` : constater que rien de LA LOI n'y est visible —
c'est le manque que la fiche sœur corrige.

Après construction (sabotage) : retirer `site/screenshots-live` du bundle → la recette
ne l'applique plus ; l'y remettre → elle s'applique. Le cycle doit tenir en une minute.

## Notes

- Épic « fidélité de la carte » : lié par la fiche sœur, pas par rattachement (ce
  chantier est de la méthode, pas de la représentation).
- Priorité **posée P2 par défaut** — à confirmer par le PO.
