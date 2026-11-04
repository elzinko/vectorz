---
id: "20261104204526598"
title: Le bilan d'un run dit en une ligne fixe pourquoi il s'arrête
type: feature
priority: P2
product: mega-city
milestone: qualite
version:
labels: [theme:autonomie]
status: idea
pr:
evidence: none # sortie de commande, pas d'écran
created: 2026-11-04
---

# 20261104204526598 — Le bilan d'un run dit en une ligne fixe pourquoi il s'arrête

**En clair.** Le 2026-11-04, le juge de `/goal` a relancé le run plusieurs fois après un arrêt
normal. La raison de l'arrêt n'existait qu'en prose dans le chat, et le juge la lisait à sa façon.
`ezk run report` donne une raison par fiche, pas pour le run entier. Le bilan finit par une ligne
fixe, « Arrêt : … », choisie dans une liste fermée. Un humain ou un juge la lit sans interpréter.

**Si tu arrives frais.** `/goal` est un mode de Claude Code : un juge relance le modèle tant que la
condition donnée n'est pas remplie. `ezk run report` est le bilan de fin d'un run autonome
d'`ezk-product-build` (étape 6 de sa boucle).

## Contexte / Problème

- Le PO a lancé le run du 2026-11-04 par `/goal`, avec trois sorties : plus aucune fiche tirable,
  une des quatre décisions humaines, ou « stop ».
- Le run a atteint la première sortie à 11 h 45. Le juge l'a quand même relancé. Ses critères
  changeaient d'une relance à l'autre : couverture de mission control, puis décisions à lister « en
  toutes lettres ».
- `ezk run report` lit une ligne par fiche : `id|état|PR|gate|revue|validation|raison`. Aucun champ ne
  dit pourquoi le run s'arrête.

## Proposition

- `ezk run report` reçoit `--stop <raison>`, dans une liste fermée :
  - `epuise` : plus aucune fiche tirable ;
  - `stop-humain:<n>` : une des quatre décisions humaines, numérotée comme dans le contrat du run ;
  - `borne` : `--max-sprints` atteint ;
  - `budget` : plafond de jetons atteint ;
  - `blocage` : une gate rouge deux fois de suite, ou un autre stop & ask.
- Le rapport finit par une ligne fixe, `Arrêt : <raison en clair>`. Pour `epuise` et `stop-humain`,
  elle est suivie des fiches ou de la décision en cause.
- Sans `--stop`, le rapport refuse et dit quoi passer : un run qui s'arrête dit pourquoi.
- Le SKILL d'`ezk-product-build` passe `--stop` à l'étape 6.

## Critères d'acceptation

- [ ] `ezk run report --stop epuise …` finit par `Arrêt : plus aucune fiche tirable`, puis les têtes
  bloquées.
- [ ] Une raison hors de la liste est refusée, avec la liste des raisons permises.
- [ ] Sans `--stop`, le rapport refuse et dit quoi passer.
- [ ] `stop-humain:<n>` nomme la décision par son libellé du contrat de run (`run-context.ts`), pas par
  son seul numéro.
- [ ] Le SKILL d'`ezk-product-build`, étape 6, montre `--stop` dans sa commande.

## Comment vérifier

```bash
ezk run report --stop epuise --fiche "<id>|mergée|local (<sha>)|verte|GO|✅|-"
ezk run report --stop inconnu --fiche "<id>|mergée|local (<sha>)|verte|GO|✅|-"; echo "EXIT=$?"
```

- La première commande finit par la ligne `Arrêt : …`. La seconde refuse, avec un code non nul.
- Tests du cœur du rapport (vitest, mega-city).

## Notes

- Origine : bilan du run du 2026-11-04, demandé par le PO après l'arrêt.
- Un run d'un seul sprint n'émet pas de bilan aujourd'hui : il reste hors de ce périmètre.
- Effet attendu pour `/goal` : une condition « jusqu'à ce que le bilan écrive une ligne Arrêt »
  devient vérifiable.
- L'afficher dans mission control demandera que le bilan soit publié en JSON : une fiche à part, si
  le besoin se confirme.
