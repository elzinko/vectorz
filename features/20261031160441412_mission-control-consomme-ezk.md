---
id: "20261031160441412"
title: "Mission control lit le board de la méthode par `ezk` au lieu de le recopier"
type: refactor
priority: P2
product: cop1
milestone: board
version:
depends: ["20261029112813308", "20261031160441267"]
labels: [board, contrat, mission-control]
status: idea
pr:
evidence: before-after
created: 2026-10-31
---

## En clair

Mission control affiche des chiffres faux, parce qu'il relit les fiches avec sa propre copie du code
au lieu de demander à la méthode. La méthode publie déjà ses données en JSON par la commande `ezk`.
Mission control va l'appeler, comme il appelle déjà `git`, puis supprimer sa copie. Ses chiffres
deviennent ceux de la méthode, et il n'affiche plus jamais de chiffres d'exemple.

## Contexte / Problème

Le serveur de mission control relit lui-même les fiches : `backlogReader.ts` (190 lignes) et
`ficheDetail.ts` (148 lignes), dans `products/cop1/packages/app/src/features/board/`. Cette copie a
divergé de la méthode. Mesure rejouée le 2026-11-01 sur les trois projets du registre :

- **muti** : 65 idées au lieu de 66, 19 parkées au lieu de 21, 66 sans version au lieu de 63. Cinq
  fiches perdues, parce que leur en-tête contient un « : » que la copie ne sait pas lire.
- **vectorz** : 24 fiches bloquées que mission control ne montre pas. 16 fiches closes sans
  livraison, comptées quand même dans le total d'une version.
- **samplerz** : 7 fiches bloquées invisibles. 19 fiches dont la version est mal écrite (`V1.1`),
  ignorées en silence.

Sans serveur de données, la page affiche en plus des chiffres d'exemple, avec un bandeau « échantillon
· live indisponible » (`products/cop1/packages/web/src/board/Board.tsx:149`). Le PO l'a vu le
2026-11-01 : le lanceur d'aperçu ne démarrait que la page web.

Décision : [ADR-086](../docs/adr/ADR-086-la-methode-seul-lecteur-des-fiches-contrat-json.md), qui
amende l'ADR-021 : cop1 dépend officiellement de la commande `ezk`.
Enquête : [les deux boards](../docs/captures/2026-10-30-enquete-boards/README.md).

## Valeur

- Le PO pilote sur des chiffres justes, dans l'écran qu'il préfère.
- Une règle changée dans la méthode s'affiche partout, sans recopie : une seule implémentation à
  maintenir.
- C'est le préalable pour que mission control remplace un jour le board de la méthode : sans lui,
  chaque vue rapatriée serait une copie de plus.

## Proposition

Trois décisions, prises au grooming dans le cadre de l'ADR-086 :

1. **Trouver `ezk` comme les autres commandes.** La config de cop1 range déjà ses commandes externes
   en listes, dans `supervision:` (`link_command`, `abandon_command`). On ajoute `ezk_command`, avec
   `["ezk"]` par défaut : la commande trouvée dans le `PATH`. Aujourd'hui, c'est le lien
   `~/.local/bin/ezk` vers le dépôt vectorz.
2. **Ne jamais attendre `ezk` pendant une requête.** Un appel coûte 0,75 à 1,3 seconde par projet. Le
   serveur garde, par projet, la dernière réponse d'`ezk board show --json` et
   d'`ezk backlog show --json`. Une requête répond tout de suite avec ce qu'il a. Si la réponse a plus
   de 30 secondes et qu'aucun rafraîchissement ne tourne, il en lance un en arrière-plan. Au premier
   démarrage, tant que rien n'est arrivé, la page dit « plan en cours de chargement ».
3. **Traduire, ne pas réinterpréter.** Un cœur pur convertit le JSON de la méthode vers la forme que
   la page attend déjà (`funnel`, `versions`, `metrics.done`, `fiches`). Il ne recalcule rien. Seule
   nouveauté côté page : une fiche bloquée porte la mention « bloquée » et sa raison.

Ensuite :

- `backlogReader.ts` et `ficheDetail.ts` disparaissent, avec leurs tests.
- Sans `ezk`, si `ezk` échoue ou si le format n'est pas connu (`schema_version` différent de 1), la
  page affiche les runs et le message « plan indisponible », avec la raison. Les chiffres d'exemple
  sortent du chemin normal.
- Les tests de cop1 lisent les exemples rangés par la méthode, dans
  `products/mega-city/contracts/board-show/v1/` et `products/mega-city/contracts/backlog-show/v1/`.
  Ils ne lancent jamais un vrai `ezk`.

## Critères d'acceptation

