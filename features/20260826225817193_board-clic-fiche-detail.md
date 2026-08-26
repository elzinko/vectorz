---
id: "20260826225817193"
title: Board d'avancement — cliquer une fiche ouvre son détail lisible (au lieu du .md brut)
type: feature
priority: P2
product: mega-city
version:
epic: "20260821163346487"
status: todo
ready: 2026-08-27
pr:
created: 2026-08-27
---

## En clair

Sur le board d'avancement (`diagrams/avancement/board.html`), cliquer une fiche ouvre
aujourd'hui son fichier `.md` **brut** (texte non mis en forme) — le PO  l'a signalé le
2026-08-27 : « quand on clique sur une fiche, il n'y a aucun format d'affichage ». Cette
fiche remplace ça par un **panneau de détail dans le board** : métadonnées + corps de la
fiche rendus **lisibles**, avec un lien vers la source pour qui veut le fichier brut.

## Contexte / Problème

Chaque carte du board est un lien `<a href="../../features/<id>_<slug>.md">`. Le serveur
`ezk-map` sert le `.md` en `text/plain` → le clic **quitte le board** et affiche du
markdown non rendu. Le champ `file` (chemin de la fiche) est **déjà** dans les données du
board (`avancement-data.ts` → `BoardFiche.file`), donc tout est là pour faire mieux.

## Proposition

- Clic sur une carte → **ouvre un panneau de détail** dans le board (au lieu de naviguer).
- Le panneau **récupère** le `.md` de la fiche (servi par `ezk-map`) et le **rend lisible** :
  titres, paragraphes, listes, blocs de code — construit en **DOM + `textContent`**, JAMAIS
  `innerHTML` sur du texte de fiche (discipline anti-XSS déjà en vigueur dans le board).
- Le panneau montre les **métadonnées** depuis les données embarquées (id, titre, statut,
  priorité, type, épic, PR) et un lien **« ouvrir le fichier ↗ »** vers la source.
- Fermeture au clic hors panneau, par bouton, et par **Échap**.
- La donnée reste **générée** (bloc `ezk-avancement-data` inchangé) ; on n'ajoute que
  l'interactivité du shell — pas de recompilation au bord (le détail lit la source servie).

## Critères d'acceptation

- [ ] Cliquer une carte de fiche **ouvre un panneau de détail** (au lieu de naviguer vers le `.md` brut).
- [ ] Le panneau affiche les **métadonnées** (id, titre, statut, priorité, type, épic/PR le cas échéant).
- [ ] Le **corps** de la fiche est rendu **lisible** (titres, paragraphes, listes) — pas du texte brut d'un bloc.
- [ ] Le contenu de fiche est posé via **`textContent`/DOM**, jamais `innerHTML` (anti-XSS).
- [ ] Un lien **« ouvrir le fichier »** pointe vers la source `.md`.
- [ ] Fermeture : clic hors panneau **et** touche **Échap** **et** bouton.
- [ ] Le bloc de données `ezk-avancement-data` reste **inchangé** (le test de fidélité du board reste vert).

## Comment vérifier

```bash
pnpm --dir products/mega-city exec tsx bin/ezk-map.ts avancement
# Cliquer une fiche → un panneau s'ouvre avec le détail formaté (pas le .md brut).
# Échap ferme. Le lien « ouvrir le fichier » ouvre la source.
```

## Notes

- Réutilise le **patron du panneau** de la carte LA LOI ([20260821172716537](20260821172716537_carte-ne-montre-pas-la-loi.md)).
- Le champ `file` existe déjà dans `products/mega-city/src/core/avancement-data.ts` (`BoardFiche.file`).
- Feature UI : DoD = scénarios E2E (`board-fiche-detail.feature`) validés au navigateur ; pas de nouvelle logique pure à unit-tester.
