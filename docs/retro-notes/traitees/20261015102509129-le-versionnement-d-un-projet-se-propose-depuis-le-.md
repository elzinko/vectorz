---
date: 2026-10-15
session: "docs/run-v015-cr / ezk-reviewer-agent-skill-f5e5b1"
type: friction
---

# Le versionnement d'un projet se propose depuis le pilote de la chaîne, pas une session sœur

Incident (2026-10-14, multi-sessions) : le run v0.15 a tagué v0.15.0 → 6c80098a en LOCAL, strictement
sans push (push d'étiquette = geste PO, proposé à la clôture du run v0.15). La session v0.14 (sœur, en
archivage) a vu l'étiquette locale fraîche dans le .git PARTAGÉ (les worktrees partagent les tags) et a
suggéré au PO de la pousser avec la sienne : `git push origin v0.14.0 v0.15.0`. Le PO a exécuté.
Résultat correct (c'était le geste prévu pour v0.15), mais la PROPOSITION a traversé la frontière des
runs : une session en a fait publier une autre.

Règle proposée (coordination multi-sessions), 2 clauses :
1. Le versionnement d'un projet — proposer de poser/pousser une étiquette de version — se propose
   depuis UN SEUL point : la session qui PILOTE la chaîne de versions (parent / MASTER aiguilleur).
   Une session sœur ne propose pas le push d'une étiquette.
2. On ne propose de publier QUE la version que SON run a produite ET bénie (gate GO). Apercevoir une
   étiquette fraîche d'un AUTRE run dans le .git partagé n'autorise pas à en suggérer le push : elle
   appartient au run qui l'a créée (à sa clôture) ou au pilote, pas à une session de passage.

Pourquoi : les worktrees d'un même dépôt partagent les étiquettes, donc toute session voit les tags
frais des runs concurrents. Sans cette règle, une session « serviable » fait publier (via le PO) la
version d'un autre run, hors contexte et potentiellement avant sa bénédiction. Lien : mémoire
coordination MASTER = aiguilleur léger (ne pas agir sur l'état partagé d'un autre run).
