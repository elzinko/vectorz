# Énumérer les relations de fiches via le loader testé, pas un parse maison

**Symptôme (daté, mesurable).** Migration « retrait de l'épic » (ADR-0017 A16), PR #239,
2026-09-16. Pour re-router les 9 épics, j'ai écrit un **script python jetable** qui énumérait
les enfants en lisant le champ `epic:` du front-matter à la regex. Il avait deux trous :
1. **bug de guillemets** — il retirait les guillemets AVANT le commentaire, donc `epic: "<id>" # note`
   ressortait `<id>"` (guillemet parasite) et ne matchait plus → l'enfant **quoté**
   `20260910152227744` était invisible ;
2. il ne regardait **que `features/`**, jamais `features/done/` → les enfants **shippés** étaient ignorés.

**Coût.** 3 rounds de revue Codex sur #239 pour rattraper : milestone/labels manquants sur les
enfants shippés (0101, 20260821172716537, 20260826225817193), `epic:` pendant sur les enfants
quotés/oubliés (20260910152227744, done/20260816131704335), et une famille (doc/découvrabilité)
mal classée « dégénérée » parce que son enfant shippé n'avait pas été vu.

**Le geste qui aurait évité ça.** Le repo a déjà un loader **testé et front-matter-scopé** :
`products/mega-city/src/loaders/fiches.ts` (`readField` gère les valeurs quotées + les commentaires,
`frontMatter()` borne au bloc, `loadFiches` couvre `features/` ET `features/done/`). Le réutiliser
— plutôt que re-parser à la regex dans un script jetable — aurait remonté tous les enfants du
premier coup.

**Candidat de règle (à trancher en rétro).** Tout outillage de migration/backlog qui lit des
fiches passe par le loader (`loadFiches`/`readField`), jamais par un grep/parse maison du
front-matter — et couvre `done/`. Mesurable : un script de migration qui re-parse le front-matter
à la main = à refuser en revue.

**Voisin.** Même classe de bug que le finding Codex #237 (le loader lui-même lisait `milestone:`
hors front-matter avant #238) : le parse front-matter naïf est un piège récurrent → une seule
implémentation testée, partagée.
