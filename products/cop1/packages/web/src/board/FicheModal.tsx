/**
 * Board unifié cop1 — modale fiche (fiche 20261012231419211).
 *
 * Un résumé lisible d'une fiche (En clair, contexte, critères, comment vérifier)
 * et un lien vers sa page complète. Fermeture par Échap et par clic sur le fond.
 *
 * Le pouce de revue (fiche 20261102151630248) : la fenêtre montre le pouce publié par la méthode et
 * le pose par `onVerdict`, qui passe par la commande `ezk review verdict`. Elle n'écrit rien elle-même.
 */
import { useEffect, useState } from 'react';
import type { FicheDetail } from './types.js';
import { STATUS_LABEL } from './activity.js';
import { inlineMarkdown } from './inlineMarkdown.js';

interface FicheModalProps {
  fiche: FicheDetail;
  onClose: () => void;
  /** Ouvrir la page complète de la fiche (vue Fiches). */
  onOpenPage: (fid: string) => void;
  /** Poser ou retirer le pouce ; rend le message d'erreur, ou `null` si c'est posé. Absent = lecture seule. */
  onVerdict?: (fid: string, pouce: Pouce) => Promise<string | null>;
}

export type Pouce = 'up' | 'down' | 'none';

const POUCE_LABEL: Record<'up' | 'down', string> = { up: '👍', down: '👎' };

/** Le pouce de revue : celui que publie la méthode, et les boutons qui le posent par elle. */
function VerdictBar({
  fiche,
  onVerdict,
}: {
  fiche: FicheDetail;
  onVerdict?: FicheModalProps['onVerdict'];
}): JSX.Element {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function set(pouce: Pouce): Promise<void> {
    if (!onVerdict) return;
    setPending(true);
    setError(null);
    setError(await onVerdict(fiche.id, pouce));
    setPending(false);
  }
  return (
    <div className="verdictbar">
      <span className="faint">Pouce de revue</span>
      {fiche.verdict && (
        <span className="verdictnow" aria-label={`pouce posé : ${fiche.verdict}`}>
          {POUCE_LABEL[fiche.verdict]}
        </span>
      )}
      {onVerdict && (
        <>
          {(['up', 'down'] as const).map((p) => (
            <button
              type="button"
              key={p}
              className={`btn ghost sm${fiche.verdict === p ? ' on' : ''}`}
              disabled={pending || fiche.verdict === p}
              onClick={() => void set(p)}
            >
              {POUCE_LABEL[p]}
            </button>
          ))}
          {fiche.verdict && (
            <button type="button" className="btn ghost sm" disabled={pending} onClick={() => void set('none')}>
              Retirer
            </button>
          )}
        </>
      )}
      {error && (
        <span className="verdicterr" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

export function FicheModal({ fiche, onClose, onOpenPage, onVerdict }: FicheModalProps): JSX.Element {
  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="modal"
      role="dialog"
      aria-modal="true"
      aria-label={`Fiche ${fiche.title}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="sheet2">
        <div className="mh">
          <div className="dhead">
            <span className={`prio ${fiche.prio}`}>{fiche.prio}</span>
            <span className={`stat s-${fiche.status}`}>{STATUS_LABEL[fiche.status]}</span>
            <span className="pill ver">{fiche.ver || 'sans version'}</span>
            {fiche.pr && <span className="costtag">{fiche.pr}</span>}
            {fiche.blocked && <span className="pill">bloquée : {fiche.blocked}</span>}
          </div>
          <button type="button" className="x" onClick={onClose}>
            Fermer ✕
          </button>
        </div>

        <h2 style={{ fontSize: 21 }}>{fiche.title}</h2>
        <VerdictBar fiche={fiche} onVerdict={onVerdict} />
        <div className="enclair">
          <b>En clair.</b> {inlineMarkdown(fiche.enclair)}
        </div>

        <div className="sec" style={{ marginTop: 14 }}>
          <h4>Contexte</h4>
          <p>{inlineMarkdown(fiche.ctx)}</p>
        </div>
        <div className="sec">
          <h4>Critères</h4>
          <ul className="crit">
            {fiche.crit.map((c, i) => (
              <li key={i}>
                <span className="box" />
                <span>{inlineMarkdown(c)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="sec">
          <h4>Comment vérifier</h4>
          <div className="codeblock">{fiche.verif}</div>
        </div>

        <div className="sec" style={{ marginTop: 10 }}>
          <button type="button" className="btn ghost sm" onClick={() => onOpenPage(fiche.id)}>
            Voir la page de la fiche →
          </button>{' '}
          <span className="faint" style={{ fontSize: 12 }}>
            id {fiche.id}
          </span>
        </div>
      </div>
    </div>
  );
}
