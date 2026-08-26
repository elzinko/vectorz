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
  status: string; // idea | todo | in-progress | blocked | shipped
  ready: boolean; // le champ `ready:` est-il posé ?
  epic: string; // id de l'épic parent, ou ''
  product: string; // vectorz | mega-city | …
  pr: string; // '#123' | 'local …' | ''
  labels: string[]; // tags libres du front-matter (`labels: [bmad, …]`), [] si absent
  done: boolean; // vit dans features/done/ (livrée)
  file: string; // chemin relatif à la racine du repo (ex. `features/0094-slug.md`)
}

/**
 * Lit un champ scalaire du front-matter, commentaire `# …` retiré, brut (non typé).
 * Exporté pour le validateur de conformité (fiche 652/281) : même lecture, pas de
 * second parseur de front-matter.
 */
export function readField(text: string, field: string): string {
  const m = text.match(new RegExp(`^${field}:[ \\t]*(.*)$`, 'm'));
  return m ? m[1].replace(/[ \t]*#.*$/, '').trim().replace(/^["']|["']$/g, '') : '';
}

/** Lit un champ liste EN LIGNE du front-matter (`labels: [a, b]`) → tableau (vide si absent). */
function readListField(text: string, field: string): string[] {
  const m = text.match(new RegExp(`^${field}:[ \\t]*\\[(.*)\\][ \\t]*$`, 'm'));
  if (!m) return [];
  return m[1]
    .split(',')
    .map((s) => s.trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean);
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
      const text = readFileSync(join(sub, filename), 'utf8');
      fiches.push({
        id: idMatch[1],
        title: readField(text, 'title'),
        type: readField(text, 'type') || 'feature',
        priority: readField(text, 'priority'),
        status: readField(text, 'status') || 'idea',
        ready: readField(text, 'ready') !== '',
        epic: readField(text, 'epic'),
        product: readField(text, 'product') || '—',
        pr: readField(text, 'pr'),
        labels: readListField(text, 'labels'),
        done,
        file: `features/${done ? 'done/' : ''}${filename}`,
      });
    }
  }
  return fiches.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}
