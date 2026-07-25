---
id: 0063
title: Ancrer un projet depuis le Moniteur — bouton « ajouter projet » + sélection de dossier + install via le daemon (2 modes)
type: feature
priority: P2
epic:
status: idea
ready:
pr:
created: 2026-07-26
---

## Contexte / Problème

Brancher un projet est aujourd'hui une **commande CLI** (`supervision:link`, fiche 0094).
Demande PO (2026-07-26) : le faire **depuis le Moniteur** — « on clique *ajouter projet*, on
sélectionne un répertoire via une modale (OSX), puis tout est installé via le Moniteur ».

C'est cohérent avec l'invariant **anti-falsification** (fiche 0050/0082) : c'est **l'humain**
qui ancre un projet, jamais le modèle. Le geste d'ancrage a juste besoin d'une **UI**.

## Valeur

- Ancrer un projet **sans terminal** — le geste devient un clic, pas une commande à connaître.
- Le superviseur (déjà un logiciel qui tourne) **pilote l'install**, au lieu que l'utilisateur
  assemble `.mcp.json` + `watch_roots` à la main.

## Proposition

Un bouton **« Ajouter un projet »** dans le Moniteur. À l'activation :

1. **Sélection du dossier** du projet. ⚠️ **Vrai défi technique** : une web UI seule ne peut
   ni ouvrir un dialog dossier natif OSX, ni obtenir un chemin absolu (bac à sable navigateur).
   Le **daemon** (backend) doit exposer le geste — options à instruire : dialog natif via un
   helper côté daemon, saisie/collage du chemin, ou glisser-déposer. À trancher au grooming.
2. **Choix du mode d'install** (voir ci-dessous), puis le **daemon** exécute :
   - le lien d'émission (le mécanisme de `supervision:link`/0094, réutilisé — pas réimplémenté) ;
   - l'ajout aux `supervision.watch_roots` s'il y a monitoring.
3. Le projet **apparaît dans l'écran Projets (0062)** et devient surveillé.

### Les deux modes d'install (axe 3, PO 2026-07-26)

| Mode | Ce qu'on installe | Pour |
|---|---|---|
| **Méthode seule** | skills/agents (le catalogue) — **pas** de MCP, pas de watch | développer avec ezk-*, sans surveiller |
| **Supervisé** | méthode **+** `.mcp.json` **+** watch du daemon | + voir dans le Moniteur |

Le mode « méthode seule » est **déjà supporté par les skills** (clause « si les outils MCP
sont dispo — sinon saute sans bruit ») : la méthode n'a **pas besoin** du MCP pour exister.

## Critères d'acceptation (à groomer)

- [ ] Un bouton « Ajouter un projet » déclenche une sélection de dossier (mécanisme tranché
      au grooming), puis l'install via le daemon.
- [ ] Les deux modes (méthode seule / supervisé) sont proposés et produisent le bon état.
- [ ] Après ancrage supervisé, le projet apparaît dans l'écran Projets (0062) et ses runs
      remontent au Moniteur.
- [ ] La CLI `supervision:link` (0094) reste le **socle** : le bouton l'appelle côté daemon,
      il ne la duplique pas.
- [ ] L'ancrage reste un geste **humain** (invariant 0050/0082) — le modèle ne l'actionne pas.

## Notes

- Pendant *écriture* de la fiche **0062** (lister) ; ensemble ils forment la « gestion des
  projets » dans le Moniteur, mais **shippables séparément** (0062 = lecture seule d'abord).
- S'appuie sur **0094** (le mécanisme de link) et **0082** (le registre). Le picker de dossier
  et les 2 modes sont les vrais morceaux neufs.
- **Lien fort avec 0087** : les *emballages* (plugin / `.mcpb` / dossier projet) et le
  *versionnage par projet* sont traités là ; 0063 est l'**UI d'ancrage**, pas la doctrine
  d'install.
- **P2 par défaut** — à re-situer par le PO (fiche `idea`, priorité indicative).
