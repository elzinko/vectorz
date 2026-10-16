# 0081 — Séquencement du backlog : `depends:` lu comme signal maintenant, basculement milestone/DAG différé

- Statut : **Accepté** (2026-10-16). Ratifié par **panel adverse** (3 lentilles indépendantes : architecte, dev/faisabilité, PO/YAGNI) ; arbitrage PO.
- Date : 2026-10-16
- Capture : [Panel — séquencement version/milestone](../../../../docs/captures/2026-10-16-panel-sequencement-version-milestone.md)
- Fiche : [Séquencer par milestone + dépendances](../../../../features/20261016081021364_sequencer-par-milestone-dependances.md)
- Lié : [ADR-0070](0070-le-tirage-reste-dans-la-version-en-cours.md) (le tirage reste dans la version en cours) · [ADR-0080](0080-checkpoint-de-version.md) (checkpoint de version ; « dépendances = signal, pas graphe ») · ADR-0013 (sur-construction sans preuve d'usage)

## En clair

On voulait savoir s'il fallait remplacer le **train de versions** par un **séquencement par milestone
avec un graphe de dépendances**. Réponse du panel : **le diagnostic est juste, le basculement est
prématuré.** On fait tout de suite le **petit noyau utile** — lire enfin le champ `depends:` et s'en
servir comme **avertissement** (un signal, pas un barrage) — et on **diffère** le gros chantier
(milestone = unité séquencée, vrai graphe, migration) tant qu'un besoin réel n'est pas prouvé.

## Contexte

Le modèle de séquencement mêle plusieurs rôles, et le code le montre déjà.

- **Deux axes d'ordre coexistent sans se parler.** Le tirage ordonne par `version:` (la plus basse
  non taguée, ADR-0070). Le board range par un ordre de milestone **codé en dur**
  (`avancement-data.ts`), qui n'alimente **que** l'affichage. Deux sources de vérité d'ordre.
- **`depends:` est déclaré mais inerte.** Des dizaines de fiches portent le champ ; le type `Fiche`
  ne le charge pas, le séquenceur l'ignore, le rendu l'avoue (« depends non lu »). Un champ qui a
  l'air d'une contrainte et n'en est pas — le pire état.
- **« en cours » est surchargé** : la colonne État de `version list` veut dire *lot incomplet*
  (plusieurs à la fois) ; la règle de tirage veut dire *version active* (une seule).
- **Douleur motivante** : v0.23 est prête mais coincée derrière v0.18–v0.22, sans lien avec elle.

Mais : **zéro arête de dépendance inter-milestone** n'est déclarée aujourd'hui ; les rares `depends:`
non vides pointent des fiches déjà livrées. Et ADR-0080 (10 jours plus tôt, GO unanime) a
**explicitement écarté** le graphe (« dépendances = signal, pas graphe ; fiche dédiée si le besoin se
prouve »).

## Décision

### 1. Maintenant — le noyau vérifié (sans toucher au rôle de version)

- **Lire `depends:`** : l'ajouter au type `Fiche` et au loader.
- **Le vérifier en avertissement, pas en barrage** : un contrôle (`plan check` / `version check`)
  signale une entrée de `PLAN.md` ou un `version:` placé avant une fiche dont une dépendance n'est
  pas livrée ; détection de cycle sur le petit graphe. Contrôle **pur, avant la sélection**, au même
  point qu'`applyVersionScope` — ADR-0070 inchangé.
- **Désambiguïser « en cours »** : deux libellés (lot incomplet vs version active) dans le rendu.
- **Le grain se découpe au grooming** : `board` → `board-fondation` / `board-multisession` (geste de
  grooming, pas de code).
- **Débloquer une version haute sans lien avec le train** par `--all-versions` ou renumérotation
  (déjà câblé).

### 2. Différé — le basculement de modèle

`version` → simple étiquette, `milestone` = unité séquencée, **DAG inter-milestone**, migration du
stock : reste **`idea`**, bloqué derrière quatre verrous nommés par le panel.

1. **Preuve d'usage écrite** : un seuil chiffré fixé d'avance (ex. ≥ N arêtes inter-milestone réelles
   que l'ordre du plan n'exprime pas, ou 2-3 cas datés). Aujourd'hui : 0.
2. **Trou de modèle résolu** : agréger `depends:` par-fiche → par-milestone, et détecter le cycle
   **au niveau agrégé** (un graphe par-fiche acyclique peut boucler au niveau milestone ; l'erreur
   doit nommer la paire de fiches fautive).
3. **Milestone promu en objet** : sinon on lui ajoute un 3ᵉ sens sur une chaîne libre qui porte déjà
   la valeur magique `parked`.
4. **ADR amendés, pas contredits en silence** : ADR-0070 a rejeté les deux axes de séquence (« un
   seul, décision PO ») — « une milestone saute la file » rouvre cette porte → décision PO tracée ;
   ADR-0080 étendu.

### 3. Doctrine

**Dépendances = un signal, pas un graphe** (aligne ADR-0080). On construit → prouve → retire ; on ne
bâtit pas un moteur parce qu'il est élégant (ADR-0013).

## Options considérées

| Option | Verdict |
|---|---|
| **A** — Basculer maintenant (milestone-unité + DAG + migration) | ❌ NO-GO (PO/YAGNI). Sur-construction : 0 arête inter-milestone, soupape déjà câblée, ADR-0080 a déjà différé. |
| **B** — Noyau vérifié maintenant + basculement différé derrière une barre de preuve | ✅ **Retenu**. Lève la dette réelle (depends inerte, « en cours » ambigu) sans rouvrir ADR-0070/0080. |
| **C** — Ne rien faire | ❌ Rejeté. Un `depends:` qui ment et un « en cours » ambigu sont une vraie dette. |

## Conséquences

- ✅ Le champ `depends:` **cesse de mentir** : lu, vérifié, cycle détecté — gain net quel que soit le
  sort du reste.
- ✅ v0.23 (et tout cas analogue) **débloquable aujourd'hui**, sans modèle neuf.
- ✅ ADR-0070 et ADR-0080 **intacts** ; le checkpoint de version est orthogonal, non touché.
- ⚠️ Le gros chantier **attend une preuve** : la fiche reste `idea`, ne consomme pas de build tant que
  le seuil n'est pas atteint.
- ⚠️ Deux axes d'ordre (version-tirage, milestone-board codé en dur) **restent** pour l'instant —
  dette connue, non résolue par cet ADR ; elle le sera si/quand le basculement part.
- 🔁 Réversible : rouvrir le basculement avec le critère chiffré quand il est atteint.
