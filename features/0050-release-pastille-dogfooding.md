---
id: 0050
title: Canal de release + pastille de MAJ — dogfooding sûr (version figée par squash-merge, adoption aux jalons upgrade_ok)
type: feature
priority: P1
status: todo
ready:
pr:
created: 2026-07-18
---

# 0050 — Canal de release + pastille de mise à jour

## Contexte / Problème

Le PO veut **tester l'outil pendant qu'il se développe** (dogfooding) : lancer l'app,
cliquer, consulter l'interface via un lien — pendant que les devs continuent dans des
worktrees. Aujourd'hui rien ne matérialise « **une version exploitable** » : le testeur
lance ce que le checkout courant contient, et une modification de sources en parallèle
peut casser l'outil **pendant** qu'il tourne.

Les briques amont existent déjà — il manque le maillon du milieu :

- ✅ **`upgrade_ok`** (kit émetteur, mega-city 0050, shippé #35) : le signal mécanique
  « état sûr pour une MAJ » (arbre git propre, aucun chantier en vol), calculé à chaque
  jalon, non forgeable par le LLM.
- ✅ **Doctrine gravée** (capture `docs/captures/2026-07-13-contrat-methode-et-versions.md`
  §1, plan LIVRAISON) : **D1** pas de migration à chaud, jamais · **D2** adoption aux
  frontières de jalon · **D11** l'éligibilité de MAJ appartient à la méthode
  (`adopt_version` seulement si `upgrade_ok`).
- 🟡 **Banc cobaye** ([0041](0041-cobaye-banc-test-rapide.md), ready) : le banc qui
  consommera ces versions figées.
- ❌ **Le canal de release + la pastille** : cette fiche.

## Valeur

Le dogfooding devient **sûr et quotidien** : le PO teste toujours une version **figée et
identifiée** (jamais un arbre en mouvement), voit d'un coup d'œil qu'une version plus
récente existe (pastille), et la MAJ ne peut se faire **qu'aux fenêtres sûres** — jamais
sous une session en vol. C'est le chaînon entre « le kit émetteur est shippé » et « le
self-hosting au quotidien ».

## Proposition

1. **Version figée à chaque merge** : chaque PR **squash-mergée sur `main` avec CI
   verte** produit une version exploitable identifiée (tag/numéro + SHA). Mécanisme
   exact (tag git + checkout dédié vs artefact packagé) : à trancher au build
   (ezk-architect) — le critère est « lançable en une commande, insensible aux worktrees
   de dev ».
2. **Pastille « MAJ disponible »** : l'outil qui tourne (mission-control) affiche un
   indicateur quand une version plus récente que la sienne existe.
3. **Adoption aux jalons seulement** : la MAJ ne s'applique que si `upgrade_ok` est vrai
   (D1/D2/D11). Session en vol → refus expliqué. L'outil **propose**, l'humain (ou la
   policy de siège) **déclenche**.
4. **Compose, ne réimplémente pas** : `upgrade_ok` (kit mega-city), CI main existante,
   banc 0041 (consommateur), `ezk-preview` (lien de consultation).

## Critères d'acceptation

- [ ] Après un squash-merge CI-verte sur `main`, une version identifiée (tag/numéro)
      existe et se lance **en une commande**, insensible aux modifications de sources
      dans les worktrees de dev.
- [ ] L'outil lancé en version N affiche la **pastille** quand N+1 existe — vérifiable :
      merger une PR pendant que l'outil tourne → la pastille apparaît sans redémarrage.
- [ ] Tenter la MAJ **pendant une session en vol** → refus avec explication ; au jalon
      `upgrade_ok` → la MAJ s'applique et l'outil relance en N+1.
- [ ] Chaque adoption de version est **journalisée** (supervision — aucun changement de
      version silencieux).
- [ ] Le testeur peut **consulter l'interface via un lien** pendant que les devs
      continuent en worktree (compose 0041 / ezk-preview).
- [ ] Doc courte côté testeur : « comment tester une version figée, lire la pastille,
      déclencher la MAJ ».

## Notes / décisions

- **P1 demandé par le PO (2026-07-18)** — dogfooding jugé structurant ; ordre naturel
  avec 0041 : le banc d'abord (il consomme), le canal ensuite — ou build coordonné si
  tirés dans la même fenêtre.
- Anti-doublon vérifié (2026-07-18) : 0041 = le **banc** (n'a pas de canal de release) ;
  0047 = la **réflexion** migration réflexive (P3, idea, vise ADR+article) ; mega-city
  0007 = invariants de règles ; capture 13/07 = la **doctrine**. Aucune fiche ne portait
  le canal + la pastille.
- `ready:` volontairement vide — gate DoR au PO (ADR-0016).
