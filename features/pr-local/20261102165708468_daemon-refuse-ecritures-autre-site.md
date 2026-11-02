> 🗎 Rendu de la fiche [features/20261102165708468_daemon-refuse-ecritures-autre-site.md](../done/20261102165708468_daemon-refuse-ecritures-autre-site.md)

## En clair

Le daemon de mission control accepte une demande d'écriture d'où qu'elle vienne. Une page d'un autre
site, ouverte dans ton navigateur, peut donc lui faire abandonner un run ou lever un blocage, sans que
tu le voies. Cette fiche ajoute une seule garde, partagée par toutes les routes. Elle refuse ce qui ne
vient pas de la page de mission control ou du terminal.

## Contexte / Problème

Constaté le 2026-11-02, en lisant le code au grooming du pouce de revue.

- Le daemon écoute sur `127.0.0.1:4343`. Quatre routes écrivent :
  - `POST /api/supervision/runs/abandon` : abandonner un run ;
  - `POST /api/supervision/projects/anchor` : ancrer un projet ;
  - `PATCH /api/rules/proposals/<id>` : changer une proposition de règle ;
  - `POST /api/blocages/<id>/resolve` : lever un blocage.
- Aucune ne vérifie l'en-tête `Origin`, l'en-tête `Host` ni le type du corps. Le corps est lu comme du
  JSON quel que soit son type (`HttpServer.ts`, `BlocageApiHandler.ts`).
- Vérifié en vrai le 2026-11-02, avec un identifiant inventé, donc sans effet :
  - une requête `text/plain` venue de `https://exemple.test` atteint la levée d'un blocage. Le daemon
    répond « Blocage not found » : il a traité la demande ;
  - une requête dont le `Host` est `piege.test:4343` lit `GET /api/board` (200).
- Le mécanisme, en image : écouter seulement en local, c'est fermer la porte d'entrée. Mais ton
  navigateur est déjà à l'intérieur, et il porte les lettres de n'importe quel site.
  - **Première voie.** Un site envoie un POST au type `text/plain`. Le navigateur l'envoie sans
    demander la permission, et le daemon l'exécute.
  - **Deuxième voie.** Un nom de domaine qui pointe vers `127.0.0.1` passe aussi, car le `Host` n'est
    pas vérifié. Cette voie permet aussi de lire les routes de lecture : board, runs, projets.
  - Le `PATCH` est protégé en pratique, car le navigateur demande d'abord la permission et le daemon
    ne la donne pas. Mais c'est le navigateur qui protège, pas le daemon.
- La méthode avait déjà posé ces gardes pour la seule écriture de sa page web, le pouce de revue
  ([ADR-0057](../../products/mega-city/docs/adr/0057-le-tableau-de-bord-ecrit-un-seul-dossier.md),
  `src/core/verdicts.ts`). Mission control ne les a pas reprises.

## Valeur

- Une page piégée ne peut plus agir sur tes runs, tes projets, tes règles ni tes blocages.
- Elle ne peut plus lire non plus le contenu de tes projets par le daemon.
- Les écritures à venir, à commencer par le pouce de revue, héritent de la garde au lieu de la
  réécrire.

## Proposition

Une garde pure, dans cop1, testée cas par cas, appelée par toutes les routes avant tout traitement.

1. **Toutes les routes, lecture comprise** : le `Host` doit être `127.0.0.1` ou `localhost`, sur le
   port du daemon.
2. **Les routes d'écriture** (POST, PATCH, PUT, DELETE) :
   - l'`Origin` est absente (terminal, script) ou égale à celle de la page de mission control ;
   - le corps est de type `application/json` ;
   - la limite de taille actuelle reste.
3. **Un refus** rend un code HTTP (403 ou 415) et n'exécute rien.

**Le daemon doit connaître l'adresse de sa page.** Aujourd'hui, `scripts/cop1-dev.sh` ne lui passe
que son propre port (`--port`). Le proxy de développement transmet l'`Origin` de la page
(`http://localhost:<port web>`). Le lanceur, qui connaît `COP1_WEB_PORT`, donne donc aussi le port de
la page au daemon. Sans cela, la garde bloquerait la page légitime.

La garde de la méthode (`src/core/verdicts.ts`) sert de modèle. Mission control ne l'importe pas :
l'ADR-021 lui interdit d'importer le code de mega-city.

## Critères d'acceptation

- [x] **Un autre site est refusé.** Chacune des quatre routes d'écriture refuse une requête dont
      l'`Origin` est `https://exemple.test`, sans exécuter l'action.
- [x] **Un autre type est refusé.** Une écriture au type `text/plain` est refusée, sans exécuter
      l'action.
- [x] **Un Host étranger est refusé partout.** Une requête dont le `Host` est `piege.test:4343` est
      refusée, y compris sur `GET /api/board`.
- [x] **La page de mission control marche toujours.** Par le proxy de développement, la page lit le
      board et déclenche les quatre actions comme avant.
- [x] **Le terminal marche toujours.** Une écriture sans `Origin`, au type JSON, passe.
- [x] **Une seule garde.** Les quatre routes passent par la même fonction, testée cas par cas.

## Comment vérifier

```bash
pnpm cop1:dev
curl -s -o /dev/null -w '%{http_code}\n' -X POST -H 'Origin: https://exemple.test' \
  -H 'Content-Type: application/json' -d '{"response":"ok"}' http://127.0.0.1:4343/api/blocages/x/resolve
curl -s -o /dev/null -w '%{http_code}\n' -H 'Host: piege.test:4343' http://127.0.0.1:4343/api/board
```

Signal observable : les deux commandes rendent un refus (403). Aujourd'hui, la première rend 404,
signe que la requête a été traitée, et la seconde rend 200.

## Notes

- Trouvée au grooming du pouce de revue :
  [mission control pose le pouce de revue](../done/20261102151630248_mission-control-pose-le-pouce-de-revue.md),
  qui réutilisera cette garde.
- Deux bugs voisins touchent les mêmes routes, sans recouvrir celui-ci :
  [une proposition de règle répond « OK » sans rien faire](../20261102100505955_patch-proposition-regle-ok-sans-effet.md)
  et [un corps invalide répond « introuvable »](../20261102100506119_resolve-blocage-corps-invalide-404.md).
- Priorité P1, fixée par le PO le 2026-11-02 : un trou de sécurité dans du code en service, à
  corriger avant le chantier « un seul écran ».
- Revue adverse du 2026-11-02 (sprint 7 du run autonome) : GO, six critères prouvés par les tests. Deux
  remarques non bloquantes, gardées pour plus tard : une future écriture en GET ou OPTIONS ne passerait
  que le contrôle du Host ; les lectures ne contrôlent pas l'Origin, ce qui reste sûr tant qu'aucune ne
  renvoie un secret.


## Validation

| Modalité | Statut |
|---|---|
| Tests mission control (728) | ✅ |
| Gate de la méthode | N.A. (aucun fichier de la méthode touché) |
| Lint des fichiers touchés | ✅ |
| Essai réel | ✅ autre site 403 · text/plain 415 · Host étranger 403 · terminal traité · page 200 |
| Revue adverse ezk-reviewer | ✅ GO (2 remarques non bloquantes) |
| Before / after (UI) | N.A. — garde côté serveur sans écran |
