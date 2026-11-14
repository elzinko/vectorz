---
id: "20261114131615164"
title: "`ezk law status` : le profil lié et la fraîcheur de la loi d'un projet"
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

# 20261114131615164 — `ezk law status` : le profil lié et la fraîcheur de la loi d'un projet

**En clair.** La loi d'un projet est un fichier posé dans son dépôt ; quand les règles de la méthode
changent, ce fichier peut mentir sans que personne le voie, et rien ne dit quel profil l'a posé. Une
commande dira, pour un projet, quel profil a posé sa loi, sur quel hôte, et si elle est à jour.
L'écran Loi pourra alors afficher « déployée par le profil … · à jour » et activer son bouton
« Mettre à jour la loi ».

**Si tu arrives frais.** Un *profil* est un choix de règles, d'agents et de compétences (skills) de la
méthode. *Lier* un profil à un projet (`ezk law bind`) compile ses règles dans `.iamthelaw/ENTRY.md` :
la *loi* du projet. Le *catalogue* est le dépôt de la méthode d'où ces règles viennent ; l'*hôte* est
l'outil qui lit la loi (Claude Code, par exemple).

## Contexte / Problème

Ce que l'écran attend. La page Loi de la maquette ouvre par une ligne « déployée par le profil … ·
à jour / à recompiler » et un bouton « Mettre à jour la loi », dessiné inactif tant que le profil lié
n'est pas publié. L'Annuaire veut une colonne « lié à » par profil. Le panel du 11 novembre l'a rangé
dans « ce que la méthode doit publier ».

Ce que le code fait aujourd'hui (lecture du 14 novembre) :

- `ezk law status <profil>` et `ezk law doctor <profil>` existent, en texte seulement.
  `products/mega-city/bin/lawgiver.ts:119-129` et `96-112` ; `products/mega-city/src/core/deploy-state.ts:101`.
- Ils visent `~/.claude` et exigent le nom du profil. Vérifié : `ezk law status --json` sans profil
  rend l'usage, code 2 (rejoué le 14 novembre). Le manifeste déclare le verbe sans projet (`root: none`).
  `products/mega-city/ezk-manifest.yml:45-49`.
- La fraîcheur existe pour la loi globale : `checkLaw` compare le fichier au plan, octet pour octet,
  et rend `loi-perimee`. Mais le chemin est codé en dur : `GLOBAL_LAW_PATH`.
  `products/mega-city/src/core/deploy-doctor.ts:60-68` ; `products/mega-city/src/domain/law-file.ts:12`.
- `ezk law show --root <projet> --json` ne dit du projet que `lois.projet.{chemin, installee}`.
  `products/mega-city/src/core/law-show.ts:32-35`.
- Le profil lié n'est enregistré nulle part. L'en-tête d'`ENTRY.md` tient en deux lignes fixes :
  « # I AM THE LAW / Règles compilées de ce projet (cap claude-code-law) ». Ni profil, ni hôte, ni
  commit du catalogue. `config show --json` et `.vectorz/config.yml` n'ont aucune clé profil.
  `products/mega-city/src/caps/claude-code-law.ts:22` ; vérifié sur `.iamthelaw/ENTRY.md` du dépôt.
- La loi globale, elle, s'ouvre déjà par un marqueur en en-tête YAML : `generated-by: lawgiver bind-global`.
  `products/mega-city/src/domain/law-file.ts:18-21`.

Ce qui manque : `--root` et `--json` sur `status`, la fraîcheur d'`ENTRY.md`, et le profil lié.
L'ADR-0064 l'avait promis : sa « Mesure (critère 3) » demande d'étendre `doctor` à une cible projet,
ou un contrôle qui recompile la loi. C'est l'origine de cette fiche.

## Proposition

POC d'abord, en quatre gestes. Les noms de clés et de champs ci-dessous sont des propositions : le PO
a tranché le principe de l'en-tête, pas les noms.

