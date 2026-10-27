---
id: "20261011113632688"
title: "Spike : outiller/documenter l'ajout d'une règle (fichier + bundle + profil + bind)"
type: chore
priority: P2
product: vectorz
version:
labels: [spike, law, dx]
status: idea
pr:
evidence: none
created: 2026-10-11
milestone: parked
blocked: oversized
---

# 20261011113632688 — Spike : le flux d'ajout d'une règle

## En clair

Ajouter une règle à la loi n'est pas évident : créer le fichier `rules/<cat>/<slug>.md` ne suffit
pas — la loi déployée ne tire que les règles listées dans un **bundle**, lui-même inclus par un
**profil**, puis déployé par `ezk law bind-global`. En session 2026-10-11, une règle « entérinée »
par le seul fichier n'était **pas** dans la loi, et un `bind` est passé avant qu'elle soit câblée.
Ce spike clarifie et outille le flux de bout en bout.

## Contexte / Problème

Rétro [`2026-10-11`](../docs/captures/2026-10-11-retro-outillage-et-autonomie-agent.md), proposition P3.
Le flux réel pour qu'une règle soit **active** :

1. Écrire `rules/<catégorie>/<slug>.md` (front-matter `id/kind/level`).
2. L'ajouter à un **bundle** (`bundles/<id>.yml`, champ `rules:`) — sinon elle est orpheline (aucun profil ne la déploie).
3. S'assurer qu'un **profil** (ex. `global`) tire ce bundle.
4. `ezk law bind-global <profil>` pour la matérialiser dans `~/.claude`.

L'étape 2 a été ratée (règle créée sans bundle), et l'étape 4 faite avant que 2 soit corrigée → règle absente de la loi déployée. `ezk law capture` existe (`capture <cible> <kind> --content`) mais son périmètre exact (écrit-il le fichier ? le bundle ?) n'est pas clair.

## Proposition (investiguer → décider → prouver)

- **Clarifier `ezk law capture`** : que fait-il exactement (fichier seul, ou fichier + bundle + lien de cible) ?
- Selon le constat : **documenter** le flux de bout en bout (un seul endroit), ou **outiller** un
  `ezk law add-rule <id> --level … --bundle … [--target …]` qui écrit le fichier, l'ajoute au bundle,
  pose le lien de cible (`interactions:`/`applies:`), et dit la commande de bind à lancer.
- **Garde-fou** : un contrôle (`graph compile` ou un test) qui **refuse une règle orpheline** (dans `rules/` mais dans aucun bundle) — pour que l'oubli de bundle soit détecté, pas silencieux.

## Critères d'acceptation

- [ ] Le comportement de `ezk law capture` est documenté (fichier ? bundle ? lien ?).
- [ ] Un flux unique (doc ou commande) permet d'ajouter une règle de bout en bout sans oublier le bundle.
- [ ] Une règle orpheline (hors bundle) est **détectée** (test/garde), pas silencieuse.
- [ ] Preuve : la prochaine règle ajoutée par ce flux atterrit dans la loi au **premier** `bind-global`.

## Comment vérifier

```bash
ezk help law capture        # comportement documenté
# ajouter une règle témoin par le flux outillé, puis :
ezk law bind-global global  # la règle témoin est présente dès ce bind
```

## Notes / décisions

- Origine : rétro 2026-10-11, proposition P3. La règle qui a révélé le trou : `agent-ops/verify-access-before-asking` (câblée au bundle `base` après coup).
- 2026-10-27 : raison blocked: passée à `oversized` ; contexte d'origine déplacé de la valeur : parké hors version par auto-groom le 2026-10-17
