/**
 * Le lanceur `bin/ezk.mjs` (champ `bin` du paquet) pour de vrai : vrais processus, depuis un
 * dossier jetable, avec un PATH réduit à l'essentiel — donc sans `tsx` installé sur le poste
 * (fiche 20260903134906920). Tout passe par `--dry-run` : rien n'est régénéré ni écrit.
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const megaCity = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const launcher = join(megaCity, 'bin', 'ezk.mjs');
const repoRoot = realpathSync(resolve(megaCity, '..', '..'));

let elsewhere: string;
beforeAll(() => {
  elsewhere = realpathSync(mkdtempSync(join(tmpdir(), 'ezk-launcher-')));
});
afterAll(() => {
  rmSync(elsewhere, { recursive: true, force: true });
});

function ezk(args: string[], cwd = elsewhere): { code: number | null; out: string; err: string } {
  const r = spawnSync(process.execPath, [launcher, ...args], {
    cwd,
    encoding: 'utf8',
    env: { PATH: '/usr/bin:/bin', HOME: elsewhere },
  });
  return { code: r.status, out: r.stdout, err: r.stderr };
}

describe('bin/ezk.mjs depuis un dossier jetable, sans tsx dans le PATH', () => {
  it('« help » marche de partout et liste les deux familles', { timeout: 60_000 }, () => {
    const r = ezk(['help']);
    expect(r.code).toBe(0);
    expect(r.out.startsWith('En clair.')).toBe(true);
    expect(r.out).toContain('law status');
    expect(r.out).toContain('/ezk-sprint');
  });

  it('« help <domaine> » et « help <skill> » détaillent', { timeout: 60_000 }, () => {
    expect(ezk(['help', 'views']).out).toMatch(/regen[\s\S]*lance : bin\/views-regen\.ts/);
    expect(ezk(['help', 'ezk-sprint']).out).toContain('usage');
    expect(ezk(['help', 'nimporte-quoi']).code).toBe(2);
    expect(ezk(['help', '../..']).code).toBe(2); // pas de sortie du dossier des skills
  });

  it('refuse une commande qui touche aux fichiers du dépôt quand on est ailleurs', { timeout: 60_000 }, () => {
    const r = ezk(['--dry-run', 'views', 'regen']);
    expect(r.code).toBe(2);
    expect(r.err).toContain('dépôt de la méthode');
    expect(r.err).toContain('--root');
    expect(r.out).not.toContain('views-regen');
  });

  it('avec --root vers le dépôt de la méthode, elle passe : un script, celui des vues', { timeout: 60_000 }, () => {
    const r = ezk(['--root', repoRoot, '--dry-run', 'views', 'regen']);
    expect(r.code).toBe(0);
    expect(r.out).toContain('tsx bin/views-regen.ts');
  });

  it('un autre dépôt derrière --root est refusé pour une commande qui écrit dans la méthode', { timeout: 60_000 }, () => {
    const r = ezk(['--root', elsewhere, '--dry-run', 'views', 'regen']);
    expect(r.code).toBe(2);
    expect(r.err).toMatch(/écrit dans le dépôt de la méthode/);
  });

  it('un autre dossier derrière --root ou EZK_ROOT passe pour une commande qui seulement lit les fiches', { timeout: 60_000 }, () => {
    const flag = ezk(['--root', elsewhere, '--dry-run', 'board', 'show']);
    expect(flag.code).toBe(0);
    expect(flag.out).toContain(`projet visé = ${elsewhere}`);
    expect(flag.out).toContain('bin/avancement.ts');
    const viaEnv = spawnSync(process.execPath, [launcher, '--dry-run', 'dashboard'], {
      cwd: elsewhere,
      encoding: 'utf8',
      env: { PATH: '/usr/bin:/bin', HOME: elsewhere, EZK_ROOT: elsewhere },
    });
    expect(viaEnv.status).toBe(0);
    expect(viaEnv.stdout).toContain(`projet visé = ${elsewhere}`);
  });

  it('« law » et le tableau de bord ne dépendent pas du dossier courant ; « map » prévient et vise le même script', { timeout: 60_000 }, () => {
    expect(ezk(['--dry-run', 'law', 'status', 'global']).code).toBe(0);
    const old = ezk(['--dry-run', 'map', '--list']);
    const now = ezk(['--dry-run', 'dashboard', '--list']);
    expect(old.code).toBe(0);
    expect(old.err).toContain('dashboard');
    expect(old.out).toContain('bin/ezk-map.ts --list');
    expect(now.code).toBe(0);
    expect(now.err).toBe('');
    expect(now.out).toContain('bin/ezk-map.ts --list');
  });

  it('lance VRAIMENT un script TypeScript (sans --dry-run) et rend sa sortie', { timeout: 60_000 }, () => {
    const r = ezk(['law', 'status', 'global', '--target', elsewhere]);
    expect(r.code).toBe(0);
    expect(r.out).toContain("Déploiement du profil 'global'");
    expect(r.out).toMatch(/absent\s+ezk-sprint/);
  });

  it('rend le code de sortie du script et dit quelle étape a échoué', { timeout: 60_000 }, () => {
    // lawgiver sans argument affiche son usage, sort en code 2 et n'écrit rien.
    const r = ezk(['law', 'bind']);
    expect(r.code).toBe(2);
    expect(r.err).toContain('Usage: lawgiver bind');
    expect(r.err).toContain("s'est terminé avec le code 2");
  });

  it('une commande « fixed » part de la racine du dépôt : {root} remplacé, quel que soit le dossier de départ', { timeout: 60_000 }, () => {
    const viaRoot = ezk(['--root', repoRoot, '--dry-run', 'backlog', 'regen']);
    expect(viaRoot.out).toContain(`dossier de travail = ${repoRoot}`);
    // la racine seule : le titre de l'index vient de features/README.md, jamais du manifeste
    expect(viaRoot.out).toContain(`bash bin/regen-backlog.sh ${repoRoot}\n`);
    // une commande « none » part du dossier de l'utilisateur, pas de la racine du dépôt
    expect(ezk(['--dry-run', 'law', 'status', 'global']).out).toContain(`dossier de travail = ${elsewhere}`);
  });

  it('lance VRAIMENT un script bash depuis un SOUS-dossier du dépôt (sans --root) et rend son code', { timeout: 60_000 }, () => {
    // check-adr-ids.sh prend la racine en argument : le routeur la lui donne, d'où qu'on parte.
    const sub = ezk(['docs', 'check-adr-ids'], join(repoRoot, 'products', 'mega-city'));
    expect(sub.code).toBe(0);
    expect(sub.err).toContain('check-adr-ids');
    const next = ezk(['--root', repoRoot, 'docs', 'check-adr-ids', '--next']);
    expect(next.code).toBe(0);
    expect(next.out).toMatch(/^\d{3,4}$/m); // le prochain numéro d'ADR libre
  });

  it('une commande inconnue sort en code 2 avec une marche à suivre', { timeout: 60_000 }, () => {
    const r = ezk(['zzz']);
    expect(r.code).toBe(2);
    expect(r.err).toContain('ezk help');
  });
});
