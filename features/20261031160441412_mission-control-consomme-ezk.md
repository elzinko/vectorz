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

Mission control affiche des chiffres faux parce qu'il recopie la lecture des fiches au lieu de la
demander à la méthode. Une fois le contrat JSON de la méthode prêt, mission control l'appelle par
`ezk`, comme il appelle déjà `git`, et supprime sa copie. Ses chiffres deviennent ceux de la méthode.

## Contexte / Problème

Le daemon cop1 relit lui-même les fiches (`backlogReader.ts`, `ficheDetail.ts`). Une fixture reproduit
cinq écarts avec la méthode : « en cours » toujours à zéro, des fiches perdues, les bloquées
invisibles, des barres de version faussées, des versions qui disparaissent. Sans daemon, la page
affiche en plus un échantillon fictif (`web/src/board/Board.tsx:140`).

Décision : [ADR-086](../docs/adr/ADR-086-la-methode-seul-lecteur-des-fiches-contrat-json.md), qui
amende l'ADR-021 : cop1 dépend officiellement de la commande `ezk`.
Enquête : [les deux boards](../docs/captures/2026-10-30-enquete-boards/README.md).

## Valeur

Pour le PO qui pilote : mission control dit vrai. Une seule implémentation des règles à maintenir.

## Proposition

À préciser au grooming, dans le cadre des règles de l'ADR-086 :

- le daemon appelle `ezk board show --json` et `ezk backlog show <id> --json` pour chaque projet, sans
  bloquer sa boucle, et sert la dernière réponse connue ;
- `backlogReader.ts` et `ficheDetail.ts` disparaissent ; il reste un cœur d'affichage pur ;
- sans `ezk`, ou avec un format inconnu, la page affiche les runs et un message clair ;
- l'échantillon fictif disparaît du chemin normal ;
- les tests de cop1 lisent les exemples JSON rangés par la méthode, jamais un vrai `ezk`.

Question ouverte à trancher au grooming : comment le daemon trouve `ezk`. Aujourd'hui, c'est un lien
direct `~/.local/bin/ezk` vers le dépôt vectorz du poste. Aucun paquet n'est publié.

## Critères d'acceptation

- [ ] Sur la fixture des cinq causes, mission control affiche exactement les chiffres de la méthode.
- [ ] Le daemon répond pendant un appel `ezk` ; le temps reste sous un seuil mesuré avec tous les
      projets du registre.
- [ ] Sans `ezk` : les runs s'affichent, avec le message « plan indisponible ». Jamais l'échantillon.
- [ ] Avec un JSON d'une autre version de format : le message s'affiche, jamais un écran faux.
- [ ] `backlogReader.ts` et `ficheDetail.ts` sont supprimés ; leurs tests sont remplacés.
- [ ] Capture avant / après sur un projet de démonstration persistant, construit comme la fixture et
      inscrit au registre : « en cours » passe de 0 à 1, la fiche bloquée apparaît.

## Comment vérifier

```bash
cd products/mega-city && pnpm exec tsx ../../docs/captures/2026-10-30-enquete-boards/mesure-ecarts.ts
```

## Notes

- Fiche sœur du milestone `board`, découpée le 2026-10-31 (ADR-086).
- Le contrat est livré (2026-11-01) : schéma, exemple et règles dans
  `products/mega-city/contracts/board-show/`. Les tests de cop1 lisent `v1/example.json`.
- Coût d'un appel, relevé par la revue du contrat : `ezk board show --json` lance un
  `git merge-tree` par branche locale pour trouver les fiches « en cours » (plus de 230 branches sur
  vectorz). Le daemon ne doit donc pas l'appeler à chaque requête : il garde la dernière réponse et
  la rafraîchit à un rythme mesuré. Un cache côté méthode est une piste, hors de ce contrat.
- Dépend de [le contrat JSON de la méthode](done/20261029112813308_contrat-json-methode-board-show.md) et
  de [le détail d'une fiche calculé par la méthode](20261031160441267_detail-fiche-calcule-par-la-methode.md).
