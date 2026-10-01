/**
 * Contrat du skill et de l'agent `ezk-archive` après l'allègement (fiche 20260904091853948).
 *
 * En clair : le skill décide de ce que l'agent lit. Ce test vérifie que le texte dit la même
 * chose que le portier : voie rapide, modèle léger par défaut, fiches travaillées, passation
 * durable, ménage sans suppression, et un vocabulaire de capacité (plus de « rituel »).
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const mega = resolve(here, '../..');
const read = (...p: string[]): string => readFileSync(join(mega, ...p), 'utf8');
const skill = read('skills', 'ezk-archive', 'SKILL.md');
const agent = read('agents', 'ezk-archive.md');
const frontmatter = (md: string): string => md.slice(0, md.indexOf('\n---', 4));

describe('ezk-archive — voie rapide', () => {
  it('le skill lit FASTPATH avant VERDICT et répond en une ligne', () => {
    expect(skill).toContain('FASTPATH: EMPTY');
    expect(skill).toContain('Rien à archiver');
    expect(skill).toMatch(/aucun sous-agent/i);
    expect(skill.indexOf('FASTPATH: EMPTY')).toBeLessThan(skill.indexOf('#### `VERDICT: CLEAN`'));
  });

  it('une clôture complète garde ses raisons de refus', () => {
    for (const reason of ['verdict', 'shipped', 'worked', 'sprint', 'shipped_undeclared', 'worked_undeclared']) {
      expect(skill, reason).toContain(`\`${reason}\``);
    }
  });
});

describe('ezk-archive — modèle adapté au jugement', () => {
  it("l'agent est léger par défaut, sans model_spare", () => {
    const fm = frontmatter(agent);
    expect(fm).toMatch(/^model: sonnet$/m);
    expect(fm).not.toMatch(/^model_spare:/m);
  });

  it("le skill nomme Opus 4.8 pour le seul jugement des branches réelles", () => {
    const section = skill.slice(skill.indexOf('### Modèle (Claude Code)'), skill.indexOf('> **Une seule responsabilité'));
    expect(section).toContain('claude-opus-4-8');
    expect(section).toContain('[P2] branch REAL');
    expect(section).toMatch(/jamais|Ne substitue jamais/i);
  });
});

describe('ezk-archive — justesse', () => {
  it("les fiches travaillées passent par --worked, du skill à l'agent", () => {
    expect(skill).toContain('--worked');
    expect(skill).toContain('`worked=`');
    expect(agent).toContain('worked=');
    expect(agent).toMatch(/jamais de `--shipped`/);
  });

  it('la passation durable est écrite par le script, jamais poussée par le skill', () => {
    for (const text of [skill, agent]) {
      expect(text).toContain('handoff.sh durable');
      expect(text).toContain('durable=0');
      expect(text).toMatch(/pousser/);
    }
  });

  it('le ménage liste, le PO valide, une commande par appel', () => {
    expect(skill).toContain('check.sh --cleanup');
    expect(skill).toMatch(/ne supprime \*\*rien\*\*/);
    expect(agent).toContain('check.sh --cleanup');
  });
});

describe('ezk-archive — cadrage en capacité', () => {
  it('le skill et l’agent ne parlent plus de rituel ni de cérémonie', () => {
    expect(skill).not.toMatch(/rituel|cérémonie/i);
    expect(agent).not.toMatch(/rituel|cérémonie/i);
  });

  it("l'agent n'est plus décrit comme appelé « systématiquement »", () => {
    expect(frontmatter(agent)).not.toMatch(/systématiquement/);
    expect(frontmatter(agent)).toMatch(/ne\s+lui\s+délègue\s+que\s+les\s+points\s+qui\s+demandent\s+du\s+JUGEMENT/);
  });

  it('les ADR portent les addenda', () => {
    expect(read('docs', 'adr', '0022-ezk-methode-trois-bandes-naming.md')).toContain('capacité de continuité d\'exécution');
    expect(read('docs', 'adr', '0021-cloture-portier-deterministe-ranger-rediger-juger.md')).toContain('durable=0');
  });
});
