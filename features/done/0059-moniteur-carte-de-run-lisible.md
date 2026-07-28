---
id: 0059
product: vectorz
title: Moniteur — une carte par run, lisible d'un coup d'œil (état, gate en cours, projet, ordre)
type: feature
priority: P1
epic:
status: shipped
ready:
pr: "#50"
created: 2026-07-25
---

## Contexte / Problème

Le Moniteur **fonctionne** (fiche 0031 livrée, PR #2) : hydratation `GET
/api/supervision/runs` + deltas SSE, rejoué en réel le **2026-07-25** avec deux runs
(un `finished`, un `at_gate` apparu en direct). Mais ce qu'on **voit** est un bloc de
texte continu. Constats sur pièce (`web/src/SupervisionView.tsx`, `web/src/index.css`) :

1. **Aucune carte.** `RunCard` pose `className="run-card"` — `grep run-card index.css`
   ne renvoie **rien**. Deux runs s'affichent collés, sans bordure ni espacement : la
   liste de gates du premier run touche l'en-tête du second, on ne voit pas où l'un
   finit et où l'autre commence.
2. **Aucun ordre.** `const list = Array.from(runs.values())` — pas de `.sort()`. L'ordre
   est celui d'insertion dans la `Map` (hydratation, puis arrivée SSE). Un run **terminé
   il y a une heure** peut se retrouver **au-dessus** d'un run garé qui attend une
   décision. Sur une vraie session (plusieurs sprints), c'est l'information la plus
   importante qui est la plus difficile à trouver.
3. **L'état est brut.** `{run.state}` affiche la valeur technique — `at_gate`,
   `finished_at_gate` — sans traduction ni couleur. Le 🟡 « run garé » du déroulé de
   démo (fiche 0030) n'existe pas dans l'UI : c'est de la prose de fiche, pas du pixel.
4. **Le gate en attente ne se distingue pas des autres.** Un gate repris et un gate
   **qui attend une décision maintenant** rendent la même ligne, au suffixe
   « — reprise self-reported » près. Or c'est *le* moment produit.
5. **Le projet n'est pas affiché.** `projectRoot` est dans le read-model, jamais rendu.
   Avec plusieurs `watch_roots`, impossible de dire quel projet est concerné.
6. **`notices` et escalades sont invisibles.** `RunCard` rend `gates` et `violations` ;
   `run.notices` est typé, jamais affiché. Et l'événement `escalation` — émis par le
   banc de démo, vérifié dans `events.jsonl` — n'a **aucune** représentation : un
   « stop & ask » d'une méthode ne se voit nulle part.

Ce n'est pas un manque de **collecte** (tout est dans le snapshot ni un manque de
**fraîcheur** (le SSE marche) : c'est un manque de **forme**.

## Proposition

Une passe de lisibilité, **sans nouvelle collecte** et sans toucher au verrou DP2
(panneau strictement read-only, zéro mapping gate→phase côté cop1) :

- une vraie **carte** par run (bordure, espacement, titre) ;
- **tri explicite** : les runs qui demandent quelque chose d'abord (`at_gate`), puis les
  vivants, puis les terminés ; à état égal, le plus récemment absorbé en tête ;
- **état traduit et coloré** (garé 🟡 / en cours / terminé / présumé mort), la valeur
  technique restant lisible au survol ou en petit ;
- le **gate en attente** mis en avant (c'est la question posée à l'humain), les gates
  passés repliés ;
- **nom du projet** (dérivé de `projectRoot`) visible sur la carte ;
- **escalades et notices** rendues — un signal émis qu'on n'affiche pas est un signal
  perdu.

À cadrer au grooming : si le projet a un `docs/design-system.md`, s'y conformer plutôt
que d'inventer des styles (skill `ezk-design-system`).

## Critères d'acceptation

- [ ] Deux runs affichés sont visuellement séparés (constaté sur capture, pas seulement
      en test unitaire).
- [ ] Un run `at_gate` apparaît **avant** un run `finished`, quel que soit l'ordre
      d'arrivée des snapshots.
- [ ] L'état est lisible en français et distingué par la couleur ; un run présumé mort
      reste distinguable d'un run terminé.
- [ ] Le gate qui attend une décision est visuellement distinct des gates déjà repris.
- [ ] Le projet concerné est identifiable sur la carte.
- [ ] Une escalade émise (`escalate`) apparaît dans la carte ; idem pour une `notice`.
- [ ] Le panneau n'émet **aucune** requête d'écriture (verrou DP2 préservé).

## Notes

- **Complémentaire, pas doublon, de la fiche 0022** (« afficher ce qui est déjà collecté :
  heure, durée, agent, historique, $ ») : 0022 ajoute du **contenu** au panneau, celle-ci
  corrige sa **forme**. Les deux se tirent bien dans cet ordre (forme d'abord, le contenu
  ajouté hérite de la mise en page). Le PO peut décider de les fusionner en un seul sprint.
- Résonne avec la fiche mega-city **0079** (restitutions lisibles) — même exigence,
  autre surface : là c'est du texte de LLM, ici de l'UI.
- Devient utile **le jour où de vrais runs arrivent** — donc après la fiche mega-city
  **0094** (brancher l'émetteur sur Claude Code).
