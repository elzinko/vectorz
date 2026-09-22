---
id: "20260920213500176"
title: "SPIKE — un sprint d'autorat de skill coûte trop cher (~330k) : quels leviers d'allègement ?"
type: chore
priority: P2
product: mega-city
version:
epic:
labels: [token-economy, revue]
status: idea
ready:
pr:
evidence: none # coût / méthode, pas d'écran
created: 2026-09-20
---

# SPIKE — alléger le coût d'un sprint d'autorat de skill

## En clair

Éditer un simple `SKILL.md` (de la prose, pas du code applicatif) déclenche aujourd'hui **tout
le sprint** — architecte, dev, QA, reviewer, concurrence DoR — et coûte **~300-425k jetons**.
C'est disproportionné pour de la prose. On veut **mesurer** les leviers d'allègement et décider
lesquels valent le coup, **sans casser le filet de qualité**.

## Contexte / Problème

Symptôme daté (run auto-amélioration, 2026-09-12) : chaque sprint de ce run éditait un
`SKILL.md` et a coûté **~330k jetons**, dominé par trois gros postes :

- `ezk-pm` — la **concurrence DoR** : **~85k pour un simple oui/non** (READY / PAS-READY) ;
- `ezk-architect` — ~120k ;
- `ezk-reviewer` — ~120k.

Pour de l'**autorat de prose**, une bonne partie de la boucle ne s'applique pas : pas de BDD,
pas de TDD, pas d'E2E navigateur. On paie une machine de guerre pour éditer un texte.

## Proposition (pistes à mesurer, non figées)

Deux leviers distincts :

1. **Un mode « autorat de skill » léger dans `ezk-sprint`** : pour une fiche de prose,
   l'architecte **produit l'édition**, le reviewer **garde le filet**, on **saute** BDD / TDD /
   E2E qui ne mordent pas sur du texte. C'est un **cas d'usage** du schéma d'étapes
   configurables — voir [20260830110131228](20260830110131228_schema-etapes-skill-configurables.md)
   (le mécanisme) : **s'appuyer dessus, ne pas le refaire**.
2. **Alléger la concurrence DoR** : le verdict READY / PAS-READY de `ezk-pm` doit tenir dans une
   **lecture de fiche bornée** (déjà tentée, encore ~85k). Cibler une **DoR réduite** (~3 champs)
   pour un oui/non, plutôt qu'une session complète.

## Critères d'acceptation (à groomer)

- [ ] Le **coût mesuré** d'un autorat de skill de portée « oui/non » passe **sous 100k** jetons
      bout-en-bout (baseline actuelle ~330k).
- [ ] La concurrence DoR d'un tel autorat tient dans une **DoR réduite** (~3 champs), à un coût
      nettement inférieur aux ~85k actuels.
- [ ] Le **filet de qualité reste** : `ezk-reviewer` garde son verdict ; on ne saute que les
      étapes qui ne s'appliquent pas à de la prose (BDD / TDD / E2E), **jamais la revue**.
- [ ] Le mode s'appuie sur le **schéma d'étapes configurables** (20260830110131228), sans
      réimplémenter une boucle parallèle.

## Comment vérifier

- Rejouer un autorat de skill de portée « oui/non » en **mode léger**, comparer le coût jetons
  bout-en-bout à la baseline ~330k → cible **< 100k**, filet `ezk-reviewer` conservé.

## Notes / anti-doublon

- **S'appuie sur** [20260830110131228](20260830110131228_schema-etapes-skill-configurables.md)
  (schéma d'étapes configurables = le mécanisme) et [0143](0143-aligner-nommage-modes-tokens.md)
  (nommage des modes) — cette fiche est le **besoin mesuré**, pas le mécanisme.
- Voisins « coût disproportionné pour un petit geste » :
  [20260904091853948](20260904091853948_ezk-archive-capacite-allegement.md) et
  [0088](done/0088-ezk-archive-cout-cloture-session-disciplinee.md) (allègement d'`ezk-archive`).
- Origine : rétro auto-amélioration 2026-09-20 (note de carnet N3, run du 2026-09-12).
