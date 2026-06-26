# ADR 0005 — Modes de consommation : export statique (Cap) primaire, MCP optionnel

- Statut : **proposé** (2026-06-26)
- Date : 2026-06-26

## Contexte

mega-city doit être consommable par deux familles d'hôtes :

- **headless / agentique** — ex. **cop1**, qui exécute ses agents via le Claude Agent
  SDK et lit une config native (`iamthelaw/*.yaml`, défs d'agents/skills) ;
- **interactif** — **Claude Code** (et Desktop, Cursor), où un humain pilote une session.

Question ouverte (soulevée pendant l'analyse d'intégration cop1, cf. cop1 `ADR-021`) :
mega-city doit-il être consommé par **export statique** (fichiers matérialisés via un
`Cap`) ou par **MCP** (serveur exposant `bind`/`get-rules` à une session vivante) ?
ADR-0001 a déjà posé l'invariant « catalogues host-agnostiques + `caps/<host>/` » ;
cet ADR tranche le *mode de consommation*.

## Décision

1. **Mode primaire = export statique (le `Cap`).** mega-city matérialise la forme
   native du host (claude-code → `.claude/{agents,skills}` + `.iamthelaw/ENTRY.md` +
   hooks ; cop1 → `iamthelaw/*.yaml` + défs ; etc.). Déterministe, versionnable,
   **zéro dépendance vivante** : le host lit ses fichiers, il n'« appelle » pas mega-city.
   C'est déjà ainsi que Claude Code est servi.
2. **Mode dynamique = MCP : optionnel et différé.** Un serveur MCP exposant
   `bind` / `list-profiles` / `get-rules` pour composer **à chaud en session** n'est
   ouvert **que si** un besoin de composition par-session apparaît. Il introduit un
   couplage runtime que l'export évite — donc hors scope tant que l'export suffit.
3. **Cibles, un Cap chacune.** cop1 (SDK) et Claude Code (interactif) sont **deux hosts**
   du même moteur, chacun servi par son `caps/<host>/`. Aucun n'est privilégié dans le cœur.
4. **Invariant de non-couplage** (miroir de cop1 `ADR-021`) :
   - le **cœur** (catalogues + `expand`) reste host-agnostic ; tout host-spécifique
     vit dans `caps/<host>/` ;
   - **mega-city n'importe jamais** le code d'un consommateur (cop1, etc.) ;
   - **un consommateur n'importe jamais** la lib mega-city au runtime — il lit l'export.
   La seule interface partagée est **le format de fichiers natif du host**.

## Conséquences

- mega-city reste « utilisable par n'importe quel LLM » sans coupler son cœur à aucun.
- Ajouter cop1 = **un `caps/cop1/`** (cf. fiche `cap cop1`) + une entrée registre, sans
  toucher au cœur — symétrique de `caps/claude-desktop` (fiche 0003).
- Le MCP reste une **option future assumée**, pas une dette implicite : on sait quand
  l'ouvrir (besoin dynamique) et ce qu'il coûte (couplage vivant).
- **Hors-scope** : implémentation du Cap cop1 (fiche dédiée) ; serveur MCP ; choix du
  format exact de matérialisation des agents/skills cop1 (à confirmer avec cop1).
