# ADR 0012 — composition inter-skills : champ `composes`, résolution déterministe

- Statut : **proposé**
- Date : 2026-07-06

## Contexte

La doctrine « orchestrateur mince, compose ne réinvente pas » (ADR-0007/0008) repose
entièrement sur des références inter-skills — mais elles vivent en **prose** dans les
playbooks, interprétées par le LLM à l'exécution. Audit du 2026-07-05 : ces dépendances sont
invisibles à `expand`/`bind` (un Profile peut binder ezk-product-builder **sans** ezk-sprint
sans aucune erreur), l'invariant ADR-0002 « référencer par id » ne leur est pas appliqué, et
au moins 4 intégrations déclarées d'un seul côté se sont révélées fantômes. C'est exactement
la prose load-bearing que la leçon `lifefindsaway` (ADR-0001) interdit. Contrairement à
Interaction (différé argumenté par ADR-0002), aucun ADR ne traitait ce trou. Pas d'héritage
entre skills chez aucun hôte : la composition par référence est le seul mécanisme réel.

## Décision

1. **Deux champs de frontmatter sur Skill** :
   `composes: [ids]` — skills du catalogue requis par le playbook (résolus, validés) ;
   `composes-external: [ids]` — sous-skills hors catalogue (`anthropic-skills:skill-creator`,
   `product-management:product-brainstorming`…), tolérés dangling (ADR-0003 §4).
2. **Résolution déterministe, avis non bloquant.** `expand` résout `composes` en fermeture
   transitive ; `bind` émet un **warning déterministe** listant les composants manquants du
   profil (il n'échoue pas : l'id est le contrat, ADR-0002). Le domaine (`docs/domain.ts`)
   gagne `Skill.composes?: string[]` — et au passage `Skill` doit représenter la réalité
   dossier (`skills/<id>/SKILL.md` + `scripts/`), refermant la couture capture→bind.
3. **La vue est générée, jamais rédigée.** Un script (`bin/` ou étape de `bind`) génère le
   diagramme Mermaid du graphe de composition dans `skills/README.md` (bloc managé) — le
   LLM ne range jamais, le script range (ADR-0001 §2). C'est la réponse « visuelle » :
   le graphe se lit, il ne se maintient pas à la main.
4. **Pas d'héritage.** Ni `extends` ni surcharge entre skills : la composition par référence
   suffit et reste le seul mécanisme que les hôtes savent exécuter.

## Conséquences

**Plus facile** — binder un orchestrateur sans ses composants devient visible au bind ;
le graphe de composition est consultable et toujours à jour ; les audits croisés (steward)
ont une base mécanique.

**À surveiller** — ne pas transformer le warning en erreur (les refs externes sont légitimes) ;
la fermeture transitive doit rester un calcul pur (testable sans FS).

## Alternatives écartées

- **`extends` entre skills (héritage)** — fige une hiérarchie non validée, aucun hôte ne
  l'exécute, complexité sans consommateur. Rejeté (même raisonnement qu'ADR-0002).
- **Statu quo (prose)** — prose load-bearing, intégrations fantômes déjà constatées. Rejeté.
- **Résolution bloquante au bind** — casserait les compositions externes légitimes. Rejeté.
