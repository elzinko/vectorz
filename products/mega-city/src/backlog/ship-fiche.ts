/**
 * ship-fiche — livrer une fiche sans rien casser (fiche 20260830194601233, ADR-0049, ADR-0055).
 *
 * Avant : `ship` = un `git mv` nu. Les liens relatifs de la fiche (et ceux qui la pointent)
 * cassaient — 17 d'un coup sur `main` — sans gate pour le voir. Maintenant : UNE transaction, où
 * le chemin d'écriture possède ses invariants (liens résolus, entrée de PLAN barrée, BACKLOG à
 * jour) et la vigilance humaine n'en fait plus partie.
 *
 * Deux temps :
 *   1. `planShip` — PUR (l'état du dépôt est injecté). Calcule en mémoire tout ce qui changera et
 *      REFUSE (`ShipRefusal`) avant la moindre écriture si un contrôle est rouge.
 *   2. `applyShip` — écrit, déplace (un seul `git mv`), régénère BACKLOG.md. Au moindre échec, il
 *      remet le dépôt dans son état initial (`ShipFailure`).
 *
 * Les liens sont lus COMME `bin/check-links.sh` les lit (liens en ligne, définitions `[x]: cible`,
 * `<cible>`, blocs de code ignorés, schémas / ancres / chemins absolus laissés tels quels) : le
 * ship recale exactement ce que la gate vérifie. Rien n'est committé ni poussé ici.
 */
import { posix } from 'node:path';
import { TERMINAUX } from '../core/fiche-schema.js';
import { frontMatter, readField } from '../loaders/fiches.js';
import { parsePlanSections } from './plan-sections.js';
import { findStalePlanEntries } from './planning-views.js';

// ─── Lecture des liens, calquée sur bin/check-links.sh ───────────────────────────────────────

