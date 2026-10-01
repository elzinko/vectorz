/**
 * Coquille I/O UNIQUE (ADR-0003) — le SEUL module qui touche le disque et git.
 *
 * Consomme un WritePlan (calculé purement par `bind`) et le matérialise :
 *   - crée les dossiers parents, écrit les fichiers (avec leur `mode` éventuel) ;
 *   - initialise un dépôt git si nécessaire (pour pouvoir poser les hooks) ;
 *   - pose les git hooks dans `.git/hooks/<stage>`, exécutables (chmod +x).
 *
 * Aucune logique métier ici : tout le « quoi écrire » vient du plan.
 */
import {
  mkdirSync,
  writeFileSync,
  readFileSync,
  copyFileSync,
  chmodSync,
  existsSync,
  readdirSync,
  statSync,
  lstatSync,
  symlinkSync,
  rmSync,
} from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { execFileSync } from 'node:child_process';
import { GLOBAL_LAW_PATH, isManagedLaw } from '../domain/law-file.js';
import { MANAGED_MARKER, isManagedFile } from '../domain/managed-file.js';
import type { FileWrite, HookWrite, WritePlan } from '../domain/plan.js';

const EXECUTABLE = 0o755;

/** Marqueurs du bloc managé (fiche 0010) — stables, réutilisables par tous les caps. */
const BLOCK_START = '<!-- iamthelaw:start -->';
const BLOCK_END = '<!-- iamthelaw:end -->';

/** Options d'application. `force` autorise la réécriture franche d'un existant qui diffère. */
export interface ApplyOptions {
  force?: boolean;
}

/**
 * Défense en profondeur (F1) : tout chemin du plan doit résoudre SOUS `projectDir`.
 * La frontière du loader rejette déjà les ids dangereux ; ici on refuse en dernier
 * recours toute écriture qui s'échapperait du projet hôte.
 */
function resolveInsideProject(projectDir: string, path: string): string {
  const root = resolve(projectDir);
  const absolute = resolve(root, path);
  if (absolute !== root && !absolute.startsWith(root + sep)) {
    throw new Error(`écriture hors du projet refusée : ${JSON.stringify(path)}`);
  }
  return absolute;
}

function writeRaw(absolute: string, content: string, mode?: number): void {
  mkdirSync(dirname(absolute), { recursive: true });
  writeFileSync(absolute, content);
  if (mode !== undefined) chmodSync(absolute, mode);
}

/**
 * Fusionne un bloc managé dans un contenu existant (fiche 0010). Idempotent :
 *   - pas de marqueurs → AJOUTE le bloc en préservant 100% du contenu existant ;
 *   - marqueurs présents → REMPLACE uniquement le bloc (le reste intact).
 */
function mergeManagedBlock(existing: string, blockBody: string): string {
  const block = `${BLOCK_START}\n${blockBody.trim()}\n${BLOCK_END}\n`;
  const startAt = existing.indexOf(BLOCK_START);
  const endAt = existing.indexOf(BLOCK_END);
  if (startAt !== -1 && endAt !== -1 && endAt > startAt) {
    const before = existing.slice(0, startAt);
    const after = existing.slice(endAt + BLOCK_END.length).replace(/^\n/, '');
    return `${before}${block}${after}`;
  }
  const base = existing.length === 0 || existing.endsWith('\n') ? existing : `${existing}\n`;
  const separator = base.length === 0 ? '' : '\n';
  return `${base}${separator}${block}`;
}

/** Applique un FileWrite selon son intention de fusion. */
function applyFile(projectDir: string, file: FileWrite): void {
  const absolute = resolveInsideProject(projectDir, file.path);
  if (file.intent === 'managed-block') {
    const existing = existsSync(absolute) ? readFileSync(absolute, 'utf8') : '';
    writeRaw(absolute, mergeManagedBlock(existing, file.content), file.mode);
    return;
  }
  writeRaw(absolute, file.content, file.mode);
}

function ensureGitRepo(projectDir: string): void {
  if (existsSync(join(projectDir, '.git'))) return;
  execFileSync('git', ['init', '--quiet'], { cwd: projectDir });
}

/**
 * Pose un hook selon son intention (fiche 0010). `skip-if-exists` : un hook
 * perso préexistant qui DIFFÈRE n'est jamais écrasé sans `force` (sinon backup `.bak`
 * puis refus explicite). Identique → idempotent, pas d'erreur.
 */
