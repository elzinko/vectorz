---
id: "20260830114318159"
title: "Créer un skill en passant par une fiche du backlog"
type: feature
priority: P3
product: mega-city
labels: [fabrique]
version: V0.4
epic:
depends: []
status: idea
pr:
created: 2026-08-30
---

## En clair

Aujourd'hui `ezk-ezk` fabrique un **skill directement** (depuis une discussion de session).
L'idée du PO : lui ajouter un **mode** où, au lieu de sortir le skill tout de suite, il **propose
une fiche** de backlog avec les specs et les contraintes déjà dedans. Le skill est ensuite
construit par le flux normal (groom, build, ship). « Bien faire la fiche, c'est déjà tout dire. »
Le mode direct reste le défaut et ne change pas.

## Contexte / Problème

`ezk-ezk create` produit un `SKILL.md` sans passer par une fiche : le skill naît hors du backlog.
Ça saute l'anti-doublon, la revue, la DoR et la trace (la fiche est le document, ADR-0029). Pour un
geste ponctuel c'est pratique. Pour un skill qui va vivre, on veut qu'il **entre par la porte de la
méthode**. Le PO ne veut **pas retirer** le mode direct : c'est une option, pas un remplacement.

## Décisions du groom (les trois points « à trancher »)

- **Nom** : `--via-fiche` (alias `--propose`), et son opposé explicite `--direct`.
- **Défaut** : `direct`. Rien ne change sans l'option (non-régression).
- **Périmètre** : `create` seulement. `harvest` ne génère rien ; il choisit le sujet, que les deux
  modes consomment.
- **Où l'option vit** : un argument de `create` pour ce POC. Une valeur par défaut dans
  `.vectorz/config.yml` demande d'élargir le résolveur de config au-delà de la famille `github` :
  c'est la « Suite ».

## Le flux en mode `--via-fiche`

Les étapes 1 à 4 de `ezk-ezk` restent : récolte, cadrage (`product-brainstorming`), structure
(`engineering:architecture`), validation. Les étapes 5 et 6 (fabrication par `skill-creator`,
rangement par `deploy.sh`) sont **remplacées** par une étape : déléguer à `ezk-backlog add` une
fiche pré-remplie en quatre blocs.

1. **Problème et valeur**, tirés du cadrage.
2. **Specs** : ce que le skill fait, ses formulations de déclenchement, son format de sortie.
3. **Contraintes et garde-fous** : la structure tranchée à l'étape 3 (script ou non, frontière
   LLM / script), ce que le skill ne doit jamais faire.
4. **Source** : la session ou le dépôt d'où vient la matière, avec la date.

`ezk-backlog add` garde ses réflexes : anti-doublon, regroupement, id horodaté, statut `idea`.
La fiche rappelle de construire le skill avec `--direct` (la fiche existe déjà).

## Critères d'acceptation

- [ ] `create --via-fiche` (alias `--propose`) et `create --direct` sont dans le tableau d'usage de
      `ezk-ezk`. Sans option : comportement direct, inchangé.
- [ ] En mode via-fiche, les étapes 1 à 4 restent et les étapes 5-6 sont remplacées par `ezk-backlog
      add`. Aucun `SKILL.md` n'est écrit, `deploy.sh` n'est pas appelé, rien n'est créé hors `features/`.
- [ ] La fiche produite est **tirable** : gabarit à quatre blocs (problème et valeur, specs,
      contraintes et garde-fous, source) plus le rappel `--direct`. Assez de matière pour groomer
      sans redemander.
- [ ] La frontière avec `ezk-chef extract` est écrite : `ezk-ezk` propose un **skill** via fiche,
      `ezk-chef extract` produit une **recette**. Objets différents.
- [ ] Un test de contrat sur le texte du `SKILL.md` (modèle `ezk-scout-contract.test.ts`) échoue si
      l'option, son opposé, la délégation à `ezk-backlog add`, les quatre blocs ou la frontière
      disparaissent. Prouvé par sabotage. `ezk-ezk` garde `composes: [ezk-backlog]` (déjà déclaré).

## Comment vérifier

```bash
pnpm --dir products/mega-city exec vitest run src/__tests__/ezk-ezk-via-fiche-contract.test.ts
```

À la main, dans une session qui a un sujet de skill : `/ezk-ezk create --via-fiche`, valider le
résumé. Une fiche `idea` apparaît dans `features/` (dédoublonnée, quatre blocs) et aucun dossier
`skills/<nom>/` n'est créé. Sans option, le flux direct se déroule comme avant.

## Suite (hors POC)

- Valeur par défaut dans `.vectorz/config.yml` (clé du type `ezk-ezk.create: direct | via-fiche`),
  lue par `ezk:config`.
- `harvest --via-fiche` : proposer plusieurs fiches d'un coup, si le besoin se confirme.
- Faire appeler `--direct` automatiquement par le sprint qui construit le skill (aujourd'hui : une
  consigne écrite dans la fiche).

## Notes

- **Origine** : discussion PO du 2026-08-30 (consolidation « famille recette » et « ezk-ezk devrait
  passer par la méthodologie »). Priorité P3 en front-matter ; arbitrage inchangé.
- **Voisins** : `ezk-ezk` (harvest/create), `ezk-chef extract` (producteur de recettes, fiche
  20260824122629794), `ezk-backlog add` (le délégataire).
