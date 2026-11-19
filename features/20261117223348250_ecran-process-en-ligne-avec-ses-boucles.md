---
id: "20261117223348250"
title: "L'écran Process se lit de gauche à droite, avec ses boucles, et une étape s'ouvre dans un panneau"
type: feature
priority: P1
product: cop1
milestone: board
version:
labels: [theme:mission-control]
status: ready
blocked:
pr:
evidence: before-after
created: 2026-11-17
---

# 20261117223348250 — L'écran Process se lit de gauche à droite, avec ses boucles

**En clair.** Le PO trouve la carte actuelle du process déroutante : c'est un graphe, on s'y perd.
Il veut un diagramme d'activité simple, qui se lit de gauche à droite comme les schémas Scrum
connus : Backlog, puis Sprint, puis Rétro, avec les boucles de retour dessinées. Un clic zoome sur
une phase, un clic sur une étape ouvre son détail dans un panneau à droite.

**Si tu arrives frais.** *Mission control* est l'écran web de pilotage, dans le produit cop1
(`products/cop1/packages/web`). Il n'affiche que ce que la méthode publie par
`ezk process show --json` ([ADR-086](../docs/adr/ADR-086-la-methode-seul-lecteur-des-fiches-contrat-json.md)).
Une *étape* est un pas à l'intérieur d'un skill, par exemple « Gate » dans le sprint.

## Contexte / Problème

Le 17 novembre, le PO a regardé la page Process et la Carte de la méthode. Son retour : « la carte
de la méthode c'est un peu bizarre en graphe ». Il veut voir le **séquencement dans le temps**, de
gauche à droite, puis zoomer sur chaque étape pour voir ce qu'elle mobilise.

Trois maquettes ont été comparées. Le PO a choisi la **maquette B** (boucles imbriquées) avec le
**détail en panneau à droite** :
https://claude.ai/artifact/5VQH4am9Dp66Bp4u4vAzXB

La page Process a aujourd'hui deux parties. En haut, un schéma zoomable du process
(`ProcessMap.tsx`). En dessous, la liste des fiches du projet rangées par étape
(`ProcessView.tsx`). **Seul le schéma change.** La liste des fiches reste telle quelle.

Deux écarts entre la maquette et les données publiées aujourd'hui :

- **Les boucles internes ne sont pas publiées.** `liens[]` ne relie que des skills entre eux
  (backlog → sprint → rétro → backlog). Les boucles « gate rouge → code », « revue NO-GO → code »,
  « story suivante » et « sprint suivant » ne sortent nulle part. La maquette les dessine en dur.
- **L'archive est publiée comme une étape du flux** (lien sprint → archive). Le PO a tranché :
  l'archive est un **outil**, pas une étape du process.

## Proposition

**1. La méthode publie les boucles et l'outil.** On ajoute des champs : rien ne disparaît. Le
contrat reste donc en version 1, selon la règle écrite en tête de `src/core/process-show.ts`.

```yaml
# method/etapes.yml
skills:
  - id: ezk-archive
    outil: true            # nouveau : un outil, hors du flux
boucles:                   # nouveau : des retours entre deux étapes
  - de: ezk-sprint:gate
    vers: ezk-sprint:code
    libelle: Gate rouge, on reprend le code.
```

- Une boucle relie deux étapes, écrites `<skill>:<étape>`. Elle peut traverser deux skills.
  Exemple : sprint suivant, de `ezk-sprint:integration` vers `ezk-backlog:tirer-un-lot`.
- Le lien `ezk-sprint → ezk-archive` est retiré de `liens[]`.
- `validateEtapes` refuse une boucle qui vise une étape inconnue, et un lien qui touche un outil.
- La sortie JSON gagne `skills[].outil` et `boucles[]`. L'exemple du contrat est régénéré.

Les cinq boucles de la maquette :

```
rétro → backlog         liens[] existant : les propositions deviennent des fiches
gate → code             gate rouge
revue-adverse → code    revue NO-GO
integration → cadrage   story suivante du lot
integration → tirer-un-lot   sprint suivant : la boucle autonome tire un nouveau lot
```

