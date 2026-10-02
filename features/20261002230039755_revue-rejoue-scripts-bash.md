---
id: "20261002230039755"
title: La revue locale rejoue les scripts bash modifiés sur des entrées hostiles
type: feature
priority: P2
product: mega-city
milestone:
version:
labels: [revue]
status: idea
pr:
evidence: none # changement de méthode de revue, pas d'écran
created: 2026-10-03
---

# 20261002230039755 — La revue locale rejoue les scripts bash modifiés sur des entrées hostiles

**En clair.** La revue locale (`ezk-reviewer`) juge un script bash en le lisant. Elle laisse alors
passer les erreurs silencieuses, celles qui ne se voient qu'à l'exécution. On veut que, pour tout
diff qui touche un script bash, la revue **rejoue** ce script sur trois entrées hostiles avant de
dire GO.

**Si tu arrives frais.** Une *erreur silencieuse* est un script qui répond « tout va bien » alors
qu'il a échoué : un tube coupé, une commande en échec avalée. C'est une famille que Codex, le
relecteur automatique, trouve mieux que la revue locale.

## Contexte / Problème

**Le symptôme, daté.** 2026-10-02, PR #333. Après le GO de la revue locale, Codex a trouvé trois
défauts de cette famille dans `ship-in-pr.sh` :

- un tube coupé (`| head -1` sous `pipefail`) qui faisait échouer le retrait au hasard ;
- un statut de fiche jamais vérifié ;
- un conflit sur l'index généré lors d'un retrait après fusion de `main`.

Chacun a coûté un cycle complet : retrait du ship, correctif, nouveau ship, passe CI et Codex.

## Proposition

- Pour tout diff qui touche un `*.sh`, `ezk-reviewer` rejoue chaque script modifié sur trois
  entrées : une valeur absente, un tube coupé, une commande `git` en échec. Il lit le code de
  sortie et le message.
- La trace de ce rejeu figure dans le verdict de revue.

## Critères d'acceptation

- [ ] La consigne de l'agent `ezk-reviewer` décrit le rejeu des scripts bash modifiés, sur les
      trois entrées.
- [ ] Le verdict de revue d'un diff qui touche un `.sh` porte la trace de ce rejeu.

**Mesure de suivi** — sur les 5 prochaines PR qui touchent un script bash, 0 défaut de cette
famille trouvé par Codex après le GO local (point de départ : 3 sur la PR #333).

## Comment vérifier

- Relire la consigne d'`ezk-reviewer` : la section rejeu des scripts bash y figure.
- Sur la première PR suivante qui touche un `.sh` : le verdict cite les trois rejeux.

## Notes / décisions

- Retenue à la rétro du 2026-10-03 :
  [capture](../docs/captures/2026-10-03-retro-session-2026-10-02.md), proposition 4. Portée par
  la revue, soutenue par qualité, architecture et produit.
- Réserve du dev : le coût de ce rejeu à chaque diff bash. À mesurer au build ; s'il pèse trop,
  limiter le rejeu aux scripts que le diff modifie vraiment.
- Priorité **P2 proposée** par l'agent, sur délégation du PO.
