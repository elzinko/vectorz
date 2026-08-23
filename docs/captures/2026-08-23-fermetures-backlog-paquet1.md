# Fermetures backlog — paquet 1 (2026-08-23)

**En clair.** Première passe du nettoyage du backlog (lot 4a du plan « trois étages »).
Dix fiches fermées sur décision PO (« ferme tout », 2026-08-23), après proposition
motivée. Fermer = **supprimer le fichier avec trace** (précédent maison : doublons
0192-0194, tombstone 0064) — l'historique git conserve tout, et ce registre porte les
motifs. Ce qui méritait de survivre a été **absorbé** dans une fiche vivante.

Inventaire source : exploration du 2026-08-23 (131 fiches actives passées au crible).

| Fiche fermée | Motif | Absorbé par |
|---|---|---|
| `0187-article-llm-skills-migration` | doublon exact de 0175 (article Skema) | note dans `0175` |
| `0150-ezk-dev-methode-tdd-en-rules` | le rename ezk-tdd→ezk-dev est fait (done/0135) ; les mentions restantes sont historiques (« ex-ezk-tdd ») | — |
| `0136-ezk-reviewer` | l'agent `ezk-reviewer` existe (agents/ezk-reviewer.md) ; la fiche affirmait le contraire | — |
| `0068-regle-method-map-a-jour` | l'enforcement bloquant a été écarté par le panel du 2026-08-23 ; le test d'invariant de la carte (map-data.test) fait déjà le travail mécanique | le test livré (PR #162) |
| `0113-chief-judge` | le juge de cohérence existe : `ezk-steward` ; créer un second juge recrée le doublon que la carte des rôles voulait résorber | — |
| `20260813131737968-assainir-references` | le graphe compilé est livré (graph.ts, 187 liens · 0 cassé) ; le dernier écart prose/frontmatter (README/ezk-codex) réparé au lot 0 | — |
| `20260816140607355-compteurs-readme` | l'index `pnpm ezk:help` est livré (done/…335) ; les compteurs faux du README corrigés au lot 0 ; le générateur de table n'a plus de douleur porteuse | — |
| `0042-inventaire-idees-historiques-cop1` | icebox jamais tirée depuis sa création ; l'inventaire du 2026-08-23 couvre le besoin | — |
| `20260823124042571-taxonomie-post-panel` | supersédée par le plan « trois étages » approuvé le 2026-08-23 — ses étapes SONT les lots 0-2 | le plan + la capture panel |
| `0092-decomposition-depends-labels` | `depends:` existe déjà dans les fiches (0169, 0170, 0171…) ; le reliquat `labels:` est le cœur de la fiche rationalisation-tags | note dans `20260812104022240` |

Références : plan approuvé (session 2026-08-23) · panel adverse
`2026-08-23-panel-adverse-refonte-taxonomie.md` · PR #162.
