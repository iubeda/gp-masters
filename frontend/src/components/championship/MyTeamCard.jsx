import React from 'react';
import { Shield, Coins } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Stat bar sub-component to avoid repetition inside MyTeamCard.
 */
const StatBar = ({ label, value }) => (
  <div>
    <div className="flex justify-between text-[11px] mb-0.5">
      <span className="text-gray-400">{label}</span>
      <span className="text-red-400 font-bold">{value}%</span>
    </div>
    <div className="h-1.5 w-full bg-gray-900 rounded-full overflow-hidden">
      <div style={{ width: `${value}%` }} className="h-full bg-red-600 rounded-full" />
    </div>
  </div>
);

/**
 * Card displaying the logged-in user's team details:
 * pilot stats (talent, consistency, aggressiveness, experience, fitness)
 * and motorcycle part ratings.
 */
const MyTeamCard = ({ userTeam }) => {
  const { t } = useTranslation();
  const motoParts = [
    { label: 'Motor', val: userTeam.engine },
    { label: 'Cambio', val: userTeam.gearbox },
    { label: 'Susp.', val: userTeam.suspension },
    { label: 'Chasis', val: userTeam.chassis },
    { label: 'Alerón', val: userTeam.wings },
  ];

  return (
    <div className="glass rounded-2xl border border-gray-800 overflow-hidden shadow-xl">
      {/* Card header */}
      <div className="p-5 bg-gradient-to-r from-red-600/10 via-transparent to-transparent border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Shield className="w-5 h-5 text-red-500" />
          <div>
            <h3 className="font-bold text-white text-base leading-tight">{userTeam.team_name}</h3>
            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-light">{t('championship.tabs.my_team', 'Mi escudería')}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 rounded-full text-xs font-bold text-yellow-500">
          <Coins className="w-3.5 h-3.5" />
          {userTeam.balance?.toLocaleString()} €
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Pilot */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Piloto</span>
            <span className="text-sm font-bold text-white">{userTeam.pilot_name}</span>
          </div>
          <div className="space-y-2 bg-[#0F0F12]/60 p-3 rounded-xl border border-gray-850">
            <StatBar label="Talento" value={userTeam.talent} />
            <StatBar label="Consistencia" value={userTeam.consistency} />
            <StatBar label="Agresividad" value={userTeam.aggressiveness} />
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-800/40 text-center mt-2">
              <div>
                <p className="text-[9px] text-gray-505 uppercase font-bold">Experiencia</p>
                <p className="text-xs font-semibold text-gray-300">{userTeam.experience}%</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-505 uppercase font-bold">Estado Físico</p>
                <p className="text-xs font-semibold text-gray-300">{userTeam.fitness}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Motorcycle */}
        <div className="space-y-3 pt-4 border-t border-gray-800/60">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Moto</span>
            <span className="text-sm font-bold text-white">{userTeam.motorcycle_name}</span>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {motoParts.map((part, i) => (
              <div key={i} className="bg-[#0F0F12]/60 border border-gray-850 p-2 rounded-xl text-center">
                <p className="text-[8px] text-gray-500 block uppercase tracking-tight">{part.label}</p>
                <p className="text-xs font-bold text-orange-400 mt-0.5">{part.val}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyTeamCard;
