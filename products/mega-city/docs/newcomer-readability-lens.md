# Lentille « nouveau venu » — le corps de PR relu par un dev qui arrive

**En clair.** Une PR peut cocher toutes les cases de structure et rester incompréhensible pour qui
débarque (cas PR #125 : template-conforme **et** opaque). Cette lentille donne à `ezk-reviewer` un
test simple et reproductible : lire le corps de PR **seul** et essayer de reformuler le besoin en
une phrase. S'il n'y arrive pas, c'est **NO-GO** — et il dit précisément quel passage l'a bloqué.

**Si tu arrives frais.** Un *corps de PR* est le texte de description d'une pull request ; ici il
**rend la fiche** (le document source `features/<id>_*.md`, [ADR-0029](adr/0029-fiche-est-le-document-pr-en-est-le-rendu.md)).
`ezk-reviewer` = l'agent qui juge une PR avant merge. Cette lentille est un des contrôles qu'il applique.

## Quand l'appliquer

Sur tout corps de PR, à l'étape revue (`ezk-sprint` étape 7 → `ezk-reviewer`). Elle **complète** la
garde déterministe `check-pr-body` (structure + placeholders d'onboarding non remplis) par le
jugement **sémantique** qu'un script ne peut pas rendre — l'opacité d'une prose par ailleurs complète.

## Le protocole

1. Lis **uniquement** le corps de PR — diff fermé, aucun autre contexte, comme un dev qui arrive sur
   le projet aujourd'hui.
2. **Reformule le besoin en une phrase.** Tu y arrives sans deviner → **GO** (pour cette lentille).
3. **NO-GO** si l'un de ces blocages t'en empêche — cite le passage exact :
   - un **terme interne / sigle / jargon** porte le sens sans être défini (pas de `## Glossaire`, ou
     terme absent du glossaire) ;
   - la fiche introduit un composant/produit **sans établir son vocabulaire** pour un lecteur neuf
     (ouverture « Si tu arrives frais » manquante ou creuse) ;
   - il faut **ouvrir la fiche, un ADR ou une autre PR** pour comprendre de quoi il s'agit.
4. **Sortie** : `GO` ou `NO-GO` + le(s) passage(s) opaque(s) + la correction attendue (« définis X
   dans `## Glossaire` », « ajoute la ligne “Si tu arrives frais” avec le terme-clé »). Le correctif
   va **dans la fiche**, puis on re-rend le corps (ADR-0029 : sur divergence, la fiche gagne).

## La mesure (retrait de la règle `human-facing-lisibility`)

Sur **3 PR consécutives**, un tiers lisant **seulement** la description reformule le besoin en une
phrase (**3/3**). Tenu → la règle est satisfaite en pratique ; raté → le correctif retourne dans la
fiche. Origine : PR #125 (2026-08-11, corps opaque malgré la règle) ; fiche 0191.

## Glossaire

- `corps de PR` — le texte de description d'une pull request ; ici, le **rendu** de la fiche.
- `fiche` — le document source `features/<id>_*.md`, seule source de vérité (ADR-0029).
- `3/3` — la mesure de retrait : trois PR consécutives où un tiers reformule le besoin d'une phrase.
