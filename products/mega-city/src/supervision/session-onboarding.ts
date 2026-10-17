/**
 * `session-onboarding.ts` — l'étape d'accueil de session (fiche 20261015082118397,
 * ADR-079 §D3) : le RATTACHEMENT « à la main ».
 *
 * Quand un humain ouvre une session lui-même, la méthode ne doit ni le laisser
 * seul, ni DEVINER son rattachement par co-présence dans le projet (faux et
 * dangereux). Elle **propose** : « ta branche ressemble au chantier X — tu t'y
 * rattaches, ou c'est à part ? ». L'humain tranche en un mot.
 *
 * Ce module ne fait QUE décider la proposition (pur, testable). L'étape d'accueil
 * (crochet `CLAUDE.md` + skill d'ouverture) l'appelle avec les chantiers ouverts
 * et la branche courante, puis agit selon le verdict. Garde-fous ADR-079 §D3 :
 * advisory (jamais un verrou), ne bloque jamais, dégrade en autonome au moindre
 * doute, débrayable par config. Tool-agnostique : vit côté méthode.
 */

/** Un chantier actuellement ouvert, tel que l'accueil le voit (clé + branche/version). */
export interface OpenChantier {
  key: string;
  branch?: string;
  version?: string;
}

/** Réglage projet de l'étape d'accueil. Absent = valeurs par défaut (étape active, auto-confirme la branche nette). */
export interface RattachementConfig {
  /** `false` débraye l'étape : aucune proposition (ADR-079 §D3). Défaut : actif. */
  enabled?: boolean;
  /** Auto-confirme quand la branche courante correspond à EXACTEMENT un chantier ouvert. Défaut : actif. */
  autoConfirmOnBranchMatch?: boolean;
}

/**
 * Le verdict de l'accueil :
 * - `disabled` : étape débrayée par config — l'appelant poursuit sans rien proposer.
 * - `autonomous` : rien à quoi se rattacher (aucun chantier ouvert) — session autonome.
 * - `auto-confirm` : cas NET (la branche courante = un seul chantier ouvert) — rattachement proposé déjà tranché.
 * - `ask` : cas ambigu — on PROPOSE les candidats, l'humain choisit ; par défaut autonome s'il décline.
 */
export type RattachementProposal =
  | { kind: 'disabled' }
  | { kind: 'autonomous'; reason: string }
  | { kind: 'auto-confirm'; chantierKey: string; reason: string }
  | { kind: 'ask'; candidates: OpenChantier[]; reason: string };

export interface ProposeRattachementInput {
  openChantiers: OpenChantier[];
  /** La branche courante (lue par l'émetteur sans git, fiche T2) — sert à reconnaître un cas net. */
  currentBranch?: string;
  config?: RattachementConfig;
}

/**
 * Décide la proposition de rattachement. PUR : ne lit ni disque ni git, ne pose
 * aucune question — il rend le verdict, l'appelant agit. Ne DEVINE jamais : un
 * rattachement n'est « auto-confirmé » que sur une correspondance de branche nette ;
 * sinon il est PROPOSÉ (`ask`) ou la session reste autonome.
 */
export function proposeRattachement(input: ProposeRattachementInput): RattachementProposal {
  const config = input.config ?? {};

  if (config.enabled === false) {
    return { kind: 'disabled' };
  }

  const open = input.openChantiers;
  if (open.length === 0) {
    return { kind: 'autonomous', reason: 'aucun chantier ouvert — rien à quoi se rattacher' };
  }

  const branch = input.currentBranch;
  if (branch !== undefined && branch.length > 0) {
    const onBranch = open.filter((c) => c.branch === branch);
    if (onBranch.length === 1 && (config.autoConfirmOnBranchMatch ?? true)) {
      const match = onBranch[0]!;
      return {
        kind: 'auto-confirm',
        chantierKey: match.key,
        reason: `branche « ${branch} » = chantier ${match.key} (cas net)`,
      };
    }
  }

  // Pas de cas net : on PROPOSE, jamais on ne devine. L'humain tranche ; par défaut autonome.
  return {
    kind: 'ask',
    candidates: open,
    reason:
      branch !== undefined && branch.length > 0
        ? `la branche « ${branch} » ne désigne pas un seul chantier ouvert`
        : 'branche inconnue — rattachement à confirmer',
  };
}
