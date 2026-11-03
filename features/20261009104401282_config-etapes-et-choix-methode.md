---
id: "20261009104401282"
title: Configurer les étapes et les choix de la méthode via le fichier de config
type: feature
priority: P2
product: mega-city
milestone: methode-configurable
version:
labels: [fabrique]
status: ready
pr:
evidence: none # config de méthode ; l'écran (éditeur visuel) est une Suite
created: 2026-10-09
---

# 20261009104401282 — Configurer les étapes et les choix de la méthode par config

**En clair.** Aujourd'hui la méthode te pose ses choix au fil de l'eau : le menu de grooming
(techniques 1/2/3/4) se répond à la main, la revue adverse tourne toujours, l'ordre des étapes est
figé dans le texte des skills. Tu veux **pré-régler tout ça dans le fichier de config** : une étape
ou un choix s'exécute d'office, se saute, ou se pré-répond (tout / rien / une sélection), en mode
auto comme en manuel. Plus tard, un **éditeur visuel** pour voir et changer ces réglages sans ouvrir
un fichier.

**Si tu arrives frais.** Le *fichier de config* d'un projet est `.vectorz/config.yml` (il porte déjà
`github:`, des modules optionnels…). Les *techniques de grooming* sont le menu que `ezk-backlog
groom` propose (avis archi, critères testables, etc.). La *revue adverse* est le contrôle local
bloquant d'un sprint (`ezk-reviewer`, verdict GO/NO-GO).

## Contexte / Problème

Déclencheur daté : **2026-10-09**, demande PO, née du grooming interactif de la fiche coût-tokens
(« systématiquement exécuter les choix 1/2/3/4, voire tous ou aucun »).

Trois décisions de la méthode se règlent aujourd'hui de trois façons incohérentes :
- le **menu de grooming** se répond **à la main**, chaque fois ;
- les **étapes d'un skill** sont figées **en prose** — on ne peut ni en sauter une ni en changer
  l'ordre de façon déclarative (c'est le sujet de la fiche sœur
  [Rendre les étapes d'un skill configurables](20260830110131228_schema-etapes-skill-configurables.md)) ;
- **sauter la revue adverse** n'existe que comme flag parké
  ([Pouvoir sauter volontairement la revue adverse](done/20260830110131158_revue-adverse-skippable-flag.md)),
  contredit par l'ADR-0059 (la revue locale est un **plancher**).

Le PO veut **un seul endroit** — le fichier de config — pour pré-régler ces choix, au lieu de trois
mécanismes épars.

**Valeur — le coût de ne rien faire.** Sans ça, on re-répond le **même menu à chaque grooming** (deux
fois dans la seule session du 2026-10-09). On ne peut pas dire « ce projet applique toujours archi +
critères », ni « les POC sautent le grooming ». L'**auto-groom** n'a aucune politique par projet : il
choisit à l'aveugle. Et chaque nouveau projet réapprend les mêmes choix à la main. Ça touche le PO,
les équipes multi-projets et les runs autonomes, et ça mord **à chaque session**. « Rien de grave »
est faux — le P2 tient.

## Proposition

Esquisse, à cadrer (panel requis, voir Notes). Une section de config déclare, **par étape et par
choix**, s'il s'exécute / se saute / se pré-répond.

**Forme** (préférence PO 2026-10-09) : du **YAML par composant / par domaine, façon Spring Boot** —
on lit la config et on sait quoi on règle. Principe directeur : **on doit pouvoir overrider le
fonctionnement** de la méthode, y compris un plancher de sécurité, pourvu que ce soit **explicite et
tracé**. Les valeurs de config sont des **noms** — les ids stables du catalogue (ex.
`avis-architecte`, `criteres-testables`), **jamais des numéros de menu** : on lit la config et on
comprend ce qu'on règle (façon Spring Boot, PO 2026-10-09). Les numéros restent réservés au pick
rapide du menu interactif.

- **Étapes** — s'appuie sur le modèle « étapes comme donnée » de la fiche 228 (ne le refait pas) :
  la config active, désactive ou réordonne une étape.
- **Choix interactifs** — pré-répond un menu : un **interrupteur booléen par technique nommée**, plus
  les raccourcis `all` / `none`. En **manuel**, la config remplace le menu ; en **auto**, elle oriente
  l'auto-groom.
- **Override encadré (ADR-0059 amendé)** — overrider une sécurité (sauter la revue adverse) est
  **permis**, mais ce n'est pas un choix comme un autre : **dérogation explicite et journalisée** (le
  cas « mode POC » ci-dessous), jamais un défaut silencieux, jamais pris en auto sans flag (principe
  de la fiche 158). Le plancher tient par défaut ; l'override est un geste conscient.