function poseHook(projectDir: string, hook: HookWrite, force: boolean): void {
  const hookPath = resolveInsideProject(projectDir, join('.git', 'hooks', hook.stage));
  if (hook.intent === 'skip-if-exists' && existsSync(hookPath)) {
    const current = readFileSync(hookPath, 'utf8');
    if (current === hook.script) return; // déjà à jour : idempotent.
    if (!force) {
      throw new Error(
        `refus non-destructif : le hook ${JSON.stringify(hook.stage)} existe et diffère. ` +
          'Relance avec --force pour l’écraser (un backup .bak sera créé).',
      );
    }
    copyFileSync(hookPath, `${hookPath}.bak`);
  }
  writeRaw(hookPath, hook.script, EXECUTABLE);
}

/** Applique le plan sur `projectDir`. Idempotent (réécrit le même contenu). */
export function applyPlan(plan: WritePlan, projectDir: string, options: ApplyOptions = {}): void {
  const force = options.force === true;
  for (const file of plan.files) {
    applyFile(projectDir, file);
  }
  if (plan.hooks.length > 0) {
    ensureGitRepo(projectDir);
    for (const hook of plan.hooks) {
      poseHook(projectDir, hook, force);
    }
  }
}

/**
 * Les anciens fichiers PLATS `.claude/skills/<id>.md` (la forme d'avant la fiche 20260813095351680) qui
 * traînent à côté du dossier `.claude/skills/<id>/` que le plan écrit. On ne les supprime JAMAIS (rien ne
 * prouve qu'ils sont à nous) : on les SIGNALE, pour qu'un projet déjà bindé ne garde pas en silence une
 * copie périmée d'un skill. Lecture seule ; chemins relatifs au projet.
 */
export function staleFlatSkillFiles(plan: WritePlan, projectDir: string): string[] {
  const stale: string[] = [];
  for (const file of plan.files) {
    if (file.skillDir === undefined || file.path !== `${file.skillDir}/SKILL.md`) continue;
    const flat = `${file.skillDir}.md`;
    if (existsSync(resolveInsideProject(projectDir, flat))) stale.push(flat);
  }
  return stale;
}

/** Le nom de fichier canonique d'une skill matérialisée par le cap global. */
/**
 * Discrimine les deux formes du plan global : arbre des skills (`skills/<id>/...`, un dossier
 * multi-fichiers depuis ADR-0027) vs agent-fichier (`agents/<id>.md`).
 */
function isUnderSkills(path: string): boolean {
  return path.startsWith('skills/');
}

function isAgentFile(path: string): boolean {
  return path.startsWith('agents/') && path.endsWith('.md');
}

/** Le fichier de loi du cap global (ADR-0056) : `rules/iamthelaw.md`. */
function isLawFile(path: string): boolean {
  return path === GLOBAL_LAW_PATH;
}

const SKILL_DOC = 'SKILL.md';

/** Un chemin de plan qui EST le doc d'un skill (`.../SKILL.md`) — marque son dossier. */
function isSkillDoc(path: string): boolean {
  return path === SKILL_DOC || path.endsWith(`/${SKILL_DOC}`);
}

/**
 * Groupe les FileWrite de skills par dossier `skills/<id>`, où `<id>` PEUT contenir des `/`
 * (assertSafeId l'autorise).
 *
 * Le plan PORTE le dossier (`FileWrite.skillDir`, posé par `skillFolderFiles`) : on le lit, on ne le
 * devine pas. L'ancienne déduction par les `SKILL.md` se trompait dans deux cas (retours Codex PR #138,
 * fiche 20260813095351680) : un fichier annexe nommé `SKILL.md` (`templates/x/SKILL.md`) passait pour la
 * racine d'un skill fantôme et disparaissait au remplacement du vrai parent ; deux skills imbriqués
 * s'effaçaient l'un l'autre. Elle ne sert plus que de REPLI pour un plan écrit à la main, sans `skillDir` :
 * le dossier est alors le `dirname` du `SKILL.md`, jamais une troncature à 2 segments (id slashé), et
 * chaque autre fichier va au dossier de skill le PLUS LONG qui le préfixe.
 */
