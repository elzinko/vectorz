# ADR 0017 — Regroupement en épics : champ front-matter `epic:`, pas de tags libres ni de dossiers

- Statut : **proposé** (re-tampon panel possible, cf. convention panels adverses)
- Date : 2026-07-17

## Contexte

Le besoin de regrouper des stories en épics existe déjà de facto : la fiche racine
vectorz 0034 (« Mise à plat post-pivot ») se déclare « épic » **dans son titre**, et
ses enfants (0038, 0039, 0040…) la référencent **en prose**. Le lien n'est ni
machine-lisible, ni visible dans l'index régénéré, ni vérifiable par le script.

Question posée (2026-07-17) : garde-t-on des fiches qu'on **tague** pour les
regrouper ? L'intuition « tag » est bonne (pas de hiérarchie de dossiers, pas de
déplacement de fichiers) — mais il faut que le regroupement donne à
l'auto-amélioration une direction scrum **exploitable** : « quel est le prochain
enfant ready de l'épic X ? » doit être une question à laquelle la mécanique sait
répondre.

Forces : front-matter = source de vérité unique (ezk-backlog) ; regen déterministe —
le script range, il ne juge pas (ADR-0001) ; précédents maison de champs front-matter
optionnels : `version:` (jalon) et `product:` (fiche 0048) ; le script `regen`
actuel ignore les champs inconnus (ajout non cassant, vérifié le 2026-07-17).

## Décision

1. **Une épic EST une fiche.** `type: epic` est ajouté à l'enum
   (`feature | bug | refactor | chore | epic`). L'épic porte le *pourquoi* commun et
   la carte de ses enfants ; elle se ship quand son objectif est atteint
   (généralement : tous les enfants livrés). Pas d'artefact séparé, pas de dossier.

2. **Le lien enfant → épic est un champ front-matter optionnel `epic: <id>`.** C'est
   l'esprit du tag (une métadonnée, zéro déplacement de fichier) mais en **relation
   canonique unique et vérifiable** : l'id référencé doit exister et être
   `type: epic`. Pas de tags libres (`tags: [...]`) : vocabulaire non borné → dérive,
   aucune intégrité référentielle, et le regroupement scrum n'est pas de
   l'étiquetage — une story appartient à **au plus une** épic.

3. **Rendu : même mécanique conditionnelle que `version:`.** Si au moins une fiche
   porte `epic:`, `regen` affiche le regroupement (colonne ou sections par épic) ;
   sinon rien ne change. Implémentation = fiche 0066 (phase 2 d'ADR-0016 §5) — non
   bloquant : le champ est déjà utile à la lecture des fiches avant le rendu.

4. **Migration au fil de l'eau, pas de big-bang.** Quand 0066 est tirée : 0034
   (backlog racine vectorz) passe `type: epic` ; 0038/0039/0040 prennent
   `epic: 0034`. Les régnérations suivantes rendent le regroupement visible.

5. **Deux niveaux maximum** (épic → story). Pas de sous-épics, pas de
   thèmes/initiatives tant qu'aucun besoin n'est prouvé — l'envie d'en rajouter est
   le signal de s'arrêter (clause ADR-0013 §4).

## Options considérées

### Option A — tags libres (`tags: [pivot, backlog, ...]`)

Rejeté. Un tag classe, il ne structure pas : vocabulaire non borné (dérive garantie
sans curation), pas d'intégrité vérifiable par le script, et aucune réponse mécanique
à « où en est l'épic X ? ». Les tags restent envisageables **plus tard** pour de la
recherche transverse — c'est un autre besoin que le regroupement.

### Option B — champ `epic: <id>` + `type: epic` (retenue)

Relation unique, vérifiable, rendable par regen ; cohérente avec les précédents
`version:`/`product:` ; réversible (retirer le champ suffit).

### Option C — dossiers par épic (`features/0034-pivot/…`)

Rejeté. Casse les ids plats et les liens existants, impose des `git mv` en série
(churn), complexifie `regen` et le layout d'ezk-backlog pour un bénéfice nul par
rapport au champ.

### Option D — vraie hiérarchie d'outil externe (Jira epics, GitHub Projects)

Rejeté — mêmes raisons qu'ADR-0016 option C (invariant backlog-sur-main).

## Conséquences

**Plus facile** — le regroupement devient machine-lisible : `review` (ADR-0016) peut
vérifier la cohérence par épic, l'agent d'auto-amélioration peut planifier « le
prochain enfant ready de l'épic » ; l'existant (0034) est régularisé sans churn.

**Plus dur / à surveiller** — une hiérarchie apparaît : la tenir à deux niveaux ;
vigilance anti-fourre-tout — si les enfants d'une épic ne partagent pas un objectif
**livrable**, c'est un tag déguisé, pas une épic (le `review` doit le signaler).

## Action items

1. [ ] Fiche 0066 : enum `type: epic` + champ `epic:` + contrôle d'intégrité +
   rendu regen conditionnel.
2. [ ] Migration 0034/0038/0039/0040 (backlog racine) au tirage de 0066.
3. [ ] Documenter dans le playbook ezk-backlog (§ add/regen/review).
