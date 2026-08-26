import { describe, expect, it } from 'vitest';
import { validateFicheFrontMatter } from '../fiche-validator.js';

const fm = (fields: Record<string, string>) =>
  `---\n${Object.entries(fields)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')}\n---\nCorps de la fiche.\n`;

const VALID_FIELDS = {
  id: '20260826140000000',
  title: 'Une fiche valide',
  type: 'feature',
  priority: 'P1',
  status: 'todo',
};

describe('validateFicheFrontMatter (ADR-0040 D2 — mode warning, non bloquant)', () => {
  it('fiche valide → aucune anomalie', () => {
    const text = fm(VALID_FIELDS);
    expect(validateFicheFrontMatter('features/x.md', text, { monorepo: false })).toEqual([]);
  });

  it('status hors-enum → listé (n-importe-quoi)', () => {
    const text = fm({ ...VALID_FIELDS, status: 'n-importe-quoi' });
    const anomalies = validateFicheFrontMatter('features/x.md', text, { monorepo: false });
    expect(anomalies).toContainEqual(
      expect.objectContaining({ file: 'features/x.md', field: 'status' }),
    );
  });

  it('champ requis absent (title) → listé', () => {
    const { title: _title, ...rest } = VALID_FIELDS;
    const text = fm(rest);
    const anomalies = validateFicheFrontMatter('features/x.md', text, { monorepo: false });
    expect(anomalies).toContainEqual(
      expect.objectContaining({ file: 'features/x.md', field: 'title' }),
    );
  });

  it('product absent en backlog mono-produit (monorepo: false) → PAS une anomalie', () => {
    const text = fm(VALID_FIELDS); // pas de product:
    const anomalies = validateFicheFrontMatter('features/x.md', text, { monorepo: false });
    expect(anomalies.find((a) => a.field === 'product')).toBeUndefined();
  });

  it('product absent en monorepo (monorepo: true) → listé', () => {
    const text = fm(VALID_FIELDS); // pas de product:
    const anomalies = validateFicheFrontMatter('features/x.md', text, { monorepo: true });
    expect(anomalies).toContainEqual(
      expect.objectContaining({ file: 'features/x.md', field: 'product' }),
    );
  });

  it('product présent en monorepo → aucune anomalie sur product', () => {
    const text = fm({ ...VALID_FIELDS, product: 'mega-city' });
    const anomalies = validateFicheFrontMatter('features/x.md', text, { monorepo: true });
    expect(anomalies.find((a) => a.field === 'product')).toBeUndefined();
  });

  it('type hors-enum → listé', () => {
    const text = fm({ ...VALID_FIELDS, type: 'gadget' });
    const anomalies = validateFicheFrontMatter('features/x.md', text, { monorepo: false });
    expect(anomalies).toContainEqual(expect.objectContaining({ field: 'type' }));
  });
});