- [ ] **Mêmes chiffres.** Pour chaque projet du registre, les idées, prêtes, en cours, parkées, sans
      version, livrées et la version en cours affichées par mission control valent celles
      d'`ezk --root <projet> board show --json`. Un test le prouve sur l'exemple du contrat.
- [ ] **Même détail.** La fenêtre d'une fiche vient d'`ezk backlog show --json`. Une fiche dont
      l'en-tête contient « : » montre son vrai statut. Une fiche bloquée porte « bloquée » et sa raison.
- [ ] **Jamais d'attente.** `/api/board` répond en moins de 100 ms pendant qu'un rafraîchissement
      tourne. Un test le prouve avec un faux `ezk` qui met 2 secondes.
- [ ] **Jamais de faux chiffre.** Sans `ezk`, avec un `ezk` en erreur ou avec un `schema_version`
      inconnu : les runs s'affichent, avec « plan indisponible » et la raison. Les chiffres d'exemple
      n'apparaissent dans aucun de ces cas.
- [ ] **La copie disparaît.** `backlogReader.ts` et `ficheDetail.ts` sont supprimés. Plus aucun fichier
      de `products/cop1/packages/app/src` ne lit l'en-tête d'une fiche.
- [ ] **`ezk` se règle.** `supervision.ezk_command` dans la config de cop1 change la commande appelée ;
      absent, c'est `ezk`. L'exemple de config le documente.

## Comment vérifier

```bash
ezk --root /Users/elzinko/git/bacasable/muti board show --json | jq '.comptes'
pnpm cop1:dev
```

Ouvrir http://localhost:5273 et choisir le projet muti. Signal observable : les compteurs de l'entonnoir
valent ceux du JSON (aujourd'hui 66 idées, 21 parkées, 63 sans version). Le bandeau « échantillon »
n'apparaît plus. Arrêter `ezk` (mettre `ezk_command: ["false"]`) : la page dit « plan indisponible ».

Preuve avant / après : capture de mission control sur muti, avant (65 idées, 19 parkées) et après.

```bash
grep -rn "readBacklogFiches\|readFicheDetails" products/cop1/packages --include="*.ts" --include="*.tsx"
```

Signal observable : la commande ne trouve plus rien. Aujourd'hui, elle trouve les deux lecteurs de
fiches de cop1 et leurs appels.

## Notes

- Fiche sœur du milestone `board`, découpée le 2026-10-31 (ADR-086). Ses deux dépendances sont
  livrées : [le contrat JSON de la méthode](done/20261029112813308_contrat-json-methode-board-show.md)
  et [le détail d'une fiche calculé par la méthode](done/20261031160441267_detail-fiche-calcule-par-la-methode.md).
- **Référence des chiffres : le contrat, pas le script d'enquête.** Le script
  `docs/captures/2026-10-30-enquete-boards/mesure-ecarts.ts` compte « livrées » = les fichiers de
  `done/` (404 sur vectorz). Le contrat sépare `livrees` (326) et `closes` (79). Mission control
  doit afficher le contrat.
- **Mesures du 2026-11-01**, `ezk` du dépôt vectorz, une fois chaque appel :

  | Projet | `board show --json` | `backlog show --json` | Taille du détail |
  |---|---|---|---|
  | vectorz | 0,87 s | 0,82 s | 247 Ko |
  | samplerz | 0,80 s | 0,75 s | 106 Ko |
  | muti | 1,32 s | 1,24 s | 246 Ko |

  Un tour complet des trois projets prend environ 6 secondes, d'où le cache et le rafraîchissement en
  arrière-plan. Le coût vient en partie d'un `git merge-tree` par branche locale. Aujourd'hui il y a 3
  à 12 branches par projet ; il y en avait plus de 230 sur vectorz fin octobre.
- Dépendance samplerz (`/Users/elzinko/git/samplerz`) — accès constaté le 2026-11-01.
- Dépendance muti (`/Users/elzinko/git/bacasable/muti`) — accès constaté le 2026-11-01.
- Dépendance `ezk` (`~/.local/bin/ezk`, lien vers le dépôt vectorz) — accès constaté le 2026-11-01.
- **Taille.** Six critères, deux surfaces : le serveur de cop1 et la page. La fiche reste entière : la
  page ne change que pour le message « plan indisponible » et la mention « bloquée ».
- **Hors de cette fiche.** Rapatrier les cartes de la méthode dans mission control. Décider si le
  board de la méthode disparaît : c'est un amendement de l'ADR-086, à trancher par le PO.
- Grooming du 2026-11-01 : techniques appliquées par l'agent, sans menu, sur demande du PO
  (« prépare-la »). Constater les dépendances, Rendre chaque critère testable, Couper au plus petit
  morceau utile (taille vérifiée). L'avis d'architecture (commande réglable, cache) est rendu par
  l'agent, sans sous-agent, en suivant l'ADR-086 et la convention `*_command` de la config de cop1.
