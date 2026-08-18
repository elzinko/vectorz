# language: fr
# Fiche : features/0183-pack-review-markdown-first.md — ADR-038.
# Definition of Done exécutable des 7 critères d'acceptation. Traduit en tests
# vitest colocalisés : contract.test.ts, render.test.ts, markdown-file.test.ts,
# github-comment.test.ts.

Fonctionnalité: Pack de review markdown-first
  En tant que méthode qui tourne seule ou en tant qu'humain/agent relecteur
  Je veux un pack de review versionné dans le code (SoT), projetable vers
  N rendus (markdown seul, commentaire GitHub, ...)
  Afin que la restitution d'une livraison ne se dilue jamais dans un rendu
  externe et reste lisible sans compte externe.

  # ---------------------------------------------------------------------------
  # AC1 — contrat documenté et référencé
  # ---------------------------------------------------------------------------

  Scénario: Le contrat method-review@0.1 est gravé et versionné
    Soit le module "src/review/contract.ts"
    Alors il expose une constante "CONTRACT_URI" valant "method-review@0.1"
    Et il expose l'énumération des statuts "ready-for-review", "changes-requested", "approved"
    Et "docs/PR_VALIDATION.md" référence le contrat du pack de review

  # ---------------------------------------------------------------------------
  # AC2 — dogfood réel
  # ---------------------------------------------------------------------------

  Scénario: Un sprint réel produit un REVIEW.md committé sur sa branche feature
    Quand le sprint de la fiche "0183" construit son "ReviewPack"
    Et l'émetteur "markdown-file" l'émet
    Alors le fichier "features/reviews/0183-pack-review-markdown-first/REVIEW.md" existe
    Et il est committé sur la branche feature (pas seulement généré en local)

  # ---------------------------------------------------------------------------
  # AC3 — sections du pack, dégradation propre
  # ---------------------------------------------------------------------------

  Scénario: Le pack porte les 7 sections obligatoires
    Soit un "ReviewPack" valide au sens du contrat
    Quand je le rends avec "render(pack)"
    Alors le markdown produit contient les sections "Résumé", "Rendus",
      "Matrice de validation", "À tester", "Qualité", "Provisioning / preview"
      et "Trouvailles"
    Et chaque section reproduit le contenu du pack par référence, jamais par copie transformée

  Scénario: Une section dont la source est absente dégrade proprement
    Soit un "ReviewPack" dont les sections optionnelles "qualite" et "trouvailles" sont absentes
    Quand je le rends avec "render(pack)"
    Alors les sections correspondantes affichent "N.A."
    Et le rendu ne lève aucune exception

  # ---------------------------------------------------------------------------
  # AC4 — agnosticisme prouvé par ≥2 rendus
  # ---------------------------------------------------------------------------

  Scénario: Le même ReviewPack produit deux rendus indépendants
    Soit un "ReviewPack" valide
    Quand je l'émets avec l'émetteur "markdown-file"
    Alors un fichier "REVIEW.md" est écrit sur disque, idempotent (ré-émettre ne duplique rien)
    Quand j'émets le même "ReviewPack" avec l'émetteur "github-comment"
    Alors j'obtiens un corps de commentaire markdown identique au rendu de "render(pack)"
    Et cet émetteur n'écrit aucun fichier et n'invoque jamais la commande "gh"

  # ---------------------------------------------------------------------------
  # AC5 — aucun rendu n'est SoT, aucun compte externe obligatoire
  # ---------------------------------------------------------------------------

  Scénario: Le pack reste lisible sans aucun compte externe
    Soit le fichier "features/reviews/<id>/REVIEW.md" écrit sur disque
    Alors il est lisible en diff brut avec un simple éditeur de texte
    Et aucun des deux émetteurs ne requiert de compte externe pour produire son rendu
    Et aucun champ du front-matter ne prétend faire autorité sur un rendu externe
      ("pr" reste une projection, jamais la source de vérité)

  # ---------------------------------------------------------------------------
  # AC6 — 0058 reclassé adaptateur
  # ---------------------------------------------------------------------------

  Scénario: 0058 est documenté comme adaptateur du pack, pas comme SoT
    Soit la fiche "features/0058-rapport-qualite-pr.md"
    Alors elle porte une note explicite « adaptateur du pack (pas SoT) »
    Et elle référence la fiche 0183 et le contrat method-review@0.1

  # ---------------------------------------------------------------------------
  # AC7 — gate locale verte
  # ---------------------------------------------------------------------------

  Scénario: La gate locale est verte
    Quand je lance "pnpm --dir products/mega-city typecheck"
    Et que je lance "pnpm --dir products/mega-city test"
    Alors les deux commandes se terminent en succès (exit code 0)
