---
id: 0066
title: "Tester un skill pour de vrai avant de le merger"
type: feature
priority: P2
product: mega-city
version: V0.4
milestone: rationalisation
labels: [fabrique]
status: idea
pr:
created: 2026-07-16
---

# 0066 — Tester un skill/agent avant merge

## En clair

Aujourd'hui, un seul contrôle relit les skills : l'agent `ezk-steward`. C'est un jugement, pas une
alarme. Il a laissé passer deux références mortes, dont une dans son propre texte. Cette fiche
ajoute un contrôle **mécanique** : il rougit quand un skill ou un agent cite un script qui n'existe
pas, ou déclare une composition que son texte ne mentionne pas. Elle écrit aussi les trois niveaux
pour valider un skill. Exercer le skill pour de vrai (les cas « golden ») reste en « Suite ».

## Contexte / Problème

Née du premier self-host (2026-07-16) : *« comment tester un skill avant de le merger ? »*. Le
niveau 1 (audit statique `ezk-steward`) rate ce qu'il ne pense pas à regarder. Le dry-run d'`ezk-retro`
a trouvé un bug que cet audit avait manqué. Un audit à la main (2026-07-26) a trouvé deux références
mortes : aucune gate n'a rougi (détail en bas). Mesure du 2026-08-13 : 3 skills sur 23 ont un test
shell local ; 0 sur 23 un exercice bout-en-bout.

Trois niveaux à documenter comme process de validation d'un skill de méthode :

1. **Statique** : `ezk-steward` (conventions, déclenchement, références). *Déjà là.*
2. **Exercice** : lancer le skill sur un cas réel (`verify`) et observer. *Manque.*
3. **Éval** : le harnais de `skill-creator` (cas de test, déclenchement de la description, variance).

## Périmètre du POC

Le POC ferme le trou **mécanique** du niveau 1 : deux contrôles dans `pnpm test`, prouvés par
sabotage. Il réutilise l'idée de `helpers/cited-commands.ts` (un document qui cite une chose doit
citer une chose qui existe). Mesure de départ : 64 citations de scripts dans 33 documents (25 skills,
8 agents) ; 7 sont à expliquer, dont 3 = un agent qui parle du script de son skill homonyme, et 4 =
citations (2 scripts) du **projet cible** par `ezk-ci`. Angle mort assumé : seules les extensions
`.sh`, `.ts`, `.mjs`, `.js` sont vues ; un script `.py` ou sans extension passe.

## Critères d'acceptation

- [x] **Scripts cités.** Un `SKILL.md` ou un `agents/*.md` qui cite un script du dépôt inexistant
      fait échouer `pnpm test`. Écritures reconnues : `bin/x.sh` (avec ou sans `products/mega-city/`),
      `skills/<skill>/scripts/x` (ou `<skill>/scripts/x`), et `scripts/x` nu ou `./scripts/x`. Le nu
      se résout dans le dossier du skill (du skill homonyme pour un agent), puis dans `scripts/` du
      produit ou de la racine.
      *Preuve : `core/skill-refs.ts` + `skill-refs.test.ts` ; 33 documents, 64 citations, 0 introuvable.*
- [x] **Exceptions explicites.** Les scripts d'un AUTRE projet (ex. `ezk-ci` cite `scripts/ci-local.sh`,
      généré dans le projet cible) sont listés un par un, avec leur raison. Aucun joker.
      *Preuve : 2 exceptions (`ezk-ci`), chacune testée « encore citée » pour ne pas pourrir.*
- [x] **Composition déclarée = citée.** Un `composes:` ou `delegates:` du frontmatter dont l'id
      n'apparaît pas dans le corps du skill fait échouer `pnpm test` (le graphe ne peut pas annoncer
      une intégration que le texte n'honore pas ; retour Codex #125). Départ : 0 fantôme sur 25 skills.
      *Preuve : `findUncitedCompositions`, mot entier (`ezk-pr-pilot` ne cite pas `ezk-pr`) ; `delegates:`
      vient de la fiche 20260812104022246, empilée sous cette branche.*
- [x] **Preuve par sabotage**, pas par lecture. Chaque contrôle a un test qui injecte le défaut et
      attend le rouge : `./scripts/validate.sh` nu dans un agent (le cas réel du 2026-07-26),
      `bin/fantome.sh` dans un skill, un `composes:` jamais cité. Le dépôt réel reste vert.
      *Preuve : 12 tests de sabotage synthétiques ; rejoué le 2026-10-01 sur les vrais fichiers
      (voir « Comment vérifier »).*
