/**
 * Garde-fou de dérive des recettes (fiche 20261028130229418) — le cœur PUR.
 *
 * Une recette déclare `source:` — le chemin de son implémentation. Avec le temps, ce chemin peut
 * MENTIR : le dossier déplacé, le fichier supprimé, la recette jamais mise à jour. Ce module décide,
 * à partir de recettes dont le bord I/O a DÉJÀ résolu l'existence du `source:`, lesquelles mentent.
 * Il ne touche jamais le disque (ADR-0003 : le cœur est pur, l'I/O vit au bord).
 *
 * Portée VOLONTAIREMENT étroite : « déclaré, absent ». Le cas inverse « présent, non déclaré » est
 * hors fiche (pas de frontière testable — voir la section « Suite » de la fiche). La reproductibilité
 * vient du tri `classifySource` : seules les sources LOCALES (relatives, sous la racine injectée)
 * arrivent au jugement ; une source absolue ou « maison » (`~/…`) pointe un autre dépôt,
 * machine-dépendant, et n'est jamais vérifiée (elle est comptée à part).
 */
import { isAbsolute, resolve, sep } from 'node:path';

/** Le classement d'une valeur `source:` par rapport à la racine injectée. */
export type SourceClass =
  | { readonly kind: 'draft' } // vide : brouillon, rien à vérifier
  | { readonly kind: 'external' } // absolue / « maison » / hors racine : non vérifiée (machine-dépendante)
  | { readonly kind: 'local'; readonly abs: string }; // relative sous la racine : `abs` à confier à l'I/O

/**
 * Classe une valeur `source:` par rapport à la racine injectée, SANS toucher le disque — `node:path`
 * ne manipule que des chaînes. L'existence du chemin local est laissée au bord (il appelle l'I/O sur
 * `abs`). Pur, donc éprouvable sur les pièges : `../` qui s'échappe, chemin absolu, `~/…`, et le
 * préfixe trompeur (`/projet` ne doit pas « contenir » `/projetbis`).
 */
export function classifySource(source: string, root: string): SourceClass {
  const s = source.trim();
  if (s === '') return { kind: 'draft' };
  if (s.startsWith('~') || isAbsolute(s)) return { kind: 'external' };
  const abs = resolve(root, s);
  const within = abs === root || abs.startsWith(root + sep);
  return within ? { kind: 'local', abs } : { kind: 'external' };
}

/** Une recette à source LOCALE dont le bord a résolu si le chemin existe sous la racine injectée. */
export interface CheckedSource {
  readonly id: string;
  readonly title: string;
  /** La valeur `source:` nettoyée, relative et sous la racine. Jamais vide ici. */
  readonly source: string;
  /** D'où vient la déclaration (chemin du `.md` relatif à la racine), pour NOMMER le constat. */
  readonly origin: string;
  /** Le chemin `source:` résout-il vers un fichier/dossier réel sous la racine injectée ? */
  readonly exists: boolean;
}

/** Une recette qui ment : une `source:` locale qui ne résout pas. */
export interface DriftFinding {
  readonly id: string;
  readonly title: string;
  readonly source: string;
  readonly origin: string;
}

/**
 * Les recettes dont la `source:` locale ne résout plus. L'ordre d'entrée est conservé. Une source
 * vide ne devrait jamais arriver ici (le bord l'écarte comme brouillon) ; le garde subsiste par
 * sûreté — un brouillon ne promet aucune implémentation, ce n'est pas une dérive.
 */
export function sourceDrift(checked: readonly CheckedSource[]): DriftFinding[] {
  return checked
    .filter((c) => c.source.trim() !== '' && !c.exists)
    .map(({ id, title, source, origin }) => ({ id, title, source, origin }));
}

/** Replie les blancs : un `title` multiligne tient sur une seule ligne de constat. */
function oneLine(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

export interface DriftRenderInput {
  /** Étiquette de la racine injectée, pour l'ouverture « En clair ». */
  readonly rootLabel: string;
  readonly findings: readonly DriftFinding[];
  /** Combien de recettes à source locale ont été vérifiées (le dénominateur honnête). */
  readonly checkedCount: number;
  /** Sources externes (absolues ou `~/…`, ou hors racine) : non vérifiées, machine-dépendantes. */
  readonly externalCount: number;
  /** Recettes sans `source:` (brouillons) : rien à vérifier. */
  readonly draftCount: number;
}

/** Le rapport, « En clair » d'abord (règle de lisibilité). Déterministe, sans I/O. */
export function renderSourceDrift(input: DriftRenderInput): string {
  const { rootLabel, findings, checkedCount, externalCount, draftCount } = input;
  const lines: string[] = [];
  lines.push(
    `En clair : ${findings.length} recette(s) dont l'implémentation a disparu, sur ${checkedCount} vérifiée(s) sous ${rootLabel}.`,
  );
  lines.push('');
  if (findings.length === 0) {
    lines.push('Aucune dérive : chaque `source:` locale résout vers un fichier réel.');
  } else {
    lines.push('## Recettes dont le `source:` ne résout plus');
    for (const f of findings) {
      lines.push(`- ${f.origin} — ${oneLine(f.title)} (${f.id}) → source: ${f.source}`);
    }
  }
  lines.push('');
  lines.push(
    `Hors périmètre : ${externalCount} source(s) externe(s) (chemin absolu ou maison, non vérifié ici), ${draftCount} brouillon(s) sans source.`,
  );
  return lines.join('\n');
}