function groupBySkillDir(files: FileWrite[]): Map<string, FileWrite[]> {
  const carried = files.filter((file) => file.skillDir !== undefined);
  if (files.length > 0 && carried.length === files.length) {
    const groups = new Map<string, FileWrite[]>();
    for (const file of carried) {
      const dir = file.skillDir as string;
      groups.set(dir, [...(groups.get(dir) ?? []), file]);
    }
    return groups;
  }
  const dirs = files
    .filter((file) => isSkillDoc(file.path))
    .map((file) => dirname(file.path))
    .sort((a, b) => b.length - a.length); // plus long d'abord → longest-prefix match
  const groups = new Map<string, FileWrite[]>(dirs.map((dir) => [dir, [] as FileWrite[]]));
  for (const file of files) {
    const owner = dirs.find(
      (dir) => file.path === `${dir}/${SKILL_DOC}` || file.path.startsWith(`${dir}/`),
    );
    if (owner) groups.get(owner)?.push(file);
  }
  return groups;
}

/**
 * Noms de premier niveau GÉRÉS d'un dossier de skill = premier segment (sous `dirRel`) de
 * chaque fichier du plan pour ce dossier : `SKILL.md`, `approaches`, `scripts`… Sert à la
 * garde non-destructive (tout AUTRE nom présent sur disque = étranger, donc refusé).
 * Un skill IMBRIQUÉ dans celui-ci (`skills/foo/bar` sous `skills/foo`) est géré lui aussi : son
 * premier segment (`bar`) compte, sinon le 2ᵉ passage prendrait l'enfant pour un fichier étranger.
 */
function managedTopNames(dirRel: string, files: FileWrite[], otherDirs: string[] = []): Set<string> {
  const prefix = `${dirRel}/`;
  const names = new Set<string>();
  for (const file of files) names.add(file.path.slice(prefix.length).split('/')[0]);
  for (const other of otherDirs) {
    if (other.startsWith(prefix)) names.add(other.slice(prefix.length).split('/')[0]);
  }
  return names;
}

/** Les dossiers de skill qui en contiennent un autre (`skills/foo/bar` dans `skills/foo`). */
function nestedSkillDirs(dirs: string[]): string[] {
  return dirs.filter((dir) => dirs.some((other) => other !== dir && dir.startsWith(`${other}/`)));
}

/**
 * Garde NON-DESTRUCTIVE pour le cap global (invariant ADR-0006/0010, cf. deploy.sh ;
 * assets ADR-0027) : dans `~/.claude/skills`, lawgiver ne gère QUE des dossiers de skill
 * dont les entrées de premier niveau sont celles du plan (`SKILL.md` + `approaches`,
 * `scripts`… = `managed`). Si le dossier cible préexiste mais contient AUTRE chose (un
 * vrai artefact utilisateur), on REFUSE de l'écraser — jamais de `rm -rf` aveugle. Un
 * dossier neuf, ou un dossier ne contenant QUE du géré, est accepté → écriture idempotente.
 */
function assertManagedSkillDir(root: string, dirRel: string, managed: Set<string>): void {
  const skillDir = resolveInsideProject(root, dirRel);
  if (!existsSync(skillDir)) return;
  if (!statSync(skillDir).isDirectory()) {
    throw new Error(`refus non-destructif : ${JSON.stringify(skillDir)} n'est pas un dossier.`);
  }
  const foreign = readdirSync(skillDir).filter((name) => !managed.has(name));
  if (foreign.length > 0) {
    throw new Error(
      `refus non-destructif : ${JSON.stringify(skillDir)} contient des fichiers ` +
        `non gérés (${foreign.join(', ')}). Retire-les à la main ou choisis un autre id.`,
    );
  }
}

/**
 * Mode de matérialisation du cap global (fiche 0018) :
 *   - `copy` (défaut, comportement 0017) : écrit le contenu figé du plan ;
 *   - `link` : symlink le skill-dir cible vers sa source dans le catalogue (`catalogRoot`),
 *     un `git pull` dans mega-city met alors à jour partout (live-update).
 */
export interface GlobalApplyOptions {
  mode?: 'copy' | 'link';
  /** Racine du repo mega-city (source des skills) — REQUISE en mode `link`. */
  catalogRoot?: string;
  /** Registre des renommages exécutés (renames.yml) : les ANCIENS noms à retirer, gardés. */
  renames?: RenameEntry[];
}

/** Un renommage EXÉCUTÉ du catalogue (registre renames.yml) — l'ancien nom est à retirer. */
export interface RenameEntry {
  ancien: string;
  nouveau: string;
  kind: 'skill' | 'agent';
}

