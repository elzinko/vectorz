---
id: "20260901173549334"
title: "ezk multi-client : cap Cursor + modèle & effort configurables par hôte"
type: feature
priority: P2
product: mega-city
version:
epic:
status: todo
ready:
pr:
created: 2026-09-01
---

**En clair.** On ne peut pas installer ezk dans Cursor, et le modèle épinglé
(`claude-opus-4-8`) n'y veut rien dire — Cursor ne le connaît pas. Cette fiche veut deux
choses : **écrire l'adaptateur Cursor** (la pièce qui pose agents et skills dans la forme que
Cursor lit) et **rendre le modèle + l'effort réglables par client**, à l'install et après, via
une table que **tu** contrôles — jamais le LLM. Résultat concret : `ezk` tourne dans Cursor,
et tu choisis Opus 4.8 ici, Sonnet là, ou « rien, le client décide », en connaissance de coût.

Cadrée par [ADR-0047](../products/mega-city/docs/adr/0047-multi-client-cursor-et-modeles-par-hote.md)
et [ADR-0048](../products/mega-city/docs/adr/0048-contenu-mono-source-modele-en-surcouche.md) (contenu mono-source).

## Contexte / Problème

**Valeur.** Aujourd'hui, ezk ne tourne que dans Claude Code. Tu veux aussi Cursor. Sans ce
chantier, deux choses coincent. Un : l'install Cursor n'existe pas. Deux : le modèle épinglé
casse en silence ailleurs — Cursor reçoit un identifiant qu'il ignore. Avec ce chantier, ezk
tourne dans Cursor, et tu gardes la main sur le coût : tu choisis le modèle par client, au
lieu de subir celui que le client impose.

**Installer ailleurs = écrire un « cap ».** Un cap, c'est l'adaptateur par hôte : il
matérialise un profil (agents + skills + règles) dans la forme native d'un client. Trois
existent : `claude-code`, `claude-code-global`, `claude-desktop` (`src/caps/registry.ts`). Le
type des hôtes **nomme déjà `cursor`** (`docs/domain.ts:129`) et le commentaire dit
« cursor / cop1 → leur format natif » (`:136`) — mais **aucun cap `cursor` n'existe**, donc
`bind … cursor` échoue.

**Le modèle part sans filtre par client.** Le rendu d'un agent (`src/caps/agent-content.ts`)
recopie `model` / `model_spare` / `effort` **verbatim**, sans paramètre d'hôte. En mode
`--link` (l'install courante), le fichier agent est **symlinké brut** : `claude-opus-4-8`
atterrit tel quel dans la cible. Or c'est un identifiant **propre à Claude Code**.

**La règle Cursor n'existe qu'en prose.** La doctrine 0181
(`docs/ezk-model-and-lisibility.md`) dit déjà « hôte Cursor → slug
`claude-opus-4-8-thinking-high`, sinon Sonnet », répétée dans `ezk-archive`/`ezk-sprint`. C'est
une **consigne lue par le LLM au runtime**, pas un mécanisme d'installation, et rien n'est
réglable à l'install ni après.

**Contrainte à regarder en face.** Un fichier de commande Cursor (`.cursor/commands/*.md`)
**n'honore pas un modèle par fichier** : dans Cursor le modèle se choisit dans l'UI / par
« mode ». « Un modèle par agent » n'y est donc pas exprimable comme dans le frontmatter Claude
Code. La feature doit le dire, pas le maquiller.

## Proposition

Deux briques (scindables en deux fiches au grooming), décidées ensemble par l'ADR-0047 :

1. **Cap `cursor`** — `src/caps/cursor.ts` + entrée au registre. Formes natives figées au spike
   (2026-09-03) : skills → `.cursor/skills/<id>/SKILL.md` (**même format ouvert**) ; agents →
   `.cursor/agents/<id>.md` (**subagents**, frontmatter `model` + effort) ; LOI →
   `.cursor/rules/*.mdc`. Le seam existe déjà (ADR-0003). C'est **un cap de plus, pas un corpus
   réécrit**.

2. **Résolution modèle + effort par hôte** (le « ModelTierRouter » anticipé par la fiche 0144)
   — un point `(hôte, agent) → {model, effort}`, alimenté par une **table de config éditable**.
   Le frontmatter reste le **défaut Claude Code** (rétrocompatible).
   - Claude Code → renvoie le pin `claude-opus-4-8` (honoré par le frontmatter).
   - Cursor → renvoie un slug Cursor valide **ou** « client décide » + une **note générée**
     « règle ton modèle ainsi » ; **jamais** `claude-opus-4-8` recopié à l'aveugle.
   - **Contrôle humain** : à l'install `--models <preset>` (`econome` | `equilibre` | `max` |
     `custom`), choix **persistés dans un manifeste** (façon BMAD) ; après, on **édite la table
     et on re-bind**. Le LLM ne choisit jamais.

