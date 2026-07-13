import React from 'react';
import { Activity, Timer } from 'lucide-react';
import { formatLapTime } from '../../utils/timeFormat';
import { useTranslation } from 'react-i18next';

export default function LiveTimingTable({ liveRace }) {
  const { t } = useTranslation();
  return (
    <div className="bg-[#101017] border border-red-900/30 rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(220,38,38,0.1)] relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-red-400 to-red-600 animate-pulse" />
      
      <div className="p-5 border-b border-gray-850 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Activity className="w-5 h-5 text-red-500 relative z-10" />
            <div className="absolute inset-0 bg-red-500 blur-md opacity-50 animate-pulse rounded-full" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-white uppercase tracking-wider">{t('championship.live_timing.title', 'Live Timing')}</h4>
            <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest animate-pulse">{t('championship.live_timing.live', 'En Directo')}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black text-white font-mono">{liveRace.currentLap}</span>
          <span className="text-sm text-gray-500 font-mono font-bold"> / {liveRace.totalLaps}</span>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">{t('championship.live_timing.laps', 'Vueltas')}</p>
        </div>
      </div>

      <div className="overflow-x-auto p-4">
        {liveRace.standings.length === 0 ? (
          <div className="text-center py-10 text-gray-500 text-xs italic">
            {t('championship.live_timing.waiting_first_lap', 'Esperando el paso por meta de la primera vuelta...')}
          </div>
        ) : (
          (() => {
            const absoluteBestLap = liveRace.standings.reduce((min, s) => {
              if (s.has_crashed || !s.best_lap) return min;
              return s.best_lap < min ? s.best_lap : min;
            }, 999.9);

            const leaderTotalTime = liveRace.standings[0]?.total_time || 0;

            return (
              <table className="w-full text-left text-xs border-separate border-spacing-y-1">
                <thead className="text-gray-400 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="px-3 pb-2">{t('championship.live_timing.pos', 'Pos')}</th>
                    <th className="px-3 pb-2">{t('championship.live_timing.pilot_team', 'Piloto / Equipo')}</th>
                    <th className="px-3 pb-2">{t('championship.live_timing.lap_time', 'Tiempo de Vuelta')}</th>
                    <th className="px-3 pb-2">{t('championship.live_timing.wear', 'Desgaste')}</th>
                  </tr>
                </thead>
                <tbody>
                  {liveRace.standings.map((s, i) => {
                    const posDiff = s.grid_position ? s.grid_position - s.position : 0;
                    const isAbsoluteBest = Math.abs(s.last_lap_time - absoluteBestLap) < 0.001;
                    const isPersonalBest = !isAbsoluteBest && Math.abs(s.last_lap_time - s.best_lap) < 0.001;
                    
                    return (
                      <tr 
                        key={s.team_id} 
                        className={`transition-all duration-500 ${s.has_crashed ? 'opacity-50' : ''}`}
                      >
                        <td className="p-3 flex items-center gap-2">
                          <div className={`w-6 h-6 flex items-center justify-center rounded-lg font-mono font-bold ${
                            i === 0 ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' : 
                            i === 1 ? 'bg-gray-300/20 text-gray-300 border border-gray-300/30' : 
                            i === 2 ? 'bg-amber-700/20 text-amber-500 border border-amber-700/30' : 
                            'bg-gray-800 text-gray-400'
                          }`}>
                            {s.position}
                          </div>
                          {posDiff !== 0 && (
                            <span className={`text-[10px] font-bold ${posDiff > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {posDiff > 0 ? '⬆' : '⬇'}{Math.abs(posDiff)}
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-white text-sm">{s.pilot_name}</div>
                          <div className="text-[10px] text-gray-400">{s.team_name}</div>
                          {s.has_crashed && <span className="inline-block mt-1 px-1.5 py-0.5 bg-red-950/50 text-red-500 text-[9px] font-bold uppercase rounded border border-red-500/20">{t('championship.live_timing.crash', 'Caída (DNF)')}</span>}
                        </td>
                        <td className="p-3">
                          <div className={`font-mono font-bold flex items-center gap-2 ${
                            isAbsoluteBest ? 'text-purple-400' : (isPersonalBest ? 'text-emerald-400' : 'text-gray-300')
                          }`}>
                            {s.has_crashed ? '--' : formatLapTime(s.last_lap_time)}
                            {isAbsoluteBest && !s.has_crashed && <Timer className="w-3 h-3 text-purple-400" />}
                            {i > 0 && !s.has_crashed && !liveRace.standings[i-1].has_crashed && (
                              <span className={`text-[10px] font-bold ${s.last_lap_time > liveRace.standings[i-1].last_lap_time ? 'text-red-400' : 'text-emerald-400'}`}>
                                ({(s.last_lap_time - liveRace.standings[i-1].last_lap_time) > 0 ? '+' : ''}{(s.last_lap_time - liveRace.standings[i-1].last_lap_time).toFixed(3)})
                              </span>
                            )}
                          </div>
                          {!s.has_crashed && (
                            <div className="text-[10px] text-gray-400 font-mono mt-0.5 font-semibold">
                              {i > 0 ? (
                                <>
                                  <span className="mr-2">Int: +{(s.total_time - liveRace.standings[i-1].total_time).toFixed(3)}</span>
                                  <span>Líder: +{(s.total_time - leaderTotalTime).toFixed(3)}</span>
                                </>
                              ) : (
                                <span>Líder</span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-20 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${s.tire_wear_pct > 80 ? 'bg-red-500' : s.tire_wear_pct > 50 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.min(100, s.tire_wear_pct)}%` }}
                              />
                            </div>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              s.tire_type === 'soft' ? 'bg-red-950/80 text-red-500 border border-red-500/20' :
                              s.tire_type === 'medium' ? 'bg-yellow-950/80 text-yellow-500 border border-yellow-500/20' :
                              s.tire_type === 'hard' ? 'bg-gray-800 text-gray-300 border border-gray-600' :
                              'bg-blue-950/80 text-blue-400 border border-blue-500/20'
                            }`}>
                              {s.tire_type ? s.tire_type.charAt(0).toUpperCase() : 'M'}
                            </span>
                          </div>
                          <span className="text-[9px] text-gray-500 font-mono block">{s.tire_wear_pct.toFixed(1)}%</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            );
          })()
        )}
      </div>
    </div>
  );
}
