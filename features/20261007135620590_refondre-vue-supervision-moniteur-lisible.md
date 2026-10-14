---
id: "20261007135620590"
title: "Unifier les tableaux de bord en un seul (Moniteur + cockpit + board), guidé par maquette"
type: feature
priority: P1
product: cop1
milestone: parked
version:
labels: [supervision, moniteur, cockpit, board, dashboard, lisibilite, ux]
status: idea
blocked: "différée-PO — maquette validée (v17) + specs capturées le 2026-10-12. Attend 3 décisions PO : (1) la version — pressentie v0.15 « Voir les runs », ou une version UX dédiée ; (2) le découpage en fiches filles (voir « Découpage proposé ») ; (3) l'ADR qui grave le modèle (run → moments → fiches, deux portées de config). Puis dé-parker + versionner + groomer chaque fille."
pr:
evidence: before-after
created: 2026-10-07
---

# 20261007135620590 — Unifier les tableaux de bord en un seul

**En clair.** On remplace les **trois tableaux de bord éparpillés** par **un seul**, pour piloter la méthode d'un coup d'œil. On l'a conçu par **maquette** : plusieurs itérations, départagée par des agents UX puis validée par le PO. La maquette est la **référence** de ce qu'on construit. Cette fiche **enregistre le design validé**. Elle est trop grosse pour un sprint : on la **découpe** en fiches filles avant de coder (voir plus bas).

La maquette (référence) :
- dans le dépôt : [docs/maquettes/board-ezk-dashboard.html](../docs/maquettes/board-ezk-dashboard.html)
- version interactive, pour le PO : https://claude.ai/artifact/FBouL8J1ojp75rBLfNLUGF

**Si tu arrives frais.** Le produit concerné est **cop1**, la webapp qui observe les projets de la méthode. Aujourd'hui elle a trois écrans séparés : le **Moniteur** (les runs), le **cockpit** (les projets et leur config), et **ezk:map / board** (le plan et l'avancement). On les fond en un seul « board ». Trois mots-clés : un **run** est une session de la méthode ; un run contient des **moments** (les étapes : grooming, sprint, rétro…) ; chaque moment traite des **fiches**.

## Contexte / Problème

Constaté le 2026-10-07 sur le Moniteur live (vectorz, 32 runs), puis tout au long du brainstorming :

- **Trois surfaces qui se contredisent.** La fiche projet dit « 32 runs » et sa vue détaillée dit « aucun run ». On ne sait pas où regarder en premier.
- **Le coût en tokens s'affiche « non mesuré » partout.** La colonne la plus utile pour piloter est vide.
- **Maille run/gate, pas métier.** On voit des runs et des gates, pas « par version / sprint / fiche ».
- **Texte inventé dans les listes d'activité.** Les résumés étaient rédigés à la main, pas tirés des données — donc faux dès que la réalité changeait.

Le brainstorming (octobre 2026, avec le PO) a tranché le **modèle** et les **surfaces**. La maquette les montre. Cette fiche les grave.

## Proposition

**Un seul tableau de bord**, par projet, avec un **modèle commun** et des **affichages déterministes**.

### Le modèle (ce qui est gravé)

- **Version = lot.** Une version regroupe les fiches d'un même lot de travail.
- **Deux jauges indépendantes par version.** Le **cadrage** (grooming → DoR) d'abord, la **réalisation** (dev → livré) ensuite. Ce ne sont pas une seule « progression ».
- **Run → moments → fiches.** Un run est une session de la méthode. Il contient des **moments** (étapes de process : idéation, grooming, DoR, sprint, revue, rétro, release-gate, tag). Chaque moment traite une ou plusieurs **fiches**. Un même run peut faire du cadrage **et** du dev ; on le regarde alors **à travers une lentille** (côté cadrage dans la vue Cadrage, côté sprints dans la vue Développement).
- **Deux portées de configuration.** Le **projet** parle en **tiers abstraits** (modèle `high/middle/low`, effort idem) ; il voyage avec le repo. L'**outil** (poste) **résout** le tier en modèle concret ; ce mapping ne voyage pas avec le repo. Exemple : `middle` devient Sonnet 5.5 sous Claude Code, Grok 4 sous Cursor.

### Les affichages sont déterministes

- Pas de texte inventé. Le nom d'une ligne d'activité est le **nom de session du run** (vraie donnée). Les pastilles sont les **vraies étapes** (moments) du run.
- Les métriques et les coûts viennent du journal, pas d'une saisie.

