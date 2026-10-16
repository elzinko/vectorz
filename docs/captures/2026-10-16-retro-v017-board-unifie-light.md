---
type: retro
date: 2026-10-16
theme: "itération v0.17 — board unifié cop1 (10 fiches), rétro légère"
scope: "le run v0.17 en entier : 10 fiches livrées en local, revue adverse par fiche, clôtures de sprint en worktree"
participants: [dev, qualite, produit, po]
actions:
  - proposition: "ezk-sprint close ne doit jamais se bloquer en worktree : borner le helper du compte rendu de sprint (commit-doc-via-worktree.sh) pour qu'il échoue vite au lieu de pendre — le sceau du sprint arrive alors, compte rendu ou pas"
    kind: spike
    by: [dev, qualite]
    status: ✅
    decision: "Fiche créée : features/20261016203544694_sprint-close-ne-bloque-jamais-en-worktree.md (type bug, label spike, P1, status idea)"
    date: 2026-10-16
  - proposition: "verser le cas « clé modeles à deux sens entre fiches sœurs » comme donnée d'entrée de l'audit du découpage déjà tranché, au lieu d'en faire une règle maintenant"
    kind: action
    by: [qualite, produit]
    status: ✅
    decision: "Versé dans la fiche d'audit 20261015213921021 (aligner la carte sur le code), en Notes/décisions. Pas de règle créée."
    date: 2026-10-16
---

**En clair :** la rétro v0.17 est légère et ne sort que deux choses à trancher. Un vrai point dur : la clôture de sprint `close` s'est bloquée en worktree sur tout le run, et j'ai dû sceller à la main. Une observation : deux fiches sœurs ont employé la même clé de config avec deux sens — la revue l'a rattrapé, et ça nourrit l'audit du découpage plutôt qu'une règle de plus.

## 1 · Les faits de départ

- La revue adverse `ezk-reviewer`, passée fiche par fiche, a trouvé **un vrai défaut sur les 10 fiches**. Exemples : une barre de dev qui cachait l'avancement, une modale orpheline à la navigation, du code mort (trois fois), une source de config qui mentait, un `isolation: worktree` perdu au pointeur de bind. Aucun n'était visible à la gate verte seule.
- `ezk-sprint close` s'est **bloqué plus de deux minutes** en worktree, à chaque tentative, sur son helper de compte rendu `commit-doc-via-worktree.sh`. J'ai tué le process et abandonné la cérémonie `close` formelle pour le reste du run. Les fiches passées en `features/done/` et les commits sont restés le seul registre de l'incrément.
- Le garde-fou de suppression du mode auto a **refusé** le `git rm` de l'ancien moniteur (classé « destruction locale irréversible »). Je n'ai pas forcé ; j'ai acté le report dans la fiche concernée.
- Les fiches sœurs **242 / 451 / board**, issues du même design « config des modèles », ont employé la clé `modeles:` avec deux sens différents (tier-par-rôle d'un côté, tier→modèle de l'autre). La revue l'a rattrapé **en cours de build**, pas au grooming.

## 2 · Tour 1 — chaque lentille propose

Rétro **légère** : pas de round-robin multi-agents (économie de jetons, choix assumé). Les lentilles ci-dessous sont les angles que j'ai tenus moi-même sur les faits vécus.

- **Dev / Qualité** — le blocage de `close` en worktree est le seul point qui a coûté du temps et faussé le registre. Le skill prévoit que le compte rendu soit *best-effort* (« un échec laisse le sprint scellé »), mais un **blocage n'est pas un échec** : il ne rend jamais la main, donc le sceau lui-même n'arrive pas. À borner.
- **Qualité** — la revue par fiche a payé 10 fois sur 10. C'est le plancher à garder, pas à changer. La règle « la revue n'est jamais sautée » existe déjà.
- **Produit** — la collision de clé entre fiches sœurs est réelle, mais c'est un cas unique que la revue a attrapé. En faire une règle de plus alourdirait sans preuve de récurrence. Elle a sa place comme **donnée d'entrée de l'audit du découpage** (tension « config vs markdown »), déjà tranché les 15–16/10.

## 3 · Tour 2 — confrontation et convergence

