/**
 * `lawgiver doctor` / `ezk law doctor` (fiche 20260903134909124, absorbe 20260823121712909) :
 * ce que le profil déclare, comparé à ce qui est vraiment installé. Lecture seule. Prouvé sur
 * des faits simulés (cœur pur) puis sur un dossier jetable (commande réelle) — jamais ~/.claude.
 */
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  type DoctorProbe,
  diagnose,
  exitCodeOf,
  renderDiagnosis,
} from '../core/deploy-doctor.js';
import type { PathFact } from '../core/deploy-state.js';
import { GLOBAL_LAW_PATH, LAW_FRONT } from '../domain/law-file.js';
import type { WritePlan } from '../domain/plan.js';

const LAW = `${LAW_FRONT}# I AM THE LAW\n\n## a  \`[MUST]\`\n\nTexte.\n`;
const plan = (withLaw = true): WritePlan => ({
  hooks: [],
  files: [
    { path: 'agents/ezk-a.md', content: '# agent\n' },
    { path: 'skills/ezk-s/SKILL.md', content: '# skill\n' },
    { path: 'skills/ezk-s/scripts/run.sh', content: '#!/bin/sh\n' },
    ...(withLaw ? [{ path: GLOBAL_LAW_PATH, content: LAW }] : []),
  ],
});

const probe = (facts: Record<string, PathFact>, texts: Record<string, string> = {}): DoctorProbe => ({
  fact: (rel) => facts[rel] ?? { kind: 'absent' },
  readText: (rel) => texts[rel],
});

const GOOD: Record<string, PathFact> = {
  'skills/ezk-s': { kind: 'symlink', target: '/cat/skills/ezk-s', alive: true },
  'agents/ezk-a.md': { kind: 'file' },
  [GLOBAL_LAW_PATH]: { kind: 'file' },
};
const GOOD_TEXT = { 'agents/ezk-a.md': '# agent\n', [GLOBAL_LAW_PATH]: LAW };

