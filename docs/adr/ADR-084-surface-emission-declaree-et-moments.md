# ADR-084 — La surface d'émission déclarée, et le moment « transition de fiche »

**Statut :** **PROPOSÉ** — **panel adverse PASSÉ le 2026-10-25, verdict unanime : revoir-en-profondeur.**
Texte **révisé** en conséquence le même jour. Ne sera gravé (Accepté) qu'après **arbitrage PO** sur les
points listés en fin.
**Déciders :** elzinko (PO).
**Date :** 2026-10-25 (brouillon puis révision post-panel).
**Compose sans le rouvrir :** le contrat de supervisabilité **v0.2** (`cop1/supervisability@0.2`). Les
décisions gelées **D3/D8/D11/D12** sont des précédents d'inspiration, jamais étendues (norme
[ADR-030](ADR-030-contrat-ameliorabilite.md):19-22).
**Rend porteur :** [ADR-032](ADR-032-emission-adaptateur-separable.md) — mais **ne tranche plus** ses
arbitrages ouverts (items 5/8) : le panel a montré qu'ils doivent rester au mini-ADR d'implémentation de
la fiche sidecar, pas ici.

## En clair

Le brouillon proposait deux gestes. **Le panel a montré que les deux étaient faux.**

1. **Déclarer l'émission par une nouvelle arête de graphe** — inutile : le catalogue déclaré existe
   **déjà**, c'est [moments.yml](../../products/mega-city/moments.yml) (ADR-0065). Le graphe, lui, ne sait
   pas valider un lien vers un événement ni un schéma de payload.
2. **Ajouter l'événement `fiche.transition` au contrat de supervision** — dangereux : le validateur ne
   l'ignore pas (il le compte en *notice*, et en *violation dure* pendant un jalon), et garder `@0.2` en
   changeant son contenu, c'est muter une version gelée sur place. De plus, une « transition de fiche »
   est un événement **métier**, pas un moment de supervision.

**Ce qui survit : un seul geste, sûr.** Tamponner la **clé de chantier** à l'ouverture du run. Zéro
changement de contrat — la tuyauterie existe déjà de bout en bout. C'est ce qui rallume les vrais runs du
board. Le reste est **différé**, à décider sur preuve, pas sur papier.

## Ce que le panel a établi (faits vérifiés dans le code)

- Le catalogue de moments **existe déjà** : `products/mega-city/moments.yml` (ADR-0065) est « le contrat
  du bus, lisible par une machine » ; il déclare les six moments de supervision, ce que chacun transporte
  et qui le consomme. Le brouillon l'ignorait et le réinventait → deux sources de vérité.
- Le validateur **ne tolère pas** un type d'événement inconnu : notice à chaque occurrence
  (`reduceState.ts`:91-97) et **violation `state.activity_while_gate_open`** s'il tombe pendant un jalon
  ouvert (`reduceState.ts`:165-172). Le précédent `session.started/finished` prouve qu'un ajout de type a
  coûté **deux** modifications du lecteur (`KNOWN_EVENT_TYPES`:11-21 **et** l'exemption
  `SESSION_LIFECYCLE_TYPES`:23-24), jamais zéro.
- Le graphe **ne peut pas** porter l'arête `emits` telle que décrite : `NodeKind` ne connaît pas
  `event` (`graph.ts`:27), le jeu de verbes est **fermé et figé par un test**, et le payload du contrat
  est `Record<string, unknown>` — **aucun schéma par type** à valider.
- La **clé de chantier** est déjà câblée : `run_start` prend `version`/`milestone` (`mcp-server.ts`:70-71),
  l'émetteur en dérive `chantier` (`runtime.ts`:124-128, posé :311-318), le lecteur le relit
  (`projectChantier.ts`:67-68). « Zéro changement de contrat » est **vrai**.
- Mais le board ne s'allume pas tout seul : l'adaptateur `projectChantiers → BoardRun` **n'existe pas**
  (`boardProvider.ts` laisse `runs: {}`), et `ChantierProjection` n'a **aucun** champ `moments`.

## Décision (révisée)

### G5 — La clé de chantier : GO, zéro contrat, le seul geste à livrer maintenant

Chaque skill possédé **passe `version` + `milestone`** à `run_start`. L'émetteur pose déjà la clé ; le
lecteur la relit déjà. Rien à changer au contrat. Pour que le board **montre** ces runs, il faut aussi
l'**adaptateur manquant** `projectChantiers → BoardRun` — également sans contrat. Honnêteté due : en
mono-session, un chantier n'a qu'une session et une timeline des six événements de supervision ; c'est
**réel mais pauvre** (pas encore de « moments » de fiche). C'est le pas frugal qui prouve la chaîne avant
d'en demander plus.

