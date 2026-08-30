---
id: "20260830110131298"
title: Supervision d'ezk elle-même — sortir le contrat d'émission inliné, le brancher en adaptateur séparable (ADR-032/0039)
type: refactor
priority: P3
product: mega-city
version:
epic:
status: idea
ready:
pr:
created: 2026-08-30
---

# 20260830110131298 — Supervision d'ezk : émission séparable, pas inlinée

> ⚠️ **À RÉCONCILIER AU GROOMING (risque de doublon).** Le sujet touche un cluster dense
> déjà largement traité. Confronter — panel `ezk-architect` + `ezk-pm` — avant tout build,
> et décider **fusion** vs **fiche autonome**. Voisins : ADR-032 (« émission adaptateur
> séparable »), ADR-0039 (étage plugin), fiche 0170 (modèle d'extension plugin — **livré**),
> 0154 (kit émetteur — livré), 0049 (article sidecar), 0067 / 0099 (carte / contrat d'émission).

## En clair

Chez nous, une méthode qu'on **ne possède pas** devient supervisable par un **sidecar** qui
**injecte** les consignes d'émission dans ses prises natives — sans réécrire la méthode
(ADR-032). Mais nos **propres** skills, eux, **inline** le contrat d'émission dans leur texte
(~76 lignes dans `ezk-product-build`). L'idée : appliquer à ezk le traitement qu'on applique
aux autres — sortir l'émission du corps des skills et la **brancher** en couche séparable.

## Contexte / Problème

- **La doctrine existe déjà** : ADR-032 pose l'**émission = adaptateur SÉPARABLE**, injecté
  par un sidecar-installateur (guide `docs/brancher-une-methode-existante.md`). ADR-0039 range
  les plugins dans leur étage, et le modèle d'extension plugin est **livré** (0170).
- **L'incohérence** : `ezk-product-build` (et `ezk-sprint`) **inlinent** le contrat d'émission
  dans leur prose. C'est la partie la plus machine-facing du skill (~20 % du fichier), et elle
  contredit l'esprit « séparable / opt-in » d'ADR-032. Ta formulation : *« par défaut la méthode
  n'est pas supervisable ; elle le devient avec le plugin. »*

## Proposition (direction, à cadrer)

Décrocher le bloc d'émission du corps des skills et le porter dans la **couche plugin/sidecar**
(ADR-032/0039), pour que la méthode de base soit **propre par défaut** et gagne la
supervisabilité **en la branchant**. **Rien n'est perdu** : le bloc de 76 lignes est **déplacé**
(vers le plugin / une règle partagée), pas supprimé.

## Critères d'acceptation

- [ ] À définir au grooming — **après réconciliation** avec le cluster ci-dessus (fusion
      possible avec 0067 / 0099, ou rattachement à l'étage plugin d'ADR-0039).

## Notes / décisions

- **Statut `idea`**, marquée à réconcilier : le dédoublonnage a été fait (0049 est un *article*,
  pas l'implémentation ; aucune fiche ne capture « décrocher l'émission inlinée d'ezk »), mais le
  cluster est dense — la placement final revient au panel.
- **Ne bloque pas** la bascule du défaut `--mode auto` : celle-ci laisse la section supervision
  intacte ; ce décrochage est un chantier ultérieur.
- Origine : revue de conception `ezk-product-build` (session 2026-08-30).