const FENCE = /^\s*(```|~~~)/;
const REF_DEF = /^(\[[^\]]+\]:\s*)(\S.*)$/;
const INLINE = /\]\(([^)]*)\)/g;
const SCHEME = /^(?:(?:https?|ftps?|mailto|tel|data|file|git|ssh):|[a-zA-Z][a-zA-Z0-9+.-]*:\/\/)/;

/**
 * Applique `fn` à la cible RELATIVE de chaque lien du document (sans fragment, sans `<>`).
 * `fn` rend la nouvelle cible, ou `null` pour ne rien changer. Hors périmètre, comme dans
 * check-links.sh : blocs de code clôturés, ancres pures, schémas, chemins absolus.
 */
function mapLinks(text: string, fn: (target: string, line: number) => string | null): string {
  const rewriteRaw = (raw: string, line: number): string => {
    let t = raw;
    let lead = '';
    let trail = '';
    if (t.startsWith('<')) {
      lead = '<';
      t = t.slice(1);
    }
    if (t.endsWith('>')) {
      trail = '>';
      t = t.slice(0, -1);
    }
    if (t === '' || t.startsWith('#') || SCHEME.test(t)) return raw;
    const hash = t.indexOf('#');
    const path = hash === -1 ? t : t.slice(0, hash);
    const tail = hash === -1 ? '' : t.slice(hash);
    if (path === '' || path.startsWith('/')) return raw;
    const next = fn(path, line);
    return next === null ? raw : `${lead}${next}${tail}${trail}`;
  };

  let fenced = false;
  return text
    .split('\n')
    .map((line, i) => {
      if (FENCE.test(line)) {
        fenced = !fenced;
        return line;
      }
      if (fenced) return line;
      let out = line;
      const ref = REF_DEF.exec(out);
      if (ref) out = ref[1] + rewriteRaw(ref[2], i + 1);
      return out.replace(INLINE, (_m, raw: string) => `](${rewriteRaw(raw, i + 1)})`);
    })
    .join('\n');
}

/** Chemin réduit lexicalement (`.` et `..`), comme check-links.sh — sans slash final. */
function resolveFrom(srcPath: string, target: string): string {
  return posix.normalize(posix.join(posix.dirname(srcPath), target)).replace(/\/$/, '');
}

export interface BrokenLink {
  file: string;
  line: number;
  target: string;
}

/** Les liens relatifs de `files` dont la cible n'existe pas. */
export function findBroken(
  files: Map<string, string>,
  exists: (path: string) => boolean,
): BrokenLink[] {
  const broken: BrokenLink[] = [];
  for (const [file, text] of files) {
    mapLinks(text, (target, line) => {
      if (!exists(resolveFrom(file, target))) broken.push({ file, line, target });
      return null;
    });
  }
  return broken;
}

/**
 * Recale les liens de `text` quand `oldSrc` devient `newSrc` et que les chemins de `moved`
 * (ancien → nouveau) changent. Un lien déjà cassé n'est jamais « réparé » : ce n'est pas le métier
 * du ship, et ça brouillerait la mesure.
 */
export function recalLinks(
  text: string,
  oldSrc: string,
  newSrc: string,
  moved: ReadonlyMap<string, string>,
  existsOld: (path: string) => boolean,
): { text: string; count: number } {
  let count = 0;
  const out = mapLinks(text, (target) => {
    const oldAbs = resolveFrom(oldSrc, target);
    const movedTo = moved.get(oldAbs);
    if (newSrc === oldSrc && movedTo === undefined) return null; // ni la source ni la cible ne bougent
    if (!existsOld(oldAbs)) return null; // déjà cassé avant le ship
    const rel = posix.relative(posix.dirname(newSrc), movedTo ?? oldAbs) || '.';
    const next = target.endsWith('/') ? `${rel}/` : rel;
    if (next === target) return null;
    count += 1;
    return next;
  });
  return { text: out, count };
}

// ─── Front-matter ────────────────────────────────────────────────────────────────────────────

/** Pose (ou remplace) des champs du front-matter, sans toucher au reste du fichier. */
export function setFrontMatter(text: string, fields: Record<string, string>): string {
  const lines = text.split('\n');
  if (lines[0]?.trim() !== '---') throw new Error('front-matter absent');
  let end = lines.findIndex((l, n) => n > 0 && /^---\s*$/.test(l));
  if (end === -1) throw new Error('front-matter non fermé');
  for (const [key, value] of Object.entries(fields)) {
    const row = `${key}: ${value}`;
    const at = lines.findIndex((l, n) => n > 0 && n < end && l.startsWith(`${key}:`));
    if (at === -1) {
      lines.splice(end, 0, row);
      end += 1;
    } else {
      lines[at] = row;
    }
  }
  return lines.join('\n');
}

// ─── PLAN.md : barrer l'entrée d'une fiche livrée ────────────────────────────────────────────

/** Même règle de puce que `parsePlanSections` : `- …`, `* …` ou `N. …`. */
const LIST_ITEM = /^(?:[-*]|\d+\.)\s+/;

/**
 * Barre dans `PLAN.md` les entrées dont TOUTES les fiches sont livrées par ce ship :
 * `- ~~…~~ — shipped #N`, le raccourci de curation déjà en usage. Une ligne qui mêle une fiche
 * livrée et une fiche encore à faire n'est PAS barrée (c'est un jugement) : elle est rendue dans
 * `unbarrable`, et le ship refuse.
 */
export function barPlanEntries(
  planMd: string,
  shipped: ReadonlyMap<string, string>,
): { text: string; barred: string[]; unbarrable: string[] } {
  const strike = new Map<string, string>(); // contenu de la ligne → étiquette
  const barred: string[] = [];
  const unbarrable: string[] = [];
  for (const section of parsePlanSections(planMd)) {
    for (const entry of section.entries) {
      if (entry.struck || !entry.marker) continue; // déjà curée, ou sans action annoncée
      const hit = entry.ids.filter((id) => shipped.has(id));
      if (hit.length === 0) continue;
      if (hit.length < entry.ids.length) {
        unbarrable.push(...hit);
        continue;
      }
      strike.set(entry.text, shipped.get(hit[0]) as string);
      barred.push(...hit);
    }
  }
  const text = planMd
    .split('\n')
    .map((line) => {
      if (/^\s/.test(line)) return line; // sous-item : jamais une entrée
      const trimmed = line.trim();
      const bullet = LIST_ITEM.exec(trimmed);
      if (!bullet) return line;
      const content = trimmed.slice(bullet[0].length);
      const label = strike.get(content);
      return label === undefined ? line : `${bullet[0]}~~${content}~~ — ${label}`;
    })
    .join('\n');
  return { text, barred, unbarrable };
}

