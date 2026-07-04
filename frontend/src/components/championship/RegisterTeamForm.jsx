import React from 'react';
import { Shield, Lock } from 'lucide-react';

const RegisterTeamForm = ({ 
  onSubmit, 
  teamName, 
  setTeamName, 
  pin, 
  setPin, 
  registeringTeam, 
  championship 
}) => {
  return (
    <div className="glass rounded-2xl border border-gray-800 overflow-hidden shadow-xl animate-fadeIn">
      <div className="p-6 bg-gradient-to-r from-orange-600/10 to-transparent border-b border-gray-800">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-orange-500" />
          Register Your MotoGP Team
        </h2>
        <p className="text-xs text-gray-400 mt-1">Submit your team name and enter the championship grid</p>
      </div>

      <form onSubmit={onSubmit} className="p-6 space-y-6">
        <div className="space-y-4">
          {/* Team Name Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase text-gray-400">Team Name</label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. Red Bull Racing GP"
              className="w-full px-4 py-3 bg-[#0F0F12] border border-gray-800 rounded-xl focus:border-orange-500 focus:outline-none text-white text-sm"
              required
            />
          </div>

          {/* Access PIN Input (Visible only if Private Championship) */}
          {championship && !championship.is_public && (
            <div className="space-y-2 animate-fadeIn">
              <label className="text-xs font-semibold uppercase text-gray-400 flex items-center gap-1.5 text-amber-500">
                <Lock className="w-3.5 h-3.5" />
                Championship Access PIN
              </label>
              <input
                type="text"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter private championship PIN"
                className="w-full px-4 py-3 bg-[#0F0F12] border border-gray-800 rounded-xl focus:border-amber-500 focus:outline-none text-white text-sm font-mono tracking-widest"
                maxLength={8}
                required
              />
            </div>
          )}

          <div className="bg-[#0F0F12] border border-gray-850 p-4 rounded-xl space-y-2">
            <h4 className="text-xs font-bold text-orange-500 uppercase tracking-wider">System Assignments</h4>
            <p className="text-xs text-gray-400 leading-relaxed font-light font-sans">
              By registering in this championship, you will be automatically assigned a **random professional pilot** from the pool of unhired pilots.
              Additionally, your team will be randomly assigned a **factory motorcycle model** from the predefined catalog (Ducati GP24, KTM RC16, Yamaha M1, Aprilia RS-GP, Honda RC213V, etc.) with its specific stats.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={registeringTeam}
          className="w-full py-3.5 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {registeringTeam ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          ) : (
            'REGISTER TEAM'
          )}
        </button>
      </form>
    </div>
  );
};

export default RegisterTeamForm;
