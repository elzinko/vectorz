---
id: 0099
title: Contrat d'émission — vérifier la STRUCTURE des directives, pas compter les mentions
type: chore
priority: P2
epic:
status: idea
ready:
pr:
created: 2026-07-26
---

# 0099 — Contrat d'émission : vérifier les directives, pas les mentions

## Contexte / Problème

`src/supervision/__tests__/skill-emission-contract.test.ts` (livré par mc-0095, PR #55)
vérifie qu'une skill émettrice mentionne chaque outil du kit **au moins deux fois**. Ce
seuil vient d'un vrai défaut trouvé en revue : une seule occurrence était satisfaite par
la **phrase de garde** (« si les outils MCP `run_start`, … sont disponibles »), donc on
pouvait supprimer *toutes* les consignes réelles et rester vert.

**Mais compter reste un proxy** (finding Codex P2 sur la PR #55, reproduction fournie) :

> retirer la directive de clôture `run_finished {status: …}` d'`ezk-product-builder`
> laisse encore le nom dans la phrase de garde **et** dans la discussion sur
> l'absorption — le seuil ≥2 est satisfait, le test reste vert, et la skill ne dit plus
> comment clore son run.

Le seuil ne tue donc qu'un seul cas : « il ne reste QUE la phrase de garde ». Toute
suppression partielle passe.

## Proposition

Vérifier la **structure** de chaque directive plutôt que sa fréquence. Pistes à
instruire (aucune tranchée) :

1. **Découper la section d'émission** (entre son titre et le titre suivant) et
   n'assertionner que dessus — la prose environnante cesse de compter.
2. **Motif de directive** : exiger, pour chaque outil, une occurrence en position
   d'appel — `` `outil {` `` (charge utile nommée). Attention : `vz-product-builder`
   écrit aujourd'hui « `run_start` au lancement ; `run_finished` à la clôture » sans
   accolades — soit on normalise ces skills, soit le motif accepte les deux formes,
   et il faut choisir sciemment.
3. **Cycle de vie** : vérifier que chaque outil apparaît dans **son** moment (ouverture /
   checkpoint / reprise / signal / clôture), ce qui rapproche le test de la spec du
   template (`src/supervision/README.md`) au lieu du texte.

## Critères d'acceptation

- [ ] Retirer une directive isolée d'une skill émettrice (en laissant le nom de l'outil
      dans la prose) fait **rougir** le test — prouvé par sabotage, message actionnable
- [ ] Aucun faux positif sur les 4 skills émettrices actuelles (formes hétérogènes :
      `vz-product-builder` n'utilise pas partout la forme à accolades)
- [ ] Le test reste lisible et ne casse pas à la première reformulation éditoriale —
      c'est le compromis explicite à tenir, l'annoncer dans l'en-tête
- [ ] Les deux limites documentées en tête du fichier sont mises à jour (celle-ci
      disparaît, le quadrant « n'émet pas ET non déclarée » reste — voir 0068)
- [ ] Gate locale verte

## Notes / décisions

- **Suivi de mc-0095** (PR #55), au même titre que mc-0098 l'était de #53. Le finding
  est **juste** ; il n'a pas été traité dans #55 parce que la correction demande un
  parseur et que le PO avait décidé de clore la session — pas parce qu'on le conteste.
- Parenté avec **mc-0066** (« tester un skill/agent avant merge ») : même famille de
  problème — une skill est du texte, rien ne la compile. Deux findings bloquants de la
  revue de #55 (`gate_id` accentué refusé par le runtime, « 4 checkpoints » alors que la
  table en a 5) relevaient exactement de ça. À regrouper avec 0066 si le PO le juge bon.
- Ne pas sur-investir : le test doit rester un **filet anti-régression**, pas un
  validateur de markdown. Si la structure devient coûteuse à vérifier, la vraie réponse
  est peut-être 0066 (banc de test de skill), pas un motif plus fin ici.
