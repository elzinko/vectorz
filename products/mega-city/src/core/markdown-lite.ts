/**
 * markdown-lite — parseur markdown BLOCK-LEVEL minimal et PUR (ADR-0003), pour rendre
 * lisiblement le corps d'une fiche dans une vue (board d'avancement, fiche 20260826225817193).
 *
 * Il produit des BLOCS de TEXTE BRUT (`{kind, text}`) — JAMAIS du HTML. Le rendu se fait
 * côté vue en `textContent` (anti-XSS : un corps contenant `<script>` reste inerte). Extrait
 * de la modale du board pour être testable ; la vue statique `board.html` en miroite la
 * logique à l'identique (dette assumée, comme la carte LA LOI). CRLF-safe ; tolère un bloc
 * de code non fermé.
 */
export type MdBlockKind = 'h' | 'p' | 'li' | 'code';

export interface MdBlock {
  kind: MdBlockKind;
  text: string;
}

/** Retire le front-matter YAML de tête (`--- … ---`). CRLF-safe. */
export function stripFrontMatter(md: string): string {
  return md.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
}

/** Aplati l'emphase markdown inline et réduit les liens `[texte](url)` à `texte`. */
export function stripInline(s: string): string {
  return s.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*_`]+/g, '');
}

/** Découpe le corps (front-matter retiré) en blocs de texte brut, dans l'ordre. */
export function parseBlocks(md: string): MdBlock[] {
  const lines = stripFrontMatter(md).split(/\r?\n/);
  const blocks: MdBlock[] = [];
  let code: string[] | null = null;
  for (const line of lines) {
    if (/^```/.test(line)) {
      if (code) {
        blocks.push({ kind: 'code', text: code.join('\n') });
        code = null;
      } else {
        code = [];
      }
      continue;
    }
    if (code) {
      code.push(line);
      continue;
    }
    const h = line.match(/^#{1,6}\s+(.*)/);
    if (h) {
      blocks.push({ kind: 'h', text: stripInline(h[1]) });
      continue;
    }
    const li = line.match(/^\s*[-*]\s+(.*)/);
    if (li) {
      blocks.push({ kind: 'li', text: stripInline(li[1]) });
      continue;
    }
    if (line.trim() === '') continue;
    blocks.push({ kind: 'p', text: stripInline(line.replace(/^>\s?/, '')) });
  }
  if (code) blocks.push({ kind: 'code', text: code.join('\n') }); // ``` jamais refermé
  return blocks;
}