- [x] **Les trois niveaux sont écrits** dans `skills/README.md` : pour chacun, ce qui est mécanique
      aujourd'hui et ce qui reste manuel.
      *Preuve : section « Valider un skill avant de le merger — trois niveaux ».*

## Comment vérifier

```bash
pnpm --dir products/mega-city exec vitest run src/__tests__/skill-refs.test.ts
pnpm --dir products/mega-city test        # le dépôt réel reste vert
```

Sabotage joué le 2026-10-01 sur les vrais fichiers, puis annulé : une ligne `./scripts/validate.sh`
ajoutée à `agents/ezk-steward.md` → rouge, « agents/ezk-steward.md:70 scripts/validate.sh » ;
`composes: [ezk-backlog, ezk-chef]` sur `ezk-readme` → rouge, « ezk-readme composes ezk-chef ».
À rejouer avec la même méthode quand on touche aux regex de `core/skill-refs.ts`.

## Suite (hors POC)

- **Niveau 2** : `skills/<skill>/tests/` avec ≥ 1 cas golden par sous-commande (`input` → transcript
  attendu → `events.jsonl` attendu), rejouable en dry-run. Demande un harnais ; un skill LLM n'est
  pas déterministe.
- **DoR / DoD d'un skill** : déclencheurs qui doivent / ne doivent pas matcher, ≥ 1 scénario Gherkin
  par sous-commande. C'est le validateur de structure que le générateur 0067 applique à la
  création (PO 2026-08-25, option A).
- **Gate de PR** : toute PR qui touche un skill cite un dry-run documenté.
- **Commandes et skills fantômes cités en code** : l'outil existe (`helpers/cited-commands.ts`, déjà
  servi à la FAQ et aux tables « Et maintenant ? »). Sur les 33 documents il remonte 21 mentions, toutes
  explicables (anciens noms absorbés, commandes du projet cible, exemples). Il faut un registre
  d'exceptions (`renames.yml`) avant d'en faire une gate.
- **Revendication en prose sur un AUTRE skill** (cas `ezk-preview` ↔ `ezk-sprint`) : pas mécanisable
  tant que « qui m'appelle » n'est pas une arête déclarée.
- **Absorptions du paquet 2 (2026-08-24)** : 0139 (invariants d'intégrité des agents : contrat de
  sortie par finding, evidence-gate, juge de substance des rejets) et 0179 (incubation en rétro :
  proposer, mesurer, tracer) servent de critères d'éprouvage au niveau 2.

## Notes / décisions

- Origine : cérémonie `ezk-retro` (dry-run 2026-07-16, lentilles QA + PM). Compose `ezk-steward`,
  `verify`, `skill-creator`. Rattachée à l'épic
  [20260813131737959](done/20260813131737959_rationalisation-coherence-methode-epic.md).
- Un skill de méthode a un critère de plus : émet-il les events du contrat ? Voir 0067 (test
  « golden events ») et l'ADR-032.
- **0066 porte le contrôle** (PO 2026-07-26) : il ne dépend d'aucun autre merge. C'est aussi le
  validateur de structure du générateur [0067](0067-ezk-ezk-contract-aware-carte-emission.md).
- Même motif que [0095](done/0095-ezk-product-builder-n-emet-pas.md) (une consigne partie neuf jours en
  silence) et [0101](done/0101-cabler-check-links-ship-et-ci.md) (« un contrôle que personne ne lance ne
  protège de rien »).

## Détail : les deux références mortes du 2026-07-26

| Ce que le texte affirmait | Le réel |
|---|---|
| [`ezk-steward`](../products/mega-city/agents/ezk-steward.md) ligne 15 + sa `description:` : « lance `./scripts/validate.sh` » | le script n'existe **nulle part** ; héritage de l'ancien repo `claude-skills`. Le gate réel est `pnpm --filter mega-city test` / `typecheck` + [`bin/check-links.sh`](../products/mega-city/bin/check-links.sh) |
| [`ezk-preview`](../products/mega-city/skills/ezk-preview/SKILL.md) ligne 136 : « c'est l'étape "1 lien de démo par PR" d'ezk-sprint » | [`ezk-sprint`](../products/mega-city/skills/ezk-sprint/SKILL.md) ne l'invoque **jamais**. Le seul appelant câblé est [`ezk-pr`](../products/mega-city/skills/ezk-pr/SKILL.md) |

Les deux textes sont corrigés. Ce qui restait ouvert, c'est le **contrôle**.
