---
id: "20260826072532622"
title: "Valider fiches et carte depuis le tableau de bord (👍/👎 enregistré)"
type: feature
priority: P2
product: mega-city
version: V0.3
epic:
labels: [carte]
status: idea
pr:
created: 2026-08-26
---

# Valider les fiches depuis le tableau de bord (pouce 👍/👎)

## En clair

Le tableau de bord (`pnpm ezk dashboard`) montre les fiches, mais il ne sait rien enregistrer.
Ce lot lui apprend **une seule écriture** : un pouce 👍 ou 👎 par fiche.

Le verdict est un petit fichier versionné, **un par fiche**, rangé dans
`features/reviews/verdicts/`. Deux sessions qui jugent deux fiches créent deux fichiers
différents : elles ne peuvent pas se marcher dessus. Le tableau de bord n'écrit rien d'autre
et ne committe jamais : le commit reste un geste normal du flux.

## Ce qu'on décide (le cadrage de cette première écriture)

1. **Périmètre d'écriture.** Un seul dossier : `features/reviews/verdicts/`. Jamais le
   front-matter d'une fiche, jamais un commit.
2. **Où et comment c'est rangé.** Un fichier par fiche, `<id>.json`, avec deux champs :
   `verdict` (`up` ou `down`) et `date` (`AAAA-MM-JJ`). Retirer un verdict supprime le fichier :
   la fiche redevient « non revue ». On écarte l'idée d'un seul fichier trié (celle de la
   première version de cette fiche) : deux ajouts voisins dans un même fichier se marchent
   dessus au merge. Deux fichiers distincts, jamais.
3. **Garde-fou.** Une seule route d'écriture : `POST /api/verdict`. Le serveur n'écoute déjà
   que sur la boucle locale. Il refuse en plus : un en-tête `Host` qui n'est pas local (anti
   « DNS rebinding »), un `Origin` d'un autre site, un corps qui n'est pas du JSON, un corps
   de plus de 1 Ko, un `id` qui n'est pas celui d'une fiche existante (jamais un chemin saisi),
   un `verdict` hors `up`, `down`, `none`. Un refus ne laisse rien d'écrit.
4. **Lecture.** Le board relit les verdicts à chaque requête, comme le reste de ses données
   (ADR-0055). Trois états visibles : **validée** (avec la date), **rejetée** (avec la date),
   **non revue**. Un filtre « Revue » les sépare.

## Critères d'acceptation

- [x] Chaque carte du board porte un 👍 et un 👎 cliquables (au clavier aussi, état annoncé).
- [x] Au clic, `features/reviews/verdicts/<id>.json` est écrit ; un second clic sur le même
      pouce le retire. Aucune fiche n'est modifiée, aucun commit n'est créé.
- [x] Le verdict survit à un redémarrage : état et date reviennent à l'affichage.
- [x] Les trois états sont visibles sur la carte et filtrables (filtre « Revue »).
- [x] **Fusion sans conflit**, prouvée par un vrai `git merge` : deux branches jugent deux
      fiches différentes, y compris des fiches voisines dans l'ordre des ids → aucun conflit.
- [x] Le garde-fou refuse chaque cas ci-dessus (méthode, `Host`, `Origin`, type, taille, `id`,
      `verdict`) et n'écrit rien. Un fichier de verdict illisible est signalé, pas ignoré.
- [x] Page ouverte sans serveur : les boutons le disent (« lance `pnpm ezk dashboard` ») au
      lieu de faire semblant d'enregistrer.
- [x] ADR court : le tableau de bord passe de « lit seulement » à « écrit un dossier »
      (ADR-0057).
- [x] Gate locale verte (typecheck, tests, lint) et liens markdown OK.

**Preuves.** Tests : `verdicts.test.ts` (format et garde-fou, cas par cas),
`verdict-endpoint.test.ts` (un vrai serveur : écriture, refus, fiches identiques à l'octet près),
`verdicts-merge.test.ts` (un vrai `git merge`, avec un témoin qui montre le conflit d'un fichier
trié unique). À la main, dans un navigateur : clic 👍 et 👎, rechargement, filtre « Revue »,
retrait par re-clic, message sans serveur. Avant/après : voir la PR.

## Comment vérifier

```bash
pnpm ezk dashboard avancement
```

1. Cliquer 👍 sur une fiche et 👎 sur une autre. Deux fichiers apparaissent dans
   `features/reviews/verdicts/`. `git status` ne montre rien d'autre.
2. Arrêter puis relancer : les deux états et leurs dates reviennent. Le filtre « Revue »
   isole chaque état.
3. Recliquer le même pouce : le fichier disparaît, la fiche redevient « non revue ».
4. Les tests rejouent la fusion : deux branches, deux fiches voisines, aucun conflit.
5. `git diff -- features/*.md` est vide : aucune fiche n'a bougé.

## Absorbé (tri du 2026-09-30)

Les trois fiches fusionnées ici sont rangées dans `done/`. Voici ce qui tient dans ce lot.

| Fiche absorbée | Dans ce lot | En « Suite » |
|---|---|---|
| [20260821163346496](done/20260821163346496_carte-unites-de-revue.md) — unité de revue | **Tranché** : un verdict porte sur un *sujet*. Aujourd'hui le sujet est la fiche. Pour la carte méthode, l'unité retenue est la **section compilée** (une source de données et un invariant chacune, ADR-0039), pas le lien : environ 40 décisions, trop fin pour être tenu. | Construire le verdict par section sur la carte. |
| [20260821163346498](done/20260821163346498_carte-etat-de-revue-visible.md) — état « vérifié, quand » | Les trois états sont visibles, avec la **date**. L'état vit dans des fichiers : il survit à toute régénération. | L'état « en cours de revue ». La péremption quand la source change. |
| [20260821163346501](done/20260821163346501_carte-corriger-un-lien-faux.md) — corriger un lien depuis la carte | **Déjà livré** : de la carte on atteint le fichier qui déclare (dossier, puis « Source »), et retirer la déclaration fait disparaître le lien (parité graphe et carte, testée). | Le *geste* depuis la carte. Il écrirait dans des `SKILL.md` ou des YAML : hors du garde-fou « un seul dossier ». Décision d'ADR à part. |

## Suite (hors lot, après usage)

- Verdict par section sur la carte méthode (même route, sujet différent).
- Exploiter le verdict : tirer en priorité les 👍, relancer le grooming des 👎, alerter.
- Qui a voté, et l'historique des changements d'avis.
- Auto-commit du verdict (laissé au flux normal ici).
- État « en cours de revue » et péremption d'un verdict quand la fiche change.
- Nettoyer les verdicts des fiches livrées.

## Notes

- **Neuf** : rien d'équivalent au backlog. Première **écriture** du tableau de bord
  (jusqu'ici lecture seule, `bin/ezk-map.ts`).
- **Choix du PO, 2026-08-26** : verdict versionné et partagé, pas personnel.
- **Voisines** : vues sprints 20260826072532452 et rétros 20260826072532537 (elles lisent,
  celle-ci écrit).
- **Product `mega-city`**. Le dossier `features/reviews/` existait déjà pour les packs de
  revue (`REVIEW.md`, ADR-038) : les verdicts vivent dans son sous-dossier `verdicts/`.
