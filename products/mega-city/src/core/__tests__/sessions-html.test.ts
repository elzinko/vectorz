import { describe, expect, it } from 'vitest';
import { renderSessionsHtml } from '../sessions-html.js';
import type { SessionsData } from '../sessions-data.js';

describe('renderSessionsHtml (fiche 20260829214131713, ADR-0043)', () => {
  it('rend une ligne de worktree : dossier, branche, sujet, activité, supprimable + raison', () => {
    const data: SessionsData = {
      rows: [
        {
          path: '/Users/elzinko/git/vectorz/.claude/worktrees/foo',
          branch: 'feat/123-slug',
          subject: 'feat',
          sessionActivity: 'active',
          merged: false,
          uncommitted: [],
          pr: '#42 OPEN',
          deletable: false,
          deletableReason: 'session active — garder',
          collisionsWith: [],
        },
      ],
    };

    const html = renderSessionsHtml(data);

    expect(html).toContain('/Users/elzinko/git/vectorz/.claude/worktrees/foo');
    expect(html).toContain('feat/123-slug');
    expect(html).toContain('feat');
    expect(html).toContain('active');
    expect(html).toContain('#42 OPEN');
    expect(html).toContain('session active — garder');
  });

  it('rend une collision avec ses fichiers, en marquant le fichier "hot" distinctement', () => {
    const data: SessionsData = {
      rows: [
        {
          path: '/wt/a',
          branch: 'feat/a',
          subject: 'feat',
          sessionActivity: 'active',
          merged: false,
          uncommitted: ['features/x.md', 'src/y.ts'],
          pr: '—',
          deletable: false,
          deletableReason: 'session active — garder',
          collisionsWith: [
            {
              path: '/wt/b',
              files: [
                { file: 'features/x.md', hot: true },
                { file: 'src/y.ts', hot: false },
              ],
            },
          ],
        },
      ],
    };

    const html = renderSessionsHtml(data);

    expect(html).toContain('/wt/a');
    expect(html).toContain('/wt/b');
    expect(html).toContain('features/x.md');
    expect(html).toContain('src/y.ts');
    // le fichier chaud doit porter un marquage distinct (classe/badge), pas juste le texte
    expect(html).toMatch(/class="[^"]*hot[^"]*"[^>]*>features\/x\.md/);
  });

  it('liste les lignes supprimables dans un encart Recommandations', () => {
    const data: SessionsData = {
      rows: [
        {
          path: '/wt/dead',
          branch: 'feat/old',
          subject: 'feat',
          sessionActivity: 'dormant',
          merged: true,
          uncommitted: [],
          pr: '—',
          deletable: true,
          deletableReason: 'dormant, propre, branche déjà fusionnée dans main',
          collisionsWith: [],
        },
      ],
    };

    const html = renderSessionsHtml(data);

    expect(html).toContain('Recommandations');
    expect(html).toContain('/wt/dead');
    expect(html).toContain('dormant, propre, branche déjà fusionnée dans main');
  });

  it('échappe le HTML des valeurs dynamiques (anti-injection)', () => {
    const data: SessionsData = {
      rows: [
        {
          path: '/wt/<script>alert(1)</script>',
          branch: 'feat/a&b',
          subject: 'feat',
          sessionActivity: 'active',
          merged: false,
          uncommitted: [],
          pr: '—',
          deletable: false,
          deletableReason: 'session active — garder',
          collisionsWith: [],
        },
      ],
    };

    const html = renderSessionsHtml(data);

    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('feat/a&amp;b');
  });
});
