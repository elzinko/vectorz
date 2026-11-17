> 🗎 Rendu de la fiche [features/20261117114544666_graphe-publie-en-contrat-commandes-comprises.md](../done/20261117114544666_graphe-publie-en-contrat-commandes-comprises.md)

# 20261117114544666 — La méthode publie son graphe en contrat, commandes comprises

**En clair.** La méthode sait déjà calculer le graphe de ses briques : profils, compétences, agents,
paquets, règles, outils, et les liens entre eux. Mais elle le sort sans format garanti, et les commandes
`ezk` n'y figurent pas. On publie ce graphe dans un contrat versionné, commandes comprises, pour que la
carte de la méthode de mission control puisse le lire tel quel.

**Si tu arrives frais.** Le graphe relie des briques par des liens typés, lus « source verbe cible » :
une compétence *convoque* un agent, un paquet *compose* une règle. Un contrat est une sortie `--json`
décrite par un schéma, versionnée et livrée avec un exemple. Mission control ne lit que des contrats
(ADR-086).

## Contexte / Problème

`ezk graph check --json` sort aujourd'hui `nodeCount`, `edgeCount`, `broken`, `orphans`, `edges` et
`pathRefs`. Constat du 2026-11-17 : 262 briques, 317 liens, aucun lien cassé.

Trois manques empêchent un écran de s'y fier :

1. Pas de liste des briques : `nodeCount` donne des comptes par sorte, l'écran doit deviner les briques
   à partir des liens, et une brique sans lien disparaît.
2. Pas de schéma ni d'exemple : la forme peut changer sans prévenir.
3. Les 75 commandes `ezk` du manifeste ne sont pas des briques. Le code sait pourtant déjà quelles
   commandes servent chaque outil (`tool.commands`, ADR-0058).

C'est la première tranche de la fiche
[Le graphe de la méthode en un contrat compilé](../20261114131614982_graphe-de-la-methode-en-contrat-compile.md).

## Proposition

1. `ezk graph check --json` ajoute `schema_version: 1` et `nodes[]` : `kind`, `id`, `fichier` quand la
   brique a un fichier. Les champs existants restent.
2. Contrat `contracts/graph-check/v1/` : `schema.json` et `example.json`, sur le modèle de
   `contracts/process-show/v1/`. Un test vérifie que la sortie réelle respecte le schéma.
3. Une 7ᵉ sorte de brique, `command`, id `ezk <domaine> <verbe>`, tirée du manifeste. Un 6ᵉ verbe,
   `lance` : une commande *lance* l'outil qu'elle exécute. Amendement court de l'ADR-0040, à la suite
   de l'ADR-0058.
4. Une compétence *utilise* une commande quand sa documentation la cite en code (`` `ezk <domaine>
   <verbe>` ``). Même verbe que pour les outils : pas de verbe neuf.

## Critères d'acceptation

- [x] `ezk graph check --json` porte `schema_version: 1` et `nodes[]`, chaque brique avec sa sorte et
      son id ; le nombre de briques par sorte égale `nodeCount`.
- [x] `contracts/graph-check/v1/schema.json` et `example.json` existent ; un test valide la sortie
      réelle contre le schéma.
- [x] Chaque commande du manifeste est une brique `command`, reliée par `lance` à l'outil qu'elle exécute.
- [x] Une compétence dont le SKILL.md cite `` `ezk <domaine> <verbe>` `` a un lien `utilise` vers cette
      commande ; un test le prouve sur une compétence réelle.
- [x] Le graphe ne compte aucun lien cassé de plus qu'avant ; la gate reste verte.

## Comment vérifier

```bash
ezk graph check --json | python3 -c "import json,sys,collections; d=json.load(sys.stdin); print(d['schema_version'], collections.Counter(n['kind'] for n in d['nodes']))"
cd products/mega-city && pnpm gate
```

## Glossaire

- `brique` — un nœud du graphe : profil, compétence, agent, paquet, règle, outil ou commande.
- `lien` — une arête typée par un verbe : compose, convoque, applique, est-vérifié-par, utilise, lance.

## Notes / décisions

**Livraison du 2026-11-17.** Revue adverse `ezk-reviewer` : GO, 5 critères prouvés sur le vrai graphe
(337 briques, 437 liens, 0 cassé). ADR-0089 amende l'ADR-0040 : 7ᵉ sorte `command`, 6ᵉ verbe `lance`.
Corrigé en passant : la sortie `--json` était tronquée à 64 Ko dans un tuyau (`process.exit`).
Reste ouvert, non bloquant : un triple-backtick sur une seule ligne compterait comme une citation.


- Découpée le 2026-11-17 de la fiche du graphe compilé, par délégation du PO absent (run autonome
  jusqu'à 17 h 31). Restent dans la fiche d'origine : les recettes, le bloc santé, la dette de la loi et
  l'alignement de la page Cartes.
- Débloque la fiche [La carte de la méthode, zoomable](../20261117114544792_carte-de-la-methode-zoomable.md).


## Validation

| Modalité | Statut |
|---|---|
| Revue ezk-reviewer | ✅ GO 5/5 |
| Tests ciblés (91) | ✅ |
| Gate mega-city | ✅ 2424 tests + 48 suites |
| Before / after (UI) | N.A. — sortie JSON sans écran |
