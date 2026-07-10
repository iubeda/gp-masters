import React from 'react';
import { CheckCircle2, CalendarDays } from 'lucide-react';

const CalendarList = ({ circuits, selectedCircuit, onSelectCircuit, todayStr }) => {
  if (!circuits || circuits.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 text-sm">
        No circuits added to the calendar yet.
      </div>
    );
  }

  const activeGpId = circuits.find(c => c.status === 'scheduled' || c.status === 'in_progress')?.id;

  return (
    <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
      {circuits.map((circ, idx) => {
        const isSelected = selectedCircuit && selectedCircuit.id === circ.id;
        const isCompleted = circ.status === 'completed';
        const isNextGp = circ.id === activeGpId;
        const hasStarted = todayStr >= circ.practice_date || circ.status === 'in_progress' || circ.bypass_restrictions;
        const isActive = isNextGp && hasStarted;

        return (
          <div 
            key={circ.id} 
            onClick={() => onSelectCircuit && onSelectCircuit(circ)}
            className={`cursor-pointer transition-all border p-4 rounded-xl space-y-4 relative group overflow-hidden animate-fadeIn ${
              isSelected 
                ? 'bg-yellow-600/10 border-yellow-500 shadow-md ring-1 ring-yellow-500' 
                : 'bg-[#0F0F12]/80 border-gray-800/80 hover:border-gray-700'
            }`}
          >
            {/* Race Order Number & Description */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-sm shrink-0 border ${
                  isSelected 
                    ? 'bg-yellow-500 text-black border-yellow-400' 
                    : 'bg-yellow-600/10 border-yellow-500/20 text-yellow-500'
                }`}>
                  R{idx + 1}
                </div>

                <div className="space-y-0.5">
                  <h4 className={`font-bold text-sm transition-colors ${
                    isSelected ? 'text-yellow-400' : 'text-white group-hover:text-yellow-400'
                  }`}>
                    {circ.name}
                  </h4>
                  {/* Distance and curves in one single line */}
                  <p className="text-[10px] text-gray-400 font-light uppercase tracking-wider">
                    Distance: <strong className="text-white font-semibold">{circ.distance}m</strong> • Curves R: <strong className="text-white font-semibold">{circ.curves_right}</strong> • Curves L: <strong className="text-white font-semibold">{circ.curves_left}</strong>
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="shrink-0">
                {isCompleted ? (
                  <span className="px-2 py-0.5 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    Realizada
                  </span>
                ) : isActive ? (
                  <span className="px-2 py-0.5 bg-blue-600/10 border border-blue-500/20 text-blue-400 text-[9px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    En curso
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-gray-800/60 border border-gray-700/60 text-gray-400 text-[9px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
                    <CalendarDays className="w-3 h-3 text-gray-500" />
                    Programada
                  </span>
                )}
              </div>
            </div>

            {/* Dynamic Dates Grid */}
            <div className="border-t border-gray-800/50 pt-2 grid grid-cols-3 gap-1 text-[10px] text-center">
              <div className="bg-[#16161C]/50 p-1.5 rounded border border-gray-850">
                <p className="text-gray-500 font-bold uppercase tracking-wider">Day 1: Prac</p>
                <p className="text-gray-300 font-medium">{circ.practice_date}</p>
              </div>
              <div className="bg-[#16161C]/50 p-1.5 rounded border border-gray-850">
                <p className="text-gray-500 font-bold uppercase tracking-wider">Day 2: Qual</p>
                <p className="text-gray-300 font-medium">{circ.qualifying_date}</p>
              </div>
              <div className="bg-[#16161C]/50 p-1.5 rounded border border-gray-850">
                <p className="text-gray-500 font-bold uppercase tracking-wider">Day 3: Race</p>
                <p className="text-gray-300 font-bold text-red-400">{circ.race_date}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CalendarList;
