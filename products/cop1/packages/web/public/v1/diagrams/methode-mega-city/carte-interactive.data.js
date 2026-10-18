// Généré — NE PAS committer (ADR-0055). Reconstruit par `pnpm --dir products/mega-city views:regen`, servi à la volée par `ezk:map`.
/*ezk-map-data:begin*/
window.EZK = {
 "counts": {
  "rules": 87,
  "agents": 8,
  "skills": 26,
  "bundles": 11,
  "profiles": 6,
  "tools": 101
 },
 "liens": {
  "total": 301,
  "casses": 0
 },
 "provenance": {
  "prouve": {
   "briques": 239,
   "liens": 301,
   "ceremonies": 16,
   "cycle": 9,
   "assemblage": 0
  },
  "deduit": {
   "briques": 0,
   "liens": 0,
   "ceremonies": 0,
   "cycle": 7,
   "assemblage": 1
  }
 },
 "assemblage": {
  "nodes": {
   "rule": 87,
   "agent": 8,
   "skill": 26,
   "bundle": 11,
   "profile": 6,
   "tool": 101
  },
  "arrows": [
   {
    "from": "agent",
    "verb": "applique",
    "to": "bundle",
    "count": 2
   },
   {
    "from": "agent",
    "verb": "applique",
    "to": "rule",
    "count": 1
   },
   {
    "from": "agent",
    "verb": "compose",
    "to": "skill",
    "count": 3
   },
   {
    "from": "bundle",
    "verb": "compose",
    "to": "bundle",
    "count": 1
   },
   {
    "from": "bundle",
    "verb": "compose",
    "to": "rule",
    "count": 76
   },
   {
    "from": "profile",
    "verb": "compose",
    "to": "agent",
    "count": 22
   },
   {
    "from": "profile",
    "verb": "compose",
    "to": "bundle",
    "count": 14
   },
   {
    "from": "profile",
    "verb": "compose",
    "to": "profile",
    "count": 5
   },
   {
    "from": "profile",
    "verb": "compose",
    "to": "skill",
    "count": 49
   },
   {
    "from": "rule",
    "verb": "est-verifie-par",
    "to": "agent",
    "count": 33
   },
   {
    "from": "skill",
    "verb": "applique",
    "to": "rule",
    "count": 19
   },
   {
    "from": "skill",
    "verb": "compose",
    "to": "skill",
    "count": 24
   },
   {
    "from": "skill",
    "verb": "convoque",
    "to": "agent",
    "count": 6
   },
   {
    "from": "skill",
    "verb": "utilise",
    "to": "tool",
    "count": 46
   }
  ],
  "bind": {
   "source": "products/mega-city/src/core/bind.ts",
   "adr": "products/mega-city/docs/adr/0003-moteur-bind-plan-pur-coquille-io.md"
  }
 },
 "orphans": [
  {
   "kind": "rule",
   "id": "development/yaml-emission-via-lib"
  },
  {
   "kind": "rule",
   "id": "documentation-guidelines/changelog"
  },
  {
   "kind": "rule",
   "id": "documentation-guidelines/contributing-guide"
  },
  {
   "kind": "rule",
   "id": "documentation-guidelines/proven-outbound-references"
  },
  {
   "kind": "rule",
   "id": "documentation-guidelines/readme-structure"
  },
  {
   "kind": "rule",
   "id": "documentation-guidelines/user-guide"
  },
  {
   "kind": "rule",
   "id": "hexagonal/adapter-location"
  },
  {
   "kind": "rule",
   "id": "hexagonal/dependency-inversion"
  },
  {
   "kind": "rule",
   "id": "hexagonal/domain-isolation"
  },
  {
   "kind": "rule",
   "id": "hexagonal/shared-libs-no-config"
  },
  {
   "kind": "rule",
   "id": "hexagonal/wiring-at-edge"
  },
  {
   "kind": "rule",
   "id": "recipe/indexed"
  },
  {
   "kind": "rule",
   "id": "recipe/lists-tasks-and-composes"
  },
  {
   "kind": "rule",
   "id": "recipe/no-stored-code"
  },
  {
   "kind": "rule",
   "id": "recipe/plain-language-first"
  },
  {
   "kind": "rule",
   "id": "recipe/points-to-real-example"
  },
  {
   "kind": "rule",
   "id": "recipe/tools-capability-first"
  },
  {
   "kind": "rule",
   "id": "recipe/valid-frontmatter"
  },
  {
   "kind": "rule",
   "id": "ux/no-layout-shift"
  },
  {
   "kind": "skill",
   "id": "supervision-analyze"
  },
  {
   "kind": "skill",
   "id": "supervision-demo"
  },
  {
   "kind": "skill",
   "id": "vz-product-builder"
  },
  {
   "kind": "profile",
   "id": "cop1-target"
  },
  {
   "kind": "profile",
   "id": "daily"
  },
  {
   "kind": "profile",
   "id": "desktop"
  },
  {
   "kind": "profile",
   "id": "global"
  },
  {
   "kind": "profile",
   "id": "mobile"
  },
  {
   "kind": "tool",
   "id": "bin/build-mcpb.sh"
  },
  {
   "kind": "tool",
   "id": "bin/recipe-frontmatter.ts"
  },
  {
   "kind": "tool",
   "id": "bin/supervision-demo-run.ts"
  },
  {
   "kind": "tool",
   "id": "skills/ezk-archive/scripts/lib-worktree-safety.sh"
  },
  {
   "kind": "tool",
   "id": "skills/ezk-commits/scripts/commit-msg"
  },
  {
   "kind": "tool",
   "id": "skills/ezk-pr/scripts/integrate-push-ff.sh"
  }
 ],
 "method": {
  "elements": [
   {
    "id": "grooming",
    "type": "ceremonie",
    "nom": "Grooming / Refinement",
    "scrum": "Product Backlog Refinement",
    "etat": "fidele",
    "implemente_par": [
     "ezk-backlog:groom",
     "ezk-backlog:review"
    ],
    "note": "Activité continue : le groom se fait au tirage d'une fiche (ADR-0016), la passe globale par `review`. La Definition of Ready est le cran de sortie."
   },
   {
    "id": "gate-ready",
    "type": "ceremonie",
    "nom": "Gate « ready » (DoR)",
    "scrum": "— (cran maison, hors Guide)",
    "etat": "fidele",
    "implemente_par": [
     "ezk-backlog:ready"
    ],
    "note": "Le gate bloquant qui promeut une fiche en « tirable » : problème / valeur / critères vérifiés, fiche passée en `status: ready` (la colonne). Maison, assumé (ADR-0016)."
   },
   {
    "id": "planning",
    "type": "ceremonie",
    "nom": "Le tirage",
    "scrum": "Sprint Planning",
    "etat": "adapte",
    "implemente_par": [
     "ezk-backlog:next",
     "ezk-backlog:plan",
     "ezk-sprint",
     "ezk-product-build"
    ],
    "note": "Éclaté : le QUOI = `next --ready-only` (une fiche, pop mécanique) ; l'ORDRE = `plan` (PLAN.md) ; le COMMENT = les étapes 0-2 du sprint (intake, cadrage, archi). Pas de sélection multiple négociée — du réapprovisionnement kanban de qualité."
   },
   {
    "id": "daily",
    "type": "ceremonie",
    "nom": "Daily Scrum",
    "scrum": "Daily Scrum",
    "etat": "a-implementer",
    "implemente_par": [],
    "note": "Aucun équivalent. Absence ASSUMÉE pour l'instant (panel 2026-08-23 : aucune douleur documentée) — seul analogue : le heartbeat de supervision. Si une douleur se documente, une fiche dédiée s'ouvre."
   },
   {
    "id": "sprint",
    "type": "ceremonie",
    "nom": "Le run (« sprint » maison)",
    "scrum": "Sprint (le conteneur)",
    "etat": "adapte",
    "implemente_par": [
     "ezk-sprint:start",
     "ezk-sprint:close",
     "ezk-sprint:run",
     "ezk-sprint:check",
     "ezk-archive:run"
    ],
    "note": "Un lot de stories (1 story = 1 branche = 1 PR) qui produit un incrément, SANS timebox (écart connu). Ouvert par `ezk-sprint:start`, fermé par `ezk-sprint:close` qui scelle l'incrément (ADR-0054). `check` = `start --dry-run` (le portier en lecture seule, ex-ezk-start) ; `run` = le cycle complet. La clôture de SESSION est un autre étage : `ezk-archive:run` (hygiène d'hôte, hors scrum)."
   },
   {
    "id": "review",
    "type": "ceremonie",
    "nom": "La livraison (release gate)",
    "scrum": "Sprint Review",
    "etat": "adapte",
    "implemente_par": [
     "ezk-sprint"
    ],
    "note": "Portée par le SPRINT (ezk-pr est un module GitHub OPTIONNEL, hors implémenteur). Ce n'est PAS une Sprint Review (pas d'inspection avec parties prenantes) : gate + revue adverse + squash-merge (étapes 6/7/9-10 du sprint). La seule « review » réelle est le checkpoint inter-sprint où l'humain inspecte le livré."
   },
   {
    "id": "retro",
    "type": "ceremonie",
    "nom": "La rétro",
    "scrum": "Sprint Retrospective",
    "etat": "fidele",
    "implemente_par": [
     "ezk-retro:run"
    ],
    "note": "Round-robin des agents → propositions typées (symptôme + mesure) → juge de cohérence → rangement sous contrôle PO. À la demande (après un ou plusieurs runs), pas à cadence fixe — écart connu, toléré."
   },
   {
    "id": "product-backlog",
    "type": "artefact",
    "nom": "Product Backlog",
    "scrum": "Product Backlog",
    "etat": "fidele",
    "implemente_par": [
     "ezk-backlog"
    ],
    "note": "`features/*.md` commités sur main, front-matter = source de vérité, index régénéré (BACKLOG.md). La fiche est le Product Backlog Item."
   },
   {
    "id": "sprint-backlog",
    "type": "artefact",
    "nom": "Sprint Backlog",
    "scrum": "Sprint Backlog",
    "etat": "adapte",
    "implemente_par": [
     "ezk-backlog:next",
     "ezk-sprint"
    ],
    "note": "`SPRINT.md` éphémère (gitignoré) : le LOT du sprint, une ligne par story, une PR chacune (`[ ]` ouverte · `[x]` livrée · `[~]` reportée, ADR-0054). `ezk-backlog:next --lot N` le choisit (N fiches prêtes, ordre du plan), `ezk-sprint:start` l'écrit, `ezk-sprint:close` le scelle ; les ids des stories non livrées restent dans les incréments scellés de la session. Le panel a constaté sa corruption par l'entrelacement de chantiers — pièce au dossier de la vue d'avancement."
   },
   {
    "id": "increment",
    "type": "artefact",
    "nom": "L'increment",
    "scrum": "Increment",
    "etat": "adapte",
    "implemente_par": [
     "ezk-sprint"
    ],
    "note": "Les fiches du lot passées `shipped`, donc leurs PR squash-mergées sur main (étapes 8-10 du sprint) ; `ezk-sprint:close` le scelle, livraison groupée possible par ezk-pr. Aucun objet « sprint » persistant (ADR-0054) : les fiches et l'historique git suffisent."
   },
   {
    "id": "dod",
    "type": "artefact",
    "nom": "Definition of Done",
    "scrum": "Definition of Done",
    "etat": "adapte",
    "implemente_par": [
     "ezk-sprint"
    ],
    "note": "Deux sens mélangés aujourd'hui (panel B-4) : les scénarios Gherkin (= critères d'acceptation par fiche) et la checklist de sortie (gate verte, E2E, revue GO). La séparation des mots est au lot vocabulaire du plan."
   },
   {
    "id": "product-goal",
    "type": "artefact",
    "nom": "Product Goal",
    "scrum": "Product Goal",
    "etat": "a-implementer",
    "implemente_par": [],
    "note": "Zéro occurrence dans le dépôt avant le 2026-08-23. Premier pas posé : une ligne en tête de `features/PLAN.md` (brouillon à valider/réécrire par le PO)."
   },
   {
    "id": "sprint-goal",
    "type": "artefact",
    "nom": "Sprint Goal",
    "scrum": "Sprint Goal",
    "etat": "assume",
    "implemente_par": [],
    "note": "Assumé ≡ l'objectif donné à l'ouverture (`ezk-sprint:start --objective`, titre de `SPRINT.md`) : une ligne libre, pas un artefact validé. Avant le lot (ADR-0054), un run = une seule fiche et son but ÉTAIT la fiche tirée (verdict du panel du 2026-08-23, B-5) : ce cadre n'existe plus, le sprint porte plusieurs stories."
   },
   {
    "id": "po",
    "type": "role",
    "nom": "Product Owner",
    "scrum": "Product Owner",
    "etat": "fidele",
    "implemente_par": [
     "humain",
     "agent:ezk-pm",
     "ezk-product-build"
    ],
    "note": "L'humain arbitre toujours (4 décisions réservées) ; `ezk-pm` décide par délégation ; la couche product-builder orchestre. « Toi » n'est pas encore un objet du modèle — constat pour la refonte."
   },
   {
    "id": "sm",
    "type": "role",
    "nom": "Scrum Master",
    "scrum": "Scrum Master",
    "etat": "adapte",
    "implemente_par": [
     "ezk-sprint"
    ],
    "note": "Porté par le SKILL ezk-sprint (« tu es le scrum master ») qui exécute et juge — le contraire du SM du Guide (servir, établir). Débaptisage prévu au lot vocabulaire ; le SM effectif = LA LOI compilée + la rétro."
   },
   {
    "id": "developers",
    "type": "role",
    "nom": "Developers",
    "scrum": "Developers",
    "etat": "adapte",
    "implemente_par": [
     "agent:ezk-architect",
     "agent:ezk-dev",
     "agent:ezk-qa",
     "agent:ezk-reviewer"
    ],
    "note": "Éclatés en 4 juges spécialisés convoqués par le sprint — pas une équipe auto-gérée, un pipeline à rôles. La vraie valeur : la seconde opinion inter-modèles (dev et reviewer sur des modèles différents)."
   }
  ]
 },
 "methodSource": "products/mega-city/method/ceremonies.yml",
 "taxonomieSource": "products/mega-city/taxonomie.yml",
 "cycle": [
  {
   "n": 1,
   "t": "La fiche",
   "scrum": "Product Backlog",
   "p": "Le PO capture le besoin, la fiche mûrit jusqu’à « ready ».",
   "etape": [
    {
     "id": "ezk-backlog",
     "prouve": true,
     "via": "ceremonies.yml › product-backlog"
    }
   ],
   "acteurs": [],
   "humains": [
    "Toi (PO)"
   ]
  },
  {
   "n": 2,
   "t": "Le tirage",
   "scrum": "≈ Sprint Planning",
   "p": "La prochaine fiche prête est tirée ; en mode auto, ezk-pm décide à ta place.",
   "etape": [
    {
     "id": "ezk-product-build",
     "prouve": true,
     "via": "ceremonies.yml › planning"
    }
   ],
   "acteurs": [
    {
     "id": "ezk-pm",
     "prouve": true,
     "via": "roles: ezk-product-build"
    }
   ],
   "humains": [
    "Toi (PO)"
   ]
  },
  {
   "n": 3,
   "t": "Le run",
   "scrum": "≈ Sprint (un lot de stories)",
   "p": "Un sprint est un lot de stories, une PR chacune, qui produit un incrément : ouvert par start, fermé par close. La boucle BDD/TDD construit chaque story en convoquant les juges.",
   "etape": [
    {
     "id": "ezk-sprint",
     "prouve": true,
     "via": "ceremonies.yml › sprint"
    }
   ],
   "acteurs": [
    {
     "id": "ezk-architect",
     "prouve": true,
     "via": "roles: ezk-sprint"
    },
    {
     "id": "ezk-dev",
     "prouve": true,
     "via": "roles: ezk-sprint"
    },
    {
     "id": "ezk-qa",
     "prouve": true,
     "via": "roles: ezk-sprint"
    },
    {
     "id": "ezk-reviewer",
     "prouve": true,
     "via": "roles: ezk-sprint"
    }
   ],
   "humains": []
  },
  {
   "n": 4,
   "t": "La livraison",
   "scrum": "release gate — ≠ Sprint Review",
   "p": "Gate + revue, puis squash-merge — dans le flux nominal, par le sprint lui-même ; ezk-pr pilote le stock de PRs en attente.",
   "etape": [
    {
     "id": "ezk-pr",
     "prouve": false
    },
    {
     "id": "ezk-codex",
     "prouve": false
    }
   ],
   "acteurs": [],
   "humains": [
    "Toi (PO)",
    "Codex (bot)"
   ]
  },
  {
   "n": 5,
   "t": "La rétro",
   "scrum": "≈ Rétrospective (à la demande)",
   "p": "Après un ou plusieurs runs : l’équipe inspecte la méthode elle-même.",
   "etape": [
    {
     "id": "ezk-retro",
     "prouve": true,
     "via": "ceremonies.yml › retro"
    }
   ],
   "acteurs": [],
   "humains": [
    "Toi (PO)"
   ]
  }
 ],
 "bandes": {
  "ceremonies": [
   "ezk-product-build",
   "ezk-sprint",
   "ezk-retro",
   "ezk-release",
   "ezk-bug",
   "ezk-scout"
  ],
  "artefacts": [
   "ezk-backlog"
  ],
  "hors-bande": []
 },
 "skills": {
  "ezk-apk": {
   "id": "ezk-apk",
   "source": "products/mega-city/skills/ezk-apk/SKILL.md",
   "description": "Build an installable preview APK (or IPA) on Expo EAS and hand the user an install link + QR, to demo or try a mobile (Expo / React Native) PR on a real device — including over 4G, with no adb, USB, Tailscale or debugging. Use whenever the user wants to \"share a build\", \"send me an APK\", \"test this PR on my phone\", \"install the app to try a feature\", \"give me a QR to install\", or demo a mobile branch to a tester or stakeholder. Walks through the EXPO_TOKEN setup, the eas preview profile, building, and returning the install link. Crucially covers the pnpm-monorepo gotchas that break EAS release builds while leaving debug builds working (expo-asset, node-linker=hoisted, building workspace TS deps), and validating the release compile locally first to avoid burning EAS queue time.",
   "usage": "[help|build|link|status|check|setup]",
   "etage": "modules",
   "famille": "techno",
   "composes": [],
   "composesExternal": [],
   "roles": [],
   "composedBy": [],
   "tools": [
    "skills/ezk-apk/scripts/build-preview-apk.sh"
   ],
   "profiles": [
    "global"
   ]
  },
  "ezk-archive": {
   "id": "ezk-archive",
   "source": "products/mega-city/skills/ezk-archive/SKILL.md",
   "description": "CLÔTURE de session avant archivage (une capacité de continuité, pas une étape agile) : clôt proprement un repo pour ne RIEN perdre entre deux sessions. Une session sans rien à sauver sort en une ligne « rien à archiver ». A utiliser quand l'utilisateur veut « archiver / clôturer une session », « fermer proprement avant de partir », « ne rien perdre entre deux sessions », préparer un « handoff » pour la prochaine session, ou demande « on archive ? » « avant de fermer ». Pilotable par sous-commandes : help, check (dry-run strictement read-only : produit le rapport de clôture), run/close (applique les corrections sûres — ship/regen du backlog, mémoire — et produit la note de handoff). Un script portier (`scripts/check.sh`) rend un verdict CLEAN/DIRTY sur 4 points de contrôle : working tree + stashes, PRs & branches non-mergées (crucial pour les repos sans remote), fiches déclarées livrées, ADR de la session ; sur CLEAN la clôture est traitée directement, sur DIRTY elle est déléguée au sous-agent, scopée aux points signalés. Produit toujours la note de handoff persistée hors du worktree (`\u003cgit-common-dir>/ezk/handoff.md`, anneau FIFO) et le verdict archivable/pending. Ne merge/push JAMAIS tout seul ; hygiène de clôture uniquement (pas du scrum/sprint — ça, c'est ezk-sprint).",
   "usage": "[help|check|run]",
   "etage": "modules",
   "famille": "hote-llm",
   "composes": [],
   "composesExternal": [],
   "roles": [],
   "composedBy": [],
   "tools": [
    "skills/ezk-archive/scripts/archive-commit.sh",
    "skills/ezk-archive/scripts/archive-progress.sh",
    "skills/ezk-archive/scripts/check.sh",
    "skills/ezk-archive/scripts/handoff.sh"
   ],
   "profiles": [
    "base",
    "daily",
    "global"
   ]
  },
  "ezk-article": {
   "id": "ezk-article",
   "source": "products/mega-city/skills/ezk-article/SKILL.md",
   "description": "Écrit ou réécrit un ARTICLE TECHNIQUE VULGARISÉ (blog, doc d'archi grand public, README long) avec un cadrage de persona explicite et une boucle de relecture par PANEL de relecteurs frais. A utiliser quand l'utilisateur veut « écrire / rédiger un article », « vulgariser » un sujet technique, réécrire un article existant pour le rendre lisible, faire relire un texte par un panel, ou publier un billet de blog technique accessible. Pilotable par sous-commandes : help, new (matière + brief persona → article), revise (vN → vN+1, versions côte à côte conservées), panel (la boucle de relecture seule, sur un texte existant). Demande TOUJOURS le brief de persona/audience au demandeur s'il est absent (jamais de défaut silencieux) ; panel de 5 lentilles SANS contexte de session (lecteur cible zéro-contexte, juge essais techniques, copy-editor, fidélité aux sources, accessibilité des références) puis contre-lecture finale à froid comme gate de publication. N'EST PAS un outil de doc de référence/spec (structure imposée par le domaine), ni le promoteur de l'article (ça, c'est ezk-marketing).",
   "usage": "[help|new|revise|panel]",
   "etage": "modules",
   "famille": "techno",
   "composes": [
    "ezk-diagram"
   ],
   "composesExternal": [],
   "roles": [],
   "composedBy": [],
   "tools": [],
   "profiles": [
    "global"
   ]
  },
  "ezk-backlog": {
   "id": "ezk-backlog",
   "source": "products/mega-city/skills/ezk-backlog/SKILL.md",
   "description": "Suit le backlog de features/bugs d'un projet en markdown versionné, pour ne jamais les perdre entre worktrees ni entre sessions. A utiliser quand l'utilisateur demande « c'est quoi la suite / les prochaines features », veut initialiser le suivi des features d'un projet, ajouter/noter une idée ou un bug (avec dédoublonnage), groomer une fiche vers la Definition of Ready (« elle est ready ? »), passer le backlog en revue (sanity check), demander la prochaine fiche tirable, regrouper des fiches, marquer une feature livrée, réconcilier le statut des fiches avec l'état réel des PRs mergées (merges faits hors du flux, ex. UI GitHub), (re)prioriser, cibler une version/jalon, dire où en est une version et la clore, ou voir l'état du backlog. Pilotable par sous-commandes : help, init, list, add, groom, ready, next, plan, review, reconcile, ship, regen, aggregate, version. A la première invocation dans un projet, INITIALISE la structure (dossier features/, sous-dossier done/, fichier de suivi index) ; ensuite charge le backlog trié par priorité en contexte de session. Format léger : une fiche markdown par sujet, front-matter YAML = source de vérité du statut, index régénéré. Se branche sur ezk-sprint (qui pioche la prochaine fiche) et ezk-commits. Si le repo a déjà sa convention (roadmap/, docs/specs…), l'épouser plutôt que d'en imposer une.",
   "usage": "[help|init|list|add|groom|ready|next|plan|review|reconcile|ship|regen|aggregate|version]",
   "etage": "methode",
   "bande": "artefacts",
   "composes": [
    "ezk-commits"
   ],
   "composesExternal": [],
   "roles": [],
   "composedBy": [
    "ezk-bug",
    "ezk-ezk",
    "ezk-pr",
    "ezk-product-build",
    "ezk-readme",
    "ezk-retro",
    "ezk-scout",
    "ezk-sprint",
    "vz-product-builder"
   ],
   "tools": [
    "bin/check-links.sh",
    "bin/portfolio.sh",
    "bin/regen-backlog.sh",
    "skills/ezk-backlog/scripts/apply-002-readme-vs-backlog.sh",
    "skills/ezk-backlog/scripts/apply-003-statuts-colonnes.sh",
    "skills/ezk-backlog/scripts/apply-005-retrait-champ-ready.sh",
    "skills/ezk-backlog/scripts/check-layout-version.sh",
    "skills/ezk-backlog/scripts/mint-id.sh",
    "skills/ezk-backlog/scripts/regen-backlog.sh",
    "skills/ezk-backlog/scripts/resolve-regen-backlog.sh",
    "skills/ezk-pr/scripts/ship-in-pr.sh"
   ],
   "profiles": [
    "cop1-target",
    "daily",
    "desktop",
    "global"
   ]
  },
  "ezk-bug": {
   "id": "ezk-bug",
   "source": "products/mega-city/skills/ezk-bug/SKILL.md",
   "description": "Skill d'intake/cadrage d'un BUG signalé : transforme un rapport brut (« c'est cassé ») en fiche `type: bug` reproductible et exploitable (procédure, attendu/ obtenu, preuve), puis la file via `ezk-backlog add`. A utiliser quand l'utilisateur SIGNALE un bug à cadrer, veut « transformer ce bug en fiche », « reproduire et documenter un bug », « faire l'intake d'un bug », ou quand `ezk-backlog add` rencontre un bug vague à confirmer. COMPOSE le Playwright MCP partagé (pilotage de l'app + screenshot-preuve, chargé via ToolSearch — le MÊME que `ezk-qa`, pas emprunté à son rôle) pour la repro, et `ezk-backlog add` (anti-doublon + cadrage) pour le filing. Repro BORNÉE (timeout / max-tentatives) ; un harnais indisponible produit QUAND MÊME une fiche (`hors-portée`). N'EST PAS la validation d'une PR ni la rédaction de Gherkin (ça, c'est `ezk-qa`, en avant dans la boucle ezk-sprint) : `ezk-bug` confirme EN ARRIÈRE un symptôme signalé, en amont du backlog. Glue mince : ne gonfle ni `ezk-qa` ni `ezk-backlog`.",
   "usage": "[help|intake]",
   "etage": "methode",
   "bande": "ceremonies",
   "composes": [
    "ezk-backlog"
   ],
   "composesExternal": [
    "product-brainstorming"
   ],
   "roles": [],
   "composedBy": [],
   "tools": [],
   "profiles": [
    "global"
   ]
  },
  "ezk-chef": {
   "id": "ezk-chef",
   "source": "products/mega-city/skills/ezk-chef/SKILL.md",
   "description": "Hub de la famille d'artefacts « recette » (recipes/*.md) — le point d'entrée verbes pour tout ce qui touche une recette. A utiliser quand l'utilisateur veut « fais-en une recette », « capitalise cette feature en recette », « extrais une recette depuis la fiche X », « ezk-chef », « vérifie / valide cette recette », « détecter les candidats-recette d'un sprint qui vient de finir », « range le livre des recettes », ou liste ce qui existe déjà comme recette. Pilotable par sous-commandes : help, check (délègue le jugement à l'agent `ezk-chef` — gate mécanique + verdict GO/NO-GO), extract (produit un BROUILLON de recette `status: draft` depuis une fiche déjà shippée ; extraction depuis une implémentation de référence d'un autre projet : à venir), suggest (lecture seule : lit le rapport + les récits d'un sprint fini et PROPOSE des candidats-recette, sans rien créer — invoquée par la rétro), regen/list (réécrit `recipes/RECIPES.md` via `regen-recipes.sh`). Orchestrateur MINCE, façon `ezk-backlog` : il ne réimplémente pas le jugement de l'agent `ezk-chef` (déjà livré) ni le régénérateur du livre (déjà livré) — il les COMPOSE et ajoute la partie mécanique manquante (`extract`, `suggest`). N'EST PAS `ezk-ezk` (qui fabrique des *skills*, pas des recettes) ; `ezk-chef scan` (sourcer des repos froids, fiche 0147) est différé.",
   "usage": "[help|check|extract|suggest|regen|list]",
   "etage": "librairie",
   "composes": [],
   "composesExternal": [],
   "roles": [],
   "composedBy": [
    "ezk-retro"
   ],
   "tools": [
    "bin/ezk-chef-extract.sh",
    "bin/ezk-chef-suggest.ts",
    "bin/regen-recipes.sh",
    "skills/ezk-backlog/scripts/mint-id.sh"
   ],
   "profiles": [
    "global"
   ]
  },
  "ezk-ci": {
   "id": "ezk-ci",
   "source": "products/mega-city/skills/ezk-ci/SKILL.md",
   "description": "Validate GitHub Actions pipelines locally with act + Docker before pushing or committing, AND watch/cap the cloud-side GHA consumption of private repos. Use whenever the user asks to run CI locally, mentions GitHub Actions billing exhaustion (spending limit, billing exceeded, out of GHA minutes), asks how many Actions minutes a repo burns or which workflows cost the most, wants to cap spending on a private repo, makes a repo private (key cost moment), wants a frugal CI (paths-ignore, concurrency, gated heavy jobs), reports a workflow failure they want to debug without burning runner minutes, edits a file under .github/workflows/, or needs to test a .yml workflow. Also covers macOS jobs that must run on the host because Docker has no macOS image, and a bootstrap path for projects with no local CI setup yet.",
   "usage": "[help|check|list|dryrun|run|native|bootstrap|conso|frugal|harden]",
   "etage": "modules",
   "famille": "techno",
   "composes": [],
   "composesExternal": [],
   "roles": [],
   "composedBy": [
    "ezk-sprint"
   ],
   "tools": [
    "bin/ezk-ci-harden.ts"
   ],
   "profiles": [
    "cop1-target",
    "daily",
    "global"
   ]
  },
  "ezk-codex": {
   "id": "ezk-codex",
   "source": "products/mega-city/skills/ezk-codex/SKILL.md",
   "description": "Adresse les retours du reviewer Codex sur une PR, de bout en bout, sans les retaper à la main. A utiliser quand l'utilisateur veut « fix les retours codex », « adresse / traite les commentaires Codex de la PR X », « Codex a commenté ma PR », « corrige ce que Codex a relevé », ou après un `@codex review` qui a laissé des findings. Pilotable par sous-commandes : help, fix (la boucle complète : récupère les fils Codex non résolus + reviews, écarte le cas 👍 « RAS », les classe P0/P1/P2 + file:line, pour chacun CORRIGE ou DÉCLINE, commit conventional scopé, push, puis RÉPOND en fil et RÉSOUT chaque fil traité (le décliné à la décision, le corrigé après le push), re-déclenche `@codex review`, attend le verdict de façon BORNÉE, rapporte), check (liste les fils Codex non résolus + le verdict courant sans rien écrire). Garde-fou de tête : STAND-DOWN avant toute écriture (PR déjà mergée/fermée, branche pilotée par un autre worktree, commits d'une autre session apparus) → ne rien pousser, rapporter, rendre la main. Cross-repo (samplerz, muti… tout repo GitHub avec Codex branché). N'EST PAS le merge (ça reste `ezk-pr ship` / décision explicite) ni la revue initiale (le premier `@codex review` avant-merge reste décrit par `ezk-sprint`) ; `ezk-sprint` et `ezk-pr` la COMPOSENT au lieu de re-décrire le handling Codex.",
   "usage": "[help|fix|check] [PR]",
   "etage": "modules",
   "famille": "github",
   "composes": [
    "ezk-commits"
   ],
   "composesExternal": [],
   "roles": [],
   "composedBy": [],
   "tools": [],
   "profiles": [
    "global"
   ]
  },
  "ezk-commits": {
   "id": "ezk-commits",
   "source": "products/mega-city/skills/ezk-commits/SKILL.md",
   "description": "Help write Conventional Commits messages and set up a commit-msg hook. Use when the user wants to commit code, asks for help with commit message format, mentions \"conventional commit\", or wants to enforce commit format in a project. Also triggers after implementing a feature or fix when the user asks to create a commit.",
   "usage": "[help|commit|hook|check]",
   "etage": "modules",
   "famille": "techno",
   "composes": [],
   "composesExternal": [],
   "roles": [],
   "composedBy": [
    "ezk-backlog",
    "ezk-codex",
    "ezk-diagram",
    "ezk-pr",
    "ezk-sprint"
   ],
   "tools": [],
   "profiles": [
    "cop1-target",
    "daily",
    "global",
    "mobile"
   ]
  },
  "ezk-design-system": {
   "id": "ezk-design-system",
   "source": "products/mega-city/skills/ezk-design-system/SKILL.md",
   "description": "Create and ENFORCE a lightweight design system (tokens + canonical components + living styleguide) in any web project, and keep every UI change coherent with it. Use when the user mentions \"design system\", \"cohérence visuelle\", \"system design\" (UI sense), \"atomes\", \"librairie de composants\", \"styleguide\", \"storybook\", asks why the UI looks inconsistent, or whenever ANY task adds/modifies UI (buttons, colors, spacing, CSS) in a project that has a docs/design-system.md — read it FIRST and apply its rules. MVP-grade by design: three files, no build system, no heavy tooling — works for vanilla JS/CSS apps served by any backend (Python, Node…). Nomme et rend CONSULTABLE/REQUÊTABLE le vocabulaire complet — Token, Variant, Slot, Pattern, Breakpoint — sur une page /design vivante.",
   "usage": "",
   "etage": "modules",
   "famille": "techno",
   "composes": [],
   "composesExternal": [],
   "roles": [],
   "composedBy": [],
   "tools": [],
   "profiles": [
    "cop1-target",
    "daily",
    "global"
   ]
  },
  "ezk-device": {
   "id": "ezk-device",
   "source": "products/mega-city/skills/ezk-device/SKILL.md",
   "description": "Build, install and live-test an Android app on a PHYSICAL phone that is NOT on the same Wi-Fi/LAN as the computer, by tunnelling adb over a Tailscale mesh VPN. Use this whenever the user wants to run, install, deploy, sideload or test an Android app on a real device remotely — e.g. \"test the app on my phone\", \"I'm away from my desk / travelling and want to try the build\", \"adb won't connect over the network\", \"install the APK on my Android over 4G\", \"debug on my phone from here\" — or any time the phone and the dev machine are on different networks. Walks the user through installing the tools (Tailscale, adb), enabling Android wireless/USB debugging, finding the IP/port/code on the phone, and connecting reliably. Also covers the LAN-only WebRTC caveat (why a public tunnel like ngrok is NOT enough and a mesh VPN is the right tool).",
   "usage": "[help|check|setup|tcpip|connect|run]",
   "etage": "modules",
   "famille": "techno",
   "composes": [],
   "composesExternal": [],
   "roles": [],
   "composedBy": [],
   "tools": [
    "skills/ezk-device/scripts/check-setup.sh",
    "skills/ezk-device/scripts/connect.sh",
    "skills/ezk-device/scripts/deploy-and-launch.sh",
    "skills/ezk-device/scripts/enable-tcpip.sh",
    "skills/ezk-device/scripts/install-tools.sh"
   ],
   "profiles": [
    "global"
   ]
  },
  "ezk-diagram": {
   "id": "ezk-diagram",
   "source": "products/mega-city/skills/ezk-diagram/SKILL.md",
   "description": "Transforme une DESCRIPTION EN PROSE en un diagramme VERSIONNÉ (Mermaid + image), itéré VERBALEMENT — sans jamais écrire de Mermaid à la main. A utiliser quand l'utilisateur veut « faire un schéma / un diagramme », « visualiser une archi / un flux / un organigramme / une machine à états », décrire une structure avec ses mots et obtenir un diagramme, réviser/corriger un diagramme existant en langage naturel, ou versionner / retrouver / dupliquer / supprimer un diagramme entre sessions. Pilotable par sous-commandes : help, add, list, edit, rm, dup, publish. Stocke un artefact versionné par diagramme dans `diagrams/\u003cslug>/` : la prose (source), le diagram-as-code (Mermaid généré), l'image (SVG rendue), une explication LECTEUR (« Ce que montre ce diagramme », assemblée dans le README publié), + un meta. Le LLM synthétise le Mermaid depuis la prose (capacité native, ZÉRO service externe) ; le rendu image est LOCAL (mermaid-cli/`mmdc`). Descriptif d'abord : le diagramme EST l'artefact (comprendre/documenter). N'EST PAS un éditeur Mermaid manuel, ni un service de dessin en ligne, ni un moteur d'exécution — juste « je décris, ça se dessine, je valide, ça se versionne ».",
   "usage": "[help|add|list|edit|rm|dup|publish]",
   "etage": "modules",
   "famille": "techno",
   "composes": [
    "ezk-commits"
   ],
   "composesExternal": [],
   "roles": [],
   "composedBy": [
    "ezk-article"
   ],
   "tools": [
    "skills/ezk-diagram/scripts/publish.sh",
    "skills/ezk-diagram/scripts/render.sh"
   ],
   "profiles": [
    "cop1-target",
    "daily",
    "desktop",
    "global"
   ]
  },
  "ezk-docker": {
   "id": "ezk-docker",
   "source": "products/mega-city/skills/ezk-docker/SKILL.md",
   "description": "Pilot a local Docker stack for TESTING or DEV — spin up, monitor, tear down — directly via the Docker socket (docker compose CLI), with no bespoke code. Use whenever the user wants to \"lance/monte une stack docker\", start an app's services to test against, bring up a throwaway environment (db, redis, api…), watch container logs or status, or destroy a test stack cleanly. Enforces blast-radius conventions: project-prefixed stacks, mandatory teardown, never a global prune. NOT for CI pipelines (that is ezk-ci, act + Docker), NOT for building/pushing images to a registry, NOT for production orchestration.",
   "usage": "[help|check|up|ps|logs|down|nuke]",
   "etage": "modules",
   "famille": "techno",
   "composes": [],
   "composesExternal": [],
   "roles": [],
   "composedBy": [
    "ezk-scout"
   ],
   "tools": [],
   "profiles": [
    "daily",
    "global"
   ]
  },
  "ezk-ezk": {
   "id": "ezk-ezk",
   "source": "products/mega-city/skills/ezk-ezk/SKILL.md",
   "description": "Méta-skill qui transforme une discussion de session en un skill réutilisable. A utiliser quand l'utilisateur veut « créer un skill », « ezk-ezk », « transforme cette discussion en skill », « fais-en un skill », « génère un skill depuis la session », « capitalise ce qu'on vient de faire en skill réutilisable », ou outiller un déroulé manuel récurrent. Orchestrateur MINCE : il COMPOSE product-management:product-brainstorming (cadrer le besoin), engineering:architecture (trancher la structure) et skill-creator (rédiger / valider / packager le SKILL.md) — il ne réimplémente aucun des trois. Pilotable par sous-commandes : help, harvest (récolte ≤3 sujets du contexte de session + champ libre), create (brainstorm → archi → skill-creator, après validation ; avec --via-fiche, propose une fiche au backlog au lieu de fabriquer le skill), audit (convoque l'agent ezk-steward : gate mécanique + jugement du catalogue), deploy (range via scripts/deploy.sh : crée le dossier + symlink non-destructif, destination par défaut mega-city skills/). Frontière ADR-0001 : le LLM rédige/juge via les sous-skills, le script range. N'est PAS la fabrique de skills elle-même (ça, c'est skill-creator) ; c'est l'orchestrateur qui l'alimente depuis une conversation.",
   "usage": "[help|harvest|create|deploy|audit] [--via-fiche|--direct]",
   "etage": "librairie",
   "composes": [
    "ezk-backlog"
   ],
   "composesExternal": [],
   "roles": [
    "ezk-steward"
   ],
   "composedBy": [],
   "tools": [
    "skills/ezk-ezk/scripts/catalog-sync.mjs",
    "skills/ezk-ezk/scripts/deploy.sh"
   ],
   "profiles": [
    "daily",
    "desktop",
    "global"
   ]
  },
  "ezk-npm-scripts": {
   "id": "ezk-npm-scripts",
   "source": "products/mega-city/skills/ezk-npm-scripts/SKILL.md",
   "description": "Garantit que les scripts npm/pnpm/turbo d'un monorepo sont cohérents : chaque package enfant possède ses commandes, et le package.json RACINE les CENTRALISE sous des noms hiérarchiques clairs (verbe:cible[:sous-cible]) qui délèguent via --filter / turbo, pour qu'on lance tous les cas d'usage depuis la racine sans retaper --filter. A utiliser quand l'utilisateur veut « centraliser/nettoyer/ harmoniser les scripts », demande « pourquoi je dois taper --filter @scope/pkg », veut « toutes les commandes accessibles depuis le root », auditer/vérifier que les scripts du monorepo sont cohérents, ou s'assurer qu'un cas d'usage (dev:mobile:android, build:desktop, ci:local…) est piloté depuis la racine. Pilotable par sous-commandes : help, audit, fix, init, convention. AUDIT d'abord (rapport, ne modifie rien), fix opt-in (diff + confirmation). Référence de convention : le monorepo `muti`. NE force PAS le même set sur chaque package (une crate Rust ≠ une app Vite ≠ des docs) : vocabulaire partagé appliqué là où ça a du sens. Respecte le runner en place (turbo vs pnpm -r). Une seule responsabilité (hygiène des scripts) : s'intègre à ezk-ci et ezk-commits sans déborder sur CI/release/versioning.",
   "usage": "[help|audit|fix|init|convention]",
   "etage": "modules",
   "famille": "techno",
   "composes": [],
   "composesExternal": [],
   "roles": [],
   "composedBy": [],
   "tools": [
    "skills/ezk-npm-scripts/scripts/audit.mjs"
   ],
   "profiles": [
    "cop1-target",
    "daily",
    "global"
   ]
  },
  "ezk-pr": {
   "id": "ezk-pr",
   "source": "products/mega-city/skills/ezk-pr/SKILL.md",
   "description": "Chef d'orchestre du TEST-PUIS-MERGE d'un STOCK de PRs ouvertes. A utiliser quand l'utilisateur a plusieurs PRs à valider et demande « comment je les teste / les enchaîne / les merge », « dans quel ordre », « fais-moi un plan de test des PRs », « qu'est-ce qui reste à tester sur quelle PR », veut regrouper les tests device en une seule session, obtenir pour chaque PR le banc à démarrer et l'URL de démo, ou reporter dans chaque PR ce qui a été validé. Pilotable par sous-commandes : help, init (installe la convention « Validation » dans un repo — template PR mince + doc liée, sans jamais écraser un template existant), plan (analyse le stock : ordre de merge par dépendances/merge-tree, conflits, sessions de test groupées), run (déroule une session : démarre les bancs, tend URLs/checklists pas-à-pas), report (poste les résultats en commentaire des PRs), ship (squash-merge au vert + ezk-backlog ship). COMPOSE ezk-preview, ezk-device/ezk-apk, verify/run, ezk-backlog, ezk-commits — il ne réimplémente rien. N'est PAS ezk-sprint (qui PRODUIT une PR) : lui CONSOMME le stock. Une seule instance par repo.",
   "usage": "[help|init|plan|run|report|ship] [#PR…]",
   "etage": "modules",
   "famille": "github",
   "composes": [
    "ezk-backlog",
    "ezk-commits"
   ],
   "composesExternal": [],
   "roles": [],
   "composedBy": [
    "ezk-product-build"
   ],
   "tools": [
    "skills/ezk-archive/scripts/check.sh",
    "skills/ezk-pr/scripts/check-pr-body.sh",
    "skills/ezk-pr/scripts/refresh-worktrees.sh",
    "skills/ezk-pr/scripts/ship-in-pr.sh",
    "skills/ezk-pr/scripts/ship-merge.sh"
   ],
   "profiles": [
    "global"
   ]
  },
  "ezk-preview": {
   "id": "ezk-preview",
   "source": "products/mega-city/skills/ezk-preview/SKILL.md",
   "description": "Produce a shareable demo/preview URL for a work-in-progress feature (a branch or worktree). Use when the user asks for a demo link, a test or preview URL, a way to show a feature to someone, mentions \"lien de démo\", \"URL de test\", \"montre la feature\", \"accéder depuis mon téléphone\", \"démo privée\", or when a PR is ready and needs a preview. Picks a Vercel preview deploy when the app is deployable and Vercel-linked; opens a Cloudflare tunnel (cloudflared) to the local dev server for public sharing; or uses tailscale serve for a PRIVATE demo (own phone, peers in the tailnet, apps holding credentials or lacking auth — never expose those publicly). Returns the URL (QR code for phones) and can post it as a PR comment. For testing on a physical device over adb, use ezk-device instead.",
   "usage": "[help|vercel|public|private|comment]",
   "etage": "modules",
   "famille": "techno",
   "composes": [],
   "composesExternal": [],
   "roles": [],
   "composedBy": [],
   "tools": [
    "skills/ezk-preview/scripts/start-demo.sh"
   ],
   "profiles": [
    "cop1-target",
    "global"
   ]
  },
  "ezk-product-build": {
   "id": "ezk-product-build",
   "source": "products/mega-city/skills/ezk-product-build/SKILL.md",
   "description": "Couche PRODUCT-OWNER autonome qui construit un produit en enchaînant des sprints. A utiliser quand l'utilisateur veut « construis-moi ce produit », « ezk-product-build », « itère en sprints automatiquement », « développe le backlog », « avance le produit tout seul », ou décrit une équipe scrum qui doit livrer en boucle. Orchestrateur MINCE : il COMPOSE ezk-backlog (le quoi), product-management:product-brainstorming (idéer/cadrer une fiche vague) et ezk-sprint (le build d'un lot de stories : équipe scrum, BDD→TDD→gate→revue→PR→squash) — il ne réimplémente AUCUN des trois. Autonomie max ; s'arrête en suggestions-à-choix à 4 moments : inter-sprint, blocage, dérive tokens, idéation. Levier principal --mode (boîte de vitesses) : auto par défaut (prend les décisions recommandées et délègue à ezk-pm, ne s'arrêtant que sur les 4 décisions humaines) | manuel (alias ask : validation à chaque checkpoint). Boucle bornée par --max-sprints (--once = un seul sprint). Vigilance tokens en réglage avancé (lean par défaut | cap arrête-et-demande | full multi-agents libre). N'EST PAS le scrum master qui exécute un sprint (ça, c'est ezk-sprint) ; c'est le product-owner au-dessus qui décide quoi & quand, et le lui confie.",
   "usage": "[help|run|status] [--mode manuel|auto] [--max-sprints N|--once] [--lot N] [--tokens lean|cap|full] [--review] [--delivery per-feature|per-epic] [--retro end|every:N|off]",
   "etage": "methode",
   "bande": "ceremonies",
   "composes": [
    "ezk-backlog",
    "ezk-pr",
    "ezk-retro",
    "ezk-sprint"
   ],
   "composesExternal": [
    "architecture",
    "product-brainstorming"
   ],
   "roles": [
    "ezk-pm"
   ],
   "composedBy": [
    "vz-product-builder"
   ],
   "tools": [],
   "profiles": [
    "daily",
    "desktop",
    "global"
   ]
  },
  "ezk-readme": {
   "id": "ezk-readme",
   "source": "products/mega-city/skills/ezk-readme/SKILL.md",
   "description": "Crée ou audite le README d'un projet — le point d'entrée névralgique du repo : pitch en une ligne, badges adossés à une réalité (CI/release), quickstart, et des INDIRECTIONS vers les sources de vérité plutôt que des infos volatiles à maintenir, en descendant du général au particulier. A utiliser dès que l'utilisateur mentionne un README manquant, à écrire, refaire, améliorer, relire ou auditer (« il manque un README », « écris/refais le readme », « c'est quoi ce README », « le README est faux/périmé »), qu'un repo public n'a pas de README à la racine, qu'une fiche backlog de type readme/documentation d'accueil est tirée, ou en fin de sprint quand la porte d'entrée du repo ne reflète plus le projet. Pilotable par sous-commandes : help, create (génère depuis l'analyse du repo), audit (rapport + diff proposé, jamais d'écrasement direct).",
   "usage": "[help|create|audit]",
   "etage": "modules",
   "famille": "techno",
   "composes": [
    "ezk-backlog"
   ],
   "composesExternal": [],
   "roles": [],
   "composedBy": [],
   "tools": [],
   "profiles": [
    "daily",
    "global"
   ]
  },
  "ezk-release": {
   "id": "ezk-release",
   "source": "products/mega-city/skills/ezk-release/SKILL.md",
   "description": "Passe qualité d'une VERSION entière avant son tag — une gate composable (GO/NO-GO) qui enchaîne des passes bloquantes déclarées (DoD mécanique + chasse aux bugs adverse au départ, revue design-system et autres en plus). Un NO-GO bloque `ezk backlog version close --tag`. À jouer en FIN D'ITÉRATION (le lot de features d'une version), pas par feature. Désactivable par `.vectorz/config.yml → release.gate: off`.",
   "usage": "\u003cvX.Y.Z>",
   "etage": "methode",
   "bande": "ceremonies",
   "composes": [],
   "composesExternal": [],
   "roles": [],
   "composedBy": [],
   "tools": [],
   "profiles": [
    "global"
   ]
  },
  "ezk-retro": {
   "id": "ezk-retro",
   "source": "products/mega-city/skills/ezk-retro/SKILL.md",
   "description": "Cérémonie d'AUTO-AMÉLIORATION DE LA MÉTHODE, déclenchée À LA DEMANDE par l'humain (Sujet A). A utiliser quand l'utilisateur veut « lancer une rétro », « améliorer la méthode / l'équipe / les règles », capitaliser une friction récurrente, « transformer un symptôme en règle mesurable », ajouter un principe d'archi / un item de DoD-DoR / une convention, ou faire le point après une PR ou un sprint qui a coincé. Déroule une cérémonie en ROUND-ROBIN (2 tours) entre les agents de l'équipe (ezk-architect, ezk-qa, ezk-reviewer, ezk-dev, ezk-pm) qui tombent d'accord sur des propositions RATTACHÉES À UN SYMPTÔME et MESURABLES (action, feature, spike, ou RÈGLE) — via les agents bindés du profil (ezk-architect, ezk-qa, ezk-dev, ezk-pm) —, les passe à un JUGE DE COHÉRENCE (chief-judge / ezk-steward : doublons ? contradictions avec les règles existantes ?), puis range SOUS CONTRÔLE DU PO : les non-règles vers ezk-backlog, les règles validées vers rules/ · bundles/ · DoD (toujours réversibles). Laisse toujours une CAPTURE lisible et extractible dans docs/captures/ (qui a proposé quoi, ce qui est écarté, ce que le PO a tranché). Pilotable par sous-commandes : help, run, impose, retire. Le PO garde la main — AUCUNE auto-application. N'EST PAS l'auto-amélioration MESURÉE qui se déclenche sur des chiffres (ça, c'est le contrat d'améliorabilité, Sujet B / ADR-030) ; n'est pas ezk-sprint ni ezk-backlog — il les COMPOSE.",
   "usage": "[help|run|impose|retire]",
   "etage": "methode",
   "bande": "ceremonies",
   "composes": [
    "ezk-backlog",
    "ezk-chef"
   ],
   "composesExternal": [],
   "roles": [],
   "composedBy": [
    "ezk-product-build"
   ],
   "tools": [
    "skills/ezk-retro/scripts/note.sh"
   ],
   "profiles": [
    "daily",
    "global"
   ]
  },
  "ezk-scout": {
   "id": "ezk-scout",
   "source": "products/mega-city/skills/ezk-scout/SKILL.md",
   "description": "Chasse aux bugs en tâche de fond : sonde une app qui tourne dans un état isolé et rend un RAPPORT de brouillons de fiches, sans jamais corriger ni créer de fiche seule. A utiliser quand l'utilisateur veut « chasser / trouver des bugs », « teste l'app et dis-moi ce qui casse », « lance un scout », ou quand le backlog est bloqué sur des gestes humains et qu'il vaut mieux tester que s'arrêter. Pilotable par sous-commandes : help, run (la passe bornée), check (contrôle la forme d'un rapport), file (APRÈS validation humaine seulement : `ezk-backlog add`). Invariants durs : FIND-ONLY (HEAD, arbre, refs et worktree comparés avant/après par un script), aucune carte créée par la passe, état isolé ou chemin non sondé, passe BORNÉE. COMPOSE `ezk-backlog` (filing après accord) et `ezk-docker` (banc isolé quand l'app tourne sous compose). N'EST PAS `ezk-qa` (valide une PR), `ezk-bug` (cadre UN bug déjà signalé), `ezk-reviewer` (relit un diff), `ezk-sprint` (construit) ni `ezk-product-build` (décide) : il explore une app qui tourne et NOURRIT les autres.",
   "usage": "[help|run|check|file|extract]",
   "etage": "methode",
   "bande": "ceremonies",
   "composes": [
    "ezk-backlog",
    "ezk-docker"
   ],
   "composesExternal": [],
   "roles": [],
   "composedBy": [],
   "tools": [
    "skills/ezk-scout/scripts/check-report.sh",
    "skills/ezk-scout/scripts/find-only-guard.sh"
   ],
   "profiles": [
    "global"
   ]
  },
  "ezk-sprint": {
   "id": "ezk-sprint",
   "source": "products/mega-city/skills/ezk-sprint/SKILL.md",
   "description": "Orchestrateur de developpement produit en sprints autonomes. A utiliser quand l'utilisateur veut construire ou iterer une feature ou un produit en mode sprint ou en POC, demande de developper, implementer ou iterer automatiquement, ou evoque une equipe agile (scrum master, architecte, dev, QA, reviewer). Deroule une boucle BDD/TDD vers clean code, clean arch et SOLID, valide TOUT en local d'abord (tests, pipeline act/Docker via ezk-ci, E2E navigateur via Playwright), revue, une PR par feature, squash-merge en conventional commit. Autonome a l'interieur d'un sprint mais s'arrete et demande validation entre chaque sprint, et alerte sur tout blocage ou derive de tokens. POC fonctionnel d'abord, polissage visuel ensuite. Cycle de vie du sprint, `start` ouvre un lot de stories et `close` scelle l'incrément ; la session, elle, reste fermée par `ezk-archive`.",
   "usage": "[help|start|close|check|run]",
   "etage": "methode",
   "bande": "ceremonies",
   "composes": [
    "ezk-backlog",
    "ezk-ci",
    "ezk-commits"
   ],
   "composesExternal": [],
   "roles": [
    "ezk-architect",
    "ezk-dev",
    "ezk-qa",
    "ezk-reviewer"
   ],
   "composedBy": [
    "ezk-product-build",
    "vz-product-builder"
   ],
   "tools": [
    "bin/commit-doc-via-worktree.sh",
    "bin/fiche-rows.ts",
    "bin/sprint-report.ts",
    "skills/ezk-sprint/scripts/check.sh",
    "skills/ezk-sprint/scripts/sprint.sh"
   ],
   "profiles": [
    "daily",
    "global"
   ]
  },
  "supervision-analyze": {
   "id": "supervision-analyze",
   "source": "products/mega-city/skills/supervision-analyze/SKILL.md",
   "description": "Post-mortem Moniteur / supervision : quand le Moniteur dit « Silence prolongé », qu’un run semble figé, ou qu’on ne comprend pas ce qui a été émis. Lance le kit d’analyse déterministe (journal `.supervision/runs` + transcript Claude Code) — pas de LLM. Déclencheurs : « pourquoi silence Moniteur », « analyze supervision », « moniteur confus », « supervision:analyze », « post-mortem run ».",
   "usage": "[chemin-projet=.]",
   "etage": "modules",
   "famille": "observabilite",
   "composes": [],
   "composesExternal": [],
   "roles": [],
   "composedBy": [],
   "tools": [],
   "profiles": []
  },
  "supervision-demo": {
   "id": "supervision-demo",
   "source": "products/mega-city/skills/supervision-demo/SKILL.md",
   "description": "Méthode JOUET à 2 gates pour éprouver le kit émetteur de supervisabilité (fiche 0050) depuis une session Claude Desktop réelle — SANS toucher aux skills de méthode de prod (ezk-*). A utiliser quand on veut tester l'émission du journal du contrat v0.1 : « teste le kit émetteur », « supervision-demo », « émets un journal jouet », « run de démo supervisabilité ». Déroule run_start → travail simulé → gate 1 (STOP, attend) → gate 2 (STOP, attend) → run_finished, en pilotant les 6 outils MCP de l'émetteur (dont `heartbeat`). N'est PAS une méthode de travail réelle : c'est le banc d'essai du contrat, jetable.",
   "usage": "[sujet-du-run-jouet]",
   "etage": "modules",
   "famille": "observabilite",
   "composes": [],
   "composesExternal": [],
   "roles": [],
   "composedBy": [],
   "tools": [
    "bin/supervision-mcp.ts"
   ],
   "profiles": []
  },
  "vz-product-builder": {
   "id": "vz-product-builder",
   "source": "products/mega-city/skills/vz-product-builder/SKILL.md",
   "description": "Variante AUTONOME du product-builder (préfixe vz-, OVERLAY : n'écrase ni ne modifie ezk-product-build) : même doctrine product-owner — compose ezk-backlog (le quoi), product-brainstorming (cadrer) et ezk-sprint (le comment) — mais les checkpoints ne s'arrêtent plus vers l'humain : le builder convoque LUI-MÊME un corpus de reviewers (panel multi-lentilles + contradicteurs + synthèse) selon une échelle de coût à 3 crans, journalise chaque décision via le kit émetteur de supervisabilité, et ne s'arrête vers l'humain QUE sur les 4 STOP humains. A utiliser quand l'utilisateur veut « avancer sans que je réponde aux questions », « product builder autonome », « vz-product-builder », « mode corpus ». Refuse de démarrer sans le kit émetteur (l'autonomie sans journal = boîte noire).",
   "usage": "[build|once|status] [--tokens lean|cap|full]",
   "etage": "modules",
   "famille": "overlay",
   "composes": [
    "ezk-backlog",
    "ezk-product-build",
    "ezk-sprint"
   ],
   "composesExternal": [
    "product-brainstorming"
   ],
   "roles": [],
   "composedBy": [],
   "tools": [],
   "profiles": []
  }
 },
 "agents": {
  "ezk-architect": {
   "id": "ezk-architect",
   "source": "products/mega-city/agents/ezk-architect.md",
   "description": "Architecte logiciel, a utiliser dans la boucle ezk-sprint a l'etape Archi, quand une feature justifie une decision de conception non triviale (frontieres de modules, structure, dependances, trade-offs). Produit une decision claire et un ADR court en respectant clean architecture et SOLID. Ne code pas, il decide et documente.",
   "etage": "methode",
   "model": "claude-opus-4-8",
   "effort": "high",
   "competences": [],
   "interactions": [],
   "convokedBy": [
    "ezk-sprint"
   ],
   "profiles": [
    "cop1-target",
    "daily",
    "global"
   ]
  },
  "ezk-archive": {
   "id": "ezk-archive",
   "source": "products/mega-city/agents/ezk-archive.md",
   "description": "CLÔTURE de session avant archivage (une capacité de continuité, pas une étape agile) — clôt proprement un repo pour ne rien perdre entre deux sessions (working tree, PRs/branches en attente, backlog, ADR, mémoire, note de handoff persistée). Invoqué par le skill `/ezk-archive`, qui traite lui-même une session propre et ne lui délègue que les points qui demandent du JUGEMENT (branche réelle, divergence), en figeant le modèle/effort indépendamment du modèle de la session en cours. Reçoit dans le prompt la sous-commande (help/check/run), le chemin du repo, un résumé de ce qui a été livré/décidé/appris pendant la session et le bloc du portier — n'a AUCUNE mémoire de la conversation qui a précédé l'appel.",
   "etage": "modules",
   "famille": "hote-llm",
   "model": "sonnet",
   "effort": "medium",
   "competences": [
    "ezk-backlog"
   ],
   "interactions": [],
   "convokedBy": [],
   "profiles": [
    "daily",
    "global"
   ]
  },
  "ezk-chef": {
   "id": "ezk-chef",
   "source": "products/mega-city/agents/ezk-chef.md",
   "description": "Gardien de la famille « recette » (recipes/*.md). A utiliser pour verifier qu'une recette est bien formee avant/apres normalisation ou ajout — front-matter valide, pointeur fichier:ligne vers une implementation reelle, zero code recopie, presence dans le livre recipes/RECIPES.md. Lance d'abord la gate mecanique (regen-recipes.sh, champs front-matter, check-links sur recipes/), puis juge les deux SHOULD (playbook + composes, En clair en tete). Rend un verdict GO/NO-GO. Pas un role scrum.",
   "etage": "librairie",
   "model": "sonnet",
   "effort": "low",
   "competences": [],
   "interactions": [],
   "convokedBy": [],
   "profiles": [
    "global"
   ]
  },
  "ezk-dev": {
   "id": "ezk-dev",
   "source": "products/mega-city/agents/ezk-dev.md",
   "description": "Developpeur TDD, a utiliser dans la boucle ezk-sprint a l'etape TDD POC, pour implementer le coeur d'une feature en red-green-refactor. Vise un POC fonctionnel (ca marche) en clean code, pas le polissage visuel. S'arrete des que les tests sont verts et renvoie un resume concis.",
   "etage": "methode",
   "model": "sonnet",
   "effort": "medium",
   "competences": [],
   "interactions": [],
   "convokedBy": [
    "ezk-sprint"
   ],
   "profiles": [
    "cop1-target",
    "daily",
    "global"
   ]
  },
  "ezk-pm": {
   "id": "ezk-pm",
   "source": "products/mega-city/agents/ezk-pm.md",
   "description": "Product-owner décideur de l'équipe ezk. A utiliser quand un checkpoint ou un arbitrage produit doit être tranché À LA PLACE de l'opérateur — « on continue ? », choisir la prochaine fiche, arbitrer un blocage (option A/B), parquer un scope creep, dégrader le mode tokens — notamment depuis ezk-product-build en mode checkpoints auto, ou pour débloquer un run autonome (cop1). Décide d'après la fiche backlog, ses critères d'acceptation et LA LOI ; journalise chaque décision dans SPRINT.md ; REFUSE les 4 décisions humaines (irréversible/sortant, augmentation de budget, idée produit, exigences contradictoires). Ne déroule pas le sprint : il tranche.",
   "etage": "methode",
   "model": "claude-opus-4-8",
   "effort": "high",
   "competences": [
    "ezk-backlog"
   ],
   "interactions": [],
   "convokedBy": [
    "ezk-product-build"
   ],
   "profiles": [
    "cop1-target",
    "daily",
    "desktop",
    "global"
   ]
  },
  "ezk-qa": {
   "id": "ezk-qa",
   "source": "products/mega-city/agents/ezk-qa.md",
   "description": "QA / Business Analyst BDD + E2E, a utiliser dans la boucle ezk-sprint. Ecrit les scenarios d'acceptation Gherkin (Given/When/Then) qui constituent la Definition of Done, lance la suite de tests, et VALIDE une PR de bout en bout en pilotant l'app qui tourne via le Playwright MCP (navigate, click, fill, snapshot, screenshot). Ecrit les specs et valide ; ne developpe pas la feature.",
   "etage": "methode",
   "model": "sonnet",
   "effort": "medium",
   "competences": [],
   "interactions": [
    "testing/capped-list-filter-scenario"
   ],
   "convokedBy": [
    "ezk-sprint"
   ],
   "profiles": [
    "cop1-target",
    "daily",
    "global"
   ]
  },
  "ezk-reviewer": {
   "id": "ezk-reviewer",
   "source": "products/mega-city/agents/ezk-reviewer.md",
   "description": "Reviewer ADVERSE senior de la boucle ezk-sprint (étape Revue). On lui confie le diff d'une feature (branche `feat/\u003cid>-\u003cslug>` vs `main`, ou une PR ouverte) et il cherche activement à le CASSER — correctness, sécurité, perf, contrats/API, clean code & SOLID, et surtout la qualité RÉELLE des tests — puis rend un verdict GO/NO-GO bloquant. Tourne sur un modèle DIFFÉRENT du dev (ezk-dev = Sonnet → reviewer = Opus) pour une seconde opinion indépendante : il est le PLANCHER de la revue (aucun merge sans son GO, ADR-0059) ; Codex est un filet en plus, qu'il remplace quand il est absent (quota épuisé, repo privé, pas de PR). Compose /code-review, /security-review, /simplify, et valide en LOCAL via act/ezk-ci — jamais en comptant sur la CI GitHub. Ne développe pas : il juge, motive, et bloque.",
   "etage": "methode",
   "model": "claude-opus-4-8",
   "effort": "high",
   "competences": [
    "ezk-ci"
   ],
   "interactions": [],
   "convokedBy": [
    "ezk-sprint"
   ],
   "profiles": [
    "cop1-target",
    "daily",
    "global",
    "mobile"
   ]
  },
  "ezk-steward": {
   "id": "ezk-steward",
   "source": "products/mega-city/agents/ezk-steward.md",
   "description": "Gardien de la librairie claude-skills. A utiliser pour auditer le repo lui-meme et verifier que les skills, agents, README et scripts sont coherents, conformes aux conventions et fonctionnels. Lance d'abord la gate mecanique du repo (tests et typecheck de mega-city, plus le controle des liens markdown), puis juge ce qu'un linter ne voit pas (qualite des descriptions qui declenchent, chevauchements, une responsabilite par skill, references croisees, README a jour) et si chaque skill ferait vraiment son job. Rend un verdict GO/NO-GO avec des findings. Pas un role scrum.",
   "etage": "librairie",
   "model": "sonnet",
   "effort": "low",
   "competences": [],
   "interactions": [],
   "convokedBy": [
    "ezk-ezk"
   ],
   "profiles": [
    "daily",
    "global"
   ]
  }
 },
 "rules": {
  "agent-ops/verify-access-before-asking": {
   "id": "agent-ops/verify-access-before-asking",
   "source": "products/mega-city/rules/agent-ops/verify-access-before-asking.md",
   "title": "Vérifie tes propres accès avant de déléguer une opération à l'humain",
   "kind": "disposition",
   "level": "SHOULD",
   "enforcements": [],
   "bundles": [
    "base"
   ],
   "agents": []
  },
  "architecture/config-secrets-12factor": {
   "id": "architecture/config-secrets-12factor",
   "source": "products/mega-city/rules/architecture/config-secrets-12factor.md",
   "title": "Configuration, Secrets, and 12-Factor",
   "kind": "disposition",
   "level": "MUST",
   "enforcements": [],
   "bundles": [
    "architecture"
   ],
   "agents": []
  },
  "architecture/containerization-local": {
   "id": "architecture/containerization-local",
   "source": "products/mega-city/rules/architecture/containerization-local.md",
   "title": "Containerization & Local Execution",
   "kind": "disposition",
   "level": "MUST",
   "enforcements": [],
   "bundles": [
    "architecture"
   ],
   "agents": []
  },
  "architecture/data-persistence-mvp": {
   "id": "architecture/data-persistence-mvp",
   "source": "products/mega-city/rules/architecture/data-persistence-mvp.md",
   "title": "Data & Persistence (MVP Approach)",
   "kind": "disposition",
   "level": "SHOULD",
   "enforcements": [],
   "bundles": [
    "architecture"
   ],
   "agents": []
  },
  "architecture/documentation-on-demand": {
   "id": "architecture/documentation-on-demand",
   "source": "products/mega-city/rules/architecture/documentation-on-demand.md",
   "title": "Documentation (On-Demand Only)",
   "kind": "disposition",
   "level": "MUST",
   "enforcements": [],
   "bundles": [
    "architecture"
   ],
   "agents": []
  },
  "architecture/hexagonal-architecture": {
   "id": "architecture/hexagonal-architecture",
   "source": "products/mega-city/rules/architecture/hexagonal-architecture.md",
   "title": "Hexagonal Architecture (Ports & Adapters)",
   "kind": "disposition",
   "level": "MUST",
   "enforcements": [],
   "bundles": [
    "architecture"
   ],
   "agents": []
  },
  "architecture/mvp-first": {
   "id": "architecture/mvp-first",
   "source": "products/mega-city/rules/architecture/mvp-first.md",
   "title": "MVP-First Product Intent",
   "kind": "disposition",
   "level": "MUST",
   "enforcements": [
    "agent-check"
   ],
   "bundles": [
    "architecture"
   ],
   "agents": []
  },
  "architecture/operational-scripts": {
   "id": "architecture/operational-scripts",
   "source": "products/mega-city/rules/architecture/operational-scripts.md",
   "title": "Operational Scripts (DX & Runbooks)",
   "kind": "disposition",
   "level": "SHOULD",
   "enforcements": [],
   "bundles": [
    "architecture"
   ],
   "agents": []
  },
  "architecture/provisioning-deployment": {
   "id": "architecture/provisioning-deployment",
   "source": "products/mega-city/rules/architecture/provisioning-deployment.md",
   "title": "Provisioning / Deployment (Generic)",
   "kind": "disposition",
   "level": "SHOULD",
   "enforcements": [],
   "bundles": [
    "architecture"
   ],
   "agents": []
  },
  "architecture/repo-structure": {
   "id": "architecture/repo-structure",
   "source": "products/mega-city/rules/architecture/repo-structure.md",
   "title": "Repository Structure (Conceptual)",
   "kind": "disposition",
   "level": "MUST",
   "enforcements": [],
   "bundles": [
    "architecture"
   ],
   "agents": []
  },
  "ci-cd/artifact-strategy": {
   "id": "ci-cd/artifact-strategy",
   "source": "products/mega-city/rules/ci-cd/artifact-strategy.md",
   "title": "Build Artifact Strategy",
   "kind": "disposition",
   "level": "SHOULD",
   "enforcements": [],
   "bundles": [
    "ci-cd"
   ],
   "agents": []
  },
  "ci-cd/ci-coverage": {
   "id": "ci-cd/ci-coverage",
   "source": "products/mega-city/rules/ci-cd/ci-coverage.md",
   "title": "CI Coverage Requirements",
   "kind": "disposition",
   "level": "MUST",
   "enforcements": [],
   "bundles": [
    "ci-cd"
   ],
   "agents": []
  },
  "ci-cd/fix-workflow": {
   "id": "ci-cd/fix-workflow",
   "source": "products/mega-city/rules/ci-cd/fix-workflow.md",
   "title": "CI Fix Workflow",
   "kind": "disposition",
   "level": "SHOULD",
   "enforcements": [],
   "bundles": [
    "ci-cd"
   ],
   "agents": []
  },
  "ci-cd/investigate-failures": {
   "id": "ci-cd/investigate-failures",
   "source": "products/mega-city/rules/ci-cd/investigate-failures.md",
   "title": "Investigate CI Build Failures",
   "kind": "disposition",
   "level": "MUST",
   "enforcements": [],
   "bundles": [
    "ci-cd"
   ],
   "agents": []
  },
  "ci-cd/local-reproduction": {
   "id": "ci-cd/local-reproduction",
   "source": "products/mega-city/rules/ci-cd/local-reproduction.md",
   "title": "Local Reproduction Commands",
   "kind": "disposition",
   "level": "MUST",
   "enforcements": [
    "hook"
   ],
   "bundles": [
    "ci-cd"
   ],
   "agents": []
  },
  "ci-cd/smoke-tests": {
   "id": "ci-cd/smoke-tests",
   "source": "products/mega-city/rules/ci-cd/smoke-tests.md",
   "title": "Smoke Tests in CI",
   "kind": "disposition",
   "level": "SHOULD",
   "enforcements": [],
   "bundles": [
    "ci-cd"
   ],
   "agents": []
  },
  "clean-code/comments": {
   "id": "clean-code/comments",
   "source": "products/mega-city/rules/clean-code/comments.md",
   "title": "Comments Are a Last Resort",
   "kind": "disposition",
   "level": "MAY",
   "enforcements": [],
   "bundles": [
    "clean-code"
   ],
   "agents": []
  },
  "clean-code/dry-principle": {
   "id": "clean-code/dry-principle",
   "source": "products/mega-city/rules/clean-code/dry-principle.md",
   "title": "Don't Repeat Yourself (DRY)",
   "kind": "disposition",
   "level": "SHOULD",
   "enforcements": [],
   "bundles": [
    "clean-code"
   ],
   "agents": []
  },
  "clean-code/meaningful-names": {
   "id": "clean-code/meaningful-names",
   "source": "products/mega-city/rules/clean-code/meaningful-names.md",
   "title": "Use Meaningful Names",
   "kind": "disposition",
   "level": "MUST",
   "enforcements": [],
   "bundles": [
    "clean-code"
   ],
   "agents": []
  },
  "clean-code/no-dead-code": {
   "id": "clean-code/no-dead-code",
   "source": "products/mega-city/rules/clean-code/no-dead-code.md",
   "title": "",
   "kind": "disposition",
   "level": "MUST",
   "enforcements": [
    "agent-check"
   ],
   "bundles": [
    "base",
    "clean-code",
    "dod"
   ],
   "agents": []
  },
  "clean-code/no-side-effects": {
   "id": "clean-code/no-side-effects",
   "source": "products/mega-city/rules/clean-code/no-side-effects.md",
   "title": "Avoid Side Effects",
   "kind": "disposition",
   "level": "SHOULD",
   "enforcements": [],
   "bundles": [
    "clean-code"
   ],
   "agents": []
  },
  "clean-code/no-silent-mutation": {
   "id": "clean-code/no-silent-mutation",
   "source": "products/mega-city/rules/clean-code/no-silent-mutation.md",
   "title": "Une commande qui mute ne finit jamais en « succès » muet",
   "kind": "disposition",
   "level": "MUST",
   "enforcements": [
    "agent-check"
   ],
   "bundles": [
    "clean-code",
    "dod"
   ],
   "agents": []
  },
  "clean-code/small-functions": {
   "id": "clean-code/small-functions",
   "source": "products/mega-city/rules/clean-code/small-functions.md",
   "title": "Keep Functions Small",
   "kind": "disposition",
   "level": "SHOULD",
   "enforcements": [
    "agent-check"
   ],
   "bundles": [
    "clean-code"
   ],
   "agents": []
  },
  "conventional-commits/format": {
   "id": "conventional-commits/format",
   "source": "products/mega-city/rules/conventional-commits/format.md",
   "title": "Conventional Commit format",
   "kind": "disposition",
   "level": "MUST",
   "enforcements": [
    "hook"
   ],
   "bundles": [
    "base",
    "conventional-commits"
   ],
   "agents": []
  },
  "conventional-commits/meaningful-scope": {
   "id": "conventional-commits/meaningful-scope",
   "source": "products/mega-city/rules/conventional-commits/meaningful-scope.md",
   "title": "Scope names a real area of the codebase",
   "kind": "disposition",
   "level": "SHOULD",
   "enforcements": [
    "agent-check"
   ],
   "bundles": [
    "conventional-commits"
   ],
   "agents": []
  },
  "development/acceptance-criteria-before-merge": {
   "id": "development/acceptance-criteria-before-merge",
   "source": "products/mega-city/rules/development/acceptance-criteria-before-merge.md",
   "title": "Un critère d'acceptation se coche dans la PR, avant le merge",
   "kind": "disposition",
   "level": "SHOULD",
   "enforcements": [
    "agent-check"
   ],
   "bundles": [
    "development"
   ],
   "agents": []
  },
  "development/active-views-exclude-terminal-status": {
   "id": "development/active-views-exclude-terminal-status",
   "source": "products/mega-city/rules/development/active-views-exclude-terminal-status.md",
   "title": "Une vue du travail exclut les statuts terminaux par le statut, pas par le dossier done/",
   "kind": "disposition",
   "level": "MUST",
   "enforcements": [
    "agent-check"
   ],
   "bundles": [
    "development"
   ],
   "agents": []
  },
  "development/adversarial-review-before-merge": {
   "id": "development/adversarial-review-before-merge",
   "source": "products/mega-city/rules/development/adversarial-review-before-merge.md",
   "title": "Toute livraison passe une revue adverse avant merge",
   "kind": "disposition",
   "level": "MUST",
   "enforcements": [
    "agent-check"
   ],
   "bundles": [
    "development",
    "dod"
   ],
   "agents": []
  },
  "development/command-reproducibility": {
   "id": "development/command-reproducibility",
   "source": "products/mega-city/rules/development/command-reproducibility.md",
   "title": "Une instruction inline oriente le QUOI, jamais le COMMENT d'une commande",
   "kind": "disposition",
   "level": "MUST",
   "enforcements": [
    "agent-check"
   ],
   "bundles": [
    "development"
   ],
   "agents": []
  },
  "development/fiche-read-via-loader": {
   "id": "development/fiche-read-via-loader",
   "source": "products/mega-city/rules/development/fiche-read-via-loader.md",
   "title": "La lecture d'une fiche passe par le loader testé, jamais par un parse maison",
   "kind": "disposition",
   "level": "MUST",
   "enforcements": [
    "agent-check"
   ],
   "bundles": [
    "development"
   ],
   "agents": []
  },
  "development/handle-blockers": {
   "id": "development/handle-blockers",
   "source": "products/mega-city/rules/development/handle-blockers.md",
   "title": "Stop and Inform on Blockers",
   "kind": "disposition",
   "level": "MUST",
   "enforcements": [],
   "bundles": [
    "development"
   ],
   "agents": []
  },
  "development/host-project-proof-before-ship": {
   "id": "development/host-project-proof-before-ship",
   "source": "products/mega-city/rules/development/host-project-proof-before-ship.md",
   "title": "Une fiche qui vise les projets hôtes s'éprouve sur le banc avant d'être livrée",
   "kind": "disposition",
   "level": "SHOULD",
   "enforcements": [],
   "bundles": [
    "development"
   ],
   "agents": []
  },
  "development/local-first-feedback": {
   "id": "development/local-first-feedback",
   "source": "products/mega-city/rules/development/local-first-feedback.md",
   "title": "Local-First Feedback Loop",
   "kind": "disposition",
   "level": "MUST",
   "enforcements": [],
   "bundles": [
    "development"
   ],
   "agents": []
  },
  "development/merge-when-absent-default": {
   "id": "development/merge-when-absent-default",
   "source": "products/mega-city/rules/development/merge-when-absent-default.md",
   "title": "En mode auto, une fiche verte se merge — le merge n'est pas un STOP",
   "kind": "disposition",
   "level": "SHOULD",
   "enforcements": [
    "agent-check"
   ],
   "bundles": [
    "development"
   ],
   "agents": []
  },
  "development/one-story-one-commit-local": {
   "id": "development/one-story-one-commit-local",
   "source": "products/mega-city/rules/development/one-story-one-commit-local.md",
   "title": "Flux sans PR — une story atterrit comme son propre commit",
   "kind": "disposition",
   "level": "SHOULD",
   "enforcements": [
    "agent-check"
   ],
   "bundles": [
    "development"
   ],
   "agents": []
  },
  "development/playwright-mcp-usage": {
   "id": "development/playwright-mcp-usage",
   "source": "products/mega-city/rules/development/playwright-mcp-usage.md",
   "title": "Playwright MCP Usage",
   "kind": "disposition",
   "level": "MUST",
   "enforcements": [],
   "bundles": [
    "development"
   ],
   "agents": []
  },
  "development/pr-before-after-media": {
   "id": "development/pr-before-after-media",
   "source": "products/mega-city/rules/development/pr-before-after-media.md",
   "title": "Before/After Media in PR Description",
   "kind": "disposition",
   "level": "MUST",
   "enforcements": [
    "agent-check"
   ],
   "bundles": [
    "base",
    "development"
   ],
   "agents": []
  },
  "development/quality-guardrails": {
   "id": "development/quality-guardrails",
   "source": "products/mega-city/rules/development/quality-guardrails.md",
   "title": "Quality and Consistency Guardrails",
   "kind": "disposition",
   "level": "MUST",
   "enforcements": [
    "agent-check"
   ],
   "bundles": [
    "development"
   ],
   "agents": []
  },
  "development/run-freshness-origin-main": {
   "id": "development/run-freshness-origin-main",
   "source": "products/mega-city/rules/development/run-freshness-origin-main.md",
   "title": "Un run part d'un origin/main frais — avertir, ou se réaligner quand c'est sûr",
   "kind": "disposition",
   "level": "MUST",
   "enforcements": [
    "agent-check"
   ],
   "bundles": [
    "development"
   ],
   "agents": []
  },
  "development/test-philosophy": {
   "id": "development/test-philosophy",
   "source": "products/mega-city/rules/development/test-philosophy.md",
   "title": "Testing Philosophy",
   "kind": "disposition",
   "level": "MUST",
   "enforcements": [],
   "bundles": [
    "development",
    "dod"
   ],
   "agents": []
  },
  "development/use-project-scripts": {
   "id": "development/use-project-scripts",
   "source": "products/mega-city/rules/development/use-project-scripts.md",
   "title": "Use Project Scripts as Source of Truth",
   "kind": "disposition",
   "level": "MUST",
   "enforcements": [],
   "bundles": [
    "development"
   ],
   "agents": []
  },
  "development/workaround-traceability": {
   "id": "development/workaround-traceability",
   "source": "products/mega-city/rules/development/workaround-traceability.md",
   "title": "Document Workarounds and Decisions",
   "kind": "disposition",
   "level": "MUST",
   "enforcements": [],
   "bundles": [
    "development"
   ],
   "agents": []
  },
  "development/worktree-secondary-inline-harvest": {
   "id": "development/worktree-secondary-inline-harvest",
   "source": "products/mega-city/rules/development/worktree-secondary-inline-harvest.md",
   "title": "En worktree secondaire, délégation inline ou moisson vérifiée",
   "kind": "disposition",
   "level": "MUST",
   "enforcements": [
    "agent-check"
   ],
   "bundles": [
    "development"
   ],
   "agents": []
  },
  "development/yaml-emission-via-lib": {
   "id": "development/yaml-emission-via-lib",
   "source": "products/mega-city/rules/development/yaml-emission-via-lib.md",
   "title": "Le front-matter généré est émis par la lib YAML, jamais par concaténation",
   "kind": "disposition",
   "level": "MUST",
   "enforcements": [
    "agent-check"
   ],
   "bundles": [],
   "agents": []
  },
  "documentation-guidelines/changelog": {
   "id": "documentation-guidelines/changelog",
   "source": "products/mega-city/rules/documentation-guidelines/changelog.md",
   "title": "Maintain Changelog",
   "kind": "disposition",
   "level": "MUST",
   "enforcements": [],
   "bundles": [],
   "agents": []
  },
  "documentation-guidelines/contributing-guide": {
   "id": "documentation-guidelines/contributing-guide",
   "source": "products/mega-city/rules/documentation-guidelines/contributing-guide.md",
   "title": "Contributing Documentation",
   "kind": "disposition",
   "level": "SHOULD",
   "enforcements": [],
   "bundles": [],
   "agents": []
  },
  "documentation-guidelines/human-facing-lisibility": {
   "id": "documentation-guidelines/human-facing-lisibility",
   "source": "products/mega-city/rules/documentation-guidelines/human-facing-lisibility.md",
   "title": "Human-Facing Artefact Lisibility",
   "kind": "disposition",
   "level": "MUST",
   "enforcements": [
    "agent-check"
   ],
   "bundles": [
    "base"
   ],
   "agents": []
  },
  "documentation-guidelines/next-step-affordance": {
   "id": "documentation-guidelines/next-step-affordance",
   "source": "products/mega-city/rules/documentation-guidelines/next-step-affordance.md",
   "title": "End a skill's human-facing answer with « Et maintenant ? »",
   "kind": "disposition",
   "level": "SHOULD",
   "enforcements": [
    "agent-check"
   ],
   "bundles": [
    "base"
   ],
   "agents": []
  },
  "documentation-guidelines/proven-outbound-references": {
   "id": "documentation-guidelines/proven-outbound-references",
   "source": "products/mega-city/rules/documentation-guidelines/proven-outbound-references.md",
   "title": "Proven Outbound References",
   "kind": "disposition",
   "level": "MUST",
   "enforcements": [],
   "bundles": [],
   "agents": []
  },
  "documentation-guidelines/readable-deliverable-trio": {
   "id": "documentation-guidelines/readable-deliverable-trio",
   "source": "products/mega-city/rules/documentation-guidelines/readable-deliverable-trio.md",
   "title": "A human-facing deliverable = template + extractor + render",
   "kind": "disposition",
   "level": "SHOULD",
   "enforcements": [
    "agent-check"
   ],
   "bundles": [
    "base"
   ],
   "agents": []
  },
  "documentation-guidelines/readme-structure": {
   "id": "documentation-guidelines/readme-structure",
   "source": "products/mega-city/rules/documentation-guidelines/readme-structure.md",
   "title": "README as Landing Page",
   "kind": "disposition",
   "level": "SHOULD",
   "enforcements": [
    "agent-check"
   ],
   "bundles": [],
   "agents": []
  },
  "documentation-guidelines/user-guide": {
   "id": "documentation-guidelines/user-guide",
   "source": "products/mega-city/rules/documentation-guidelines/user-guide.md",
   "title": "Separate User Guide",
   "kind": "disposition",
   "level": "SHOULD",
   "enforcements": [],
   "bundles": [],
   "agents": []
  },
  "hexagonal/adapter-location": {
   "id": "hexagonal/adapter-location",
   "source": "products/mega-city/rules/hexagonal/adapter-location.md",
   "title": "Adapters Live in Infrastructure",
   "kind": "disposition",
   "level": "MUST",
   "enforcements": [],
   "bundles": [],
   "agents": []
  },
  "hexagonal/dependency-inversion": {
   "id": "hexagonal/dependency-inversion",
   "source": "products/mega-city/rules/hexagonal/dependency-inversion.md",
   "title": "Invert Dependencies via Ports",
   "kind": "disposition",
   "level": "MUST",
   "enforcements": [],
   "bundles": [],
   "agents": []
  },
  "hexagonal/domain-isolation": {
   "id": "hexagonal/domain-isolation",
   "source": "products/mega-city/rules/hexagonal/domain-isolation.md",
   "title": "Domain Must Be Isolated",
   "kind": "disposition",
   "level": "MUST",
   "enforcements": [
    "agent-check"
   ],
   "bundles": [],
   "agents": []
  },
  "hexagonal/shared-libs-no-config": {
   "id": "hexagonal/shared-libs-no-config",
   "source": "products/mega-city/rules/hexagonal/shared-libs-no-config.md",
   "title": "Shared Libraries Don't Read Config",
   "kind": "disposition",
   "level": "SHOULD",
   "enforcements": [],
   "bundles": [],
   "agents": []
  },
  "hexagonal/wiring-at-edge": {
   "id": "hexagonal/wiring-at-edge",
   "source": "products/mega-city/rules/hexagonal/wiring-at-edge.md",
   "title": "Wiring at the Edge",
   "kind": "disposition",
   "level": "SHOULD",
   "enforcements": [],
   "bundles": [],
   "agents": []
  },
  "recipe/indexed": {
   "id": "recipe/indexed",
   "source": "products/mega-city/rules/recipe/indexed.md",
   "title": "Une recette est indexée dans le livre",
   "kind": "disposition",
   "level": "MUST",
   "enforcements": [
    "agent-check"
   ],
   "bundles": [],
   "agents": []
  },
  "recipe/lists-tasks-and-composes": {
   "id": "recipe/lists-tasks-and-composes",
   "source": "products/mega-city/rules/recipe/lists-tasks-and-composes.md",
   "title": "Playbook + composes + profil référencé",
   "kind": "disposition",
   "level": "SHOULD",
   "enforcements": [
    "agent-check"
   ],
   "bundles": [],
   "agents": []
  },
  "recipe/no-stored-code": {
   "id": "recipe/no-stored-code",
   "source": "products/mega-city/rules/recipe/no-stored-code.md",
   "title": "Aucun code recopié dans une recette",
   "kind": "disposition",
   "level": "MUST",
   "enforcements": [
    "agent-check"
   ],
   "bundles": [],
   "agents": []
  },
  "recipe/plain-language-first": {
   "id": "recipe/plain-language-first",
   "source": "products/mega-city/rules/recipe/plain-language-first.md",
   "title": "« En clair » en tête de recette",
   "kind": "disposition",
   "level": "SHOULD",
   "enforcements": [
    "agent-check"
   ],
   "bundles": [],
   "agents": []
  },
  "recipe/points-to-real-example": {
   "id": "recipe/points-to-real-example",
   "source": "products/mega-city/rules/recipe/points-to-real-example.md",
   "title": "Une recette pointe un exemple réel",
   "kind": "disposition",
   "level": "MUST",
   "enforcements": [
    "agent-check"
   ],
   "bundles": [],
   "agents": []
  },
  "recipe/tools-capability-first": {
   "id": "recipe/tools-capability-first",
   "source": "products/mega-city/rules/recipe/tools-capability-first.md",
   "title": "Ustensiles capacité-d'abord (MCP local préféré, script sinon)",
   "kind": "disposition",
   "level": "SHOULD",
   "enforcements": [
    "agent-check"
   ],
   "bundles": [],
   "agents": []
  },
  "recipe/valid-frontmatter": {
   "id": "recipe/valid-frontmatter",
   "source": "products/mega-city/rules/recipe/valid-frontmatter.md",
   "title": "Front-matter de recette valide",
   "kind": "disposition",
   "level": "MUST",
   "enforcements": [
    "agent-check"
   ],
   "bundles": [],
   "agents": []
  },
  "testing/capped-list-filter-scenario": {
   "id": "testing/capped-list-filter-scenario",
   "source": "products/mega-city/rules/testing/capped-list-filter-scenario.md",
   "title": "Une liste plafonnée porte un scénario « élément au-delà du cap retrouvé par filtre »",
   "kind": "disposition",
   "level": "SHOULD",
   "enforcements": [
    "agent-check"
   ],
   "bundles": [
    "testing"
   ],
   "agents": [
    "ezk-qa"
   ]
  },
  "testing/confinement-contract-at-boundary": {
   "id": "testing/confinement-contract-at-boundary",
   "source": "products/mega-city/rules/testing/confinement-contract-at-boundary.md",
   "title": "Une fonction de confinement est testée à sa frontière RÉELLE, pas seulement en pur",
   "kind": "disposition",
   "level": "SHOULD",
   "enforcements": [
    "agent-check"
   ],
   "bundles": [
    "dod",
    "testing"
   ],
   "agents": []
  },
  "testing/manual-validation-camera-gesture": {
   "id": "testing/manual-validation-camera-gesture",
   "source": "products/mega-city/rules/testing/manual-validation-camera-gesture.md",
   "title": "« Validé » ≠ « tests verts » pour une fiche caméra ou geste",
   "kind": "disposition",
   "level": "SHOULD",
   "enforcements": [
    "agent-check"
   ],
   "bundles": [
    "testing"
   ],
   "agents": []
  },
  "testing/mobile-first-testing": {
   "id": "testing/mobile-first-testing",
   "source": "products/mega-city/rules/testing/mobile-first-testing.md",
   "title": "Mobile-First Testing (Mandatory)",
   "kind": "disposition",
   "level": "MUST",
   "enforcements": [],
   "bundles": [
    "testing"
   ],
   "agents": []
  },
  "testing/mobile-interactions": {
   "id": "testing/mobile-interactions",
   "source": "products/mega-city/rules/testing/mobile-interactions.md",
   "title": "Mobile Interaction Testing",
   "kind": "disposition",
   "level": "MUST",
   "enforcements": [],
   "bundles": [
    "testing"
   ],
   "agents": []
  },
  "testing/playwright-workflow": {
   "id": "testing/playwright-workflow",
   "source": "products/mega-city/rules/testing/playwright-workflow.md",
   "title": "Playwright Testing Workflow",
   "kind": "disposition",
   "level": "SHOULD",
   "enforcements": [
    "agent-check"
   ],
   "bundles": [
    "testing"
   ],
   "agents": []
  },
  "testing/visual-validation": {
   "id": "testing/visual-validation",
   "source": "products/mega-city/rules/testing/visual-validation.md",
   "title": "Visual Validation",
   "kind": "disposition",
   "level": "MUST",
   "enforcements": [],
   "bundles": [
    "testing"
   ],
   "agents": []
  },
  "token-economy/agent-call-budget": {
   "id": "token-economy/agent-call-budget",
   "source": "products/mega-city/rules/token-economy/agent-call-budget.md",
   "title": "Count cost in agent calls, not in task length",
   "kind": "disposition",
   "level": "SHOULD",
   "enforcements": [],
   "bundles": [
    "token-economy"
   ],
   "agents": []
  },
  "token-economy/batch-tool-calls": {
   "id": "token-economy/batch-tool-calls",
   "source": "products/mega-city/rules/token-economy/batch-tool-calls.md",
   "title": "Batch independent tool calls",
   "kind": "disposition",
   "level": "SHOULD",
   "enforcements": [],
   "bundles": [
    "token-economy"
   ],
   "agents": []
  },
  "token-economy/checkpoint-before-cost": {
   "id": "token-economy/checkpoint-before-cost",
   "source": "products/mega-city/rules/token-economy/checkpoint-before-cost.md",
   "title": "Checkpoint before expensive work",
   "kind": "disposition",
   "level": "SHOULD",
   "enforcements": [],
   "bundles": [
    "token-economy"
   ],
   "agents": []
  },
  "token-economy/concise-output": {
   "id": "token-economy/concise-output",
   "source": "products/mega-city/rules/token-economy/concise-output.md",
   "title": "Be concise",
   "kind": "disposition",
   "level": "SHOULD",
   "enforcements": [
    "prompt"
   ],
   "bundles": [
    "token-economy"
   ],
   "agents": []
  },
  "token-economy/fiche-tient-dans-un-sprint": {
   "id": "token-economy/fiche-tient-dans-un-sprint",
   "source": "products/mega-city/rules/token-economy/fiche-tient-dans-un-sprint.md",
   "title": "Une fiche prête tient dans un sprint économe — on la découpe au grooming, pas au build",
   "kind": "disposition",
   "level": "SHOULD",
   "enforcements": [],
   "bundles": [
    "token-economy"
   ],
   "agents": []
  },
  "token-economy/read-once": {
   "id": "token-economy/read-once",
   "source": "products/mega-city/rules/token-economy/read-once.md",
   "title": "Don't re-read what you already have",
   "kind": "disposition",
   "level": "MUST",
   "enforcements": [],
   "bundles": [
    "token-economy"
   ],
   "agents": []
  },
  "token-economy/retro-due-choix-chiffre": {
   "id": "token-economy/retro-due-choix-chiffre",
   "source": "products/mega-city/rules/token-economy/retro-due-choix-chiffre.md",
   "title": "La rétro due en fin de run est un choix chiffré, pas un lancement automatique",
   "kind": "disposition",
   "level": "SHOULD",
   "enforcements": [],
   "bundles": [
    "token-economy"
   ],
   "agents": []
  },
  "token-economy/targeted-reads": {
   "id": "token-economy/targeted-reads",
   "source": "products/mega-city/rules/token-economy/targeted-reads.md",
   "title": "Read only what you need",
   "kind": "disposition",
   "level": "SHOULD",
   "enforcements": [],
   "bundles": [
    "token-economy"
   ],
   "agents": []
  },
  "token-economy/verification-budget": {
   "id": "token-economy/verification-budget",
   "source": "products/mega-city/rules/token-economy/verification-budget.md",
   "title": "Size verification by the cost of checking",
   "kind": "disposition",
   "level": "SHOULD",
   "enforcements": [],
   "bundles": [
    "token-economy"
   ],
   "agents": []
  },
  "typescript-2026/const-assertions": {
   "id": "typescript-2026/const-assertions",
   "source": "products/mega-city/rules/typescript-2026/const-assertions.md",
   "title": "Use const assertions",
   "kind": "disposition",
   "level": "SHOULD",
   "enforcements": [],
   "bundles": [
    "typescript-2026"
   ],
   "agents": []
  },
  "typescript-2026/discriminated-unions": {
   "id": "typescript-2026/discriminated-unions",
   "source": "products/mega-city/rules/typescript-2026/discriminated-unions.md",
   "title": "Prefer Discriminated Unions",
   "kind": "disposition",
   "level": "SHOULD",
   "enforcements": [],
   "bundles": [
    "typescript-2026"
   ],
   "agents": []
  },
  "typescript-2026/explicit-return-types": {
   "id": "typescript-2026/explicit-return-types",
   "source": "products/mega-city/rules/typescript-2026/explicit-return-types.md",
   "title": "Explicit Return Types for Exports",
   "kind": "disposition",
   "level": "SHOULD",
   "enforcements": [],
   "bundles": [
    "typescript-2026"
   ],
   "agents": []
  },
  "typescript-2026/no-enums": {
   "id": "typescript-2026/no-enums",
   "source": "products/mega-city/rules/typescript-2026/no-enums.md",
   "title": "Avoid Enums",
   "kind": "disposition",
   "level": "MAY",
   "enforcements": [],
   "bundles": [
    "typescript-2026"
   ],
   "agents": []
  },
  "typescript-2026/prefer-unknown": {
   "id": "typescript-2026/prefer-unknown",
   "source": "products/mega-city/rules/typescript-2026/prefer-unknown.md",
   "title": "Prefer unknown over any",
   "kind": "disposition",
   "level": "MUST",
   "enforcements": [],
   "bundles": [
    "typescript-2026"
   ],
   "agents": []
  },
  "typescript-2026/strict-config": {
   "id": "typescript-2026/strict-config",
   "source": "products/mega-city/rules/typescript-2026/strict-config.md",
   "title": "Strict Configuration",
   "kind": "disposition",
   "level": "MUST",
   "enforcements": [
    "hook"
   ],
   "bundles": [
    "typescript-2026"
   ],
   "agents": []
  },
  "ux/no-layout-shift": {
   "id": "ux/no-layout-shift",
   "source": "products/mega-city/rules/ux/no-layout-shift.md",
   "title": "Réserver l'espace des éléments optionnels",
   "kind": "disposition",
   "level": "SHOULD",
   "enforcements": [
    "prompt"
   ],
   "bundles": [],
   "agents": []
  }
 },
 "bundles": {
  "architecture": {
   "id": "architecture",
   "source": "products/mega-city/bundles/architecture.yml",
   "extends": [],
   "rules": [
    "architecture/config-secrets-12factor",
    "architecture/containerization-local",
    "architecture/data-persistence-mvp",
    "architecture/documentation-on-demand",
    "architecture/hexagonal-architecture",
    "architecture/mvp-first",
    "architecture/operational-scripts",
    "architecture/provisioning-deployment",
    "architecture/repo-structure"
   ],
   "profiles": [
    "cop1-target"
   ]
  },
  "base": {
   "id": "base",
   "source": "products/mega-city/bundles/base.yml",
   "extends": [],
   "rules": [
    "agent-ops/verify-access-before-asking",
    "clean-code/no-dead-code",
    "conventional-commits/format",
    "development/pr-before-after-media",
    "documentation-guidelines/human-facing-lisibility",
    "documentation-guidelines/next-step-affordance",
    "documentation-guidelines/readable-deliverable-trio"
   ],
   "profiles": [
    "base",
    "cop1-target",
    "daily",
    "desktop",
    "global"
   ]
  },
  "ci-cd": {
   "id": "ci-cd",
   "source": "products/mega-city/bundles/ci-cd.yml",
   "extends": [],
   "rules": [
    "ci-cd/artifact-strategy",
    "ci-cd/ci-coverage",
    "ci-cd/fix-workflow",
    "ci-cd/investigate-failures",
    "ci-cd/local-reproduction",
    "ci-cd/smoke-tests"
   ],
   "profiles": [
    "cop1-target"
   ]
  },
  "clean-code": {
   "id": "clean-code",
   "source": "products/mega-city/bundles/clean-code.yml",
   "extends": [],
   "rules": [
    "clean-code/comments",
    "clean-code/dry-principle",
    "clean-code/meaningful-names",
    "clean-code/no-dead-code",
    "clean-code/no-side-effects",
    "clean-code/no-silent-mutation",
    "clean-code/small-functions"
   ],
   "profiles": [
    "cop1-target"
   ]
  },
  "conventional-commits": {
   "id": "conventional-commits",
   "source": "products/mega-city/bundles/conventional-commits.yml",
   "extends": [],
   "rules": [
    "conventional-commits/format",
    "conventional-commits/meaningful-scope"
   ],
   "profiles": [
    "cop1-target"
   ]
  },
  "development": {
   "id": "development",
   "source": "products/mega-city/bundles/development.yml",
   "extends": [],
   "rules": [
    "development/acceptance-criteria-before-merge",
    "development/active-views-exclude-terminal-status",
    "development/adversarial-review-before-merge",
    "development/command-reproducibility",
    "development/fiche-read-via-loader",
    "development/handle-blockers",
    "development/host-project-proof-before-ship",
    "development/local-first-feedback",
    "development/merge-when-absent-default",
    "development/one-story-one-commit-local",
    "development/playwright-mcp-usage",
    "development/pr-before-after-media",
    "development/quality-guardrails",
    "development/run-freshness-origin-main",
    "development/test-philosophy",
    "development/use-project-scripts",
    "development/workaround-traceability",
    "development/worktree-secondary-inline-harvest"
   ],
   "profiles": [
    "cop1-target"
   ]
  },
  "dod": {
   "id": "dod",
   "source": "products/mega-city/bundles/dod.yml",
   "extends": [],
   "rules": [
    "clean-code/no-dead-code",
    "clean-code/no-silent-mutation",
    "development/adversarial-review-before-merge",
    "development/test-philosophy",
    "testing/confinement-contract-at-boundary"
   ],
   "profiles": []
  },
  "mobile": {
   "id": "mobile",
   "source": "products/mega-city/bundles/mobile.yml",
   "extends": [
    "base"
   ],
   "rules": [],
   "profiles": [
    "mobile"
   ]
  },
  "testing": {
   "id": "testing",
   "source": "products/mega-city/bundles/testing.yml",
   "extends": [],
   "rules": [
    "testing/capped-list-filter-scenario",
    "testing/confinement-contract-at-boundary",
    "testing/manual-validation-camera-gesture",
    "testing/mobile-first-testing",
    "testing/mobile-interactions",
    "testing/playwright-workflow",
    "testing/visual-validation"
   ],
   "profiles": [
    "cop1-target"
   ]
  },
  "token-economy": {
   "id": "token-economy",
   "source": "products/mega-city/bundles/token-economy.yml",
   "extends": [],
   "rules": [
    "token-economy/agent-call-budget",
    "token-economy/batch-tool-calls",
    "token-economy/checkpoint-before-cost",
    "token-economy/concise-output",
    "token-economy/fiche-tient-dans-un-sprint",
    "token-economy/read-once",
    "token-economy/retro-due-choix-chiffre",
    "token-economy/targeted-reads",
    "token-economy/verification-budget"
   ],
   "profiles": [
    "cop1-target"
   ]
  },
  "typescript-2026": {
   "id": "typescript-2026",
   "source": "products/mega-city/bundles/typescript-2026.yml",
   "extends": [],
   "rules": [
    "typescript-2026/const-assertions",
    "typescript-2026/discriminated-unions",
    "typescript-2026/explicit-return-types",
    "typescript-2026/no-enums",
    "typescript-2026/prefer-unknown",
    "typescript-2026/strict-config"
   ],
   "profiles": [
    "cop1-target"
   ]
  }
 },
 "profiles": {
  "base": {
   "id": "base",
   "source": "products/mega-city/profiles/base.yml",
   "extends": [],
   "bundles": [
    "base"
   ],
   "agents": [],
   "skills": [
    "ezk-archive"
   ],
   "interactions": []
  },
  "cop1-target": {
   "id": "cop1-target",
   "source": "products/mega-city/profiles/cop1-target.yml",
   "extends": [
    "base"
   ],
   "bundles": [
    "architecture",
    "base",
    "ci-cd",
    "clean-code",
    "conventional-commits",
    "development",
    "testing",
    "token-economy",
    "typescript-2026"
   ],
   "agents": [
    "ezk-architect",
    "ezk-dev",
    "ezk-pm",
    "ezk-qa",
    "ezk-reviewer"
   ],
   "skills": [
    "ezk-backlog",
    "ezk-ci",
    "ezk-commits",
    "ezk-design-system",
    "ezk-diagram",
    "ezk-npm-scripts",
    "ezk-preview"
   ],
   "interactions": []
  },
  "daily": {
   "id": "daily",
   "source": "products/mega-city/profiles/daily.yml",
   "extends": [
    "base"
   ],
   "bundles": [
    "base"
   ],
   "agents": [
    "ezk-architect",
    "ezk-archive",
    "ezk-dev",
    "ezk-pm",
    "ezk-qa",
    "ezk-reviewer",
    "ezk-steward"
   ],
   "skills": [
    "ezk-archive",
    "ezk-backlog",
    "ezk-ci",
    "ezk-commits",
    "ezk-design-system",
    "ezk-diagram",
    "ezk-docker",
    "ezk-ezk",
    "ezk-npm-scripts",
    "ezk-product-build",
    "ezk-readme",
    "ezk-retro",
    "ezk-sprint"
   ],
   "interactions": []
  },
  "desktop": {
   "id": "desktop",
   "source": "products/mega-city/profiles/desktop.yml",
   "extends": [
    "base"
   ],
   "bundles": [
    "base"
   ],
   "agents": [
    "ezk-pm"
   ],
   "skills": [
    "ezk-backlog",
    "ezk-diagram",
    "ezk-ezk",
    "ezk-product-build"
   ],
   "interactions": []
  },
  "global": {
   "id": "global",
   "source": "products/mega-city/profiles/global.yml",
   "extends": [
    "base"
   ],
   "bundles": [
    "base"
   ],
   "agents": [
    "ezk-architect",
    "ezk-archive",
    "ezk-chef",
    "ezk-dev",
    "ezk-pm",
    "ezk-qa",
    "ezk-reviewer",
    "ezk-steward"
   ],
   "skills": [
    "ezk-apk",
    "ezk-archive",
    "ezk-article",
    "ezk-backlog",
    "ezk-bug",
    "ezk-chef",
    "ezk-ci",
    "ezk-codex",
    "ezk-commits",
    "ezk-design-system",
    "ezk-device",
    "ezk-diagram",
    "ezk-docker",
    "ezk-ezk",
    "ezk-npm-scripts",
    "ezk-pr",
    "ezk-preview",
    "ezk-product-build",
    "ezk-readme",
    "ezk-release",
    "ezk-retro",
    "ezk-scout",
    "ezk-sprint"
   ],
   "interactions": []
  },
  "mobile": {
   "id": "mobile",
   "source": "products/mega-city/profiles/mobile.yml",
   "extends": [
    "base"
   ],
   "bundles": [
    "mobile"
   ],
   "agents": [
    "ezk-reviewer"
   ],
   "skills": [
    "ezk-commits"
   ],
   "interactions": []
  }
 },
 "tools": {
  "bin/avancement.ts": {
   "id": "bin/avancement.ts",
   "source": "products/mega-city/bin/avancement.ts",
   "commands": [
    "ezk board show"
   ],
   "usedBy": []
  },
  "bin/backlog-aggregate.ts": {
   "id": "bin/backlog-aggregate.ts",
   "source": "products/mega-city/bin/backlog-aggregate.ts",
   "commands": [
    "ezk backlog aggregate"
   ],
   "usedBy": []
  },
  "bin/backlog-apply.ts": {
   "id": "bin/backlog-apply.ts",
   "source": "products/mega-city/bin/backlog-apply.ts",
   "commands": [
    "ezk backlog apply"
   ],
   "usedBy": []
  },
  "bin/backlog-park.ts": {
   "id": "bin/backlog-park.ts",
   "source": "products/mega-city/bin/backlog-park.ts",
   "commands": [
    "ezk backlog park"
   ],
   "usedBy": []
  },
  "bin/backlog-version.ts": {
   "id": "bin/backlog-version.ts",
   "source": "products/mega-city/bin/backlog-version.ts",
   "commands": [
    "ezk backlog version"
   ],
   "usedBy": []
  },
  "bin/build-mcpb.sh": {
   "id": "bin/build-mcpb.sh",
   "source": "products/mega-city/bin/build-mcpb.sh",
   "commands": [],
   "usedBy": []
  },
  "bin/check-adr-ids.sh": {
   "id": "bin/check-adr-ids.sh",
   "source": "products/mega-city/bin/check-adr-ids.sh",
   "commands": [
    "ezk docs check-adr-ids"
   ],
   "usedBy": []
  },
  "bin/check-fiches.ts": {
   "id": "bin/check-fiches.ts",
   "source": "products/mega-city/bin/check-fiches.ts",
   "commands": [
    "ezk backlog check"
   ],
   "usedBy": []
  },
  "bin/check-links.sh": {
   "id": "bin/check-links.sh",
   "source": "products/mega-city/bin/check-links.sh",
   "commands": [
    "ezk docs check-links"
   ],
   "usedBy": [
    "ezk-backlog"
   ]
  },
  "bin/check-planning-views.ts": {
   "id": "bin/check-planning-views.ts",
   "source": "products/mega-city/bin/check-planning-views.ts",
   "commands": [
    "ezk board check"
   ],
   "usedBy": []
  },
  "bin/ci-conso.ts": {
   "id": "bin/ci-conso.ts",
   "source": "products/mega-city/bin/ci-conso.ts",
   "commands": [
    "ezk ci conso"
   ],
   "usedBy": []
  },
  "bin/commit-doc-via-worktree.sh": {
   "id": "bin/commit-doc-via-worktree.sh",
   "source": "products/mega-city/bin/commit-doc-via-worktree.sh",
   "commands": [],
   "usedBy": [
    "ezk-sprint"
   ]
  },
  "bin/ezk-adr-new.ts": {
   "id": "bin/ezk-adr-new.ts",
   "source": "products/mega-city/bin/ezk-adr-new.ts",
   "commands": [
    "ezk adr new"
   ],
   "usedBy": []
  },
  "bin/ezk-chef-extract.sh": {
   "id": "bin/ezk-chef-extract.sh",
   "source": "products/mega-city/bin/ezk-chef-extract.sh",
   "commands": [],
   "usedBy": [
    "ezk-chef"
   ]
  },
  "bin/ezk-chef-suggest.ts": {
   "id": "bin/ezk-chef-suggest.ts",
   "source": "products/mega-city/bin/ezk-chef-suggest.ts",
   "commands": [],
   "usedBy": [
    "ezk-chef"
   ]
  },
  "bin/ezk-ci-harden.ts": {
   "id": "bin/ezk-ci-harden.ts",
   "source": "products/mega-city/bin/ezk-ci-harden.ts",
   "commands": [],
   "usedBy": [
    "ezk-ci"
   ]
  },
  "bin/ezk-config.ts": {
   "id": "bin/ezk-config.ts",
   "source": "products/mega-city/bin/ezk-config.ts",
   "commands": [
    "ezk config"
   ],
   "usedBy": []
  },
  "bin/ezk-dor.ts": {
   "id": "bin/ezk-dor.ts",
   "source": "products/mega-city/bin/ezk-dor.ts",
   "commands": [
    "ezk dor check",
    "ezk dor health",
    "ezk dor show"
   ],
   "usedBy": []
  },
  "bin/ezk-graph.ts": {
   "id": "bin/ezk-graph.ts",
   "source": "products/mega-city/bin/ezk-graph.ts",
   "commands": [
    "ezk graph check"
   ],
   "usedBy": []
  },
  "bin/ezk-help.ts": {
   "id": "bin/ezk-help.ts",
   "source": "products/mega-city/bin/ezk-help.ts",
   "commands": [],
   "internal": "bibliothèque de « ezk help » (liste des skills de chat) ; l'ancien « pnpm ezk:help » marche toujours",
   "usedBy": []
  },
  "bin/ezk-map.ts": {
   "id": "bin/ezk-map.ts",
   "source": "products/mega-city/bin/ezk-map.ts",
   "commands": [
    "ezk dashboard"
   ],
   "usedBy": []
  },
  "bin/ezk-now.ts": {
   "id": "bin/ezk-now.ts",
   "source": "products/mega-city/bin/ezk-now.ts",
   "commands": [
    "ezk now"
   ],
   "usedBy": []
  },
  "bin/ezk-release.ts": {
   "id": "bin/ezk-release.ts",
   "source": "products/mega-city/bin/ezk-release.ts",
   "commands": [
    "ezk release"
   ],
   "usedBy": []
  },
  "bin/ezk-rules.ts": {
   "id": "bin/ezk-rules.ts",
   "source": "products/mega-city/bin/ezk-rules.ts",
   "commands": [
    "ezk rules apply",
    "ezk rules check",
    "ezk rules show"
   ],
   "usedBy": []
  },
  "bin/ezk-scout-extract.ts": {
   "id": "bin/ezk-scout-extract.ts",
   "source": "products/mega-city/bin/ezk-scout-extract.ts",
   "commands": [
    "ezk scout extract"
   ],
   "usedBy": []
  },
  "bin/ezk-sessions.ts": {
   "id": "bin/ezk-sessions.ts",
   "source": "products/mega-city/bin/ezk-sessions.ts",
   "commands": [
    "ezk sessions"
   ],
   "usedBy": []
  },
  "bin/ezk.mjs": {
   "id": "bin/ezk.mjs",
   "source": "products/mega-city/bin/ezk.mjs",
   "commands": [
    "ezk"
   ],
   "usedBy": []
  },
  "bin/ezk.ts": {
   "id": "bin/ezk.ts",
   "source": "products/mega-city/bin/ezk.ts",
   "commands": [],
   "internal": "le routeur lui-même (script pnpm « ezk »)",
   "usedBy": []
  },
  "bin/fiche-rows.ts": {
   "id": "bin/fiche-rows.ts",
   "source": "products/mega-city/bin/fiche-rows.ts",
   "commands": [],
   "usedBy": [
    "ezk-sprint"
   ]
  },
  "bin/forge-changes.ts": {
   "id": "bin/forge-changes.ts",
   "source": "products/mega-city/bin/forge-changes.ts",
   "commands": [
    "ezk forge changes"
   ],
   "usedBy": []
  },
  "bin/forge-integrate.ts": {
   "id": "bin/forge-integrate.ts",
   "source": "products/mega-city/bin/forge-integrate.ts",
   "commands": [
    "ezk forge integrate"
   ],
   "usedBy": []
  },
  "bin/graph-compile.ts": {
   "id": "bin/graph-compile.ts",
   "source": "products/mega-city/bin/graph-compile.ts",
   "commands": [
    "ezk graph compile"
   ],
   "usedBy": []
  },
  "bin/graph-project.ts": {
   "id": "bin/graph-project.ts",
   "source": "products/mega-city/bin/graph-project.ts",
   "commands": [
    "ezk graph project"
   ],
   "usedBy": []
  },
  "bin/graph-query.ts": {
   "id": "bin/graph-query.ts",
   "source": "products/mega-city/bin/graph-query.ts",
   "commands": [
    "ezk graph query"
   ],
   "usedBy": []
  },
  "bin/journal-add.sh": {
   "id": "bin/journal-add.sh",
   "source": "products/mega-city/bin/journal-add.sh",
   "commands": [
    "ezk journal add"
   ],
   "usedBy": []
  },
  "bin/lawgiver.ts": {
   "id": "bin/lawgiver.ts",
   "source": "products/mega-city/bin/lawgiver.ts",
   "commands": [
    "ezk law bind",
    "ezk law bind-global",
    "ezk law capture",
    "ezk law doctor",
    "ezk law gen-ide",
    "ezk law status"
   ],
   "usedBy": []
  },
  "bin/paths.ts": {
   "id": "bin/paths.ts",
   "source": "products/mega-city/bin/paths.ts",
   "commands": [
    "ezk paths"
   ],
   "usedBy": []
  },
  "bin/plan-head.ts": {
   "id": "bin/plan-head.ts",
   "source": "products/mega-city/bin/plan-head.ts",
   "commands": [
    "ezk backlog plan-head"
   ],
   "usedBy": []
  },
  "bin/plan-lot.ts": {
   "id": "bin/plan-lot.ts",
   "source": "products/mega-city/bin/plan-lot.ts",
   "commands": [
    "ezk backlog plan-lot"
   ],
   "usedBy": []
  },
  "bin/plan-order.ts": {
   "id": "bin/plan-order.ts",
   "source": "products/mega-city/bin/plan-order.ts",
   "commands": [
    "ezk backlog plan-order"
   ],
   "usedBy": []
  },
  "bin/portfolio.sh": {
   "id": "bin/portfolio.sh",
   "source": "products/mega-city/bin/portfolio.sh",
   "commands": [
    "ezk backlog portfolio"
   ],
   "usedBy": [
    "ezk-backlog"
   ]
  },
  "bin/pr-emit-local.ts": {
   "id": "bin/pr-emit-local.ts",
   "source": "products/mega-city/bin/pr-emit-local.ts",
   "commands": [
    "ezk pr emit-local"
   ],
   "usedBy": []
  },
  "bin/pr-evidence.sh": {
   "id": "bin/pr-evidence.sh",
   "source": "products/mega-city/bin/pr-evidence.sh",
   "commands": [
    "ezk evidence"
   ],
   "usedBy": []
  },
  "bin/recipe-frontmatter.ts": {
   "id": "bin/recipe-frontmatter.ts",
   "source": "products/mega-city/bin/recipe-frontmatter.ts",
   "commands": [],
   "usedBy": []
  },
  "bin/regen-backlog.sh": {
   "id": "bin/regen-backlog.sh",
   "source": "products/mega-city/bin/regen-backlog.sh",
   "commands": [
    "ezk backlog regen"
   ],
   "usedBy": [
    "ezk-backlog"
   ]
  },
  "bin/regen-composes-graph.ts": {
   "id": "bin/regen-composes-graph.ts",
   "source": "products/mega-city/bin/regen-composes-graph.ts",
   "commands": [
    "ezk graph composes"
   ],
   "usedBy": []
  },
  "bin/regen-recipes.sh": {
   "id": "bin/regen-recipes.sh",
   "source": "products/mega-city/bin/regen-recipes.sh",
   "commands": [],
   "usedBy": [
    "ezk-chef"
   ]
  },
  "bin/retro-captures.ts": {
   "id": "bin/retro-captures.ts",
   "source": "products/mega-city/bin/retro-captures.ts",
   "commands": [
    "ezk retro captures"
   ],
   "usedBy": []
  },
  "bin/retro-reports.ts": {
   "id": "bin/retro-reports.ts",
   "source": "products/mega-city/bin/retro-reports.ts",
   "commands": [
    "ezk retro reports"
   ],
   "usedBy": []
  },
  "bin/review-emit.ts": {
   "id": "bin/review-emit.ts",
   "source": "products/mega-city/bin/review-emit.ts",
   "commands": [
    "ezk review emit"
   ],
   "usedBy": []
  },
  "bin/run-context.ts": {
   "id": "bin/run-context.ts",
   "source": "products/mega-city/bin/run-context.ts",
   "commands": [
    "ezk run context"
   ],
   "usedBy": []
  },
  "bin/run-eligibility.ts": {
   "id": "bin/run-eligibility.ts",
   "source": "products/mega-city/bin/run-eligibility.ts",
   "commands": [
    "ezk run eligibility"
   ],
   "usedBy": []
  },
  "bin/run-report.ts": {
   "id": "bin/run-report.ts",
   "source": "products/mega-city/bin/run-report.ts",
   "commands": [
    "ezk run report"
   ],
   "usedBy": []
  },
  "bin/run-versions.ts": {
   "id": "bin/run-versions.ts",
   "source": "products/mega-city/bin/run-versions.ts",
   "commands": [
    "ezk run versions"
   ],
   "usedBy": []
  },
  "bin/ship-fiche.ts": {
   "id": "bin/ship-fiche.ts",
   "source": "products/mega-city/bin/ship-fiche.ts",
   "commands": [
    "ezk backlog ship"
   ],
   "usedBy": []
  },
  "bin/sprint-report.ts": {
   "id": "bin/sprint-report.ts",
   "source": "products/mega-city/bin/sprint-report.ts",
   "commands": [
    "ezk sprint report"
   ],
   "usedBy": [
    "ezk-sprint"
   ]
  },
  "bin/supervision-abandon.ts": {
   "id": "bin/supervision-abandon.ts",
   "source": "products/mega-city/bin/supervision-abandon.ts",
   "commands": [
    "ezk supervision abandon"
   ],
   "usedBy": []
  },
  "bin/supervision-analyze.ts": {
   "id": "bin/supervision-analyze.ts",
   "source": "products/mega-city/bin/supervision-analyze.ts",
   "commands": [
    "ezk supervision analyze"
   ],
   "usedBy": []
  },
  "bin/supervision-demo-run.ts": {
   "id": "bin/supervision-demo-run.ts",
   "source": "products/mega-city/bin/supervision-demo-run.ts",
   "commands": [],
   "usedBy": []
  },
  "bin/supervision-doctor.ts": {
   "id": "bin/supervision-doctor.ts",
   "source": "products/mega-city/bin/supervision-doctor.ts",
   "commands": [
    "ezk supervision doctor"
   ],
   "usedBy": []
  },
  "bin/supervision-link.ts": {
   "id": "bin/supervision-link.ts",
   "source": "products/mega-city/bin/supervision-link.ts",
   "commands": [
    "ezk supervision link"
   ],
   "usedBy": []
  },
  "bin/supervision-mcp.ts": {
   "id": "bin/supervision-mcp.ts",
   "source": "products/mega-city/bin/supervision-mcp.ts",
   "commands": [],
   "usedBy": [
    "supervision-demo"
   ]
  },
  "bin/supervision-probe.ts": {
   "id": "bin/supervision-probe.ts",
   "source": "products/mega-city/bin/supervision-probe.ts",
   "commands": [
    "ezk supervision probe"
   ],
   "usedBy": []
  },
  "bin/supervision-registry-add.ts": {
   "id": "bin/supervision-registry-add.ts",
   "source": "products/mega-city/bin/supervision-registry-add.ts",
   "commands": [
    "ezk supervision registry-add"
   ],
   "usedBy": []
  },
  "bin/views-regen.ts": {
   "id": "bin/views-regen.ts",
   "source": "products/mega-city/bin/views-regen.ts",
   "commands": [
    "ezk views regen"
   ],
   "usedBy": []
  },
  "skills/ezk-apk/scripts/build-preview-apk.sh": {
   "id": "skills/ezk-apk/scripts/build-preview-apk.sh",
   "source": "products/mega-city/skills/ezk-apk/scripts/build-preview-apk.sh",
   "commands": [],
   "usedBy": [
    "ezk-apk"
   ]
  },
  "skills/ezk-archive/scripts/archive-commit.sh": {
   "id": "skills/ezk-archive/scripts/archive-commit.sh",
   "source": "products/mega-city/skills/ezk-archive/scripts/archive-commit.sh",
   "commands": [],
   "usedBy": [
    "ezk-archive"
   ]
  },
  "skills/ezk-archive/scripts/archive-progress.sh": {
   "id": "skills/ezk-archive/scripts/archive-progress.sh",
   "source": "products/mega-city/skills/ezk-archive/scripts/archive-progress.sh",
   "commands": [],
   "usedBy": [
    "ezk-archive"
   ]
  },
  "skills/ezk-archive/scripts/check.sh": {
   "id": "skills/ezk-archive/scripts/check.sh",
   "source": "products/mega-city/skills/ezk-archive/scripts/check.sh",
   "commands": [],
   "usedBy": [
    "ezk-archive",
    "ezk-pr"
   ]
  },
  "skills/ezk-archive/scripts/handoff.sh": {
   "id": "skills/ezk-archive/scripts/handoff.sh",
   "source": "products/mega-city/skills/ezk-archive/scripts/handoff.sh",
   "commands": [],
   "usedBy": [
    "ezk-archive"
   ]
  },
  "skills/ezk-archive/scripts/lib-worktree-safety.sh": {
   "id": "skills/ezk-archive/scripts/lib-worktree-safety.sh",
   "source": "products/mega-city/skills/ezk-archive/scripts/lib-worktree-safety.sh",
   "commands": [],
   "usedBy": []
  },
  "skills/ezk-backlog/scripts/apply-002-readme-vs-backlog.sh": {
   "id": "skills/ezk-backlog/scripts/apply-002-readme-vs-backlog.sh",
   "source": "products/mega-city/skills/ezk-backlog/scripts/apply-002-readme-vs-backlog.sh",
   "commands": [],
   "usedBy": [
    "ezk-backlog"
   ]
  },
  "skills/ezk-backlog/scripts/apply-003-statuts-colonnes.sh": {
   "id": "skills/ezk-backlog/scripts/apply-003-statuts-colonnes.sh",
   "source": "products/mega-city/skills/ezk-backlog/scripts/apply-003-statuts-colonnes.sh",
   "commands": [],
   "usedBy": [
    "ezk-backlog"
   ]
  },
  "skills/ezk-backlog/scripts/apply-005-retrait-champ-ready.sh": {
   "id": "skills/ezk-backlog/scripts/apply-005-retrait-champ-ready.sh",
   "source": "products/mega-city/skills/ezk-backlog/scripts/apply-005-retrait-champ-ready.sh",
   "commands": [],
   "usedBy": [
    "ezk-backlog"
   ]
  },
  "skills/ezk-backlog/scripts/check-layout-version.sh": {
   "id": "skills/ezk-backlog/scripts/check-layout-version.sh",
   "source": "products/mega-city/skills/ezk-backlog/scripts/check-layout-version.sh",
   "commands": [],
   "usedBy": [
    "ezk-backlog"
   ]
  },
  "skills/ezk-backlog/scripts/mint-id.sh": {
   "id": "skills/ezk-backlog/scripts/mint-id.sh",
   "source": "products/mega-city/skills/ezk-backlog/scripts/mint-id.sh",
   "commands": [],
   "usedBy": [
    "ezk-backlog",
    "ezk-chef"
   ]
  },
  "skills/ezk-backlog/scripts/regen-backlog.sh": {
   "id": "skills/ezk-backlog/scripts/regen-backlog.sh",
   "source": "products/mega-city/skills/ezk-backlog/scripts/regen-backlog.sh",
   "commands": [],
   "usedBy": [
    "ezk-backlog"
   ]
  },
  "skills/ezk-backlog/scripts/resolve-regen-backlog.sh": {
   "id": "skills/ezk-backlog/scripts/resolve-regen-backlog.sh",
   "source": "products/mega-city/skills/ezk-backlog/scripts/resolve-regen-backlog.sh",
   "commands": [],
   "usedBy": [
    "ezk-backlog"
   ]
  },
  "skills/ezk-commits/scripts/commit-msg": {
   "id": "skills/ezk-commits/scripts/commit-msg",
   "source": "products/mega-city/skills/ezk-commits/scripts/commit-msg",
   "commands": [],
   "usedBy": []
  },
  "skills/ezk-device/scripts/check-setup.sh": {
   "id": "skills/ezk-device/scripts/check-setup.sh",
   "source": "products/mega-city/skills/ezk-device/scripts/check-setup.sh",
   "commands": [],
   "usedBy": [
    "ezk-device"
   ]
  },
  "skills/ezk-device/scripts/connect.sh": {
   "id": "skills/ezk-device/scripts/connect.sh",
   "source": "products/mega-city/skills/ezk-device/scripts/connect.sh",
   "commands": [],
   "usedBy": [
    "ezk-device"
   ]
  },
  "skills/ezk-device/scripts/deploy-and-launch.sh": {
   "id": "skills/ezk-device/scripts/deploy-and-launch.sh",
   "source": "products/mega-city/skills/ezk-device/scripts/deploy-and-launch.sh",
   "commands": [],
   "usedBy": [
    "ezk-device"
   ]
  },
  "skills/ezk-device/scripts/enable-tcpip.sh": {
   "id": "skills/ezk-device/scripts/enable-tcpip.sh",
   "source": "products/mega-city/skills/ezk-device/scripts/enable-tcpip.sh",
   "commands": [],
   "usedBy": [
    "ezk-device"
   ]
  },
  "skills/ezk-device/scripts/install-tools.sh": {
   "id": "skills/ezk-device/scripts/install-tools.sh",
   "source": "products/mega-city/skills/ezk-device/scripts/install-tools.sh",
   "commands": [],
   "usedBy": [
    "ezk-device"
   ]
  },
  "skills/ezk-diagram/scripts/publish.sh": {
   "id": "skills/ezk-diagram/scripts/publish.sh",
   "source": "products/mega-city/skills/ezk-diagram/scripts/publish.sh",
   "commands": [],
   "usedBy": [
    "ezk-diagram"
   ]
  },
  "skills/ezk-diagram/scripts/render.sh": {
   "id": "skills/ezk-diagram/scripts/render.sh",
   "source": "products/mega-city/skills/ezk-diagram/scripts/render.sh",
   "commands": [],
   "usedBy": [
    "ezk-diagram"
   ]
  },
  "skills/ezk-ezk/scripts/catalog-sync.mjs": {
   "id": "skills/ezk-ezk/scripts/catalog-sync.mjs",
   "source": "products/mega-city/skills/ezk-ezk/scripts/catalog-sync.mjs",
   "commands": [],
   "usedBy": [
    "ezk-ezk"
   ]
  },
  "skills/ezk-ezk/scripts/deploy.sh": {
   "id": "skills/ezk-ezk/scripts/deploy.sh",
   "source": "products/mega-city/skills/ezk-ezk/scripts/deploy.sh",
   "commands": [],
   "usedBy": [
    "ezk-ezk"
   ]
  },
  "skills/ezk-npm-scripts/scripts/audit.mjs": {
   "id": "skills/ezk-npm-scripts/scripts/audit.mjs",
   "source": "products/mega-city/skills/ezk-npm-scripts/scripts/audit.mjs",
   "commands": [],
   "usedBy": [
    "ezk-npm-scripts"
   ]
  },
  "skills/ezk-pr/scripts/check-pr-body.sh": {
   "id": "skills/ezk-pr/scripts/check-pr-body.sh",
   "source": "products/mega-city/skills/ezk-pr/scripts/check-pr-body.sh",
   "commands": [
    "ezk pr check-body"
   ],
   "usedBy": [
    "ezk-pr"
   ]
  },
  "skills/ezk-pr/scripts/integrate-push-ff.sh": {
   "id": "skills/ezk-pr/scripts/integrate-push-ff.sh",
   "source": "products/mega-city/skills/ezk-pr/scripts/integrate-push-ff.sh",
   "commands": [],
   "usedBy": []
  },
  "skills/ezk-pr/scripts/reconcile-worktree.sh": {
   "id": "skills/ezk-pr/scripts/reconcile-worktree.sh",
   "source": "products/mega-city/skills/ezk-pr/scripts/reconcile-worktree.sh",
   "commands": [
    "ezk run reconcile"
   ],
   "usedBy": []
  },
  "skills/ezk-pr/scripts/refresh-worktrees.sh": {
   "id": "skills/ezk-pr/scripts/refresh-worktrees.sh",
   "source": "products/mega-city/skills/ezk-pr/scripts/refresh-worktrees.sh",
   "commands": [],
   "usedBy": [
    "ezk-pr"
   ]
  },
  "skills/ezk-pr/scripts/ship-in-pr.sh": {
   "id": "skills/ezk-pr/scripts/ship-in-pr.sh",
   "source": "products/mega-city/skills/ezk-pr/scripts/ship-in-pr.sh",
   "commands": [
    "ezk pr ship-in-pr"
   ],
   "usedBy": [
    "ezk-backlog",
    "ezk-pr"
   ]
  },
  "skills/ezk-pr/scripts/ship-merge.sh": {
   "id": "skills/ezk-pr/scripts/ship-merge.sh",
   "source": "products/mega-city/skills/ezk-pr/scripts/ship-merge.sh",
   "commands": [],
   "usedBy": [
    "ezk-pr"
   ]
  },
  "skills/ezk-preview/scripts/start-demo.sh": {
   "id": "skills/ezk-preview/scripts/start-demo.sh",
   "source": "products/mega-city/skills/ezk-preview/scripts/start-demo.sh",
   "commands": [],
   "usedBy": [
    "ezk-preview"
   ]
  },
  "skills/ezk-retro/scripts/note.sh": {
   "id": "skills/ezk-retro/scripts/note.sh",
   "source": "products/mega-city/skills/ezk-retro/scripts/note.sh",
   "commands": [
    "ezk retro note"
   ],
   "usedBy": [
    "ezk-retro"
   ]
  },
  "skills/ezk-scout/scripts/check-report.sh": {
   "id": "skills/ezk-scout/scripts/check-report.sh",
   "source": "products/mega-city/skills/ezk-scout/scripts/check-report.sh",
   "commands": [],
   "usedBy": [
    "ezk-scout"
   ]
  },
  "skills/ezk-scout/scripts/find-only-guard.sh": {
   "id": "skills/ezk-scout/scripts/find-only-guard.sh",
   "source": "products/mega-city/skills/ezk-scout/scripts/find-only-guard.sh",
   "commands": [],
   "usedBy": [
    "ezk-scout"
   ]
  },
  "skills/ezk-sprint/scripts/check.sh": {
   "id": "skills/ezk-sprint/scripts/check.sh",
   "source": "products/mega-city/skills/ezk-sprint/scripts/check.sh",
   "commands": [],
   "usedBy": [
    "ezk-sprint"
   ]
  },
  "skills/ezk-sprint/scripts/sprint.sh": {
   "id": "skills/ezk-sprint/scripts/sprint.sh",
   "source": "products/mega-city/skills/ezk-sprint/scripts/sprint.sh",
   "commands": [],
   "usedBy": [
    "ezk-sprint"
   ]
  }
 }
};
/*ezk-map-data:end*/