- On **garde** la revue adverse par fiche : confirmée, aucune action à ranger (la règle est déjà là).
- On **retient** le blocage de `close` comme un point dur à instruire. Type **spike** d'abord : on ne sait pas encore si la cause est le worktree jetable créé depuis `main`, un verrou git partagé entre worktrees, ou le helper lui-même. On diagnostique avant de coder le timeout.
- On **écarte** la règle sur le vocabulaire de config entre fiches sœurs. À la place, on **verse le cas** dans l'audit du découpage. Pas de règle neuve.
- Le refus de suppression de l'ancien moniteur est le **comportement attendu** du garde-fou. Rien à changer côté méthode ; c'est un geste PO après le merge de v0.17 (déjà noté comme suite).

## 4 · Le juge de cohérence

Une seule proposition touchait au corps de règles : le vocabulaire de config entre fiches sœurs. Elle est **écartée** avant le juge (on la verse à l'audit, on ne la range pas comme règle). Les deux propositions retenues ne créent aucune règle : un **spike** (diagnostic) et une **action** (verser un cas à un audit existant). Donc **aucune contradiction ni doublon** à arbitrer dans `rules/`. Verdict : rien à ranger dans la loi.

## 5 · Ce qui est proposé au PO

1. **Blocage de `close` en worktree → spike.**
   - Fait vécu : `ezk-sprint close` a pendu > 2 min en worktree, sur tout le run v0.17 ; sceau fait à la main.
   - Proposition : un spike qui trouve *pourquoi* le helper de compte rendu pend en worktree, puis le borne (timeout) pour qu'il **échoue vite** — le sprint se scelle alors, compte rendu ou pas.
   - Mesure : sur les 3 prochaines clôtures en worktree, **0 blocage > 30 s** ; `close` rend un verdict (`SEALED`, au besoin sans compte rendu) à tous les coups.

2. **Collision de clé entre fiches sœurs → donnée d'audit, pas règle.**
   - Fait vécu : `modeles:` a eu deux sens entre 242 et 451 ; rattrapé au build par la revue.
   - Proposition : verser ce cas dans l'audit du découpage (tension « config over markdown ») au lieu de minter une règle.
   - Mesure : le cas apparaît dans le dossier de l'audit ; aucune nouvelle règle créée pour un cas unique.

**Ce qui a marché, on garde (aucune décision à prendre) :** la revue adverse par fiche. 10 défauts réels rattrapés sur 10 fiches.

## 6 · Suivi des décisions de la rétro précédente

La dernière capture rangée est le panel de séquencement version/milestone (16/10), qui a tranché par ADR, pas par une liste d'actions de rétro à suivre. Les captures de run d'avant (v0.11, v0.12) portaient déjà leurs décisions. **Rien d'ouvert à re-vérifier ici.**

## 7 · Décisions du PO

| Proposition | Décision | Date |
|---|---|---|
| Spike : `close` ne doit jamais se bloquer en worktree | ✅ Fiche créée (`20261016203544694`, bug + label spike, P1) | 2026-10-16 |
| Verser la collision de clé `modeles` à l'audit du découpage (pas de règle) | ✅ Versé dans la fiche `20261015213921021` (Notes/décisions) | 2026-10-16 |

## Annexe · Le carnet de rétro (13 notes) — recommandation : ne pas le traiter dans cette rétro légère

Le carnet (`docs/retro-notes/`, notes hors-git incluses) contient **13 notes**, presque toutes des runs **v0.14 à v0.16**. Un bloc entier est **déjà absorbé** par l'audit du découpage tranché les 15–16/10 et par le modèle version/milestone (ADR-0081) :

- gate « version prête à lancer », mode auto en 2 phases, modèle des sorties de rétro, routage des ADR, et l'audit technique du découpage lui-même.

Les traiter ici les **sortirait de leur contexte** (l'audit) et doublonnerait le travail. Recommandation : les instruire dans la session dédiée au découpage / aux versions, pas dans cette rétro v0.17. Je ne déplace aucune note sans ton feu vert (garde-fou PO). Les frictions d'outillage isolées (dry-run de `forge integrate`, `backlog ship` lié au CWD, rayon d'impact qui doit inclure `src/__tests__/`) peuvent être versées comme fiches à ce moment-là.