**Cas phare — sauter la revue adverse en mode POC.** Le réglage le plus demandé. **Décision PO prise
(2026-10-09) : on amende l'ADR-0059** — le plancher tient par défaut, le **mode POC** est une
dérogation explicite. L'amendement lui-même s'écrit **au build** (archi), pour ne pas retirer le
plancher par accident. Fiche recadrée : [158](done/20260830110131158_revue-adverse-skippable-flag.md).

**Premier morceau (POC) de cette fiche** — pré-répondre le **menu de grooming** par config : une
section `grooming.techniques` où **chaque technique est un interrupteur nommé**, plus les raccourcis
`all` / `none`. `ezk-backlog groom` l'applique sans redemander, en manuel (remplace le menu) comme en
auto (oriente l'auto-groom). C'est le plus petit bout qui prouve « la config pré-répond un choix de
la méthode ». Il ne touche **ni aux étapes** (228) **ni à l'override d'un plancher** (158) — ces
deux-là viennent après.

```yaml
grooming:
  techniques:          # « all » ou « none », ou un interrupteur par technique (nom du catalogue)
    archi: true            # avis-architecte
    criterias: false       # criteres-testables
    couper: true           # couper-au-poc
    valeur: false          # valeur-par-labsence
```

À trancher au grooming : la **clé** de chaque technique (alias court `archi`, ou id du catalogue
`avis-architecte` ?) et comment `all` / `none` se composent avec les interrupteurs individuels.

## Critères d'acceptation

POC = pré-répondre le menu de grooming par config (le reste est en Suite).

- [ ] **Respecté en manuel** — avec `grooming.techniques` posé (ex. `archi: true, criterias: false`),
      `ezk-backlog groom <id>` applique les techniques à `true`, saute celles à `false`, et **n'affiche
      pas le menu**.
- [ ] **Respecté en auto** — en auto-groom (run autonome), la même config oriente les techniques
      appliquées.
- [ ] **Raccourcis** — `all` applique toutes les techniques du catalogue ; `none` n'en applique aucune
      (grooming sauté).
- [ ] **Garde anti-silence** — une clé **inconnue** (hors catalogue) est **refusée** avec un message
      clair, jamais ignorée en silence. Sans ce critère, on « configure » une technique mal
      orthographiée qui ne fait rien, et la config ment.
- [ ] **Défaut inchangé** — sans section `grooming.techniques`, le menu interactif s'affiche comme
      aujourd'hui.

## Plan de build du POC (grooming du 2026-11-03, run autonome)

Les deux questions ouvertes sont tranchées par ta préférence du 2026-10-09 : des **noms** lisibles,
les ids stables du catalogue, jamais des numéros ni des alias.

1. **La forme.** `grooming: { techniques: all }`, `{ techniques: none }`, ou une table
   `{ <id du catalogue>: true|false }`. Avec une table, seules les techniques à `true` s'appliquent ;
   les autres sont sautées. `all` et `none` ne se mélangent pas à une table.
2. **La garde anti-silence.** Une clé hors du catalogue (`skills/ezk-backlog/groom-techniques.yml`)
   ou une valeur qui n'est pas un booléen est refusée : le message nomme la clé et liste les ids connus.
3. **La méthode le publie.** Un résolveur pur lit la config contre le catalogue. `ezk config show`
   affiche `grooming.techniques` : `menu` (défaut, rien de posé), `all`, `none`, la liste retenue, ou
   l'erreur. `--json` gagne le champ `groomingTechniques`, ajouté sans changer `schema_version`.
4. **Le skill l'applique.** `ezk-backlog groom`, avant le menu, lit cette ligne : `menu` garde la boucle
   d'aujourd'hui ; `all`, `none` ou une liste s'appliquent sans menu, en manuel comme en auto-groom ;
   une erreur arrête le groom et la nomme.
5. **Tests** : le résolveur, la sortie de `ezk config show`, le contrat régénéré, et le texte du skill.

## Comment vérifier

À rejouer une fois construit :
- Poser `grooming.techniques: { archi: true, criterias: false }` dans `.vectorz/config.yml`, lancer
  `ezk-backlog groom <id>` → `archi` s'applique, `criterias` est sauté, **pas de menu**.
- Mettre `none` → le grooming est sauté ; mettre `all` → toutes les techniques passent.
- Mettre une clé bidon (`foo: true`) → **erreur claire**, pas un silence.
- Retirer la section → le menu interactif revient (défaut inchangé).
- En auto-groom (run autonome), vérifier que la même config est lue.

## Suite (plus tard)

**Hors du POC** (fiches sœurs ou étapes suivantes) :
- configurer / réordonner **toutes les étapes** d'un skill — mécanisme de la fiche
  [Rendre les étapes d'un skill configurables](20260830110131228_schema-etapes-skill-configurables.md) ;
- **overrider un plancher** de sécurité (sauter la revue) —
  [Pouvoir sauter volontairement la revue adverse](done/20260830110131158_revue-adverse-skippable-flag.md) ;
- **forçage + débrayage** de la méthode au démarrage —
  [Garder les sessions dans le cadre de la méthode](20261008182705749_forcer-sessions-dans-la-methode-debrayage-config.md) ;
- le **schéma YAML complet par domaine**, au-delà du seul `grooming:` ;
- le **câblage auto** : comment l'orchestrateur lit la config en run autonome.

Un **éditeur visuel** de cette config : voir et changer les réglages par projet, « pour que ce soit
plus parlant et visible » (PO). À ouvrir en fiche propre quand la config texte existe et a prouvé sa
valeur — pas avant (on ne dessine pas une config qui n'existe pas).

Un **DSL de configuration** qui montre ce qu'on peut ajouter (découvrabilité des réglages) :
« vraiment top » mais **un goody**, pas requis pour démarrer (PO 2026-10-09). Le YAML par domaine
suffit au v1.

## Notes / décisions

- **Compose, ne refait pas** : le modèle « étapes comme donnée » est la fiche
  [228](20260830110131228_schema-etapes-skill-configurables.md) (mécanisme) ; cette fiche-ci est la
  **surface de config** + le pré-remplissage des choix interactifs. Foyer de config = fiche sœur
  [Garder les sessions dans le cadre de la méthode](20261008182705749_forcer-sessions-dans-la-methode-debrayage-config.md)
  (même `.vectorz/config.yml`).
- **Panel `ezk-architect` + `ezk-pm`** : requis pour les gros morceaux en Suite (configuration
  générale des étapes, qui recouvre 228 / Skema / ADR-0040) — **pas pour le POC** (pré-répondre le
  menu de grooming), resserré et sans ce recouvrement.
- **ADR-0059 : amendement DÉCIDÉ (PO 2026-10-09)** — overrider la revue en mode POC est permis
  (dérogation explicite). La fiche [158](done/20260830110131158_revue-adverse-skippable-flag.md) est le
  cas buildable précis : **recadrée et sortie du parking**. L'amendement de l'ADR s'écrit au build.
- Capturée en `idea` sur demande PO (2026-10-09), P2.
- Rapatriée le 2026-11-03 de la branche `claude/ezk-grooming-sessions-dd9b52` (grooming du 2026-10-09, plan v0.11
  périmé) : repassée en idée, à regroomer contre le code d'aujourd'hui.
- Recoupe [le schéma des étapes d'un skill](20260830110131228_schema-etapes-skill-configurables.md) : à fusionner
  ou à départager au groom.
- Prête le 2026-11-03 pour son POC : porte « prête » passée en run autonome (ezk-pm GO). Conditions : les
  critères se prouvent par les tests du résolveur, de `ezk config show` et du texte du skill ; ce qui ne
  se prouve qu'après la fusion (un vrai auto-groom réglé) part en mesure de suivi. Les gros morceaux de
  la Suite restent hors de ce sprint, en attente de panel.
