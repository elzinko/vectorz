# ADR 0057 — Le tableau de bord écrit un seul dossier : les verdicts 👍/👎

**Statut :** Accepté
**Date :** 2026-10-01
**Deciders :** PO (verdict versionné et partagé, 2026-08-26 ; critère « aucun conflit entre sessions ») ; sprint du run V0.1 → V0.4 (le format : un fichier par fiche)
**Fiche :** [`20260826072532622`](../../../../features/done/20260826072532622_revue-fiches-pouce-ezk-map.md)
**Précise :** [ADR-0043](0043-vue-sessions-live-servie-jamais-committee.md) et [ADR-0055](0055-artefacts-generes-hors-versionnage.md) — le tableau de bord passe de « sert des fichiers figés » à « calcule des données », puis à « écrit un dossier ».

## En clair

Le tableau de bord (`pnpm ezk dashboard`) ne faisait que lire. On lui apprend **une seule
écriture** : poser un pouce 👍 ou 👎 sur une fiche. Le verdict est un petit fichier versionné, **un
par fiche**, dans `features/reviews/verdicts/`. Le tableau de bord n'écrit rien d'autre, ne touche
jamais à une fiche et ne committe jamais.

## Contexte

- Le tableau de bord est un serveur local (`bin/ezk-map.ts`, boucle locale seulement). L'ADR-0043 lui
  refusait toute route de calcul : il servait des fichiers. L'ADR-0055 a ouvert **un** écart : il
  calcule le fichier de données d'une page, tant que ce contenu est une fonction pure de fichiers
  committés. Il restait en lecture seule.
- Le PO veut juger les fiches depuis le board et que le verdict soit **partagé** : versionné, vu de
  toutes les sessions. Plusieurs sessions écrivent le même dépôt en parallèle. Le verdict ne doit donc
  pas créer de conflit de merge.
- Ranger le verdict dans le front-matter de la fiche est exclu : deux sessions se marcheraient dessus,
  et le schéma des fiches s'alourdirait (même raison que pour les dates, fiche 20260823121712716).
- La première idée était **un seul fichier trié par id**. Elle ne tient pas : deux ajouts voisins dans
  un même fichier entrent en conflit au merge. Le test `verdicts-merge.test.ts` le rejoue avec un vrai
  `git merge` (le « témoin »).

## Décision

**1. Une seule écriture, un seul dossier.** Le tableau de bord n'écrit que dans
`features/reviews/verdicts/`. Jamais le front-matter d'une fiche. Jamais un commit : le fichier reste
dans l'arbre de travail jusqu'au commit normal du flux. Le dossier `features/reviews/` existait déjà
pour les packs de revue (`REVIEW.md`, ADR-038) ; les verdicts vivent dans son sous-dossier `verdicts/`.

**2. Un fichier par fiche.** `features/reviews/verdicts/<id>.json` contient `verdict` (`up` ou `down`)
et `date` (`AAAA-MM-JJ`). Retirer un verdict supprime le fichier : la fiche redevient « non revue ».
Deux sessions qui jugent deux fiches différentes créent deux fichiers différents : aucun conflit
possible, même pour deux fiches voisines. Un vrai conflit n'existe que si deux sessions jugent la
**même** fiche, et c'est un vrai désaccord.

**3. Une seule route, gardée.** `POST /api/verdict` est la seule route qui écrit. Le serveur
n'écoute que sur la boucle locale ; la route refuse en plus, sans rien écrire :

| Refus | Code | Protège contre |
|---|---|---|
| méthode autre que POST | 405 | un appel inattendu |
| `Host` qui n'est pas local | 403 | le « DNS rebinding » (un site qui pointe vers 127.0.0.1) |
| `Origin` qui n'est pas la page elle-même | 403 | une requête lancée par un autre site, dans ton navigateur |
| corps qui n'est pas du JSON | 415 | un formulaire d'un autre site |
| corps de plus de 1 Ko | 413 | un corps géant (lecture arrêtée en cours de route) |
| `id` qui n'est pas celui d'une fiche existante | 400, 404 | un chemin saisi : le nom du fichier vient d'un id validé, jamais d'un texte libre |
| `verdict` hors `up`, `down`, `none` | 400 | une valeur inventée |

**4. Lecture.** Le board relit les verdicts à chaque requête, comme le reste de ses données
(ADR-0055). Un fichier de verdict illisible (JSON cassé, conflit git non résolu) est **signalé** sur
le board, jamais ignoré en silence.

## Conséquences

- Le tableau de bord n'est plus « sans écriture » : le commentaire du manifeste `ezk` et l'en-tête de
  `bin/ezk-map.ts` le disent. La frontière « un seul dossier » est tenue par des tests : l'écriture
  de bout en bout, chaque refus du garde-fou, et l'octet-à-octet des fiches après un verdict.
- Un verdict de fiche livrée reste dans le dossier. Le board ne montre que les fiches actives ; le
  nettoyage est laissé à plus tard.
- Il reste à **committer** le verdict, comme le reste. Rien ne le fait à ta place.
- Étendre l'écriture à un autre dossier (par exemple corriger un lien depuis la carte, qui écrirait
  dans des `SKILL.md` ou des YAML) **demande un nouvel ADR**. Ce n'est pas un ajout en passant.

## Alternatives écartées

- **Un seul fichier trié, une ligne par fiche** (le choix de la première version de la fiche).
  Démontré fragile : deux ajouts voisins entrent en conflit.
- **Un seul fichier avec le pilote de fusion `merge=union`.** Configuration git invisible, dont
  l'effet n'est pas garanti pour les fusions faites côté GitHub. Il resterait aussi des lignes en
  double pour une même fiche.
- **Le front-matter de la fiche.** Conflits entre sessions, schéma alourdi.
- **Un stockage local au navigateur** (`localStorage`). Le verdict ne serait ni partagé ni versionné.
- **Un auto-commit depuis le serveur.** Surprise en multi-session : un commit que personne n'a demandé.

## Suite

- Verdict par section sur la carte méthode : même route, sujet différent. L'unité de revue retenue
  est la section compilée (ADR-0039), pas le lien.
- Exploiter le verdict, attribuer (qui a voté), garder l'historique : après usage.
- Nettoyer les verdicts des fiches livrées.
