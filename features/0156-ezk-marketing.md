---
id: 0156
title: ezk-marketing — orchestrateur de promotion produit (articles d'épopée, canaux, vidéos)
type: feature
priority: P1
product: mega-city
status: todo
pr:
created: 2026-07-15
---

## Contexte / Problème

La promotion des produits (samplerz, kexpresso, muti…) se fait aujourd'hui à la main
et **se perd** entre les sessions :

- **kexpresso** (OSS) : commentaires/posts sur les blogs & réseaux adaptés — déroulé
  réel, entièrement manuel, non capitalisé (aucune trace dans le repo : le savoir vit
  dans la tête du user et d'anciennes sessions) ;
- **muti** : plan marketing tracé en checklists (`apps/website/SEO.md` : Search
  Console, KVR Audio, AlternativeTo, Product Hunt, awesome-lists, forums Ableton) —
  efficace mais spécifique au repo, jamais réutilisé ailleurs ;
- **samplerz** (commercial) : site vitrine en cours (fiche samplerz
  `features/backlog/website_showcase.feature`, PR samplerz#239) et des problématiques
  de dev racontables (épopées techniques) qui partent en fumée.

Chaque projet réinvente ses canaux, son ton, son suivi. Rien ne mémorise : ni les
préférences de canaux PAR projet, ni les actions déjà faites (où, quand, résultat),
ni le style éditorial — qui devrait s'améliorer d'article en article, tous projets
confondus.

## Proposition

Skill `ezk-marketing` : **orchestrateur de promotion produit** — il COMPOSE des
capacités existantes et n'en réimplémente aucune (doctrine ezk-product-builder).
Capacités composées : **ezk-article (0049)** pour l'écriture, **postiz** (plugin déjà
disponible) pour la publication/scheduling réseaux. Volets — chacun PROPOSÉ au user,
jamais imposé :

1. **Articles d'épopée technique** — raconter une problématique intéressante apparue
   pendant les devs, « comme un bon roman un peu court ». L'écriture est DÉLÉGUÉE à
   ezk-article (0049 : persona + panel de relecteurs frais + contre-lecture gate) ;
   thématique et angle demandés au user avant génération.

   **Style éditorial évolutif — tranché ici** : le style-guide est un **artefact de
   données** (pas de la logique de skill). Il vit dans
   `skills/ezk-marketing/style-guide.md` sur mega-city (versionné git, accessible de
   partout via les symlinks) ; il est **maintenu par ezk-marketing** (entrées datées,
   append-only) et **injecté dans le brief d'ezk-article** — dont les règles
   d'écriture restent invariantes (0049 amendée : entrée optionnelle « style-guide
   additionnel »). Anti-dérive : plafond ~1 page de règles actives + rituel de
   distillation quand le plafond est atteint (fusion en règles, archivage du reste).
   Signal d'enrichissement AU MOMENT du run : findings récurrents du panel 0049 +
   débrief demandé au user (checkpoint dédié) ; les retours de réception (métriques,
   réactions) alimentent une entrée ULTÉRIEURE datée quand ils arrivent. Chaque
   apprentissage note sa **langue** (structure transverse, ton par-langue).

2. **Présence sur les canaux** — la skill PROPOSE des canaux adaptés au projet
   (sources : muti SEO.md, récit kexpresso) et tient PAR projet une **fiche projet +
   journal** :
   - format : front-matter YAML (canaux retenus/exclus, langue par canal, **type de
     produit : commercial | OSS | gratuit**, comptes, registre de TON) + journal
     **append-only** d'entrées datées (date, canal, action, lien, résultat) ; la
     relecture au run suivant ne charge que le front-matter + les N dernières entrées ;
   - emplacement : **épouser la convention existante du repo** si elle existe (ex.
     muti `apps/website/SEO.md`), sinon `docs/MARKETING.md` par défaut ; pour un repo
     PUBLIC, la skill propose au premier run un stockage privé hors repo — et tout ce
     qui est commité suit la règle **write-as-if-public** (lisible par un modérateur
     sans embarras : jamais de tactique, le journal public n'est que la transparence
     d'actions divulguées) ;
   - **fiche de canal** : inclut les règles self-promo du canal (ratio Reddit + règles
     par subreddit, guidelines HN, statut développeur KVR, chartes forums),
     **vérifiées à la date de proposition** (date notée) — la skill REFUSE de proposer
     une action qui les viole ;
   - la publication réseaux passe par **postiz** après le checkpoint humain ;
     ezk-marketing ne possède que le choix du canal, le contenu proposé et le journal ;
   - entrées de ce volet : commentaires/posts utiles, **notes de release → annonces**
     (✨/🐛 du backlog), **playbook de lancement** type muti (checklists datées), et le
     **blog du site vitrine comme simple CANAL** — le repo produit possède
     l'intégration/publication dans son site (cf. fiche samplerz website_showcase).

3. **Vidéos YouTube** — proposer des sujets + scripts. La génération automatique
   viendra PLUS TARD via **realizator** (`~/git/bacasable/realizator`, en standby) —
   d'ici là, ce volet s'arrête à la proposition + script.

**Modèle d'interaction** : autonome entre checkpoints — la skill DEMANDE ce qui manque
(canaux, ton, thématique, langue) et le mémorise par projet. **Toute publication
externe = arrêt humain** ; la validation porte sur le **triplet contenu + canal +
date/heure** — l'envoi différé (postiz) d'un triplet validé ne re-déclenche rien,
toute modification du triplet invalide la validation.

## Garde-fous (éthique & réputation) — s'appliquent à TOUTE sortie externe

- **Divulgation PAR DÉFAUT, NON NÉGOCIABLE** dès qu'un contenu mentionne un produit
  dont le user est l'auteur/vendeur (formule type « je suis l'auteur »). Le registre
  « discret vs clair » porte sur le **TON et le FORMAT** (contenu utile d'abord vs
  annonce), **jamais** sur le niveau de divulgation. Si on demande une variante non
  divulguée : la skill **refuse de la rédiger**, explique pourquoi, propose la
  variante divulguée.
- **Produit COMMERCIAL** (ex. samplerz) : divulgation renforcée (auteur + intérêt
  commercial) — c'est une **obligation légale** (pratiques commerciales trompeuses,
  directive 2005/29/CE), pas une politesse ; filtre des canaux incompatibles avec le
  payant (certaines awesome-lists, subreddits no-commercial).
