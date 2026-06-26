/**
 * Ré-export des types du domaine (source de vérité : docs/domain.ts).
 *
 * Le code de `src/` dépend du contrat via ce point unique, jamais d'un chemin
 * relatif vers `docs/` éparpillé. Sens des dépendances (ADR-0003) :
 *   loaders/ caps/ core/ → domain/ ; io/ bin/ → core/.
 */
export type {
  Agent,
  Bundle,
  Cap,
  Enforcement,
  EnforcementType,
  HostId,
  Level,
  Profile,
  ResolvedProfile,
  Rule,
  RuleKind,
  Skill,
} from '../../docs/domain.js';

export type { FileWrite, HookWrite, WritePlan } from './plan.js';
