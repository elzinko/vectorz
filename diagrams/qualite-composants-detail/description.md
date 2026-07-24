Le diagramme de composants **détaillé** de l'observabilité qualité — la vue « comment tout
s'emboîte » demandée par le PO le 2026-07-24 pour débattre, issue de l'analyse multi-lentilles
(plateformes / architecture / produit, chacune passée en réfutation adverse).

Cinq zones :

- **Toi & tes écrans** (bleu) : le développeur/PO, la PR GitHub, mission-control (courbes,
  fiche 0056). En pointillé rose : le **commentaire qualité de PR** (fiche 0058 proposée) et la
  **visualisation de la méthode** (fiche 0060 proposée) — pas encore fichés.
- **CI — la méthode exécute** (violet + ambre) : les hooks post-build/post-test lancent les
  **outils locaux zéro-compte** (vitest lcov, jscpd, osv-scanner) et, plus tard, les **outils
  SaaS** (pointillé : optionnels, chaque provisioning = proposition approuvée par le PO qui crée
  lui-même le compte). Les outils produisent des **artefacts déterministes** (fichiers lcov/json/
  sarif). La **config de collecte** (côté produit : outil, déclencheur, artefact) est séparée de
  la **config des seuils** (côté méthode) — correction du réfutateur : un seul fichier aurait
  recouplé les deux domaines.
- **Mesure tierce** (gris) : le **mesureur tiers** lit l'artefact et appende `quality.measured`
  via **MetricSink**, porte d'écriture unique.
- **Données & compute — vectorz** (vert) : le journal **`.quality/`** (append-only,
  `schema_version`), le journal **`.improvement/lifecycle.jsonl`** (propositions/approbations,
  ADR-030) derrière son propre **script d'append** (porte unique — correction du réfutateur : ni
  la rétro ni le PO n'écrivent jamais directement), et les **vues DuckDB** qui projettent les KPI
  (commit → PR → sprint → version) sans 2ᵉ entrepôt.
- **Méthode & gouvernance — mega-city** (violet) : la **règle abstraite** (« couverture ≥
  seuil »), la **config seuils**, le **gate DoD fail-closed** (lit la valeur déjà mesurée, jamais
  l'outil en direct), et la **rétro** qui propose (outil, seuil, règle) — approbation PO
  deny-all avec preuve externe.

Invariants portés par le schéma : la méthode auditée n'écrit jamais son chiffre (writer =
tiers) ; le moniteur n'écrit jamais ; le gate n'appelle jamais un adaptateur ; tout franchit les
frontières par **fichiers** (journaux + config), jamais par imports de code ; le SaaS est
toujours optionnel et gated.
