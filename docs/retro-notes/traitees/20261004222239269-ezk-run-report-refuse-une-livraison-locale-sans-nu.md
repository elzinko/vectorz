---
date: 2026-10-04
session: " / ready-todo-status-distinction-d96e52"
type: problème
---

# ezk run report refuse une livraison locale sans numéro de PR

Le 2026-10-04, fin du run ezk-product-build (cockpit, 3 fiches livrées en mode `github: false`,
squash local) : `ezk run report --no-github --fiche "<id>|mergée|local (43dcb587)|…"` refuse la
ligne (« PR attendue, forme #<numéro> »), et refuse aussi « - ». Le bilan de fin de run ne sait donc
pas décrire un run en mode local : il a été rendu à la main dans le chat.

Piste : accepter `local (<sha>)` comme dans `ezk backlog ship`, et comparer au `main` local au lieu
de GitHub quand la config coupe GitHub.
