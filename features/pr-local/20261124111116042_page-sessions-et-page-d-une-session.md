> 🗎 Rendu de la fiche [features/20261124111116042_page-sessions-et-page-d-une-session.md](../done/20261124111116042_page-sessions-et-page-d-une-session.md)

# 20261124111116042 — Mission control a une page Sessions et une page par session, qui remplacent la Chronologie

**En clair.** La maquette a une page « Sessions » : la session en cours, puis les sessions closes,
chacune en mots. Un clic ouvre la page d'une session : ses lancements, un fil des moments qui
comptent, ses sprints et son récit. Aujourd'hui, la Chronologie montre le journal brut, et les
sessions closes ne sont qu'une liste dans Pilotage. On construit les deux pages. Elles remplacent
la Chronologie.

**Si tu arrives frais.** Une session est une séance de travail dans Claude Code, sur une branche.
Elle joue des lancements, par exemple un `/ezk-product-build`, et chaque lancement joue des sprints.
À la fermeture, la méthode committe un récit dans `docs/sessions/`. Le journal de supervision note
chaque moment d'un lancement.

## Contexte / Problème

La maquette dessine deux pages :

- [Sessions](https://claude.ai/artifact/Q6UFuLx4BoCon1CLNrmcTP), dans le fichier `project/SessionsListe.dc.html` ;
- [Une session](https://claude.ai/artifact/Q6UFuLx4BoCon1CLNrmcTP), dans le fichier `project/Session.dc.html`.

La méthode publie aujourd'hui, pour chaque session close : la date, le titre, le fichier du récit,
les fiches citées et les PR. Le journal de supervision donne les lancements et leurs moments. Il
manque trois choses, chacune portée par une fiche :

- le nom de la session et sa branche dans le journal :
  [L'émetteur nomme la session](../20261114131612388_session-nommee-cle-de-chantier-derivee.md) ;
- la durée, la branche et les sprints d'un récit :
  [Le récit de session porte un en-tête structuré](../20261114131614243_recit-de-session-en-tete-structure.md) ;
- une session entière, avec ses sprints, ses lancements et ses fiches :
  [`ezk board session --json`](../20261114131614424_ezk-board-session-json.md).

Ce sont les écarts A2, A4 et A5 de la
[carte des écarts](../../docs/maquettes/2026-11-14-carte-des-ecarts-maquette-code-backlog.md).

## Proposition

1. **Page Sessions.** Une entrée « Sessions » du menu Projet ouvre deux blocs :
   - **En cours** : la session ouverte, sa branche, ses sprints, ses lancements, et le lancement
     en cours ou le dernier terminé ;
   - **Closes** : une ligne par session close, avec sa période, sa branche, ses lancements et ses
     sprints. Un filtre par période et par branche réduit la liste.
2. **Page d'une session.** Un clic ouvre sa page :
   - l'en-tête : ouverture, clôture, durée, branche, fiches citées, PR ;
   - ses lancements, chacun en mots : quoi, mode, période, fins de sprint, issue ;
   - le fil en clair des moments qui comptent : lancement, fin de sprint, question au PO, rétro,
     clôture. Pas d'identifiant technique à l'écran ;
   - ses sprints, chacun cliquable vers la page du sprint ;
   - le récit rendu en sections, pas en Markdown brut, avec le lien vers le fichier ;
   - les fiches citées, chacune cliquable vers la fenêtre de fiche.
3. **Ce qui manque se dit.** Tant qu'une dépendance n'est pas livrée, sa donnée s'écrit « non
   publié ». La page rattache les lancements à une session par la période, et le dit, tant que le
   journal ne porte pas le nom de session.
4. **La Chronologie s'efface.** Son contenu vit désormais dans le fil d'une session. Son entrée de
   menu est retirée par la fiche
   [Le menu de mission control suit la maquette](../20261124111116126_menu-suit-la-maquette-anciennes-pages-retirees.md).

## Critères d'acceptation

- [ ] Le menu Projet a une entrée « Sessions » qui ouvre les blocs « En cours » et « Closes ».
- [ ] Chaque session close montre sa période, sa branche ou « non publiée », ses lancements et ses
      sprints.
- [ ] Un clic ouvre la page de la session, avec son en-tête, ses lancements, son fil, ses sprints,
      son récit par son chemin de fichier et ses fiches citées.
- [ ] Le fil ne montre aucun identifiant technique : ni UUID, ni nom de jalon brut.
- [ ] Une donnée non publiée s'écrit « non publié » : branche, durée, sections du récit. Un
      rattachement par période est dit à l'écran, et la page dit que seuls les 5 derniers sprints
      sont publiés : une session plus ancienne n'en montre aucun, avec cette phrase.
- [ ] Un sprint de la page s'ouvre sur la page du sprint.

## Comment vérifier

```bash
pnpm --dir products/cop1/packages/app exec vitest run src/features/board
pnpm --dir products/cop1/packages/web exec vitest run src/board
pnpm cop1:dev
```

Dans mission control, ouvre « Sessions », puis la session close la plus récente. Compare avec les
pages Sessions et Une session de la maquette.

## Glossaire

- **Lancement** : le mot de l'écran pour un run, par exemple un `/ezk-product-build`.
- **Récit de session** : le fichier écrit à la fermeture de la session, dans `docs/sessions/`.
- **Fil en clair** : la liste des moments qui comptent, en phrases, du plus ancien au plus récent.

## Notes / décisions

- 2026-11-24 : fiche écrite à la demande du PO, qui veut construire la maquette.
- P2, parce que trois dépendances doivent être livrées pour que la page soit vraie. Elle se
  construit après les pages Versions, Objectifs et Sprints.
- Elle dépend de la page Sprints pour ouvrir un sprint :
  [Mission control a une page Sprints](../done/20261124111115955_page-sprints-et-page-d-un-sprint.md).

### Grooming du 2026-11-24 (run autonome)

Fait par l'orchestrateur du run `/ezk-product-build`, sur l'objectif du PO « implémenter le reste
de la maquette ». Décisions :

- **On construit sur ce qui est publié.** Les sessions closes viennent des récits publiés dans
  `sessions` de `ezk board show --json`. La session en cours vient des chantiers du journal de
  supervision, déjà relayés pour la Chronologie.
- **Les trois dépendances ne sont pas tirées dans ce run.** Elles touchent la méthode et le
  journal. En attendant, la branche, la durée et les sections du récit s'écrivent « non publié ».
- **Le rattachement se fait par le jour, et la page le dit.** Un lancement ou un sprint est rangé
  sous une session close quand son jour tombe dans la période de la session.
- **Le fil en clair** reprend les moments du journal, en phrases, sans identifiant technique.
- **Le filtre** porte sur la période ; le filtre par branche attend la branche publiée.
- **Le récit** se montre par son chemin ; son rendu en sections attend l'en-tête structuré.
- **Contrôle « prête » (ezk-pm, 2026-11-24)** : NO-GO puis retouché. Le récit se montre par son
  chemin ; la durée et la troncature des sprints ont leur critère. Les trois dépendances côté
  méthode sortent de `depends:` : la page se construit sans elles, le texte les nomme toujours.


## Validation

| Modalité | Statut |
|---|---|
| Gate locale | ✅ 421 tests app, 307 web, tsc et biome propres |
| Revue adverse | ✅ GO (ezk-reviewer, 0 bloquant ; retour de navigation, note du nombre de sprints, ordre du fil et datation corrigés) |
| Before / after (UI) | docs/pr-evidence/20261124111116042/sessions-before.jpg → docs/pr-evidence/20261124111116042/sessions-after.jpg et session-after.jpg |