describe('diagnose — le profil contre le poste', () => {
  it('rien à signaler quand tout est en place (skill en lien, agent en copie à jour, loi à jour)', () => {
    const d = diagnose(plan(), probe(GOOD, GOOD_TEXT));
    expect(d.problems).toEqual([]);
    expect(d.checked).toBe(2);
    expect(d.hasLaw).toBe(true);
    expect(exitCodeOf(d)).toBe(0);
  });

  it('signale un élément manquant (le cas /ezk-pr introuvable)', () => {
    const d = diagnose(plan(), probe({ ...GOOD, 'skills/ezk-s': { kind: 'absent' } }, GOOD_TEXT));
    expect(d.problems).toEqual([{ kind: 'manquant', path: 'skills/ezk-s' }]);
    expect(exitCodeOf(d)).toBe(1);
  });

  it('signale un lien mort, avec sa cible', () => {
    const dead: PathFact = { kind: 'symlink', target: '/disparu', alive: false };
    const d = diagnose(plan(), probe({ ...GOOD, 'skills/ezk-s': dead }, GOOD_TEXT));
    expect(d.problems).toEqual([{ kind: 'lien-mort', path: 'skills/ezk-s', detail: '/disparu' }]);
  });

  it('signale une copie périmée : contenu différent, ou fichier manquant dans le dossier copié', () => {
    const texts = { ...GOOD_TEXT, 'skills/ezk-s/SKILL.md': '# skill\n' }; // run.sh manque
    const copy = { ...GOOD, 'skills/ezk-s': { kind: 'dir' } as PathFact };
    const d = diagnose(plan(), probe(copy, texts));
    expect(d.problems).toEqual([
      { kind: 'copie-perimee', path: 'skills/ezk-s', detail: 'skills/ezk-s/scripts/run.sh' },
    ]);
    const stale = diagnose(plan(), probe(GOOD, { ...GOOD_TEXT, 'agents/ezk-a.md': '# ancien\n' }));
    expect(stale.problems).toEqual([
      { kind: 'copie-perimee', path: 'agents/ezk-a.md', detail: 'agents/ezk-a.md' },
    ]);
  });

  it('accepte un skill copié à l’identique du plan', () => {
    const texts = {
      ...GOOD_TEXT,
      'skills/ezk-s/SKILL.md': '# skill\n',
      'skills/ezk-s/scripts/run.sh': '#!/bin/sh\n',
    };
    const copy = { ...GOOD, 'skills/ezk-s': { kind: 'dir' } as PathFact };
    expect(diagnose(plan(), probe(copy, texts)).problems).toEqual([]);
  });

  describe('la loi', () => {
    it('absente : bloquant', () => {
      const facts = { ...GOOD, [GLOBAL_LAW_PATH]: { kind: 'absent' } as PathFact };
      expect(diagnose(plan(), probe(facts, GOOD_TEXT)).problems).toEqual([
        { kind: 'loi-absente', path: GLOBAL_LAW_PATH },
      ]);
    });

    it('périmée : le fichier est à lawgiver mais son contenu n’est plus celui du plan', () => {
      const texts = { ...GOOD_TEXT, [GLOBAL_LAW_PATH]: `${LAW_FRONT}ancienne loi\n` };
      expect(diagnose(plan(), probe(GOOD, texts)).problems).toEqual([
        { kind: 'loi-perimee', path: GLOBAL_LAW_PATH },
      ]);
    });

    it('non gérée : un fichier de l’utilisateur occupe la place (bind-global refusera de l’écraser)', () => {
      const texts = { ...GOOD_TEXT, [GLOBAL_LAW_PATH]: '# Mes règles perso\n' };
      expect(diagnose(plan(), probe(GOOD, texts)).problems).toEqual([
        { kind: 'loi-non-geree', path: GLOBAL_LAW_PATH },
      ]);
      const link = { ...GOOD, [GLOBAL_LAW_PATH]: { kind: 'symlink', target: '/x', alive: true } as PathFact };
      expect(diagnose(plan(), probe(link, GOOD_TEXT)).problems[0]?.kind).toBe('loi-non-geree');
    });

    it('un profil sans règle n’a pas de loi à vérifier', () => {
      const d = diagnose(plan(false), probe({ ...GOOD, [GLOBAL_LAW_PATH]: { kind: 'absent' } }, GOOD_TEXT));
      expect(d.hasLaw).toBe(false);
      expect(d.problems).toEqual([]);
    });
  });
});

describe('renderDiagnosis', () => {
  it('liste chaque divergence en clair, compte, et dit comment réparer', () => {
    const d = diagnose(
      plan(),
      probe({ ...GOOD, 'skills/ezk-s': { kind: 'absent' }, [GLOBAL_LAW_PATH]: { kind: 'absent' } }, GOOD_TEXT),
    );
    const text = renderDiagnosis('global', '/poste/.claude', d);
    expect(text).toContain("profil 'global' dans /poste/.claude");
    expect(text).toMatch(/✖ manquant\s+skills\/ezk-s/);
    expect(text).toMatch(/✖ loi absente\s+rules\/iamthelaw\.md/);
    expect(text).toContain('2 divergences');
    expect(text).toContain('lawgiver bind-global global --link');
  });

  it('dit « tout est en place » quand il n’y a rien à signaler', () => {
    const text = renderDiagnosis('global', '/poste/.claude', diagnose(plan(), probe(GOOD, GOOD_TEXT)));
    expect(text).toContain('✔ Tout est en place');
    expect(text).toContain('2 éléments');
    expect(text).not.toContain('✖');
  });
});

