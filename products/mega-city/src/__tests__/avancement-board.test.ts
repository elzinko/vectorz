import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
/**
 * board.html — le board d'avancement est FIDÈLE PAR CONSTRUCTION (même patron que
 * map-data.test.ts pour la carte interactive, épic « carte fidèle »).
 *
 * Le bloc de données régénéré en mémoire depuis le backlog réel doit être EXACTEMENT
 * le bloc présent dans `diagrams/avancement/board.html`. Backlog modifié sans relancer
 * `pnpm avancement:regen` ⇒ ce test rougit — le board ne peut pas dériver des fichiers
 * en silence (fiche 20260823124042842, lot 0).
 */
import { describe, expect, it } from 'vitest';
import {
  AVANCEMENT_DATA_BEGIN,
  AVANCEMENT_DATA_END,
  buildAvancementData,
  buildAvancementDataBlock,
  upsertAvancementDataBlock,
} from '../core/avancement-data.js';
import { type Fiche, loadFiches } from '../loaders/fiches.js';

const here = dirname(fileURLToPath(import.meta.url));
const megaCity = resolve(here, '../..'); // products/mega-city
const repoRoot = resolve(megaCity, '..', '..'); // racine vectorz
const boardPath = join(repoRoot, 'diagrams', 'avancement', 'board.html');

function extractBlock(text: string): string {
  const beginIdx = text.indexOf(AVANCEMENT_DATA_BEGIN);
  const endIdx = text.indexOf(AVANCEMENT_DATA_END);
  if (beginIdx === -1 || endIdx === -1) {
    throw new Error('bloc ezk-avancement-data absent de board.html — lancer `pnpm avancement:regen`');
  }
  return text.slice(beginIdx, endIdx + AVANCEMENT_DATA_END.length);
}

describe('diagrams/avancement/board.html — données à jour (fidélité par construction)', () => {
  it('le bloc régénéré en mémoire est identique au bloc présent sur disque', () => {
    const expected = buildAvancementDataBlock(loadFiches(repoRoot));
    const actual = extractBlock(readFileSync(boardPath, 'utf8'));
    expect(actual).toBe(expected);
  });

  it('upsertAvancementDataBlock refuse un HTML sans marqueurs (erreur franche, pas d’append)', () => {
    expect(() => upsertAvancementDataBlock('<title>x</title>', 'bloc')).toThrow(/marqueurs/);
  });

  it('le rendu des cartes n’injecte jamais une donnée de fiche via innerHTML (anti-XSS, revue P0)', () => {
    const html = readFileSync(boardPath, 'utf8');
    // Les données de fiche (texte libre du front-matter) doivent être posées via textContent,
    // jamais concaténées dans innerHTML — sinon un titre `<img onerror=…>` s’exécuterait.
    expect(html).toMatch(/\.textContent\s*=/);
    expect(html).not.toMatch(/innerHTML\s*=\s*[^;]*\bf\.(title|status|type|epic|id)\b/);
  });

  it('les labels du front-matter alimentent BoardFiche.labels et filtres.labels (filtre par tag)', () => {
    const mk = (id: string, labels: string[]): Fiche => ({
      id,
      title: 't' + id,
      type: 'feature',
      priority: 'P2',
      status: 'todo',
      ready: false,
      epic: '',
      product: 'mega-city',
      pr: '',
      labels,
      done: false,
      file: `features/${id}.md`,
    });
    const data = buildAvancementData([mk('1', ['bmad', 'x']), mk('2', ['bmad'])]);
    expect(data.actives[0].labels).toContain('bmad');
    expect(data.filtres.labels).toEqual(['bmad', 'x']); // uniq + trié, dédupliqué
  });
});
