/**
 * Scanner des liens markdown PAR CHEMIN entre entités du catalogue — le bord I/O du
 * validateur `core/structural-refs` (fiche 357, ADR-0040).
 *
 * Il lit les corps markdown des skills (`SKILL.md` ET leurs fichiers auxiliaires), des
 * agents et des règles, repère chaque lien `[texte](chemin.md)` ou `[étiquette]: chemin.md`,
 * le résout sur le disque, et ne garde que ceux qui visent UNE ENTITÉ du catalogue
 * (un skill, un agent, une règle). Les liens externes, les ancres, les liens vers des docs
 * ou des fiches, et tout ce qui est dans un bloc de code sont ignorés : ce ne sont pas des
 * références structurelles.
 *
 * Il ne juge rien : il RAPPORTE (`PathRef[]`). Dire « ceci est déclaré par id » ou non
 * est le travail du cœur pur, qui compare au graphe compilé.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import type { PathRef } from '../core/structural-refs.js';
import { type EntityFile, catalogEntityFiles } from './catalog.js';

const INLINE_LINK = /\[[^\]]*\]\(\s*<?([^)\s>]+)>?[^)]*\)/g;
const REFERENCE_DEFINITION = /^\s{0,3}\[[^\]]+\]:\s*<?([^\s>]+)>?/;
const FENCE_OPEN = /^\s{0,3}(`{3,}|~{3,})/;
const FENCE_CLOSE = /^\s{0,3}(`{3,}|~{3,})\s*$/;
const INLINE_CODE = /`[^`]*`/g;
const EXTERNAL = /^([a-z][a-z0-9+.-]*:|#|\/)/i;

/** Tous les `.md` sous `dir` (récursif), sans les dotfiles ni dot-dossiers — comme `readSkillAssets`. */
function markdownUnder(dir: string, recursive: boolean): string[] {
  if (!existsSync(dir)) return [];
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (recursive) files.push(...markdownUnder(full, true));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(full);
    }
  }
  return files.sort();
}

/** Les cibles de liens d'un texte markdown, avec leur ligne. Blocs et extraits de code exclus. */
function linkTargets(text: string): { line: number; href: string }[] {
  const found: { line: number; href: string }[] = [];
  let fence: string | undefined;
  text.split('\n').forEach((raw, index) => {
    if (fence !== undefined) {
      // CommonMark : on ne ferme qu'avec le même caractère, au moins aussi long, sans texte derrière.
      const closing = FENCE_CLOSE.exec(raw)?.[1];
      if (closing && closing[0] === fence[0] && closing.length >= fence.length) fence = undefined;
      return;
    }
    const opening = FENCE_OPEN.exec(raw)?.[1];
    if (opening) {
      fence = opening;
      return;
    }
    const line = raw.replace(INLINE_CODE, '');
    for (const match of line.matchAll(INLINE_LINK)) {
      if (match[1]) found.push({ line: index + 1, href: match[1] });
    }
    const definition = REFERENCE_DEFINITION.exec(line)?.[1];
    if (definition) found.push({ line: index + 1, href: definition });
  });
  return found;
}

function decode(path: string): string {
  try {
    return decodeURI(path);
  } catch {
    return path;
  }
}

/**
 * Tous les liens par chemin entre entités du catalogue sous `rootDir` (la racine qui porte
 * `skills/`, `agents/`, `rules/`). Trié par fichier puis par ligne → sortie reproductible.
 */
export function scanPathRefs(rootDir: string): PathRef[] {
  const root = resolve(rootDir);
  const entities = catalogEntityFiles(root);

  // Un fichier auxiliaire d'un skill (references/, templates/…) appartient à ce skill.
  const skillsRoot = join(root, 'skills');
  const ownerOf = (file: string): EntityFile | undefined => {
    const direct = entities.get(file);
    if (direct) return direct;
    const inSkills = relative(skillsRoot, file).split(sep);
    if (inSkills[0] && inSkills[0] !== '..' && inSkills.length > 1) {
      return entities.get(join(skillsRoot, inSkills[0], 'SKILL.md'));
    }
    return undefined;
  };

  const sources = [
    ...markdownUnder(join(root, 'rules'), true),
    ...markdownUnder(join(root, 'agents'), false),
    ...markdownUnder(skillsRoot, true),
  ];

  const refs: PathRef[] = [];
  for (const file of sources) {
    const from = ownerOf(resolve(file));
    if (!from) continue;
    for (const { line, href } of linkTargets(readFileSync(file, 'utf8'))) {
      if (EXTERNAL.test(href)) continue;
      const path = decode(href.split('#')[0] ?? '');
      if (!path) continue;
      const to = entities.get(resolve(dirname(file), path));
      if (!to || (to.kind === from.kind && to.id === from.id)) continue;
      refs.push({
        from: { kind: from.kind, id: from.id },
        to: { kind: to.kind, id: to.id },
        file: relative(root, file).split(sep).join('/'),
        line,
        href,
      });
    }
  }
  return refs.sort((a, b) => (a.file !== b.file ? (a.file < b.file ? -1 : 1) : a.line - b.line));
}