/** Bilan du retrait gardé des anciens noms — rendu par applyGlobalPlan. */
export interface GlobalApplyReport {
  /** Anciennes entrées effectivement retirées (chemins relatifs à la racine). */
  retires: string[];
  /** Résidus REFUSÉS (entrée étrangère → laissée en place, retrait manuel). */
  residus: string[];
}

/**
 * Vérifie qu'un dossier de skill cible est REMPLAÇABLE de façon non-destructive (mirror de
 * `link_or_copy`/deploy.sh) : soit inexistant, soit notre propre symlink, soit un skill-dir
 * déjà géré (n'ayant au premier niveau que du `managed`). Sinon (vrai dossier utilisateur
 * étranger) : refus. `assertManagedSkillDir` couvre déjà le cas skill-dir géré ; ici on
 * n'ajoute que la tolérance du symlink (notre propre entrée en mode link).
 */
function assertReplaceableSkillDir(root: string, dirRel: string, managed: Set<string>): void {
  const target = resolveInsideProject(root, dirRel);
  if (existsSync(target) && lstatSync(target).isSymbolicLink()) return; // notre propre lien.
  assertManagedSkillDir(root, dirRel, managed);
}

/**
 * Pendant agent de `assertReplaceableSkillDir` : un agent est un FICHIER
 * `agents/<id>.md` (pas un dossier). Remplaçable de façon non-destructive s'il
 * est inexistant, n'est qu'un symlink (le nôtre, ou l'ancien de claude-skills
 * qu'on bascule), OU est une copie que lawgiver a écrite : l'en-tête porte son marqueur
 * (`domain/managed-file.ts`, comme la loi). Sans lui, le 2ᵉ `bind-global` en copie prenait sa propre
 * copie pour un fichier de l'utilisateur et plantait (fiche 20260813095351680).
 * Un vrai fichier utilisateur préexistant → refus (jamais écrasé), avec la marche à suivre pour une
 * ancienne copie faite avant le marqueur : la supprimer une fois, elle sera recréée marquée.
 */
function assertReplaceableAgent(root: string, agentFilePath: string): void {
  const target = resolveInsideProject(root, agentFilePath);
  if (isSymlink(target)) return; // symlink (le nôtre / l'ancien) : basculable.
  if (!existsSync(target)) return; // inexistant : rien à protéger.
  if (statSync(target).isFile() && isManagedFile(readFileSync(target, 'utf8'))) return; // notre copie.
  throw new Error(
    `refus non-destructif : ${JSON.stringify(target)} est un vrai fichier agent que lawgiver n'a pas écrit ` +
      `(l'en-tête « ${MANAGED_MARKER} » manque). Si c'est une ancienne copie de lawgiver, supprime-la ` +
      `(rm ${JSON.stringify(target)}) puis relance : elle sera recréée avec le marqueur. ` +
      'Sinon, garde ton fichier et choisis un autre id.',
  );
}

/**
 * Garde du fichier de LOI (ADR-0056) : lawgiver ne remplace que SON fichier, reconnu à
 * l'en-tête `generated-by`. Un fichier du même nom écrit par l'utilisateur, ou un lien (l'écriture
 * partirait dans le fichier visé), est refusé — jamais écrasé. Absent : rien à protéger.
 */
function assertReplaceableLaw(root: string, lawPath: string): void {
  const target = resolveInsideProject(root, lawPath);
  if (isSymlink(target)) {
    throw new Error(
      `refus non-destructif : ${JSON.stringify(target)} est un lien ; lawgiver n'écrit pas à travers un lien. ` +
        'Retire-le à la main.',
    );
  }
  if (!existsSync(target)) return;
  if (!statSync(target).isFile() || !isManagedLaw(readFileSync(target, 'utf8'))) {
    throw new Error(
      `refus non-destructif : ${JSON.stringify(target)} existe et n'est pas géré par lawgiver ` +
        "(l'en-tête « generated-by: lawgiver bind-global » manque). Renomme-le ou retire-le à la main.",
    );
  }
}

