/**
 * Loader des FICHES du backlog (`features/*.md` + `features/done/`) — frontière
 * entrante, PURE (ADR-0003). Lit le front-matter par regex (comme bin/plan-head.ts),
 * PAS via un parseur YAML : un id à 4 chiffres non quoté (`id: 0094`) serait sinon
 * corrompu en nombre (perte des zéros de tête) et un id à 17 chiffres dépasse
 * `Number.MAX_SAFE_INTEGER`. On garde donc les valeurs en chaînes brutes.
 *
 * C'est la fondation de la VUE D'AVANCEMENT (fiche 20260823124042842, lot 0) : le
 * board se compile depuis ces fiches, comme la carte se compile depuis le catalogue.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export interface Fiche {
  id: string;
  title: string;
  type: string; // feature | bug | refactor | chore | epic
  priority: string; // P0 | P1 | P2 | P3 | '' (épics/idées sans prio)
  status: string; // idea | ready | in-progress | shipped | superseded | merged | split
  ready: boolean; // le champ `ready:` est-il posé ?
  epic: string; // id de l'épic parent, ou '' — LEGACY, en retrait (ADR-0017 A16, remplacé par milestone)
  milestone: string; // jalon d'ordonnancement/regroupement (ADR-0017 A16), '' si absent
  product: string; // vectorz | mega-city | …
  pr: string; // '#123' | 'local …' | ''
  labels: string[]; // tags libres du front-matter (`labels: [bmad, …]`), [] si absent
  /** Drapeau orthogonal à la colonne (sliver B, fiche 652) : raison de `blocked:`, '' si absent. */
  blocked: string;
  done: boolean; // vit dans features/done/ (livrée)
  file: string; // chemin relatif à la racine du repo (ex. `features/0094-slug.md`)
}

/**
 * Lit un champ scalaire du front-matter, brut (non typé). Exporté pour le validateur
 * de conformité (fiche 652/281) : même lecture, pas de second parseur de front-matter.
 *
 * Deux régimes, comme en YAML — l'ordre compte (bug colonne PR du board, PR #221) :
 *   - valeur QUOTÉE (`pr: "#29"`) → contenu LITTÉRAL entre guillemets, aucun `#` retiré ;
 *     le `#` fait partie de la valeur, pas un commentaire.
 *   - valeur NUE (`status: idea # notes`) → un `#` en tête ou précédé d'un blanc ouvre
 *     un commentaire, retiré ; un `#` collé (`a#b`) reste dans la valeur.
 * Retirer le commentaire AVANT les guillemets faisait lire `pr: "#29"` comme vide.
 */
export function readField(text: string, field: string): string {
  const m = text.match(new RegExp(`^${field}:[ \\t]*(.*)$`, 'm'));
  if (!m) return '';
  const raw = m[1].trim();
  // Ancrée sur une fin valide : après le guillemet fermant, soit la fin de ligne, soit un
  // commentaire précédé d'au moins un blanc (` # …`, règle YAML). Le `\1` tombe donc sur le
  // VRAI guillemet fermant. Ça préserve un guillemet interne (`"dis \"go\""`), refuse un
  // scalaire suivi de texte parasite (`"idea" typo`) ET un commentaire collé (`"idea"#typo`)
  // — la faute reste visible au lieu d'être avalée en silence. Revue Codex, PR #222.
  const quoted = raw.match(/^(["'])(.*?)\1(?:[ \t]+#.*)?[ \t]*$/);
  if (quoted) return quoted[2];
  return raw.replace(/(?:^|\s)#.*$/, '').trim();
}

/**
 * Lit un champ liste EN LIGNE du front-matter (`labels: [a, b]`) → tableau (vide si absent).
 * Exporté pour le validateur de conformité (`split_into: [...]`, sliver B fiche 652) — même
 * lecture, pas de second parseur.
 */
export function readListField(text: string, field: string): string[] {
  const m = text.match(new RegExp(`^${field}:[ \\t]*\\[(.*)\\][ \\t]*$`, 'm'));
  if (!m) return [];
  return m[1]
    .split(',')
    .map((s) => s.trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean);
}

/**
 * Isole le bloc de front-matter (entre le premier `---` et le `---` suivant). Les champs se lisent
 * LÀ, jamais dans le corps : une fiche sans `milestone:` en tête mais qui l'évoque dans sa prose
 * ne doit pas le capter (revue Codex PR #237). Repli défensif sur le texte entier si le délimiteur
 * manque (fiche sans front-matter — ne devrait pas arriver, FICHE_FILE filtre déjà).
 */
export function frontMatter(text: string): string {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return m ? m[1] : text;
}

/** Les deux formats d'id coexistent (fiche 0180) : `0094-slug.md` et `20260810143052123_slug.md`. */
const FICHE_FILE = /^(\d{4,})[-_].*\.md$/;

/** Charge toutes les fiches (actives + `done/`) depuis la racine du repo. Déterministe. */
export function loadFiches(rootDir: string): Fiche[] {
  const base = join(rootDir, 'features');
  const fiches: Fiche[] = [];
  for (const [sub, done] of [
    [base, false],
    [join(base, 'done'), true],
  ] as const) {
    if (!existsSync(sub)) continue;
    for (const filename of readdirSync(sub).sort()) {
      const idMatch = filename.match(FICHE_FILE);
      if (!idMatch) continue;
      const fm = frontMatter(readFileSync(join(sub, filename), 'utf8'));
      fiches.push({
        id: idMatch[1],
        title: readField(fm, 'title'),
        type: readField(fm, 'type') || 'feature',
        priority: readField(fm, 'priority'),
        status: readField(fm, 'status') || 'idea',
        ready: readField(fm, 'ready') !== '',
        epic: readField(fm, 'epic'),
        milestone: readField(fm, 'milestone'),
        product: readField(fm, 'product') || '—',
        pr: readField(fm, 'pr'),
        labels: readListField(fm, 'labels'),
        blocked: readField(fm, 'blocked'),
        done,
        file: `features/${done ? 'done/' : ''}${filename}`,
      });
    }
  }
  return fiches.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}