- **Jamais de faux témoignage** : pas de rédaction en « simple utilisateur neutre »,
  pas de multi-comptes, pas d'entraide de votes — la voix des posts est toujours
  celle de l'auteur du produit.

## Critères d'acceptation

- [ ] ORCHESTRATEUR vérifié : articles via ezk-article (0049, amendée pour accepter
      un style-guide externe en entrée), publication réseaux via postiz — aucun volet
      ne réimplémente une capacité existante.
- [ ] Fiche projet + journal datés par projet : convention du repo épousée, format
      front-matter YAML + journal append-only, relecture au run suivant (front-matter
      + N dernières entrées) ; option de stockage privé proposée si le repo est public.
- [ ] Style-guide : après chaque article publié, une entrée DATÉE sourcée sur les
      signaux disponibles (débrief user + findings du panel 0049) — vérifiable :
      2 articles → 2 entrées, la 2ᵉ cite un apprentissage de la 1ʳᵉ ; plafond ~1 page
      + rituel de distillation documenté.
- [ ] Divulgation applicable : sur demande explicite d'une variante non divulguée, la
      skill refuse et propose la variante divulguée (testable) ; chaque fiche de canal
      porte ses règles self-promo avec date de vérification, et la skill refuse une
      action qui les viole.
- [ ] Aucune publication externe sans validation du triplet contenu+canal+date —
      vérifiable en revue du SKILL.md : publier/poster/commenter figurent dans les
      gestes sortants à arrêt obligatoire, aucun chemin de sous-commande ne contourne.
- [ ] Construite via **ezk-ezk** sur le RÉCUPÉRABLE : muti SEO.md (trace écrite) +
      récit kexpresso reconstitué avec le user (± transcripts retrouvables) + un
      **premier déroulé semi-manuel sur samplerz** (article d'épopée + canaux) qui
      devient LA source principale de harvest — même doctrine que website_showcase
      (« une fois à la main d'abord », contre-exemple ezk-readme).
- [ ] Doc : quand l'utiliser / quand ne pas l'utiliser (≠ ezk-article seul, ≠ le
      contenu produit d'un site vitrine).

## Notes

- **Revue adverse du 2026-07-15** (4 lentilles indépendantes : frontière/composition,
  éthique/réputation, design/faisabilité, doctrine/critères — 4× NO-GO sur le
  brouillon) : findings intégrés ci-dessus. Blockers tranchés : divulgation rendue
  mécanique et non négociable ; journal public → write-as-if-public + option privée ;
  harvest reformulé sur le récupérable + premier déroulé samplerz ; style-guide =
  artefact de données chez ezk-marketing, injecté dans 0049.
- **Dépend de : 0049 ezk-article** — **arbitrage tranché 2026-07-17 (review) : lot 0049→0052
  confirmé.** 0049 est passée `ready` (P1, tirable en premier) ; 0052 **reste `todo`
  non-ready** tant que 0049 n'est pas construite (sa brique articles). La readier
  automatiquement quand 0049 ship. (0049 était déjà P1, pas P2 : la mention « P2 » de cette
  note était périmée.) 0044 (composes inter-skills) reste directement pertinente — cet
  orchestrateur en serait le premier client.
- **P1** demandé par le user (2026-07-15) : passe devant ~15 fiches P2 todo — coût de
  priorisation signalé, 0050 (in-progress) reste à clore d'abord.
- **Idées post-v1** (non harvestées — ne construire qu'après un déroulé réel) :
  mesure/attribution (lien UTM par action consigné au journal, best-effort via
  referrers, PostHog quand le site du projet en aura ; certains canaux resteront
  qualitatifs), newsletter, cross-posting dev.to/Medium.
- Anti-doublon vérifié : 0049 = COMPOSÉE (pas dupliquée) ; checklists muti = MATIÈRE
  (pas une skill) ; fiche samplerz `website_showcase` = le QUOI produit du site.
- realizator (`~/git/bacasable/realizator`, standby) = génération vidéo future.
