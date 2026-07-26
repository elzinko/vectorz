---
id: 0078
title: Émetteur de supervisabilité — install un-clic Claude Desktop (bundle .mcpb)
type: feature
priority: P2
epic:
status: shipped
ready:
pr: "#41"
created: 2026-07-18
---

# 0078 — Le « bouton » d'installation de l'émetteur (.mcpb)

## Contexte / Problème

Aujourd'hui, brancher l'émetteur de supervisabilité (fiche 0050) sur Claude Desktop
suppose d'**éditer à la main** `claude_desktop_config.json` (coller un bloc, remplacer 2
chemins absolus, redémarrer). Acceptable pour l'opérateur qui valide, mais **friction
forte pour un utilisateur** de vectorz. Le PO veut « un bouton qui ouvre Claude Desktop
pour ajouter le connecteur » (2026-07-18).

Claude Desktop supporte les **bundles `.mcpb`** (ex-`.dxt`) : une archive (serveur +
`manifest.json`) que l'utilisateur **double-clique** → Claude Desktop ouvre une carte
d'installation avec des **champs de config** (ex. un sélecteur de dossier) → installe le
serveur dans sa config gérée, **sans édition JSON manuelle**. C'est l'équivalent honnête,
pour un serveur **local**, de la page « Connexion » d'un connecteur distant (Rentila).

## Proposition

- Packager l'émetteur en `.mcpb` : `manifest.json` déclarant `SUPERVISION_PROJECT_ROOT`
  comme **champ dossier** (directory picker), le reste calculé.
- L'utilisateur double-clique le `.mcpb`, choisit le projet à superviser, installe ;
  les 5 outils apparaissent — zéro JSON.
- Mettre à jour la **doc utilisateur** (créée par ce lot de travail, cf. plus bas) pour
  mener par le chemin `.mcpb` (l'install manuelle devient le repli « pour les curieux »).

## Critères d'acceptation

- [ ] `.mcpb` construit : double-clic → carte d'install Claude Desktop, sélecteur de
      dossier pour `SUPERVISION_PROJECT_ROOT`, 5 outils visibles, aucun JSON à la main —
      **construit et prouvé côté protocole** (2026-07-19 : `bin/build-mcpb.sh`, serveur
      bundlé lancé tel que Desktop le ferait → handshake + 5 outils + run complet →
      validateur cop1 vert) ; **reste le double-clic réel dans Claude Desktop, à jouer
      par le PO** (seul à avoir l'app).
- [x] **Décision de packaging tranchée** : le bundle **embarque le serveur** (esbuild →
      un seul fichier ESM, deps inlinées) — zéro prérequis utilisateur (ni pnpm ni tsx,
      Claude Desktop fournit Node) ; le pointeur-vers-dépôt reste la voie « manuelle »
      documentée à part. Manifest MCPB 0.3, `user_config.project_root` type `directory`.
- [x] Doc utilisateur mise à jour pour mener par le `.mcpb` : guide versionné
      (`docs/brancher-supervision-claude-desktop.md`, PR #37) + pages publiées (guide
      principal + page « configuration manuelle » séparée), relues par 2 personas
      (utilisateur LLM lambda, vulgarisateur doc) — corrections intégrées.
- [ ] Distribution : où vit le `.mcpb` téléchargeable (release GitHub ? page vectorz ?) —
      aujourd'hui : `dist/` local (gitignoré) + reconstruction en une commande.

## Notes

- **Priorité P2 proposée** (à confirmer au grooming) — capturée en `idea` : direction du
  PO, pas encore cadrée.
- **Tirée le 2026-07-19 sur décision PO explicite** (« il me faudrait tout de suite un
  mcpb ») — soupape journalisée (fiche non ready-gatée) ; passée `in-progress`.
  Construit ce jour : `bin/build-mcpb.sh` + preuve protocole (cf. AC1). Clôture quand le
  double-clic réel est constaté par le PO et la distribution tranchée.
- **Distinct des connecteurs distants** (Rentila = URL `…/mcp` + OAuth/clé) : l'émetteur
  est **local**, il écrit `.supervision/` sur la machine ; un serveur cloud ne peut pas
  s'y substituer. Donc `.mcpb`, pas « custom connector ».
- Le lot de travail du 2026-07-18 livre **déjà** : la page de config (artefact) + une doc
  utilisateur versionnée (relue en revue adverse). Cette fiche porte le **cran suivant**
  (le vrai un-clic), pas la doc elle-même.
- **Lien [0087](../0087-plugin-claude-code-distribution.md)** (plugin Claude Code) : l'autre
  volet packaging, côté **Claude Code**. Le slot `.mcp.json` d'un plugin porterait le même
  serveur de supervision que ce `.mcpb` — même serveur, deux canaux. La AC ouverte ci-dessus
  (« où vit le `.mcpb` téléchargeable ») et la question de marketplace de 0087 **peuvent se
  résoudre au même endroit** : à instruire ensemble, pas séparément.
- Réfs : fiche 0050 (kit émetteur, shippé), fiche 0060 (vz-product-builder exige le kit),
  doc Anthropic « Desktop Extensions / MCPB ».
