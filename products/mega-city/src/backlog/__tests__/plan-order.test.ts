import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parsePlanOrder } from '../plan-order.js';

describe('parsePlanOrder (fiche mc-0089)', () => {
  it('extrait les ids depuis une liste numérotée', () => {
    const md = ['1. **mc-0094** — finir le branchement', '2. **mc-0095** — faire émettre'].join(
      '\n',
    );
    expect(parsePlanOrder(md)).toEqual(['mc-0094', 'mc-0095']);
  });

  it('extrait les ids depuis une liste à puces (-)', () => {
    const md = ['- mc-0090 — garde-fou', '- 0022 — Moniteur'].join('\n');
    expect(parsePlanOrder(md)).toEqual(['mc-0090', '0022']);
  });

  it('extrait les ids depuis une liste à puces (*)', () => {
    const md = ['* mc-0090 — garde-fou', '* 0022 — Moniteur'].join('\n');
    expect(parsePlanOrder(md)).toEqual(['mc-0090', '0022']);
  });

  it("reconnait un id en gras ('**mc-0094**')", () => {
    expect(parsePlanOrder('1. **mc-0094** — finir')).toEqual(['mc-0094']);
  });

  it('sur une ligne multi-ids, garde le premier (limitation POC assumée)', () => {
    const md = '- ⚠️ Distribution — mc-0087 · 0050 · mc-0078 · mc-0096 · mc-0029.';
    expect(parsePlanOrder(md)).toEqual(['mc-0087']);
  });

  it('ignore les titres, citations et prose', () => {
    const md = [
      '# PLAN — séquence de travail',
      '> Décidé le 2026-07-26, voir mc-9999 en citation (ignoré)',
      'De la prose qui mentionne mc-8888 mais qui ne liste rien.',
      '1. **mc-0094** — seul id retenu',
    ].join('\n');
    expect(parsePlanOrder(md)).toEqual(['mc-0094']);
  });

  it('dédoublonne en gardant la 1re occurrence', () => {
    const md = ['1. mc-0094 — première fois', '2. mc-0094 — répété plus loin'].join('\n');
    expect(parsePlanOrder(md)).toEqual(['mc-0094']);
  });

  it('mélange ids mc- et racine dans l’ordre du document', () => {
    const md = ['1. mc-0094 — a', '2. 0062 — b', '3. mc-0082 — c'].join('\n');
    expect(parsePlanOrder(md)).toEqual(['mc-0094', '0062', 'mc-0082']);
  });

  it('renvoie [] sur une entrée vide, sans throw', () => {
    expect(parsePlanOrder('')).toEqual([]);
  });

  it('renvoie [] quand il n’y a aucune liste', () => {
    expect(parsePlanOrder('# Titre\n\nJuste de la prose.\n')).toEqual([]);
  });

  it('ignore les sections hors séquence (## Hygiène, ## Note) mais garde NOW/NEXT/LATER', () => {
    const md = [
      '# PLAN',
      '## 🧹 Hygiène préalable',
      '- 0059 — déjà livré, hors séquence',
      '## ▶️ NOW — voir et gérer ses projets',
      '1. mc-0094 — dans la séquence',
      '## 🚦 Note — lancement autonome',
      '- 0058 — mentionné dans une note, hors séquence',
    ].join('\n');
    expect(parsePlanOrder(md)).toEqual(['mc-0094']);
  });

  it('charge le vrai features/PLAN.md : le 1er id est mc-0094, 0062 apparaît après un mc-', () => {
    const planPath = resolve(
      dirname(fileURLToPath(import.meta.url)),
      '../../../../../features/PLAN.md',
    );
    const planMd = readFileSync(planPath, 'utf8');
    const ids = parsePlanOrder(planMd);
    expect(ids[0]).toBe('mc-0094');
    const idx0062 = ids.indexOf('0062');
    expect(idx0062).toBeGreaterThan(-1);
    expect(ids.indexOf('mc-0094')).toBeLessThan(idx0062);
  });
});
