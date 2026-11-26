/**
 * La cloche d'alertes de l'en-tête (fiche 20261126170000112) : un compteur, un panneau déroulant, une
 * ligne par alerte publiée par la méthode (`ezk now --json`, via `/api/now/<projet>`), puis ce que la
 * méthode ne mesure pas. Aucune alerte n'est calculée ici. Sans contrat, la cloche dit « non publié ».
 * Pas de croix : fermer une alerte demande un geste d'écriture, c'est la fiche suivante.
 */
import { useState } from 'react';
import { InfoButton } from './Chrome.js';
import { ALERT_WORD, type NowAlert, type NowContract, aimsAtFiche } from './nowAlerts.js';
import type { BoardProject } from './types.js';
import { useDaemonContract } from './useDaemonContract.js';

const NOT_PUBLISHED = 'non publié';
const PANEL_INFO =
  'Une alerte par élément, jamais de regroupement : chaque fiche bloquée, idée à groomer, proposition de rétro ou version à poser a sa ligne, avec le pourquoi et la décision attendue. La méthode décide ce qui alerte ; l’écran ne calcule rien.';

const isNow = (value: unknown): boolean => Array.isArray((value as Partial<NowContract> | null | undefined)?.alertes);

const NOW_READING = {
  path: 'now',
  field: 'now',
  isUsable: isNow,
  incompleteReason: 'contrat des alertes incomplet (alertes absentes)',
};

interface AlertRowProps {
  alert: NowAlert;
  /** Présent seulement quand l'alerte vise une fiche que l'écran connaît. */
  onOpen?: () => void;
}

function AlertRow({ alert, onOpen }: AlertRowProps): JSX.Element {
  const kind = [ALERT_WORD[alert.type], alert.date].filter((part) => part !== '').join(' · ');
  const body = (
    <>
      <span className="bpkind">{kind}</span>
      <b>{alert.titre}</b>
      <span className="tx">{alert.raison}</span>
      <span className="tx">{alert.decision}</span>
    </>
  );
  return (
    <li className="bprow">
      {onOpen ? (
        <button type="button" className="bpgo" onClick={onOpen}>
          {body}
        </button>
      ) : (
        <div className="bpgo">{body}</div>
      )}
    </li>
  );
}

export interface AlertsBellProps {
  project: BoardProject;
  onOpenFiche: (id: string) => void;
}

export function AlertsBell({ project, onOpenFiche }: AlertsBellProps): JSX.Element {
  const state = useDaemonContract<NowContract>(project.name, NOW_READING);
  const [open, setOpen] = useState(false);
  const now = state.kind === 'ok' ? state.contract : null;
  const count = now?.alertes.length ?? 0;
  const openFiche = (id: string): void => {
    setOpen(false);
    onOpenFiche(id);
  };
  return (
    <div className="bellwrap">
      <button
        type="button"
        className="bell"
        aria-label="Alertes"
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Alertes : une par élément, publiées par la méthode."
        onClick={() => setOpen((o) => !o)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" />
        </svg>
        {count > 0 && <span className="bcount">{count}</span>}
      </button>
      {state.kind === 'unavailable' && (
        <span className="bnote" title={state.reason}>
          {NOT_PUBLISHED}
        </span>
      )}
      {open && (
        <div className="bellpanel" role="dialog" aria-label="Alertes">
          <div className="bph">
            <span>Alertes</span>
            {now && <span className="note">{count} · une par élément</span>}
            <InfoButton text={PANEL_INFO} />
          </div>
          {state.kind === 'loading' && <p className="bpmsg" role="status">alertes en cours de lecture</p>}
          {state.kind === 'unavailable' && <p className="bpmsg">alertes {NOT_PUBLISHED} : {state.reason}</p>}
          {now && (
            <>
              {now.alertes.length === 0 ? (
                <p className="bpmsg">aucune alerte publiée</p>
              ) : (
                <ul className="bplist">
                  {now.alertes.map((a) => (
                    <AlertRow
                      key={`${a.type}:${a.id}`}
                      alert={a}
                      onOpen={aimsAtFiche(a) && project.fiches?.[a.id] ? () => openFiche(a.id) : undefined}
                    />
                  ))}
                </ul>
              )}
              {now.nonMesure.length > 0 && (
                <div className="bpnon">
                  <span className="bpkind">Pas mesuré par la méthode</span>
                  {now.nonMesure.map((line) => (
                    <p key={line} className="tx">
                      {line}
                    </p>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