/**
 * Retrait GARDÉ d'un ANCIEN nom après renommage (fiche 20260813131737962, volet binder,
 * livré 2026-08-23 ; DURCI le 2026-08-24 après revue adverse). Le re-bind n'itère que le
 * nouveau plan ; ce retrait nettoie l'ancien — mais SEULEMENT ce qu'on peut PROUVER à nous :
 *   - **symlink** → notre entrée en mode `link` (le cas réel de l'utilisateur, `--link`) :
 *     retirée. Sûr : un symlink au nom de l'ancien skill EST notre matérialisation.
 *   - **entrée RÉELLE** (dossier ou fichier) → JAMAIS de `rm -rf`, on SIGNALE (residu).
 *
 * Pourquoi le durcissement : l'ancien skill a QUITTÉ le catalogue, donc après coup on ne
 * peut plus prouver qu'un dossier réel à l'ancien nom est le nôtre. L'ancienne preuve
 * (« entrées ⊆ celles du NOUVEAU skill ») supprimait par erreur un dossier utilisateur
 * homonyme ne contenant qu'un `SKILL.md` — le nom qu'on vient justement de LIBÉRER
 * (revue adverse code, finding 1). Data-loss dans le vrai `~/.claude` : proscrit.
 * Conséquence assumée : en mode `copy`, l'ancien dossier réel n'est pas auto-nettoyé —
 * il est signalé pour retrait manuel. (Piste future : un marqueur `.ezk-managed` écrit à
 * la matérialisation copy prouverait l'appartenance sans risque — hors périmètre ici.)
 * Jamais de purge hors-registre : un skill omis d'un profil (ex. `daily`) n'est PAS un
 * résidu de renommage. Un refus n'est jamais bloquant : signalé dans le bilan.
 */
function retireRenamedEntry(root: string, entry: RenameEntry): 'retire' | 'residu' | 'absent' {
  const rel = entry.kind === 'skill' ? `skills/${entry.ancien}` : `agents/${entry.ancien}.md`;
  const target = resolveInsideProject(root, rel);
  if (isSymlink(target)) {
    rmSync(target, { force: true });
    return 'retire';
  }
  if (!existsSync(target)) return 'absent';
  // Entrée RÉELLE : appartenance non prouvable → jamais de rm, signalée pour retrait manuel.
  return 'residu';
}

/** Applique le retrait gardé sur tout le registre et rend le bilan. */
function retireRenamedEntries(root: string, renames: RenameEntry[]): GlobalApplyReport {
  const report: GlobalApplyReport = { retires: [], residus: [] };
  for (const entry of renames) {
    const rel = entry.kind === 'skill' ? `skills/${entry.ancien}` : `agents/${entry.ancien}.md`;
    const verdict = retireRenamedEntry(root, entry);
    if (verdict === 'retire') report.retires.push(rel);
    if (verdict === 'residu') report.residus.push(rel);
  }
  return report;
}

/** Retire notre propre entrée (symlink ou skill-dir géré) pour la re-matérialiser. */
function removeManagedEntry(target: string): void {
  if (!existsSync(target) && !isSymlink(target)) return;
  rmSync(target, { recursive: true, force: true });
}

function isSymlink(path: string): boolean {
  try {
    return lstatSync(path).isSymbolicLink();
  } catch {
    return false;
  }
}

/**
 * Matérialise un skill par symlink `<root>/skills/<id>` → `<catalogRoot>/skills/<id>`.
 * Le lien porte le dossier ENTIER : ses assets (`approaches/`, `scripts/`…) viennent
 * gratuitement à travers le lien (live-update), sans FileWrite par asset (ADR-0027).
 */
function linkSkillDir(root: string, catalogRoot: string, dirRel: string): void {
  const target = resolveInsideProject(root, dirRel);
  const source = resolve(catalogRoot, dirRel);
  removeManagedEntry(target);
  mkdirSync(dirname(target), { recursive: true });
  symlinkSync(source, target);
}

/** Matérialise un agent par symlink `<root>/agents/<id>.md` → `<catalogRoot>/agents/<id>.md`. */
function linkAgent(root: string, catalogRoot: string, agentFilePath: string): void {
  const target = resolveInsideProject(root, agentFilePath); // 'agents/<id>.md'
  const source = resolve(catalogRoot, agentFilePath);
  removeManagedEntry(target);
  mkdirSync(dirname(target), { recursive: true });
  symlinkSync(source, target);
}

