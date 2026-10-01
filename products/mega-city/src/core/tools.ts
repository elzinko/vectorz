/**
 * tools — les OUTILS de la méthode et leurs liens aux skills. PUR (ADR-0003).
 *
 * Fiche 20260917123943914, ADR-0058. Un outil est un fichier script de `bin/` ou de
 * `skills/<skill>/scripts/`. Le lien « ce skill utilise cet outil » est CALCULÉ depuis les
 * fichiers : un skill utilise un outil quand sa doc (SKILL.md et ses fichiers markdown) en cite le
 * chemin. Aucune liste saisie à la main, rien à tenir à jour.
 *
 * Ce qu'on reconnaît (et rien d'autre : un lien faux sur la carte est pire qu'un lien absent) :
 *   - le chemin depuis la racine du produit : `bin/x.sh`, `skills/<skill>/scripts/x.sh` ;
 *   - le chemin depuis la racine du dépôt ou de `~/.claude` : tout préfixe est accepté ;
 *   - `<skill>/scripts/x.sh` avec un nom de skill réel ;
 *   - `scripts/x.sh` NU, ou noté par un gabarit (`<skill>/scripts/x.sh`, `$VAR/scripts/x.sh`,
 *     `./scripts/…`, `../scripts/…`), mais seulement pour les scripts du skill qui le cite.
 * Un nom seul (`check.sh`) ne compte pas : plusieurs skills ont un `check.sh`.
 *
 * Aucun I/O ici : lister les fichiers et lire le manifeste = `loaders/tools.ts`.
 */

/** Un outil : un script de la méthode, avec ce qui le relie au reste. */
export interface Tool {
  /** Chemin depuis `products/mega-city` : `bin/regen-backlog.sh`, `skills/ezk-pr/scripts/ship-merge.sh`. */
  id: string;
  /** Les skills qui le citent (ids, triés). Source des liens `uses`. */
  usedBy: string[];
  /** Les commandes `ezk …` du manifeste qui lancent ce script. */
  commands: string[];
  /** La raison déclarée « internal » dans le manifeste ; absente sinon. */
  internal?: string;
}

/** Tous les textes de doc d'un skill : son SKILL.md, puis ses fichiers markdown auxiliaires. */
export interface SkillTexts {
  /** L'id du skill, qui est aussi le nom de son dossier sous `skills/`. */
  skill: string;
  texts: string[];
}

/** Ce que le manifeste de la commande `ezk` dit des scripts : qui les lance, qui est interne. */
export interface RoutedTools {
  /** script → commandes `ezk …` qui le lancent. */
  commands: Map<string, string[]>;
  /** script → raison pour laquelle il est interne. */
  internal: Map<string, string>;
}

const SCRIPT_EXTENSION = /\.(sh|ts|mjs|js)$/;

/**
 * Ce nom de fichier est-il celui d'un outil ? Un script (extension connue), ou un fichier
 * exécutable sans extension (le hook `commit-msg`). Les `test-*` sont des tests, pas des outils ;
 * les fichiers cachés et la doc non plus.
 */
export function isToolFile(name: string, executable: boolean): boolean {
  if (name.startsWith('.') || name.startsWith('test-') || name.endsWith('.md')) return false;
  if (/\.(test|spec)\./.test(name)) return false; // `x.test.ts` : un test, pas un outil
  return SCRIPT_EXTENSION.test(name) || executable;
}

const escapeRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Ce qui précède un chemin qualifié n'est pas un bout de nom : `mybin/x.sh` n'est pas `bin/x.sh`. */
const LEFT = '(?<![A-Za-z0-9_.-])';
/** `scripts/x.sh` nu : aucun chemin devant, sinon c'est le dossier d'un AUTRE skill. */
const LEFT_BARE = '(?<![A-Za-z0-9_./~-])';
/** Ce qui suit n'est pas la suite du nom : ni `x.shx`, ni `x.sh.bak`, mais « x.sh. » (fin de phrase) passe. */
const RIGHT = '(?![A-Za-z0-9_-]|\\.[A-Za-z0-9])';

const SKILL_SCRIPT = /^skills\/([^/]+)\/(scripts\/.+)$/;

/** Les écritures sous lesquelles le skill `skill` peut citer l'outil `id`. */
function formsOf(id: string, skill: string): { form: string; bare: boolean }[] {
  const forms = [{ form: id, bare: false }];
  const own = SKILL_SCRIPT.exec(id);
  if (own?.[1] && own[2]) {
    forms.push({ form: `${own[1]}/${own[2]}`, bare: false });
    if (own[1] === skill) forms.push({ form: own[2], bare: true });
  }
  return forms;
}

/**
 * Un skill note souvent SON dossier par un gabarit : `<skill>/scripts/x`, `<chemin-du-skill>/scripts/x`,
 * `skills/<skill>/scripts/x`, `~/.claude/skills/<skill>/scripts/x`, `$SCOUT/scripts/x`, ou en chemin
 * relatif `./scripts/x`, `../scripts/x` (depuis un fichier de son dossier). Tout cela veut dire
 * `scripts/x`, le dossier de celui qui écrit : on retire le préfixe. Sans cela, ces skills
 * passeraient pour ne citer aucun de leurs scripts (faux orphelins).
 */
const OWN_FOLDER_PREFIX =
  /(?:[A-Za-z0-9_.~/-]*skills\/<[^<>\n/]{1,40}>\/|<[^<>\n/]{1,40}>\/|\$\{?[A-Za-z_][A-Za-z0-9_]*\}?\/|(?<![A-Za-z0-9_./~-])\.{1,2}\/)(?=scripts\/)/g;

const withoutOwnFolderPrefix = (text: string): string => text.replace(OWN_FOLDER_PREFIX, '');

function cites(texts: readonly string[], forms: { form: string; bare: boolean }[]): boolean {
  const patterns = forms.map(
    ({ form, bare }) => new RegExp(`${bare ? LEFT_BARE : LEFT}${escapeRegExp(form)}${RIGHT}`),
  );
  return texts.some((text) => patterns.some((p) => p.test(text)));
}

/**
 * Compose les outils : un par fichier de `files` (ids, chemins depuis `products/mega-city`),
 * avec les skills qui le citent et ce que le manifeste en dit. Trié par id : sortie stable (F4).
 */
export function deriveTools(
  files: readonly string[],
  skills: readonly SkillTexts[],
  routing: RoutedTools,
): Tool[] {
  const normalized = skills.map((s) => ({
    skill: s.skill,
    texts: s.texts.map(withoutOwnFolderPrefix),
  }));
  return [...files].sort().map((id) => {
    const usedBy = normalized
      .filter(({ skill, texts }) => cites(texts, formsOf(id, skill)))
      .map(({ skill }) => skill)
      .sort();
    const internal = routing.internal.get(id);
    return {
      id,
      usedBy: [...new Set(usedBy)],
      commands: routing.commands.get(id) ?? [],
      ...(internal === undefined ? {} : { internal }),
    };
  });
}