On copie à BMAD sa **mécanique d'install multi-client** (registre + fan-out + manifeste), **pas**
sa **stratégie modèle** (BMAD n'épingle aucun modèle → le client choisit → coût non maîtrisé,
ce qu'on refuse : Fable 5 / Opus 5 trop gourmands).

**Décidé par le PO (2026-09-03).**
- On reste **concret** (pas de niveau abstrait) : la config Claude ne bouge pas.
- **Une config par client, livrée pré-remplie** : Claude = la config connue ; Cursor = un
  défaut auto prudent, à ajuster.
- **Install en auto**, sans question, pour démarrer (« demander à l'install » = option plus tard).
- **Zéro duplication** (mécanisme : ADR-0048, **amendé 2026-09-04**) : **foyer
  `.vectorz/mega-city/`** = source unique. Skills **liées**, agents Claude **liés**, agents
  Cursor = **pointeur mince** (charge le rôle depuis `.vectorz/mega-city`, slug Cursor écrit).
  Jamais d'édition double. (Renommage `ezk-*→mc-*` différé : fiche 20260904074824499.)

## Critères d'acceptation

*(Durcis au grooming du 2026-09-02. La fiche reste scindable en 2 — voir « Découpage ».)*

- [ ] `lawgiver bind <profil> <projet> cursor` produit une install Cursor fonctionnelle
      (agents/skills lisibles par Cursor) — cap `cursor` enregistré, plus d'« Hôte inconnu ».
- [ ] Aucun `claude-opus-4-8` recopié à l'aveugle dans une cible non-Claude-Code
      (`grep 'claude-opus-4-8' <sortie cursor>` = 0, hors note explicative assumée).
- [ ] Le modèle + l'effort se règlent **par hôte** : un preset à l'install, une table éditable
      après, un re-bind qui reflète le changement — **sans toucher le frontmatter** des agents.
- [ ] Le pin Claude Code (0181) reste honoré à l'identique (non-régression).
- [ ] Le choix (hôtes configurés + preset modèle) est **persisté** (manifeste) et relu au re-bind.
- [ ] Tests : la résolution `(hôte, agent) → {model, effort}` est **pure et testée** ; le cap
      `cursor` a son test de plan déterministe (sur le modèle de `claude-code.test.ts`).
- [ ] Cursor honore le modèle + l'effort **par agent** : les agents sont matérialisés en
      **subagents** `.cursor/agents/*.md`, frontmatter `model: "claude-opus-4-8-thinking-high"`
      (slug Cursor exact, effort dans le nom ; POC 2026-09-03) issu de la table. Un slug **hors
      liste blanche** doit **faire échouer le build** (sinon Cursor retombe en silence sur le parent).
- [ ] **Zéro duplication du contenu** (ADR-0048) : skills **liées** (zéro copie) ; le rôle d'un
      agent s'écrit à **un seul endroit** ; seule la sortie Cursor le régénère (artefact de
      build). Preuve : éditer un rôle **une fois** se répercute partout après re-deploy — jamais
      deux éditions à la main.
- [ ] Les configs par client sont **livrées pré-remplies** : Claude = la config connue ;
      Cursor = un défaut auto ; l'install ne pose aucune question pour démarrer.

## Découpage proposé (grooming)

**Deux briques, tirables séparément.** L'ADR-0047 les a nommées.

- **Brique 1 — cap `cursor`.** La plus autonome. Le spike de format Cursor est **fait**
  (2026-09-03). Elle ne dépend d'**aucune** décision réservée. On commence par elle.
- **Brique 2 — résolution modèle/effort par hôte.** Les arbitrages produit sont tranchés
  (PO, 2026-09-03 — voir Notes) ; reste la validation technique en panel. C'est aussi l'infra
  que le cap cop1 réutiliserait ([`0121`](0121-cap-cop1.md)).

Reco : deux fiches filles, **brique 1 d'abord**.

## Comment vérifier

```bash
# 1. cap cursor enregistré (échoue aujourd'hui avec « Hôte inconnu »)
cd products/mega-city && pnpm lawgiver bind global /tmp/essai-cursor cursor

# 2. rien d'un id Claude-Code-only recopié tel quel dans la sortie Cursor
grep -R 'claude-opus-4-8' /tmp/essai-cursor && echo "FUITE" || echo "OK: pas de fuite"

# 3. gate mega-city (le cap + la résolution doivent passer les 2 suites)
cd products/mega-city && pnpm build && pnpm test && pnpm test:scripts
```

## Notes

- **Prior art à consommer** : fiche `0144` (frontmatter `model`/`effort` + « ModelTierRouter »
  anticipé, `0144:41`), doctrine `0181` (`docs/ezk-model-and-lisibility.md` — mapping Cursor en
  prose à **transformer en mécanisme**), benchmark `docs/benchmarks/2026-08-25-bmad-vs-ezk.md`.
- **Fiches voisines, distinctes** :
  - [`0087`](0087-plugin-claude-code-distribution.md) — distribuer ezk **en plugin Claude Code**
    (axe *packaging / marketplace*). Ici c'est l'axe *multi-client + politique modèle*. Se
    complètent, ne se recouvrent pas.
  - [`0121`](0121-cap-cop1.md) — **cap cop1** (un autre hôte). Même patron que la brique 1 ; la
    brique 2 (résolution modèle par hôte) est l'**infra partagée** que cop1 et cursor
    consommeraient tous deux (cf. `ModelTierRouter`, cop1 fiche 0128).
- **Arbitrages PO tranchés le 2026-09-03** (détail dans ADR-0047 §D5) : concret (pas de tier,
  alt. D écartée) ; une config **par client** pré-remplie ; install en auto pour démarrer ;
  pas de repli alias-map (alt. B écartée) ; **zéro duplication** des skills (source unique
  référencée, config modèle à côté).
- **Priorité P2 à confirmer** : posée par défaut (fiche `idea`, non tirable en l'état) — à
  arbitrer au moment de tirer (panel / PO).
- **Groomé le 2026-09-02** : valeur explicitée, critères durcis, spike Cursor posé en
  prérequis, découpage proposé. La fiche reste `idea` (le grooming ne promeut pas).
- **Avant `ready`** : arbitrages tranchés **et** dépendance Cursor **constatée** (spike fait).
  La DoR est atteinte — la fiche est **éligible au gate `ready`**. Reste, côté build, la
  validation technique en panel (structurante). La **brique 1** peut démarrer.
- **Statut `todo` sans `ready`** : décidée et actionnable. Le gate `ready` peut maintenant
  passer (dépendance externe constatée) — laissé au PO / au prochain tirage.
- **Dépendance externe constatée le 2026-09-03** (spike) : formats natifs Cursor figés — skills
  au format ouvert (`.cursor/skills`), agents en subagents (`.cursor/agents`, modèle + effort),
  LOI en `.cursor/rules` ; Opus 4.8 au catalogue Cursor. Détail :
  [`docs/spikes/2026-09-03-cursor-cap-format.md`](../products/mega-city/docs/spikes/2026-09-03-cursor-cap-format.md).
- **Prior art accessible** : fiche 0144, doctrine 0181, benchmark BMAD — tous dans le repo,
  accès constaté le 2026-09-02.
