import React from 'react';
import { Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Modal for expelling (kicking) a team manager from the championship.
 *
 * Props:
 *  - team: the target team object { owner_name, team_name }
 *  - kickReason: string
 *  - setKickReason: (v: string) => void
 *  - kicking: boolean — loading state while the request is in-flight
 *  - onSubmit: (e) => void — form submit handler
 *  - onClose: () => void — closes the modal
 */
const KickManagerModal = ({ team, kickReason, setKickReason, kicking, onSubmit, onClose }) => {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md glass rounded-2xl border border-gray-800 shadow-2xl overflow-hidden">
        {/* Modal header */}
        <div className="bg-gradient-to-r from-red-600/20 to-transparent p-6 border-b border-gray-800 flex items-center gap-3">
          <Shield className="w-6 h-6 text-red-500" />
          <div>
            <h2 className="text-lg font-extrabold text-white">{t('championship.kick_modal.title', 'Expulsar Mánager')}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{t('championship.kick_modal.subtitle', 'Retirar al usuario del campeonato')}</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {/* Warning banner */}
          <div className="bg-red-600/5 border border-red-500/10 p-3.5 rounded-xl text-xs text-red-400">
            {t('championship.kick_modal.about_to_kick', 'Estás a punto de expulsar a')}{' '}
            <strong className="text-white">{team.owner_name}</strong> ({t('championship.kick_modal.team', 'Equipo:')} {team.team_name}). {t('championship.kick_modal.warning', 'Su moto y piloto quedarán inactivos pero mantendrá su puntuación histórica.')}
          </div>

          {/* Reason textarea */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-gray-400">
              {t('championship.kick_modal.reason_label', 'Motivo de la expulsión (Obligatorio)')}
            </label>
            <textarea
              value={kickReason}
              onChange={(e) => setKickReason(e.target.value)}
              placeholder="Ej. Inactividad prolongada o comportamiento antideportivo..."
              rows={4}
              className="w-full px-4 py-3 bg-[#0F0F12] border border-gray-800 rounded-xl focus:border-red-500 focus:outline-none text-white text-sm"
              required
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
            >
              {t('championship.kick_modal.cancel_btn', 'CANCELAR')}
            </button>
            <button
              type="submit"
              disabled={kicking}
              className="flex-1 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {kicking ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                t('championship.kick_modal.kick_btn', 'EXPULSAR')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default KickManagerModal;
