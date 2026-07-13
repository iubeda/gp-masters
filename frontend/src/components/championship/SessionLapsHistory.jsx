import React from 'react';
import { History } from 'lucide-react';
import { formatLapTime } from '../../utils/timeFormat';
import { useTranslation } from 'react-i18next';

export default function SessionLapsHistory({ laps, title = 'Tu Vuelta a Vuelta' }) {
  const { t } = useTranslation();
  if (!laps || laps.length === 0) return null;

  return (
    <div className="bg-[#101017] border border-gray-850 rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-gray-850 flex items-center justify-between">
        <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
          <History className="w-4 h-4 text-gray-500" />
          {title}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#161622] text-gray-400 uppercase tracking-wider font-bold">
            <tr>
              <th className="p-3">{t('championship.race_center.lap', 'Vuelta')}</th>
              <th className="p-3">{t('championship.race_center.time', 'Tiempo')}</th>
              <th className="p-3">{t('championship.race_center.accumulated_wear', 'Desgaste Acumulado')}</th>
              <th className="p-3">{t('championship.race_center.details_incidents', 'Detalles / Incidentes')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-850">
            {laps.map((lap) => (
              <tr key={lap.id} className={lap.has_crashed ? 'bg-red-950/10 text-red-400' : ''}>
                <td className="p-3 font-mono">#{lap.lap_number}</td>
                <td className="p-3 font-mono font-bold">
                  {lap.has_crashed ? 'CAÍDA' : formatLapTime(lap.lap_time)}
                </td>
                <td className="p-3 font-mono">{lap.tire_wear_pct}%</td>
                <td className="p-3 text-xs text-gray-300 italic">
                  {lap.feedback_received || '--'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
