/**
 * deploy-state — ce qui est déployé sur un poste, par rapport à ce qu'un profil promet
 * (fiche 20260903134906920 : `ezk law status` ; base du `doctor`, fiche 20260903134909124).
 *
 * PUR (ADR-0003) : il reçoit des FAITS sur les chemins (lien, dossier, fichier, absent) que le
 * bord I/O (src/io/deploy-probe.ts) a relevés, et les range dans un vocabulaire clair. Les
 * éléments attendus sont lus dans le PLAN que `bind-global` écrirait : le diagnostic et le
 * déploiement ne peuvent donc pas diverger sur ce qu'est « le profil ».
 */
import type { WritePlan } from '../domain/plan.js';

/** Ce que le bord a vu à un chemin. */
export type PathFact =
  | { kind: 'absent' }
  | { kind: 'file' }
  | { kind: 'dir' }
  | { kind: 'symlink'; target: string; alive: boolean };

export type DeployState = 'lien' | 'copie' | 'absent' | 'lien-mort';

/** Un élément que le profil promet : un skill (dossier) ou un agent (fichier). */
export interface DeployItem {
  kind: 'skill' | 'agent';
  id: string;
  /** Chemin relatif à la racine de déploiement (`skills/<id>` ou `agents/<id>.md`). */
  path: string;
}

export interface DeployEntry extends DeployItem {
  state: DeployState;
  /** Où pointe le lien, quand c'en est un. */
  target?: string;
}

export function classify(fact: PathFact): DeployState {
  switch (fact.kind) {
    case 'absent':
      return 'absent';
    case 'file':
    case 'dir':
      return 'copie';
    case 'symlink':
      return fact.alive ? 'lien' : 'lien-mort';
  }
}

/** Les skills et agents que le plan dépose, skills d'abord, chacun trié par id. */
export function expectedItems(plan: WritePlan): DeployItem[] {
  const skills: DeployItem[] = [];
  const agents: DeployItem[] = [];
  for (const file of plan.files) {
    const skill = /^skills\/(.+)\/SKILL\.md$/.exec(file.path);
    if (skill?.[1]) skills.push({ kind: 'skill', id: skill[1], path: `skills/${skill[1]}` });
    const agent = /^agents\/(.+)\.md$/.exec(file.path);
    if (agent?.[1]) agents.push({ kind: 'agent', id: agent[1], path: file.path });
  }
  const byId = (a: DeployItem, b: DeployItem): number => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  return [...skills.sort(byId), ...agents.sort(byId)];
}

export function inspect(items: DeployItem[], probe: (relPath: string) => PathFact): DeployEntry[] {
  return items.map((item) => {
    const fact = probe(item.path);
    return { ...item, state: classify(fact), ...(fact.kind === 'symlink' ? { target: fact.target } : {}) };
  });
}

export function summarize(entries: DeployEntry[]): Record<DeployState, number> & { total: number } {
  const counts = { total: entries.length, lien: 0, copie: 0, absent: 0, 'lien-mort': 0 };
  for (const entry of entries) counts[entry.state] += 1;
  return counts;
}

const WORD: Record<DeployState, string> = {
  lien: 'lien',
  copie: 'copie',
  absent: 'absent',
  'lien-mort': 'lien mort',
};

function plural(n: number, one: string, many: string): string {
  return `${n} ${n > 1 ? many : one}`;
}

/** Une ligne par élément, puis le bilan. */
export function renderStatus(profileId: string, targetLabel: string, entries: DeployEntry[]): string {
  const width = Math.max(...Object.values(WORD).map((w) => w.length));
  const lines = [`Déploiement du profil '${profileId}' dans ${targetLabel} [claude-code-global]`];
  for (const [title, kind] of [['skills', 'skill'], ['agents', 'agent']] as const) {
    const group = entries.filter((e) => e.kind === kind);
    lines.push(`  ${title} (${group.length})`);
    for (const e of group) {
      const where = e.target ? ` → ${e.target}` : '';
      lines.push(`    ${WORD[e.state].padEnd(width)}  ${e.id}${where}`);
    }
  }
  const n = summarize(entries);
  lines.push(
    `Bilan : ${n.lien} en lien, ${n.copie} en copie, ${plural(n.absent, 'absent', 'absents')}, ` +
      `${n['lien-mort']} lien mort (sur ${n.total} éléments du profil).`,
  );
  return `${lines.join('\n')}\n`;
}
