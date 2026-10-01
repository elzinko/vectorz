# ADR 0055 — Une vue générée que personne ne lit sur GitHub n'est plus committée

**Statut :** Accepté
**Date :** 2026-10-01
**Deciders :** PO (consigne du run V0.1 → V0.4)
**Fiche :** [`20260830194601376`](../../../../features/20260830194601376_spike-degiter-vues-outillage.md)
**Précise :** [ADR-0049](0049-ship-fiche-dans-la-pr-vues-post-merge.md) — la liste « toutes les vues dérivées » du ship raccourcit.

## En clair

Deux sessions qui régénèrent la même vue générée entrent en conflit dans git. Ce conflit est du
bruit pur : la vérité est dans les fiches, le fichier généré n'apprend rien. On tranche. Une vue
reste dans git **seulement si on la lit sur GitHub**. Les autres se construisent quand on en a
besoin. Concrètement, `PORTFOLIO.md` et les données des pages board, pilotage et runs sortent de
git. `BACKLOG.md` et `PLAN.md` restent.

## Contexte

- Vécu : la PR #196 est passée `CONFLICTING` sur `board.html`. Pendant le run V0.1 → V0.4, chaque
  PR qui régénérait `board.html`, `pilotage.html`, `PORTFOLIO.md` ou `BACKLOG.md` entrait en
  conflit avec sa voisine.
- Précédents : `.ezk/graph.compiled.json` est déjà dégité et reconstruit à la demande ;
  [ADR-0043](0043-vue-sessions-live-servie-jamais-committee.md) sert déjà une vue « en direct,
  jamais committée ». La différence : l'état des sessions est propre à la machine, donc il a son
  propre serveur. Les données du board sont une **fonction pure de fichiers committés** (les mêmes
  sur toutes les machines) : `ezk:map` peut les calculer sans changer de métier.
- **Écart assumé avec l'ADR-0043.** Celui-ci refuse d'ajouter une route de calcul à `ezk:map`,
  parce que `ezk:map` « sert des fichiers figés ». Le présent ADR s'en écarte sur un seul point :
  `ezk:map` calcule aussi le fichier de données d'une page committée, tant que son contenu est une
  fonction pure de fichiers committés. L'état des sessions reste, lui, hors d'`ezk:map`.
- Une page HTML de `diagrams/` est **hybride**. Elle est écrite à moitié à la main (la **coque** :
  mise en page, script de rendu) et générée à moitié (le **bloc de données**, entre marqueurs).
  On ne peut pas dégiter la page entière sans perdre la coque.

## Décision

**1. La règle.** Une vue générée reste committée si, et seulement si, elle se lit sur GitHub.
Sinon elle n'est dans aucun commit et se construit à la demande.

**2. Le verdict, vue par vue.**

| Vue | Lue où | Verdict |
|---|---|---|
| `features/BACKLOG.md` | GitHub | committée |
| `features/PLAN.md` (curé à la main) | GitHub | committée |
| bloc `composes` de `skills/README.md` | GitHub (bloc dans un README écrit à la main) | committé |
| `PORTFOLIO.md` | en local | **non committée** |
| données de `board.html`, `pilotage.html`, `runs.html` | `ezk:map` | **non committées** |
| données de `carte-interactive.html` | `ezk:map`, lien du README | committées pour l'instant (voir Suite) |

**3. Coque et données se séparent.** La coque reste committée dans la page HTML. Les données
sortent dans un fichier voisin (`board.data.js`, `pilotage.data.js`, `runs.data.js`), ignoré par
git, que la page charge par `<script src>`. Les liens vers la page ne cassent pas. La page ne
change que si l'interface change.

**4. Qui construit.** `pnpm ezk:map` calcule ces fichiers à **chaque requête** : ils ne sont jamais
périmés, même absents du disque. `pnpm --dir products/mega-city views:regen` les écrit sur disque
(lecture hors serveur) et régénère `PORTFOLIO.md`. Les anciennes commandes `*:regen` en sont des
alias.

**5. La frontière est tenue par un test**, pas par la mémoire de quelqu'un. `untracked-views.test.ts`
échoue si un de ces fichiers redevient suivi par git, ou si une coque ré-embarque des données.

## Conséquences

- Fin des conflits sur ces vues. Le ship n'a plus à les régénérer : il reste `BACKLOG.md`
  (régénéré) et `PLAN.md` (curé), ce qui allège ADR-0049 §1 et §2.
- Le test « le bloc committé égale le bloc régénéré » disparaît : sans copie committée, la vue ne
  peut pas être périmée. Il est remplacé par des tests de **fidélité par construction** (le
  constructeur dit vrai sur le dépôt réel).
- Un clone neuf n'a pas ces fichiers. Un `pnpm ezk:map` (ou `views:regen`) les fait apparaître.
  Une coque ouverte seule affiche un board vide, sans erreur.
- GitHub n'affiche plus `PORTFOLIO.md` à la racine. C'est assumé : c'est une vue d'outillage.
- Une PR en vol qui avait régénéré ces vues entre en conflit **une seule fois**, au premier merge
  de `main`. On prend la coque de `main` et on supprime la donnée.

## Alternatives écartées

- **Garder committé et ajouter un pilote de fusion git.** Configuration locale invisible, et la
  copie committée n'apporte rien.
- **Dégiter la page HTML entière.** On perd la coque écrite à la main. Il faudrait un gabarit
  séparé, et des liens vers un fichier absent d'un clone neuf.
- **Générer en CI et committer par un bot.** Plus de pièces, et des commits parasites.

## Suite

- `carte-interactive.html` (vue du **catalogue**) reste committée dans ce lot. Le README la lie, et
  elle ne bouge que si le catalogue bouge. Même schéma si un conflit réel y apparaît.
- `views:check` et le ship transactionnel : fiche
  [`20260830194601233`](../../../../features/20260830194601233_ship-transactionnel-liens-vues.md).
- Mesurer le critère « 0 conflit sur une vue générée par mois » en novembre 2026.
