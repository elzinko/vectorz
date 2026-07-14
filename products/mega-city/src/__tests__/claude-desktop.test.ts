import { describe, expect, it } from 'vitest';
import type { ResolvedProfile } from '../domain/model.js';
import type { WritePlan } from '../domain/plan.js';
import { claudeDesktopCap } from '../caps/claude-desktop.js';

/** Fabrique un ResolvedProfile minimal (le cap desktop ne lit que les skills). */
const profile = (
  skills: ResolvedProfile['skills'],
  agents: ResolvedProfile['agents'] = [],
): ResolvedProfile => ({ rules: [], agents, skills });

const paths = (plan: WritePlan) => plan.files.map((f) => f.path);

describe('claudeDesktopCap.materialize (plan pur, sans FS)', () => {
  it('matérialise un skill non vide dans <id>/SKILL.md (contenu trim + \\n final)', () => {
    const plan = claudeDesktopCap.materialize(profile([{ id: 'foo', content: '  Bonjour\n' }]), '/fake/desktop');
    expect(plan.files).toHaveLength(1);
    expect(plan.files[0]).toMatchObject({ path: 'foo/SKILL.md', content: 'Bonjour\n' });
  });

  it('produit un dossier par skill', () => {
    const plan = claudeDesktopCap.materialize(
      profile([
        { id: 'foo', content: 'A' },
        { id: 'bar', content: 'B' },
      ]),
      '/fake/desktop',
    );
    expect(paths(plan)).toEqual(['bar/SKILL.md', 'foo/SKILL.md']);
  });

  it("ne matérialise pas un skill au contenu vide ou blanc", () => {
    const plan = claudeDesktopCap.materialize(
      profile([
        { id: 'foo', content: 'réel' },
        { id: 'empty', content: '   \n  ' },
      ]),
      '/fake/desktop',
    );
    expect(plan.files.some((f) => f.path.startsWith('empty/'))).toBe(false);
    expect(plan.files).toHaveLength(1);
  });

  it('rejette un id de skill non sûr (assertSafeId)', () => {
    const run = () => claudeDesktopCap.materialize(profile([{ id: '../evil', content: 'x' }]), '/fake/desktop');
    expect(run).toThrow(/non sûr/i);
  });

  it('trie stablement les fichiers par path (déterminisme)', () => {
    const plan = claudeDesktopCap.materialize(
      profile([
        { id: 'zeta', content: 'z' },
        { id: 'alpha', content: 'a' },
        { id: 'mu', content: 'm' },
      ]),
      '/fake/desktop',
    );
    expect(paths(plan)).toEqual(['alpha/SKILL.md', 'mu/SKILL.md', 'zeta/SKILL.md']);
  });

  it('périmètre skills-seuls : hooks vides, aucun fichier agent malgré un agent au profil', () => {
    const plan = claudeDesktopCap.materialize(
      profile(
        [{ id: 'foo', content: 'x' }],
        [{ id: 'reviewer', role: '# reviewer', competences: [], interactions: [] }],
      ),
      '/fake/desktop',
    );
    expect(plan.hooks).toEqual([]);
    expect(plan.files.every((f) => !/CLAUDE\.md$|ENTRY\.md$|^reviewer\//.test(f.path))).toBe(true);
    expect(paths(plan)).toEqual(['foo/SKILL.md']);
  });
});
