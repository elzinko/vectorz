import { describe, expect, it } from 'vitest';
import {
  findStalePlanEntries,
  findStalePortfolioEntries,
  findStalePlanningViews,
  fmField,
} from '../planning-views.js';

const shipped = (ids: string[]) => new Map(ids.map((id) => [id, 'shipped'] as [string, string]));

describe('findStalePlanEntries (PLAN.md curé)', () => {
  it('signale une fiche shipped encore marquée `build` (non barrée)', () => {
    const plan = `## NOW\n1. **20260812100109940** — sync des vues · \`build\`\n`;
    const stale = findStalePlanEntries(plan, shipped(['20260812100109940']));
    expect(stale.map((s) => s.id)).toEqual(['20260812100109940']);
    expect(stale[0]?.shown).toBe('build');
  });

  it('ne signale pas une entrée barrée (~~…~~ — shipped)', () => {
    const plan = `## Fait\n- ~~\`build\` **0181** — méthode~~ — shipped #92.\n`;
    expect(findStalePlanEntries(plan, shipped(['0181']))).toEqual([]);
  });

  it('ne signale pas une fiche encore réellement à faire', () => {
    const plan = `## NOW\n1. **0152** — ezk-bug · \`build\`\n`;
    expect(findStalePlanEntries(plan, new Map([['0152', 'todo']]))).toEqual([]);
  });
});

describe('findStalePortfolioEntries (PORTFOLIO.md généré)', () => {
  const row = (id: string, statut: string) =>
    `| mega-city | ${id} | Titre | chore | P2 | ${statut} |  |`;

  it('signale une fiche shipped affichée 🔴 todo', () => {
    const portfolio = `# Portfolio\n\n${row('20260812100109940', '🔴 todo')}\n`;
    const stale = findStalePortfolioEntries(portfolio, shipped(['20260812100109940']));
    expect(stale.map((s) => s.id)).toEqual(['20260812100109940']);
  });

  it('ne signale pas une fiche shipped affichée ✅ shipped', () => {
    const portfolio = row('20260812100109940', '✅ shipped');
    expect(findStalePortfolioEntries(portfolio, shipped(['20260812100109940']))).toEqual([]);
  });

  it('ignore les lignes d’en-tête et de séparation', () => {
    const portfolio = `| Prod | # | Titre | Type | Prio | Statut | PR |\n|------|---|-------|------|------|--------|----|\n`;
    expect(findStalePortfolioEntries(portfolio, shipped(['0152']))).toEqual([]);
  });
});

describe('findStalePlanningViews (filet combiné)', () => {
  it('agrège les incohérences de PORTFOLIO et de PLAN', () => {
    const portfolio = `| mega-city | 20260812100109940 | T | chore | P2 | 🔴 todo |  |`;
    const plan = `## NOW\n1. **0152** — ezk-bug · \`build\`\n`;
    const status = new Map<string, string>([
      ['20260812100109940', 'shipped'],
      ['0152', 'shipped'],
    ]);
    const views = findStalePlanningViews(status, portfolio, plan).map((s) => s.view).sort();
    expect(views).toEqual(['PLAN', 'PORTFOLIO']);
  });
});

describe('fmField (front-matter en texte)', () => {
  it('garde un id legacy à zéro initial (0018, pas d’octal)', () => {
    expect(fmField('---\nid: 0018\nstatus: todo\n---\ncorps', 'id')).toBe('0018');
  });

  it('retire un commentaire inline', () => {
    expect(fmField('---\nstatus: shipped # livré\n---\n', 'status')).toBe('shipped');
  });

  it('ne lit que le front-matter, même si le corps contient ---', () => {
    const fm = '---\nid: "20260812100109940"\nstatus: shipped\n---\n\n## Notes\n---\nstatus: todo\n';
    expect(fmField(fm, 'status')).toBe('shipped');
  });

  it('déquote un id horodaté', () => {
    expect(fmField('---\nid: "20260812100109940"\n---\n', 'id')).toBe('20260812100109940');
  });
});
