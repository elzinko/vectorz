---
id: "20261114131615350"
title: "`ezk law show` sert chaque objet de la loi : règle, paquet, profil"
type: feature
priority: P2
product: mega-city
milestone: board
version:
labels: [loi, contrat]
status: idea
blocked:
pr:
evidence: none # une commande publiée, aucun écran modifié
created: 2026-11-14
---

# 20261114131615350 — `ezk law show` sert chaque objet de la loi : règle, paquet, profil

**En clair.** La loi de la méthode se publie déjà en un seul bloc : 96 règles, et qui les applique.
Mais on ne peut pas demander une règle seule, un paquet seul ou un profil seul ; la demande d'une règle
est même ignorée en silence et rend tout le bloc. La commande servira chaque objet avec son texte
complet et ses liens, et les pages Règle, Paquet et Profil de mission control auront de quoi s'afficher.

**Si tu arrives frais.** Une *règle* est un fichier markdown du catalogue de la méthode. Un *paquet*
(bundle) regroupe des règles ; un *profil* choisit des paquets, des agents et des compétences (skills).
`ezk law show --json` publie ce graphe ; mission control ne lit que ce JSON, jamais les fichiers (ADR-086).

## Contexte / Problème

Ce que l'écran attend. Un objet, une page. La page Règle veut le texte complet, le niveau, les
paquets, les profils, qui l'applique et qui la vérifie. La page Paquet veut ses règles, directes et
héritées, et les profils qui le portent ; la page DoD (le paquet « Definition of Done ») en est une.
La page Profil veut sa composition (`extends`, paquets, agents, skills), son nombre de règles et
« lié à : poste / projet ».

Ce que le code publie aujourd'hui (lecture et mesures du 14 novembre) :

- La carte entière : `ezk law show --json` rend `regles[]` (96) et `objets[]` (51 : skill, agent,
  bundle, profile). Chaque objet n'y porte que `id`, `type`, `litSesRegles` et `regles` : ni
  `extends`, ni paquets, ni agents, ni compétences. Les règles d'un profil et d'un paquet sont déjà
  calculées, `profileLiens` et `bundleLiens` ; les profils d'une règle aussi.
  `products/mega-city/src/core/law-show.ts:181-199` et `:250`.
- Le titre est publié tel quel : `rule.title ?? rule.id`.
  `products/mega-city/src/core/law-show.ts:245`.
- Le texte complet d'une règle n'existe que par `skill:<id>` ou `agent:<id>`, et seulement si aucune
  loi installée ne la porte.
  `products/mega-city/src/core/law-show.ts:354`.
- `regle:<id>` n'est pas reconnu : la regex ne capte que `skill|agent|bundle|profile`. Vérifié :
  `ezk law show regle:clean-code/no-dead-code --json` rend la carte entière, 96 règles, pas de clé
  `objet`, code 0. C'est un bug : rien ne dit à l'appelant que sa demande a été ignorée.
  `products/mega-city/bin/law-show.ts:42`.
- `bundle:<id>` et `profile:<id>` sont captés pour être refusés : « objet inconnu », code 1. Vérifié
  le 14 novembre. Le cœur rend `null` pour eux, et un test le garde.
  `products/mega-city/bin/law-show.ts:53-55` ; `products/mega-city/src/__tests__/law-show.test.ts:312`.
- Le détail relationnel de tout nœud règle, paquet ou profil existe déjà, écrit pour l'ancienne carte.
  `products/mega-city/src/core/loi-view.ts` (ADR-0041).
- L'hôte d'un profil n'existe qu'en prose, colonne « Hôte typique » du README ; aucun champ `host:`
  dans `profiles/*.yml`.
  `products/mega-city/profiles/README.md:13-20`.
- Titres : la carte compte 59 titres sur 96 sans marque de français (Testing Philosophy, Hexagonal
  Architecture…) ; une règle est publiée par son id, faute de `title:` (vérifié le 14 novembre).
  `products/mega-city/rules/clean-code/no-dead-code.md`.
