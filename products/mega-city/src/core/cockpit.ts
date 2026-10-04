/**
 * Le cockpit (ADR-0062, fiche 20261004192802897) — la partie PURE : l'état d'un projet du registre,
 * le choix du projet porté par la requête, et la barre de choix injectée dans les pages.
 *
 * Le tableau de bord sert les MÊMES pages pour tous les projets ; seul le projet dont il lit les
 * données change. Le choix voyage dans un cookie : chaque requête (la page, son fichier de données,
 * le pouce) le porte sans qu'aucune page ne soit modifiée. Un projet se désigne par son
 * IDENTIFIANT dans le registre, jamais par un chemin venu du navigateur (ADR-0057).
 *
 * Aucune I/O ici (ADR-0003) : la lecture du registre et des dossiers vit dans `src/io/cockpit.ts`.
 */

/** Le préfixe du cookie qui porte le projet choisi. */
export const PROJECT_COOKIE = 'ezk-projet';

/**
 * Le nom du cookie, propre au port du serveur : un cookie ne dépend pas du port, et deux tableaux de
 * bord ouverts en même temps (un `--root` ou un registre d'essai) ne doivent pas partager leur choix.
 */
export function projectCookieName(port: number | string): string {
  return `${PROJECT_COOKIE}-${port}`;
}

/** La route qui pose ou retire le choix. */
export const PROJECT_ROUTE = '/projet';

/** Ce que le cockpit sait d'un projet du registre, avant d'en lire la moindre fiche. */
export type ProjectState =
  | { kind: 'ok' }
  | { kind: 'introuvable' }
  | { kind: 'methode-non-prise-en-charge'; method: string }
  | { kind: 'format-non-pris-en-charge' }
  | { kind: 'format-en-retard'; version: number; current: number };

export interface CockpitProject {
  id: string;
  /** Racine résolue du projet (absolue). */
  root: string;
  method: string;
  state: ProjectState;
}

/** Ce que l'I/O a constaté sur le disque pour un projet. */
export interface ProjectFacts {
  exists: boolean;
  method: string;
  /** `layout_version` lu dans `features/README.md` ; null si le fichier ou la clé manque. */
  layoutVersion: number | null;
}

/** La méthode que le cockpit sait lire. */
export const SUPPORTED_METHOD = 'mega-city';

/** Lit `layout_version: <n>` dans le texte de `features/README.md` (null s'il est absent). */
export function layoutVersionOf(readme: string | null): number | null {
  if (readme === null) return null;
  const m = /^layout_version:\s*(\d+)\s*$/m.exec(readme);
  return m ? Number(m[1]) : null;
}

/**
 * L'état d'un projet. L'ordre compte : un dossier absent ne se lit pas ; une autre méthode ne se
 * juge pas sur son format ; un format absent ou ancien ne se montre pas avec des statuts faux.
 */
export function projectState(facts: ProjectFacts, currentLayout: number): ProjectState {
  if (!facts.exists) return { kind: 'introuvable' };
  if (facts.method !== SUPPORTED_METHOD) return { kind: 'methode-non-prise-en-charge', method: facts.method };
  if (facts.layoutVersion === null) return { kind: 'format-non-pris-en-charge' };
  if (facts.layoutVersion < currentLayout) {
    return { kind: 'format-en-retard', version: facts.layoutVersion, current: currentLayout };
  }
  return { kind: 'ok' };
}

/** L'état en mots, pour la barre et les refus. Vide pour un projet lisible. */
export function stateLabel(state: ProjectState): string {
  switch (state.kind) {
    case 'ok':
      return '';
    case 'introuvable':
      return 'introuvable sur le disque';
    case 'methode-non-prise-en-charge':
      return `méthode non prise en charge (${state.method})`;
    case 'format-non-pris-en-charge':
      return 'format de fiches non pris en charge';
    case 'format-en-retard':
      return `format en retard (version ${state.version}, attendue ${state.current})`;
  }
}

