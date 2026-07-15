---
name: ezk-readme
argument-hint: "[help|create|audit]"
description: >-
  Crée ou audite le README d'un projet — le point d'entrée névralgique du repo :
  pitch en une ligne, badges adossés à une réalité (CI/release), quickstart,
  et des INDIRECTIONS vers les sources de vérité plutôt que des infos volatiles
  à maintenir, en descendant du général au particulier. A utiliser dès que
  l'utilisateur mentionne un README manquant, à écrire, refaire, améliorer,
  relire ou auditer (« il manque un README », « écris/refais le readme »,
  « c'est quoi ce README », « le README est faux/périmé »), qu'un repo public
  n'a pas de README à la racine, qu'une fiche backlog de type
  readme/documentation d'accueil est tirée, ou en fin de sprint quand la porte
  d'entrée du repo ne reflète plus le projet. Pilotable par sous-commandes :
  help, create (génère depuis l'analyse du repo), audit (rapport + diff
  proposé, jamais d'écrasement direct).
---

# ezk-readme

Tu produis et entretiens **LE point d'entrée névralgique d'un repo** : son README.
Un visiteur doit comprendre en **moins de 30 secondes** ce qu'est le projet,
comment l'essayer, et où creuser — puis chaque clic l'emmène **du plus général
au plus particulier**. Le README **oriente**, il ne **stocke** pas : tout ce qui
bouge vit ailleurs et le README y **pointe**.

## Usage (sous-commandes)

`/ezk-readme [sous-commande]` — ou en langage naturel (« il manque un README »,
« audite le README »).

| Sous-commande | Effet |
|---|---|
| `help` (ou **sans argument**) | Affiche ce tableau + le diagnostic éclair du README courant (existe ? rouille visible ?) — ne modifie rien |
| `create` | Analyse le repo → questions manquantes → génère un `README.md` → le montre avant tout commit |
| `audit` | Lit le README existant → rapport de findings (liens morts, infos volatiles, sections mensongères, badges sans réalité) → **diff proposé**, jamais d'écrasement direct |

> Une demande en langage naturel route vers `create` (pas de README) ou `audit`
> (un README existe). En cas de doute : `audit` d'abord — on ne remplace pas ce
> qu'on n'a pas lu.

## La règle d'or — l'INDIRECTION (un README qui ne rouille pas)

Chaque information a une **source de vérité**. Si elle vit déjà quelque part
(Makefile, `package.json`, `pyproject.toml`, roadmap, docs/, ADRs, releases),
le README **pointe** vers elle au lieu de la recopier. Un README rouille
exactement là où on a dupliqué une info volatile — et un README qui ment est
pire que pas de README.

| ✅ Stable — peut vivre dans le README | ❌ Volatile — indirection obligatoire |
|---|---|
| Le pitch (ce qu'est le projet, à qui il sert) | Numéros de version → badge release / page Releases |
| Le quickstart minimal (2-5 commandes qui bougent rarement) | La liste exhaustive des commandes → `Makefile`, `package.json`, doc dédiée |
| L'architecture en 3 lignes + arborescence de haut niveau | Le détail d'architecture → `docs/`, ADRs |
| Les liens de navigation (docs, roadmap, contributing, licence) | L'état d'avancement, la roadmap → `ROADMAP.md` / issues |
| | Captures d'écran d'une UI qui change chaque sprint → page/site du projet |

Au moment d'écrire une section, demande-toi : « qui met cette phrase à jour
quand le projet bouge ? ». Si la réponse est « quelqu'un devra y penser », c'est
une indirection.

## Badges — seulement adossés à une réalité

Un badge est une **promesse vérifiable**, pas une décoration. Avant d'en poser
un, vérifie que la machinerie existe :

- **Build** : un workflow existe dans `.github/workflows/` → badge Actions.
- **Release** : des releases/tags existent → `img.shields.io/github/v/release/...`.
- **Coverage** : seulement si un endpoint est réellement alimenté (ex. le gist
  JSON du projet muti) — jamais un badge coverage « à brancher plus tard ».
- **Licence** : un fichier `LICENSE` existe.

Un badge rouge en permanence ou un badge « unknown » détruit la confiance :
mieux vaut 2 badges vrais que 5 badges décoratifs. Zéro machinerie = zéro badge,
et c'est très bien.

## Le squelette canon (du général au particulier)

Référence : le README du monorepo **muti** (`~/git/bacasable/muti/README.md`)
et les README de projets populaires. Adapte les sections au type de projet
(app installable, lib, CLI, monorepo) — ne force pas une section vide.

```markdown
# NOM                                    ← H1 court
**Pitch en une ligne — ce que ça fait, pour qui**
Une phrase de valeur concrète (le « pourquoi j'y passerais 5 minutes »).

[badges adossés à une réalité]
---
## 🚀 Quickstart / Download              ← essayer en < 1 min
2-5 commandes, ou les liens d'installation par plateforme
## ✨ Features                           ← 4-6 puces COURTES, orientées valeur
## 🛠 Development                        ← setup minimal + POINTEUR vers le détail
setup en 2 commandes ; « toutes les commandes : voir Makefile / package.json »
### Project structure                    ← arborescence de HAUT niveau commentée
## 📚 Aller plus loin                    ← LES indirections
docs/ · roadmap · ADRs · contributing…
## License                               ← une ligne + lien LICENSE
```

Icônes : **sobres et fonctionnelles** — une par titre de section pour scanner
la page d'un coup d'œil, pas une pluie d'emojis dans le corps du texte.

## `create` — générer le README

1. **Analyser le repo d'abord, questionner ensuite.** Lis ce qui existe :
   manifest (`pyproject.toml`, `package.json`…), `Makefile`, dossier `docs/`,
   roadmap/backlog, `.github/workflows/`, `LICENSE`, releases, site éventuel.
   La majorité du README se **déduit** — ne demande pas ce que le repo sait déjà.
2. **Poser UNIQUEMENT les questions sans réponse** (souvent 1 à 3) : le pitch en
   une ligne si le manifest est muet, le public visé, le statut de licence si
   aucun fichier. Jamais de pitch inventé : c'est la phrase la plus importante
   du fichier, elle appartient à l'auteur.
3. **Langue : anglais par défaut** (convention des repos publics — muti est en
   anglais). Si le projet semble délibérément francophone (docs FR, audience
   FR), confirme la langue avant de générer.
4. **Générer selon le squelette canon**, règles d'or appliquées (indirections,
   badges vérifiés, icônes sobres).
5. **Montrer le résultat avant de committer.** Le commit suit la convention du
   repo (ex. `docs(readme): add project README` — voir ezk-commits).

## `audit` — vérifier un README existant

1. **Lire le README en entier**, puis le confronter au repo réel.
2. **Chercher les findings**, par ordre de gravité :
   - **Mensonges** : affirmations contredites par le code (commande qui n'existe
     plus, feature retirée, mauvaise version de langage) ;
   - **Liens morts** : fichiers/ancres inexistants, URLs cassées ;
   - **Badges sans réalité** : CI supprimée, coverage jamais alimenté ;
   - **Infos volatiles dupliquées** : à convertir en indirections (la rouille
     de demain) ;
   - **Sections manquantes** du squelette canon (quickstart absent, licence
     muette) — ou sections creuses à retirer ;
   - **Navigation plate** : tout au même niveau au lieu du général → particulier.
3. **Produire un rapport court** (finding → preuve → correction proposée) puis
   un **diff proposé**. **Jamais d'écrasement direct** : le README existant est
   l'œuvre de quelqu'un — on propose, l'utilisateur tranche.

## Garde-fous

- **Le README pointe, il ne stocke pas** : toute info volatile passe en
  indirection vers sa source de vérité.
- **Zéro badge décoratif** : un badge sans machinerie derrière est un mensonge
  en pixels.
- **Jamais de pitch inventé** : demander plutôt que broder.
- **Jamais d'écrasement d'un README existant** sans lecture + diff validé.
- **Ne crée PAS la doc manquante** : si `docs/` est vide, le README pointe vers
  le code ou omet la section — écrire la doc est un autre chantier (le noter,
  éventuellement en fiche backlog via ezk-backlog).
- **Sobriété** : simple, lisible, pratique — couper toute phrase qui n'aide pas
  un visiteur à comprendre, essayer ou naviguer.

## Intégration

- **ezk-backlog** : une fiche « README manquant/périmé » se traite avec cette
  skill ; un manque de doc découvert en audit peut devenir une fiche.
- **ezk-commits** : commits `docs(readme): …`.
- **ezk-sprint** : en fin de sprint, un `audit` éclair vérifie que la porte
  d'entrée ne ment pas sur ce qui vient d'être livré.
