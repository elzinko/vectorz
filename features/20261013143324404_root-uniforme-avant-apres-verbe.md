---
id: "20261013143324404"
title: "Uniformiser --root : accepté avant ET après le verbe sur toutes les commandes projet"
type: refactor
priority: P3
product: mega-city
milestone: parked
version:
labels: [cli, ergonomie]
status: idea
pr:
evidence: none # commandes, pas d'écran
created: 2026-10-13
blocked: oversized
---

# 20261013143324404 — `--root` accepté partout, avant ou après le verbe

**En clair.** Aujourd'hui `--root` ne s'accepte pas pareil selon la commande : `plan-head` et
`docs check-links` ne le lisent qu'**avant** le verbe (`ezk --root X backlog plan-head`), alors que
`board check`, `run context`, `run report`, `backlog aggregate` l'acceptent **avant ou après**. Les
exemples « Comment vérifier » des fiches l'écrivent souvent **après** — donc faux pour les premières.
On veut un seul réflexe : `--root` marche des deux côtés, partout.

**Si tu arrives frais.** Le routeur `ezk` lit `--root` **avant** le verbe ; certains bins le relisent
aussi dans leurs propres arguments (donc après). L'incohérence vient de deux politiques du manifeste :
`fixed+project` (refuse après) vs `root:none+project` (accepte après).

## Contexte / Problème

Vécu au run v0.12 (2026-10-13) en construisant les commandes `--root` hôte. `plan-head`/`plan-lot`/
`docs check-links` (politique `fixed`+`project`) refusent `--root` placé après le verbe : le routeur
ne le voit pas et la commande répond « aucun projet désigné ». Les commandes passées en
`root:none`+`project` (board check, run context/report, aggregate) l'acceptent des deux côtés. Un
utilisateur qui recopie l'exemple d'une fiche (où `--root` est après) tombe sur un refus pour la
moitié des commandes.

## Proposition *(spike)*

Explorer la bonne forme : soit le routeur lit `--root` où qu'il soit (avant OU après le verbe), soit
toutes les commandes projet de lecture passent à une politique qui l'accepte après via le helper
`projectRootOrExit`. Attention au piège « sans `--root` depuis un hôte » : ne jamais lire vectorz en
silence (garde-fou des fiches 242/256). Trancher la politique unique, puis l'appliquer.

## Critères d'acceptation

- [ ] `--root <projet>` fonctionne **avant ET après** le verbe sur toutes les commandes projet de lecture.
- [ ] Sans `--root` depuis un projet hôte, le comportement reste sûr (vise le dossier courant ou refuse en le nommant, jamais vectorz en silence).
- [ ] Un test fige la règle de placement pour toutes les commandes `project`.

## Comment vérifier

```bash
# Depuis un dépôt hôte jetable : pour chaque commande projet de lecture, --root avant puis après
# le verbe doivent viser l'hôte ; sans --root, pas de lecture silencieuse de vectorz.
```

## Notes / décisions

- Origine : rétro du run v0.12 ([capture](../docs/captures/2026-10-13-retro-run-v012.md)), piste P3.
- Lié aux fiches livrées 20261013073300242 (lecture `--root`) et 20261013073300256 (écriture `--root`).
- 2026-10-27 : raison blocked: passée à `oversized` ; contexte d'origine déplacé de la valeur : parké hors version par auto-groom le 2026-10-17