### Les surfaces (les écrans de la maquette)

Par projet, dans la navigation de gauche :

1. **Vue d'ensemble** — métriques « depuis le début », entonnoir du pipeline, et un tableau « Versions dans le process » (une ligne par version ; la version en run est surlignée ; bouton « Lancer » ou « Voir le run »).
2. **Cadrage** — trois colonnes par étape de cadrage (à cadrer / en cours / cadré), plus les runs de cadrage récents.
3. **Développement** — trois colonnes (à développer / en cours / développé), un bouton « Lancer » par lot prêt, et les runs de développement.
4. **Fiches** — kanban ou liste, filtre par catégorie de version (à venir / en cours / réalisées, défaut : à venir + en cours), repère « en cours » dans le sélecteur de lot.
5. **Chronologie** — une ligne par évènement, temps compact à gauche, pastilles, filtres par type et par lot.
6. **Configuration (projet)** — lancement, qualité, intégration, et le **modèle par rôle** (tier → modèle résolu affiché en bout de ligne).
7. **Process** — le graphe du process, chaque nœud cliquable (voir Notes : lien avec le socle « étapes comme données »).

Détails transverses :

- **Détail d'un run** → la liste de ses **moments** ; chaque moment montre les fiches traitées et leur transition de statut.
- **Modale fiche** — un clic sur une fiche ouvre une grande modale, avec un lien vers la page complète de la fiche.
- **Configuration de l'outil** — une **page globale** (bouton ⚙ en haut à droite, hors du projet) : l'IDE actif, les défauts (modèle + effort), et le **mapping tier → modèle concret, éditable**.
- **Ajouter un projet** — un assistant (racine, outil, config par défaut) ; le mapping vient de l'outil, pas redemandé.

## Critères d'acceptation

> Les critères portent sur le **résultat observable**, pas sur la commande. Une case cochée = prouvée par un relecteur qui a rejoué « Comment vérifier ». À affiner au grooming de chaque fiche fille.

- [ ] L'écran réel **réunit les trois surfaces** (runs, projets/config, plan/board) en un seul board cohérent, fidèle à la maquette.
- [ ] Un lecteur neuf dit, sans explication, ce qui s'est passé et où regarder (lentille « nouveau venu »).
- [ ] L'**activité est déterministe** : chaque ligne porte un nom de run réel et des pastilles d'étapes réelles — aucun texte de résumé inventé.
- [ ] On descend **run → moments → fiches** : cliquer un run montre ses moments, chaque moment ses fiches et leur transition de statut.
- [ ] Le **coût en tokens** d'un run est visible (ou son absence est explicite et justifiée, pas un « non mesuré » muet).
- [ ] **Une seule vérité par projet** : plus de « 0 run » d'un côté et « 32 » de l'autre.
- [ ] La config **projet** parle en tiers ; la config **outil** (page globale) résout le tier en modèle concret, **par IDE** ; changer l'IDE change le modèle résolu.
- [ ] Le **mapping est éditable** dans la page outil.
- [ ] Preuve **avant / après** en PR (règle `development/pr-before-after-media`), écran réel comparé à la maquette.

**Mesure de suivi** *(optionnel)* : 0 retour « je ne sais pas où regarder » du PO sur le board unifié pendant 3 semaines d'usage.

## Comment vérifier

> Procédure, pas recopie des critères. À compléter au grooming de chaque fille (chaque surface a son parcours).

```bash
# 1. La maquette de référence s'ouvre et se lit (comparaison écran réel ↔ maquette)
open docs/maquettes/board-ezk-dashboard.html

# 2. La webapp cop1 construit (quand une fille est codée)
pnpm --dir products/cop1/packages/web build

# 3. Preuve agent, par surface : capture avant (3 écrans séparés) / après (board unifié),
#    + un parcours filmé run → moments → fiche. Liée dans le corps de PR.
```

## Découpage proposé

> À valider par le PO. **Pas de fiche chapeau** : les filles sont des sœurs, liées par un même `milestone:` + une même `version:`, et référencent cette fiche + l'ADR + la maquette. Ordre et version à trancher.

