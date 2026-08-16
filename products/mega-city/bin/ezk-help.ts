#!/usr/bin/env node
/**
 * /ezk-help — index de commandes ezk GÉNÉRÉ depuis les frontmatter des SKILL.md.
 * Fiche 20260816131704335. Source de vérité UNIQUE = products/mega-city/skills/<name>/SKILL.md.
 * Rien n'est codé en dur : le compte et la liste dérivent du dossier → ne dérivent jamais.
 *
 *   pnpm --dir products/mega-city ezk:help              → liste tous les skills
 *   pnpm --dir products/mega-city ezk:help ezk-backlog  → détail d'un skill nommé
 *   (option --skills-dir <path> : cibler un autre catalogue — utilisé par les tests)
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export interface SkillInfo {
  name: string;
  argHint: string;
  summary: string;
}

/** Parse minimal du front-matter YAML (scalaires + blocs pliés `>-`/`|`). Suffit ici. */
function parseFrontmatter(md: string): Record<string, string> {
  const lines = md.split('\n');
  if (lines[0]?.trim() !== '---') return {};
  const out: Record<string, string> = {};
  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i] ?? '';
    if (line.trim() === '---') break;
    const m = /^([a-zA-Z_-]+):\s*(.*)$/.exec(line);
    if (!m) continue;
    let val = (m[2] ?? '').trim();
    if (val === '>-' || val === '>' || val === '|' || val === '|-') {
      // Bloc plié : collecte les lignes plus indentées jusqu'à la prochaine clé de tête.
      const buf: string[] = [];
      let j = i + 1;
      for (; j < lines.length; j += 1) {
        const l = lines[j] ?? '';
        if (l.trim() === '---') break;
        if (/^\S/.test(l) && l.trim() !== '') break;
        buf.push(l.trim());
      }
      val = buf.join(' ').trim();
      i = j - 1;
    }
    out[m[1] as string] = val.replace(/^["']|["']$/g, '');
  }
  return out;
}

function firstSentence(s: string): string {
  const t = s.replace(/\s+/g, ' ').trim();
  const m = /^(.+?[.!?])(\s|$)/.exec(t);
  return (m ? (m[1] as string) : t).slice(0, 180);
}

/** Liste les skills du catalogue, triés — dérivée du dossier (jamais d'un compte en dur). */
export function listSkills(skillsDir: string): SkillInfo[] {
  if (!existsSync(skillsDir)) return [];
  const out: SkillInfo[] = [];
  for (const entry of readdirSync(skillsDir).sort()) {
    const skillMd = join(skillsDir, entry, 'SKILL.md');
    if (!existsSync(skillMd) || !statSync(skillMd).isFile()) continue;
    const fm = parseFrontmatter(readFileSync(skillMd, 'utf8'));
    out.push({
      name: fm.name ?? entry,
      argHint: fm['argument-hint'] ?? '',
      summary: fm.description ? firstSentence(fm.description) : '',
    });
  }
  return out;
}

export function skillDetail(
  skillsDir: string,
  name: string,
): { name: string; argHint: string; description: string } | null {
  const skillMd = join(skillsDir, name, 'SKILL.md');
  if (!existsSync(skillMd)) return null;
  const fm = parseFrontmatter(readFileSync(skillMd, 'utf8'));
  return {
    name: fm.name ?? name,
    argHint: fm['argument-hint'] ?? '',
    description: (fm.description ?? '').replace(/\s+/g, ' ').trim(),
  };
}

function defaultSkillsDir(): string {
  return join(dirname(fileURLToPath(import.meta.url)), '..', 'skills');
}

function parseArgs(argv: string[]): { name?: string; skillsDir: string } {
  let skillsDir = defaultSkillsDir();
  let name: string | undefined;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--skills-dir') {
      skillsDir = argv[i + 1] ?? skillsDir;
      i += 1;
    } else if (!argv[i]?.startsWith('--')) {
      name = argv[i];
    }
  }
  return { name, skillsDir };
}

export function renderList(skills: SkillInfo[]): string {
  const w = Math.max(4, ...skills.map((s) => s.name.length));
  const rows = skills
    .map((s) => {
      const head = `  ${s.name.padEnd(w)}  ${s.argHint}`;
      return s.summary ? `${head}\n  ${' '.repeat(w)}  ${s.summary}` : head;
    })
    .join('\n');
  return (
    `Commandes ezk — ${skills.length} skills (généré depuis les frontmatter)\n\n${rows}\n\n` +
    `${skills.length} skills · « /ezk-help <nom> » pour le détail d'une commande.\n`
  );
}

function main(): void {
  const { name, skillsDir } = parseArgs(process.argv.slice(2));
  if (name) {
    const d = skillDetail(skillsDir, name);
    if (!d) {
      const names = listSkills(skillsDir)
        .map((s) => s.name)
        .join(', ');
      process.stderr.write(`Skill inconnu : ${name}\nSkills disponibles : ${names}\n`);
      process.exit(1);
    }
    process.stdout.write(
      `${d.name}\n  usage : ${d.argHint || '(aucun argument-hint)'}\n\n  ${d.description}\n`,
    );
    return;
  }
  process.stdout.write(renderList(listSkills(skillsDir)));
}

// N'exécute la CLI que si le fichier est lancé directement (importable par les tests).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
