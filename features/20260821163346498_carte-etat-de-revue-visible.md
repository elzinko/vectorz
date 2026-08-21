---
id: "20260821163346498"
title: Montrer sur la carte ce qui est revu, en cours, ou jamais vérifié (+ date)
type: feature
priority: P2
product: mega-city
version:
epic: "20260821163346487"
status: idea
ready:
pr:
created: 2026-08-21
---
# Voir d'un coup d'œil ce qui a été vérifié

## En clair

Une fois qu'on valide la carte morceau par morceau, il faut **le voir**. Sinon on
revalide deux fois la même chose, et on oublie ce qui n'a jamais été regardé.

## Contexte / Problème

Proposition du PO le 2026-08-21 : un code couleur ; une astérisque à côté d'un élément
pour « en cours de revue » ; une petite case verte avec une date pour « validé le … ».

Aujourd'hui la carte n'a aucun état : tout est affiché avec la même autorité, qu'un
humain l'ait vérifié ou non.

## Proposition

À groomer. Trois états au minimum, et une contrainte forte : **l'état doit vivre dans les
fichiers**, pas dans le dessin — sinon il se perd au prochain rendu.

| État | Sens | Piste visuelle |
|---|---|---|
| jamais vérifié | affiché par défaut | neutre, sans marque |
| en cours de revue | quelqu'un s'en occupe | astérisque / contour pointillé |
| validé le AAAA-MM-JJ | un humain a tranché | case verte + date |

Points à trancher au grooming :
- une validation **périme-t-elle** quand le fichier source change ? (probablement oui — sinon
  le vert ment) ;
- où vit la date : dans le fichier de la commande, ou dans un registre à part ?
- la couleur doit rester lisible pour un daltonien : la forme doit porter l'info autant que
  la teinte.

## Critères d'acceptation

- [ ] Les trois états sont **visibles sans légende** pour la marque « validé ».
- [ ] La date de validation est affichée, jamais devinée.
- [ ] Modifier le fichier source d'un élément validé **retire** ou signale la validation.
- [ ] L'information d'état survit à une régénération complète de la carte.

## Comment vérifier

Valider un élément, régénérer la carte, vérifier que la marque est toujours là. Puis
modifier le fichier source et vérifier que la validation ne ment plus.
