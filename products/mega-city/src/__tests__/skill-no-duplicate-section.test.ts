/**
 * Contrôle : un `SKILL.md` ne garde pas deux fois le même titre de section (fiche 20261003201035080).
 *
 * En clair : après une fusion, une section peut rester EN DOUBLE sans que rien ne le voie
 * (vécu le 2026-10-03 : la section « next --lot N » dupliquée dans `ezk-backlog/SKILL.md`, reste des
 * PR #324/#325, trouvée par hasard). Ce test parcourt les `SKILL.md` du catalogue et refuse deux
 * titres de section identiques (même niveau, même texte). La détection ignore les titres à l'intérieur
 * d'un bloc de code clôturé (``` / ~~~), qui ne sont pas des sections.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const MC = join(dirname(fileURLToPath(import.meta.url)), '..', '..'); // products/mega-city
const SKILLS = join(MC, 'skills');

/** Les titres de section (`## …`) présents DEUX fois ou plus dans un markdown, hors blocs de code. */
export function duplicateHeadings(markdown: string): string[] {
  const seen = new Map<string, number>();
  let inFence = false;
  for (const raw of markdown.split(/\r?\n/)) {
    if (/^\s{0,3}(```|~~~)/.test(raw)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = /^(#{2,6})[ \t]+(.+?)[ \t]*#*[ \t]*$/.exec(raw);
    if (!m) continue;
    // Clé = niveau + texte normalisé (espaces fusionnés) : deux « ## X » sont un doublon ; « ## X » et
    // « ### X » ne le sont pas (sections distinctes).
    const key = `${m[1]} ${m[2].replace(/\s+/g, ' ').trim()}`;
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  return [...seen.entries()].filter(([, n]) => n > 1).map(([k]) => k);
}

/** Les dossiers de skill du catalogue qui portent un `SKILL.md`. */
function skillFiles(): string[] {
  return readdirSync(SKILLS, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => join(SKILLS, e.name, 'SKILL.md'))
    .filter((p) => {
      try {
        readFileSync(p);
        return true;
      } catch {
        return false;
      }
    });
}

describe('un SKILL.md ne porte pas deux fois le même titre de section (fiche 20261003201035080)', () => {
  it('le détecteur attrape une section en double (contre-exemple)', () => {
    const doc = '# T\n\n## Contexte\n\ntexte\n\n## next --lot N\n\nun\n\n## next --lot N\n\ndeux\n';
    expect(duplicateHeadings(doc)).toEqual(['## next --lot N']);
  });

  it('le détecteur ignore les titres dans un bloc de code', () => {
    const doc = '# T\n\n## Exemples\n\n```md\n## Exemples\n## Exemples\n```\n\nfin\n';
    expect(duplicateHeadings(doc)).toEqual([]);
  });

  it('un même texte à deux niveaux différents n’est PAS un doublon', () => {
    expect(duplicateHeadings('## Et maintenant ?\n\nx\n\n### Et maintenant ?\n\ny\n')).toEqual([]);
  });

  it('le catalogue actuel est propre : aucun SKILL.md n’a de section en double', () => {
    const offenders = skillFiles()
      .map((p) => ({ file: p.slice(MC.length + 1), dups: duplicateHeadings(readFileSync(p, 'utf8')) }))
      .filter((r) => r.dups.length > 0);
    expect(
      offenders,
      `Sections en double :\n${offenders.map((o) => `  ${o.file} : ${o.dups.join(', ')}`).join('\n')}`,
    ).toEqual([]);
  });
});