/** La valeur d'un cookie dans l'en-tête `Cookie` (undefined s'il manque). */
export function readCookie(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() !== name) continue;
    const raw = part.slice(eq + 1).trim();
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }
  return undefined;
}

/** Le choix porté par la requête, résolu par le registre et lui seul. */
export type ProjectChoice =
  | { kind: 'defaut' }
  | { kind: 'projet'; project: CockpitProject }
  | { kind: 'inconnu'; id: string };

export function resolveChoice(projects: readonly CockpitProject[], id: string | undefined): ProjectChoice {
  if (id === undefined || id === '') return { kind: 'defaut' };
  const project = projects.find((p) => p.id === id);
  return project ? { kind: 'projet', project } : { kind: 'inconnu', id };
}

/**
 * Où lire les données pour ce choix : la racine du projet, celle du lancement par défaut, ou un
 * refus (projet inconnu, ou projet qu'on ne sait pas lire). Un refus ne lit RIEN.
 */
export type DataTarget = { kind: 'lire'; root: string } | { kind: 'refus'; status: 400 | 409; reason: string };

export function dataTarget(choice: ProjectChoice, defaultRoot: string): DataTarget {
  if (choice.kind === 'defaut') return { kind: 'lire', root: defaultRoot };
  if (choice.kind === 'inconnu') {
    return { kind: 'refus', status: 400, reason: `projet inconnu du registre : ${choice.id}` };
  }
  const { project } = choice;
  if (project.state.kind !== 'ok') {
    return { kind: 'refus', status: 409, reason: `${project.id} : ${stateLabel(project.state)}` };
  }
  return { kind: 'lire', root: project.root };
}

/**
 * Où revenir après un choix : la page d'où il est fait, si c'est un chemin LOCAL du serveur.
 * Tout le reste (adresse externe, `//hôte`, barre oblique inverse) revient à l'accueil.
 */
export function safeReturnPath(raw: string | null): string {
  // Un caractère de contrôle (tabulation, retour à la ligne) est retiré par le navigateur : « /\t/x »
  // deviendrait « //x », une autre origine. On les refuse tous, avec la barre oblique inverse.
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || /[\u0000-\u001f\u007f\\]/.test(raw)) return '/';
  const base = 'http://ezk.invalid';
  let url: URL;
  try {
    url = new URL(raw, base);
  } catch {
    return '/';
  }
  return url.origin === base ? url.pathname + url.search + url.hash : '/';
}

/** L'en-tête qui pose le choix (ou le retire quand `id` est null). */
export function projectCookieHeader(name: string, id: string | null): string {
  if (id === null) return `${name}=; Path=/; Max-Age=0; SameSite=Strict; HttpOnly`;
  return `${name}=${encodeURIComponent(id)}; Path=/; SameSite=Strict; HttpOnly`;
}

function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * La barre de choix du projet, injectée dans chaque page (fixée en haut à droite, juste avant les
 * boutons de navigation : à gauche, elle couvrirait le titre des pages). Un formulaire GET vers `/projet` : il marche sans JS (bouton dans `<noscript>`),
 * le JS ne fait que l'envoyer au changement. Un projet qu'on ne sait pas lire le dit dans la liste,
 * et un bandeau le redit quand c'est lui qui est choisi.
 */
