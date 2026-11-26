---
id: "20261114131613874"
title: "Trancher la coupe : committer le dossier du 10 novembre, panel adverse, ADR-0088"
type: chore
priority: P1
product: mega-city
milestone: board
version: v0.23.0
labels: [adr, release]
status: shipped
blocked:
pr: "local (78ff1f33)"
evidence: none # décisions et documents, aucun écran
created: 2026-11-14
---

# 20261114131613874 — Trancher la coupe : committer le dossier du 10 novembre, panel adverse, ADR-0088

**En clair.** Depuis le 23 octobre, plus aucune version n'est posée : au 10 novembre, le dossier comptait
85 fiches livrées depuis la dernière étiquette, dont 76 sans numéro. Ce dossier propose un nouveau modèle,
où la méthode construit des objectifs et où toi seul coupes des versions après test ; il est sur `main`
depuis le 14 novembre et personne ne l'a encore contesté. Cette fiche le soumet au panel adverse, puis
grave la décision : le bouton « Versionner » de mission control en dépend.

**Si tu arrives frais.** Une **milestone** (« objectif » à l'écran) est un lot de fiches préparé ensemble ;
une **version** est l'étiquette git posée sur ce qui est livré ; la **coupe** choisit ce que la version
contient. Les autres termes sont au glossaire, en bas.

## Contexte / Problème

Ce que l'écran attend. La maquette du 12 novembre ne garde qu'un bouton « Versionner » sur la page Version ;
ses contrôles se lisent dans Configuration › Process › Livrer une version. La page Versions attend une carte
« Prochaine coupe » : livrées depuis la dernière étiquette, numéro proposé, dernier verdict de la gate. C'est
la fiche voisine [Les versions publiées comme coupes](20261114131612759_versions-publiees-comme-coupes.md).

Ce qui existe aujourd'hui, vérifié le 14 novembre :

- Le dernier ADR de la méthode est le 0087 (`products/mega-city/docs/adr/0087-regles-lues-au-demarrage-du-skill.md`).
  Aucun ADR-0088 dans le dépôt committé ; son brouillon vit dans l'annexe du dossier.
- Le dossier `docs/plans/2026-11-10-deux-plans-milestone-run-version-coupe.md` est sur `main` depuis le
  14 novembre au soir (`60e7f327`, lien recalé par `2a90f349`) : 345 lignes, sept questions au panel, sept
  fiches candidates, un brouillon d'ADR-0088, la table des ADR qu'il amende.
- Le seul panel « versions » est celui du 16 octobre
  ([capture](../../docs/captures/2026-10-16-panel-sequencement-version-milestone.md), gravé dans
  [ADR-0081](../../products/mega-city/docs/adr/0081-sequencement-depends-signal-dag-differe.md)) : il a différé
  le graphe de dépendances, il n'a pas parlé de la coupe.
- `ezk backlog version` connaît `list`, `check`, `ready`, `close`, `freeze`, `unfreeze`, `diff`
  (`products/mega-city/bin/backlog-version.ts:45`), pas `tag`. L'étiquette se pose par `close <v> --tag`
  (lignes 330-367). `--seal-versions` et `ezk run versions` vivent (`products/mega-city/bin/run-versions.ts:1-13` ;
  `products/mega-city/skills/ezk-product-build/SKILL.md:345-385`). Rien à retirer sans `version tag`.
- Les tags de gel `freeze/<v>` existent dans le code (`products/mega-city/src/backlog/versions.ts:86`) ;
  le dossier dit qu'aucun n'a jamais été posé. Aucune commande ne génère de notes de version.
- La règle `documentation-guidelines/changelog` est `MUST` (`products/mega-city/rules/documentation-guidelines/changelog.md:4`),
  dans aucun bundle (`products/mega-city/bundles/base.yml`), absente de la loi compilée ; aucun `CHANGELOG.md`
  à la racine ni sous `products/`. Elle dort : ni appliquée, ni retirée.
- Le nom en clair d'une version vit dans la table « Train de versions » de `features/PLAN.md` (lignes 146-169) ;
  celui d'un objectif, dans sa section « Ordre de marche » (ligne 72 pour `board`). `ezk board show --json`
  publie `milestones[]` avec `milestone`, `status`, `total`, `shipped`, sans nom
  (`products/mega-city/contracts/board-show/v1/schema.json:96-112`).

Ce qui manque : la décision. Deux fiches l'attendent :
[Séquencer par milestone + dépendances inter-milestones](../20261016081021364_sequencer-par-milestone-dependances.md),
`blocked: panel` depuis le 16 octobre, et [Recopier sur GitHub ce que la méthode écrit en local](../0171-adapter-github-issues-push-only.md),
parkée, qui fait proposer la release GitHub par `version close X` (lignes 81 et 119).

## Proposition

Quatre gestes, dans l'ordre ; le premier est fait. Cette fiche écrit des documents ; elle ne touche pas au code.

1. **Le dossier est committé sur `main`** (`60e7f327`, 14 novembre au soir), dans `docs/plans/`, à côté de
   `docs/plans/2026-10-23-preparer-par-milestone.md`. Constaté, plus rien à faire.
2. **Tenir le panel adverse** sur les sept questions du dossier : la borne de la coupe ; la milestone partielle ;
   patch ou mineure ; l'axe de tirage ; deux lignes sur un seul `main` ; le gel `freeze/` ; le tas parké.
   Trois lentilles, un verdict par question, l'arbitrage du PO, dans une capture sous `docs/captures/`.
   Le panel vérifie aussi la forme de l'objet qui porte un nom (décision 2, en Notes) et la cohérence avec
   les décisions 1 et 3 portées par [Amendements d'ADR du 12 novembre](20261114131614058_amendements-adr-du-12-novembre.md).
3. **Ratifier ou rejeter ADR-0088** par `ezk adr new <slug> --scope methode`, qui pose le squelette au prochain
   numéro libre dans `products/mega-city/docs/adr/`. L'ADR tranche ce qu'une version contient (la coupe depuis
   la dernière étiquette), le verbe (`ezk backlog version tag <v>`, proposé par le dossier), le sort de
   `close --tag`, `--seal-versions`, `ezk run versions` et des tags `freeze/`, le sort des notes de version
   et de la règle `changelog`, et la forme de l'objet nommé.
4. **Amender** ADR-0083 §2, ADR-0070, ADR-0080, ADR-0076 et ADR-086 : une ligne datée dans chacun, qui renvoie
   à ADR-0088 et dit ce qui change. La table « Ce que ça amende » du dossier donne le contenu ; elle dit
   ADR-0076 « remplacé » et ne touche d'ADR-086 que la table « à publier » (ses §2-3 relèvent de la fiche voisine).

Hors périmètre : le code de la coupe ([`ezk backlog version tag <v>`](20261114131613689_ezk-backlog-version-tag-un-seul-verbe.md),
qui attend ce panel) ; la publication des [objectifs](20261114131612572_objectifs-publies-comme-objets.md) et des
[versions](20261114131612759_versions-publiees-comme-coupes.md) ; la fin du pseudo-objectif
[« parked »](../20261114131614612_parked-n-est-plus-un-pseudo-objectif.md) ; les notes de version elles-mêmes
(fiche à créer après l'ADR). Pas de `milestones.yml` : la décision 2 l'écarte.

## Critères d'acceptation

- [x] Une capture sous `docs/captures/` répond aux sept questions : trois lentilles, un verdict par question,
      l'arbitrage du PO. Elle dit la forme retenue pour l'objet qui porte le nom d'un objectif et d'une
      version, et constate la cohérence avec les décisions 1 et 3.
- [x] ADR-0088 existe dans `products/mega-city/docs/adr/`, au prochain numéro libre, accepté ou rejeté. Il
      tranche le contenu d'une version et le verbe de la coupe.
- [x] ADR-0083, ADR-0070, ADR-0080, ADR-0076 et ADR-086 portent chacun une ligne d'amendement datée qui renvoie
      à ADR-0088.
- [x] L'ADR dit le sort de `close --tag`, `--seal-versions`, `ezk run versions` et des tags `freeze/` : retirés
      par la fiche « version tag » dès que le verbe existe (règle `clean-code/no-dead-code`), ou gardés avec
      une raison écrite.
- [x] L'ADR dit le sort des notes de version et de la règle `documentation-guidelines/changelog` : notes
      générées depuis la coupe (fiche à créer, liée à la release GitHub de [Recopier sur GitHub](../0171-adapter-github-issues-push-only.md)),
      ou règle retirée, ou amendée puis rangée dans un bundle.
- [x] Les fiches qui attendaient ce panel sont requalifiées : « Séquencer par milestone » sort de
      `blocked: panel` (prête, superseded ou absorbée) et « version tag » perd son blocage.

## Comment vérifier

```bash
R="$(git rev-parse --show-toplevel)"; A="$R"/products/mega-city/docs/adr
git -C "$R" log --oneline -1 -- docs/plans/2026-11-10-deux-plans-milestone-run-version-coupe.md
grep -l "0088" "$R"/docs/captures/*.md          # attendu : la capture du panel de la coupe
ls "$A" | grep "^0088" && ezk --root "$R" docs check-adr-ids
grep -l "0088" "$A"/0083-*.md "$A"/0070-*.md "$A"/0080-*.md "$A"/0076-*.md "$R"/docs/adr/ADR-086-*.md   # attendu : cinq
ezk --root "$R" docs check-links
ezk --root "$R" backlog show --json | jq '[.fiches[] | select(.blocked == "panel")] | map(.id)'
ezk --root "$R" backlog check
```

Aucun test de code : la fiche ne touche que des documents et des fiches. Aucune preuve d'écran.

## Glossaire

- `gate de release` — le jeu de contrôles joué avant de poser l'étiquette d'une version.
- `lancement` — une exécution autonome de la méthode ; le journal et la ligne de commande disent « run ».
- `panel adverse` — une relecture à charge d'une proposition, par plusieurs lentilles, avant décision.
- `ADR` — le document court qui grave une décision d'architecture ; on l'amende par une ligne datée.
- `worktree` — une copie de travail du dépôt, sur sa propre branche, à côté du dossier principal.
- `front-matter` — l'en-tête de champs placé en tête d'une fiche ou d'un objet de la méthode.
- `bundle`, `loi compilée` — un paquet de règles ; la loi compilée est le fichier qu'une session charge.

## Notes / décisions

- Origine : la [carte des écarts du 14 novembre](../../docs/maquettes/2026-11-14-carte-des-ecarts-maquette-code-backlog.md), écart I4.
  Première fiche de l'ordre d'attaque, avec [Amendements d'ADR du 12 novembre](20261114131614058_amendements-adr-du-12-novembre.md).
- **Décision du PO du 14 novembre (décision 2), à confirmer par ce panel.** Le nom en clair d'un objectif et
  d'une version vit dans le front-matter de l'objet lui-même (la milestone, la version), pas dans `PLAN.md`.
  `PLAN.md` reste un fichier d'ordonnancement orienté LLM, pas la source des noms. Pas de `milestones.yml`.
  Le panel fixe la forme de l'objet : où vit le fichier, ses champs (id, nom en clair au moins), qui le lit
  (`ezk board show --json`), et comment il tient avec le dossier, qui refuse « tout objet milestone
  persistant » au nom d'ADR-0069 et garde `milestone:` en chaîne libre sur la fiche. Les fiches « objectifs »
  et « versions » du lot attendent cette forme.
- Ce que le dossier demande au panel de ne pas rouvrir : le graphe de dépendances (ADR-0081, quatre verrous) ;
  les quatre décisions réservées à l'humain, dont la coupe ; la gate de release comme précondition du tag ;
  un seul flux de code ; et « aucun objet milestone persistant » (ADR-0069). Ce dernier point heurte la
  décision 2 : le panel doit y revenir, c'est le point de tension de la fiche.
- Dépendances : aucune fiche du lot. Dépendent de celle-ci : [`ezk backlog version tag <v>`](20261114131613689_ezk-backlog-version-tag-un-seul-verbe.md)
  (`blocked: panel`), [les objectifs publiés](20261114131612572_objectifs-publies-comme-objets.md),
  [les versions publiées](20261114131612759_versions-publiees-comme-coupes.md) et
  [la fin du pseudo-objectif « parked »](../20261114131614612_parked-n-est-plus-un-pseudo-objectif.md).
- Voisine : [« À trancher »](20261104204526440_a-trancher-decisions-qui-bloquent-le-run.md), dont le cœur passe
  dans [la cloche](20261114131612944_ezk-now-json-alertes-de-la-cloche.md) ; le dossier y prévoit un type « couper ».
- Risques : les chiffres de l'En clair sont ceux du dossier, au 10 novembre, non recalculés ici.

## Journal

- 2026-11-14 — créée depuis la carte des écarts (lot de 27 fiches validé par le PO le 14 novembre).
- 2026-11-14 (soir) — groomée en autonomie (run du soir, mandat du PO jusqu'à minuit, relayé par la session
  pilote). Techniques : constater les dépendances (le dossier est sur `main` : le premier critère est tenu
  et retiré, six restent), rendre chaque critère testable (une commande par critère dans « Comment
  vérifier »), couper au plus petit morceau utile (des documents seulement ; le code de la coupe reste
  dans « version tag »). Le panel adverse se joue ce soir : trois lentilles (architecte de la méthode,
  produit, qualité-release-autonomie) puis deux juges adverses ; l'arbitrage du PO passe par la session
  pilote. Lot 1 du run : avec « Amendements d'ADR du 12 novembre ».
- 2026-11-14 (soir) — passée « prête » sur tampon `ezk-pm` (mode auto, sans `--stamp-ready`) : DoR complète,
  six critères prouvables par commande, dépendances constatées. Lot 1 du run du soir.
- 2026-11-14 (soir) — story construite et intégrée dans `main` (cd7d11f8) : capture du panel, ADR-0088 « proposé »,
  six amendements, deux fiches requalifiées. Revue adverse `ezk-reviewer` : NO-GO (sort de la règle changelog
  absent, puce d'amendement doublée) puis GO après correctifs. Cinq critères prouvés par le relecteur et cochés ;
  le sixième (ADR-0088 accepté ou rejeté) attend les quatre oui du PO : la fiche reste prête, reportée du sprint 7,
  à livrer dès la ratification (statut de l'ADR, puis `ship`).
- 2026-11-15 — le PO répond oui aux quatre questions du panel (dans sa session) : ADR-0088 passe « accepté »,
  les amendements et la capture le disent. Le dernier critère est à prouver par le relecteur, puis la fiche se livre.
