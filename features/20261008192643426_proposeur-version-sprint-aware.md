---
id: "20261008192643426"
title: Proposer la version d'une fiche, sans entrer en conflit avec les sprints en cours
type: feature
priority: P1
product: mega-city
status: idea
blocked: deferred
pr:
evidence: none # commande/règle de méthode, sans écran
created: 2026-10-08
---

# 20261008192643426 — Proposeur de version (sprint-aware)

**En clair.** Quand tu ajoutes ou groomes une fiche, rien ne te dit dans quelle version la ranger.
Tu voudrais que la méthode te le **propose**, en regardant les versions existantes. Et qu'elle
**évite** les versions déjà prises par un sprint en cours — elle proposerait plutôt une version
ultérieure.

**Si tu arrives frais.** Une *version* (`v0.8.0`) est un lot de livraison. Un *sprint en cours*
travaille une version précise ; y glisser une fiche neuve en plein vol crée des conflits.

## Contexte / Problème

Déclencheur daté : **2026-10-08**, demande PO, née d'un cas vécu le jour même. J'ai ajouté 4 fiches
et je n'ai **pas su les positionner en version** sans tout inspecter à la main.

L'existant ne couvre pas ce besoin :
- `version check` **contrôle** la cohérence d'un lot (il repère qu'une fiche est mal rangée), mais
  il ne **propose** pas de version pour une fiche qui n'en a pas ;
- `review` et `aggregate` touchent la priorité et le regroupement, pas le placement en version ;
- le slot `version:` d'`add` est à remplir **à la main**.

## Proposition

Esquisse, à groomer : un **proposeur de version** — une commande (p.ex. `ezk backlog version suggest
<id>`) et/ou une règle — qui :

- lit les **versions existantes** et leur état (livrée / en cours / à venir — source : le train de
  versions de `PLAN.md` + le front-matter) ;
- rapproche le **thème** de la fiche (`labels:`) du contenu des versions ;
- **écarte** les versions livrées et celles **en cours** (sprint actif) — ne propose qu'une version
  **ultérieure** à la plus avancée en cours ;
- rend une **proposition motivée** (« cette fiche ↔ v0.8.0 : même thème, et v0.7.0 est en cours »),
  **jamais** une bascule automatique (arbitrage PO, comme tout dans le backlog).

Branché sur `add` (au moment de choisir la version) et sur `review` / `version` (passe de rangement).

Point à trancher au grooming : **comment lire « sprint en cours »** — via `SPRINT.md` / le lot
ouvert, ou via l'état des versions.

## Critères d'acceptation

- [ ] *(à groomer)* Pour une fiche sans version, la méthode propose une version motivée, choisie
      parmi les versions **non livrées**.
- [ ] *(à groomer)* La proposition **écarte toute version en cours** (sprint actif) et préfère une
      version ultérieure.
- [ ] *(à groomer)* Elle **propose**, elle ne bascule jamais seule (arbitrage PO).

## Comment vérifier

À définir au grooming. Direction : sur une fiche sans version, lancer le proposeur → une version non
livrée, jamais celle d'un sprint ouvert ; vérifier qu'il refuse de proposer une version déjà livrée
ou en cours.

## Notes / décisions

- **Étend** la famille `version` (`version check` / `list` / `close`) et le slot version d'`add`.
  Ne réimplémente pas `version check` (contrôle) — il le **complète** (proposition).
- **Cas fondateur** : les 4 fiches ajoutées le 2026-10-08, que je n'ai pas pu placer
  automatiquement — dont [Mesurer le coût tokens…](20261008182705779_adaptateur-cout-tokens-observabilite.md).
- Source de l'état « livrée / en cours / à venir » : le train de versions de `PLAN.md`.
- Capturée en `idea` sur demande PO (2026-10-08), **P1**.
- Rapatriée le 2026-11-03 de la branche `claude/ezk-grooming-sessions-dd9b52` (grooming du 2026-10-09, plan v0.11
  périmé) : repassée en idée, à regroomer contre le code d'aujourd'hui.
- **Mise en attente le 2026-11-03** (run autonome) : la fiche contredit
  [l'ADR-0083](../products/mega-city/docs/adr/0083-version-etiquette-milestone-unite-de-preparation.md).
  Elle propose une version dès l'ajout ou le groom d'une fiche. L'ADR, ta décision du 2026-10-23, dit
  que la version se pose à la construction, et que la poser trop tôt a coincé des versions prêtes. Deux
  issues : clore la fiche, ou la changer en « proposer la milestone d'une fiche », le trou d'outillage
  que l'ADR-0083 nomme. Ces deux exigences se contredisent : le choix te revient.
