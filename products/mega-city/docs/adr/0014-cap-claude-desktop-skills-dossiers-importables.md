# ADR 0014 — Cap `claude-desktop` : matérialisation des skills en dossiers importables

- Statut : **proposé**
- Date : 2026-07-13

## Contexte

Fiche 0003 : un cap `claude-desktop` (host déjà présent dans `HostId`) doit matérialiser
un `ResolvedProfile` en **dossiers de skills importables dans Claude Desktop** (`<id>/SKILL.md`).
`Cap.materialize` est **pur et déterministe** (ADR-0003) : `ResolvedProfile → WritePlan`, zéro I/O.

Le cap `claude-code-global` (`src/caps/claude-code-global.ts`) fait déjà **quasi la même chose** :
`skills/<id>/SKILL.md`, filtré sur contenu non vide, `assertSafeId` anti-traversal, tri stable
par `path`, `hooks: []`. La seule différence attendue côté desktop est le **préfixe de chemin**.
Contrainte domaine : `Skill = { id; content }` — **aucun champ `scripts`**, donc `scripts/`
n'est pas matérialisable sans étendre `Skill` + le loader (`src/loaders/catalog.ts`). AC2
(non-régression) se lit désormais contre le comportement du cap global, `install.sh` ayant disparu.

## Décision

1. **Frontière DRY — helper partagé, pas de couplage cap↔cap.** Extraire une fonction pure
   `skillFolderFiles(resolved, prefix)` dans un module de helpers de caps (à côté de
   `agent-content.ts`), qui porte l'unique logique « un dossier `SKILL.md` par skill »
   (filtre contenu vide, `assertSafeId`, normalisation `content`). Global la consomme avec
   `prefix = 'skills'`, desktop avec `prefix = ''`. Les caps dépendent d'un helper de domaine,
   **jamais l'un de l'autre** (DIP, SRP). Le FileWrite produit reste identique à l'actuel
   (aucun `intent` forcé) ⇒ zéro régression pour global.
2. **Périmètre desktop = skills seuls.** Pas d'agents, pas de rules/hooks/CLAUDE.md ;
   `hooks: []`. Claude Desktop ne consomme que des dossiers de skills ; le reste est hors-scope.
3. **Layout natif = `<id>/SKILL.md` à la racine cible** (`prefix = ''`, conforme AC1). La cible
   passée au cap **est** le dossier importé par Claude Desktop, donc pas de préfixe `skills/`
   (contrairement au global dont la racine est `~/.claude/`). `intent` laissé à la valeur par
   défaut de la coquille I/O, comme le global — parité de comportement.
4. **Gap `scripts/` = hors MVP.** POC = `SKILL.md` seul. Inclure `scripts/` exigerait d'étendre
   `Skill` + le loader (hors périmètre fiche) → **follow-up backlog**, non bloquant pour l'AC.
5. **Câblage = cap + entrée registry, rien de plus ce sprint.** `materialize` étant pur, la
   validation est unitaire sur le `WritePlan` (méthode retenue par la fiche, pas d'E2E). Le host
   devient atteignable via `bind <profile> <dir> claude-desktop` (`applyPlan` par-projet écrit
   `<dir>/<id>/SKILL.md`). Une commande CLI dédiée / chemin Desktop « bien connu » (analogue à
   `bind-global`) est du **polish**, pas du cœur de fiche.

## Conséquences

**Plus facile** — une seule logique « skill → dossier » testée une fois, réutilisée par deux caps ;
ajouter desktop = un module mince + une entrée registry, cœur intact.
**À surveiller** — le helper devient un point partagé : tout changement de forme du `SKILL.md`
impacte global ET desktop (voulu : c'est le même contrat d'import). Le prefix `''` doit rester
sûr vis-à-vis d'`assertSafeId` (les `id` restent la seule source de sous-chemin).
**À revisiter quand** — (a) on veut matérialiser `scripts/` (étendre `Skill` + loader) ;
(b) on veut un chemin Desktop par défaut et un verbe CLI dédié.

## Alternatives écartées

- **Dupliquer la logique dans desktop** — duplication verbatim d'un code non trivial (anti-traversal,
  filtre, normalisation) ; deux endroits à corriger. **Rejeté.**
- **Faire dépendre desktop de global** (`import { skillFiles } from './claude-code-global'`) —
  couplage cap↔cap, inversion de dépendance sur un sibling concret. **Rejeté** au profit du helper.
- **Réutiliser le préfixe `skills/`** — casserait l'import natif Desktop (dossier importé = racine
  des skills, pas un parent `skills/`) et diverge de l'AC1. **Rejeté.**
- **Livrer `scripts/` maintenant** — touche `domain`/loader hors périmètre, viole YAGNI/POC-first. **Rejeté.**
