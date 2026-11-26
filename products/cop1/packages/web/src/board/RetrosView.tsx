/**
 * Board unifié cop1 — pages Rétros et Une rétro (fiche 20260826072532537).
 *
 * Une rétro est un temps où l'équipe relit des sprints et propose des améliorations ; le PO tranche
 * chaque proposition. La page lit `ezk retro captures --json`, relayé par le daemon (`/api/retros/<projet>`).
 * La méthode ne publie pas encore les sprints relus, ni le récit de la capture : la page le dit au lieu
 * de l'inventer. Aucun bouton « Lancer une rétro » : aucun geste n'existe côté méthode.
 */
import { useState } from 'react';
import { InfoButton, PageHead } from './Chrome.js';
import { Unavailable } from './PlanBits.js';
import {
  type RetroAction,
  type RetroCapture,
  type RetroCaptures,
  type RetroStatus,
  decidedCount,
  newestFirst,
  proposalsPhrase,
} from './retroCaptures.js';
import type { BoardProject } from './types.js';
import { useDaemonContract } from './useDaemonContract.js';

const NOT_PUBLISHED = 'non publié';
const NO_SPRINTS = 'sprints non tracés';
const PAGE = 20;

const isRetroCaptures = (value: unknown): boolean => Array.isArray((value as Partial<RetroCaptures> | null | undefined)?.captures);

const RETROS_READING = {
  path: 'retros',
  field: 'retros',
  isUsable: isRetroCaptures,
  incompleteReason: 'contrat des rétros incomplet (captures absentes)',
};

const STATE: Record<RetroStatus, { word: string; tag: string }> = {
  '✅': { word: 'adoptée', tag: 'ok' },
  '❌': { word: 'écartée', tag: 'idea' },
  '⏳': { word: 'en attente', tag: 'warn' },
};

/** La rétro ouverte : son fichier, et le titre que le fil d'Ariane affiche. */
export interface RetroFocus {
  file: string;
  title: string;
}

export interface RetrosViewProps {
  project: BoardProject;
  /** Le fichier de la rétro ouverte, ou `null` pour la liste : l'état vit dans Board, qui dessine le fil d'Ariane. */
  openFile: string | null;
  onOpenChange: (focus: RetroFocus | null) => void;
}

const focusOf = (c: RetroCapture): RetroFocus => ({ file: c.file, title: c.theme });

export function RetrosView({ project, openFile, onOpenChange }: RetrosViewProps): JSX.Element {
  const state = useDaemonContract<RetroCaptures>(project.name, RETROS_READING);
  if (state.kind !== 'ok') {
    return (
      <>
        <PageHead title="Rétros" />
        {state.kind === 'loading' ? (
          <section className="card">
            <div className="row">
              <span className="meta" role="status">rétros en cours de lecture</span>
            </div>
          </section>
        ) : (
          <Unavailable what="rétros" reason={state.reason} />
        )}
      </>
    );
  }
  const retros = newestFirst(state.contract.captures);
  const index = retros.findIndex((c) => c.file === openFile);
  const open = retros[index];
  if (open) {
    return (
      <RetroPage
        capture={open}
        previous={retros[index + 1]}
        problems={state.contract.problems.filter((p) => p.file === open.file).map((p) => p.message)}
        onOpenChange={onOpenChange}
      />
    );
  }
  return <RetrosList retros={retros} onOpenChange={onOpenChange} />;
}

