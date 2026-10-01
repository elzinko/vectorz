/**
 * aggregate-apply — appliquer pour de vrai une fusion ou un découpage (fiche 20260910231201744).
 *
 * Deux étages : le PLAN (pur, l'état du dépôt est injecté — il REFUSE avant d'écrire, et réutilise
 * `planShip` pour les liens, `PLAN.md` et le déplacement) puis l'APPLICATION (`applyShip`, avec retour
 * arrière). Ce fichier prouve ce que l'apply ajoute à `ship` : le statut `merged`/`split`, la provenance
 * dans les deux sens, et la garde de ses propres préconditions.
 */
import { posix } from 'node:path';
import { describe, expect, it } from 'vitest';
import { frontMatter, readField, readListField } from '../../loaders/fiches.js';
import { planAggregateApply } from '../aggregate-apply.js';
import { type RepoFs, type ShipIo, ShipFailure, ShipRefusal, applyShip } from '../ship-fiche.js';

const I = (n: number): string => `202601010000000${String(n).padStart(2, '0')}`;
const F = (n: number): string => `features/${I(n)}_f${n}.md`;
const D = (n: number): string => `features/done/${I(n)}_f${n}.md`;

const fm = (id: string, extra = '', status = 'ready'): string =>
  `---\nid: "${id}"\ntitle: "T ${id}"\ntype: feature\npriority: P1\nstatus: ${status}\npr:\n${extra}---\n\ncorps ${id}\n`;

/** Un dépôt jouet : une résultante (1), deux sources (2, 3), une livrée (4), une close restée là (5). */
function base(): Record<string, string> {
  return {
    [F(1)]: fm(I(1)),
    [F(2)]: fm(I(2)),
    [F(3)]: fm(I(3)),
    [D(4)]: fm(I(4), '', 'shipped'),
    [F(5)]: fm(I(5), '', 'superseded'),
    'features/PLAN.md': `# Plan\n\n## NOW\n\n- \`${I(2)}\` — la fiche B · \`build\`\n`,
    'features/BACKLOG.md': '# index\n',
  };
}

function memFs(files: Record<string, string>): RepoFs {
  const dirs = new Set<string>();
  for (const p of Object.keys(files)) {
    for (let d = posix.dirname(p); d !== '.' && !dirs.has(d); d = posix.dirname(d)) dirs.add(d);
  }
  return {
    markdownFiles: () => Object.keys(files).filter((p) => p.endsWith('.md')),
    read: (p) => {
      if (!(p in files)) throw new Error(`absent : ${p}`);
      return files[p];
    },
    exists: (p) => p in files || dirs.has(p),
  };
}

const plan = (g: Parameters<typeof planAggregateApply>[1], files = base()) =>
  planAggregateApply(memFs(files), g);

/** Les raisons du refus, ou '' si le plan passe. */
function refusal(g: Parameters<typeof planAggregateApply>[1], files = base()): string {
  try {
    plan(g, files);
    return '';
  } catch (error) {
    if (error instanceof ShipRefusal) return error.reasons.join('\n');
    throw error;
  }
}

const field = (text: string, name: string): string => readField(frontMatter(text), name);
const list = (text: string, name: string): string[] => readListField(frontMatter(text), name);

describe('planAggregateApply — fusion', () => {
  it('passe les sources en merged avec merged_into, déplace vers done/, barre PLAN.md', () => {
    const p = plan({ kind: 'merge', into: I(1), sources: [I(2), I(3)] });
    expect(p.moves).toEqual([
      { from: F(2), to: D(2) },
      { from: F(3), to: D(3) },
    ]);
    const b = p.writes.get(F(2)) as string;
    expect(field(b, 'status')).toBe('merged');
    expect(field(b, 'merged_into')).toBe(I(1));
    expect(field(b, 'pr')).toBe(`merged — fusionnée dans ${I(1)}`);
    expect(p.planBarred).toEqual([I(2)]);
  });

  it('la résultante reste active et cite ses sources (merged_from, trié, sans doublon, cumulé)', () => {
    const files = base();
    files[F(1)] = fm(I(1), `merged_from: ["${I(9)}", "${I(3)}"]\n`);
    const p = plan({ kind: 'merge', into: I(1), sources: [I(3), I(2)] }, files);
    const a = p.writes.get(F(1)) as string;
    expect(list(a, 'merged_from')).toEqual([I(2), I(3), I(9)]);
    expect(field(a, 'status')).toBe('ready'); // jamais déplacée, jamais re-statuée
    expect(p.moves.map((m) => m.from)).not.toContain(F(1));
  });

  it('ne touche à aucune autre fiche', () => {
    const p = plan({ kind: 'merge', into: I(1), sources: [I(2)] });
    expect([...p.writes.keys()].sort()).toEqual([F(1), F(2), 'features/PLAN.md'].sort());
  });
});