describe('lawgiver doctor — la commande, sur une cible jetable', () => {
  const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
  const tsx = createRequire(import.meta.url).resolve('tsx/cli');
  let target: string;
  let fakeHome: string;
  beforeEach(() => {
    target = realpathSync(mkdtempSync(join(tmpdir(), 'law-doctor-')));
    fakeHome = realpathSync(mkdtempSync(join(tmpdir(), 'law-home-')));
  });
  afterEach(() => {
    rmSync(target, { recursive: true, force: true });
    rmSync(fakeHome, { recursive: true, force: true });
  });

  // HOME factice : si une commande oubliait --target, elle écrirait ici, jamais dans le vrai ~/.claude.
  const lawgiver = (...args: string[]) =>
    spawnSync(process.execPath, [tsx, join(megaCity, 'bin', 'lawgiver.ts'), ...args], {
      encoding: 'utf8',
      env: { ...process.env, HOME: fakeHome },
    });

  it('sur un dossier vide : tout manque, la loi aussi, code 1 — et rien n’est écrit', { timeout: 120_000 }, () => {
    const r = lawgiver('doctor', 'global', '--target', target);
    expect(r.status).toBe(1);
    expect(r.stdout).toMatch(/✖ manquant\s+skills\/ezk-sprint/);
    expect(r.stdout).toMatch(/✖ loi absente\s+rules\/iamthelaw\.md/);
    expect(existsSync(join(target, 'skills'))).toBe(false);
    expect(existsSync(join(fakeHome, '.claude'))).toBe(false);
  });

  it('après bind-global --link sur la cible : tout est en place (code 0), loi compilée comprise', { timeout: 120_000 }, () => {
    const bound = lawgiver('bind-global', 'global', '--link', '--target', target);
    expect(bound.status).toBe(0);
    expect(lstatSync(join(target, 'skills', 'ezk-sprint')).isSymbolicLink()).toBe(true);
    expect(readFileSync(join(target, GLOBAL_LAW_PATH), 'utf8')).toContain('# I AM THE LAW');
    const ok = lawgiver('doctor', 'global', '--target', target);
    expect(ok.stdout).toContain('✔ Tout est en place');
    expect(ok.status).toBe(0);
    expect(existsSync(join(fakeHome, '.claude'))).toBe(false);

    // un lien retiré → signalé ; une loi retouchée → périmée
    rmSync(join(target, 'skills', 'ezk-pr'), { force: true });
    writeFileSync(join(target, GLOBAL_LAW_PATH), `${LAW_FRONT}loi d'avant\n`);
    const broken = lawgiver('doctor', 'global', '--target', target);
    expect(broken.status).toBe(1);
    expect(broken.stdout).toMatch(/✖ manquant\s+skills\/ezk-pr/);
    expect(broken.stdout).toMatch(/✖ loi périmée\s+rules\/iamthelaw\.md/);

    // rejouer bind-global répare les deux
    expect(lawgiver('bind-global', 'global', '--link', '--target', target).status).toBe(0);
    expect(lawgiver('doctor', 'global', '--target', target).status).toBe(0);
  });

  it('reconnaît aussi le mode COPIE, et voit une copie retouchée', { timeout: 120_000 }, () => {
    expect(lawgiver('bind-global', 'global', '--target', target).status).toBe(0);
    expect(lstatSync(join(target, 'skills', 'ezk-sprint')).isSymbolicLink()).toBe(false);
    const ok = lawgiver('doctor', 'global', '--target', target);
    expect(ok.status).toBe(0);
    mkdirSync(join(target, 'skills', 'ezk-sprint'), { recursive: true });
    writeFileSync(join(target, 'skills', 'ezk-sprint', 'SKILL.md'), '# retouché à la main\n');
    const stale = lawgiver('doctor', 'global', '--target', target);
    expect(stale.status).toBe(1);
    expect(stale.stdout).toMatch(/✖ copie périmée\s+skills\/ezk-sprint/);
  });

  it('refuse un profil inconnu avec un message clair', { timeout: 120_000 }, () => {
    const r = lawgiver('doctor', 'profil-qui-nexiste-pas', '--target', target);
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/Profil inconnu/);
  });
});
