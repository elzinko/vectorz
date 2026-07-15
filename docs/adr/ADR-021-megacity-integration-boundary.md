# ADR-021 — Frontière d'intégration cop1 ↔ mega-city

Statut : **Accepté** (2026-07-15, fiche 0035 — était Proposé du 2026-06-26).
Justification : le contrat de couture défini ici est référencé « inchangé » par les
en-têtes d'ADR-023 et ADR-025, et étendu sans révision par ADR-027 — la frontière fait
consensus dans les décisions ultérieures, elle est actée. (Le merge du document, commit
3cb9db2/#48, ne valait pas acceptation.)

## Contexte

[mega-city](../../../mega-city) (`~/git/bacasable/mega-city`) est un moteur de
**composition → matérialisation** host-agnostique : il compose des *profiles*
(rules + agents + skills + interactions) et les matérialise vers la forme native
d'un host via des **Caps** (`caps/<host>/`). Son cœur est pur/déterministe ; cop1
est **déjà listé comme host de première classe** (`docs/domain.ts` :
`HostId = 'claude-code' | 'claude-desktop' | 'cursor' | 'cop1' | …`).

mega-city est une **évolution plus globale de iamthelaw** : là où l'`iamthelaw`
interne de cop1 ne modélise que des règles (`{id, description, source, check?}`),
mega-city modélise rules + agents (Juges) + skills + règles d'interaction, et
ajoute un *flywheel* `capture` (auto-amélioration aux bords LLM). Les
`enforcements:[{type:'agent-check', agent}]` de mega-city correspondent au
**`Rule.check` → DoDCheck** de cop1 (ADR-020, fiche 0014) : mega-city *décrit*
l'intention d'enforcement, cop1 l'*applique*.

cop1 est mature/shippé (plan d'**exécution**) ; mega-city est un POC (~10 commits,
plan de **gouvernance/config**). Le risque produit identifié : **coupler les deux
produits de la mauvaise façon**, au point qu'aucun ne soit plus utilisable seul.

## Décision

**Le contrat d'intégration est le format de fichiers de config natif de cop1 —
ni l'API de cop1, ni celle de mega-city.**

1. **mega-city reste host-agnostic.** cop1 est supporté comme **un host parmi N**,
   via un `caps/cop1/` *isolé* (côté mega-city), au même titre que `caps/claude-code`.
   Le cœur de mega-city n'importe jamais de code cop1.
2. **cop1 reste indépendant au runtime.** cop1 lit sa config native
   (`iamthelaw/*.yaml`, défs d'agents/skills) et **n'a aucune connaissance de
   mega-city**. Que la config soit écrite à la main ou générée par
   `mega-city bind … cop1` est invisible pour cop1. **cop1 ne dépend jamais de
   mega-city pour tourner.**
3. **La couture = les fichiers de config de cop1.** mega-city les écrit (cap cop1) ;
   cop1 les lit. Versionnable, testable (déterminisme mega-city), zéro runtime partagé.
4. **Deux couplages interdits** (anti-décision) :
   - ❌ cop1 qui importe la lib mega-city (`bind`/`expand`) au runtime.
   - ❌ le cœur de mega-city qui dépend de cop1.
5. **Le « plugin cop1 » est optionnel et fin** : au plus une commande de confort
   (`cop1 … sync` qui *shell-out* `mega-city bind <profile> <ce-projet> cop1`),
   jamais une dépendance de bibliothèque. cop1 fonctionne sans.
6. **Modes de consommation** : l'**export statique** (le Cap) est la voie primaire
   pour cop1 **et** Claude Code (déjà le cas pour Claude Code : `.claude/{agents,skills}`
   + `.iamthelaw/ENTRY.md` + hooks). Un **MCP** (composition dynamique en session) est
   un mode *optionnel et différé* — hors trajectoire mega-city actuelle, ajoute une
   dépendance vivante.
7. **Phasage (aucune implémentation dans cet ADR)** :
   - **Phase 1** — `caps/cop1/` matérialise les *règles* en `iamthelaw/global.yaml`
     (que `IamTheLawLoader` lit déjà), avec les `enforcements` mappés sur le
     `Rule.check` → DoDCheck (ADR-020). Plus petit incrément, réutilise l'existant.
   - **Phase 2** — matérialiser l'équipe (agents/skills) une fois le format de
     consommation cop1 confirmé (les sous-agents/skills `ezk-*`).
   - **Phase 3** — quand `capture` (mega-city) sera mûr, brancher les rétrospectives
     cop1 (PRD FR60 : auto-modification des règles) → `capture` → re-`bind`.

## Conséquences

- **Indépendance maximale des deux produits** : cop1 ignore mega-city ; mega-city
  ignore les internes de cop1 (cop1 = un cap isolé). Chacun s'utilise seul.
- cop1 gagne une **config reproductible/versionnable/composable** sans dette de
  couplage. Le `caps/cop1/` est, du point de vue cop1, du pur build-time externe.
- La logique cop1-spécifique (la seule connaissance partagée) vit **à un seul
  endroit** : `caps/cop1/` (côté mega-city). Si demain cop1 change son format de
  config, seul ce cap bouge.
- **Hors-scope / à confirmer** : le format exact de matérialisation des agents/skills
  cop1 (Phase 2) ; l'opportunité d'un MCP (Phase ≥3) ; la maturité de mega-city
  (POC — ne pas implémenter tant que son schéma n'est pas stabilisé, cf. ses fiches
  0012 « aligner domain.ts » et 0006 « migrer rulesets iamthelaw »).
- **Décision symétrique attendue côté mega-city** : une fiche/ADR mega-city actant
  son objectif (host-agnostic ; consommable par cop1 via Cap statique, et par Claude
  Code via export — MCP optionnel) + une fiche `cap cop1`. À créer dans le repo
  mega-city (proposé séparément).

## Synchronisation cop1 ↔ mega-city (comment cop1 consomme la sortie)

Corollaire de la décision : cop1 lit sa **config native générée** par mega-city (cap cop1). La
synchronisation suit un modèle de **dépendance vendorée**, **pas un symlink live** :

1. **Config générée, commitée dans cop1.** `mega-city bind … cop1` produit les fichiers natifs →
   **commités dans cop1** comme artefact versionné (entête `# GÉNÉRÉ par mega-city @<version> — ne pas éditer`).
2. **Pin de version.** cop1 épingle la version mega-city qui a produit la config (tag ; SHA tant que
   mega-city n'a pas de release taguée — remote privé `github.com/elzinko/mega-city` créé le 2026-07-04, cf. sa fiche 0005).
3. **Sync = bump de version revu.** À chaque release stable de mega-city → re-`bind` → commit
   `chore(governance): sync mega-city@vX.Y`. cop1 ne suit **jamais** le HEAD de mega-city (aucun import de WIP/instable).
4. **Règle read-only (dogfood).** Édition manuelle des fichiers générés interdite ; tout changement
   passe par mega-city + re-`bind`. Règle du domaine mega-city (iamthelaw) → applicable via DoDCheck /
   hook / **check CI de drift** (re-`bind` contre la version pinnée, échoue si diff).

**Pourquoi pas un symlink** (modèle « sous-projet embarqué ») : embarquer mega-city vivant dans cop1
recrée le couplage interdit (anti-décision #4) et casse l'indépendance runtime — cop1 ne tournerait
plus si mega-city est absent/instable. La dépendance vendorée **préserve l'indépendance** tout en
donnant le contrôle de sync (release-gated). Cf. mega-city fiche 0016 (cap cop1) pour la génération,
fiche 0005 pour le versioning/tags.

## Alternatives écartées

- **cop1 importe la lib mega-city** (cop1 = consumer) : couple le runtime de cop1 au
  schéma (mouvant) de mega-city ; cop1 ne tournerait plus seul. Rejeté (anti-décision #4).
- **Adapter cop1 vivant dans cop1** (plugin qui consomme un `ResolvedProfile` exporté) :
  met de la connaissance mega-city *dans* cop1 ; moins d'indépendance que « cop1 ne sait
  rien ». Possible si on veut zéro code cop1-spécifique dans mega-city, mais l'isolation
  d'un `caps/cop1/` côté mega-city préserve mieux l'indépendance de cop1. Tenu en réserve.