function RetrosList({ retros, onOpenChange }: { retros: RetroCapture[]; onOpenChange: RetrosViewProps['onOpenChange'] }): JSX.Element {
  const [limit, setLimit] = useState(PAGE);
  const shown = retros.slice(0, limit);
  return (
    <>
      <PageHead title="Rétros" info="Les rétros capturées, la plus récente d’abord. Non publié par la méthode : les sprints relus." />
      <section className="card" aria-label="Rétros capturées">
        {retros.length === 0 ? (
          <div className="row">
            <span className="meta">aucune rétro capturée</span>
          </div>
        ) : (
          <ul className="sess-list">
            {shown.map((c) => {
              const decided = decidedCount(c.actions);
              return (
                <li key={c.file} className="sess-row">
                  <span className="tag warn">rétro</span>
                  <span className="sess-main">
                    <button type="button" className="doclink linkbtn sess-link" onClick={() => onOpenChange(focusOf(c))}>
                      {c.theme}
                    </button>
                    <span className="meta">
                      {c.date} · {NO_SPRINTS} · {proposalsPhrase(c.actions)}
                    </span>
                  </span>
                  {decided > 0 ? <span className="tag warn">{decided > 1 ? `${decided} décisions PO` : '1 décision PO'}</span> : <span />}
                </li>
              );
            })}
          </ul>
        )}
        <div className="sessions-foot">
          <span />
          {retros.length > shown.length ? (
            <button type="button" className="chip" onClick={() => setLimit(limit + PAGE)}>
              Afficher plus
            </button>
          ) : (
            <span />
          )}
          <span className="meta">{retros.length > shown.length ? `${shown.length} sur ${retros.length} rétros` : `${retros.length} rétros`}</span>
        </div>
      </section>
    </>
  );
}

function ProposalRow({ index, action }: { index: number; action: RetroAction }): JSX.Element {
  const { word, tag } = STATE[action.status];
  const by = action.by.length > 0 ? `proposée par ${action.by.join(', ')}` : null;
  const facts = [action.kind, by, action.decision || null].filter((f): f is string => f !== null);
  return (
    <div className="row">
      <span className="ttl">
        {index} · {action.proposition}
      </span>
      <span className={`tag ${tag}`}>{word}</span>
      <span className="meta retro-facts">{facts.join(' · ')}</span>
      <span className="meta">{action.date ?? ''}</span>
    </div>
  );
}

function RetroPage({
  capture: c,
  previous,
  problems,
  onOpenChange,
}: {
  capture: RetroCapture;
  previous: RetroCapture | undefined;
  problems: string[];
  onOpenChange: RetrosViewProps['onOpenChange'];
}): JSX.Element {
  const facts = [
    c.date,
    c.participants.length > 0 ? `avec ${c.participants.join(', ')}` : null,
    proposalsPhrase(c.actions),
    NO_SPRINTS,
  ].filter((f): f is string => f !== null);
  return (
    <>
      <PageHead title={c.theme} />
      <div className="sess-summary" data-testid="retro-summary">
        <span className="meta">{facts.join(' · ')}</span>
        <InfoButton text="Non publié par la méthode : le texte « En clair », les faits de départ et le déroulé de la capture, et les sprints relus. Ils restent dans le fichier de la capture." />
      </div>
      <section className="card" aria-label="Propositions">
        <h3>Propositions — {c.actions.length > 0 ? c.actions.length : NOT_PUBLISHED}</h3>
        {c.actions.length === 0 ? (
          <div className="row">
            <span className="meta">
              aucune proposition publiée pour cette capture{problems.length > 0 ? ` · ${problems.join(' · ')}` : ''}
            </span>
          </div>
        ) : (
          c.actions.map((a, i) => <ProposalRow key={`${i}-${a.proposition}`} index={i + 1} action={a} />)
        )}
      </section>
      <div className="sess-two">
        <section className="card" aria-label="Périmètre">
          <h3>Périmètre</h3>
          <div className="row">
            <span>{c.scope || NOT_PUBLISHED}</span>
          </div>
        </section>
        <section className="card" aria-label="Sprints relus">
          <h3>Sprints relus</h3>
          <div className="row">
            <span className="meta">{NO_SPRINTS}</span>
          </div>
        </section>
      </div>
      <section className="card" aria-label="Capture">
        <h3>Capture</h3>
        <div className="row">
          <span className="meta">Fichier</span>
          <code>{c.file}</code>
          <span />
        </div>
        {previous && (
          <div className="row">
            <span className="meta">Précédente</span>
            <button type="button" className="doclink linkbtn retro-prev" onClick={() => onOpenChange(focusOf(previous))}>
              {previous.theme}
            </button>
            <span />
          </div>
        )}
      </section>
    </>
  );
}
