---
id: "20261102100505427"
title: "Le lanceur de mission control annonce un port web faux quand ce port est déjà pris"
type: bug
priority: P2
product: cop1
milestone:
version:
labels: [scout, mission-control]
status: idea
pr:
evidence: none # message du lanceur dans le terminal ; pas d'écran nouveau
created: 2026-11-02
---

# Le lanceur annonce un port web faux quand ce port est déjà pris

**En clair.** Quand le port web demandé est déjà occupé, vite prend le port suivant sans rien dire au
script de lancement. Le script affiche quand même l'ancien port. Tu ouvres alors la page d'une autre
instance, ou une page qui ne répond pas. La correction attendue : refuser net, comme le script le fait
déjà pour le port du daemon.

**Si tu arrives frais.** Mission control (cop1) se lance par `pnpm cop1:dev`. Le script démarre un
daemon (le serveur de données) et une page web servie par vite (le serveur de développement).

## Contexte / Problème

Gravité : **majeure**. Une fonction marche mal sur un cas plausible : deux sessions lancent chacune
leur instance, et l'adresse affichée ment.

Reproduction, constatée 2 fois sur 2 :

1. `node -e "require('net').createServer().listen(5284,'::1')" &` occupe le port web.
2. `env COP1_DAEMON_PORT=4354 COP1_WEB_PORT=5284 pnpm cop1:dev --no-build`
3. Le journal affiche « ▶ web cop1 → http://localhost:5284 », puis « Port 5284 is in use, trying
   another one... » et « Local: http://localhost:5285/ ».
4. `curl -m 20 http://localhost:5284/` n'atteint pas mission control.

Attendu : un refus net « port 5284 pris ». Obtenu : l'adresse affichée ne mène pas à la page lancée.

Le même piège a déjà été corrigé pour le port du daemon (commit d28f3ceb, « refuse to start mission
control on a busy daemon port »).

## Valeur

Plusieurs sessions lancent mission control en même temps : la config `mission-control-verif` existe
pour ça. Le jour où deux d'entre elles visent le même port web, la vérification se fait sur la
mauvaise page, sans que personne ne le voie. Un refus net coûte une relance. Une vérification faite
sur la mauvaise instance coûte une conclusion fausse.

## Proposition

Deux gestes, dans le même esprit que le correctif du port du daemon :

1. **Le script vérifie le port web avant de lancer vite.** `scripts/cop1-dev.sh` contrôle déjà le
   port du daemon avec `lsof`. Il fait la même chose pour `WEB_PORT`, avant de démarrer le daemon :
   rien n'est lancé pour rien. Le message nomme le port, le pid qui le tient, et la variable à changer
   (`COP1_WEB_PORT`).
2. **vite refuse un port occupé quand on lui en impose un.** Dans `vite.config.ts`, `strictPort`
   vaut vrai seulement quand la variable `PORT` est posée. Ce garde-fou couvre le cas où le port se
   fait prendre entre le contrôle du script et le démarrage de vite.

Pourquoi `strictPort` seulement quand `PORT` est posé : lancé à la main sans `PORT`, vite vise
5173, le port par défaut de muti. Il doit pouvoir glisser au port suivant dans ce cas, comme
aujourd'hui.

## Critères d'acceptation

- [ ] Port web occupé : `pnpm cop1:dev` s'arrête avec un code non nul, avant de lancer le daemon. Le
  message nomme le port, le pid qui le tient, et `COP1_WEB_PORT`.
- [ ] Port web libre : le lancement se passe comme aujourd'hui, et l'adresse affichée ouvre la page de
  mission control.
- [ ] Quand vite démarre avec `PORT` posé sur un port occupé, il s'arrête en erreur au lieu de
  prendre le port suivant.
- [ ] Sans `PORT`, `pnpm --dir products/cop1/packages/web dev` garde son comportement : il glisse au
  port suivant si 5173 est pris.

## Comment vérifier

Depuis la racine de vectorz, sur des ports libres (à contrôler d'abord avec `lsof -i :<port>`) :

```bash
# 1. Port web occupé → refus net, daemon non lancé
node -e "require('net').createServer().listen(5284,'::1')" & BLOCK=$!
COP1_DAEMON_PORT=4354 COP1_WEB_PORT=5284 pnpm cop1:dev --no-build; echo "EXIT=$?"
lsof -nP -iTCP:4354 -sTCP:LISTEN || echo "daemon non lancé : OK"
kill $BLOCK

# 2. vite seul, PORT imposé sur un port occupé → erreur
node -e "require('net').createServer().listen(5285,'::1')" & BLOCK=$!
PORT=5285 pnpm --dir products/cop1/packages/web dev; echo "EXIT=$?"
kill $BLOCK

# 3. Port libre → la page répond à l'adresse affichée (Ctrl-C ensuite)
COP1_DAEMON_PORT=4354 COP1_WEB_PORT=5284 pnpm cop1:dev --no-build
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:5284/
```

Attendu : `EXIT` non nul et « daemon non lancé : OK » en 1, `EXIT` non nul en 2, `200` en 3.

## Notes / décisions

- Trouvé par ezk-scout, rapport `/private/tmp/claude-501/-Users-elzinko-git-bacasable-vectorz/50a740fe-2443-4e7f-bcb3-17d581e154ae/scratchpad/ezk-scout/cop1-2026-11-02/report.md` (brouillon B1), le 2026-11-02.
- Indice de localisation, non garanti : `products/cop1/packages/web/vite.config.ts:14`, où le port
  est posé sans `strictPort`.
- Groom du 2026-11-02. Lecture faite : le contrôle du port du daemon vit dans `scripts/cop1-dev.sh`,
  juste après la compilation. Le script annonce le port web juste avant de lancer vite, sans le
  vérifier. Aucune dépendance externe. Taille : 4 critères, une seule surface (le lancement).
- Ordre retenu : le contrôle du port web se fait avant celui du daemon. Un port web pris ne doit pas
  laisser un daemon lancé pour rien.
