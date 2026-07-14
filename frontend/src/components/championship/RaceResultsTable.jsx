import React from 'react';
import { Flag, Award } from 'lucide-react';
import { formatLapTime } from '../../utils/timeFormat';
import { useTranslation } from 'react-i18next';

export default function RaceResultsTable({ gridStatus, teamId }) {
  const { t } = useTranslation();
  return (
    <div className="bg-[#101017] border border-gray-850 rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-gray-850 flex items-center justify-between">
        <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
          <Flag className="w-4 h-4 text-red-500" />
          {t('championship.race_center.official_race_results', 'Resultados Oficiales de la Carrera ({{laps}} Vueltas)', { laps: 12 })}
        </span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#161622] text-gray-400 uppercase tracking-wider font-bold">
            <tr>
              <th className="p-3">Pos</th>
              <th className="p-3">{t('championship.race_center.grid', 'Parrilla')}</th>
              <th className="p-3">{t('championship.race_center.pilot', 'Piloto')}</th>
              <th className="p-3">{t('championship.race_center.team', 'Equipo')}</th>
              <th className="p-3">{t('championship.race_center.total_time', 'Tiempo Total')}</th>
              <th className="p-3">{t('championship.race_center.points', 'Puntos')}</th>
              <th className="p-3">{t('championship.race_center.earnings', 'Ingresos')} (€)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-850">
            {gridStatus.map((t) => (
              <tr key={t.team_id} className={t.team_id === teamId ? 'bg-red-600/10 font-semibold' : ''}>
                <td className="p-3 font-mono font-extrabold text-white text-sm">
                  {t.finishing_position === null ? '--' : `${t.finishing_position}º`}
                </td>
                <td className="p-3 text-gray-400 font-mono">P{t.grid_position}</td>
                <td className="p-3">{t.pilot_name}</td>
                <td className="p-3 text-gray-350">{t.team_name} ({t.owner_name})</td>
                <td className="p-3 font-mono">
                  {t.status === 'DNF_crash' ? (
                    <span className="text-rose-500 font-bold">DNF (Caída)</span>
                  ) : (
                    formatLapTime(t.race_time)
                  )}
                </td>
                <td className="p-3 text-emerald-400 font-extrabold text-sm flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" />
                  +{t.points_earned} pts
                </td>
                <td className="p-3 font-mono font-bold text-yellow-500">
                  +{t.earnings?.toLocaleString()} €
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
