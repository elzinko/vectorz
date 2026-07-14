import { describe, expect, it } from 'vitest';
import { formatReport } from './cli.js';
import type { ValidationResult } from './types.js';

describe('formatReport — neutralisation des caractères de contrôle (M1)', () => {
  it("n'émet aucun octet ESC (0x1b) même si le journal injecte des séquences ANSI dans un champ", () => {
    const esc = String.fromCharCode(27);
    const hostileResult: ValidationResult = {
      violations: [
        {
          code: 'contract.violation',
          message: `type hostile : ${esc}[2K${esc}[5A désynchronisé`,
          seq: 1,
        },
      ],
      notices: [],
      state: 'running',
      summary: 'résumé',
      code: 1,
    };

    const report = formatReport(hostileResult);

    expect(report.includes(esc)).toBe(false);
    expect(report).toContain('désynchronisé');
  });
});
