import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  PLAN_DATA_BEGIN,
  PLAN_DATA_END,
  buildPlanViewData,
  buildPlanViewDataBlock,
  upsertPlanViewDataBlock,
} from '../core/plan-view-data.js';
import type { Fiche } from '../loaders/fiches.js';
import { loadFiches } from '../loaders/fiches.js';

const fiche = (over: Partial<Fiche> & { id: string }): Fiche => ({
  id: over.id,
  title: over.title ?? `titre ${over.id}`,
  type: over.type ?? 'feature',
  priority: over.priority ?? 'P2',
  status: over.status ?? 'todo',
  ready: over.ready ?? false,
  epic: over.epic ?? '',
  product: over.product ?? 'mega-city',
  pr: over.pr ?? '',
  labels: over.labels ?? [],
  done: over.done ?? false,
  file: over.file ?? `features/${over.id}-slug.md`,
});

const PLAN = [
  '## ▶️ NOW',
  '1. **0002** — todo pas ready (bloquée avant la tête)',
  '2. **0001** — todo ready (la tête) · `build`',
  '## ⏳ LATER',
  '- Paquet distribution — 0003 · 0404',
].join('\n');

const FICHES = [
  fiche({ id: '0002', status: 'todo', ready: false }),
  fiche({ id: '0001', status: 'todo', ready: true, title: 'La tête tirable' }),
  fiche({ id: '0003', status: 'shipped', ready: true }),
  // 0404 volontairement ABSENT → doit remonter en unresolved.
];

describe('buildPlanViewData (fiche 20260825213807501)', () => {
  const data = buildPlanViewData(PLAN, FICHES);

  it('groupe en couloirs = sections non vides, dans l’ordre du document', () => {
    expect(data.lanes.map((l) => l.label)).toEqual(['▶️ NOW', '⏳ LATER']);
    expect(data.lanes[0].rows).toHaveLength(2);
    expect(data.lanes[1].rows).toHaveLength(1);
  });

  it('joint chaque id à sa fiche, et signale les introuvables sans les perdre', () => {
    const later = data.lanes[1].rows[0];
    expect(later.cards.map((c) => c.id)).toEqual(['0003', '0404']); // rien perdu
    expect(later.cards[0].found).toBe(true);
    expect(later.cards[0].status).toBe('shipped');
    expect(later.cards[1].found).toBe(false); // 0404 absent
    expect(data.unresolved).toEqual(['0404']);
  });

  it('calcule la tête tirable (1re todo+ready) et les têtes bloquées avant elle', () => {
    expect(data.head?.id).toBe('0001');
    expect(data.head?.ready).toBe(true);
    expect(data.head?.title).toBe('La tête tirable');
    expect(data.blockedAhead.map((c) => c.id)).toEqual(['0002']);
  });

  it('compte les entrées, cartes, résolues, livrées, introuvables', () => {
    expect(data.counts.entries).toBe(3);
    expect(data.counts.cards).toBe(4);
    expect(data.counts.resolved).toBe(3);
    expect(data.counts.shipped).toBe(1);
    expect(data.counts.unresolved).toBe(1);
  });

  it('conserve le marqueur et l’état barré pour le rendu (grisage des livrées)', () => {
    const now = data.lanes[0];
    expect(now.rows[1].marker).toBe('build');
    expect(now.rows[1].struck).toBe(false);
  });
});

describe('bloc géré window.EZK_PLAN (marqueurs disjoints d’avancement)', () => {
  it('pose le bloc entre les marqueurs, idempotent, et échoue franchement si absents', () => {
    const stub = `avant ${PLAN_DATA_BEGIN}\nOLD\n${PLAN_DATA_END} apres`;
    const block = buildPlanViewDataBlock(PLAN, FICHES);
    const out = upsertPlanViewDataBlock(stub, block);
    expect(out).toContain('window.EZK_PLAN');
    expect(out.startsWith('avant ')).toBe(true);
    expect(out.endsWith(' apres')).toBe(true);
    expect(upsertPlanViewDataBlock(out, block)).toBe(out); // idempotent
    expect(() => upsertPlanViewDataBlock('sans marqueurs', block)).toThrow();
  });

  it('échappe `<` dans les données (protège la balise <script> porteuse)', () => {
    const withTag = [fiche({ id: '0001', title: 'titre </script> piégé', status: 'todo', ready: true })];
    const block = buildPlanViewDataBlock('## NOW\n- **0001** — x', withTag);
    expect(block).not.toContain('</script>');
    expect(block).toContain('\\u003c');
  });
});

describe('smoke sur le vrai features/PLAN.md', () => {
  it('compile des couloirs, une tête réelle, et zéro bruit dans les introuvables', () => {
    const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
    const planMd = readFileSync(join(root, 'features/PLAN.md'), 'utf8');
    const data = buildPlanViewData(planMd, loadFiches(root));

    expect(data.lanes.length).toBeGreaterThan(0);
    // La date « 2026 » et les fragments de SHA ne polluent PAS les introuvables.
    expect(data.unresolved).not.toContain('2026');
    expect(data.unresolved).not.toContain('45102');
    // Si une tête existe, c'est une vraie fiche todo+ready.
    if (data.head) {
      expect(data.head.found).toBe(true);
      expect(data.head.ready).toBe(true);
      expect(data.head.status).toBe('todo');
    }
  });
});
