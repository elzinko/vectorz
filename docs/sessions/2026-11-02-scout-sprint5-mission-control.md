fiches: 20261102100505427,20261102100506285,20261102124307012

# Session du 2026-11-02 — passe scout sur mission control, puis sprint 5

## En clair

Une passe de chasse aux bugs a sondé mission control et trouvé 6 défauts, tous fichés en idée. Les deux
défauts majeurs ont été corrigés au sprint 5 et intégrés sur le `main` local. Une troisième fiche, vue
pendant le sprint, est prête en tête du plan : son sprint reste à ouvrir.

## Ce qui a été fait

1. **Passe ezk-scout** sur mission control (cop1), sondes HTTP seulement. Six brouillons, validés par
   le PO, entrent au backlog en idée avec l'étiquette `scout`.
2. **Incident pendant la passe.** Avec un HOME isolé, corepack n'a plus trouvé son cache. Il a pris
   pnpm 12, qui a réinstallé le `node_modules` de vectorz. Réparé par une réinstallation sous pnpm
   10.28.2, puis corrigé à la source au sprint 5.
3. **Groom, porte « prête » et plan** pour les deux défauts majeurs.
4. **Sprint 5** — deux stories, revue adverse GO pour chacune, squash local :
   - [Le lanceur annonce un port web faux quand ce port est déjà pris](../../features/done/20261102100505427_lanceur-annonce-port-web-faux.md) — local `1724dd06` ;
   - [vectorz réinstalle ses dépendances avec un autre pnpm](../../features/done/20261102100506285_epingler-version-pnpm.md) — local `38de13e9`. Mesure de suivi : constater la CI réelle sous pnpm 10.28.2.
5. **Deux fiches vues pendant le sprint**, en idée :
   - [Le lanceur accepte un port qui n'est pas un nombre](../../features/20261102124306840_lanceur-port-non-numerique.md) — P3 ;
   - [L'intégration locale supprime la branche toute neuve d'une autre session](../../features/20261102124307012_integration-locale-supprime-branche-autre-session.md) — P2, groomée, prête, en tête du plan.
6. **Sprint suivant non ouvert.** Le portier était en alerte sur le dossier de travail d'une autre
   session. Le PO a choisi d'attendre, puis de continuer dans une nouvelle session.

## Comptes rendus de sprint de la session

- [Sprint 5 — corriger les deux défauts majeurs de la passe scout](../sprints/2026-11-02-sprint-corriger-les-deux-d-fauts-majeurs-de-la-passe-sc.md)

## Galères & gestes (labo)
- Port web : tuer cop1-dev.sh par TERM ne tue pas ses enfants (vite, daemon) — le trap attend la fin du vite au premier plan. Geste : arrêter les enfants par pid. Ctrl-C (SIGINT au groupe) n’a pas ce défaut.
