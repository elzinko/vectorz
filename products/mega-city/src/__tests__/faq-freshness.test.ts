/**
 * Fraîcheur de la FAQ « comment faire » (fiche 20260824122629925).
 *
 * En clair : la FAQ répond aux questions récurrentes du PO et pointe vers la commande qui fait
 * autorité. Elle ne doit jamais citer une commande, un agent ou un script qui n'existe plus —
 * sinon elle ment, et le PO perd du temps. Ce test lit la FAQ, relève chaque commande citée
 * (cf. helpers/cited-commands.ts) et passe au rouge dès qu'une n'existe pas.
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { findMentions, ghostMentions, loadCommandIndex } from './helpers/cited-commands.js';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../../../..'); // racine du monorepo vectorz
const index = loadCommandIndex(repoRoot);
const read = (rel: string): string => readFileSync(join(repoRoot, rel), 'utf8');

describe('relevé des commandes citées (outil de fraîcheur)', () => {
  it('relève une commande fantôme avec son numéro de ligne', () => {
    const md = ['Texte.', 'Lance `/ezk-fantome` puis `/ezk-backlog list`.'].join('\n');
    expect(ghostMentions(md, index)).toEqual([
      'L2: `/ezk-fantome` — ni skill, ni commande « /ezk-fantome »',
    ]);
  });

  it('refuse une sous-commande inventée, un agent inconnu et un script pnpm inconnu', () => {
    const md = ['`/ezk-backlog inventer`', '`ezk-spectre`', '`pnpm fantome:run`'].join('\n');
    const ghosts = ghostMentions(md, index);
    expect(ghosts).toHaveLength(3);
    expect(ghosts[0]).toContain('sous-commande inconnue « inventer »');
    expect(ghosts[1]).toContain('ni skill, ni commande, ni agent « ezk-spectre »');
    expect(ghosts[2]).toContain('script pnpm inconnu « fantome:run »');
  });

  it('lit aussi les blocs de code, commentaires de fin de ligne compris', () => {
    const md = ['```bash', 'pnpm fantome:run   # commentaire', '```'].join('\n');
    expect(ghostMentions(md, index)).toEqual(['L2: `pnpm fantome:run   # commentaire` — script pnpm inconnu « fantome:run »']);
  });

  it('accepte les commandes réelles et ignore chemins et prose hors code', () => {
    const md = [
      'En prose, /ezk-fantome ne compte pas.',
      '`/ezk-backlog ready <id>` · `/ezk-backlog next --ready-only` · `/ezk-help ezk-backlog`',
      '`ezk-steward` · `pnpm ezk:map` · `pnpm --dir products/mega-city ezk:help`',
      '`pnpm --dir products/mega-city exec vitest run` · `/tmp/ezk-fantome` · `ezk-chef-extract.sh`',
    ].join('\n');
    expect(ghostMentions(md, index)).toEqual([]);
    expect(findMentions(md).map((m) => m.name)).toContain('ezk-help');
  });
});

describe('FAQ « comment faire » (docs/faq-comment-faire.md)', () => {
  const faq = read('docs/faq-comment-faire.md');

  it('ouvre par « En clair », avant la première question', () => {
    const enClair = faq.indexOf('## En clair');
    expect(enClair).toBeGreaterThan(-1);
    expect(enClair).toBeLessThan(faq.indexOf('### '));
  });

  it('ne cite que des commandes, des agents et des scripts qui existent', () => {
    expect(ghostMentions(faq, index)).toEqual([]);
  });

  it('devient rouge si on y ajoute une commande fantôme (sabotage)', () => {
    const lignes = faq.split('\n').length;
    const sabotee = `${faq}\nEt aussi \`/ezk-fantome\`.\n`;
    expect(ghostMentions(sabotee, index)).toEqual([
      `L${lignes + 1}: \`/ezk-fantome\` — ni skill, ni commande « /ezk-fantome »`,
    ]);
  });

  it('compte au moins 6 entrées, chacune avec « En clair » et un lien vers sa source', () => {
    const entries = faq.split(/^### /m).slice(1);
    expect(entries.length).toBeGreaterThanOrEqual(6);
    for (const entry of entries) {
      const titre = entry.split('\n')[0] ?? '';
      expect(entry, `« ${titre} » sans « En clair »`).toMatch(/\*\*En clair\.\*\*/);
      expect(entry, `« ${titre} » sans lien vers sa source`).toMatch(/\]\([^)]+\)/);
    }
  });

  it('répond aux questions récurrentes du PO (trouver, capitaliser, analyser, clôturer)', () => {
    const cited = new Set(findMentions(faq).map((m) => m.name));
    for (const name of ['ezk-help', 'ezk-chef', 'ezk-retro', 'ezk-steward', 'ezk-archive']) {
      expect(cited, `la FAQ ne cite jamais ${name}`).toContain(name);
    }
  });

  it('est liée depuis le README racine et depuis docs/index.md', () => {
    expect(read('README.md')).toContain('docs/faq-comment-faire.md');
    expect(read('docs/index.md')).toContain('faq-comment-faire.md');
  });
});
