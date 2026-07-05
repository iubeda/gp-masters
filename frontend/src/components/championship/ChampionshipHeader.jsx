import React from 'react';
import { Lock, Clock } from 'lucide-react';

/**
 * Championship page header: title, season badge, private badge, and metadata row
 * (start date, creator, PIN for private championships, time restriction badge).
 */
const ChampionshipHeader = ({ championship, isCreator, userRole }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl font-extrabold text-white">{championship.name}</h1>
          <span className="px-3 py-1 bg-red-600/10 border border-red-500/20 text-red-500 text-xs font-bold rounded-full uppercase tracking-wider">
            Season {championship.season}
          </span>
          {championship.is_public === false && (
            <span className="px-2 py-1 bg-amber-600/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1 self-center">
              <Lock className="w-3.5 h-3.5" />
              Private
            </span>
          )}
          {/* Time restriction badge — visible to all users */}
          {championship.time_restricted ? (
            <span className="px-2 py-1 bg-blue-600/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1 self-center">
              <Clock className="w-3.5 h-3.5" />
              12h – 15h
            </span>
          ) : (
            <span className="px-2 py-1 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1 self-center">
              Sin límite horario
            </span>
          )}
        </div>
        <p className="text-gray-400 text-sm">
          Start Date: <strong className="text-gray-200">{championship.start_date.split('T')[0]}</strong> •{' '}
          Creator:{' '}
          <strong className="text-gray-250">
            {isCreator ? 'You (Creator)' : championship.creator_name || 'System'}
          </strong>
          {isCreator && !championship.is_public && (
            <>
              {' '}• Access PIN:{' '}
              <strong className="text-amber-500 font-mono select-all bg-amber-600/10 px-2 py-0.5 rounded border border-amber-500/20 text-xs font-bold tracking-wider">
                {championship.pin}
              </strong>
            </>
          )}
          {userRole === 'admin' && !isCreator && !championship.is_public && (
            <>
              {' '}• PIN (admin):{' '}
              <strong className="text-amber-500 font-mono select-all bg-amber-600/10 px-2 py-0.5 rounded border border-amber-500/20 text-xs font-bold tracking-wider">
                {championship.pin}
              </strong>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default ChampionshipHeader;
