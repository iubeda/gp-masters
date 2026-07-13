import React from 'react';
import { History, Wrench } from 'lucide-react';
import { formatLapTime } from '../../utils/timeFormat';
import { useTranslation } from 'react-i18next';

const SetupCell = ({ value }) => {
  const v = parseInt(value) || 0;
  const color = v > 0 ? 'text-emerald-400' : v < 0 ? 'text-rose-400' : 'text-gray-500';
  return <span className={`font-mono font-bold ${color}`}>{v > 0 ? `+${v}` : v}</span>;
};

export default function DetailedLapsHistory({ laps, title = "Telemetría", bestTime }) {
  const { t } = useTranslation();
  if (!laps || laps.length === 0) return null;

  return (
    <div className="bg-[#101017] border border-gray-850 rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-gray-850 flex items-center justify-between">
        <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
          <History className="w-4 h-4 text-gray-500" />
          {title}
        </span>
        <span className="text-xs text-gray-400">
          {t('championship.telemetry.best_time', 'Mejor tiempo')}: <strong className="text-red-400">{bestTime ? formatLapTime(bestTime) : '--'}</strong>
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#161622] text-gray-400 uppercase tracking-wider font-bold">
            <tr>
              <th className="p-3" rowSpan={2}>{t('championship.telemetry.lap', 'Vuelta')}</th>
              <th className="p-3" rowSpan={2}>{t('championship.telemetry.stint', 'Tanda')}</th>
              <th className="p-3" rowSpan={2}>{t('championship.telemetry.lap_time', 'Tiempo de Vuelta')}</th>
              <th className="p-3" rowSpan={2}>{t('championship.telemetry.tire_wear', 'Desgaste Neumático')}</th>
              <th className="p-3" rowSpan={2}>{t('championship.telemetry.tire', 'Neumático')}</th>
              <th className="p-3" rowSpan={2}>{t('championship.telemetry.focus', 'Enfoque')}</th>
              <th className="p-3 text-center border-l border-gray-800" colSpan={5}>
                <span className="flex items-center justify-center gap-1">
                  <Wrench className="w-3 h-3 text-red-500" />
                  {t('championship.telemetry.bike_setup', 'Setup de Moto')}
                </span>
              </th>
            </tr>
            <tr>
              <th className="p-2 text-center text-[9px] border-l border-gray-800">{t('championship.telemetry.engine', 'Motor')}</th>
              <th className="p-2 text-center text-[9px]">{t('championship.telemetry.gearbox', 'Caja')}</th>
              <th className="p-2 text-center text-[9px]">{t('championship.telemetry.suspension', 'Susp.')}</th>
              <th className="p-2 text-center text-[9px]">{t('championship.telemetry.chassis', 'Chasis')}</th>
              <th className="p-2 text-center text-[9px]">{t('championship.telemetry.wings', 'Alerón')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-850">
            {laps.map((lap) => (
              <tr key={lap.id} className={lap.has_crashed ? 'bg-red-950/10 text-red-400' : ''}>
                <td className="p-3 font-mono">#{lap.lap_number}</td>
                <td className="p-3">{t('championship.telemetry.stint', 'Tanda')} {lap.stint_number}</td>
                <td className="p-3 font-mono font-bold">
                  {lap.has_crashed ? 'CAÍDA' : formatLapTime(lap.lap_time)}
                </td>
                <td className="p-3 font-mono">{lap.tire_wear_pct}%</td>
                <td className="p-3 font-bold uppercase">{lap.tire_type}</td>
                <td className="p-3 text-gray-400">{lap.pilot_focus}</td>
                <td className="p-2 text-center border-l border-gray-800/50"><SetupCell value={lap.setup_engine} /></td>
                <td className="p-2 text-center"><SetupCell value={lap.setup_gearbox} /></td>
                <td className="p-2 text-center"><SetupCell value={lap.setup_suspension} /></td>
                <td className="p-2 text-center"><SetupCell value={lap.setup_chassis} /></td>
                <td className="p-2 text-center"><SetupCell value={lap.setup_wings} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
