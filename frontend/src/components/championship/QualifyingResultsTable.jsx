import React from 'react';
import { Award } from 'lucide-react';
import { formatLapTime } from '../../utils/timeFormat';

export default function QualifyingResultsTable({ gridStatus, teamId, teamStatus }) {
  return (
    <div className="bg-[#101017] border border-gray-850 rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-gray-850 flex items-center justify-between">
        <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
          <Award className="w-4 h-4 text-yellow-500" />
          Tiempos de Clasificación Oficiales
        </span>
        {teamStatus && (
          <span className="text-xs text-gray-400">
            Tu tiempo: <strong className="text-red-400">{formatLapTime(teamStatus.best_qualifying_time)}</strong>
          </span>
        )}
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#161622] text-gray-400 uppercase tracking-wider font-bold">
            <tr>
              <th className="p-3">Posición</th>
              <th className="p-3">Piloto</th>
              <th className="p-3">Equipo</th>
              <th className="p-3">Mejor Vuelta</th>
              <th className="p-3">Vueltas Usadas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-850">
            {gridStatus.map((t, idx) => (
              <tr key={t.team_id} className={t.team_id === teamId ? 'bg-red-600/10 font-semibold' : ''}>
                <td className="p-3 font-mono font-bold">#{idx + 1}</td>
                <td className="p-3">{t.pilot_name}</td>
                <td className="p-3 text-gray-350">{t.team_name} ({t.owner_name})</td>
                <td className="p-3 font-mono font-bold text-yellow-500">
                  {formatLapTime(t.best_qualifying_time)}
                </td>
                <td className="p-3 text-gray-400">{t.qualifying_laps_used || 0} / 3</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