// ─── Le plan de la transaction ───────────────────────────────────────────────────────────────

/** L'état du dépôt, injecté : le cœur ne touche jamais au disque. */
export interface RepoFs {
  /** Fichiers markdown du dépôt (suivis ou non ignorés), chemins relatifs POSIX. */
  markdownFiles(): string[];
  read(path: string): string;
  /** Fichier OU dossier. */
  exists(path: string): boolean;
}

export interface ShipInput {
  /** Fiches à livrer, relatives à la racine : `features/<id>_slug.md`. */
  files: string[];
  status: string;
  pr: string;
  /** Barrer l'entrée de `PLAN.md` (par défaut). `false` : le ship refuse si elle reste. */
  barPlan: boolean;
}

export interface ShipPlan {
  moves: Array<{ from: string; to: string }>;
  /** Nouveau contenu, clé = chemin AVANT déplacement. */
  writes: Map<string, string>;
  linksRewritten: number;
  brokenBefore: number;
  brokenAfter: number;
  planBarred: string[];
}

/** Un contrôle est rouge : rien n'a été écrit. */
export class ShipRefusal extends Error {
  constructor(public readonly reasons: string[]) {
    super(reasons.join('\n'));
    this.name = 'ShipRefusal';
  }
}

const FICHE_NAME = /^\d{4,}[-_].+\.md$/;
const PLAN = 'features/PLAN.md';

/** Pour tester le filet : on peut injecter un recaleur défaillant. Jamais utilisé en production. */
export interface ShipSeams {
  recal?: typeof recalLinks;
}

export function planShip(fs: RepoFs, input: ShipInput, seams: ShipSeams = {}): ShipPlan {
  const recal = seams.recal ?? recalLinks;
  const allowed = ['shipped', ...TERMINAUX];
  const reasons: string[] = [];
  if (!allowed.includes(input.status)) {
    reasons.push(`statut « ${input.status} » non admis (attendu : ${allowed.join(', ')})`);
  }
  if (input.pr.trim() === '') reasons.push('--pr est obligatoire (ex. --pr \'#270\')');
  if (input.files.length === 0) reasons.push('aucune fiche donnée');

  const moved = new Map<string, string>();
  const ids = new Map<string, string>(); // id → fiche
  for (const raw of input.files) {
    const file = posix.normalize(raw);
    if (posix.dirname(file) !== 'features' || !FICHE_NAME.test(posix.basename(file))) {
      reasons.push(`${raw} : doit être une fiche directement sous features/ (pas déjà dans done/)`);
      continue;
    }
    if (!fs.exists(file)) {
      reasons.push(`${raw} : introuvable`);
      continue;
    }
    const to = `features/done/${posix.basename(file)}`;
    if (fs.exists(to)) reasons.push(`${raw} : la destination ${to} existe déjà`);
    if ([...moved.values()].includes(to)) reasons.push(`${raw} : fiche donnée deux fois`);
    const id = readField(frontMatter(fs.read(file)), 'id');
    if (id === '') reasons.push(`${raw} : pas d'id dans le front-matter`);
    moved.set(file, to);
    if (id !== '') ids.set(id, file);
  }
  if (reasons.length > 0) throw new ShipRefusal(reasons);

  const pr = input.pr.trim();
  const label = `${input.status}${pr.startsWith('#') ? ` ${pr}` : ''}`;
  const before = new Map(fs.markdownFiles().map((p) => [p, fs.read(p)] as const));
  const after = new Map<string, string>(); // chemin FINAL → contenu final
  const writes = new Map<string, string>();
  const reverse = new Map([...moved].map(([from, to]) => [to, from] as const));
  let linksRewritten = 0;
  let planBarred: string[] = [];
  let mixed = new Set<string>(); // fiches de PLAN.md sur une ligne qui en mêle d'autres

  for (const [src, text] of before) {
    const newSrc = moved.get(src) ?? src;
    const recalled = recal(text, src, newSrc, moved, fs.exists);
    linksRewritten += recalled.count;
    let out = recalled.text;
    if (moved.has(src)) out = setFrontMatter(out, { status: input.status, pr: JSON.stringify(pr) });
    if (src === PLAN && input.barPlan) {
      const bar = barPlanEntries(out, new Map([...ids.keys()].map((id) => [id, label] as const)));
      out = bar.text;
      planBarred = bar.barred;
      mixed = new Set(bar.unbarrable);
    }
    if (out !== text) writes.set(src, out);
    after.set(newSrc, out);
  }

  // Filet 1 : PLAN.md ne doit plus présenter à faire une fiche qu'on livre.
  const planAfter = after.get(PLAN);
  if (planAfter !== undefined) {
    const status = new Map([...ids.keys()].map((id) => [id, input.status] as const));
    for (const stale of findStalePlanEntries(planAfter, status)) {
      const why = mixed.has(stale.id)
        ? 'la ligne mêle une fiche livrée et une fiche à faire : barre-la à la main'
        : input.barPlan
          ? "elle n'a pas pu être barrée"
          : 'barre-la, ou retire --no-bar-plan';
      reasons.push(`${PLAN} : l'entrée de ${stale.id} reste à faire (${stale.where}) — ${why}`);
    }
  }

  // Filet 2 : le ship n'augmente JAMAIS le nombre de liens cassés.
  const movedTargets = new Set(moved.values());
  const existsAfter = (p: string): boolean =>
    movedTargets.has(p) || (!moved.has(p) && fs.exists(p));
  const brokenBefore = findBroken(before, fs.exists);
  const brokenAfter = findBroken(after, existsAfter);
  if (brokenAfter.length > brokenBefore.length) {
    const known = new Set(brokenBefore.map((b) => `${b.file}|${b.target}`));
    const fresh = brokenAfter.filter((b) => !known.has(`${reverse.get(b.file) ?? b.file}|${b.target}`));
    reasons.push(
      `liens cassés en hausse : ${brokenBefore.length} avant, ${brokenAfter.length} après`,
      ...fresh.slice(0, 10).map((b) => `  ${b.file}:${b.line} → ${b.target}`),
    );
  }

  if (reasons.length > 0) throw new ShipRefusal(reasons);
  return {
    moves: [...moved].map(([from, to]) => ({ from, to })),
    writes,
    linksRewritten,
    brokenBefore: brokenBefore.length,
    brokenAfter: brokenAfter.length,
    planBarred,
  };
}

