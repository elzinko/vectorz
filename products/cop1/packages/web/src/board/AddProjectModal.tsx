/**
 * Board unifié cop1 — assistant d'ajout de projet (fiche 20261012231419263).
 *
 * Depuis le sélecteur de projet : racine du projet, outil (IDE), config de départ
 * (défauts de la méthode). Le mapping tier → modèle vient de l'outil (réglé une
 * fois), pas redemandé. La création est simulée : le projet apparaît ensuite dans
 * le sélecteur avec sa config par défaut.
 */
import { useEffect, useState } from 'react';

interface AddProjectModalProps {
  ides: string[];
  currentIde: string;
  /** Crée le projet (racine + IDE) ; la coque l'ajoute au sélecteur et le choisit. */
  onCreate: (root: string, ide: string) => string;
  onClose: () => void;
}

export function AddProjectModal({ ides, currentIde, onCreate, onClose }: AddProjectModalProps): JSX.Element {
  const [root, setRoot] = useState('~/git/mon-projet');
  const [ide, setIde] = useState(currentIde);
  const [createdName, setCreatedName] = useState<string | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function create(): void {
    const name = onCreate(root.trim() || '~/git/mon-projet', ide);
    setCreatedName(name);
  }

  return (
    <div
      className="modal"
      role="dialog"
      aria-modal="true"
      aria-label="Ajouter un projet"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="sheet2">
        <div className="mh">
          <h3>Ajouter un projet</h3>
          <button type="button" className="x" onClick={onClose}>
            Fermer ✕
          </button>
        </div>

        {createdName ? (
          <>
            <div className="msg" style={{ margin: '4px 0' }}>
              ✓ Projet « {createdName} » créé (simulé). Config par défaut appliquée ; le mapping tier→modèle
              vient de l'outil ({ide}).
            </div>
            <div style={{ padding: '8px 0 4px' }}>
              <button type="button" className="btn ghost" onClick={onClose}>
                Fermer
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="cfgrow" style={{ borderTop: 0 }}>
              <span className="cfgk">Racine du projet</span>
              <input
                className="rootinput"
                aria-label="Racine du projet"
                value={root}
                onChange={(e) => setRoot(e.target.value)}
              />
            </div>
            <div className="cfgrow">
              <span className="cfgk">Outil (IDE)</span>
              <span className="seg" role="group" aria-label="Outil (IDE)">
                {ides.map((k) => (
                  <button key={k} type="button" className={ide === k ? 'on' : undefined} aria-pressed={ide === k} onClick={() => setIde(k)}>
                    {k}
                  </button>
                ))}
              </span>
            </div>
            <div className="cfgrow">
              <span className="cfgk">Config de départ</span>
              <span className="sub" style={{ textTransform: 'none', letterSpacing: 0 }}>
                défauts de la méthode · modifiables ensuite
              </span>
            </div>
            <div className="faint" style={{ fontSize: 12.5, padding: '8px 0' }}>
              Le mapping tier→modèle vient du <b>poste</b> (réglé une fois), pas redemandé à chaque projet.
            </div>
            <div style={{ padding: '6px 0', display: 'flex', gap: 9 }}>
              <button type="button" className="btn" onClick={create}>
                ▸ Créer (simulé)
              </button>
              <button type="button" className="btn ghost" onClick={onClose}>
                Annuler
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
