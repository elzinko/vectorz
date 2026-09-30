# Rapport de chasse aux bugs — demo-app — 2026-09-30

<!--
  EXEMPLE RÉEL, produit par une vraie passe ezk-scout sur l'app de démonstration
  `demo-app.mjs` (ses défauts sont volontaires et rejoués par `scripts/test-demo-app.sh`).
  Il sert de référence de forme : `bash scripts/check-report.sh examples/demo-report.md` doit passer.
-->

## En clair

La passe a sondé l'app de démonstration : 12 sondes, moins d'une minute. Elle a trouvé trois défauts à mettre en fiche : l'export plante sur un BPM nul ou négatif, l'export plante aussi quand le dossier de sortie n'est pas inscriptible, et le recadrage accepte des bornes absurdes. Rien n'a été modifié. Dis-moi lesquels entrent au backlog.

**4 trouvées · 3 fichées · 1 écartées**

« fichées » = retenues comme **brouillon de fiche** dans ce rapport. **Aucune carte n'est créée**
tant que tu n'as pas dit lesquelles entrent au backlog. Invariant : N = M + K.

## Cadre de la passe

- **Cible** : demo-app (HTTP, sans interface : sondes `curl` seulement, pas de navigateur), lancée en local sur un port libre, commit 4f87b4d du dépôt de démonstration
- **Lentille** : bugs
- **Bornes** : sondes 12/30 · durée 1/15 min
- **Garde find-only** : find-only : OK — 1 dépôt · target HEAD 4f87b4d · arbre, refs et worktree inchangés

## Isolation de l'état

- fichiers d'export : `DEMO_STATE_DIR` pointé vers un dossier tmp jetable (sans cela l'app écrit sous `~/.demo-app`, le vrai HOME)
- HOME : redirigé vers un dossier tmp vide, vérifié toujours vide après la passe
- réseau : port libre choisi par le système (`PORT=0`), écoute sur 127.0.0.1 seulement
- base de données et services externes : aucun dans cette app, rien d'autre à isoler

## Brouillons de fiche

### B1 — L'export plante (500) sur un BPM nul ou négatif

- **Type / priorité suggérés** : bug · P2
- **Gravité** : majeure
- **En clair** : Demander un export avec un BPM à 0 ou négatif fait planter la requête sans message. L'utilisateur ne sait pas ce qui ne va pas, alors qu'un refus clair suffirait.
- **Reproduction** (rejouable) :
  1. `DEMO_STATE_DIR=$(mktemp -d) PORT=4173 node products/mega-city/skills/ezk-scout/examples/demo-app.mjs &`
  2. `curl -s -w ' [HTTP %{http_code}]\n' -X POST http://127.0.0.1:4173/export -d '{"bpm":0}'`
  3. Même résultat avec `{"bpm":-5}`.
- **Attendu / obtenu** : refus clair (400) avec la raison / 500 avec un corps vide
- **Localisation probable** *(indice non garanti)* : `products/mega-city/skills/ezk-scout/examples/demo-app.mjs:39`
- **Anti-doublon** : aucune fiche équivalente dans le backlog de démonstration (vide)

### B2 — L'export plante (500) quand le dossier de sortie n'est pas inscriptible

- **Type / priorité suggérés** : bug · P2
- **Gravité** : majeure
- **En clair** : Si le dossier choisi pour l'export ne peut pas être créé, l'app répond par une erreur serveur opaque au lieu d'expliquer que le dossier est inutilisable.
- **Reproduction** (rejouable) :
  1. Serveur lancé comme en B1.
  2. `curl -s -w ' [HTTP %{http_code}]\n' -X POST http://127.0.0.1:4173/export -d '{"bpm":120,"dir":"/dev/null/sous"}'`
- **Attendu / obtenu** : 4xx qui nomme le dossier et la cause / 500 avec un corps vide
- **Localisation probable** *(indice non garanti)* : `products/mega-city/skills/ezk-scout/examples/demo-app.mjs:40`
- **Anti-doublon** : aucune fiche équivalente dans le backlog de démonstration (vide)

### B3 — Le recadrage accepte des bornes absurdes

- **Type / priorité suggérés** : bug · P3
- **Gravité** : mineure
- **En clair** : Recadrer de 9 à 2 est accepté et renvoie une durée négative. Des bornes négatives ou absentes passent aussi. Rien ne plante, mais le résultat n'a pas de sens.
- **Reproduction** (rejouable) :
  1. Serveur lancé comme en B1.
  2. `curl -s -w ' [HTTP %{http_code}]\n' -X POST http://127.0.0.1:4173/crop -d '{"start":9,"end":2}'`
  3. Variantes acceptées à tort : `{"start":-3,"end":-1}` et `{}` (durée nulle).
- **Attendu / obtenu** : 400 quand la fin précède le début ou qu'une borne manque / 200 avec `{"duration":-7}`
- **Localisation probable** *(indice non garanti)* : `products/mega-city/skills/ezk-scout/examples/demo-app.mjs:48`
- **Anti-doublon** : aucune fiche équivalente dans le backlog de démonstration (vide)

## Écartées

- Export avec un BPM texte ou absent (500) — raison : même cause que B1 (aucune validation de `bpm`), à traiter dans la même fiche

## Pour valider (toi)

Dis quels brouillons entrent au backlog (ex. « B1 et B3 »). Alors seulement, `ezk-scout file`
appelle `ezk-backlog add` pour ceux-là : chaque fiche naît `idea`, étiquetée `scout`.
Les autres restent dans ce rapport, rien n'est créé.