**2. L'écran reprend la maquette B.** Une surface à caméra : déplacement et zoom animés, trois
niveaux (vue d'ensemble, phase, étape). Le détail d'une étape s'ouvre dans un panneau à droite.
`ProcessMap.tsx` est remplacé. La bibliothèque React Flow n'est plus utile à cette page ; elle reste
pour la Carte de la méthode.

Le dessin suit les données. Une boucle ajoutée dans `etapes.yml` apparaît à l'écran sans toucher
au code de la page.

## Critères d'acceptation

- [ ] `ezk process show --json` publie `boucles[]` (de, vers, libellé) et marque l'archive
      `outil: true`. Aucun lien ne mène plus à l'archive. Une boucle vers une étape inconnue fait
      échouer la commande, et la gate rougit.
- [ ] De loin, le schéma montre trois phases de gauche à droite, Backlog, Sprint et Rétro, avec
      leurs étapes numérotées. L'archive est dans une boîte à outils, hors du flux. La liste des
      fiches par étape, sous le schéma, ne change pas.
- [ ] Les cinq boucles sont dessinées et nommées. Elles viennent de `liens[]` et `boucles[]` : le
      code de la page n'en écrit aucune.
- [ ] Un clic sur une phase zoome dessus. Un clic sur une étape ouvre le panneau à droite. Le fil
      d'Ariane, la touche Échap et les boutons précédent / suivant permettent de revenir et d'avancer.
- [ ] Le panneau montre les commandes, les agents, les règles du projet et les réglages du projet de
      l'étape. Une rubrique vide le dit (« aucune règle rattachée ») : l'écran n'invente aucun exemple.
- [ ] Sous 700 px de large, le panneau devient un tiroir en bas d'écran. La page ne défile pas à
      l'horizontale.

## Comment vérifier

```bash
pnpm --dir products/mega-city test -- process-show graph-check-contract
ezk --root . process show --json | jq '{boucles, outils: [.skills[] | select(.outil) | .id], liens}'
pnpm --dir products/mega-city board:contract --write && git diff --stat products/mega-city/contracts/
pnpm --dir products/cop1/packages/web test -- ProcessView ProcessMap
pnpm cop1:dev   # puis http://localhost:5273, page Process
```

À l'écran : capture avant (graphe actuel) et après (maquette B). Puis un clic sur « Revue adverse »
qui ouvre le panneau, et Échap qui revient. Rejouer à 375 px de large pour le tiroir.

## Glossaire

- `maquette B` — la variante « boucles imbriquées » de la maquette du 17 novembre : la ligne des
  trois phases, plus les boucles de retour dessinées au-dessus et au-dessous des étapes.
- `boucle` — un retour d'une étape vers une étape antérieure, ou vers le début d'un nouveau cycle.
  Un `lien` relie deux skills ; une `boucle` relie deux étapes.

## Notes / décisions

- Décision PO du 2026-11-17 : maquette B, panneau à droite, archive hors du flux. La version du
  board peut rester en retard sur la dernière maquette de mission control : le PO l'accepte.
- Hors périmètre : la Carte de la méthode reste sur sa page. Le PO l'a dit : « bizarre en graphe.
  mais soit ! ». La question « garder ou retirer l'ancienne carte de la page Cartes » est un autre
  sujet, encore ouvert.
- Les règles du panneau restent vides tant que la fiche
  [Rattacher les règles du projet aux étapes du process](20261117223348335_regles-du-projet-rattachees-aux-etapes.md)
  n'est pas livrée. Cette fiche-ci se livre sans elle.
- Remplace le dessin livré par la fiche
  [Schéma Process zoomable](done/20261110185357446_schema-process-zoomable-semantic-zoom.md)
  (React Flow, zoom à la molette). Code concerné : `ProcessMap.tsx` et `processProjection.ts`
  dans `products/cop1/packages/web/src/board/` ; `ProcessView.tsx` ne change que pour monter le
  nouveau schéma.
- Risque : `graph-check-contract.test.ts` lit les étapes. Retirer le lien vers l'archive peut
  changer le nombre de liens du graphe de la méthode. Le test le dira ; on met à jour le compte
  attendu, pas le test.
- Taille : deux surfaces, la commande publiée et l'écran. Six critères. Elle tient dans un sprint.

### Grooming du 2026-11-19

Mené par l'orchestrateur, à la demande du PO (« groome-la »). Trois passes :

- **Avis d'architecte** : la forme des données. On ajoute deux champs (`outil`, `boucles[]`) et
  on garde le contrat en version 1. Une boucle relie deux étapes, un lien relie deux skills.
- **Critères testables** : le refus d'une boucle invalide entre dans le premier critère, et la liste
  des fiches est protégée. On garde six critères.
- **Périmètre** : la Carte de la méthode est hors sujet ; seul le schéma de la page Process change.

Aucune dépendance externe : tout vit dans le monorepo.
