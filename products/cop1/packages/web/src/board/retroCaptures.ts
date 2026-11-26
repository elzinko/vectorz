/**
 * Ce que la méthode publie des rétros capturées (`ezk retro captures --json`, relayé par le daemon).
 * Aucun contrat versionné n'existe encore : les types suivent la sortie actuelle. Les comptes de la page
 * sortent d'ici, jamais d'un zéro inventé : un compte absent s'écrit « non publié ».
 */
export type RetroStatus = '✅' | '❌' | '⏳';

export interface RetroAction {
  proposition: string;
  kind: string;
  target?: string;
  by: string[];
  status: RetroStatus;
  decision: string;
  date?: string;
}

export interface RetroCapture {
  file: string;
  date: string;
  theme: string;
  scope: string;
  participants: string[];
  actions: RetroAction[];
}

export interface RetroProblem {
  file: string;
  where: string;
  message: string;
}

export interface RetroCaptures {
  captures: RetroCapture[];
  problems: RetroProblem[];
}

/** La plus récente d'abord ; à date égale, le nom de fichier départage. */
export const newestFirst = (captures: RetroCapture[]): RetroCapture[] =>
  [...captures].sort((a, b) => b.date.localeCompare(a.date) || b.file.localeCompare(a.file));

const plural = (n: number, one: string, many: string): string => `${n} ${n > 1 ? many : one}`;

/** Les propositions qui ont reçu une réponse du PO, adoptée ou écartée. */
export const decidedCount = (actions: RetroAction[]): number => actions.filter((a) => a.status !== '⏳').length;

/** « 3 propositions · 1 écartée par le PO · 2 en attente » : seuls les états présents sont dits. */
export function proposalsPhrase(actions: RetroAction[]): string {
  if (actions.length === 0) return 'propositions non publiées';
  const count = (s: RetroStatus): number => actions.filter((a) => a.status === s).length;
  const parts = [plural(actions.length, 'proposition', 'propositions')];
  if (count('✅') > 0) parts.push(plural(count('✅'), 'adoptée', 'adoptées'));
  if (count('❌') > 0) parts.push(`${plural(count('❌'), 'écartée', 'écartées')} par le PO`);
  if (count('⏳') > 0) parts.push(`${count('⏳')} en attente`);
  return parts.join(' · ');
}
