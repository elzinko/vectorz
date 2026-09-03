# docs/pr-evidence/

Preuves d'écran **avant / après** pour les PR d'interface (règle
`development/pr-before-after-media`, ADR-0045 de mega-city).

- Nommage : `<id-fiche>/<vue>-before.png` et `<id-fiche>/<vue>-after.png`.
- Léger : chaque PNG reste sous 300 Ko (sinon envisager un JPEG).
- Lié par **SHA de commit** dans le corps de la PR — ces fichiers doivent donc être
  **committés** avant d'ouvrir la PR (un lien par SHA sur un fichier non committé
  ne résout rien).
- Produit et lu par `products/mega-city/bin/pr-evidence.sh` (`capture`, `render`).
