# ADR 0017 — Regroupement en épics : champ front-matter `epic:`, pas de tags libres ni de dossiers

- Statut : **accepté** — panel adverse du 2026-07-17 (cf. ADR-0016 § Panel adverse) ; amendements A2, A7, A8, A12, A13 intégrés
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
   la carte de ses enfants. **Elle n'est jamais tirable** (A2) : elle sort du flux
   actionnable — `regen` la présente dans une **section à part** (comme les `idea`),
   le gate DoR ne s'applique pas à elle, et le tirage (`next --ready-only`,
   ADR-0016 §3) descend sur son prochain enfant ready, sinon passe à la fiche
   suivante. **Son statut est curé à la main, non dérivé des enfants** (A8 — dériver
   serait de l'outillage prématuré, clause ADR-0013) ; en contrepartie `review`
   signale les incohérences : épic `shipped` avec enfants actifs, épic en `todo`
   dont tous les enfants sont livrés.

2. **Le lien enfant → épic est un champ front-matter optionnel `epic: <id>`.** C'est
   l'esprit du tag (une métadonnée, zéro déplacement de fichier) mais en **relation
   canonique unique et vérifiable** : l'id référencé doit exister et être
   `type: epic`. Pas de tags libres (`tags: [...]`) : vocabulaire non borné → dérive,
   aucune intégrité référentielle, et le regroupement scrum n'est pas de
   l'étiquetage — une story appartient à **au plus une** épic (garanti par le champ
   scalaire). **L'intégrité est contrôlée par le script, en plus du jugement LLM**
   (A7) : `regen` émet un warning non bloquant sur référence pendante ou pointant
   une fiche non-`type: epic`.

3. **Rendu : colonne conditionnelle — tranché (A12).** Correction sur pièce (panel) :
   la « colonne conditionnelle `Version` » décrite dans le SKILL.md d'ezk-backlog
   n'existe **pas encore** dans `regen-backlog.sh` (`extract()` ne lit ni `version:`
   ni aucune colonne conditionnelle) — ce n'était pas un précédent mais une mécanique
   à implémenter. La fiche 0066 implémente donc **les deux colonnes** (`Version` +
   `Épic`) du même coup. Les **sections par épic** sont différées sur preuve d'usage
   (elles posent l'ordre des épics dans le tri, les orphelins, l'épic dans `done/`,
   l'interaction avec la section Idées). Non bloquant : le champ est déjà utile en
   lecture de fiche avant tout rendu.

4. **Migration au fil de l'eau — et complète (A13).** Quand 0066 est tirée : 0034
   (backlog racine vectorz) passe `type: epic` ; ses filles **actives** (0038, 0039,
   0040) **et livrées** (0035, 0036, 0037, dans `done/`) prennent `epic: 0034` —
   sinon « où en est l'épic 0034 ? » est faux dès le premier jour. 0066 **paramètre**
   aussi `regen-backlog.sh` (chemin racine + titre d'index) au lieu de l'ancrage dur
   mega-city — l'index racine avoue déjà être généré par une version « adaptée ». Le
   playbook ezk-backlog fixe la règle de résolution multi-backlog : **le backlog le
   plus proche du cwd ; demander si ambigu.**

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
prochain enfant ready de l'épic » via `next --ready-only` ; l'existant (0034) est
régularisé sans churn ; les épics sortent du flux de tirage — plus de « poison
pill » en tête de backlog.

**Plus dur / à surveiller** — une hiérarchie apparaît : la tenir à deux niveaux ; le
statut d'épic est manuel → sa cohérence dépend du contrôle `review` ; vigilance
anti-fourre-tout — si les enfants d'une épic ne partagent pas un objectif
**livrable**, c'est un tag déguisé, pas une épic (le `review` doit le signaler).

## Action items

1. [ ] Fiche 0066 : enum `type: epic` + champ `epic:` + warning d'intégrité dans
   regen + colonnes conditionnelles `Version`/`Épic` + paramétrage chemin/titre du
   script.
2. [ ] Migration 0034 + filles actives **et livrées** (0035→0040, backlog racine) au
   tirage de 0066.
3. [ ] Playbook ezk-backlog : §add/next/regen/review + règle de résolution
   multi-backlog (le plus proche du cwd, demander si ambigu).
