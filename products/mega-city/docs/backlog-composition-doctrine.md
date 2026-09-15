# Composition des fiches — fusionner ou diviser (thème + milestone pour regrouper)

> Doctrine de backlog. Elle guide les gestes de composition (`add`, regroupement, `ship`) :
> **quel geste dans quel cas**. L'outil de rationalisation (fiche 20260812104022240) la
> **consomme** ; il ne la redéfinit pas.
>
> ⚠️ **Réécrite le 2026-09-15 (décision PO, ADR-0017 amendement A16).** La version d'origine
> (fiche shippée 20260825123700998, **trois** gestes dont l'« épic ») est conservée dans
> `git log` et la fiche archivée. **L'épic est retiré.** Le regroupement passe désormais par
> deux axes de métadonnées : **thème** (label) et **milestone** (jalon).

## En clair

Deux fiches se recoupent, ou une fiche grossit trop : il y a **deux gestes**, et **deux seulement**.

- **FUSIONNER** — deux fiches → une (les sujets deviennent des sections).
- **DIVISER** — une grosse fiche → plusieurs fiches **indépendantes**.

Le **regroupement n'est pas un geste** : c'est **deux champs** portés par des fiches qui restent
indépendantes.

- **le thème** (`labels:`) dit *de quoi* parle la fiche — carte, ship, recette… ;
- **le milestone** (jalon) dit *quand* et *dans quel ordre* on la livre.

## D1 — Plus de conteneur « épic » (A16)

Il n'y a **pas** d'objet « épic ». Une famille de fiches qui partagent un but ne se met pas dans un
conteneur : chaque fiche reste **autonome et tirable**, et la famille se lit par **filtre** — même
`labels:` (le thème) et/ou même **milestone** (le bloc).

- **Thème = `labels:` sur une liste BORNÉE**, validée par script (pas de vocabulaire libre : c'est ce
  qui rétablit l'intégrité que l'ADR-0017 réclamait à l'option A).
- **Milestone = un jalon** (champ **`milestone:`** ; `version:` réservé aux releases). Il porte l'**ordre**, le
  **regroupement de blocs**, et un **cumul d'avancement** dérivé.
- Si une famille a besoin d'un **récit** commun, on écrit une **fiche-chapeau ordinaire**
  (`status: idea`, non tirée à la main) — pas un `type:` à part.

## D2 — La règle décidable (deux issues)

**Une seule question au grooming : « Combien de PR pour tout livrer, et sont-elles indissociables ? »**

```
Deux fiches se recoupent, ou une fiche grossit
        │
  « Combien de PR, indissociables ou non ? »
        │
        ├─ 1 PR, indissociable ......... FUSION
        │                                (une fiche ; les sujets deviennent des sections)
        │
        └─ N PR ........................ FICHES INDÉPENDANTES
                                         (on ne fusionne pas ; on les relie par
                                          le même thème `labels:` et/ou le même milestone)

Une fiche empile des sujets livrables séparément → DIVISION, puis on re-pose la question.
```

Le critère est **la PR**, pas le ressenti : une PR indissociable = fusion. Sinon, des voisines
indépendantes, regroupées par thème et séquencées par milestone. Décidable sans hésiter.

## D3 — Le critère de division — **BLOQUANT au grooming** (A16)

**Un test, pas un seuil** : une fiche est trop grosse quand **on peut en livrer une moitié dans une PR
mergeable et utile toute seule**. Si oui, elle est divisible — et **le gate `ready` la refuse tant
qu'elle ne l'est pas** (fini le « tant pis si volumineux » : une fiche divisible n'est pas *ready*).

Signaux (indices, ils ne tranchent pas) : un « et » dans le titre qui joint des sujets sans rapport ;
plusieurs étages d'une refonte dans une même fiche ; beaucoup de critères qui se rangent en groupes
livrables séparément (~5+ est un indice, mais c'est l'**indépendance** qui compte, pas le nombre).

## D4 — Le cumul d'avancement passe au **milestone** (remplace l'épic, A16)

Le board n'affiche plus de cumul « par épic » (A15/D4 d'origine caducs). Il affiche le **cumul par
milestone** : « milestone ② — 6 fiches : 3 shipped · 2 idea · 1 in-progress ». Calculé, **jamais
saisi** (ADR-0001) : le module range, le board affiche. Idem pour le thème si utile (« thème `carte` —
N fiches, k livrées »).

## D5 — Réversibilité (git = substrat)

Chaque geste reste réversible car les relations sont des **champs de front-matter** :

- **Retirer une fiche d'un bloc** : changer son `milestone:` ou son `labels:`. Un champ bouge.
- **Défusionner** : rejouer une **division** (ids horodatés neufs) ; le contenu d'origine reste dans `git log`.
- **Traçabilité de la fusion** (le seul geste « lossy ») : noter l'id de la fiche absorbée dans la survivante.

## Frontière doctrine ↔ outil (à garder nette)

- **Cette doctrine** = *quel geste* dans quel cas (l'arbre D2). Elle se matérialise ici (playbook backlog).
- **[Fiche 20260812104022240](../../../features/done/20260812104022240_backlog-rationalisation-tags-script-llm.md)** = l'**outil** : il applique ces règles **en masse** (clusters sur `labels:`/`depends:`). Il **consomme** cette doctrine, ne la redéfinit pas.

## Migration en cours (A16)

Le retrait de l'épic est **tracé et séquencé** par la **fiche 20260915094256241** (loi d'abord → re-router
les 9 épics en thème+milestone → code en dernier). Tant que la migration n'est pas faite, `type: epic`
existe encore dans quelques fiches ; l'outillage le tolère jusqu'à son retrait planifié.