// ─── L'application, avec retour arrière ──────────────────────────────────────────────────────

export interface ShipIo {
  read(path: string): string;
  write(path: string, content: string): void;
  /** Un seul `git mv` groupé vers `destDir` (même dossier pour toutes les sources). */
  gitMove(sources: string[], destDir: string): void;
  regenBacklog(): void;
}

/** L'application a échoué ; le dépôt a été remis dans son état initial (ou le dit s'il n'a pas pu). */
export class ShipFailure extends Error {
  constructor(
    message: string,
    public readonly rolledBack: boolean,
  ) {
    super(message);
    this.name = 'ShipFailure';
  }
}

const BACKLOG = 'features/BACKLOG.md';

export function applyShip(plan: ShipPlan, io: ShipIo): void {
  const originals = new Map<string, string>();
  const remember = (path: string): void => {
    if (originals.has(path)) return;
    try {
      originals.set(path, io.read(path));
    } catch {
      /* fichier absent : rien à restaurer */
    }
  };
  let moved = false;
  try {
    for (const path of plan.writes.keys()) remember(path);
    remember(BACKLOG);
    for (const [path, content] of plan.writes) io.write(path, content);
    io.gitMove(
      plan.moves.map((m) => m.from),
      'features/done',
    );
    moved = true;
    io.regenBacklog();
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    try {
      if (moved) {
        io.gitMove(
          plan.moves.map((m) => m.to),
          'features',
        );
      }
      for (const [path, content] of originals) io.write(path, content);
    } catch (rollbackError) {
      const more = rollbackError instanceof Error ? rollbackError.message : String(rollbackError);
      throw new ShipFailure(
        `${reason} — ET le retour arrière a échoué (${more}) : vérifie \`git status\``,
        false,
      );
    }
    throw new ShipFailure(reason, true);
  }
}
