/**
 * Le cliquet de la LOI (fiche 20260903134909124, ADR-0056 — voie 3) : une règle « un agent la
 * contrôle » doit être portée par le prompt de cet agent. Les règles qui ne le sont pas encore
 * sont consignées, datées, dans `law-debt.yml` : la dette ne peut que rétrécir.
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import { describe, expect, it } from 'vitest';
import {
  type AgentCheckDebt,
  agentCheckCoverage,
  checkKey,
  ratchet,
} from '../core/law-coverage.js';
import type { Agent, Rule } from '../domain/model.js';
import { loadCatalog } from '../loaders/catalog.js';

const agent = (id: string, role: string, interactions: string[] = []): Agent => ({
  id,
  role,
  competences: [],
  interactions,
});
const rule = (id: string, agentId: string, title?: string): Rule => ({
  id,
  kind: 'disposition',
  level: 'MUST',
  content: 'x',
  ...(title ? { title } : {}),
  enforcements: [{ type: 'agent-check', agent: agentId }],
});

describe('agentCheckCoverage — la règle atteint-elle le prompt de son agent ?', () => {
  const agents = new Map([
    ['rev', agent('rev', 'Je contrôle clean/a et la règle « Petites Fonctions ».')],
    ['pm', agent('pm', 'Je décide.', ['dev/b'])],
  ]);
  const rules = [
    rule('clean/a', 'rev'),
    rule('clean/titre', 'rev', 'Petites Fonctions'),
    rule('clean/absente', 'rev'),
    rule('dev/b', 'pm'),
    rule('dev/inconnu', 'fantome'),
    { ...rule('dev/sans-agent', 'rev'), enforcements: [{ type: 'prompt' as const }] },
  ];
  const rows = agentCheckCoverage(rules, agents);
  const cited = (id: string) => rows.find((r) => r.rule === id)?.cited;

  it('cite par id ou par titre, dans le corps du rôle', () => {
    expect(cited('clean/a')).toBe(true);
    expect(cited('clean/titre')).toBe(true);
  });

  it('ne compte pas la liste « interactions » de l’en-tête : le modèle ne la lit pas', () => {
    expect(cited('dev/b')).toBe(false);
  });

  it('ne cite pas ce que le prompt ne porte pas, ni pour un agent inconnu', () => {
    expect(cited('clean/absente')).toBe(false);
    expect(cited('dev/inconnu')).toBe(false);
    expect(rows.find((r) => r.rule === 'dev/inconnu')?.agentExists).toBe(false);
  });

  it('ignore les règles qui ne sont pas en agent-check', () => {
    expect(rows.some((r) => r.rule === 'dev/sans-agent')).toBe(false);
  });
});

describe('ratchet — la dette peut se vider, jamais grossir', () => {
  const coverage = [
    { rule: 'a', agent: 'x', agentExists: true, cited: true },
    { rule: 'b', agent: 'x', agentExists: true, cited: false },
    { rule: 'c', agent: 'x', agentExists: true, cited: false },
  ];

  it('rien à dire quand la dette est exactement l’état réel', () => {
    const debt: AgentCheckDebt[] = [{ rule: 'b', agent: 'x' }, { rule: 'c', agent: 'x' }];
    expect(ratchet(coverage, debt)).toEqual({ newlyUncited: [], staleDebt: [] });
  });

  it('refuse une aggravation : règle non citée et hors dette', () => {
    expect(ratchet(coverage, [{ rule: 'b', agent: 'x' }]).newlyUncited).toEqual([checkKey({ rule: 'c', agent: 'x' })]);
  });

  it('exige de retirer une dette devenue citée, ou dont la règle a disparu', () => {
    const debt: AgentCheckDebt[] = [
      { rule: 'a', agent: 'x' }, // citée depuis
      { rule: 'b', agent: 'x' },
      { rule: 'c', agent: 'x' },
      { rule: 'z', agent: 'x' }, // règle disparue
    ];
    expect(ratchet(coverage, debt).staleDebt).toEqual([
      checkKey({ rule: 'a', agent: 'x' }),
      checkKey({ rule: 'z', agent: 'x' }),
    ]);
  });
});

describe('le vrai catalogue contre law-debt.yml', () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
  const catalog = loadCatalog(root);
  const debt = (parseYaml(readFileSync(join(root, 'law-debt.yml'), 'utf8')) as { uncited: AgentCheckDebt[] })
    .uncited;
  const verdict = ratchet(agentCheckCoverage(catalog.rules.values(), catalog.agents), debt);

  it('toute règle agent-check est citée par son agent, ou consignée dans la dette', () => {
    expect(
      verdict.newlyUncited,
      `règles agent-check que le prompt de leur agent ne cite pas : cite chaque id dans agents/<agent>.md (ou, dernier recours, ajoute-la à law-debt.yml)`,
    ).toEqual([]);
  });

  it('la dette ne garde que des règles encore non citées', () => {
    expect(verdict.staleDebt, 'à retirer de law-debt.yml : elles sont citées, ou la règle n’existe plus').toEqual([]);
  });
});