describe('planAggregateApply — découpage', () => {
  it('passe la source en split avec split_into ; chaque enfant cite la source (split_from)', () => {
    const p = plan({ kind: 'split', source: I(1), into: [I(2), I(3)] });
    expect(p.moves).toEqual([{ from: F(1), to: D(1) }]);
    const a = p.writes.get(F(1)) as string;
    expect(field(a, 'status')).toBe('split');
    expect(list(a, 'split_into')).toEqual([I(2), I(3)]);
    expect(field(p.writes.get(F(2)) as string, 'split_from')).toBe(I(1));
    expect(field(p.writes.get(F(3)) as string, 'split_from')).toBe(I(1));
    expect(field(p.writes.get(F(2)) as string, 'status')).toBe('ready'); // les enfants restent actifs
  });
});

describe('planAggregateApply — refus AVANT toute écriture', () => {
  it('refuse un id inconnu, en le nommant', () => {
    expect(refusal({ kind: 'merge', into: I(1), sources: [I(99)] })).toContain(I(99));
    expect(refusal({ kind: 'merge', into: I(98), sources: [I(2)] })).toContain(I(98));
  });

  it('refuse une source déjà dans done/ ou close sans livraison', () => {
    expect(refusal({ kind: 'merge', into: I(1), sources: [I(4)] })).toContain('done/');
    expect(refusal({ kind: 'merge', into: I(1), sources: [I(5)] })).toContain('superseded');
  });

  it('refuse une résultante déjà livrée ou close', () => {
    expect(refusal({ kind: 'merge', into: I(4), sources: [I(2)] })).toContain('done/');
    expect(refusal({ kind: 'merge', into: I(5), sources: [I(2)] })).toContain('superseded');
  });

  it('refuse une résultante parmi les sources, une source en double, une fusion sans source', () => {
    expect(refusal({ kind: 'merge', into: I(1), sources: [I(1), I(2)] })).toContain('parmi les sources');
    expect(refusal({ kind: 'merge', into: I(1), sources: [I(2), I(2)] })).toContain('deux fois');
    expect(refusal({ kind: 'merge', into: I(1), sources: [] })).toContain('au moins une source');
  });

  it('refuse un découpage à moins de 2 enfants, ou avec la source parmi les enfants', () => {
    expect(refusal({ kind: 'split', source: I(1), into: [I(2)] })).toContain('au moins 2 enfants');
    expect(refusal({ kind: 'split', source: I(1), into: [I(1), I(2)] })).toContain('parmi les enfants');
  });

  it('refuse un enfant déjà livré', () => {
    expect(refusal({ kind: 'split', source: I(1), into: [I(2), I(4)] })).toContain('done/');
  });

  it('hérite des gardes de planShip : une entrée de PLAN.md mêlant la source et une fiche à faire', () => {
    const files = base();
    files['features/PLAN.md'] = `# Plan\n\n## NOW\n\n- \`${I(2)}\` et \`${I(3)}\` — deux fiches · \`build\`\n`;
    expect(refusal({ kind: 'merge', into: I(1), sources: [I(2)] }, files)).toContain('PLAN.md');
  });

  it('rapporte TOUTES les raisons d’un coup, pas seulement la première', () => {
    const reasons = refusal({ kind: 'merge', into: I(98), sources: [I(99), I(4)] });
    expect(reasons).toContain(I(98));
    expect(reasons).toContain(I(99));
    expect(reasons).toContain('done/');
  });
});

/** Un dépôt en mémoire derrière `ShipIo`, avec la possibilité de faire échouer une étape. */
function memIo(files: Record<string, string>, fail: 'move' | 'regen' | null = null) {
  const calls = { regen: 0 };
  const io: ShipIo = {
    read: (p) => {
      if (!(p in files)) throw new Error(`absent : ${p}`);
      return files[p];
    },
    write: (p, c) => {
      files[p] = c;
    },
    gitMove: (sources, destDir) => {
      if (fail === 'move') throw new Error('git mv KO');
      for (const s of sources) {
        files[`${destDir}/${posix.basename(s)}`] = files[s];
        delete files[s];
      }
    },
    regenBacklog: () => {
      calls.regen += 1;
      if (fail === 'regen') throw new Error('regen KO');
    },
  };
  return { io, calls };
}

describe('applyShip sur un plan d’apply — écriture et retour arrière', () => {
  it('applique : provenance écrite, sources dans done/, BACKLOG régénéré', () => {
    const files = base();
    const { io, calls } = memIo(files);
    applyShip(plan({ kind: 'merge', into: I(1), sources: [I(2), I(3)] }, files), io);
    expect(Object.keys(files)).toContain(D(2));
    expect(Object.keys(files)).not.toContain(F(2));
    expect(list(files[F(1)], 'merged_from')).toEqual([I(2), I(3)]);
    expect(field(files[D(3)], 'merged_into')).toBe(I(1));
    expect(calls.regen).toBe(1);
  });

  it('au moindre échec, remet TOUT dans son état initial — la résultante comprise', () => {
    for (const step of ['move', 'regen'] as const) {
      const files = base();
      const initial = { ...files };
      const { io } = memIo(files, step);
      const p = plan({ kind: 'merge', into: I(1), sources: [I(2), I(3)] }, files);
      let failure: unknown;
      try {
        applyShip(p, io);
      } catch (error) {
        failure = error;
      }
      expect(failure).toBeInstanceOf(ShipFailure);
      expect((failure as ShipFailure).rolledBack).toBe(true);
      expect(files).toEqual(initial); // la résultante (merged_from) et PLAN.md inclus
    }
  });
});
