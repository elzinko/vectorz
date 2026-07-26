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

  it('inclut les jalons à noms ARBITRAIRES (contrat plan : "A — …", "B — …") — revue Codex #52', () => {
    // Le contrat `plan` autorise des jalons nommés librement. Gater sur NOW/NEXT/
    // LATER omettrait silencieusement ces sections → bug corrigé (mc-0089).
    const md = [
      '# PLAN',
      '## A — finir 0005',
      '1. 0005 — build',
      '## B — bugs nav',
      '- 0017 — fix',
      'De la prose sous B mentionne 9999 mais sans puce (ignorée).',
    ].join('\n');
    expect(parsePlanOrder(md)).toEqual(['0005', '0017']);
  });

  it('inclut une section de type ## Hygiène (entrées ship/audit = entrées de plan valides)', () => {
    const md = [
      '# PLAN',
      '## 🧹 Hygiène préalable',
      '- `ship` 0059 — nettoyage AVANT la suite',
      '## ▶️ NOW',
      '1. mc-0094 — dans la séquence',
    ].join('\n');
    // 0059 est une entrée de plan (marqueur ship), pas de la prose → incluse, et AVANT mc-0094.
    expect(parsePlanOrder(md)).toEqual(['0059', 'mc-0094']);
  });

  it('charge le vrai features/PLAN.md : mc-0094 est présent et précède 0062 ; l’hygiène (0059) est en tête', () => {
    const planPath = resolve(
      dirname(fileURLToPath(import.meta.url)),
      '../../../../../features/PLAN.md',
    );
    const planMd = readFileSync(planPath, 'utf8');
    const ids = parsePlanOrder(planMd);
    expect(ids).toContain('mc-0094');
    expect(ids).toContain('0062');
    // La séquence de travail (mc-0094 → 0062) est préservée dans l’ordre du plan.
    expect(ids.indexOf('mc-0094')).toBeLessThan(ids.indexOf('0062'));
    // La section Hygiène (0059, marqueur ship) précède le NOW — plus d’omission silencieuse.
    expect(ids).toContain('0059');
    expect(ids.indexOf('0059')).toBeLessThan(ids.indexOf('mc-0094'));
  });
});