| Tranche | Ce qu'elle couvre | Dépend de / à relier |
|---|---|---|
| Coque + Vue d'ensemble | en-tête, navigation, sélecteur de projet, métriques, entonnoir, tableau des versions | socle moments + métriques |
| Cadrage + Développement | les deux pipelines à jauges, les boutons « Lancer » | — |
| Activité par run → moments → fiches | tables d'activité déterministes, détail run, modale fiche | **catalogue des moments** (livré) |
| Fiches | kanban/liste + filtre par catégorie de version | surfaces fiches existantes |
| Chronologie | frise condensée + filtres | socle moments |
| Config projet | lancement/qualité/intégration + modèle par rôle | la fille « config outil » |
| Config outil (globale) + mapping tier→modèle | page ⚙, IDE, défauts, mapping éditable, indirection | **tranche [20261013132218656](20261013132218656_config-outil-page-reglage-mapping.md)** (découpée du moteur 20261002205205417 le 2026-10-13) |
| Ajout de projet | assistant de démarrage | config projet + outil |

Deux fiches voisines à **relier** (affichages du même board, pas des doublons) :
- « cop1 — afficher les itérations lancées avec leurs paramètres » : [20260906142654370](done/20260906142654370_cop1-afficher-iterations-lancees-parametres.md) (v0.15).
- « une page : une ligne par projet » : [20261002115451451](20261002115451451_page-une-ligne-par-projet.md) (cockpit).
- « viz qualité par PR » : [0056](0056-viz-qualite-mission-control.md).

## Glossaire

- **cop1** — la webapp qui observe les projets de la méthode (host du Moniteur / cockpit).
- **Run** — une session de la méthode, du début à la fin.
- **Moment** — une étape de process dans un run (grooming, sprint, rétro, gate…), qui traite des fiches.
- **Lot** — synonyme de version : les fiches regroupées pour une release.
- **Cadrage** — amener une fiche à « prête » (grooming → DoR).
- **Tier** — un niveau abstrait de modèle ou d'effort (`high / middle / low`) que l'outil résout en valeur concrète.
- **Poste / outil** — la portée de config propre à l'IDE installé ; ne voyage pas avec le repo.

## Notes / décisions

- 2026-10-07 : créée en regardant le Moniteur live. Re-scopée par le PO le 2026-10-11 : unifier les trois surfaces, guidé par maquette.
- **2026-10-12 : maquette validée (v17) + specs capturées** (cette fiche). Le brainstorming et le départage UX sont faits. La fiche sort de son attente « après la maquette ».
- **Décisions de design gravées** (candidates à un ADR dédié — « le board unifié : modèle run → moments → fiches, deux portées de config ») :
  - affichages déterministes (nom de run + moments réels, pas de texte inventé) ;
  - activité par **run**, vue à travers une lentille (cadrage / dev) ;
  - **run → moments → fiches** comme hiérarchie de navigation ;
  - config à **deux portées** ; le mapping tier→modèle est **au niveau de l'outil** (sinon le projet casse dans un autre IDE) ;
  - 3 tiers figés ; défaut + surcharges par rôle ; surcharge projet **en réserve**.
- **Dépendances données (socle).** Pour que l'activité et les coûts soient **vrais**, le journal doit enregistrer les moments par run et par fiche, et les tokens. Le socle est **livré** : [catalogue des moments](done/20261004101755756_contrat-bus-catalogue-moments.md) (v0.7). Les tokens par fiche/sprint/version relèvent du cluster métriques : [0052](0052-socle-metrique-port-adaptateur-silo.md), [0055](0055-kpi-agreges-commit-pr-sprint-version.md).
- **Process view.** Le graphe du process s'appuie sur les étapes déclarées ; leur complétude déterministe est le sujet de [20260830110131228](20260830110131228_schema-etapes-skill-configurables.md) (étapes comme données). La pose des fiches sur le schéma est déjà livrée : [20261002115451315](done/20261002115451315_fiches-sur-le-process-avec-session.md).
- **Produit & version.** Un seul backlog, un seul train ; le produit est le champ `product:` (ici **cop1**). Version pressentie : **v0.15 « Voir les runs »**, ou une version UX dédiée. **Décision PO.**
- **Chevauchement config/modèle** — résolu le 2026-10-13 : le moteur 20261002205205417 a été découpé en trois tranches v0.17 — [schéma/résolveur](20261013132218242_config-modeles-schema-et-resolveur-pur.md), [pointeurs/CLI](20261013132218451_config-modeles-pointeurs-et-cli.md), et la [page ⚙ config outil](20261013132218656_config-outil-page-reglage-mapping.md). Pas de duplication : le board affiche, le moteur calcule.
- Référence « ce qui se lit » (page rapide des 32 runs, PO) : https://claude.ai/artifact/5EevcXyhCQ14AEqnr3HEte