1. **Le bind estampille la loi.** `ezk law bind <profil> <projet> [hôte]` ouvre `ENTRY.md` par un
   en-tête YAML : `generated-by: lawgiver bind`, `profile`, `host`, `catalog_commit`. Même discipline
   que la loi globale (`law-file.ts`). Le cap reste pur : le bord I/O lui passe ces trois valeurs ;
   `gitFacts` (`src/loaders/project-rules.ts:147`) sait déjà lire le commit d'un dossier. La lecture
   ne change pas : `installedRuleIds` ne lit que les titres `## <id>`
   (`products/mega-city/src/core/law-show.ts:111-112`).
2. **Une commande de fraîcheur.** `ezk law status --root <projet> --json` rend
   `{schema_version, projet, profil, hote, loi: {chemin, installee, a_jour, commit_catalogue}}`.
   Sans `ENTRY.md` : `installee` faux, `profil` nul. Avec un `ENTRY.md` ancien, sans en-tête :
   `profil` nul, jamais une valeur devinée. Code 1 si la loi est périmée : un contrôle bloquant.
3. **Un seul code de fraîcheur.** `a_jour` recompile la loi depuis le catalogue courant pour ce
   profil et la compare au fichier, octet pour octet. `checkLaw` et `isManagedLaw` sont paramétrés
   par chemin, pas recopiés.
4. **Le contrat `law-show` l'expose.** `lois.projet.profil`, champ ajouté ; `schema_version` reste 1.
   Schéma et exemple régénérés par `pnpm law:contract --write`.

L'en-tête d'`ENTRY.md` est le **registre de bind minimal** : profil, hôte, commit. La fiche
[Versionner et migrer tous les artefacts de la méthode (Skema)](0186-skema-versioning-migrations-skills-deployees.md)
propose le cas général, un registre pour tous les artefacts (§ 2 « Registre de bind »). Elle reste
parkée ; si elle se construit un jour, elle reprend cet en-tête. On ne crée pas deux registres.

L'ADR-0064 est amendé au passage : l'en-tête estampillé, et un constat. Son texte dit que les hooks
sont hors du law-only ; le cap les relaie pourtant (`collectHooks`,
`products/mega-city/src/caps/claude-code-law.ts:33-40`). Le texte s'aligne sur le code.

Hors périmètre : le bouton « Mettre à jour la loi » dans mission control (fiche cop1 à part) ;
`law doctor --root` ; le registre général de la fiche Skema.

## Critères d'acceptation

- [ ] Après `ezk law bind <profil> <projet>`, `.iamthelaw/ENTRY.md` s'ouvre par un en-tête YAML qui
  porte `generated-by`, `profile`, `host` et `catalog_commit` ; `law show` y compte les mêmes règles
  qu'avant.
- [ ] `ezk law status --root <projet> --json` rend `schema_version`, `projet`, `profil`, `hote` et
  `loi` (chemin, installee, a_jour, commit_catalogue) ; sans `ENTRY.md`, `installee` est faux et
  `profil` nul ; avec un `ENTRY.md` sans en-tête, `profil` est nul.
- [ ] `a_jour` passe à faux dès qu'une règle du profil change dans le catalogue sans nouveau bind ;
  la commande sort alors en code 1.
- [ ] Le contrat `law-show` reste en version 1 ; son schéma et son exemple décrivent `lois.projet.profil`.
- [ ] La fraîcheur de la loi globale et celle de la loi du projet passent par la même fonction,
  paramétrée par chemin.
- [ ] L'ADR-0064 décrit l'en-tête estampillé et dit que le cap law-only relaie les hooks, comme le code.

## Comment vérifier

