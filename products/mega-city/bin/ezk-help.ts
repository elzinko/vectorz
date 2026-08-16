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

/**
 * Parse minimal du front-matter YAML. Recolle TOUTE continuation indentée d'une valeur —
 * scalaire « plain » multi-lignes (valeur sur la 1ʳᵉ ligne + suite indentée) COMME bloc
 * plié `>-`/`|`. (Le bug initial ne collectait que pour `>-`/`|`, tronquant les descriptions
 * en scalaire plain comme celles d'`ezk-commits`/`ezk-sprint`.) Suffit pour ce catalogue.
 */
function parseFrontmatter(md: string): Record<string, string> {
  const lines = md.split('\n');
  if (lines[0]?.trim() !== '---') return {};
  const out: Record<string, string> = {};
  let i = 1;
  while (i < lines.length && lines[i]?.trim() !== '---') {
    const m = /^([A-Za-z_-]+):\s?(.*)$/.exec(lines[i] ?? '');
    if (!m) {
      i += 1;
      continue;
    }
    const inline = (m[2] ?? '').trim();
    const folded = /^[|>][+-]?$/.test(inline);
    const parts: string[] = folded || inline === '' ? [] : [inline];
    i += 1;
    // Continuation : lignes indentées, jusqu'à la prochaine clé de tête ou `---`.
    // Une ligne vide clôt un scalaire plain, mais est tolérée dans un bloc plié.
    while (i < lines.length) {
      const l = lines[i] ?? '';
      if (l.trim() === '---' || /^[A-Za-z_-]+:/.test(l)) break;
      if (l.trim() === '') {
        if (!folded) break;
        i += 1;
        continue;
      }
      if (!/^\s/.test(l)) break;
      parts.push(l.trim());
      i += 1;
    }
    out[m[1] as string] = parts.join(' ').replace(/^["']|["']$/g, '').trim();
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
  // Borne au catalogue : pas de traversée de chemin (`../`, séparateurs).
  if (/[/\\]|\.\./.test(name)) return null;
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