export function renderProjectBar(
  projects: readonly CockpitProject[],
  choice: ProjectChoice,
  defaultLabel: string,
  registryProblem: string | null = null,
  currentPath = '/',
): string {
  const chosenId = choice.kind === 'projet' ? choice.project.id : choice.kind === 'inconnu' ? choice.id : '';
  // Un choix inconnu (projet retiré du registre, registre cassé) reste sélectionné et dit ce qu'il
  // est : sinon le navigateur afficherait le choix par défaut, et le re-choisir ne changerait rien.
  const unknownOption =
    choice.kind === 'inconnu'
      ? [`<option value="${escapeHtml(choice.id)}" selected>(inconnu) ${escapeHtml(choice.id)}</option>`]
      : [];
  const options = [
    `<option value=""${chosenId === '' ? ' selected' : ''}>${escapeHtml(defaultLabel)}</option>`,
    ...unknownOption,
    ...projects.map((p) => {
      const label = stateLabel(p.state);
      const text = label ? `${p.id} — ${label}` : p.id;
      return `<option value="${escapeHtml(p.id)}"${p.id === chosenId ? ' selected' : ''}>${escapeHtml(text)}</option>`;
    }),
  ].join('');
  const backHome = `${PROJECT_ROUTE}?id=&amp;retour=${encodeURIComponent(safeReturnPath(currentPath))}`;
  const parts: string[] = [];
  if (registryProblem) parts.push(escapeHtml(`registre illisible : ${registryProblem}`));
  if (choice.kind === 'inconnu') {
    parts.push(
      `${escapeHtml(`projet inconnu du registre : ${choice.id} — rien n'est lu.`)} <a href="${backHome}">Revenir au projet du lancement</a>`,
    );
  } else if (choice.kind === 'projet' && choice.project.state.kind !== 'ok') {
    parts.push(escapeHtml(`${choice.project.id} : ${stateLabel(choice.project.state)} — aucune fiche affichée.`));
  }
  const banner = parts.join('<br>');
  return `<style>
  .ezkprj-wrap{position:fixed;top:10px;right:128px;z-index:2147483646;display:flex;flex-direction:column;align-items:flex-end;gap:6px;
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:.82rem;max-width:min(70vw,420px);}
  .ezkprj{display:flex;align-items:center;gap:6px;padding:4px 8px;color:#e7e9ee;
    background:rgba(23,26,33,.82);border:1px solid #2a2f3a;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,.30);}
  .ezkprj select{font:inherit;color:#e7e9ee;background:#0f1115;border:1px solid #2a2f3a;border-radius:6px;padding:3px 6px;max-width:300px;}
  .ezkprj-etat{padding:6px 10px;color:#1a1300;background:#f2c94c;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,.30);}
  .ezkprj-etat a{color:#1a1300;font-weight:600;}
  @media (max-width:720px){
    .ezkprj-wrap{top:auto;bottom:10px;left:10px;right:10px;max-width:none;align-items:stretch;}
    .ezkprj select{flex:1;max-width:none;}
  }
</style>
<div class="ezkprj-wrap">
  <form class="ezkprj" action="${PROJECT_ROUTE}" method="get">
    <label for="ezkprj-id">Projet</label>
    <select id="ezkprj-id" name="id" onchange="this.form.submit()">${options}</select>
    <input type="hidden" name="retour" value="${escapeHtml(safeReturnPath(currentPath))}">
    <noscript><button type="submit">Voir</button></noscript>
  </form>${banner ? `\n  <div class="ezkprj-etat" role="status">${banner}</div>` : ''}
</div>`;
}

/**
 * Les coques de page écrivent le nom du projet en dur (« Board d'avancement — vectorz »). Servies pour
 * un autre projet, elles mentiraient : on remplace ce nom, dans le titre et l'en-tête, par celui du
 * projet dont la page montre les données.
 */
export function nameProjectInPage(html: string, name: string): string {
  const safe = escapeHtml(name);
  return html.replace(/— vectorz<\/(title|h1)>/g, (_m, tag: string) => `— ${safe}</${tag}>`);
}

/** Le nom du projet dont la page montre les données : l'id du registre, sinon le nom du dossier. */
export function shownProjectName(
  choice: ProjectChoice,
  projects: readonly CockpitProject[],
  launchRoot: string,
  launchFolder: string,
): string {
  if (choice.kind === 'projet') return choice.project.id;
  return projects.find((p) => p.root === launchRoot)?.id ?? launchFolder;
}