```bash
# Un projet jetable lié en law-only : rien n'est écrit dans ~/.claude
mkdir -p /tmp/projet-essai && git -C /tmp/projet-essai init -q
ezk law bind daily /tmp/projet-essai claude-code-law
head -6 /tmp/projet-essai/.iamthelaw/ENTRY.md
ezk law status --root /tmp/projet-essai --json > /tmp/status.json; echo "EXIT=$?"
jq '{profil, hote, loi}' /tmp/status.json
# Périmer la loi : changer le texte d'une règle du profil dans products/mega-city/rules/, puis
ezk law status --root /tmp/projet-essai --json > /tmp/status.json; echo "EXIT=$?"   # attendu : 1
jq '.loi.a_jour' /tmp/status.json                                                  # attendu : false
# Le contrat law-show et les tests
ezk --root "$(git rev-parse --show-toplevel)" law show --json | jq '.lois.projet'
pnpm --dir products/mega-city law:contract
pnpm --dir products/mega-city test -- src/__tests__/deploy-doctor.test.ts src/__tests__/law-show.test.ts
```

Aucun écran ne change : pas de preuve avant / après.

## Glossaire

- `profil` — un choix de règles, d'agents et de compétences (skills) de la méthode, déclaré dans `products/mega-city/profiles/<id>.yml`.
- `loi` — les règles d'un profil compilées en un fichier markdown : `.iamthelaw/ENTRY.md` pour un projet, `~/.claude/rules/iamthelaw.md` pour le poste.
- `bind` — le geste qui lie un profil à un projet et écrit sa loi (`ezk law bind`).
- `catalogue` — le dépôt de la méthode (`products/mega-city`), source des règles.
- `hôte` — l'outil qui lit la loi ; `claude-code-law` est l'hôte « loi seule », sans agents ni compétences.
- `cap` — le module qui écrit les fichiers d'un hôte ; `claude-code-law` écrit `ENTRY.md`, le bloc de `CLAUDE.md` et les hooks.

## Notes / décisions

- Origine : la [carte des écarts du 14 novembre](../docs/maquettes/2026-11-14-carte-des-ecarts-maquette-code-backlog.md),
  écart D1, et la [capture du panel Loi / Annuaire du 11 novembre](../docs/captures/2026-11-11-panel-loi-projet-annuaire-maquette.md), § 6.
- Promesse tenue : [ADR-0064](../products/mega-city/docs/adr/0064-loi-bindee-par-projet-cap-law-only.md),
  « Mesure (critère 3) ».
- Décision du PO conservée : un en-tête YAML dans un fichier committé lu par l'humain. `ENTRY.md`
  reste committé parce qu'un humain le lit
  ([ADR-0055](../products/mega-city/docs/adr/0055-artefacts-generes-hors-versionnage.md)). Le
  marqueur de la loi globale vient de l'[ADR-0056](../products/mega-city/docs/adr/0056-loi-du-socle-par-le-global.md).
- Prérequis : un projet lié avant cette livraison publie `profil: null` tant qu'il n'est pas re-lié.
- Fiches livrées qui couvrent le reste :
  [Déployer vraiment les règles chez les agents](done/20260903134909124_loi-non-compilee-chez-l-agent.md)
  (le doctor et la loi globale) ;
  [CLAUDE.md = simple proxy vers la loi, bindée par projet](done/20261007115129448_claude-md-proxy-loi-bindee-par-projet.md)
  (le cap law-only).
- Fiches du lot qui s'en servent :
  [Un seul lecteur de la loi du projet](20261114131615534_un-seul-lecteur-de-la-loi-du-projet.md)
  (l'origine « profil » d'une règle ; dépendance déclarée) ;
  [`ezk law show` sert chaque objet de la loi](20261114131615350_ezk-law-show-regle-paquet-profil.md)
  (le « lié à » d'un profil ; lien souple, elle peut se livrer avant).
- Priorité : P2. P1 seulement si le PO veut le bouton « Mettre à jour la loi » avant la page Loi.
- Risque : un deuxième registre si la fiche Skema se construit sans reprendre cet en-tête.
