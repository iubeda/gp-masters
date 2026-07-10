import React from 'react';
import { Trophy, Shield } from 'lucide-react';

/**
 * General standings table for a championship.
 * Shows position, team, pilot, motorcycle, points, and optional kick action.
 *
 * Props:
 *  - teams: array of team objects
 *  - user: current logged-in user object (email, role)
 *  - isCreator: boolean — is the current user the championship creator?
 *  - championship: championship object (for is_public, circuits)
 *  - onKick: (team) => void — opens the kick modal for a given team
 */
const StandingsTable = ({ teams, user, isCreator, championship, onKick }) => {
  const hasStarted = championship.circuits?.some((c) => c.status === 'completed');
  const canShowActions =
    user.role === 'admin' || (isCreator && !hasStarted);

  return (
    <div className="glass rounded-2xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="p-5 bg-gradient-to-r from-yellow-600/10 via-transparent to-transparent border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <h3 className="font-bold text-white text-base">Clasificación General</h3>
        </div>
        <span className="px-3 py-1 bg-[#0F0F12] border border-gray-800 text-xs font-semibold rounded-full text-gray-300">
          {championship.team_count} Equipos Registrados
        </span>
      </div>

      {/* Body */}
      {teams.length === 0 ? (
        <div className="p-8 text-center text-gray-500 text-sm">
          Aún no hay puntuaciones registradas en el campeonato.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-[#161622]/60 text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-800">
              <tr>
                <th className="p-4">Pos</th>
                <th className="p-4">Equipo</th>
                <th className="p-4">Piloto</th>
                <th className="p-4">Moto</th>
                <th className="p-4 text-right">Puntos</th>
                {canShowActions && <th className="p-4 text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-855/60">
              {teams.map((team, idx) => {
                const isOwner =
                  team.user_email &&
                  team.user_email.toLowerCase() === user.email.toLowerCase();
                  
                const isCreatorTeam = 
                  team.user_email && 
                  championship.created_by && 
                  team.user_email.toLowerCase() === championship.created_by.toLowerCase();
                  
                const hasRaced = team.races_completed > 0;
                
                const canKick = canShowActions && !isOwner && !isCreatorTeam && !hasRaced;

                return (
                  <tr
                    key={team.id}
                    className={`transition-colors ${
                      isOwner ? 'bg-red-955/15 text-white font-semibold' : 'hover:bg-[#16161C]/30'
                    }`}
                  >
                    <td className="p-4 font-mono font-bold text-gray-500">#{idx + 1}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${team.is_kicked ? 'text-gray-500 line-through' : 'text-white'}`}>
                          {team.team_name}
                        </span>
                        {isOwner && (
                          <span className="px-1.5 py-0.5 bg-red-600/20 border border-red-500/20 rounded text-[9px] text-red-505 font-bold uppercase tracking-wider flex items-center gap-1">
                            <Shield className="w-2.5 h-2.5" />
                            Tú
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-400 block mt-0.5">
                        Mánager: {team.owner_name} {team.is_kicked && '(Expulsado)'}
                      </span>
                    </td>
                    <td className="p-4 text-gray-350">
                      {team.is_kicked ? <span className="text-gray-500 italic">N/A</span> : team.pilot_name}
                    </td>
                    <td className="p-4 text-gray-400">
                      {team.is_kicked ? (
                        <span className="text-gray-500 italic">N/A</span>
                      ) : (
                        team.motorcycle_name || 'GP Bike'
                      )}
                    </td>
                    <td className="p-4 text-right font-mono font-extrabold text-red-400 text-base">
                      {team.total_points || 0} pts
                    </td>
                    {canShowActions && (
                      <td className="p-4 text-right">
                        {canKick && !team.is_kicked && (
                          <button
                            onClick={() => onKick(team)}
                            className="px-2.5 py-1.5 bg-red-600/10 hover:bg-red-650 border border-red-500/20 hover:border-red-500 text-red-400 hover:text-white rounded-lg text-xs font-bold transition-all"
                          >
                            Expulsar
                          </button>
                        )}
                        {team.is_kicked && (
                          <span
                            className="text-[10px] text-gray-400 bg-gray-900 border border-gray-800 px-2 py-1 rounded select-none cursor-help font-mono font-bold"
                            title={`Motivo: ${team.kick_reason || 'No especificado'}`}
                          >
                            Expulsado
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StandingsTable;
