import React from 'react';
import { Star, Zap, Shield } from 'lucide-react';

const RegisteredTeamsGrid = ({ teams, currentUser }) => {
  return (
    <div className="divide-y divide-gray-800/60">
      {teams.map((team, idx) => {
        const isOwner = team.user_email && team.user_email.toLowerCase() === currentUser.email.toLowerCase();
        
        return (
          <div 
            key={team.id} 
            className={`p-6 space-y-4 transition-colors ${
              isOwner ? 'bg-red-950/15 border-l-4 border-l-red-600' : 'hover:bg-[#16161C]/30'
            }`}
          >
            {/* Team Header Info Row */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm font-bold">#{idx + 1}</span>
                <h3 className="font-bold text-white text-lg">{team.team_name}</h3>
                {isOwner && (
                  <span className="px-2 py-0.5 bg-red-600/20 text-red-500 border border-red-500/20 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Yours
                  </span>
                )}
              </div>

              {/* Predefined Manager, Pilot, Motorcycle name displays */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400 font-light">
                <span>
                  Manager: <strong className="text-gray-200">{team.owner_name}</strong>
                  {team.user_email ? ` (${team.user_email})` : ''}
                </span>
                <span className="text-gray-700">•</span>
                <span>Pilot: <strong className="text-gray-200">{team.pilot_name}</strong></span>
                <span className="text-gray-700">•</span>
                <span>Bike: <strong className="text-gray-200">{team.motorcycle_name || 'GP Bike'}</strong></span>
              </div>
            </div>

            {/* Stats Section - Visible ONLY to the owner, hidden for rivals */}
            {isOwner && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#0F0F12]/60 p-4 rounded-xl border border-gray-850/80 animate-fadeIn">
                {/* Pilot Stats */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase text-red-500 tracking-wider flex items-center gap-1">
                    <Star className="w-3.5 h-3.5" />
                    Pilot Attributes
                  </h4>
                  <div className="space-y-2">
                    {/* Talent */}
                    <div>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-gray-400">Talent</span>
                        <span className="text-red-400 font-bold">{team.talent}</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-900 rounded-full overflow-hidden">
                        <div style={{ width: `${team.talent}%` }} className="h-full bg-red-600 rounded-full"></div>
                      </div>
                    </div>
                    {/* Consistency */}
                    <div>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-gray-400">Consistency</span>
                        <span className="text-red-400 font-bold">{team.consistency}</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-900 rounded-full overflow-hidden">
                        <div style={{ width: `${team.consistency}%` }} className="h-full bg-red-600 rounded-full"></div>
                      </div>
                    </div>
                    {/* Aggressiveness */}
                    <div>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-gray-400">Aggressiveness</span>
                        <span className="text-red-400 font-bold">{team.aggressiveness}</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-900 rounded-full overflow-hidden">
                        <div style={{ width: `${team.aggressiveness}%` }} className="h-full bg-red-600 rounded-full"></div>
                      </div>
                    </div>
                    {/* Experience & Fitness */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="bg-[#16161C] p-2 rounded border border-gray-800 text-center">
                        <p className="text-[10px] text-gray-500 font-bold uppercase">Experience</p>
                        <p className="text-xs font-semibold text-gray-255">{team.experience}%</p>
                      </div>
                      <div className="bg-[#16161C] p-2 rounded border border-gray-800 text-center">
                        <p className="text-[10px] text-gray-500 font-bold uppercase">Fitness</p>
                        <p className="text-xs font-semibold text-gray-255">{team.fitness}%</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Motorcycle Stats */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase text-orange-500 tracking-wider flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    Bike: <span className="text-white normal-case font-bold">{team.motorcycle_name || 'Predefined Model'}</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#16161C]/80 p-2.5 rounded-lg border border-gray-800 flex items-center justify-between">
                      <span className="text-xs text-gray-400">Engine</span>
                      <span className="text-sm font-bold text-orange-400">{team.engine}</span>
                    </div>
                    <div className="bg-[#16161C]/80 p-2.5 rounded-lg border border-gray-800 flex items-center justify-between">
                      <span className="text-xs text-gray-400">Gearbox</span>
                      <span className="text-sm font-bold text-orange-400">{team.gearbox}</span>
                    </div>
                    <div className="bg-[#16161C]/80 p-2.5 rounded-lg border border-gray-800 flex items-center justify-between">
                      <span className="text-xs text-gray-400">Suspension</span>
                      <span className="text-sm font-bold text-orange-400">{team.suspension}</span>
                    </div>
                    <div className="bg-[#16161C]/80 p-2.5 rounded-lg border border-gray-800 flex items-center justify-between">
                      <span className="text-xs text-gray-400">Chassis</span>
                      <span className="text-sm font-bold text-orange-400">{team.chassis}</span>
                    </div>
                    <div className="bg-[#16161C]/80 p-2.5 rounded-lg border border-gray-800 col-span-2 flex items-center justify-between">
                      <span className="text-xs text-gray-400">Aerodynamic Wings</span>
                      <span className="text-sm font-bold text-orange-400">{team.wings}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default RegisteredTeamsGrid;
