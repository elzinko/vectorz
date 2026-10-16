/**
 * Board unifié cop1 — modale fiche (fiche 20261012231419211).
 *
 * Un résumé lisible d'une fiche (En clair, contexte, critères, comment vérifier)
 * et un lien vers sa page complète. Fermeture par Échap et par clic sur le fond.
 */
import { useEffect } from 'react';
import type { FicheDetail } from './types.js';
import { STATUS_LABEL } from './activity.js';

interface FicheModalProps {
  fiche: FicheDetail;
  onClose: () => void;
  /** Ouvrir la page complète de la fiche (vue Fiches). */
  onOpenPage: (fid: string) => void;
}

export function FicheModal({ fiche, onClose, onOpenPage }: FicheModalProps): JSX.Element {
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
          </div>
          <button type="button" className="x" onClick={onClose}>
            Fermer ✕
          </button>
        </div>

        <h2 style={{ fontSize: 21 }}>{fiche.title}</h2>
        <div className="enclair">
          <b>En clair.</b> {fiche.enclair}
        </div>

        <div className="sec" style={{ marginTop: 14 }}>
          <h4>Contexte</h4>
          <p>{fiche.ctx}</p>
        </div>
        <div className="sec">
          <h4>Critères</h4>
          <ul className="crit">
            {fiche.crit.map((c, i) => (
              <li key={i}>
                <span className="box" />
                <span>{c}</span>
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