- Mission control lit la carte par `ezkLawSource.ts` et l'affiche dans `LawView.tsx` ; il n'a aucune
  page d'objet.
  `products/cop1/packages/app/src/features/board/ezkLawSource.ts` ; `products/cop1/packages/web/src/board/LawView.tsx`.

Ce qui manque : trois vues d'objet et le texte complet d'une règle. Un branchement, pas un moteur.

## Proposition

1. **Corriger le bug.** La regex de `bin/law-show.ts:42` capte `regle:`. Tout préfixe inconnu est
   refusé, code 1, avec un message. Un test le garde.
2. **Trois vues d'objet** (noms de champs proposés), dans `lawObjectData`
   (`products/mega-city/src/io/law-show.ts:43`) et `buildLawObject` (le cœur pur) :
   - `regle:<id>` → id, titre, niveau, catégorie, fichier, texte complet, paquets, profils,
     `appliqueePar`, `verifieePar`, portée.
   - `bundle:<id>` → ses règles, directes et héritées par `extends`, chacune avec son `via` ; les
     profils qui le portent ; les compétences et agents qui le citent.
   - `profile:<id>` → `extends`, `bundles`, `agents`, `skills`, le nombre de règles, et `lie_a` :
     nul tant que la fiche [`ezk law status`](20261114131615164_ezk-law-status-profil-et-fraicheur.md)
     n'est pas livrée.
3. **Rien n'est recalculé.** Les vues réutilisent `bundleLiens`, `profileLiens` et `loi-view`.
4. **Le test change de sens.** « un objet inconnu, un bundle ou un profil : rien »
   (`law-show.test.ts:312`) devient « un objet inconnu : rien ; un bundle ou un profil : sa vue ».
5. **Le contrat suit.** `contracts/law-object` couvre les cinq sortes d'objet (skill, agent, règle,
   paquet, profil), dans `v1` ou des dossiers frères. Schéma et exemple régénérés par
   `pnpm law:contract --write` ; `schema_version` inchangé si aucun champ ne disparaît.

Décision du PO à prendre avant le build, posée par la carte (écart D2) : soit un champ `host:` déclaré
dans `profiles/<id>.yml` (le profil cesse d'être indépendant de l'hôte), soit seulement « lié à »,
venu du bind. Cette fiche recommande la seconde voie : l'hôte est déjà un argument du bind
(`ezk law bind <profil> <projet> [hôte]`), et rien ne se déduit du README. Le critère sur
`profile:<id>` suit la décision.

Hors périmètre : traduire les 59 titres et poser le `title:` manquant (chore de contenu, à part) ; les
paquets posés par le profil lié (fiche `ezk law status`) ; les pages côté mission control (fiche cop1
sœur). Mission control lira le texte d'une règle par ce contrat seulement, jamais `rules/*.md` (ADR-086).

## Critères d'acceptation

- [ ] `ezk law show regle:<id> --json` rend id, titre, niveau, catégorie, fichier, texte complet,
  paquets, profils, appliquée par, vérifiée par et portée ; un id inconnu ou un préfixe inconnu rend
  code 1 et un message, jamais la carte entière.
- [ ] `ezk law show bundle:<id> --json` rend ses règles, directes et héritées par `extends` avec leur
  `via`, les profils qui le portent et les compétences et agents qui le citent.
- [ ] `ezk law show profile:<id> --json` rend `extends`, `bundles`, `agents`, `skills`, le nombre de
  règles et `lie_a` ; l'hôte n'y figure que si le PO choisit le champ `host:`, jamais déduit du README.
- [ ] Pour chaque paquet et chaque profil, la vue compte autant de règles que son entrée dans
  `objets[]` de la carte : un seul calcul.
- [ ] Les contrats sous `contracts/law-object` décrivent les cinq sortes d'objet, schéma et exemple compris.
- [ ] Le test « un objet inconnu, un bundle ou un profil : rien » attend désormais la vue d'un bundle et
  d'un profil, et toujours rien pour un objet inconnu.

## Comment vérifier

