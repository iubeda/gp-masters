import React from 'react';
import { CalendarDays, Calendar, Trophy, Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Dashboard widget for the next upcoming race.
 * Handles three states:
 *  1. Active GP exists → shows circuit info, dates, and simulate button
 *  2. No circuits at all → empty state (different message for creator vs member)
 *  3. All GPs completed → championship finished state
 *
 * Props:
 *  - activeGP: the next scheduled circuit object (or undefined)
 *  - hasCircuits: boolean
 *  - isMember: boolean
 *  - userRole: string ('admin' | 'user' | ...)
 *  - todayStr: string 'YYYY-MM-DD'
 *  - isCreator: boolean
 *  - onSimulate: () => void — switches to the GP tab
 */
const NextRaceCard = ({ activeGP, hasCircuits, isMember, userRole, todayStr, isCreator, onSimulate }) => {
  const { t } = useTranslation();
  // State 1: active (upcoming) GP
  if (activeGP) {
    const canSimulate = (isMember && todayStr >= activeGP.practice_date) || userRole === 'admin';

    return (
      <div className="glass rounded-2xl border border-gray-800 overflow-hidden shadow-xl bg-gradient-to-br from-[#161622]/20 to-transparent">
        <div className="p-5 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-yellow-500" />
            <h3 className="font-bold text-white text-base">{t('championship.next_race.title', 'Siguiente Carrera')}</h3>
          </div>
          <span className="px-2.5 py-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-xs font-bold rounded-full uppercase tracking-wider">
            GP #{activeGP.order}
          </span>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <h4 className="text-xl font-extrabold text-white">{activeGP.name}</h4>
            <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">
              {t('championship.next_race.length', 'Longitud')}: <strong className="text-white font-semibold">{activeGP.distance}m</strong> • {t('championship.next_race.curves_rl', 'Curvas R/L')}:{' '}
              <strong className="text-white font-semibold">
                {activeGP.curves_right}/{activeGP.curves_left}
              </strong>
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-gray-800/40 pt-4 text-[10px] text-center">
            {[
              { label: t('championship.next_race.practice', 'Entrenamientos'), date: activeGP.practice_date, accent: false },
              { label: t('championship.next_race.qualifying', 'Clasificación'), date: activeGP.qualifying_date, accent: false },
              { label: t('championship.next_race.race', 'Carrera'), date: activeGP.race_date, accent: true },
            ].map(({ label, date, accent }) => (
              <div key={label} className="bg-[#0F0F12] p-2.5 rounded-xl border border-gray-850">
                <span className={`${accent ? 'text-red-500' : 'text-gray-500'} font-bold uppercase tracking-wider block`}>
                  {label}
                </span>
                <span className={`${accent ? 'text-red-400 font-bold' : 'text-gray-300 font-semibold'} mt-0.5 block`}>
                  {date}
                </span>
              </div>
            ))}
          </div>

          {canSimulate && (
            <button
              onClick={onSimulate}
              className="w-full mt-4 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
            >
              <Play className="w-4 h-4 fill-current" />
              {t('championship.next_race.simulate_btn', 'Simular este circuito')}
            </button>
          )}
        </div>
      </div>
    );
  }

  // State 2: no circuits programmed yet
  if (!hasCircuits) {
    return (
      <div className="glass rounded-2xl border border-gray-800 p-8 text-center space-y-3 bg-gradient-to-r from-gray-600/10 via-transparent to-transparent">
        <Calendar className="w-10 h-10 text-gray-500 mx-auto" />
        <h4 className="text-base font-bold text-white">{t('championship.next_race.no_circuits_programmed', 'Sin Circuitos Programados')}</h4>
        <p className="text-xs text-gray-400 leading-relaxed max-w-md mx-auto">
          {isCreator 
            ? t('championship.next_race.creator_no_circuits', 'Aún no has añadido ningún circuito a este campeonato. Dirígete a la pestaña de Calendario para programar las carreras.')
            : t('championship.next_race.member_no_circuits', 'Aún no se han programado circuitos en el calendario de este campeonato. Por favor, espera a que el organizador añada las carreras.')}
        </p>
      </div>
    );
  }

  // State 3: championship finished
  return (
    <div className="glass rounded-2xl border border-gray-800 p-8 text-center space-y-3 bg-gradient-to-r from-yellow-600/10 via-transparent to-transparent">
      <Trophy className="w-10 h-10 text-yellow-500 mx-auto animate-bounce animate-pulse" />
      <h4 className="text-base font-bold text-white">¡Campeonato Finalizado!</h4>
      <p className="text-xs text-gray-400 leading-relaxed max-w-md mx-auto">
        {t('championship.next_race.all_simulated', 'Todas las carreras del campeonato han sido simuladas. Consulta la Clasificación General para ver el podio final.')}
      </p>
    </div>
  );
};

export default NextRaceCard;