### G1 — La surface d'émission déclarée : le catalogue EXISTE, on ne crée pas d'arête de graphe

Le besoin (« vérifier, pas raconter, ce qu'un skill émet ») est juste, mais la réponse était fausse. Le
catalogue `moments.yml` **est** la surface déclarée, versionnée, lisible par une machine. Le seul
progrès réel possible, **si** on veut une vérification plus serrée : rendre le champ `transporte:`
**parsable** (aujourd'hui en texte libre) et **relier chaque skill à ses moments** dans ce catalogue
existant. Pas de sixième vocabulaire de graphe, pas de validation de payload contre un schéma inexistant.
**Différé** : à n'ouvrir que si la prose se révèle insuffisante en pratique.

### G4 — Les moments « transition de fiche » : NE PAS les greffer sur la supervision

Le board veut une chronologie des transitions de fiches. Mais une transition de fiche est un événement
**métier** (vocabulaire `ezk-backlog`, absent de BMAD), pas un moment de supervision — et le contrat de
supervision est **gelé**. Trois chemins possibles, aucun tranché ici :

- **(a) Le board lit les transitions là où elles vivent DÉJÀ** — l'historique git des fiches
  `features/*.md` (changements de `status`, passages en `done/`) et les commits. **Zéro contrat touché.**
  C'est le chemin le plus frugal, et il contourne tout le débat.
- **(b) Un contrat de domaine séparé** (précédent `.improvement/` d'ADR-030 : il lit `.supervision/` en
  lecture seule et n'y écrit jamais) avec son propre store de moments métier.
- **(c) Un vrai bump de version** du contrat de supervision (`@0.3`), validateur enseigné (deux
  modifications), outil kit ajouté — le chemin le plus coûteux, et il mêle métier et supervision.

Décision **différée** jusqu'à ce que G5 ait prouvé la chaîne avec de vrais runs. Construire → prouver →
retirer.

## Verdict du panel (consigné)

| Lentille | Verdict | Frappe principale |
|---|---|---|
| Contrat / gel | revoir-en-profondeur | G4 = **NO-GO** (mute `@0.2` sur place ; événement métier sur la supervision) ; G1 vaporware ou réouverture ; **G5 = GO** |
| QA / validation | revoir-en-profondeur | le graphe ne peut pas valider `emits` ni les payloads ; `moments.yml` existe déjà ; `fiche.transition` = violation en fenêtre de jalon |
| PM / portée | revoir-en-profondeur | piège « livré ≠ tourne » : machinerie avant preuve ; chemin frugal = instrumenter UN skill, voir le board, puis décider |

Avis convergent : **G5 à livrer seul**, G1 à refondre autour du catalogue existant, G4 à ne pas graver.

## Non-buts

- Rouvrir ou **muter sur place** le contrat gelé `@0.2` (un ajout observable exige un bump, pas une
  édition silencieuse).
- Greffer un événement **métier** sur le contrat de supervision, ou ajouter un outil de domaine au kit
  « exactement six outils ».
- Inventer dans le graphe une capacité (nœud `event`, schéma de payload) qu'il n'a pas.
- Toute auto-application ; tout faux run (le `runs: {}` honnête reste la valeur par défaut tant que rien
  de réel n'alimente le board).

## Action items (arbitrage PO)

1. [x] **Panel adverse** (3 lentilles) — fait le 2026-10-25, verdict unanime consigné ci-dessus.
2. [ ] **Arbitrage PO — le chemin :** livrer **G5 seul** (clé de chantier + adaptateur board, zéro
       contrat) et **différer** G1/G4 ? (recommandation du panel et de cet ADR révisé.)
3. [ ] **Arbitrage PO — les moments :** parmi (a) lire les transitions depuis git/backlog, (b) contrat de
       domaine séparé, (c) bump `@0.3` — lequel instruire **après** que G5 ait prouvé la chaîne ?
4. [ ] Si G5 retenu : fiche d'implémentation — les skills possédés passent `version`/`milestone` +
       l'adaptateur `projectChantiers → BoardRun`. Aucun changement de contrat.
5. [ ] Mettre à jour `docs/adr/README.md` (registre) au statut Accepté.