/**
 * Coquille I/O GLOBALE (fiche 0017/0018 ; agents en link : fiche 0025) : applique un plan
 * dans une racine `~/.claude` factice ou réelle, de façon NON-DESTRUCTIVE dans les DEUX
 * modes. Matérialise l'équipe COMPLÈTE — skills (`skills/<id>/SKILL.md`) ET agents
 * (`agents/<id>.md`). Ne remplace QUE ses propres entrées (un symlink, ou un skill-dir ne
 * contenant que SKILL.md) et refuse d'écraser un fichier/dossier utilisateur étranger
 * préexistant. Idempotent.
 *   - `copy` (défaut) : écrit le contenu figé du plan (skills et agents).
 *   - `link` : symlink chaque skill-dir ET chaque agent-fichier vers sa source
 *     (`catalogRoot` requis) → un `git pull` mega-city met tout à jour (live-update).
 * La LOI (`rules/iamthelaw.md`, ADR-0056) est un fichier COMPILÉ : écrit tel quel dans les deux
 * modes, refusé s'il existe un fichier du même nom qui n'est pas à lawgiver. Pas de hooks côté global.
 */
export function applyGlobalPlan(
  plan: WritePlan,
  root: string,
  options: GlobalApplyOptions = {},
): GlobalApplyReport {
  const mode = options.mode ?? 'copy';
  // Un skill = un DOSSIER multi-fichiers (ADR-0027) : on groupe le plan par `skills/<id>`. Les parents
  // passent avant leurs enfants (`skills/foo` avant `skills/foo/bar`) : remplacer le parent efface son
  // dossier, l'enfant est donc posé après.
  const skillDirs = new Map(
    [...groupBySkillDir(plan.files.filter((file) => isUnderSkills(file.path)))].sort(
      ([a], [b]) => a.length - b.length || (a < b ? -1 : 1),
    ),
  );
  const agentFiles = plan.files.filter((file) => isAgentFile(file.path));
  const lawFiles = plan.files.filter((file) => isLawFile(file.path));

  // Des skills imbriqués ne se lient pas : le lien du parent porte déjà tout son dossier, et lier l'enfant
  // reviendrait à effacer son dossier SOURCE dans le catalogue. Refus net, avant d'écrire quoi que ce soit.
  const nested = nestedSkillDirs([...skillDirs.keys()]);
  if (mode === 'link' && nested.length > 0) {
    throw new Error(
      `skills imbriqués (${nested.join(', ')}) : non supportés en mode link, le lien du skill parent ` +
        'porte déjà son dossier. Utilise la copie (sans --link) ou aplatis les ids.',
    );
  }

  // Garde non-destructive AVANT toute écriture, pour les TROIS formes (skills, agents, loi).
  for (const [dirRel, files] of skillDirs) {
    assertReplaceableSkillDir(root, dirRel, managedTopNames(dirRel, files, [...skillDirs.keys()]));
  }
  for (const file of agentFiles) assertReplaceableAgent(root, file.path);
  for (const file of lawFiles) assertReplaceableLaw(root, file.path);

  if (mode === 'link') {
    const catalogRoot = options.catalogRoot;
    if (!catalogRoot) {
      throw new Error("mode 'link' : catalogRoot (racine du catalogue) est requis.");
    }
    for (const dirRel of skillDirs.keys()) linkSkillDir(root, catalogRoot, dirRel);
    for (const file of agentFiles) linkAgent(root, catalogRoot, file.path);
    // La loi est COMPILÉE depuis les règles : pas un fichier du catalogue, donc jamais un lien.
    for (const file of lawFiles) applyFile(root, file);
    return retireRenamedEntries(root, options.renames ?? []);
  }

  // copy : REMPLACEMENT ATOMIQUE de notre entrée gérée par le contenu figé du plan. Retirer
  // d'abord notre symlink/dossier géré évite (a) d'écrire À TRAVERS un lien (bascule
  // link → copy : un asset trié avant SKILL.md irait sinon dans la source du catalogue) et
  // (b) de laisser traîner un asset retiré de la source. Non-destructif : la garde ci-dessus
  // a prouvé que l'entrée est la nôtre.
  for (const [dirRel, files] of skillDirs) {
    removeManagedEntry(resolveInsideProject(root, dirRel));
    for (const file of files) applyFile(root, file);
  }
  for (const file of agentFiles) {
    const agentFile = resolveInsideProject(root, file.path);
    if (isSymlink(agentFile)) rmSync(agentFile, { force: true });
    applyFile(root, file);
  }
  for (const file of lawFiles) applyFile(root, file);
  return retireRenamedEntries(root, options.renames ?? []);
}
