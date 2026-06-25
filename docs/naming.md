# Convention de nommage — univers « Judge Dredd »

Tous les noms de **produits** et de **commandes** de ce dépôt viennent d'un seul univers
cinématographique, pour la cohérence : **Judge Dredd**.

> Réplique culte fondatrice : **« I AM THE LAW »** — *Judge Dredd* (1995, Stallone) /
> *Dredd* (2012, Karl Urban). C'est de là que vient `iamthelaw`.

Le fit est parfait pour ce domaine : dans Dredd, **les Juges appliquent la Loi** —
exactement comme **les agents appliquent les règles**.

## Règle (pour les humains et les LLM qui nomment ici)

- Les **produits / modules / commandes visibles** prennent un nom de l'univers Dredd.
- Les **dossiers techniques** restent **fonctionnels** (`rules/`, `bundles/`, `agents/`,
  `profiles/`, `caps/`, `bin/`, `journal/`) — à l'intérieur du code, la clarté prime sur le thème.
- Pour nommer une **nouvelle** brique : pioche un terme de l'univers Dredd qui colle au rôle ;
  si rien ne colle vraiment, **reste fonctionnel** (ne force jamais un nom obscur).

## Le mapping

| Brique | Nom Dredd | Pourquoi |
|---|---|---|
| Le produit / repo umbrella | **mega-city** (Mega-City One) | le monde où la loi règne ✓ |
| Les règles (la LOI) | **iamthelaw** | « I am the law » — l'origine ✓ |
| La CLI / le moteur (`bind`, `capture`) | **lawgiver** | l'arme de Dredd qui *exécute* la loi (matérialise) |
| L'équipe d'agents | **the Judges** | les Juges appliquent la loi = les agents appliquent les règles |
| L'apprentissage / flywheel (`capture` + `journal`) | **academy** | l'Academy of Law : un juge y acquiert ses compétences |
| Le futur juge de cohérence | **chief-judge** / **the Council** | le Conseil des Juges tranche les cas durs |
| Adaptateurs par hôte (`caps/`) | **sectors** | Mega-City One est découpée en secteurs |

## Univers de secours (si un jour on pivote)

Garder **un seul** univers. Candidats cohérents avec le domaine « loi / ordre / composition » :
- **RoboCop** — « Dead or alive, you're coming with me » (même registre application-de-la-loi).
- 🇫🇷 **Le Cinquième Élément** (Besson) — « Multipass » ; les 4 éléments se *composent* en un 5ᵉ
  (= bundles → profile). Mondialement connu, réplique culte, français.

Mais **Dredd reste le fit parfait** : les agents *sont* des juges qui appliquent *la loi*.

## Réserve de noms — pour de futures features (même univers)

Pool de noms Dredd encore libres, à piocher quand une nouvelle brique apparaît (garde la
cohérence sans rien forcer aujourd'hui) :

| Nom | Piste d'usage futur |
|---|---|
| **hall-of-justice** | le futur dashboard / webapp de config |
| **control** | orchestration / dispatch / logs |
| **iso-cube** | sandbox / isolation (worktree) |
| **lawmaster** | runner / pipeline (ce qui « roule ») |
| **dredd** | l'agent reviewer strict — vaisseau amiral |
| **perp** | une violation de règle (entité « finding ») |
| **mega-block** | une unité projet / workspace |
| **cursed-earth** | zone non gouvernée / legacy |

