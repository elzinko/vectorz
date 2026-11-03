---
id: "20261102182259680"
title: "Faire expirer une preuve du carnet quand le code de la fonctionnalité change"
type: feature
priority: P2
product: mega-city
milestone: exploration-app
depends: ["20261102182259592"]
labels: [test-local, exploration-app]
status: idea
blocked: deferred
pr:
evidence: none # commande sans écran ; la preuve, ce sont ses tests
created: 2026-11-02
split_from: "20261014113049954"
---

# 20261102182259680 — Faire expirer une preuve du carnet quand le code de la fonctionnalité change

**En clair.** Au départ, une preuve du carnet n'expire qu'avec le temps. Si la mesure sur mission
control montre des preuves « valides » alors que le code a changé, on ajoute ce second déclencheur.
Chaque fonctionnalité déclare la liste de ses fichiers, CSS et serveur compris. Une preuve expire dès
qu'un de ces fichiers change.

**Si tu arrives frais.** Le carnet note ce qui est testé, avec une preuve datée :
[20261102182259416](done/20261102182259416_carnet-de-tests-arbre-declare-expiration-date.md). **Cette fiche
est différée** : elle ne se construit que si la mesure de
[20261102182259592](done/20261102182259592_carnet-mission-control-premiere-app-mesure.md) la justifie.

## Contexte / Problème

Une preuve par date seule peut rester « valide » alors qu'on vient de casser la fonctionnalité. Le
panel du 2026-11-02 a écarté la solution « suivre les imports ». Elle fait expirer presque tout,
parce qu'un fichier comme `types.ts` est importé partout. Elle laisse aussi passer de faux « valide »,
parce que l'écran et son serveur ne sont reliés par aucun import. Détail dans
[Carte de l'app et suivi de ce qui est testé](done/20261014113049954_cache-cartographie-app.md).

## Proposition

- **Chaque nœud déclare ses fichiers**, par motifs : le code de l'écran, son CSS, la partie du serveur
  qui le nourrit.
- **L'expiration se calcule sur l'historique git seul.** Une preuve expire si un fichier déclaré a
  changé entre le commit de la preuve et le commit courant. C'est une fonction pure de fichiers
  committés : elle ne dépend pas du poste.
- **Le motif d'expiration s'affiche** : « par date », ou « fichier modifié » avec le chemin.
- **Un nœud sans motifs** garde l'expiration par date seule.

## Critères d'acceptation

- [ ] Chaque nœud de l'arbre peut déclarer la liste de ses fichiers, par motifs.
- [ ] Une preuve passe « expirée » dès qu'un fichier déclaré a changé entre le commit de la preuve et
      le commit courant, d'après l'historique git seul.
- [ ] La sortie dit pourquoi une preuve a expiré : « par date », ou « fichier modifié » avec le
      chemin.
- [ ] Un nœud sans motifs déclarés garde l'expiration par date seule, sans erreur.
- [ ] Le tout est testé sur une fixture de plusieurs fichiers, dont un CSS, et la gate locale est
      verte.

## Comment vérifier

1. Sur une fixture, déclarer pour un nœud les motifs de ses fichiers, CSS compris.
2. Enregistrer une preuve valide, puis committer une modification du CSS.
3. `ezk carto status` montre le nœud « expiré — fichier modifié : <chemin du CSS> ».

```bash
pnpm --dir products/mega-city test
```

## Notes / décisions

- **Née du découpage** de
  [Carte de l'app et suivi de ce qui est testé](done/20261014113049954_cache-cartographie-app.md), le
  2026-11-02. Différée par décision du PO, derrière la mesure de valeur.
- **Pistes différées encore plus loin**, à n'ouvrir que sur mesure : proposer les motifs depuis la
  carte de dépendances d'esbuild (son `metafile`) ; contrôler la dérive de l'arbre pour d'autres
  stacks ; écrire les sondes d'interface en scripts Playwright rejouables.
- **Estimation du panel** : environ 100 000 à 150 000 jetons.
- **Toujours différée le 2026-11-03** (run autonome) : la mesure qui doit la justifier porte sur trois
  passes du scout sur mission control. Une seule est faite (0 puis 19 sur 70, aucune preuve encore
  périmée par le code). Marquée `blocked: deferred` pour que le tri du run ne la reprenne pas avant
  la troisième passe et la décision du PO.
