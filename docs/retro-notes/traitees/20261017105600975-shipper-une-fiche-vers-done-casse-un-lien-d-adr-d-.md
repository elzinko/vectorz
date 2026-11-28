---
date: 2026-10-17
session: "claude/heuristic-volhard-02768f / ezk-reviewer-agent-skill-f5e5b1"
type: friction
---

# Shipper une fiche vers done/ casse un lien d'ADR d'une AUTRE session (non corrigeable depuis un worktree)

Au merge de v0.17 (2026-10-16/17), shipper la fiche 20261013132218242 vers features/done/ a cassé un lien dans products/mega-city/docs/adr/0082-agents-llm-local-moteur-quota-deux-portees.md:6 : il pointait `features/20261013132218242_...`, la fiche est désormais en `features/done/`. L'ADR-0082 est le commit d'une AUTRE session, PAS sur la branche du run v0.17 → le recalage de liens du `ship` (fiche 20261013013553044) ne pouvait pas le voir : il ne regarde que la branche courante. Au merge sur main, le lien casse.
Non corrigeable depuis le worktree du run : le hook interdit d'éditer le checkout principal depuis un worktree, et l'ADR n'est pas sur la branche de session. Résolu en lançant une session dont le cwd EST le checkout principal (le hook n'y bloque pas — ce n'est PAS un contournement du hook) : commit 04ced966, vérif de liens verte.
Pistes à trancher en rétro : (a) le recalage de liens au ship devrait couvrir les références INTER-branches (ou au moins avertir qu'un id shippé est référencé ailleurs) ; (b) le gate de clôture/merge devrait lancer test-links-repo sur le dépôt ENTIER et nommer qui doit recaler. Mémoire liée : vectorz-v017-revue-merge-seal-2026-10-16.
