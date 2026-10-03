/**
 * Racine du PROJET désigné — cœur PUR (fiche 20260826173221323).
 *
 * Deux racines à ne pas confondre :
 *   - la MÉTHODE (le dépôt vectorz) : les pages `diagrams/` et les outils. Elle ne change jamais ;
 *   - le PROJET : ses fiches, son PLAN.md, ses récits. C'est lui qu'on désigne, pour lire les fiches
 *     de muti ou de samplerz au lieu de celles de vectorz.
 *
 * Ordre unique, le même pour toutes les commandes : `--root <dossier>` > variable `EZK_ROOT` >
 * le défaut que l'appelant fournit. Le défaut est un PARAMÈTRE : c'est la méthode pour les vues
 * (le comportement d'avant, inchangé), la racine git du dossier courant pour les règles du projet.
 * Aucune détection automatique depuis le dossier courant : sans argument ni variable, rien ne change.
 *
 * Un chemin relatif se lit depuis `INIT_CWD` (le dossier où l'utilisateur a tapé la commande ; pnpm
 * change de dossier avant de lancer le script), sinon depuis le dossier courant. C'est la règle de la
 * supervision (`resolveProjectPath`), réutilisée telle quelle.
 */
import { resolveProjectPath } from '../supervision/link-config.js';

/** La variable qui désigne le projet quand l'option `--root` n'est pas donnée. */
export const PROJECT_ROOT_ENV = 'EZK_ROOT';

/** Posée par `ezk` quand il a déjà annoncé « dépôt visé : <racine> » : le script ne le répète pas. */
export const ANNOUNCED_ENV = 'EZK_ROOT_ANNOUNCED';

export type RootSource = 'flag' | 'env' | 'default';

export interface RootInputs {
  /** Valeur de `--root`, si donnée. */
  flag?: string | undefined;
  /** Valeur de la variable `EZK_ROOT`. Une valeur vide compte pour absente. */
  env?: string | undefined;
  /** La racine absolue quand rien n'est désigné. */
  fallback: string;
  /** Le dossier d'où l'utilisateur a lancé la commande (`INIT_CWD`). */
  initCwd?: string | undefined;
  /** Le dossier courant du processus. */
  cwd: string;
}

export interface ResolvedRoot {
  root: string;
  source: RootSource;
}

export function resolveProjectRoot(inputs: RootInputs): ResolvedRoot {
  const absolute = (path: string): string => resolveProjectPath(path, inputs.initCwd, inputs.cwd);
  if (inputs.flag !== undefined && inputs.flag !== '') return { root: absolute(inputs.flag), source: 'flag' };
  if (inputs.env !== undefined && inputs.env !== '') return { root: absolute(inputs.env), source: 'env' };
  return { root: inputs.fallback, source: 'default' };
}

/**
 * Le bandeau qui dit QUEL projet on lit, quand ce n'est pas le défaut. Une variable `EZK_ROOT` restée dans
 * le shell ferait sinon lire en silence les fiches d'un autre projet. Rien pour le défaut : sans argument ni
 * variable, la sortie reste celle d'avant.
 */
export function rootBanner(resolved: ResolvedRoot): string | undefined {
  if (resolved.source === 'default') return undefined;
  return `Projet visé : ${resolved.root} (${resolved.source === 'flag' ? 'option --root' : `variable ${PROJECT_ROOT_ENV}`})`;
}

const FLAG = '--root';

/**
 * Retire `--root <dossier>` / `--root=<dossier>` d'une liste d'arguments, où qu'il soit. Les autres
 * arguments gardent leur ordre. Une option sans valeur (ou suivie d'une autre option) est une faute de
 * frappe : on le dit, au lieu de retomber en silence sur le défaut.
 */
export function extractRootFlag(argv: string[]): { flag?: string; rest: string[]; error?: string } {
  const rest: string[] = [];
  let flag: string | undefined;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i] ?? '';
    let value: string | undefined;
    if (arg === FLAG) {
      value = argv[i + 1];
      i += 1;
    } else if (arg.startsWith(`${FLAG}=`)) {
      value = arg.slice(FLAG.length + 1);
    } else {
      rest.push(arg);
      continue;
    }
    if (value === undefined || value === '' || value.startsWith('--')) {
      return { rest, error: `« ${FLAG} » attend un dossier (le projet dont on lit les fiches).` };
    }
    flag = value;
  }
  return { ...(flag !== undefined ? { flag } : {}), rest };
}
