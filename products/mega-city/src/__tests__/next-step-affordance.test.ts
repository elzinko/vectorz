/**
 * Convention « Et maintenant ? » (fiche 20260825160456259).
 *
 * En clair : à la fin d'un sprint ou d'une commande de backlog, le skill propose les 1 à 3
 * commandes suivantes, chacune avec une raison d'une ligne. Le LLM rédige le bloc ; ce test
 * garde ce qui peut l'être : la règle partagée existe et est déployée, les skills la déclarent,
 * leur table de successions est bien formée, et toute commande citée existe.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { findMentions, ghostMentions, loadCommandIndex } from './helpers/cited-commands.js';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../../../..'); // racine du monorepo vectorz
const mega = join(repoRoot, 'products', 'mega-city');
const index = loadCommandIndex(repoRoot);

const RULE_ID = 'documentation-guidelines/next-step-affordance';
const RULE_FILE = join(mega, 'rules', 'documentation-guidelines', 'next-step-affordance.md');
const ADOPTERS = ['ezk-sprint', 'ezk-backlog'];

/** Texte de la section `## Et maintenant ?` d'un SKILL.md (jusqu'au prochain `## `). */
function nextStepSection(skillMd: string): string | undefined {
  const parts = skillMd.split(/^## /m);
  return parts.find((p) => p.startsWith('Et maintenant ?'));
}

/** Lignes de données d'une table markdown : cellules nettoyées, en-tête et séparateur exclus. */
function tableRows(section: string): string[][] {
  return section
    .split('\n')
    .filter((l) => l.trim().startsWith('|'))
    .map((l) => l.split('|').slice(1, -1).map((c) => c.trim()))
    .filter((cells) => cells.length >= 3 && !/^-+$/.test(cells[0] ?? '') && cells[0] !== 'Quand');
}

const slashCount = (cell: string): number =>
  findMentions(cell).filter((m) => m.kind === 'slash').length;
const reasonCount = (cell: string): number => cell.split(' — ').length - 1;

/** Problèmes d'une ligne `quand | suite logique | pistes` ; liste vide = ligne bien formée. */
function rowProblems(cells: string[]): string[] {
  const [quand = '', suite = '', pistes = ''] = cells;
  if (/^aucun/i.test(suite) && /^aucun/i.test(pistes)) return []; // « aucun bloc » : voulu
  const problems: string[] = [];
  const total = slashCount(suite) + slashCount(pistes);
  if (total < 1) problems.push('aucune commande (écrire « aucun bloc » si rien à proposer)');
  if (total > 3) problems.push(`${total} commandes (maximum 3)`);
  for (const cell of [suite, pistes]) {
    if (reasonCount(cell) < slashCount(cell)) problems.push(`commande sans raison dans « ${cell} »`);
  }
  return problems.map((p) => `« ${quand} » : ${p}`);
}

describe('table « Et maintenant ? » — lignes bien formées (outil)', () => {
  it('accepte 1 à 3 commandes motivées, et « aucun bloc » pour une sous-commande sans suite', () => {
    expect(rowProblems(['après `add`', '`/ezk-backlog groom <id>` — la fiche est une idée', 'aucune'])).toEqual(
      [],
    );
    expect(rowProblems(['`list`', 'aucun bloc', 'aucun'])).toEqual([]);
  });

  it('refuse un bloc creux, un bloc trop long et une commande sans raison', () => {
    expect(rowProblems(['x', '—', '—'])[0]).toContain('aucune commande');
    const four =
      '`/ezk-backlog list` — a ; `/ezk-backlog next` — b ; `/ezk-backlog plan` — c ; `/ezk-backlog regen` — d';
    expect(rowProblems(['x', four, '—'])[0]).toContain('4 commandes');
    expect(rowProblems(['x', '`/ezk-backlog list`', '—'])[0]).toContain('commande sans raison');
  });
});

describe('règle partagée documentation-guidelines/next-step-affordance', () => {
  const rule = readFileSync(RULE_FILE, 'utf8');

  it('porte le bon id, en SHOULD, et relie le besoin au prior art BMAD', () => {
    expect(rule).toMatch(new RegExp(`^id: ${RULE_ID}$`, 'm'));
    expect(rule).toMatch(/^level: SHOULD$/m);
    expect(rule).toMatch(/BMAD/);
  });

  it('est rangée dans le bundle base (sinon aucun profil ne la déploie)', () => {
    expect(readFileSync(join(mega, 'bundles', 'base.yml'), 'utf8')).toContain(`- ${RULE_ID}`);
  });
});

describe.each(ADOPTERS)('skill %s adopte la convention', (skill) => {
  const file = join(mega, 'skills', skill, 'SKILL.md');
  const md = readFileSync(file, 'utf8');
  const section = nextStepSection(md);

  it('déclare la règle dans applies:', () => {
    const applies = /^applies:\s*\[([^\]]*)\]/m.exec(md)?.[1] ?? '';
    expect(applies.split(',').map((s) => s.trim())).toContain(RULE_ID);
  });

  it('a une section « Et maintenant ? » qui renvoie à la règle (sans la recopier)', () => {
    expect(section, `${skill} : section « ## Et maintenant ? » absente`).toBeDefined();
    const link = /\]\(([^)]*next-step-affordance\.md)\)/.exec(section ?? '')?.[1];
    expect(link, `${skill} : lien vers la règle absent`).toBeDefined();
    expect(existsSync(resolve(dirname(file), link ?? 'absent'))).toBe(true);
  });

  it('a une table bien formée : 1 à 3 commandes motivées par ligne, ou « aucun bloc »', () => {
    const rows = tableRows(section ?? '');
    expect(rows.length).toBeGreaterThanOrEqual(3);
    expect(rows.flatMap(rowProblems)).toEqual([]);
  });

  it('ne cite que des commandes qui existent', () => {
    expect(ghostMentions(section ?? '', index)).toEqual([]);
  });
});
