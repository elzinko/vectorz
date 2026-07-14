export interface RawLine {
  lineNumber: number;
  text: string;
}

/**
 * Découpe un contenu JSONL en lignes lisibles, 1-based.
 *
 * Règle "dernière ligne tronquée" (positionnelle, pas liée à la validité JSON) :
 * si le fichier ne se termine pas par un "\n", la toute dernière ligne physique
 * est considérée tronquée et purement ignorée (ni violation, ni événement traité).
 * Les lignes vides sont ignorées silencieusement.
 */
export function readLines(content: string): RawLine[] {
  if (content.length === 0) return [];
  const rawLines = content.split('\n');
  // Que le fichier se termine par \n (dernier élément = "") ou non (dernier
  // élément = ligne tronquée), dans les deux cas on retire le dernier élément.
  const usableLines = rawLines.slice(0, -1);
  return usableLines
    .map((text, index) => ({ lineNumber: index + 1, text }))
    .filter((line) => line.text.length > 0);
}

export type ParsedLine =
  | { lineNumber: number; ok: true; value: Record<string, unknown> }
  | { lineNumber: number; ok: false };

/**
 * Parse tolérant : une ligne qui n'est pas du JSON valide est signalée (ok:false)
 * mais ne casse jamais la lecture des lignes suivantes.
 */
export function parseLines(lines: RawLine[]): ParsedLine[] {
  return lines.map(({ lineNumber, text }) => {
    try {
      const value = JSON.parse(text);
      if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        return { lineNumber, ok: false };
      }
      return { lineNumber, ok: true, value: value as Record<string, unknown> };
    } catch {
      return { lineNumber, ok: false };
    }
  });
}
