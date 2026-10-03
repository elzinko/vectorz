---
date: 2026-10-03
session: muti, sprint « FPS auto-adaptatif » (PR muti #271)
type: problème
---

# Un test de mutation sur un fichier non commité a effacé le travail

**En clair.** Pour vérifier qu'un test protège bien un code, le pilote a cassé exprès ce code, puis
l'a restauré avec `git checkout -- <fichier>`. Le fichier n'était pas commité : tout le travail de la
boucle a disparu. Il a été récupéré grâce à une copie de secours faite par chance. Le geste sûr :
commiter avant de muter, puis restaurer par `git checkout HEAD -- <fichier>`.

**Les faits, datés.**

- 2026-10-02, muti, branche `feat/20260818083534541-fps-auto-adaptatif` : mutation de
  `useTracking.js` non commité, restauration par `git checkout --`, perte puis restauration depuis
  `/tmp/ut.bak`. Les mutations suivantes ont été faites après commit, sans incident.
- Rétro muti du 2026-10-03 (`docs/captures/2026-10-03-retro-fps-auto-adaptatif.md` dans muti) : le
  juge de cohérence a jugé qu'à 1 occurrence et sans signal mesurable, une note de carnet suffit,
  côté méthode (vectorz) plutôt que muti.

**Ce qu'on attend de la rétro vectorz.** Décider si le geste mérite une consigne dans le skill qui
pratique les tests de mutation, ou rien tant qu'il ne récidive pas.
