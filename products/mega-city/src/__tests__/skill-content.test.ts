import { describe, expect, it } from 'vitest';
import type { ResolvedProfile } from '../domain/model.js';
import { skillFolderFiles } from '../caps/skill-content.js';

/** ResolvedProfile minimal — `skillFolderFiles` ne lit que les skills. */
const profile = (skills: ResolvedProfile['skills']): ResolvedProfile => ({
  rules: [],
  agents: [],
  skills,
});

describe('skillFolderFiles — assets de dossier (ADR-0027)', () => {
  it('émet SKILL.md PLUS un fichier par asset sous <prefix>/<id>/<rel>', () => {
    const files = skillFolderFiles(
      profile([
        {
          id: 'ezk-article',
          content: '  playbook\n',
          assets: [
            { path: 'approaches/vectorz.md', content: '# approche\n' },
            { path: 'scripts/run.sh', content: '#!/bin/sh\necho hi', executable: true },
          ],
        },
      ]),
      'skills',
    );
    const byPath = Object.fromEntries(files.map((f) => [f.path, f]));
    // SKILL.md : normalisé (trim + \n)
    expect(byPath['skills/ezk-article/SKILL.md'].content).toBe('playbook\n');
    // asset markdown : VERBATIM (pas de trim ni \n forcé), pas de mode
    expect(byPath['skills/ezk-article/approaches/vectorz.md'].content).toBe('# approche\n');
    expect(byPath['skills/ezk-article/approaches/vectorz.md'].mode).toBeUndefined();
    // asset exécutable : VERBATIM + mode 0o755
    expect(byPath['skills/ezk-article/scripts/run.sh'].content).toBe('#!/bin/sh\necho hi');
    expect(byPath['skills/ezk-article/scripts/run.sh'].mode).toBe(0o755);
  });

  it('prefix vide (cap desktop) : <id>/<rel>, jamais de slash en tête', () => {
    const files = skillFolderFiles(
      profile([{ id: 'foo', content: 'x', assets: [{ path: 'approaches/a.md', content: 'a' }] }]),
      '',
    );
    expect(files.map((f) => f.path).sort()).toEqual(['foo/SKILL.md', 'foo/approaches/a.md']);
  });

  it("n'émet AUCUN fichier (ni SKILL.md ni asset) pour un skill au contenu vide", () => {
    const files = skillFolderFiles(
      profile([{ id: 'empty', content: '  \n', assets: [{ path: 'a.md', content: 'a' }] }]),
      'skills',
    );
    expect(files).toEqual([]);
  });

  it('rejette un asset.path de traversal (assertSafeId au bord du cap, F1)', () => {
    const run = () =>
      skillFolderFiles(
        profile([{ id: 'foo', content: 'x', assets: [{ path: '../../evil', content: 'x' }] }]),
        'skills',
      );
    expect(run).toThrow(/non sûr/i);
  });

  it('rétro-compat : un skill sans assets émet uniquement SKILL.md', () => {
    const files = skillFolderFiles(profile([{ id: 'foo', content: 'x' }]), 'skills');
    expect(files).toEqual([{ path: 'skills/foo/SKILL.md', content: 'x\n' }]);
  });
});
