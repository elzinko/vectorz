import { describe, expect, it } from 'vitest';
import { findDuplicateIds, validateFicheFrontMatter } from '../fiche-validator.js';

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

  it('evidence: before-after → aucune anomalie (champ optionnel, valeur valide)', () => {
    const text = fm({ ...VALID_FIELDS, evidence: 'before-after' });
    const anomalies = validateFicheFrontMatter('features/x.md', text, { monorepo: false });
    expect(anomalies.find((a) => a.field === 'evidence')).toBeUndefined();
  });

  it("evidence: none avec commentaire de raison → aucune anomalie (readField strippe le commentaire)", () => {
    const text = fm({ ...VALID_FIELDS, evidence: "none # pas d'écran" });
    const anomalies = validateFicheFrontMatter('features/x.md', text, { monorepo: false });
    expect(anomalies.find((a) => a.field === 'evidence')).toBeUndefined();
  });

  it('evidence hors-enum → une anomalie nommant la valeur et les trois valeurs admises', () => {
    const text = fm({ ...VALID_FIELDS, evidence: 'peut-etre' });
    const anomalies = validateFicheFrontMatter('features/x.md', text, { monorepo: false });
    const anomaly = anomalies.find((a) => a.field === 'evidence');
    expect(anomaly?.message).toContain('peut-etre');
    expect(anomaly?.message).toContain('before-after');
    expect(anomaly?.message).toContain('auto');
    expect(anomaly?.message).toContain('none');
  });

  it('evidence absent → aucune anomalie (champ optionnel)', () => {
    const text = fm(VALID_FIELDS); // pas de evidence:
    const anomalies = validateFicheFrontMatter('features/x.md', text, { monorepo: false });
    expect(anomalies.find((a) => a.field === 'evidence')).toBeUndefined();
  });
});

describe('findDuplicateIds (contrôle inter-fichiers — fléau des ids en double)', () => {
  it('ids uniques → aucune anomalie', () => {
    expect(
      findDuplicateIds([
        { file: 'a.md', id: '1' },
        { file: 'b.md', id: '2' },
      ]),
    ).toEqual([]);
  });

  it('id dupliqué → une anomalie par fiche concernée (champ id)', () => {
    const anomalies = findDuplicateIds([
      { file: 'b.md', id: '1' },
      { file: 'a.md', id: '1' },
      { file: 'c.md', id: '2' },
    ]);
    expect(anomalies).toHaveLength(2);
    expect(anomalies.every((a) => a.field === 'id')).toBe(true);
    expect(anomalies.map((a) => a.file).sort()).toEqual(['a.md', 'b.md']);
  });

  it('id vide ignoré (déjà signalé « champ requis absent »)', () => {
    expect(
      findDuplicateIds([
        { file: 'a.md', id: '' },
        { file: 'b.md', id: '' },
      ]),
    ).toEqual([]);
  });
});