```bash
ROOT="$(git rev-parse --show-toplevel)"
ezk --root "$ROOT" law show regle:clean-code/no-dead-code --json | jq '{id, titre, niveau, texte: (.texte | length), bundles, profils}'
ezk --root "$ROOT" law show bundle:clean-code --json | jq '{regles: (.regles | length), profils}'
ezk --root "$ROOT" law show profile:daily --json | jq '{extends, bundles, nb_regles, lie_a}'
ezk --root "$ROOT" law show inconnu:x --json > /dev/null; echo "EXIT=$?"   # attendu : 1
# Un seul calcul : le même compte que la carte pour le paquet clean-code
ezk --root "$ROOT" law show --json | jq '[.objets[] | select(.id == "bundle:clean-code") | .regles | length]'   # 7 le 14 novembre
pnpm --dir products/mega-city law:contract
pnpm --dir products/mega-city test -- src/__tests__/law-show.test.ts src/core/__tests__/loi-view.test.ts
```

Aucun écran ne change : pas de preuve avant / après.

## Glossaire

- `règle` — un fichier `products/mega-city/rules/<catégorie>/<id>.md` : un niveau (MUST, SHOULD, MAY), un texte, parfois une garde.
- `paquet` (bundle) — un groupe de règles, `products/mega-city/bundles/<id>.yml` ; un paquet peut en étendre un autre.
- `profil` — un choix de paquets, d'agents et de skills, `products/mega-city/profiles/<id>.yml` ; c'est lui qu'on lie à un projet.
- `portée` — là où une règle agit vraiment : installée partout, dans le projet, lue au démarrage d'un skill, seulement citée, rangée dans un paquet, ou orpheline.
- `hôte` — l'outil qui lit la loi ; aujourd'hui il se donne au bind, pas dans le profil.

## Notes / décisions

- Origine : la [carte des écarts du 14 novembre](../docs/maquettes/2026-11-14-carte-des-ecarts-maquette-code-backlog.md),
  écart D2, et la [capture du panel Loi / Annuaire du 11 novembre](../docs/captures/2026-11-11-panel-loi-projet-annuaire-maquette.md),
  § 4 « Pages d'objet » et § 6.
- Décision du PO à prendre : `host:` dans les profils, ou seulement « lié à » venu du bind (la fiche
  recommande la seconde voie).
- Lien souple avec la fiche [`ezk law status`](20261114131615164_ezk-law-status-profil-et-fraicheur.md) :
  `lie_a` et les paquets posés par le profil lié en viennent ; elle peut se livrer avant, `lie_a` nul.
- Voisine : [Un seul lecteur de la loi du projet](20261114131615534_un-seul-lecteur-de-la-loi-du-projet.md),
  qui enrichit `regles[]` de la même carte.
- Fiches livrées en amont :
  [La méthode publie sa loi en JSON](done/20261101215342537_ezk-law-show-portee-des-regles.md) (la carte) ;
  [Chaque skill et chaque agent lit ses règles au démarrage](done/20261102103553108_chaque-skill-lit-ses-regles-a-l-usage.md)
  (`skill:<id>`, et le refus de `bundle:` / `profile:`) ;
  [La carte ne montre pas LA LOI de l'intérieur](done/20260821172716537_carte-ne-montre-pas-la-loi.md)
  (a produit `loi-view.ts`, [ADR-0041](../products/mega-city/docs/adr/0041-carte-la-loi-lecteur-runtime-graphe-compile.md)) ;
  [Mission control montre la loi](done/20260826222044335_carte-la-loi-graphe-visuel.md) (la vue Loi actuelle).
- Idées parkées, sans couverture : [Une interface web pour éditer profils et bundles](0114-webapp-config.md) ;
  [Installer un profil de règles au format natif de cop1](0121-cap-cop1.md).
- Contrainte : [ADR-086](../docs/adr/ADR-086-la-methode-seul-lecteur-des-fiches-contrat-json.md),
  mission control ne lit que les contrats JSON.
- Risque : le refus de `bundle:` et `profile:` était voulu et testé ; cette fiche change ce test, et le dit.
