---
id: "20260813095351680"
title: bind-global copy non idempotent pour les agents (2e passage refusé)
type: bug
priority: P2
product: mega-city
epic:
status: idea
ready:
pr:
created: 2026-08-13
---

# 20260813095351680 — bind-global copy non idempotent pour les agents

## Contexte / Problème

En mode **copy** (le mode par défaut de `lawgiver bind-global`), `applyGlobalPlan`
refuse de réécrire un fichier agent réel préexistant : `assertReplaceableAgent`
(`products/mega-city/src/io/apply.ts`) lève dès qu'un `agents/<id>.md` existe et
n'est pas un symlink. Conséquence : un **2ᵉ** `bind-global` copy **plante** sur le
premier agent (« vrai fichier non géré par lawgiver »).

Contrairement aux skills — dont le **dossier** géré est détectable (garde élargie
`assertReplaceableSkillDir` / `managedTopNames`, ADR-0027) — un fichier agent **plat**
n'a aucun marqueur « à moi », d'où le refus non-destructif. Découvert pendant la
PR #138 (ADR-0027) : l'e2e du 2ᵉ bind copy s'arrête sur `agents/ezk-architect.md`.

## Proposition

Trancher entre deux options (POC d'abord) :
- **(A) Rendre copy idempotent pour les agents** — savoir reconnaître *notre* fichier
  agent sans clobber un fichier utilisateur : bloc/marqueur managé, ou registre des
  entrées gérées (cohérent avec la garde skills). **Recommandé** si on veut un
  `bind-global` re-jouable de bout en bout.
- **(B) Assumer « copy = snapshot one-shot »** — documenter que la ré-application passe
  par `--link`, et transformer le refus en **message explicite** (pas une stacktrace).

## Critères d'acceptation

- [ ] Un 2ᵉ `bind-global` (copy) ne jette plus sur les agents (option A) **ou** rend un
      message clair « copy = one-shot, utilise --link » (option B).
- [ ] Un **vrai** fichier agent utilisateur préexistant reste protégé (non écrasé).
- [ ] Test dans `apply-global` couvrant le 2ᵉ passage copy sur les agents.
- [ ] Décision journalisée (ADR court ou note dans la fiche).
- [ ] Gate locale verte (typecheck/tests).

## Notes / décisions

- Voisin de la garde skills livrée en **ADR-0027** / **PR #138** (`assertReplaceableSkillDir`,
  `managedTopNames`). Même problème de fond (« distinguer le géré du user »), mais pour un
  **fichier plat** au lieu d'un dossier.
- Recoupe [[0186]] (versioning / déploiement des skills) sur le cycle de vie des artefacts déployés.
