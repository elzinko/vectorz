---
id: "20260813122619707"
title: Robustesse du groupage skill-dir en matérialisation (marqueur SKILL.md ambigu)
type: bug
priority: P3
product: mega-city
epic:
status: idea
ready:
pr:
created: 2026-08-13
---

# 20260813122619707 — Robustesse du groupage skill-dir (marqueur SKILL.md ambigu)

## Contexte / Problème

Depuis **ADR-0027** (PR #138), la matérialisation d'un skill emporte ses assets. Côté
`applyGlobalPlan` (`products/mega-city/src/io/apply.ts`), le plan (plat) est **regroupé
par dossier de skill** en dérivant le dossier du **`dirname` du `SKILL.md`**. Deux
retours **Codex P2** (re-revue #138) montrent que `SKILL.md` est un marqueur **ambigu**
dans deux cas de bord — **théoriques aujourd'hui** (aucun skill du corpus ne les
déclenche), mais avec un mode d'échec **silencieux** pour le second :

1. **Skills imbriqués via id slashé** (`assertSafeId` autorise le `/`). Un plan portant
   à la fois `skills/foo/SKILL.md` et `skills/foo/bar/SKILL.md` : le groupage
   longest-first écrit `foo/bar` d'abord, puis le `removeManagedEntry` du parent `foo`
   fait `rm -rf skills/foo` — ce qui **efface le skill enfant déjà écrit**. Le bind réussit
   en **omettant silencieusement** un skill.
2. **Asset nommé `SKILL.md`** (ex. `templates/example/SKILL.md` dans un skill
   générateur de skills). `readSkillAssets` (`src/loaders/catalog.ts`) l'inclut (seul le
   `SKILL.md` **racine** est exclu) ; puis `isSkillDoc` le prend pour une **racine de
   skill**, le range dans un groupe fantôme, et il est **supprimé** au remplacement du
   vrai parent → asset promis par ADR-0027 **absent en copy-mode, sans erreur**.

Cause racine commune : reconstruire le groupage depuis un **marqueur `SKILL.md`
purement syntaxique** est fragile quand les ids nichent ou qu'un asset s'appelle
`SKILL.md`.

## Proposition

POC d'abord, options à trancher :
- **(A) Porter le groupage dans le plan** plutôt que le reconstruire : le cap connaît le
  `skillDir` exact de chaque fichier ; le transmettre (métadonnée sur le `FileWrite`, ou
  structure de plan groupée) supprime toute ambiguïté. Plus propre, mais touche le contrat
  `WritePlan`/`FileWrite` (ADR).
- **(B) Durcir la reconstruction** : (1) en copy-mode, ne pas `rm` un parent d'une façon
  qui clobbe un groupe enfant (traiter un arbre chevauchant comme une seule unité) ; (2)
  côté loader, gérer explicitement un asset `SKILL.md` imbriqué (le porter sans le prendre
  pour une racine). Plus local, mais garde le marqueur syntaxique.

## Critères d'acceptation

- [ ] Deux skills imbriqués (`foo`, `foo/bar`) : les **deux** sont matérialisés (copy et
      link), aucun n'est effacé par l'autre.
- [ ] Un asset nommé `SKILL.md` (ex. `templates/x/SKILL.md`) est **livré** en copy-mode,
      pas pris pour une racine ni supprimé.
- [ ] Tests couvrant les deux cas ; gate locale verte.

## Notes / décisions

- **Théorique aujourd'hui** : aucun skill n'a d'id slashé ni de `SKILL.md` imbriqué
  (vérifié le 2026-08-13). Capturé pour le jour où un skill **générateur** ajoute un
  template `SKILL.md` (échec silencieux = data-loss difficile à repérer).
- Retours Codex PR #138 : commentaires `3774533483` (imbrication) et `3774533493`
  (asset `SKILL.md`). Suite de **ADR-0027**.
- Voisin de [[0186]] (déploiement/versioning des skills).
