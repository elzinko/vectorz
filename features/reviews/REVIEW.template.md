---
schema: method-review@0.1
fiche: "<id>"
branch: "<feat/id-slug>"
product: "<mega-city|...>"
method:
  name: "<ezk-sprint|...>"
  version: "<x.y.z>"
status: ready-for-review
created: "<AAAA-MM-JJ>"
# run_id: "<run-id du kit de supervision, si un run est ouvert>"
# pr: "<url PR — projection, jamais SoT>"
---

# Review — <id>

> Ce fichier est le **manifeste de review** de cette branche feature — la
> **source de vérité** (contrat `method-review@0.1`, ADR-038). Il n'est PAS
> généré à la main : `pnpm --dir products/mega-city review:emit ...` (ou le
> builder `ReviewSource` d'un sprint) produit ce contenu depuis un
> `ReviewPack`. Ce fichier sert de gabarit de référence si tu écris un pack
> sans passer par le CLI.
>
> Agrégation **par référence, jamais par copie** : chaque section pointe vers
> sa source (fichier, commande, dossier) — elle ne recopie aucun rapport. Une
> section dont la source n'existe pas encore affiche « N.A. ».

## Résumé

<Ce qui a été fait / pourquoi — 3 à 6 lignes.>

## Rendus

- <lien vers `assets/*` — capture avant/après, gif démo>
- <URL de preview, ou commande de démo>

## Matrice de validation

<Voir `docs/PR_VALIDATION.md` — CI / tests unitaires / E2E / before-after /
preview, chacun `✅ fait` / `⏳ reste` / `N.A.` avec raison.>

## À tester

<Checklist rejouable — compose `features/checks/` (0178) si présent, sinon
cite la convention de `docs/PR_VALIDATION.md`.>

## Qualité

<Métriques **lues** depuis `.quality/` (0052/0058) — jamais réécrites ici.
« N.A. » si aucune mesure n'a encore été produite.>

## Provisioning / preview

<Commandes littérales, depuis un clone frais, pour rejouer la démo en local.>

## Trouvailles

<Bug / trou découvert pendant le sprint → `ezk-backlog add` proposé (fiche
0169). « N.A. » si aucune trouvaille.>
